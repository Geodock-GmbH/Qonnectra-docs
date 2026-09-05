# 5. Karte

Die Karte ist eines der zentralen Werkzeuge in Qonnectra. Sie dient der visuellen Darstellung des Netzbestands, der Orientierung im Raum und dem schnellen Aufruf von Informationen zu einzelnen Netzobjekten. Sie erreichen die Karte über die linke Navigation durch Klicken auf den Menüpunkt „Karte“.

![Screenshot Karte](/images/manual/teil-a/map.jpg)

## 5.1 Bewegung in der Karte

Sie können in der Karte auf verschiedene Arten navigieren: Zoomen Sie mit dem Mausrad oder dem Touchpad hinein und heraus. Verschieben Sie den Kartenausschnitt mit gedrückter linker Maustaste.

Wenn Sie bei geöffneter Karte ein anderes Projekt auswählen, springt die Karte nicht automatisch in dessen Gebiet. Um dorthin zu gelangen, klicken Sie in der Legende oben rechts beim Eintrag „Adresse“ auf das Lupensymbol „Auf Ausdehnung zoomen“. Damit navigiert die Ansicht in den Bereich, in dem für dieses Projekt Daten vorhanden sind.

![Screenshot Karte mit Hervorhebung des Layers Adresse in der Legende rechts oben](/images/manual/teil-a/map_address_detail.jpg)
![Screenshot Karte nach dem Zoom auf die Ausdehnung des Layers Adresse](/images/manual/teil-a/map_address_detail_select.jpg)
{.img-row}

::: info
Qonnectra merkt sich den letzten Kartenausschnitt. Wenn Sie die Karte erneut öffnen, sehen Sie wieder die Stelle, an der Sie zuletzt gearbeitet haben.
:::

## 5.2 Anpassung der Darstellung

Links unten in der Kartenansicht finden Sie den Regler „Transparenz“, mit dem Sie die **Transparenz** der Hintergrundkarte anpassen können. Dies ist hilfreich, um Netzdaten besser sichtbar zu machen.

![Screenshot Karte mit Hervorhebung des Schiebereglers für die Transparenz der Karte](/images/manual/teil-a/map_opacity.jpg)

Auf der rechten Seite befindet sich die **interaktive Legende** („Layer“-Menü) mit den Einträgen „Adresse“, „Netzknoten“, „Trasse“, „Rohr“, „Gebiet“ und „OpenStreetMap“. Über die Symbole an den Einträgen können Sie:

- Objektarten (Layer) ein- oder ausblenden
- Beschriftungen anzeigen oder verbergen
- mit „Auf Ausdehnung zoomen“ die Ansicht auf alle Objekte eines Layers ausrichten
- die Einträge „Netzknoten“ und „Gebiet“ über den kleinen Pfeil links aufklappen und die einzelnen Typen getrennt schalten
- die Hintergrundkarte über den Eintrag „OpenStreetMap“ ausblenden oder in den Dunkelmodus wechseln

Nicht jeder Eintrag bietet alle Möglichkeiten: Beim Eintrag „Rohr“ steht ausschließlich „Leitungsbeschriftungen anzeigen“ zur Verfügung. Mit dem Pfeil links neben „Layer“ klappen Sie die gesamte Liste ein, wenn Sie mehr von der Karte sehen möchten.

::: warning
Beschriftungen werden erst ab einer ausreichenden Zoomstufe eingeblendet. Wenn sich nach dem Einschalten nichts sichtbar ändert, zoomen Sie weiter in die Karte hinein.
:::

![Screenshot Karte mit Hervorhebung der Legende oben rechts](/images/manual/teil-a/map_legend.jpg)
![Vier Screenshots der Karte mit verschiedenen Einstellungen in der Legende](/images/manual/teil-a/map_legend_actions.jpg)
{.img-row}

## 5.3 Auswahl von Objekten

Wenn Sie ein Objekt (z. B. eine Trasse oder einen Netzknoten) auf der Karte anklicken, öffnet sich auf der rechten Seite eine Detailanzeige. Diese **Info-Box** überlagert die Karte, ohne den Kartenausschnitt zu verändern. Ihre Reiter stehen untereinander am linken Rand der Box und hängen von der Objektart ab:

- Trasse: „Eigenschaften“, „Rohrübersicht“, „Kabelübersicht“, „Aktionen“, „Anhänge“
- Netzknoten und Adresse: „Eigenschaften“, „Aktionen“, „Anhänge“
- Gebiet: „Eigenschaften“, „Anhänge“

