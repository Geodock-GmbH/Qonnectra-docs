"""Importiert einen JSON-Export des echten "Testprojekt" von app.geodock.de
1:1 in die lokale Qonnectra-Instanz, für authentische Handbuch-Screenshots.

Der Export wird über die Qonnectra-API (mit einer eingeloggten Session)
erzeugt (siehe scripts/qonnectra-demo-data/README.md) und liegt als eine
JSON-Datei vor, die pro Ressourcenname (z.B. "trench", "node", "fiber") die
vollständige, unpaginierte Liste der API-Objekte enthält.

Referenzdaten (Firmen, Rohr-/Kabeltypen, Kennzeichen, ...) werden per
Namensabgleich mit den lokal bereits vorhandenen Einträgen zusammengeführt
(get_or_create) - Objekte mit UUID-Primärschlüssel (Trasse, Rohr, Knoten,
Adresse, Kabel, Faser, Mikrorohr, ...) werden mit der ORIGINALEN UUID aus
der Produktion angelegt, damit Beziehungen zwischen den Objekten ohne
zusätzliches ID-Mapping funktionieren.

Bewusst nicht importiert (nicht Teil des aktuellen Handbuch-Umfangs):
Container/ContainerType, FiberSplice, NodeStructure und die
Patch-Panel/Slot-Modelle (node-structure, node-slot-*), Pipeline-Anfragen,
Wertermittlung.
"""

import json
from datetime import date, datetime

from django.contrib.gis.geos import LineString, Point, Polygon
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.api.models import (
    Address,
    Area,
    AttributesAreaType,
    AttributesCableType,
    AttributesCompany,
    AttributesConduitType,
    AttributesConstructionType,
    AttributesFiberStatus,
    AttributesMicroductStatus,
    AttributesNetworkLevel,
    AttributesNodeType,
    AttributesPhase,
    AttributesResidentialUnitStatus,
    AttributesResidentialUnitType,
    AttributesStatus,
    AttributesStatusDevelopment,
    AttributesSurface,
    Cable,
    CableLabel,
    Conduit,
    Fiber,
    Flags,
    Microduct,
    MicroductCableConnection,
    MicroductConnection,
    NetworkSchemaSettings,
    Node,
    Projects,
    ResidentialUnit,
    Trench,
    TrenchConduitConnection,
)

PROJECT_NAME = "Testprojekt"

# NetworkSchemaSettings.excluded_node_types hat keinen API-Endpunkt und war
# daher aus dem Export nicht ermittelbar. Durch Abgleich des Netzschemas auf
# app.geodock.de (nur NVt/FCC/Schacht/POP sichtbar) mit den lokal
# importierten Knotentypen manuell rekonstruiert: Hausanschluss (zu viele
# fuers Netzschema, werden ueber die Kindansicht aufgerufen), Rohrabzweig
# (reiner Trassen-Verzweigungspunkt) und Bauerschwernis (Hindernis-Marker,
# kein echter Netzknoten) sind dort ausgeblendet.
NETWORK_SCHEMA_EXCLUDED_NODE_TYPES = ["Hausanschluss", "Rohrabzweig", "Bauerschwernis"]


def dedupe_by_uuid(rows):
    """Entfernt Duplikate (z.B. durch instabile Seitenumbrueche beim Export)."""
    seen = set()
    out = []
    for row in rows:
        if row["uuid"] in seen:
            continue
        seen.add(row["uuid"])
        out.append(row)
    return out


def uuid_of(value):
    """UUID eines verschachtelten Objekt-Verweises (dict mit 'uuid' oder
    GeoJSON-Feature mit 'id'), einer rohen UUID-Zeichenkette, oder None."""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return value.get("uuid") or value.get("id")
    raise TypeError(f"Unerwarteter Referenztyp: {value!r}")


def parse_date(value):
    if not value:
        return None
    return date.fromisoformat(value[:10])


def linestring(geo):
    return LineString([tuple(c) for c in geo["coordinates"]], srid=25832)


def point(geo):
    return Point(tuple(geo["coordinates"]), srid=25832)


def polygon(geo):
    rings = [[tuple(c) for c in ring] for ring in geo["coordinates"]]
    return Polygon(*rings, srid=25832)


