# 3. Wiederkehrende Bedienelemente

Einige Bedienelemente von Qonnectra tauchen in mehreren Ansichten unverändert auf: das Kartenfenster mit seiner Legende, die Objektsuche, der Infobereich am rechten Rand und die Anhänge. Dieses Kapitel beschreibt sie einmal; die Kapitel zu den einzelnen Menüpunkten verweisen darauf und nennen nur noch, was dort davon abweicht.

## 3.1 Tabellen: Suche, Spaltenfilter, Sortierung, Seitenwechsel

_Die Dokumentation zu diesem Abschnitt ist noch in Arbeit._

## 3.2 Auswahllisten und Kombinationsfelder

_Die Dokumentation zu diesem Abschnitt ist noch in Arbeit._

## 3.3 Das Kartenfenster

Ein Kartenfenster zeigen die Karte selbst sowie die Rohrzuordnung, die Mikrorohre, die Störungsanalyse, die Leitungsauskunft und die Wertermittlung. Es verhält sich überall gleich.

Mit dem Mausrad oder dem Touchpad zoomen Sie in die Karte hinein und heraus, mit gedrückter linker Maustaste verschieben Sie den Kartenausschnitt.

Links unten finden Sie den Regler „Transparenz“, mit dem Sie die **Transparenz** der Hintergrundkarte anpassen können. Dies ist hilfreich, um Netzdaten besser sichtbar zu machen.

![Screenshot Karte mit Hervorhebung des Schiebereglers für die Transparenz der Karte](/images/manual/teil-a/map_opacity.jpg)

Auf der rechten Seite befindet sich die **interaktive Legende** („Layer“-Menü) mit den Einträgen „Adresse“, „Netzknoten“, „Trasse“, „Rohr“, „Gebiet“ und „OpenStreetMap“. Über die Symbole an den Einträgen können Sie:

- Objektarten (Layer) ein- oder ausblenden
- Beschriftungen anzeigen oder verbergen
- mit „Auf Ausdehnung zoomen“ die Ansicht auf alle Objekte eines Layers ausrichten
- die Einträge „Netzknoten“ und „Gebiet“ über den kleinen Pfeil links aufklappen und die einzelnen Typen getrennt schalten
- die Hintergrundkarte über den Eintrag „OpenStreetMap“ ausblenden oder in den Dunkelmodus wechseln

Nicht jeder Eintrag bietet alle Möglichkeiten: Beim Eintrag „Rohr“ steht ausschließlich „Leitungsbeschriftungen anzeigen“ zur Verfügung.

::: warning
Beschriftungen werden erst ab einer ausreichenden Zoomstufe eingeblendet. Wenn sich nach dem Einschalten nichts sichtbar ändert, zoomen Sie weiter in die Karte hinein.
:::

![Screenshot Karte mit Hervorhebung der Legende oben rechts](/images/manual/teil-a/map_legend.jpg)
![Vier Screenshots der Karte mit verschiedenen Einstellungen in der Legende](/images/manual/teil-a/map_legend_actions.jpg)
{.img-row}

Mit „Auf Ausdehnung zoomen“ beim Eintrag „Adresse“ gelangen Sie in den Bereich, in dem für das gewählte Projekt Daten vorhanden sind.

![Screenshot Karte mit Hervorhebung des Layers Adresse in der Legende rechts oben](/images/manual/teil-a/map_address_detail.jpg)
![Screenshot Karte nach dem Zoom auf die Ausdehnung des Layers Adresse](/images/manual/teil-a/map_address_detail_select.jpg)
{.img-row}

## 3.4 Objekte in der Karte suchen

Oben links im Kartenfenster befindet sich eine **Suchfunktion**. Hier können Sie gezielt nach Adressen, Netzknoten, Trassen, Rohren und Gebieten suchen.

![Screenshot Karte mit Hervorhebung des Suchfeldes oben links](/images/manual/teil-a/map_search.jpg)

Dazu gehen Sie folgendermaßen vor:

