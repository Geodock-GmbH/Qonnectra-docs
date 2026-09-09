# 8. Leitungsauskunft

Die **Leitungsauskunft** beantwortet Anfragen zum Leitungsbestand: Ein Bauunternehmen, ein Planungsbüro oder eine Behörde will vor Arbeiten wissen, welche Leitungen in einem bestimmten Bereich liegen. Qonnectra führt jede Anfrage als eigenen Datensatz mit den Angaben zur anfragenden Stelle, lässt Sie dazu einen oder mehrere **Auskunftsbereiche** in die Karte zeichnen und gibt alles, was darin liegt, als ZIP-Archiv aus. Sie erreichen sie über die linke Navigationsleiste in der Gruppe „Funktionen“ durch Klicken auf den Menüpunkt „Leitungsauskunft“.

![Screenshot Leitungsauskunft mit der Tabelle der Auskünfte](/images/manual/teil-a/records.jpg)

Eine Auskunft entsteht in drei Schritten, die in dieser Reihenfolge aufeinander aufbauen: Datensatz anlegen, Bereiche zeichnen, exportieren. Der Datensatz ohne Bereich lässt sich nicht exportieren – der Button dafür erscheint erst, wenn mindestens ein Bereich gezeichnet ist.

::: info
Die Angaben zur anfragenden Stelle sind Kontaktdaten und damit personenbezogen. Erfassen Sie nur, was Sie für die Bearbeitung brauchen, und löschen Sie den Datensatz, wenn die Anfrage abgeschlossen und die Aufbewahrungsfrist abgelaufen ist.
:::

## 8.1 Auskünfte suchen und filtern