class Command(BaseCommand):
    help = (
        "Importiert einen JSON-Export des echten 'Testprojekt' von "
        "app.geodock.de in die lokale Instanz (siehe --file)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            required=True,
            help="Pfad zur JSON-Exportdatei (innerhalb des Backend-Containers).",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Vorhandenes lokales Projekt 'Testprojekt' vorher loeschen und neu importieren.",
        )

    def handle(self, *args, **options):
        try:
            with open(options["file"], encoding="utf-8") as fh:
                data = json.load(fh)
        except FileNotFoundError as exc:
            raise CommandError(f"Datei nicht gefunden: {options['file']}") from exc

        existing = Projects.objects.filter(project=PROJECT_NAME).first()
        if existing:
            if not options["force"]:
                self.stdout.write(
                    self.style.WARNING(
                        f'Projekt "{PROJECT_NAME}" existiert bereits lokal, '
                        "ueberspringe (--force zum Neuimportieren)."
                    )
                )
                return
            self._cleanup(existing)

        with transaction.atomic():
            self._import(data)

        self.stdout.write(
            self.style.SUCCESS(f'Projekt "{PROJECT_NAME}" wurde importiert.')
        )

    def _cleanup(self, project):
        Fiber.objects.filter(project=project).delete()
        MicroductCableConnection.objects.filter(uuid_cable__project=project).delete()
        CableLabel.objects.filter(cable__project=project).delete()
        Cable.objects.filter(project=project).delete()
        MicroductConnection.objects.filter(uuid_node__project=project).delete()
        Microduct.objects.filter(uuid_conduit__project=project).delete()
        TrenchConduitConnection.objects.filter(uuid_conduit__project=project).delete()
        Conduit.objects.filter(project=project).delete()
        Node.objects.filter(project=project).delete()
        ResidentialUnit.objects.filter(uuid_address__project=project).delete()
        Address.objects.filter(project=project).delete()
        Area.objects.filter(project=project).delete()
        Trench.objects.filter(project=project).delete()
        project.delete()

    def _attr_map(self, rows, model, key_field, extra_fields=()):
        """Baut {alte_id: lokale_instanz} per get_or_create auf Namensbasis."""
        result = {}
        for row in rows:
            name = row[key_field]
            defaults = {f: row[f] for f in extra_fields if f in row}
            obj, _ = model.objects.get_or_create(
                **{key_field: name}, defaults=defaults
            )
            result[row["id"]] = obj
        return result

    def _import(self, data):
        for key in (
            "trench", "conduit", "trench_conduit_connection", "microduct",
            "microduct_connection", "microduct_cable_connection", "node",
            "address", "residential-unit", "cable", "cable_label", "fiber", "area",
        ):
            data[key] = dedupe_by_uuid(data[key])

        flags = self._attr_map(data["flags"], Flags, "flag")
        surfaces = self._attr_map(data["attributes_surface"], AttributesSurface, "surface", ["sealing"])
        construction_types = self._attr_map(
            data["attributes_construction_type"], AttributesConstructionType, "construction_type"
        )
        statuses = self._attr_map(data["attributes_status"], AttributesStatus, "status")
        # AttributesPhase hat keinen eigenen API-Endpunkt - Werte kommen nur
        # eingebettet in trench-Zeilen vor, daher hier direkt daraus ableiten.
        phase_rows = {
            row["phase"]["id"]: row["phase"] for row in data["trench"] if row["phase"]
        }
        phases = self._attr_map(list(phase_rows.values()), AttributesPhase, "phase")
        companies = self._attr_map(
            data["attributes_company"],
            AttributesCompany,
            "company",
            ["city", "postal_code", "street", "housenumber", "phone", "email"],
        )
        conduit_types = self._attr_map(
            data["attributes_conduit_type"],
            AttributesConduitType,
            "conduit_type",
            ["conduit_count", "conduit_type_alias", "conduit_type_microduct", "manufacturer"],
        )
        node_types = self._attr_map(
            data["attributes_node_type"],
            AttributesNodeType,
            "node_type",
            ["dimension", "group", "company"],
        )
        network_levels = self._attr_map(
            data["attributes_network_level"], AttributesNetworkLevel, "network_level"
        )
        cable_types = self._attr_map(
            data["attributes_cable_type"],
            AttributesCableType,
            "cable_type",
            ["fiber_count", "bundle_count", "bundle_fiber_count", "manufacturer"],
        )
        status_developments = self._attr_map(
            data["attributes_status_development"], AttributesStatusDevelopment, "status"
        )
        ru_types = self._attr_map(
            data["attributes_residential_unit_type"],
            AttributesResidentialUnitType,
            "residential_unit_type",
        )
        ru_statuses = self._attr_map(
            data["attributes_residential_unit_status"], AttributesResidentialUnitStatus, "status"
        )
        area_types = self._attr_map(data["attributes_area_type"], AttributesAreaType, "area_type")
        microduct_statuses = self._attr_map(
            data["attributes_microduct_status"], AttributesMicroductStatus, "microduct_status"
        )
        fiber_statuses = self._attr_map(
            data["attributes_fiber_status"], AttributesFiberStatus, "fiber_status"
        )

        def attr(map_, value):
            return map_.get(value["id"]) if value else None

        project = Projects.objects.create(
            project=PROJECT_NAME,
            description="1:1-Import des Testprojekts von app.geodock.de.",
            active=True,
        )

        # --- Trassen -----------------------------------------------------
        trenches = []
        for row in data["trench"]:
            trenches.append(
                Trench(
                    uuid=row["uuid"],
                    id_trench=row["id_trench"][:10],
                    surface=attr(surfaces, row["surface"]),
                    construction_type=attr(construction_types, row["construction_type"]),
                    construction_depth=row["construction_depth"],
                    construction_details=row["construction_details"],
                    status=attr(statuses, row["status"]),
                    phase=attr(phases, row["phase"]),
                    internal_execution=row["internal_execution"],
                    funding_status=row["funding_status"],
                    owner=attr(companies, row["owner"]),
                    constructor=attr(companies, row["constructor"]),
                    date=parse_date(row["date"]),
                    comment=row["comment"],
                    house_connection=row["house_connection"],
                    length=row["length"],
                    geom=linestring(row["geometry"]),
                    project=project,
                    flag=attr(flags, row["flag"]),
                )
            )
        Trench.objects.bulk_create(trenches, batch_size=200)
        self.stdout.write(f"  Trassen: {len(trenches)}")

        # --- Adressen + Wohneinheiten --------------------------------------
        addresses = []
        for row in data["address"]:
            addresses.append(
                Address(
                    uuid=row["uuid"],
                    zip_code=row["zip_code"],
                    city=row["city"],
                    district=row["district"],
                    street=row["street"],
                    housenumber=row["housenumber"],
                    house_number_suffix=row["house_number_suffix"],
                    status_development=attr(status_developments, row["status_development"]),
                    geom=point(row["geometry"]),
                    flag=attr(flags, row["flag"]),
                    project=project,
                )
            )
        Address.objects.bulk_create(addresses, batch_size=200)
        self.stdout.write(f"  Adressen: {len(addresses)}")

        residential_units = []
        for row in data["residential-unit"]:
            residential_units.append(
                ResidentialUnit(
                    uuid=row["uuid"],
                    uuid_address_id=uuid_of(row["uuid_address"]),
                    residential_unit_type=attr(ru_types, row["residential_unit_type"]),
                    floor=row["floor"],
                    side=row["side"],
                    building_section=row["building_section"],
                    status=attr(ru_statuses, row["status"]),
                    external_id_1=row["external_id_1"],
                    external_id_2=row["external_id_2"],
                    resident_name=row["resident_name"],
                    resident_recorded_date=parse_date(row["resident_recorded_date"]),
                    ready_for_service=parse_date(row["ready_for_service"]),
                )
            )
        ResidentialUnit.objects.bulk_create(residential_units, batch_size=200)
        self.stdout.write(f"  Wohneinheiten: {len(residential_units)}")

        # --- Netzknoten (zwei Durchgaenge wegen parent_node-Selbstbezug) ---
        nodes = []
        for row in data["node"]:
            nodes.append(
                Node(
                    uuid=row["uuid"],
                    name=row["name"],
                    node_type=attr(node_types, row["node_type"]),
                    uuid_address_id=uuid_of(row["uuid_address"]),
                    status=attr(statuses, row["status"]),
                    network_level=attr(network_levels, row["network_level"]),
                    owner=attr(companies, row["owner"]),
                    constructor=attr(companies, row["constructor"]),
                    manufacturer=attr(companies, row["manufacturer"]),
                    warranty=parse_date(row["warranty"]),
                    date=parse_date(row["date"]),
                    geom=point(row["geometry"]),
                    canvas_x=row["canvas_x"],
                    canvas_y=row["canvas_y"],
                    child_canvas_x=row["child_canvas_x"],
                    child_canvas_y=row["child_canvas_y"],
                    flag=attr(flags, row["flag"]),
                    project=project,
                )
            )
        Node.objects.bulk_create(nodes, batch_size=200)
        parent_updates = []
        for row in data["node"]:
            parent_uuid = uuid_of(row["parent_node"])
            if parent_uuid:
                parent_updates.append(Node(uuid=row["uuid"], parent_node_id=parent_uuid))
        if parent_updates:
            Node.objects.bulk_update(parent_updates, ["parent_node"], batch_size=200)
        self.stdout.write(f"  Netzknoten: {len(nodes)}")

        # --- Rohre + Rohrzuordnung -----------------------------------------
        conduits = []
        for row in data["conduit"]:
            conduits.append(
                Conduit(
                    uuid=row["uuid"],
                    name=row["name"],
                    conduit_type=attr(conduit_types, row["conduit_type"]),
                    outer_conduit=row["outer_conduit"],
                    status=attr(statuses, row["status"]),
                    network_level=attr(network_levels, row["network_level"]),
                    owner=attr(companies, row["owner"]),
                    constructor=attr(companies, row["constructor"]),
                    manufacturer=attr(companies, row["manufacturer"]),
                    date=parse_date(row["date"]),
                    project=project,
                    flag=attr(flags, row["flag"]),
                )
            )
        Conduit.objects.bulk_create(conduits, batch_size=200)
        self.stdout.write(f"  Rohre: {len(conduits)}")

        connections = [
            TrenchConduitConnection(
                uuid=row["uuid"],
                uuid_trench_id=row["uuid_trench"],
                uuid_conduit_id=row["uuid_conduit"],
            )
            for row in data["trench_conduit_connection"]
        ]
        TrenchConduitConnection.objects.bulk_create(connections, batch_size=200)
        self.stdout.write(f"  Rohrzuordnungen: {len(connections)}")

        # --- Mikrorohre + -verbindungen -------------------------------------
        microducts = []
        for row in data["microduct"]:
            microducts.append(
                Microduct(
                    uuid=row["uuid"],
                    uuid_conduit_id=uuid_of(row["uuid_conduit"]),
                    number=row["number"],
                    color=row["color"],
                    microduct_status=attr(microduct_statuses, row["microduct_status"]),
                    uuid_node_id=uuid_of(row["uuid_node"]),
                )
            )
        Microduct.objects.bulk_create(microducts, batch_size=200)
        self.stdout.write(f"  Mikrorohre: {len(microducts)}")

        microduct_connections = []
        for row in data["microduct_connection"]:
            microduct_connections.append(
                MicroductConnection(
                    uuid=row["uuid"],
                    uuid_microduct_from_id=uuid_of(row["uuid_microduct_from"]),
                    uuid_trench_from_id=uuid_of(row["uuid_trench_from"]),
                    uuid_microduct_to_id=uuid_of(row["uuid_microduct_to"]),
                    uuid_trench_to_id=uuid_of(row["uuid_trench_to"]),
                    uuid_node_id=uuid_of(row["uuid_node"]),
                )
            )
        MicroductConnection.objects.bulk_create(microduct_connections, batch_size=200)
        self.stdout.write(f"  Mikrorohr-Verbindungen: {len(microduct_connections)}")

        # --- Kabel + Beschriftungen + Mikrorohr-Kabel-Verbindungen ----------
        cables = []
        for row in data["cable"]:
            cables.append(
                Cable(
                    uuid=row["uuid"],
                    name=row["name"],
                    cable_type=attr(cable_types, row["cable_type"]),
                    status=attr(statuses, row["status"]),
                    network_level=attr(network_levels, row["network_level"]),
                    owner=attr(companies, row["owner"]),
                    constructor=attr(companies, row["constructor"]),
                    manufacturer=attr(companies, row["manufacturer"]),
                    date=parse_date(row["date"]),
                    uuid_node_start_id=uuid_of(row["uuid_node_start"]),
                    uuid_node_end_id=uuid_of(row["uuid_node_end"]),
                    parent_node_context_id=uuid_of(row["parent_node_context"]),
                    length=row["length"],
                    length_total=row["length_total"],
                    reserve_at_start=row["reserve_at_start"],
                    reserve_at_end=row["reserve_at_end"],
                    reserve_section=row["reserve_section"],
                    handle_start=row["handle_start"],
                    handle_end=row["handle_end"],
                    diagram_path=row["diagram_path"],
                    project=project,
                    flag=attr(flags, row["flag"]),
                )
            )
        Cable.objects.bulk_create(cables, batch_size=200)
        self.stdout.write(f"  Kabel: {len(cables)}")

        cable_labels = [
            CableLabel(
                uuid=row["uuid"],
                cable_id=uuid_of(row["cable"]),
                text=row["text"],
                position_x=row["position_x"],
                position_y=row["position_y"],
                order=row["order"],
            )
            for row in data["cable_label"]
        ]
        CableLabel.objects.bulk_create(cable_labels, batch_size=200)
        self.stdout.write(f"  Kabel-Beschriftungen: {len(cable_labels)}")

        microduct_cable_connections = [
            MicroductCableConnection(
                uuid=row["uuid"],
                uuid_microduct_id=uuid_of(row["uuid_microduct"]),
                uuid_cable_id=uuid_of(row["uuid_cable"]),
            )
            for row in data["microduct_cable_connection"]
        ]
        MicroductCableConnection.objects.bulk_create(
            microduct_cable_connections, batch_size=200
        )
        self.stdout.write(
            f"  Mikrorohr-Kabel-Verbindungen: {len(microduct_cable_connections)}"
        )

        # --- Fasern ----------------------------------------------------------
        fibers = []
        for row in data["fiber"]:
            fibers.append(
                Fiber(
                    uuid=row["uuid"],
                    uuid_cable_id=row["uuid_cable"],
                    bundle_number=row["bundle_number"],
                    bundle_color=row["bundle_color"],
                    fiber_number_absolute=row["fiber_number_absolute"],
                    fiber_number_in_bundle=row["fiber_number_in_bundle"],
                    fiber_color=row["fiber_color"],
                    fiber_status=attr(fiber_statuses, row["fiber_status"]),
                    active=row["active"],
                    layer=row["layer"],
                    flag=flags[row["flag"]],
                    project=project,
                )
            )
        Fiber.objects.bulk_create(fibers, batch_size=500)
        self.stdout.write(f"  Fasern: {len(fibers)}")

        # --- Gebiete -----------------------------------------------------------
        areas = [
            Area(
                uuid=row["uuid"],
                area_type=attr(area_types, row["area_type"]),
                name=row["name"],
                geom=polygon(row["geometry"]),
                project=project,
                flag=attr(flags, row["flag"]),
            )
            for row in data["area"]
        ]
        Area.objects.bulk_create(areas, batch_size=200)
        self.stdout.write(f"  Gebiete: {len(areas)}")

        # --- Netzschema-Einstellungen (siehe Kommentar oben) ----------------
        schema_settings = NetworkSchemaSettings.objects.create(project=project)
        excluded_types = AttributesNodeType.objects.filter(
            node_type__in=NETWORK_SCHEMA_EXCLUDED_NODE_TYPES
        )
        schema_settings.excluded_node_types.set(excluded_types)
        self.stdout.write(
            "  Netzschema-Ausschlüsse: "
            + ", ".join(sorted(t.node_type for t in excluded_types))
        )