1. Geben Sie einen Begriff oder einen Teil davon in das Suchfeld ein.
2. Drücken Sie Enter oder klicken Sie auf das Lupensymbol.
3. Die Trefferliste öffnet sich unterhalb des Suchfeldes und nennt die Anzahl der Treffer.
4. Jeder Treffer ist mit seiner Objektart gekennzeichnet.
5. Ab zehn Treffern erscheint im Kopf der Liste das Feld „Filtern“, mit dem Sie die Liste weiter einschränken.
6. Klicken Sie auf einen Treffer: Die Karte springt an die passende Stelle und das Objekt blinkt dreimal auf.

![Vier Screenshots des Suchablaufs in der Karte, nummeriert von 1 bis 6](/images/manual/teil-a/map_search_flow.jpg)

::: info
Ein Treffer öffnet den Infobereich **nicht**. Die Karte springt nur an die passende Stelle; klicken Sie das Objekt anschließend in der Karte an, um die Details zu sehen, siehe Kapitel [Karte](./05-karte.md).
:::

## 3.5 Strecke und Fläche messen

_Die Dokumentation zu diesem Abschnitt ist noch in Arbeit._

## 3.6 Der Infobereich mit seinen Reitern

Wenn Sie ein Objekt auswählen, öffnet sich am rechten Rand eine Detailanzeige. Diese **Info-Box** überlagert die Ansicht, ohne den Kartenausschnitt oder die Tabelle darunter zu verändern. Welche Reiter sie enthält, hängt von der Objektart ab; „Eigenschaften“ und „Anhänge“ gibt es immer.

Die Angaben im Reiter „Eigenschaften“ sind je nach Ansicht nur zur Information oder bearbeitbar – in der Karte lesen Sie sie, in der Rohrverwaltung ändern Sie sie. Im Reiter „Aktionen“ finden Sie weiterführende Ansichten zum ausgewählten Objekt. Der Reiter „Anhänge“ ist überall bearbeitbar, siehe Abschnitt [Anhänge hochladen, ansehen und löschen](#_3-7-anhange-hochladen-ansehen-und-loschen).

Ist die Info-Box zu schmal, ziehen Sie sie am linken Rand über den Griff „Größe der Seitenleiste ändern“ breiter. Über das Kreuz „Seitenleiste schließen“ schließen Sie sie.

::: info
Die eingestellte Breite gilt für alle Ansichten mit einer Info-Box, nicht nur für die, in der Sie sie geändert haben.
:::

## 3.7 Anhänge hochladen, ansehen und löschen

Zu Kartenobjekten, Rohren und Adressen können Sie Dateien ablegen; der Reiter „Anhänge“ steht deshalb bei allen diesen Objektarten zur Verfügung. Zum Hinzufügen klicken Sie im Bereich „Dateien hochladen“ auf „Dateien auswählen“ oder ziehen die Datei auf die Fläche „Dateien auswählen oder hierher ziehen“. Die maximale Dateigröße beträgt 50 MB.

Vorhandene Dateien stehen darunter im Bereich „Hochgeladene Dateien“, zusammengefasst in Ordnern, die nach ihrer Art benannt sind und die Anzahl enthalten, z. B. „documents (1)“. Klicken Sie auf einen Ordner, um ihn aufzuklappen – erst dann werden die einzelnen Dateien sichtbar. Zeigen Sie anschließend mit der Maus auf eine Datei, erscheinen rechts neben dem Dateinamen die Schaltflächen „Herunterladen“, „Umbenennen“ und „Datei löschen“; beim Löschen bestätigen Sie die Rückfrage.

Bei vielen Dateien hilft das Feld „Dateien suchen“ oberhalb der Liste. Sind die Schaltflächen nicht sichtbar, ist Ihr Fenster zu schmal: Scrollen Sie in der Info-Box nach rechts oder ziehen Sie die Box breiter.

![](/videos/map_attachment.webm)

## 3.8 Exportformate im Überblick

_Die Dokumentation zu diesem Abschnitt ist noch in Arbeit._
