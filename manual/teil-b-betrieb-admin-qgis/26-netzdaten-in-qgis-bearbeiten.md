# 26. Netzdaten in QGIS bearbeiten

In QGIS bearbeiten Sie die Geometrie des Netzes und die Angaben, die die Weboberfläche nicht anbietet. Die Verbindung zur Datenbank richten Sie ein wie in Kapitel [QGIS-Arbeitsplatz einrichten](./25-qgis-arbeitsplatz-einrichten.md) beschrieben. Dieses Kapitel beschreibt, was Qonnectra beim Bearbeiten in QGIS selbst erledigt, was es ablehnt und was danach fehlt. Wie Objekte in QGIS gezeichnet, verschoben und gelöscht werden, beschreibt die QGIS-Dokumentation im Kapitel [Bearbeiten](https://docs.qgis.org/latest/de/docs/user_manual/working_with_vector/editing_geometry_attributes.html).

## 26.1 Welche Layer bearbeitet werden dürfen

In QGIS bearbeitet werden die vier Layer mit Geometrie:

- **Trassen** (`trench`) – zeichnen, Verlauf korrigieren, löschen. Die Rohre einer neuen Trasse ordnen Sie anschließend in der Weboberfläche zu, siehe Kapitel [Rohrzuordnung](../teil-a-anwenderhandbuch/11-rohrzuordnung.md).
- **Netzknoten** (`node`) – setzen, verschieben, löschen. Die Spalte `uuid_address` verknüpft einen Netzknoten mit einer Adresse; leeren Sie sie, um die Verknüpfung zu lösen, die sich in der Weboberfläche nicht lösen lässt.
- **Adressen** (`address`) – erfassen und verschieben. Die Wohneinheiten einer Adresse legen Sie in der Weboberfläche an, siehe Kapitel [Adressen](../teil-a-anwenderhandbuch/16-adressen.md).
- **Gebiete** (`area`) – zeichnen und zuschneiden.

Alles andere bearbeiten Sie in der Weboberfläche oder im Administrationsbereich, auch wenn QGIS die Tabellen öffnen kann: Rohre, Mikrorohre, Kabel, Fasern, Spleiße und der Aufbau der Netzknoten hängen über Verknüpfungen zusammen, die nur die Weboberfläche vollständig pflegt.

## 26.2 Pflichtfelder, Wertelisten und Validierung

Füllen Sie bei jedem neuen Objekt die Spalten `project` und `flag` mit der Nummer des Projekts und des Kennzeichens. Ohne beide weist die Datenbank das Objekt beim Speichern ab.

Einige Spalten füllt die Datenbank selbst. Lassen Sie sie beim Erfassen leer:

- `uuid` – die Kennung jedes Objekts.
- `id_trench` einer neuen Trasse – die Trassen-ID im Format `TR-` und sieben Zeichen. Eine Trassen-ID in einem anderen Format ersetzt die Datenbank durch eine neue.
- `length` einer Trasse – die Länge aus der Geometrie, bei jeder Änderung neu berechnet.
- `id_address` einer neuen Adresse – die Adress-ID.
- `geom_3857` aller vier Layer – eine Kopie der Geometrie für die Karte der Weboberfläche.

Stammdaten wie Status, Netzknotentyp oder Oberfläche stehen als Nummern in den Spalten. Erfassen Sie sie über eine Wertbeziehung, siehe Abschnitt [Layer, Koordinatenbezugssystem und Stile](./25-qgis-arbeitsplatz-einrichten.md#_25-3-layer-koordinatenbezugssystem-und-stile); eine Nummer, die es nicht gibt, weist die Datenbank beim Speichern ab.

Diese Änderungen lehnt die Datenbank ab; QGIS meldet beim Speichern einen Fehler mit dem Grund:

| Änderung | Meldung (Auszug) |
|---|---|
| Trasse, die sich selbst schneidet oder ungültig ist | „Geometry is not simple (self-intersecting)“ bzw. „Invalid geometry“ |
| Netzknoten löschen, an dem Kabel beginnen oder enden | „Cannot delete node: node has connected cables.“ |
| Netzknoten löschen, dessen untergeordnete Netzknoten Kabel haben | „Cannot delete node: child nodes have connected cables.“ |
| Netzknotentyp ändern, wenn der Netzknoten untergeordnete Netzknoten und Kabel hat | „Cannot change node type: node has both child nodes and connected cables.“ |
| übergeordneten Netzknoten ändern, wenn Kabel angeschlossen sind | „Cannot change parent node: this node has connected cables.“ |

Gebiete müssen ebenfalls gültige Flächen sein, ohne Selbstüberschneidung.

## 26.3 Gleichzeitiges Arbeiten mit der Weboberfläche

QGIS und die Weboberfläche arbeiten auf derselben Datenbank. Was Sie in QGIS speichern, gilt sofort; die Karte der Weboberfläche zeigt es nach spätestens 30 Sekunden, das Dashboard nach spätestens fünf Minuten.

::: danger
Wird eine Trasse oder ein Netzknoten so verschoben, dass das Trassenende mehr als fünf Meter vom Netzknoten entfernt liegt, löscht die Datenbank die Verbindungen der Mikrorohre an diesem Netzknoten, ohne Meldung. Die Rohrverzweigung dort ist danach leer und muss neu verbunden werden, siehe Kapitel [Rohrverzweigung](../teil-a-anwenderhandbuch/12-rohrverzweigung.md). Prüfen Sie nach dem Verschieben eines Netzknotens oder eines Trassenendes, ob die Trassen weiterhin am Netzknoten enden.
:::

Was die Weboberfläche bei einer Änderung nebenbei erledigt, geschieht in QGIS nicht:

- Der Ordner der Anhänge wird bei einem Umbenennen nicht verschoben, siehe Abschnitt [Ablagestruktur der Anhänge](./23-dateien-und-anhaenge.md#_23-1-ablagestruktur-der-anhange).
- Der Änderungsverlauf im Administrationsbereich erfährt nichts von der Änderung, siehe Abschnitt [Änderungsverlauf eines Objekts einsehen](./20-administrationsbereich.md#_20-3-anderungsverlauf-eines-objekts-einsehen).

Ein Rohr, das über die Tabelle in der Datenbank entsteht, bekommt keine Mikrorohre, ein Kabel keine Fasern. Was danach nachzuziehen ist, bieten die Aktionen in Abschnitt [Suchen, Filtern und Massenbearbeitung](./20-administrationsbereich.md#_20-2-suchen-filtern-und-massenbearbeitung). Ein gelöschtes Objekt lässt wie in der Weboberfläche seine Anhänge zurück, siehe Abschnitt [Verwaiste Dateien finden, verschieben und löschen](./23-dateien-und-anhaenge.md#_23-5-verwaiste-dateien-finden-verschieben-und-loschen).

::: info
Ein Trassen-Layer in QGIS lässt sich automatisch neu zeichnen, sobald jemand – in QGIS oder in der Weboberfläche – Trassen ändert: Die Datenbank sendet dafür die Benachrichtigung `qgis`. Aktivieren Sie in den Eigenschaften des Layers unter „Rendern“ die Option „Layer bei Benachrichtigung aktualisieren“.
:::

Bearbeiten zwei Personen dasselbe Objekt gleichzeitig, gewinnt die letzte Speicherung, ohne Warnung. Sprechen Sie größere Änderungen an einem Gebiet ab.

## 26.4 Feldaufnahme über GeoPackage und Rückführung

Für Aufnahmen ohne Verbindung zur Datenbank – im Feld, durch ein beauftragtes Büro – gibt es das GeoPackage-Schema: eine leere Datei mit dem Aufbau der Qonnectra-Tabellen, siehe Abschnitt [GeoPackage-Schema herunterladen](./24-daten-import-und-export.md#_24-2-geopackage-schema-herunterladen).

1. Laden Sie ein Schema mit den benötigten Layern herunter und geben Sie die Datei an die aufnehmende Stelle. Welche Layer es enthält, legt die Konfiguration fest, siehe Abschnitt [GeoPackage-Schema konfigurieren](./22-projektbezogene-konfiguration.md#_22-4-geopackage-schema-konfigurieren).
2. Dort werden die Objekte in der Datei erfasst, mit derselben Spaltenstruktur wie in der Datenbank.
3. Öffnen Sie die zurückgegebene Datei in QGIS neben der Datenbankverbindung.
4. Prüfen Sie die Objekte: Projekt, Kennzeichen und Stammdaten-Nummern müssen zu Ihrer Installation passen.
5. Kopieren Sie die Objekte aus dem GeoPackage-Layer und fügen Sie sie im Bearbeitungsmodus in den Layer der Datenbank ein; speichern Sie.

Für die Rückführung gibt es keinen Import in Qonnectra. Sie ist ein Kopieren in QGIS, und dabei gelten alle Regeln dieses Kapitels: Die Datenbank vergibt IDs und Längen und weist ungültige Geometrien ab.

::: warning
Leeren Sie vor dem Einfügen die Spalten `uuid`, `id_trench` und `id_address`, falls die aufnehmende Stelle sie gefüllt hat. Eine UUID oder eine Trassen-ID, die es im Projekt schon gibt, lässt das Einfügen scheitern; die Datenbank vergibt beide selbst.
:::