Die Tabelle listet die Auskünfte mit den Spalten „Projekt“, „Art der Arbeit“, „Grund der Anfrage“, „Organisation“, „Name“, „Erstellt“ und „Geändert“ auf, die jüngste zuerst. Sortierung, Spaltenfilter und Seitenwechsel funktionieren wie in Abschnitt [Tabellen](./03-wiederkehrende-bedienelemente.md#_3-1-tabellen-suche-spaltenfilter-sortierung-seitenwechsel) beschrieben; ein Klick auf eine Zeile öffnet den Datensatz auf einer eigenen Seite.

![Screenshot Leitungsauskunft mit Hervorhebung des Suchfeldes über der Tabelle und der Filterfelder unter den Spaltenüberschriften](/images/manual/teil-a/records_search.jpg)

::: warning
Diese Tabelle ist die einzige Ansicht in Qonnectra, die **nicht** auf das gewählte Projekt beschränkt ist: Sie enthält die Auskünfte aller Projekte. Achten Sie deshalb auf die Spalte „Projekt“, und grenzen Sie die Tabelle über deren Filterfeld ein, wenn Sie nur die Anfragen eines Projekts sehen wollen.
:::

Das Suchfeld über der Tabelle durchsucht „Organisation“, „Name“, „Art der Arbeit“, „Grund der Anfrage“ und den Projektnamen. Gesucht wird nach einem enthaltenen Textstück und ohne Rücksicht auf Groß- und Kleinschreibung; anders als die Adresssuche der Nachverdichtung verzeiht diese Suche keine Tippfehler.

::: warning
Telefon- und Mobilnummern werden nicht durchsucht. Eine Anfrage, von der Sie nur die Rufnummer haben, finden Sie über die Suche nicht – die Nummern stehen ausschließlich im Datensatz selbst.
:::

Die Nachschlagelisten für „Art der Arbeit“ und „Grund der Anfrage“ pflegt die Administration, siehe Kapitel [Projekte und Stammdaten pflegen](../teil-b-betrieb-admin-qgis/21-projekte-und-stammdaten.md). Sie gelten instanzweit und nicht je Projekt.

## 8.2 Neue Auskunft anlegen: Art der Arbeit, Grund, Kontaktdaten

Der Button „+ Erstellen“ über der Tabelle öffnet das Formular für eine neue Auskunft. Es besteht aus drei Abschnitten:

- **„Projekt“** – „Projekt“ (Pflichtfeld), „Art der Arbeit“ und „Grund der Anfrage“. Die beiden Kombinationsfelder bedienen Sie wie in Abschnitt [Auswahllisten und Kombinationsfelder](./03-wiederkehrende-bedienelemente.md#_3-2-auswahllisten-und-kombinationsfelder) beschrieben.
- **„Organisation“** – „Organisation“ und „Name“, also die anfragende Stelle und die Person, die dort zuständig ist.
- **„Telefon“** – „Telefon“ und „Mobil“.

![Screenshot Formular für eine neue Auskunft mit den Abschnitten „Projekt“, „Organisation“ und „Telefon“](/images/manual/teil-a/records_new.jpg)

„Erstellen“ legt den Datensatz an, meldet „Leitungsauskunft-Datensatz erfolgreich erstellt“ und wechselt direkt in dessen Detailansicht. Über „Zurück“ verlassen Sie das Formular ohne zu speichern.

::: info
Das Feld „Projekt“ ist nicht bearbeitbar: Eine neue Auskunft entsteht immer im Projekt, das oben links in der Kopfzeile gewählt ist, siehe Abschnitt [Projekt auswählen und wechseln](./01-erste-schritte.md#_1-3-projekt-auswahlen-und-wechseln). Wechseln Sie das Projekt, bevor Sie das Formular öffnen, wenn die Anfrage einen anderen Bestand betrifft. Nachträglich lässt sich das Projekt nicht mehr ändern.
:::

::: warning
Außer dem Projekt ist kein Feld ein Pflichtfeld. „Erstellen“ legt den Datensatz auch dann an, wenn Sie nichts ausgefüllt haben – in der Tabelle steht er danach als Zeile, in der nur Projekt und Zeitstempel gefüllt sind.
:::

## 8.3 Auskunftsbereiche zeichnen, umbenennen und löschen

In der Detailansicht führt der Button „Neue Auskunft“ in die Karte, in der Sie die Bereiche der Anfrage zeichnen. Sobald mindestens ein Bereich vorhanden ist, heißt derselbe Button „Auskunft bearbeiten“.

Solange kein Bereich gezeichnet ist, steht am unteren Rand der Karte der Hinweis „Zeichne Polygone auf der Karte, um Bereiche für die Auskunft auszuwählen.“ Die Karte selbst verhält sich wie in Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster) beschrieben.

![Screenshot Auskunftsabfrage mit einem gezeichneten Auskunftsbereich und den darin hervorgehobenen Objekten](/images/manual/teil-a/records_inquiry.jpg)

Oben links unter der Suche liegen die beiden Werkzeuge, rechts die Liste „Auskunftsbereiche“.

![Screenshot Auskunftsabfrage mit Hervorhebung der Werkzeuge oben links und der Liste „Auskunftsbereiche“ rechts](/images/manual/teil-a/records_inquiry_tools.jpg)

**Bereich zeichnen**

1. Klicken Sie auf „Polygon zeichnen“. Das Werkzeug ist damit **eingeschaltet**; die Schaltfläche heißt jetzt „Zeichnen beenden“.
2. Klicken Sie die Eckpunkte des Bereichs nacheinander in die Karte.
3. Ein Doppelklick schließt das Polygon.

Der Bereich wird sofort gespeichert, gemeldet durch „Auskunftspolygon gespeichert.“; einen Button zum Speichern gibt es nicht. Das Werkzeug bleibt eingeschaltet, Sie können also gleich den nächsten Bereich zeichnen. Über „Zeichnen beenden“ schalten Sie es wieder aus.

![](/videos/records_inquiry_draw.webm)

Alles, was innerhalb der Bereiche liegt, hebt die Karte orange hervor: Trassen, Netzknoten, Adressen und Gebiete. Daran lesen Sie ab, was der Export enthalten wird, noch bevor Sie ihn auslösen.

::: warning
Das Projektgebiet, in dem Sie zeichnen, wird dabei als Ganzes hervorgehoben, auch wenn Ihr Bereich nur einen kleinen Teil davon abdeckt: Seine Fläche schneidet den Bereich, und hervorgehoben wird immer das ganze Objekt. Die orange Fläche über der halben Karte ist deshalb kein Zeichen dafür, dass Sie zu groß gezeichnet haben. Blenden Sie den Layer „Gebiet“ in der Legende aus, wenn Sie prüfen wollen, welche Trassen und Adressen der Bereich wirklich trifft.
:::

::: info
Die Hervorhebung folgt der Legende: Was Sie dort ausblenden, wird auch nicht hervorgehoben – der Export enthält es trotzdem. Umgekehrt zeigt die Karte keine Rohre, Mikrorohre und Kabel, weil diese keine eigene Geometrie haben; im Export sind sie enthalten, siehe Abschnitt [Auskunft exportieren](#_8-4-auskunft-exportieren).
:::

**Bereich umbenennen**

Jeder Bereich bekommt beim Zeichnen von selbst einen Namen und steht damit in der Liste „Auskunftsbereiche“ und als Beschriftung am Polygon in der Karte. Zum Umbenennen klicken Sie in das Eingabefeld des Bereichs, geben einen Namen ein und drücken Enter oder klicken neben das Feld; Qonnectra meldet „Auskunftspolygon umbenannt.“. Mit Escape verwerfen Sie die Eingabe.

::: info
Die vergebenen Namen lauten „Area 1“, „Area 2“ und so weiter – englisch, unabhängig von der Sprache der Oberfläche. Sie sagen nichts über die Anfrage; benennen Sie die Bereiche um, sobald ein Datensatz mehr als einen davon hat. Die Nummer richtet sich nach dem höchsten bereits vergebenen „Area N“ des Datensatzes und wird nach dem Löschen eines Bereichs nicht erneut verwendet.
:::

::: warning
Die Beschriftung am Polygon erscheint erst ab einer ausreichenden Zoomstufe. Ist die Karte weit herausgezoomt, sehen Sie nur die Umrisse – welcher Umriss zu welchem Eintrag der Liste gehört, ist dann nicht zu erkennen.
:::

**Bereich ändern**

Sobald ein Bereich vorhanden ist, erscheint unter dem Zeichenwerkzeug ein zweites: „Polygone bearbeiten“. Bei eingeschaltetem Werkzeug ziehen Sie einen Eckpunkt an eine neue Stelle oder greifen eine Kante zwischen zwei Eckpunkten und ziehen daraus einen neuen Eckpunkt heraus. Beim Loslassen wird die Änderung gespeichert („Auskunftspolygon aktualisiert.“). „Bearbeiten beenden“ schaltet das Werkzeug aus.

Die beiden Werkzeuge schließen sich gegenseitig aus: Das Einschalten des einen schaltet das andere ab.

**Bereich löschen**

Das Papierkorbsymbol rechts neben dem Namen entfernt den Bereich.

::: danger
Das Löschen erfolgt ohne Rückfrage und ist nicht widerrufbar. Der Bereich verschwindet unmittelbar aus Karte und Liste; die gezeichnete Geometrie ist damit verloren und muss neu gezeichnet werden.
:::

::: warning
Löschen setzt das Recht dazu voraus. Fehlt es Ihrem Konto, bleibt der Bereich stehen und Qonnectra meldet „Sie sind nicht berechtigt, diese Aktion durchzuführen.“ – Zeichnen, Ändern und Umbenennen sind davon nicht betroffen. Welche Rolle was darf, beschreibt Kapitel [Rollen und Rechte](../teil-b-betrieb-admin-qgis/19-rollen-und-rechte.md).
:::

Über „Zurück“ gelangen Sie in die Detailansicht des Datensatzes.

## 8.4 Auskunft exportieren

Sobald der Datensatz mindestens einen Auskunftsbereich hat, steht in der Detailansicht der Button „Exportieren“. Er erzeugt das ZIP-Archiv, der Browser fragt nach dem Speicherort, und Qonnectra meldet „Auskunftsdaten erfolgreich exportiert.“

![Screenshot Detailansicht einer Auskunft mit Hervorhebung des Buttons „Exportieren“](/images/manual/teil-a/records_export.jpg)

Das Archiv heißt `inquiry-export-<UUID>.zip` und enthält:

- einen Ordner `layers` mit je einer GeoJSON-Datei für `trenches`, `nodes`, `addresses`, `conduits`, `cables`, `areas` und `microducts`,
- die QGIS-Layerdatei `inquiry_export.qlr`, die alle enthaltenen Layer auf einmal öffnet,
- einen Ordner `files` mit den Anhängen der enthaltenen Objekte, sofern es welche gibt.

Enthalten ist, was innerhalb der Bereiche des Datensatzes liegt; bei mehreren Bereichen deren Gesamtfläche. Rohre, Mikrorohre und Kabel haben keine eigene Geometrie – sie kommen über die Trassen hinein, die sie führen, und tragen deshalb im Export die Geometrie dieser Trassen sowie die Kennungen der Trassen bzw. Rohre, in denen sie liegen.

::: info
Die Feldnamen im Export sind englisch (`id_trench`, `construction_type`, `status`), die Werte darin die deutschen Bezeichnungen aus den Stammdaten („unbefestigt“, „klassischer Tiefbau“). Einen Überblick über alle Exportformate von Qonnectra gibt Abschnitt [Exportformate im Überblick](./03-wiederkehrende-bedienelemente.md#_3-8-exportformate-im-uberblick).
:::

::: warning
Layer ohne Inhalt lässt der Export weg. Fehlt eine Datei im Archiv, liegt in den Bereichen kein Objekt dieser Art – das ist kein Fehler des Exports. Liegt in den Bereichen überhaupt nichts, fehlt auch die `.qlr`-Datei.
:::

::: warning
Der Dateiname enthält die technische Kennung des Datensatzes und nicht den Namen der anfragenden Stelle. Benennen Sie die Datei beim Speichern um, wenn Sie sie ablegen oder weitergeben – aus dem Archiv selbst geht nicht hervor, zu welcher Anfrage es gehört.
:::

Der Export ist eine Momentaufnahme und wird nirgends gespeichert. Ändert sich der Netzbestand, erzeugen Sie das Archiv neu; gehört es dauerhaft zur Anfrage, legen Sie es außerhalb von Qonnectra ab.

## 8.5 Auskunft ändern und löschen

In der Detailansicht sind alle Felder bis auf „Projekt“ bearbeitbar. „Speichern“ übernimmt die Änderungen und meldet „Leitungsauskunft-Datensatz erfolgreich aktualisiert“.

![Screenshot Detailansicht einer Auskunft mit Hervorhebung der Buttons „Löschen“ und „Speichern“](/images/manual/teil-a/records_detail.jpg)

::: warning
Die beiden Kombinationsfelder „Art der Arbeit“ und „Grund der Anfrage“ zeigen in der Detailansicht „-“, auch wenn der Datensatz Werte enthält. Was tatsächlich gespeichert ist, lesen Sie in den entsprechenden Spalten der Tabelle ab. Die Werte gehen dadurch nicht verloren: „Speichern“ behält sie, solange Sie die Felder nicht anfassen. Wählen Sie einen Eintrag aus, ersetzt er den bisherigen Wert.
:::

„Löschen“ fragt mit „Löschen bestätigen“ nach; erst der Klick auf „Löschen“ in diesem Fenster führt es aus. Danach zeigt Qonnectra wieder die Tabelle.

::: danger
Mit dem Datensatz verschwinden alle seine Auskunftsbereiche. Ein bereits erzeugtes ZIP-Archiv bleibt davon unberührt, weil es außerhalb von Qonnectra liegt – die Bereiche selbst lassen sich daraus aber nicht wiederherstellen.
:::

::: warning
Auch für den Datensatz gilt: Ohne das Recht zum Löschen bleibt er nach der Bestätigung stehen, und Qonnectra meldet „Sie sind nicht berechtigt, diese Aktion durchzuführen.“ Ändern und Speichern sind davon nicht betroffen.
:::
