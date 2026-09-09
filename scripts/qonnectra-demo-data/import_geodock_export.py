"""Imports a JSON export of the real "Testprojekt" from app.geodock.de 1:1
into the local Qonnectra instance, for authentic manual screenshots.

The export is produced through the Qonnectra API (with a logged-in session,
see scripts/qonnectra-demo-data/README.md) and comes as a single JSON file
holding, per resource name (e.g. "trench", "node", "fiber"), the complete,
unpaginated list of API objects.

Reference data (companies, conduit/cable types, flags, ...) is merged with the
entries already present locally by matching names (get_or_create) - objects
with a UUID primary key (trench, conduit, node, address, cable, fiber,
microduct, ...) are created with the ORIGINAL UUID from production, so that
relations between the objects work without an additional ID mapping.

Not imported, because the export account may not read the endpoints
(HTTP 403, see EXPECTED_FORBIDDEN in fetch_geodock_export.py):
WMSSource/WMSLayer (the layer list comes through, its source does not, and
without the URL of the WMS server the layers are useless), NodeSlotDivider,
NodeSlotClipNumber and NodeTrenchSelection.

Attachments (FeatureFiles) are imported as metadata: file name, type and the
path on api.geodock.de. The files themselves stay there - they are real
documents of a real installation and have no place in this repository.
"""

import json
from datetime import date, datetime

from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import LineString, Point, Polygon
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.api.models import (
    Address,
    Area,
    AttributesAreaType,
    AttributesComponentStructure,
    AttributesComponentType,
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
    Container,
    ContainerType,
    FeatureFiles,
    Fiber,
    FiberSplice,
    Flags,
    Microduct,
    MicroductCableConnection,
    MicroductConnection,
    NetworkSchemaSettings,
    Node,
    NodeSlotConfiguration,
    NodeStructure,
    PipelineInquiryArea,
    PipelineRecord,
    Projects,
    RequestReason,
    ResidentialUnit,
    Trench,
    TrenchConduitConnection,
    TypeOfWork,
    ValuationCostRate,
)

PROJECT_NAME = "Testprojekt"

# The primary key the project gets locally, pinned deliberately: the Playwright
# setup writes the cookie selected-project=2 (playwright/auth.setup.ts) and the
# manual's URLs contain the id. Without pinning, a re-import with --force would
# hand out the next free id after the delete - the project would still be there
# and every capture run would nevertheless land in "Default".
# 2 is the value a fresh instance produces anyway: "Default" is created first
# during setup and takes 1.
PROJECT_ID = 2

# NetworkSchemaSettings.excluded_node_types has no API endpoint and could
# therefore not be derived from the export. Reconstructed manually by comparing
# the network schema on app.geodock.de (only NVt/FCC/Schacht/POP visible) with
# the locally imported node types: Hausanschluss (too many for the network
# schema, they are reached through the child view), Rohrabzweig (a pure trench
# branching point) and Bauerschwernis (obstacle marker, not a real node) are
# hidden there.
NETWORK_SCHEMA_EXCLUDED_NODE_TYPES = ["Hausanschluss", "Rohrabzweig", "Bauerschwernis"]


def dedupe_by_uuid(rows):
    """Removes duplicates (e.g. from unstable page breaks during the export)."""
    seen = set()
    out = []
    for row in rows:
        if row["uuid"] in seen:
            continue
        seen.add(row["uuid"])
        out.append(row)
    return out


