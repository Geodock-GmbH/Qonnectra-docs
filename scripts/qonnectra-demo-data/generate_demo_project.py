"""Erzeugt ein fiktives Demo-Ausbaugebiet für Handbuch-Screenshots/Videos.

Fiktiver Ort "Glashofen" auf echten, unauffälligen ländlichen Koordinaten in
Niedersachsen (kein realer Ort dieses Namens an dieser Stelle) - die
Hintergrundkarte zeigt also echtes OSM-Gelände, alle Netzobjekte, Straßen-
und Firmennamen sind erfunden.

Wird nicht Teil des lokalen Qonnectra-Checkouts (local-app/ ist gitignored),
sondern von scripts/setup-local-qonnectra.sh nach dem Klonen als Management-
Command nach local-app/backend/apps/api/management/commands/ kopiert und
danach per "manage.py generate_demo_project" ausgeführt. Idempotent: läuft
ohne Wirkung, falls das Demo-Projekt schon existiert (siehe --force).
"""

import math
from datetime import date, timedelta

from django.conf import settings
from django.contrib.gis.geos import LineString, Point
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.api.models import (
    Address,
    AttributesCableType,
    AttributesCompany,
    AttributesConduitType,
    AttributesConstructionType,
    AttributesNetworkLevel,
    AttributesNodeType,
    AttributesPhase,
    AttributesResidentialUnitStatus,
    AttributesResidentialUnitType,
    AttributesStatus,
    AttributesStatusDevelopment,
    AttributesSurface,
    Cable,
    Conduit,
    Flags,
    Node,
    Projects,
    ResidentialUnit,
    Trench,
    TrenchConduitConnection,
)

DEMO_PROJECT_NAME = "Ausbaugebiet Glashofen"

# Reales, unauffälliges Ackerland in Niedersachsen (Raum Sulingen/Diepholz) -
# nur als Hintergrund für eine plausible Karte, ohne Bezug zu "Glashofen".
BASE_LON, BASE_LAT = 8.6100, 52.7850

CITY = "Glashofen"
ZIP_CODE = "27245"


def _offset_lonlat(dx_m, dy_m):
    """(lon, lat) BASE_LON/BASE_LAT-Punkt versetzt um dx/dy Meter (Ost/Nord)."""
    meters_per_lon = 111_320 * math.cos(math.radians(BASE_LAT))
    return (BASE_LON + dx_m / meters_per_lon, BASE_LAT + dy_m / 111_320)


def _point(dx_m, dy_m):
    pt = Point(*_offset_lonlat(dx_m, dy_m), srid=4326)
    pt.transform(settings.DEFAULT_SRID)
    return pt


def _line(*coords_m):
    ls = LineString([_offset_lonlat(dx, dy) for dx, dy in coords_m], srid=4326)
    ls.transform(settings.DEFAULT_SRID)
    return ls


def _in_days(days):
    return date.today() + timedelta(days=days)