Die Angaben im Reiter „Eigenschaften“ sind nicht bearbeitbar, sondern dienen als Informationsquelle. Der Reiter „Rohrübersicht“ zeigt die Rohre der Trasse, siehe Kapitel [Rohrverwaltung](./06-rohrverwaltung.md), „Kabelübersicht“ die darin liegenden Kabel. Im Reiter „Aktionen“ finden Sie weiterführende Ansichten zum ausgewählten Objekt, etwa „Grabenprofil anzeigen“ bei einer Trasse oder „Struktur anzeigen“ bei einem Netzknoten. Bearbeiten können Sie ausschließlich den Reiter „Anhänge“, siehe Abschnitt [Anhänge von Kartenobjekten](#_5-3-1-anhange-von-kartenobjekten).

Ist die Info-Box zu schmal, ziehen Sie sie am linken Rand über den Griff „Größe der Seitenleiste ändern“ breiter. Schließen können Sie sie über das Kreuz „Seitenleiste schließen“ oben rechts in der Box. Ein Klick auf eine freie Stelle der Karte hebt die Auswahl ebenfalls auf – innerhalb eines Projektgebiets ist das allerdings kaum möglich, weil dessen Fläche die gesamte Umgebung überdeckt.

![Screenshot Karte mit Hervorhebung eines ausgewählten Objekts und der Anzeige der Details in einer Info-Box rechts](/images/manual/teil-a/map_selected_object.jpg)

::: info
Wenn Sie ein Objekt über die Suche auswählen, öffnet sich die Info-Box **nicht**. Die Karte springt dann nur an die passende Stelle; klicken Sie das Objekt anschließend in der Karte an, um die Details zu sehen.
:::

### 5.3.1 Anhänge von Kartenobjekten

Zu jedem Kartenobjekt können Sie Dateien ablegen; der Reiter „Anhänge“ steht deshalb bei allen Objektarten zur Verfügung. Zum Hinzufügen klicken Sie im Bereich „Dateien hochladen“ auf „Dateien auswählen“ oder ziehen die Datei auf die Fläche „Dateien auswählen oder hierher ziehen“. Die maximale Dateigröße beträgt 50 MB.

Vorhandene Dateien stehen darunter im Bereich „Hochgeladene Dateien“, zusammengefasst in Ordnern, die nach ihrer Art benannt sind und die Anzahl enthalten, z. B. „documents (1)“. Klicken Sie auf einen Ordner, um ihn aufzuklappen – erst dann werden die einzelnen Dateien sichtbar. Zeigen Sie anschließend mit der Maus auf eine Datei, erscheinen rechts neben dem Dateinamen die Schaltflächen „Herunterladen“, „Umbenennen“ und „Datei löschen“; beim Löschen bestätigen Sie die Rückfrage.

Bei vielen Dateien hilft das Feld „Dateien suchen“ oberhalb der Liste. Sind die Schaltflächen nicht sichtbar, ist Ihr Fenster zu schmal: Scrollen Sie in der Info-Box nach rechts oder ziehen Sie die Box breiter.

![](/videos/map_attachment.webm)

## 5.4 Suche

Oben links befindet sich eine **Suchfunktion**. Hier können Sie gezielt nach Adressen, Netzknoten, Trassen, Rohren und Gebieten suchen.

![Screenshot Karte mit Hervorhebung des Suchfeldes oben links](/images/manual/teil-a/map_search.jpg)

Dazu gehen Sie folgendermaßen vor:

1. Geben Sie einen Begriff oder einen Teil davon in das Suchfeld ein.
2. Drücken Sie Enter oder klicken Sie auf das Lupensymbol.
3. Die Trefferliste öffnet sich direkt unterhalb des Suchfeldes; links oben steht die Anzahl der Treffer.
4. Jeder Treffer ist mit seiner Objektart gekennzeichnet, etwa „Adresse“, „Netzknoten“ oder „Trasse“.
5. Ab zehn Treffern erscheint im Kopf der Liste das Feld „Filtern“, mit dem Sie die Liste weiter einschränken.
6. Klicken Sie auf einen Treffer: Die Karte springt an die passende Stelle und das Objekt blinkt dreimal auf.

![Vier Screenshots des Suchablaufs in der Karte, nummeriert von 1 bis 6](/images/manual/teil-a/map_search_flow.jpg)

Sollten Sie sich Details zu diesem Objekt anzeigen lassen wollen, klicken Sie auf das Objekt in der Karte (siehe [Auswahl von Objekten](#_5-3-auswahl-von-objekten)).
