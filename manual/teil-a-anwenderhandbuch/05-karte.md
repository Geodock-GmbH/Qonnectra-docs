# 5. Karte

Die Karte ist eines der zentralen Werkzeuge in Qonnectra. Sie dient der visuellen Darstellung des Netzbestands, der Orientierung im Raum und dem schnellen Aufruf von Informationen zu einzelnen Netzobjekten. Sie erreichen die Karte über die linke Navigation durch Klicken auf den Menüpunkt „Karte“.

![Screenshot Karte](/images/manual/teil-a/map.jpg)

Solange kein Objekt ausgewählt ist, erscheint unten in der Karte der Hinweis „Klicken Sie auf einen Layer um das Objekt abzufragen.“ Er verschwindet, sobald Sie ein Objekt anklicken.

## 5.1 Bewegung in der Karte

Sie können in der Karte auf verschiedene Arten navigieren: Zoomen Sie mit dem Mausrad oder dem Touchpad hinein und heraus. Verschieben Sie den Kartenausschnitt mit gedrückter linker Maustaste.

Wenn Sie bei geöffneter Karte ein anderes Projekt auswählen, springt die Karte nicht automatisch in dessen Gebiet. Um dorthin zu gelangen, klicken Sie in der Legende oben rechts beim Eintrag „Adresse“ auf das Lupensymbol „Auf Ausdehnung zoomen“. Damit navigiert die Ansicht in den Bereich, in dem für dieses Projekt Daten vorhanden sind.

![Screenshot Karte mit Hervorhebung des Layers Adresse in der Legende rechts oben](/images/manual/teil-a/map_address_detail.jpg)
![Screenshot Karte nach dem Zoom auf die Ausdehnung des Layers Adresse](/images/manual/teil-a/map_address_detail_select.jpg)
{.img-row}

Hinweis: Qonnectra merkt sich den letzten Kartenausschnitt. Wenn Sie die Karte erneut öffnen, sehen Sie wieder die Stelle, an der Sie zuletzt gearbeitet haben.

## 5.2 Anpassung der Darstellung

Links unten in der Kartenansicht finden Sie den Regler „Transparenz“, mit dem Sie die **Transparenz** der Hintergrundkarte anpassen können. Der aktuelle Wert steht als Prozentangabe rechts neben der Bezeichnung. Dies ist hilfreich, um Netzdaten besser sichtbar zu machen.

![Screenshot Karte mit Hervorhebung des Schiebereglers für die Transparenz der Karte](/images/manual/teil-a/map_opacity.jpg)

Auf der rechten Seite befindet sich die **interaktive Legende** („Layer“-Menü) mit den Einträgen „Adresse“, „Netzknoten“, „Trasse“, „Rohr“, „Gebiet“ und „OpenStreetMap“. Über die Symbole an den Einträgen können Sie:

- Objektarten (Layer) ein- oder ausblenden („Layer anzeigen“ bzw. „Layer ausblenden“)
- Beschriftungen anzeigen oder verbergen („Beschriftungen anzeigen“ bzw. „Beschriftungen ausblenden“)
- Mit „Auf Ausdehnung zoomen“ die Ansicht auf alle Objekte eines Layers ausrichten
- Layergruppen über den kleinen Pfeil links am Eintrag ein- oder ausklappen
- Die Hintergrundkarte über den Eintrag „OpenStreetMap“ ausblenden oder in den Dunkelmodus wechseln

Nicht jeder Eintrag bietet alle Möglichkeiten. Beim Eintrag „Rohr“ steht ausschließlich die Schaltfläche „Leitungsbeschriftungen anzeigen“ zur Verfügung. Ausklappen lassen sich standardmäßig die Einträge „Netzknoten“ und „Gebiet“ – dort sehen Sie die einzelnen Typen und können sie einzeln ein- und ausblenden.

Wichtig: Beschriftungen werden erst ab einer ausreichenden Zoomstufe eingeblendet. Wenn sich nach dem Einschalten nichts sichtbar ändert, zoomen Sie weiter in die Karte hinein.

Über der Legende können Sie mit dem Pfeil links neben „Layer“ die gesamte Liste einklappen, wenn Sie mehr von der Karte sehen möchten.

![Screenshot Karte mit Hervorhebung der Legende oben rechts](/images/manual/teil-a/map_legend.jpg)
![Vier Screenshots der Karte mit verschiedenen Einstellungen in der Legende](/images/manual/teil-a/map_legend_actions.jpg)
{.img-row}

## 5.3 Auswahl von Objekten

Wenn Sie ein Objekt (z. B. eine Trasse oder einen Netzknoten) auf der Karte anklicken, öffnet sich auf der rechten Seite eine Detailanzeige. Diese **Info-Box** überlagert die Karte, ohne den Kartenausschnitt zu verändern.

Die Reiter der Info-Box stehen untereinander am linken Rand der Box. Welche Reiter angezeigt werden, hängt von der Objektart ab:

- Trasse: „Eigenschaften“, „Rohrübersicht“, „Kabelübersicht“, „Aktionen“, „Anhänge“
- Netzknoten: „Eigenschaften“, „Aktionen“, „Anhänge“
- Adresse: „Eigenschaften“, „Aktionen“, „Anhänge“
- Gebiet: „Eigenschaften“, „Anhänge“

Die Angaben im Reiter „Eigenschaften“ sind nicht bearbeitbar, sondern dienen als Informationsquelle. Der Reiter „Rohrübersicht“ zeigt die Rohre der Trasse, siehe Kapitel [Rohrverwaltung](./06-rohrverwaltung.md), „Kabelübersicht“ die darin liegenden Kabel.

