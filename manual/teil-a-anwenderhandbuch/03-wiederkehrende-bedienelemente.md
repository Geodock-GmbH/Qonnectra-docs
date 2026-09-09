# 3. Wiederkehrende Bedienelemente

Einige Bedienelemente von Qonnectra tauchen in mehreren Ansichten unverändert auf: das Kartenfenster mit seiner Legende, die Objektsuche, die Info-Box am rechten Rand und die Anhänge. Dieses Kapitel beschreibt sie einmal; die Kapitel zu den einzelnen Menüpunkten verweisen darauf und nennen nur noch, was dort davon abweicht.

## 3.1 Tabellen: Suche, Spaltenfilter, Sortierung, Seitenwechsel

Die Rohrverwaltung, die Adressen und die Leitungsauskunft führen ihren Bestand in einer Tabelle auf. Diese drei Tabellen sind gleich aufgebaut und werden gleich bedient. Ein Klick auf eine Zeile öffnet den zugehörigen Datensatz: in der Rohrverwaltung in der Info-Box am rechten Rand, bei den Adressen und der Leitungsauskunft auf einer eigenen Seite.

**Sortieren**

Ein Klick auf eine Spaltenüberschrift sortiert die Tabelle nach dieser Spalte: der erste Klick aufsteigend, der zweite absteigend, der dritte hebt die Sortierung wieder auf. Das Symbol rechts neben der Überschrift zeigt, wonach gerade sortiert wird.

**Suchfeld über der Tabelle**

Das Suchfeld über der Tabelle durchsucht den gesamten Bestand des Projekts. Geben Sie einen Suchbegriff ein und drücken Sie Enter oder klicken Sie auf das Lupensymbol. Die Tabelle beginnt danach wieder bei Seite 1 und enthält nur noch die passenden Datensätze; die Gesamtzahl unter der Tabelle passt sich an. Um wieder alle Datensätze zu sehen, leeren Sie das Feld und lösen die Suche erneut aus.

![Screenshot Rohrverwaltung mit Hervorhebung des Suchfeldes oben; die Tabelle darunter zeigt nur noch die drei Treffer](/images/manual/teil-a/conduit_search.jpg)

**Suchfelder unter den Spaltenüberschriften**

Unter jeder Spaltenüberschrift liegt ein eigenes Suchfeld. Diese Felder arbeiten bereits beim Tippen, ohne Enter, und lassen sich miteinander kombinieren: Ein Datensatz bleibt nur stehen, wenn er zu allen ausgefüllten Feldern passt. Zum Aufheben leeren Sie die Felder wieder.

![Screenshot Rohrverwaltung mit Hervorhebung der Suchfelder unter den Spaltenüberschriften](/images/manual/teil-a/conduit_search_columns.jpg)

**Seitenwechsel**

Eine Seite umfasst 50 Datensätze. Unter der Tabelle stehen links die Gesamtzahl, z. B. „123 Ergebnisse“, und rechts die Seitenauswahl mit den Pfeilen für die vorherige und die nächste Seite. Bleibt kein Datensatz übrig, erscheint anstelle der Zeilen „Keine Ergebnisse gefunden“.

::: warning
Sortierung und Spaltenfilter wirken nur auf die angezeigte Seite. Bei mehr als einer Seite bleibt ein Datensatz von einer anderen Seite außen vor – auch wenn er alphabetisch an erster Stelle stünde. Für den gesamten Bestand ist das Suchfeld über der Tabelle zuständig; nur dadurch ändert sich auch die Gesamtzahl.
:::

Welche Spalten eine Tabelle hat, nennt das Kapitel zu der jeweiligen Ansicht.

## 3.2 Auswahllisten und Kombinationsfelder

