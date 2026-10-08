# 24. Daten importieren und exportieren

Qonnectra hat keinen allgemeinen Import. Daten kommen auf drei Wegen in eine Installation: Rohre über den Excel-Import der Rohrverwaltung, Geometrien – Trassen, Netzknoten, Adressen, Gebiete – über QGIS, und alles Übrige über die Weboberfläche. Dieses Kapitel beschreibt, was die Administration für diese Wege vorbereitet, und in welcher Reihenfolge ein neues Projekt befüllt wird. Welche Exporte die Weboberfläche bietet, steht in Abschnitt [Exportformate im Überblick](../teil-a-anwenderhandbuch/03-wiederkehrende-bedienelemente.md#_3-8-exportformate-im-uberblick).

## 24.1 Excel-Import der Rohre: Vorlage und Pflichtspalten

Den Ablauf des Imports, die Vorlage und die Fehlermeldungen beschreibt Abschnitt [Excel-Import: Vorlage, Ablauf, Fehlermeldungen](../teil-a-anwenderhandbuch/10-rohrverwaltung.md#_10-5-excel-import-vorlage-ablauf-fehlermeldungen). Aus Sicht der Administration zählt, was vorher vorhanden sein muss.

Jeder Wert in den Spalten „Typ“, „Status“, „Netzebene“, „Eigentümer“, „Baufirma“, „Hersteller“, „Projekt“ und „Kennzeichen“ muss als Stammdatum existieren, bevor die Datei importiert wird. Der Import vergleicht buchstabengenau, einschließlich Groß- und Kleinschreibung und Leerzeichen; „Geplant“ findet den Status „geplant“ nicht. Legen Sie fehlende Werte vorher an, siehe Kapitel [Projekte und Stammdaten pflegen](./21-projekte-und-stammdaten.md).

::: warning
Firmennamen müssen eindeutig sein. Gibt es zwei Firmen mit demselben Namen, meldet der Import für jede Zeile, die diesen Namen als „Eigentümer“, „Baufirma“ oder „Hersteller“ nennt, „An unexpected error occurred“ – und übernimmt damit die ganze Datei nicht. Prüfen Sie die Liste der Firmen vor einem großen Import auf doppelte Einträge.
:::

Die Mikrorohre entstehen wie beim Anlegen in der Weboberfläche, siehe Abschnitt [Rohrtypen und Mikrorohrfarben](./21-projekte-und-stammdaten.md#_21-4-rohrtypen-und-mikrorohrfarben).

## 24.2 GeoPackage-Schema herunterladen

Das GeoPackage-Schema ist die Vorlage für Daten, die außerhalb von Qonnectra erfasst werden – in QGIS ohne Verbindung zur Datenbank, durch ein Ingenieurbüro, auf einem Tablet im Feld –, und die später übernommen werden sollen, siehe Abschnitt [Feldaufnahme über GeoPackage und Rückführung](./26-netzdaten-in-qgis-bearbeiten.md#_26-4-feldaufnahme-uber-geopackage-und-ruckfuhrung).

Welche Tabellen die Datei enthält, legen Sie in einer Konfiguration fest; was ein GeoPackage-Schema ist und wie Sie die Konfiguration anlegen, beschreibt Abschnitt [GeoPackage-Schema konfigurieren](./22-projektbezogene-konfiguration.md#_22-4-geopackage-schema-konfigurieren). Herunterladen:

1. Öffnen Sie „GeoPackage-Schema-Konfigurationen“.
2. Haken Sie genau eine Konfiguration an.
3. Wählen Sie die Aktion „GeoPackage-Schema für ausgewählte Konfiguration herunterladen“ und klicken Sie auf „Ausführen“.

![Screenshot der GeoPackage-Schema-Konfigurationen mit Hervorhebung der angehakten Konfiguration, der gewählten Aktion darüber und der Schaltfläche „QGIS-Projekt konvertieren“ oben rechts](/images/manual/teil-b/admin_geopackage_download.jpg)

Die Datei enthält je ausgewählter Tabelle eine leere Tabelle mit allen Spalten der Datenbank, aber keine Daten. Die Stammdaten stehen in den Layern als Nummern; auch mitausgewählte Stammdatentabellen sind leer. Die Layer mit Geometrie liegen im Koordinatenbezugssystem der Installation, üblicherweise ETRS89 / UTM Zone 32N (EPSG:25832).

::: info
Dieselbe Datei liefert die Schnittstelle unter `/api/v1/schema.gpkg` auf der Adresse der Schnittstelle, mit dem Parameter `layers` für die Auswahl, etwa `…/api/v1/schema.gpkg?layers=address,attributes_status_development`. Ohne Parameter enthält sie alle Tabellen. Abrufen darf sie jedes angemeldete Konto.
:::

Neben der Download-Aktion steht oben rechts „QGIS-Projekt konvertieren“. Dort laden Sie ein QGIS-Projekt hoch, dessen Layer auf GeoPackage-Dateien verweisen, und erhalten es mit Verweisen auf die Datenbank von Qonnectra zurück. Das ist der Weg, ein Projekt, das mit dem leeren Schema aufgebaut wurde, auf den Bestand umzustellen; QGIS-Projekte für den QGIS-Server beschreibt Kapitel [QGIS-Server und Kartendienste](./27-qgis-server-und-kartendienste.md).

## 24.3 Erst- und Massenbefüllung eines Projekts

Ein neues Projekt füllen Sie in dieser Reihenfolge, weil jeder Schritt auf dem vorigen aufbaut:

1. **Stammdaten prüfen und ergänzen** – Status, Netzebenen, Firmen, Rohr- und Kabeltypen mit Farbzuordnungen, Netzknotentypen, siehe Kapitel [Projekte und Stammdaten pflegen](./21-projekte-und-stammdaten.md).
2. **Projekt und Kennzeichen anlegen**, siehe Abschnitt [Projekte anlegen und Vorbelegungen setzen](./21-projekte-und-stammdaten.md#_21-1-projekte-anlegen-und-vorbelegungen-setzen), samt Netzschema-, Rohrabzweig-Einstellungen und Kostensätzen, siehe Kapitel [Projektbezogene Konfiguration](./22-projektbezogene-konfiguration.md).
3. **Geometrien in QGIS übernehmen** – Gebiete, Trassen, Netzknoten, Adressen, siehe Kapitel [Netzdaten in QGIS bearbeiten](./26-netzdaten-in-qgis-bearbeiten.md).
4. **Rohre importieren**, siehe Abschnitt [Excel-Import der Rohre: Vorlage und Pflichtspalten](#_24-1-excel-import-der-rohre-vorlage-und-pflichtspalten).
5. **Rohre den Trassen zuordnen** und die Mikrorohre verbinden, in der Weboberfläche, siehe Kapitel [Rohrzuordnung](../teil-a-anwenderhandbuch/11-rohrzuordnung.md) und [Rohrverzweigung](../teil-a-anwenderhandbuch/12-rohrverzweigung.md).
6. **Kabel, Netzknotenaufbau und Spleiße** im Netzschema erfassen, siehe Kapitel [Netzschema](../teil-a-anwenderhandbuch/14-netzschema.md).

Für Rohrzuordnung, Kabel und Spleiße gibt es keinen Massenimport; sie entstehen in der Weboberfläche.

::: warning
Nach einer Übernahme an der Weboberfläche vorbei – aus QGIS oder direkt in die Datenbank – fehlt, was sonst beim Anlegen geschieht: Rohre bekommen keine Mikrorohre, Kabel keine Fasern. Ergänzen Sie sie mit den Aktionen des Administrationsbereichs, siehe Abschnitt [Suchen, Filtern und Massenbearbeitung](./20-administrationsbereich.md#_20-2-suchen-filtern-und-massenbearbeitung).
:::

::: info
Die Weboberfläche zeigt neue Daten nicht überall sofort. Kartenkacheln mit Inhalt hält der Server bis zu 30 Sekunden vor, leere Kacheln bis zu zehn Minuten; die Auswertungen im Dashboard bis zu fünf Minuten, siehe Kapitel [Dashboard](../teil-a-anwenderhandbuch/04-dashboard.md). Wurde ein Kartenausschnitt angesehen, solange er noch leer war, bleiben die übernommenen Objekte dort deshalb bis zu zehn Minuten unsichtbar – gerade bei der Erstbefüllung.
:::