Im Reiter „Aktionen“ finden Sie weiterführende Ansichten zum ausgewählten Objekt, etwa „Grabenprofil anzeigen“ bei einer Trasse oder „Slot-Konfiguration anzeigen“, „Struktur anzeigen“ und „Folgen“ bei einem Netzknoten. Bearbeiten können Sie ausschließlich den Reiter „Anhänge“ – die Informationen dazu entnehmen Sie dem Abschnitt [Anhänge von Kartenobjekten](#_5-3-1-anhange-von-kartenobjekten).

Sobald Sie ein anderes Objekt auswählen, ändern sich die Einträge in der Info-Box entsprechend dem selektierten Element.

Sie können die Info-Box über das Kreuz „Seitenleiste schließen“ oben rechts in der Box schließen. Alternativ heben Sie die Auswahl auf, indem Sie in einen Bereich der Karte klicken, der kein Element enthält. Das ist innerhalb eines Projektgebiets allerdings kaum möglich, weil dessen Fläche die gesamte Umgebung überdeckt – in diesem Fall ist das Kreuz der schnellere Weg. Wenn Sie die Auswahl dennoch per Klick aufheben möchten, zoomen Sie aus der Karte heraus und klicken Sie in einen Bereich außerhalb des Elements.

Ist die Info-Box zu schmal, ziehen Sie sie am linken Rand über den Griff „Größe der Seitenleiste ändern“ breiter.

![Screenshot Karte mit Hervorhebung eines ausgewählten Objekts und der Anzeige der Details in einer Info-Box rechts](/images/manual/teil-a/map_selected_object.jpg)

Hinweis: Wenn Sie ein Objekt über die Suche auswählen, öffnet sich die Info-Box **nicht**. Die Karte springt dann nur an die passende Stelle. Um die Details zu sehen, klicken Sie das Objekt anschließend in der Karte an.

### 5.3.1 Anhänge von Kartenobjekten

Zu jedem Kartenobjekt können Sie Dateien ablegen. Der Reiter „Anhänge“ steht deshalb bei allen Objektarten zur Verfügung. Hier können Sie Anhänge hinzufügen, herunterladen, umbenennen oder löschen.

Zum Hinzufügen klicken Sie im Bereich „Dateien hochladen“ auf „Dateien auswählen“ oder ziehen Sie die Datei auf die Fläche „Dateien auswählen oder hierher ziehen“. Die maximale Dateigröße beträgt 50 MB.

Vorhandene Dateien stehen darunter im Bereich „Hochgeladene Dateien“. Sind noch keine vorhanden, erscheint stattdessen „Keine Dateien hochgeladen“. Die Dateien sind in Ordnern zusammengefasst, die nach ihrer Art benannt sind und die Anzahl enthalten, z. B. „documents (1)“. Gehen Sie so vor:

1. Klicken Sie auf den Ordner, um ihn aufzuklappen. Erst dann werden die einzelnen Dateien sichtbar.
2. Zeigen Sie mit der Maus auf eine Datei. Rechts neben dem Dateinamen erscheinen drei Symbolschaltflächen; ihre Tooltips lauten „Herunterladen“, „Umbenennen“ und „Datei löschen“.
3. Klicken Sie auf die gewünschte Schaltfläche. Beim Löschen bestätigen Sie die Rückfrage.

Wichtig: Solange der Ordner zugeklappt ist, erscheinen die Symbolschaltflächen nicht.

Bei vielen Dateien hilft das Feld „Dateien suchen“ oberhalb der Liste. Sollten die Symbolschaltflächen nicht sichtbar sein, ist eventuell Ihr Fenster zu klein. Sie können in der Info-Box nach links und rechts scrollen oder die Box am linken Rand breiter ziehen.

![](/videos/map_attachment.webm)

## 5.4 Suche

Oben links befindet sich eine **Suchfunktion**. Hier können Sie gezielt nach Adressen, Netzknoten, Trassen, Rohren und Gebieten suchen.

![Screenshot Karte mit Hervorhebung des Suchfeldes oben links](/images/manual/teil-a/map_search.jpg)

Dazu gehen Sie folgendermaßen vor:

1. Geben Sie einen Begriff oder einen Teil davon in das Suchfeld ein.
2. Drücken Sie Enter oder klicken Sie auf das orange Lupen-Symbol.
3. Die Trefferliste öffnet sich direkt unterhalb des Suchfeldes. Links oben steht die Anzahl der Treffer.
4. Jeder Treffer ist in Großbuchstaben mit seiner Objektart gekennzeichnet, etwa „Adresse“, „Netzknoten“ oder „Trasse“.
5. Ab zehn Treffern erscheint im Kopf der Liste das Feld „Filtern“. Damit schränken Sie die Liste weiter ein; die Anzeige wechselt dann auf die Form „2 / 46“.
6. Klicken Sie auf einen Treffer. Die Karte springt an die passende Stelle, das Objekt blinkt dreimal auf und das Suchfeld wird geleert.

![Vier Screenshots des Suchablaufs in der Karte, nummeriert von 1 bis 6](/images/manual/teil-a/map_search_flow.jpg)

Die Suche findet auch Teilbegriffe. Sie müssen also nicht die vollständige Bezeichnung kennen.

Sollten Sie sich Details zu diesem Objekt anzeigen lassen wollen, klicken Sie auf das Objekt in der Karte (siehe [Auswahl von Objekten](#_5-3-auswahl-von-objekten)).