Werte, die aus einer festen Liste stammen – Rohrtyp, Status, Netzebene, Firmen, Kennzeichen –, wählen Sie in einem **Kombinationsfeld**: einem Eingabefeld mit einem Pfeil am rechten Rand. Über den Pfeil öffnen Sie die vollständige Liste, über eine Eingabe in das Feld schränken Sie sie ein. Das bekannteste davon ist die Projektauswahl in der Kopfzeile, siehe Abschnitt [Projekt auswählen und wechseln](./01-erste-schritte.md#_1-3-projekt-auswahlen-und-wechseln).

Ihre Eingabe muss nicht am Anfang eines Eintrags stehen, und die Suche verzeiht Tippfehler: Auch eine ungefähre Schreibweise führt in der Regel noch zum passenden Eintrag.

::: warning
Findet Ihre Eingabe keinen Eintrag, bleibt die Liste nicht leer, sondern zeigt wieder alle Einträge. Eine volle Liste bedeutet also nicht, dass Ihre Eingabe gepasst hat.
:::

::: info
Die Eingabe allein wählt nichts aus – erst der Klick auf einen Eintrag übernimmt den Wert in das Feld.
:::

Sind für ein Feld überhaupt keine Werte hinterlegt, erscheint anstelle des Feldes der Hinweis „Keine Daten verfügbar“. Die Auswahlwerte sind Stammdaten, siehe Abschnitt [Stammdaten](./02-grundbegriffe-und-datenmodell.md#_2-7-stammdaten-status-phase-netzebene-firmen); gepflegt werden sie im Administrationsbereich, siehe Kapitel [Projekte und Stammdaten pflegen](../teil-b-betrieb-admin-qgis/21-projekte-und-stammdaten.md).

## 3.3 Das Kartenfenster

Ein Kartenfenster gibt es in der Karte selbst sowie in der Rohrzuordnung, den Mikrorohren, der Störungsanalyse, der Leitungsauskunft und der Wertermittlung. In diesen Ansichten verhält es sich gleich; dieser Abschnitt beschreibt es.

Das Netzschema selbst ist ein Diagramm und enthält keine Karte. Ein Kartenfenster erscheint dort erst im Fenster „Kabel-Mikrorohr Verknüpfung“: Klicken Sie ein Kabel an und öffnen Sie es in der Info-Box über den Reiter „Aktionen“ mit „Mit Mikrorohr verbinden“, siehe Kapitel [Netzschema](./14-netzschema.md).

::: info
Die Nachverdichtung und die Detailansicht einer Adresse enthalten ebenfalls eine Karte, dort aber in einer verkleinerten Form ohne Suche, Legende und Transparenzregler. Sie dient nur der Lagekontrolle.

Der Faserweg zeigt neben seinem Ergebnis eine eigene Karte, die nicht das hier beschriebene Kartenfenster ist: Sie zeichnet ausschließlich den ermittelten Weg, und Suche, Legende, Transparenzregler und Messen fehlen. Ein Klick wählt darin ein Element des Wegs aus. Beschrieben wird sie in Kapitel [Faserweg](./15-faserweg.md).
:::

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

Der Eintrag „Trasse“ lässt sich zusätzlich aufklappen, sobald Sie unter „Einstellungen“ die „Trassen-Darstellung“ von „Einzelne Farbe“ auf „Nach Oberfläche“ oder „Nach Bauart“ umgestellt haben. Sie schalten dann die einzelnen Oberflächen oder Bauarten getrennt, siehe Kapitel [Einstellungen](./17-einstellungen.md).

::: info
Hat Ihre Administration für das Projekt externe Kartendienste (WMS) hinterlegt, stehen diese unterhalb der aufgeführten Einträge als eigene, aufklappbare Gruppe. Das Einrichten beschreibt Kapitel [QGIS-Server und Kartendienste](../teil-b-betrieb-admin-qgis/27-qgis-server-und-kartendienste.md).
:::

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

**Objekte anklicken**

Ein Klick in die Karte wählt das Objekt darunter aus. Zwei Eigenheiten des Netzbestands machen das schwerer, als es klingt: Trassen sind nur wenige Pixel breit und laufen an Netzknoten zusammen, und die Fläche eines Projektgebiets liegt unter dem gesamten Netz. Innerhalb eines Gebiets trifft ein Klick deshalb leicht dessen Fläche, die daraufhin die ganze Karte in der Auswahlfarbe überdeckt.

::: warning
Treffen Sie nicht das gewünschte Objekt, zoomen Sie weiter in die Karte hinein oder blenden Sie den Layer „Gebiet“ in der Legende vorübergehend aus. In den verkleinerten Karten der Nachverdichtung und der Adressdetails ist das nicht möglich, weil sie keine Legende haben.
:::

## 3.4 Objekte in der Karte suchen

Oben links im Kartenfenster befindet sich eine **Suchfunktion**. Hier können Sie gezielt nach Adressen, Netzknoten, Trassen, Rohren und Gebieten suchen.

![Screenshot Karte mit Hervorhebung des Suchfeldes oben links](/images/manual/teil-a/map_search.jpg)

Dazu gehen Sie folgendermaßen vor:

1. Geben Sie einen Begriff oder einen Teil davon in das Suchfeld ein.
2. Drücken Sie Enter oder klicken Sie auf das Lupensymbol.
3. Die Trefferliste öffnet sich unterhalb des Suchfeldes und nennt die Anzahl der Treffer.
4. Jeder Treffer ist mit seiner Objektart gekennzeichnet.
5. Ab zehn Treffern erscheint im Kopf der Liste das Feld „Filtern...“, mit dem Sie die Liste weiter einschränken.
6. Klicken Sie auf einen Treffer: Die Karte springt an die passende Stelle und das Objekt blinkt dreimal auf.

![Vier Screenshots des Suchablaufs in der Karte, nummeriert von 1 bis 6](/images/manual/teil-a/map_search_flow.jpg)

::: info
Ein Treffer öffnet die Info-Box **nicht**. Die Karte springt nur an die passende Stelle; klicken Sie das Objekt anschließend in der Karte an, um die Details zu sehen, siehe Kapitel [Karte](./05-karte.md).
:::

## 3.5 Strecke und Fläche messen

In jedem Kartenfenster können Sie Entfernungen und Flächen abgreifen, ohne etwas an den Daten zu ändern. Klicken Sie mit der rechten Maustaste in die Karte; das Kontextmenü bietet „Strecke messen“ und „Fläche messen“.

1. Wählen Sie „Strecke messen“ oder „Fläche messen“. Der Mauszeiger wird zum Fadenkreuz.
2. Klicken Sie nacheinander die Punkte der Strecke oder die Eckpunkte der Fläche an.
3. Während des Zeichnens nennt eine Beschriftung an der Zeichnung fortlaufend den aktuellen Wert.
4. Ein Doppelklick beendet die Zeichnung; der Wert bleibt daran stehen.

Strecken unter 100 m stehen in Metern, längere in Kilometern; Flächen unter 10.000 m² in Quadratmetern, größere in Quadratkilometern – jeweils auf zwei Nachkommastellen gerundet.

Zum Aufräumen klicken Sie erneut mit der rechten Maustaste und wählen „Messung beenden“. Das entfernt die Zeichnung und schaltet zurück in die normale Bedienung.

![](/videos/map_measure.webm)

::: warning
Ein Klick während einer Messung setzt nicht nur einen Messpunkt, sondern wählt zugleich das Objekt darunter aus und öffnet die Info-Box – mit den Folgen, die Abschnitt [Das Kartenfenster](#_3-3-das-kartenfenster) unter „Objekte anklicken“ beschreibt. Blenden Sie den Layer „Gebiet“ aus, bevor Sie in einem Projektgebiet messen.
:::

::: info
Es gibt immer nur eine Messung: Eine neue ersetzt die vorherige. Messergebnisse werden nicht gespeichert und sind in keinem Export enthalten.
:::

## 3.6 Die Info-Box mit ihren Reitern

Wenn Sie ein Objekt auswählen, öffnet sich am rechten Rand die **Info-Box**. Sie überlagert die Ansicht, ohne den Kartenausschnitt oder die Tabelle darunter zu verändern. Welche Reiter sie enthält, hängt von der Objektart ab; „Eigenschaften“ und „Anhänge“ gibt es immer.

Die Angaben im Reiter „Eigenschaften“ sind je nach Ansicht nur zur Information oder bearbeitbar – in der Karte lesen Sie sie, in der Rohrverwaltung ändern Sie sie. Im Reiter „Aktionen“ finden Sie weiterführende Ansichten zum ausgewählten Objekt. Der Reiter „Anhänge“ ist überall bearbeitbar, siehe Abschnitt [Anhänge hochladen, ansehen und löschen](#_3-7-anhange-hochladen-ansehen-und-loschen).

Ist die Info-Box zu schmal, ziehen Sie sie am linken Rand über den Griff „Größe der Seitenleiste ändern“ breiter. Über das Kreuz „Seitenleiste schließen“ schließen Sie sie.

::: info
Die Anwendung nennt die Info-Box in diesen beiden Beschriftungen „Seitenleiste“ – dasselbe Wort, das sie in „Seitenleiste anpassen“ für die Navigationsleiste am linken Rand verwendet (siehe Abschnitt [Navigationsleiste anpassen](./01-erste-schritte.md#_1-5-navigationsleiste-anpassen)). Gemeint sind zwei verschiedene Dinge; dieses Handbuch nennt die Anzeige am rechten Rand durchgehend Info-Box.
:::

::: info
Die eingestellte Breite gilt für alle Ansichten mit einer Info-Box, nicht nur für die, in der Sie sie geändert haben.
:::

## 3.7 Anhänge hochladen, ansehen und löschen

Zu Kartenobjekten, Rohren und Adressen können Sie Dateien ablegen; der Reiter „Anhänge“ steht deshalb bei allen diesen Objektarten zur Verfügung. Zum Hinzufügen klicken Sie im Bereich „Dateien hochladen“ auf „Dateien auswählen“ oder ziehen die Datei auf die Fläche „Dateien auswählen oder hierher ziehen“. Die maximale Dateigröße beträgt 50 MB.

Vorhandene Dateien stehen darunter im Bereich „Hochgeladene Dateien“, zusammengefasst in Ordnern mit der Anzahl dahinter, z. B. „documents (1)“. Die Ordnernamen kommen aus der Ablagestruktur und sind deshalb englisch. Klicken Sie auf einen Ordner, um ihn aufzuklappen – erst dann werden die einzelnen Dateien sichtbar. Zeigen Sie anschließend mit der Maus auf eine Datei, erscheinen rechts neben dem Dateinamen die Schaltflächen „Herunterladen“, „Umbenennen“ und „Datei löschen“; beim Löschen bestätigen Sie die Rückfrage.

Bei vielen Dateien hilft das Feld „Dateien suchen...“ oberhalb der Liste. Sind die Schaltflächen nicht sichtbar, ist Ihr Fenster zu schmal: Scrollen Sie in der Info-Box nach rechts oder ziehen Sie sie breiter.

![](/videos/map_attachment.webm)

## 3.8 Exportformate im Überblick

Qonnectra hat keinen Menüpunkt „Export“. Daten verlassen die Anwendung dort, wo sie auch angezeigt werden, jeweils in dem Format, das zum Inhalt passt:

| Format | Wo | Inhalt |
|---|---|---|
| Excel (`.xlsx`) | Rohrverwaltung, „Vorlage“ | leere Importvorlage für Rohre, siehe Abschnitt [Excel-Import](./10-rohrverwaltung.md#_10-5-excel-import-vorlage-ablauf-fehlermeldungen) |
| Excel (`.xlsx`) | Netzknoten, „Slot-Konfiguration anzeigen“ | Einbauplätze und Komponenten eines Netzknotens, siehe Abschnitt [Netzknoten](./05-karte.md#_5-6-netzknoten-slot-konfiguration-und-struktur-offnen) |
| CSV | Störungsanalyse, „CSV exportieren“ | Schadensbericht mit den betroffenen Objekten, siehe Kapitel [Störungsanalyse](./06-stoerungsanalyse.md) |
| PDF | Adressdetails, „PDF herunterladen“; Nachverdichtung, „Start“ → „Exportieren“ | Datenblatt zu einer Adresse, wahlweise mit den Wohneinheiten, siehe Kapitel [Adressen](./16-adressen.md) und [Nachverdichtung](./07-nachverdichtung.md) |
| GeoJSON | Faserweg, „GeoJSON herunterladen“ | Geometrien des ermittelten Faserwegs, siehe Kapitel [Faserweg](./15-faserweg.md) |
| ZIP | Leitungsauskunft, „Exportieren“ | je Objektart eine GeoJSON-Datei, eine QGIS-Layerdatei (`.qlr`) und die Anhänge der enthaltenen Objekte, siehe Kapitel [Leitungsauskunft](./08-leitungsauskunft.md) |

Einzelne Dateien laden Sie über den Reiter „Anhänge“ herunter, siehe Abschnitt [Anhänge hochladen, ansehen und löschen](#_3-7-anhange-hochladen-ansehen-und-loschen).

::: warning
Die CSV-Datei der Störungsanalyse ist kommagetrennt. Ein Doppelklick öffnet sie zwar in Excel, in deutscher Einstellung steht dann aber die ganze Zeile in einer Spalte. Öffnen Sie die Datei stattdessen über „Daten“ → „Aus Text/CSV“ und wählen Sie das Komma als Trennzeichen.
:::

::: info
Ganze Datenbestände tauscht die Administration über den Administrationsbereich und QGIS aus, siehe Kapitel [Daten importieren und exportieren](../teil-b-betrieb-admin-qgis/24-daten-import-und-export.md).
:::