def uuid_of(value):
    """UUID of a nested object reference (dict with 'uuid' or GeoJSON feature
    with 'id'), of a raw UUID string, or None."""
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
        "Imports a JSON export of the real 'Testprojekt' from "
        "app.geodock.de into the local instance (see --file)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            required=True,
            help="Path to the JSON export file (inside the backend container).",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Delete an existing local project 'Testprojekt' first and import it again.",
        )

    def handle(self, *args, **options):
        try:
            with open(options["file"], encoding="utf-8") as fh:
                data = json.load(fh)
        except FileNotFoundError as exc:
            raise CommandError(f"File not found: {options['file']}") from exc

        existing = Projects.objects.filter(project=PROJECT_NAME).first()
        if existing:
            if not options["force"]:
                self.stdout.write(
                    self.style.WARNING(
                        f'Project "{PROJECT_NAME}" already exists locally, '
                        "skipping (--force to import it again)."
                    )
                )
                return
            self._cleanup(existing)

        with transaction.atomic():
            self._import(data)

        self.stdout.write(
            self.style.SUCCESS(f'Project "{PROJECT_NAME}" has been imported.')
        )

    def _cleanup(self, project):
        # Attachments hang off their object through a generic foreign key and
        # know no project, so they are collected over the objects themselves.
        for model in (Trench, Conduit, Node, Address, Area, Cable):
            content_type = ContentType.objects.get_for_model(model)
            FeatureFiles.objects.filter(
                content_type=content_type,
                object_id__in=model.objects.filter(project=project).values("uuid"),
            ).delete()
        FeatureFiles.objects.filter(
            content_type=ContentType.objects.get_for_model(Microduct),
            object_id__in=Microduct.objects.filter(
                uuid_conduit__project=project
            ).values("uuid"),
        ).delete()
        PipelineRecord.objects.filter(project=project).delete()
        ValuationCostRate.objects.filter(project=project).delete()
        FiberSplice.objects.filter(node_structure__uuid_node__project=project).delete()
        NodeStructure.objects.filter(uuid_node__project=project).delete()
        NodeSlotConfiguration.objects.filter(uuid_node__project=project).delete()
        Container.objects.filter(uuid_node__project=project).delete()
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
        """Builds {old_id: local_instance} via get_or_create, matching on name."""
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
            "container", "node-slot-configuration", "node-structure",
            "fiber-splice", "feature-files", "pipeline-records",
        ):
            data[key] = dedupe_by_uuid(data[key])

        flags = self._attr_map(data["flags"], Flags, "flag")
        surfaces = self._attr_map(data["attributes_surface"], AttributesSurface, "surface", ["sealing"])
        construction_types = self._attr_map(
            data["attributes_construction_type"], AttributesConstructionType, "construction_type"
        )
        statuses = self._attr_map(data["attributes_status"], AttributesStatus, "status")
        # AttributesPhase has no API endpoint of its own - values only appear
        # embedded in trench rows, so they are derived from those directly here.
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

        occupant = (
            Projects.objects.filter(pk=PROJECT_ID)
            .exclude(project=PROJECT_NAME)
            .first()
        )
        if occupant:
            raise CommandError(
                f'Id {PROJECT_ID} is taken by the project "{occupant.project}". '
                "The import pins the id because the Playwright setup relies on it "
                "(see PROJECT_ID)."
            )
        project = Projects.objects.create(
            pk=PROJECT_ID,
            project=PROJECT_NAME,
            description="1:1-Import des Testprojekts von app.geodock.de.",
            active=True,
        )

        # --- Trenches ----------------------------------------------------
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
        self.stdout.write(f"  Trenches: {len(trenches)}")

        # --- Addresses + residential units ---------------------------------
        addresses = []
        for row in data["address"]:
            addresses.append(
                Address(
                    uuid=row["uuid"],
                    # Taken over deliberately: a database trigger generates
                    # id_address whenever it comes in as NULL, so every
                    # re-import would hand out new address IDs. The manual
                    # shows them in screenshots, and the specs of chapters 7
                    # and 16 search for them.
                    id_address=row["id_address"],
                    id_address_2=row["id_address_2"],
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
        self.stdout.write(f"  Addresses: {len(addresses)}")

        residential_units = []
        for row in data["residential-unit"]:
            residential_units.append(
                ResidentialUnit(
                    uuid=row["uuid"],
                    # Same as for id_address above.
                    id_residential_unit=row["id_residential_unit"],
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
        self.stdout.write(f"  Residential units: {len(residential_units)}")

        # --- Nodes (two passes because of the parent_node self-reference) --
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
        self.stdout.write(f"  Nodes: {len(nodes)}")

        # --- Conduits + conduit assignment ---------------------------------
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
        self.stdout.write(f"  Conduits: {len(conduits)}")

        connections = [
            TrenchConduitConnection(
                uuid=row["uuid"],
                uuid_trench_id=row["uuid_trench"],
                uuid_conduit_id=row["uuid_conduit"],
            )
            for row in data["trench_conduit_connection"]
        ]
        TrenchConduitConnection.objects.bulk_create(connections, batch_size=200)
        self.stdout.write(f"  Conduit assignments: {len(connections)}")

        # --- Microducts + microduct connections ------------------------------
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
        self.stdout.write(f"  Microducts: {len(microducts)}")

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
        self.stdout.write(f"  Microduct connections: {len(microduct_connections)}")

        # --- Cables + labels + microduct cable connections -----------------
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
        self.stdout.write(f"  Cables: {len(cables)}")

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
        self.stdout.write(f"  Cable labels: {len(cable_labels)}")

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
            f"  Microduct cable connections: {len(microduct_cable_connections)}"
        )

        # --- Fibers ----------------------------------------------------------
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
        self.stdout.write(f"  Fibers: {len(fibers)}")

        # --- Areas -------------------------------------------------------------
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
        self.stdout.write(f"  Areas: {len(areas)}")

        # --- Containers and slot configuration ------------------------------
        # The patch panel modelling of a node: a container (rack, cabinet,
        # HAK) holds slot configurations ("sides"), and a NodeStructure sits in
        # a slot range of one of them. FiberSplice hangs off that structure,
        # which is why nothing below works without this block.
        container_types = {}
        for row in data["container-type"]:
            obj, _ = ContainerType.objects.get_or_create(
                name=row["name"],
                defaults={
                    "description": row["description"],
                    "icon": row["icon"],
                    "color": row["color"],
                    "display_order": row["display_order"],
                    "is_active": row["is_active"],
                },
            )
            container_types[row["id"]] = obj

        containers = []
        for row in data["container"]:
            containers.append(
                Container(
                    uuid=row["uuid"],
                    # The container serializer does not expose its node; the
                    # relation comes from the query the export was fetched
                    # with (see _fetched_with in fetch_geodock_export.py).
                    uuid_node_id=row["_fetched_with"]["node"],
                    container_type=container_types[row["container_type"]["id"]],
                    parent_container_id=uuid_of(row["parent_container"]),
                    name=row["name"],
                    sort_order=row["sort_order"],
                    is_expanded=row["is_expanded"],
                )
            )
        Container.objects.bulk_create(containers, batch_size=200)
        self.stdout.write(f"  Containers: {len(containers)}")

        slot_configurations = []
        for row in data["node-slot-configuration"]:
            slot_configurations.append(
                NodeSlotConfiguration(
                    uuid=row["uuid"],
                    uuid_node_id=uuid_of(row["uuid_node"]),
                    container_id=uuid_of(row["container"]),
                    side=row["side"],
                    total_slots=row["total_slots"],
                    sort_order=row["sort_order"],
                )
            )
        NodeSlotConfiguration.objects.bulk_create(slot_configurations, batch_size=200)
        self.stdout.write(f"  Slot configurations: {len(slot_configurations)}")

        # --- Component types and their port structure -----------------------
        component_types = {}
        for row in data["attributes_component_type"]:
            obj, _ = AttributesComponentType.objects.get_or_create(
                component_type=row["component_type"],
                defaults={
                    "occupied_slots": row["occupied_slots"],
                    "manufacturer": attr(companies, row["manufacturer"]),
                },
            )
            component_types[row["id"]] = obj

        # AttributesComponentStructure has an integer primary key and no name
        # of its own; the natural key is (component type, direction, port).
        component_structures = {}
        for row in data["attributes_component_structure"]:
            component_type = component_types.get(row["component_type"])
            if component_type is None:
                continue
            obj, _ = AttributesComponentStructure.objects.get_or_create(
                component_type=component_type,
                in_or_out=row["in_or_out"],
                port=row["port"],
                defaults={"port_alias": row["port_alias"]},
            )
            component_structures[row["id"]] = obj
        self.stdout.write(
            f"  Component types: {len(component_types)}, "
            f"port structures: {len(component_structures)}"
        )

        node_structures = []
        for row in data["node-structure"]:
            node_structures.append(
                NodeStructure(
                    uuid=row["uuid"],
                    uuid_node_id=uuid_of(row["uuid_node"]),
                    slot_configuration_id=uuid_of(row["slot_configuration"]),
                    component_type=component_types[row["component_type"]["id"]],
                    component_structure=(
                        component_structures.get(row["component_structure"]["id"])
                        if row["component_structure"]
                        else None
                    ),
                    slot_start=row["slot_start"],
                    slot_end=row["slot_end"],
                    clip_number=row["clip_number"],
                    purpose=row["purpose"],
                    label=row["label"],
                )
            )
        NodeStructure.objects.bulk_create(node_structures, batch_size=200)
        self.stdout.write(f"  Node structures: {len(node_structures)}")

        # --- Fiber splices --------------------------------------------------
        # The piece that was missing until now: without them every fiber trace
        # ends at the cable, the fault simulation reports "no affected
        # addresses" and the section "Faserverbindungen" of the post
        # compaction PDF stays empty.
        splices = []
        for row in data["fiber-splice"]:
            splices.append(
                FiberSplice(
                    uuid=row["uuid"],
                    node_structure_id=uuid_of(row["node_structure"]),
                    port_number=row["port_number"],
                    fiber_a_id=uuid_of(row["fiber_a"]),
                    cable_a_id=uuid_of(row["cable_a"]),
                    fiber_b_id=uuid_of(row["fiber_b"]),
                    cable_b_id=uuid_of(row["cable_b"]),
                    merge_group_a=row["merge_group_a"],
                    merge_group_b=row["merge_group_b"],
                    shared_fiber_a_id=uuid_of(row["shared_fiber_a"]),
                    shared_cable_a_id=uuid_of(row["shared_cable_a"]),
                    shared_fiber_b_id=uuid_of(row["shared_fiber_b"]),
                    shared_cable_b_id=uuid_of(row["shared_cable_b"]),
                    residential_unit_a_id=uuid_of(row["residential_unit_a"]),
                    residential_unit_b_id=uuid_of(row["residential_unit_b"]),
                )
            )
        FiberSplice.objects.bulk_create(splices, batch_size=200)
        with_unit = sum(1 for row in data["fiber-splice"] if row["residential_unit_b"])
        self.stdout.write(
            f"  Fiber splices: {len(splices)} ({with_unit} of them onto a "
            "residential unit)"
        )

        # --- Valuation cost rates -------------------------------------------
        # Without them the "Wertermittlung" only shows a hint that no cost
        # rates are configured (manual chapters 9 and 22).
        rates = 0
        for row in data["valuation-rates"]:
            rate = ValuationCostRate.objects.create(
                project=project,
                name=row["name"],
                amount=row["amount"],
                unit=row["unit"],
                is_house_connection=row["is_house_connection"],
            )
            rate.node_types.set(
                [
                    node_types[old_id]
                    for old_id in row["node_type_ids"]
                    if old_id in node_types
                ]
            )
            rates += 1
        self.stdout.write(f"  Valuation cost rates: {rates}")

        # --- Pipeline records -----------------------------------------------
        types_of_work = {
            row["id"]: TypeOfWork.objects.get_or_create(name=row["name"])[0]
            for row in data["type-of-work"]
        }
        request_reasons = {
            row["id"]: RequestReason.objects.get_or_create(name=row["name"])[0]
            for row in data["request-reasons"]
        }
        # The record serializer resolves both to their name, not to an id.
        by_work_name = {obj.name: obj for obj in types_of_work.values()}
        by_reason_name = {obj.name: obj for obj in request_reasons.values()}

        records = {}
        for row in data["pipeline-records"]:
            records[row["uuid"]] = PipelineRecord.objects.create(
                uuid=row["uuid"],
                project=project,
                type_of_work=by_work_name.get(row["type_of_work"]),
                request_reason=by_reason_name.get(row["request_reason"]),
                organisation=row["organisation"],
                name=row["name"],
                tel=row["tel"],
                mobile=row["mobile"],
            )
        inquiry_areas = [
            PipelineInquiryArea(
                pipeline_record=records[row["pipeline_record_uuid"]],
                name=row["name"],
                geom=polygon(row["geometry"]),
            )
            for row in data["pipeline-inquiry-areas"]
            if row["pipeline_record_uuid"] in records
        ]
        PipelineInquiryArea.objects.bulk_create(inquiry_areas, batch_size=200)
        self.stdout.write(
            f"  Pipeline records: {len(records)}, inquiry areas: {len(inquiry_areas)}"
        )

        # --- Attachments (metadata only) ------------------------------------
        # The export gives the production ContentType id, which says nothing
        # locally. Which model an attachment belongs to is therefore derived
        # from the object it hangs off - its UUID is in exactly one of the
        # imported resources.
        owners = {
            "trench": Trench,
            "conduit": Conduit,
            "node": Node,
            "address": Address,
            "area": Area,
            "cable": Cable,
            "microduct": Microduct,
        }
        content_type_of_uuid = {}
        for key, model in owners.items():
            content_type = ContentType.objects.get_for_model(model)
            for row in data[key]:
                content_type_of_uuid[row["uuid"]] = content_type

        feature_files = []
        for row in data["feature-files"]:
            content_type = content_type_of_uuid.get(row["object_id"])
            if content_type is None:
                continue
            feature_files.append(
                FeatureFiles(
                    uuid=row["uuid"],
                    content_type=content_type,
                    object_id=row["object_id"],
                    file_path=row["file_path"],
                    file_name=row["file_name"],
                    file_type=row["file_type"],
                    description=row["description"],
                )
            )
        FeatureFiles.objects.bulk_create(feature_files, batch_size=200)
        self.stdout.write(
            f"  Attachments (metadata): {len(feature_files)} "
            f"of {len(data['feature-files'])}"
        )

        # --- Network schema settings (see the comment above) ----------------
        schema_settings = NetworkSchemaSettings.objects.create(project=project)
        excluded_types = AttributesNodeType.objects.filter(
            node_type__in=NETWORK_SCHEMA_EXCLUDED_NODE_TYPES
        )
        schema_settings.excluded_node_types.set(excluded_types)
        self.stdout.write(
            "  Network schema exclusions: "
            + ", ".join(sorted(t.node_type for t in excluded_types))
        )