class Command(BaseCommand):
    help = (
        "Erzeugt das fiktive Demo-Ausbaugebiet 'Glashofen' fuer Handbuch-"
        "Screenshots (idempotent, siehe --force)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Vorhandenes Demo-Projekt vorher loeschen und neu erzeugen.",
        )

    def handle(self, *args, **options):
        existing = Projects.objects.filter(project=DEMO_PROJECT_NAME).first()
        if existing:
            if not options["force"]:
                self.stdout.write(
                    self.style.WARNING(
                        f'Projekt "{DEMO_PROJECT_NAME}" existiert bereits, '
                        "ueberspringe (--force zum Neuerzeugen)."
                    )
                )
                return
            self._cleanup(existing)

        with transaction.atomic():
            self._generate()

        self.stdout.write(
            self.style.SUCCESS(f'Demo-Projekt "{DEMO_PROJECT_NAME}" wurde erzeugt.')
        )

    def _cleanup(self, project):
        # Reihenfolge wichtig: mehrere FKs (Node/Address/Conduit/Cable ->
        # project, Node -> uuid_address, Cable -> uuid_node_start/end) sind
        # on_delete=DO_NOTHING, daher hier explizit in Abhaengigkeitsreihenfolge
        # loeschen statt auf Kaskaden beim Loeschen des Projects zu vertrauen.
        Cable.objects.filter(project=project).delete()  # kaskadiert Fiber, MicroductCableConnection
        Conduit.objects.filter(project=project).delete()  # kaskadiert Microduct, TrenchConduitConnection
        Node.objects.filter(project=project).delete()
        Address.objects.filter(project=project).delete()  # kaskadiert ResidentialUnit
        Trench.objects.filter(project=project).delete()
        project.delete()

    def _generate(self):
        flag_bestand, _ = Flags.objects.get_or_create(flag="Bestand")
        flag_planung, _ = Flags.objects.get_or_create(flag="Planung")

        company_stadtwerke, _ = AttributesCompany.objects.get_or_create(
            company="Stadtwerke Glashofen GmbH",
            defaults={"city": CITY, "postal_code": ZIP_CODE},
        )
        company_tiefbau, _ = AttributesCompany.objects.get_or_create(
            company="Tiefbau Nordwest GmbH",
            defaults={"city": "Sulingen", "postal_code": "27232"},
        )

        surface_asphalt = AttributesSurface.objects.get(surface="Asphalt")
        surface_pflaster = AttributesSurface.objects.get(surface="Pflaster")
        surface_unbefestigt = AttributesSurface.objects.get(surface="unbefestigt")

        ct_tiefbau = AttributesConstructionType.objects.get(
            construction_type="klassischer Tiefbau"
        )
        ct_bodenverdraengung = AttributesConstructionType.objects.get(
            construction_type="Bodenverdrängung"
        )
        ct_spuelbohr = AttributesConstructionType.objects.get(
            construction_type="Spülbohrverfahren"
        )

        status_geplant = AttributesStatus.objects.get(status="geplant")
        status_im_bau = AttributesStatus.objects.get(status="im Bau")
        status_dokumentiert = AttributesStatus.objects.get(status="dokumentiert")

        phase_genehmigung = AttributesPhase.objects.get(phase="Genehmigungsplanung")
        phase_ausfuehrung = AttributesPhase.objects.get(phase="Ausführungsplanung")
        phase_doku = AttributesPhase.objects.get(phase="Dokumentation")

        conduit_type_multi = AttributesConduitType.objects.get(conduit_type="12x10/6")
        conduit_type_single = AttributesConduitType.objects.get(conduit_type="10/6")

        cable_type_backbone = AttributesCableType.objects.get(
            cable_type="LTMC48(4x12)"
        )
        cable_type_drop = AttributesCableType.objects.get(cable_type="MUC E9/125(6)")

        node_type_nvt = AttributesNodeType.objects.get(node_type="NVt 48")
        node_type_rab = AttributesNodeType.objects.get(node_type="Rohrabzweig")
        node_type_schacht = AttributesNodeType.objects.get(node_type="Schacht")
        node_type_muffe = AttributesNodeType.objects.get(node_type="Muffe")
        node_type_ha = AttributesNodeType.objects.get(node_type="Hausanschluss")

        network_level_3 = AttributesNetworkLevel.objects.get(
            network_level="Netzebene 3"
        )
        network_level_4 = AttributesNetworkLevel.objects.get(
            network_level="Netzebene 4"
        )

        ru_type_privat = AttributesResidentialUnitType.objects.get(
            residential_unit_type="privat"
        )
        ru_type_gewerbe = AttributesResidentialUnitType.objects.get(
            residential_unit_type="gewerbe"
        )
        ru_status_connected = AttributesResidentialUnitStatus.objects.get(
            status="connected"
        )
        ru_status_not_connected = AttributesResidentialUnitStatus.objects.get(
            status="not connected"
        )

        sd_homes_connected = AttributesStatusDevelopment.objects.get(
            status="homesConnected"
        )
        sd_homes_passed = AttributesStatusDevelopment.objects.get(
            status="homesPassed"
        )

        project = Projects.objects.create(
            project=DEMO_PROJECT_NAME,
            description=(
                "Fiktives Ausbaugebiet für Handbuch-Screenshots und "
                "Videos - kein reales Projekt."
            ),
            active=True,
        )

        # --- Trassen ---------------------------------------------------
        t1 = Trench.objects.create(
            id_trench="TR-001",
            surface=surface_asphalt,
            construction_type=ct_tiefbau,
            geom=_line((-150, 0), (0, 0)),
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            phase=phase_doku,
            owner=company_stadtwerke,
            constructor=company_tiefbau,
            date=_in_days(-620),
        )
        t2 = Trench.objects.create(
            id_trench="TR-002",
            surface=surface_asphalt,
            construction_type=ct_tiefbau,
            geom=_line((0, 0), (150, 0)),
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            phase=phase_doku,
            owner=company_stadtwerke,
            constructor=company_tiefbau,
            date=_in_days(-600),
        )
        t3 = Trench.objects.create(
            id_trench="TR-003",
            surface=surface_pflaster,
            construction_type=ct_tiefbau,
            geom=_line((0, 0), (0, 120)),
            project=project,
            flag=flag_bestand,
            status=status_im_bau,
            phase=phase_ausfuehrung,
            owner=company_stadtwerke,
            constructor=company_tiefbau,
            date=_in_days(-20),
        )
        t4 = Trench.objects.create(
            id_trench="TR-004",
            surface=surface_unbefestigt,
            construction_type=ct_bodenverdraengung,
            geom=_line((-150, 0), (-150, -100)),
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            phase=phase_doku,
            owner=company_stadtwerke,
            constructor=company_tiefbau,
            date=_in_days(-580),
        )
        t5 = Trench.objects.create(
            id_trench="TR-005",
            surface=surface_unbefestigt,
            construction_type=ct_spuelbohr,
            geom=_line((150, 0), (230, 60)),
            project=project,
            flag=flag_planung,
            status=status_geplant,
            phase=phase_genehmigung,
            owner=company_stadtwerke,
        )

        # --- Rohre + Rohrzuordnung --------------------------------------
        c1 = Conduit.objects.create(
            name="Rohr HKR-01",
            conduit_type=conduit_type_multi,
            project=project,
            flag=flag_bestand,
        )
        TrenchConduitConnection.objects.create(uuid_trench=t1, uuid_conduit=c1)
        TrenchConduitConnection.objects.create(uuid_trench=t2, uuid_conduit=c1)

        c2 = Conduit.objects.create(
            name="Rohr Ahornweg-01",
            conduit_type=conduit_type_single,
            project=project,
            flag=flag_bestand,
        )
        TrenchConduitConnection.objects.create(uuid_trench=t3, uuid_conduit=c2)

        c3 = Conduit.objects.create(
            name="Rohr Mühlbach-01",
            conduit_type=conduit_type_single,
            project=project,
            flag=flag_bestand,
        )
        TrenchConduitConnection.objects.create(uuid_trench=t4, uuid_conduit=c3)

        c4 = Conduit.objects.create(
            name="Rohr Feldweg-01",
            conduit_type=conduit_type_multi,
            project=project,
            flag=flag_planung,
        )
        TrenchConduitConnection.objects.create(uuid_trench=t5, uuid_conduit=c4)

        # Bewusst noch nicht zugeordnet, um den leeren Zustand in der
        # Rohrzuordnung zu demonstrieren.
        Conduit.objects.create(
            name="Rohr Ahornweg-02",
            conduit_type=conduit_type_single,
            project=project,
            flag=flag_planung,
        )

        # --- Netzknoten (Infrastruktur) ----------------------------------
        n1 = Node.objects.create(
            name="NVt Lindenstraße West",
            node_type=node_type_nvt,
            geom=_point(-150, 0),
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            network_level=network_level_3,
            owner=company_stadtwerke,
            date=_in_days(-620),
            warranty=_in_days(540),
        )
        n2 = Node.objects.create(
            name="Rohrabzweig Lindenstraße Mitte",
            node_type=node_type_rab,
            geom=_point(0, 0),
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            network_level=network_level_3,
            owner=company_stadtwerke,
            date=_in_days(-600),
            warranty=_in_days(520),
        )
        n9 = Node.objects.create(
            name="Rohrabzweig Lindenstraße Ost",
            node_type=node_type_rab,
            geom=_point(150, 0),
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            network_level=network_level_3,
            owner=company_stadtwerke,
            date=_in_days(-600),
            # Bald ablaufende Gewährleistung - für die rote Hervorhebung im
            # Dashboard ("Einträge mit bald ablaufender Frist").
            warranty=_in_days(18),
        )
        Node.objects.create(
            name="NVt Feldweg Ost",
            node_type=node_type_nvt,
            geom=_point(230, 60),
            project=project,
            flag=flag_planung,
            status=status_geplant,
            network_level=network_level_3,
            owner=company_stadtwerke,
        )
        n3 = Node.objects.create(
            name="Schacht Ahornweg",
            node_type=node_type_schacht,
            geom=_point(0, 120),
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            network_level=network_level_4,
            owner=company_stadtwerke,
            date=_in_days(-18),
            warranty=_in_days(2),
        )
        Node.objects.create(
            name="Muffe Am Mühlbach",
            node_type=node_type_muffe,
            geom=_point(-150, -100),
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            network_level=network_level_4,
            owner=company_stadtwerke,
            date=_in_days(-580),
            warranty=_in_days(430),
        )

        # --- Adressen + Wohneinheiten -------------------------------------
        a1 = Address.objects.create(
            street="Lindenstraße",
            housenumber=4,
            zip_code=ZIP_CODE,
            city=CITY,
            geom=_point(-82, 17),
            project=project,
            flag=flag_bestand,
            status_development=sd_homes_connected,
        )
        a2 = Address.objects.create(
            street="Lindenstraße",
            housenumber=8,
            zip_code=ZIP_CODE,
            city=CITY,
            geom=_point(-20, 15),
            project=project,
            flag=flag_bestand,
            status_development=sd_homes_passed,
        )
        a3 = Address.objects.create(
            street="Lindenstraße",
            housenumber=12,
            zip_code=ZIP_CODE,
            city=CITY,
            geom=_point(58, 14),
            project=project,
            flag=flag_bestand,
            status_development=sd_homes_connected,
        )
        a4 = Address.objects.create(
            street="Ahornweg",
            housenumber=1,
            zip_code=ZIP_CODE,
            city=CITY,
            geom=_point(5, 40),
            project=project,
            flag=flag_bestand,
            status_development=sd_homes_passed,
        )
        a5 = Address.objects.create(
            street="Ahornweg",
            housenumber=3,
            zip_code=ZIP_CODE,
            city=CITY,
            geom=_point(17, 62),
            project=project,
            flag=flag_bestand,
            status_development=sd_homes_connected,
        )
        a6 = Address.objects.create(
            street="Am Mühlbach",
            housenumber=2,
            zip_code=ZIP_CODE,
            city=CITY,
            geom=_point(-162, -52),
            project=project,
            flag=flag_bestand,
            status_development=sd_homes_connected,
        )

        ResidentialUnit.objects.create(
            uuid_address=a1,
            floor=0,
            residential_unit_type=ru_type_privat,
            status=ru_status_connected,
            resident_name="Familie Bauer",
            ready_for_service=_in_days(-300),
        )
        ResidentialUnit.objects.create(
            uuid_address=a2,
            floor=0,
            residential_unit_type=ru_type_gewerbe,
            status=ru_status_not_connected,
            resident_name="Bäckerei Fischer",
        )
        ResidentialUnit.objects.create(
            uuid_address=a3,
            floor=0,
            residential_unit_type=ru_type_privat,
            status=ru_status_connected,
            resident_name="K. Vogel",
            ready_for_service=_in_days(-280),
        )
        ResidentialUnit.objects.create(
            uuid_address=a3,
            floor=1,
            residential_unit_type=ru_type_privat,
            status=ru_status_connected,
            resident_name="Familie Nowak",
            ready_for_service=_in_days(-280),
        )
        ResidentialUnit.objects.create(
            uuid_address=a4,
            floor=0,
            residential_unit_type=ru_type_privat,
            status=ru_status_not_connected,
            resident_name="T. Krüger",
        )
        ResidentialUnit.objects.create(
            uuid_address=a5,
            floor=0,
            residential_unit_type=ru_type_privat,
            status=ru_status_connected,
            resident_name="M. Ostermann",
            ready_for_service=_in_days(-250),
        )
        ResidentialUnit.objects.create(
            uuid_address=a6,
            floor=0,
            residential_unit_type=ru_type_privat,
            status=ru_status_connected,
            resident_name="Familie Schmidt",
            ready_for_service=_in_days(-260),
        )

        # --- Hausanschluss-Knoten (verknüpft mit Adresse) ------------------
        n6 = Node.objects.create(
            name="HA Lindenstraße 4",
            node_type=node_type_ha,
            geom=_point(-82, 17),
            uuid_address=a1,
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            network_level=network_level_4,
            owner=company_stadtwerke,
            date=_in_days(-300),
            warranty=_in_days(600),
        )
        n7 = Node.objects.create(
            name="HA Lindenstraße 12",
            node_type=node_type_ha,
            geom=_point(58, 14),
            uuid_address=a3,
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            network_level=network_level_4,
            owner=company_stadtwerke,
            date=_in_days(-280),
            warranty=_in_days(600),
        )
        n8 = Node.objects.create(
            name="HA Ahornweg 3",
            node_type=node_type_ha,
            geom=_point(17, 62),
            uuid_address=a5,
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            network_level=network_level_4,
            owner=company_stadtwerke,
            date=_in_days(-250),
            warranty=_in_days(610),
        )
        Node.objects.create(
            name="HA Am Mühlbach 2",
            node_type=node_type_ha,
            geom=_point(-162, -52),
            uuid_address=a6,
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            network_level=network_level_4,
            owner=company_stadtwerke,
            date=_in_days(-260),
            warranty=_in_days(590),
        )

        # --- Kabel (Fasern werden per Signal automatisch erzeugt) ---------
        Cable.objects.create(
            name="OVZ-NVtWest-RABOst",
            cable_type=cable_type_backbone,
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            network_level=network_level_3,
            owner=company_stadtwerke,
            constructor=company_tiefbau,
            date=_in_days(-600),
            uuid_node_start=n1,
            uuid_node_end=n9,
            length=300.0,
            length_total=300.0,
        )
        Cable.objects.create(
            name="HA-Lindenstrasse12",
            cable_type=cable_type_drop,
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            network_level=network_level_4,
            owner=company_stadtwerke,
            constructor=company_tiefbau,
            date=_in_days(-280),
            uuid_node_start=n2,
            uuid_node_end=n7,
            length=65.0,
            length_total=65.0,
        )
        Cable.objects.create(
            name="HA-Ahornweg3",
            cable_type=cable_type_drop,
            project=project,
            flag=flag_bestand,
            status=status_dokumentiert,
            network_level=network_level_4,
            owner=company_stadtwerke,
            constructor=company_tiefbau,
            date=_in_days(-250),
            uuid_node_start=n3,
            uuid_node_end=n8,
            length=70.0,
            length_total=70.0,
        )
