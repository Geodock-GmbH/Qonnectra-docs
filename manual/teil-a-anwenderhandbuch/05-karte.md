# 5. Karte

Die Karte ist eines der zentralen Werkzeuge in Qonnectra. Sie dient der visuellen Darstellung des Netzbestands, der Orientierung im Raum und dem schnellen Aufruf von Informationen zu einzelnen Netzobjekten. Sie erreichen die Karte über die linke Navigation durch Klicken auf den Menüpunkt „Karte“.

![Screenshot Karte](/images/manual/teil-a/map.jpg)

Bewegung, Legende, Transparenz und Suche funktionieren wie in Kapitel [Wiederkehrende Bedienelemente](./03-wiederkehrende-bedienelemente.md) beschrieben. Dieses Kapitel behandelt, was nur für die Kartenansicht gilt.

## 5.1 Kartenausschnitt, Zoomstufe und gespeicherte Position

Wenn Sie bei geöffneter Karte ein anderes Projekt auswählen, springt die Karte nicht automatisch in dessen Gebiet. Um dorthin zu gelangen, klicken Sie in der Legende oben rechts beim Eintrag „Adresse“ auf das Lupensymbol „Auf Ausdehnung zoomen“, siehe Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster).

::: info
Qonnectra merkt sich den letzten Kartenausschnitt. Wenn Sie die Karte erneut öffnen, sehen Sie wieder die Stelle, an der Sie zuletzt gearbeitet haben.
:::

## 5.2 Layer der Karte

Die Legende führt die Objektarten des Netzbestands als eigene Layer: „Adresse“, „Netzknoten“, „Trasse“, „Rohr“ und „Gebiet“, dazu die Hintergrundkarte „OpenStreetMap“. „Netzknoten“ und „Gebiet“ lassen sich nach Typen aufklappen, sodass Sie etwa nur die Hausanschlüsse oder nur die Projektgebiete einblenden.

Wie Sie die Layer schalten, beschreibt Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster). Die Farben und Formen der Layer stellen Sie unter „Einstellungen“ ein, siehe Kapitel [Einstellungen](./17-einstellungen.md).

## 5.3 Objekte auswählen und Eigenschaften lesen

Wenn Sie ein Objekt (z. B. eine Trasse oder einen Netzknoten) auf der Karte anklicken, öffnet sich auf der rechten Seite die **Info-Box**, siehe Abschnitt [Der Infobereich](./03-wiederkehrende-bedienelemente.md#_3-6-der-infobereich-mit-seinen-reitern). Welche Reiter sie enthält, hängt von der Objektart ab:

- Trasse: „Eigenschaften“, „Rohrübersicht“, „Kabelübersicht“, „Aktionen“, „Anhänge“
- Netzknoten und Adresse: „Eigenschaften“, „Aktionen“, „Anhänge“
- Gebiet: „Eigenschaften“, „Anhänge“

Die Angaben im Reiter „Eigenschaften“ sind hier nicht bearbeitbar, sondern dienen als Informationsquelle. Bearbeiten können Sie in der Karte ausschließlich den Reiter „Anhänge“, siehe Abschnitt [Anhänge an einem Kartenobjekt](#_5-8-anhange-an-einem-kartenobjekt).

![Screenshot Karte mit Hervorhebung eines ausgewählten Objekts und der Anzeige der Details in einer Info-Box rechts](/images/manual/teil-a/map_selected_object.jpg)

## 5.4 Trasse: Reiter „Rohrübersicht“ und „Kabelübersicht“

Der Reiter „Rohrübersicht“ zeigt die Rohre der ausgewählten Trasse, siehe Kapitel [Rohrverwaltung](./10-rohrverwaltung.md), „Kabelübersicht“ die darin liegenden Kabel.

_Die Dokumentation zu diesem Abschnitt ist noch in Arbeit._

## 5.5 Grabenprofil einer Trasse

Im Reiter „Aktionen“ einer Trasse öffnet „Grabenprofil anzeigen“ den Querschnitt des Grabens mit der Lage der Rohre.

_Die Dokumentation zu diesem Abschnitt ist noch in Arbeit._

## 5.6 Netzknoten: Slot-Konfiguration und Struktur öffnen

Im Reiter „Aktionen“ eines Netzknotens führen „Slot-Konfiguration anzeigen“ und „Struktur anzeigen“ zu dessen innerem Aufbau.

_Die Dokumentation zu diesem Abschnitt ist noch in Arbeit._

## 5.7 Von der Karte in den Faserweg wechseln

Im Reiter „Aktionen“ eines Netzknotens oder einer Adresse springt „Folgen“ in die Ansicht „Faserweg“, siehe Kapitel [Faserweg](./15-faserweg.md).

_Die Dokumentation zu diesem Abschnitt ist noch in Arbeit._

## 5.8 Anhänge an einem Kartenobjekt

Zu jedem Kartenobjekt können Sie Dateien ablegen. Hochladen, Herunterladen, Umbenennen und Löschen funktionieren wie in Abschnitt [Anhänge hochladen, ansehen und löschen](./03-wiederkehrende-bedienelemente.md#_3-7-anhange-hochladen-ansehen-und-loschen) beschrieben.

## 5.9 Grenzen der Darstellung

Ein Klick auf eine freie Stelle der Karte hebt die Auswahl auf – innerhalb eines Projektgebiets ist das allerdings kaum möglich, weil dessen Fläche die gesamte Umgebung überdeckt; schließen Sie die Info-Box dann über das Kreuz „Seitenleiste schließen“.

::: warning
Trassen sind nur wenige Pixel breit und laufen an Netzknoten zusammen. Treffen Sie beim Klicken nicht das gewünschte Objekt, zoomen Sie weiter hinein oder blenden Sie den Layer „Gebiet“ vorübergehend aus.
:::
