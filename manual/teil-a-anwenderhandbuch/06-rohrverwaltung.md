# 6. Rohrverwaltung

Die **Rohrverwaltung** führt alle Rohre des ausgewählten Projekts in einer Tabelle auf. Hier legen Sie neue Rohre an, bearbeiten vorhandene, hinterlegen Anhänge und übernehmen größere Bestände aus einer Excel-Datei. Sie erreichen sie über die linke Navigation in der Gruppe „Rohr“ durch Klicken auf den Menüpunkt „Verwaltung“.

![Screenshot Rohrverwaltung mit der Tabelle aller Rohre](/images/manual/teil-a/conduit.jpg)

Welche Rohre die Tabelle enthält, hängt von dem Projekt ab, das oben links in der Kopfzeile ausgewählt ist.

## 6.1 Aufbau der Tabelle

Zu jedem Rohr zeigt die Tabelle die Spalten „Name“, „Rohrtyp“, „Schutzrohr“, „Status“, „Netzebene“, „Eigentümer“, „Baufirma“, „Hersteller“, „Datum“ und „Kennzeichen“.

Ein Klick auf eine Spaltenüberschrift sortiert die Tabelle nach dieser Spalte: der erste Klick aufsteigend, der zweite absteigend, der dritte hebt die Sortierung wieder auf.

Eine Seite umfasst 50 Rohre; unter der Tabelle stehen die Gesamtzahl und die Seitenauswahl.

![Screenshot Rohrverwaltung mit Hervorhebung der Spaltenüberschriften und der Seitenauswahl unten rechts](/images/manual/teil-a/conduit_table.jpg)

::: warning
Die Sortierung ordnet nur die Rohre der angezeigten Seite. Bei mehr als einer Seite bleibt ein Rohr von einer anderen Seite also außen vor – auch wenn es alphabetisch an erster Stelle stünde.
:::

## 6.2 Suchen und Filtern

Zum Eingrenzen der Tabelle stehen zwei Suchfunktionen zur Verfügung, die sich in ihrer Reichweite unterscheiden.

**Suchfeld oben**

Das Suchfeld neben „Rohr hinzufügen“ durchsucht alle Rohre des Projekts. Geben Sie einen Suchbegriff ein und drücken Sie Enter oder klicken Sie auf das Lupensymbol. Die Tabelle enthält danach nur noch die passenden Rohre, und die Gesamtzahl passt sich an. Um wieder alle Rohre zu sehen, leeren Sie das Feld und lösen die Suche erneut aus.

![Screenshot Rohrverwaltung mit Hervorhebung des Suchfeldes oben; die Tabelle darunter zeigt nur noch die drei Treffer](/images/manual/teil-a/conduit_search.jpg)

**Suchfelder unter den Spaltenüberschriften**

Unter jeder Spaltenüberschrift liegt ein eigenes Suchfeld. Diese Felder arbeiten bereits beim Tippen, ohne Enter, und lassen sich miteinander kombinieren: Ein Rohr bleibt nur stehen, wenn es zu allen ausgefüllten Feldern passt. Zum Aufheben leeren Sie die Felder wieder.

![Screenshot Rohrverwaltung mit Hervorhebung der Suchfelder unter den Spaltenüberschriften](/images/manual/teil-a/conduit_search_columns.jpg)

::: warning
Die Spaltensuche durchsucht nur die angezeigte Seite. Ein Rohr, das auf einer anderen Seite steht, finden Sie damit nicht – dafür ist das Suchfeld oben zuständig. Die Gesamtzahl bleibt dabei unverändert, sie zählt weiterhin alle Rohre des Projekts.
:::

## 6.3 Rohr hinzufügen

Klicken Sie auf „Rohr hinzufügen“. Es öffnet sich ein Dialog mit denselben Angaben, die auch die Tabelle zeigt. Ausgefüllt sein müssen „Name“, „Rohrtyp“ und „Kennzeichen“; solange eines dieser Felder leer ist, lässt sich der Dialog nicht speichern. Der Name muss innerhalb des Projekts eindeutig sein.

![Screenshot des Dialogs „Rohr hinzufügen“ mit den Eingabefeldern für ein neues Rohr](/images/manual/teil-a/conduit_add.jpg)

Nach dem Klick auf „Speichern“ bleibt der Dialog geöffnet und behält alle eingetragenen Werte. So legen Sie mehrere gleichartige Rohre nacheinander an, indem Sie nur den Namen ändern. Über „Schließen“ verlassen Sie den Dialog. Das neue Rohr steht zunächst oben in der Tabelle; beim nächsten Laden der Seite sortiert es sich alphabetisch ein.

![](/videos/conduit_add.webm)

::: info
Die Angaben des zuletzt angelegten Rohrs bleiben erhalten und stehen beim nächsten Öffnen des Dialogs wieder im Formular – auch nach einem Neustart des Browsers.
:::

Aus dem gewählten Rohrtyp entstehen dabei zugleich die Mikrorohre des Rohrs, siehe Abschnitt [Reiter „Status“](#_6-4-2-reiter-„status).

## 6.4 Rohr bearbeiten

Klicken Sie ein Rohr in der Tabelle an, öffnet sich rechts eine Box mit dem Namen des Rohrs als Überschrift. Am linken Rand der Box stehen die drei Reiter „Eigenschaften“, „Status“ und „Anhänge“ untereinander.

Die Box überdeckt den rechten Teil der Tabelle. Sie verhält sich wie die Info-Box der Karte (siehe Kapitel [Karte](./05-karte.md)); die dort eingestellte Breite gilt für beide Ansichten.

### 6.4.1 Reiter „Eigenschaften“

Hier ändern Sie die Angaben des ausgewählten Rohrs. Die Schaltflächen „Speichern“ und „Rohr löschen“ liegen am unteren Rand der Box und bleiben dort stehen; für die letzten Felder des Formulars scrollen Sie in der Box nach unten.

![Screenshot Rohrverwaltung mit Hervorhebung der Box zum Bearbeiten eines Rohrs im Reiter „Eigenschaften“](/images/manual/teil-a/conduit_properties.jpg)

::: info
Die Auswahlfelder – „Rohrtyp“, „Status“, „Netzebene“, „Eigentümer“, „Baufirma“, „Hersteller“ und „Kennzeichen“ – sind beim Öffnen leer, auch wenn das Rohr dort Werte hat. Die aktuellen Werte lesen Sie in der Tabelle ab. Ein leeres Auswahlfeld löscht beim Speichern nichts: Überschrieben wird nur, was Sie tatsächlich auswählen.
:::

::: danger
Speichern Sie Ihre Änderungen, bevor Sie ein anderes Rohr aus der Tabelle auswählen. Andernfalls gehen sie ohne Warnung verloren.
:::

Über „Rohr löschen“ entfernen Sie das Rohr; die Rückfrage bestätigen Sie mit „Löschen“. Ob Sie ein Rohr löschen dürfen, hängt von Ihren Rechten ab – fehlt die Berechtigung, erscheint eine Fehlermeldung.

::: danger
Mit dem Rohr verschwinden auch seine Mikrorohre und seine Zuordnungen zu Trassensegmenten (siehe Kapitel [Rohrzuordnung](./07-rohrzuordnung.md)). Rückgängig machen lässt sich das nicht.
:::

### 6.4.2 Reiter „Status“

Der Reiter listet die **Mikrorohre** des Rohrs auf, mit den Spalten „#“, „Farbe“, „Adresse“ (des angeschlossenen Netzknotens), „Kabel“ und „Status“. Anzahl und Farben gibt der Rohrtyp vor; ändern lassen sie sich hier nicht.

![Screenshot Rohrverwaltung mit Hervorhebung der Box im Reiter „Status“ mit der Liste der Mikrorohre](/images/manual/teil-a/conduit_status.jpg)

Der Status jedes Mikrorohrs steht auf „Intakt“, solange nichts anderes eingetragen ist. Über das Auswahlfeld in der Zeile vermerken Sie eine Störung, etwa „Defekt“. Diese Änderung wird sofort übernommen, es gibt dafür keinen „Speichern“-Button.

::: warning
Ändern Sie den Rohrtyp nachträglich, bleibt die Liste der Mikrorohre unverändert – sie richtet sich nach dem Rohrtyp zum Zeitpunkt des Anlegens.
:::

### 6.4.3 Reiter „Anhänge“

Zu jedem Rohr können Sie Dateien ablegen, etwa Bestandspläne oder Messprotokolle. Hochladen, Herunterladen, Umbenennen und Löschen funktionieren wie bei den Kartenobjekten, siehe Abschnitt [Anhänge von Kartenobjekten](./05-karte.md#_5-3-1-anhange-von-kartenobjekten).

![Screenshot Rohrverwaltung mit Hervorhebung der Box im Reiter „Anhänge“ mit einer hochgeladenen Datei](/images/manual/teil-a/conduit_attachment.jpg)

## 6.5 Excel-Vorlage und Datenimport

Oben rechts finden Sie zwei Schaltflächen für die Arbeit mit Excel-Dateien. „Vorlage“ lädt eine Excel-Datei mit den Spalten „Name“, „Typ“, „Schutzrohr“, „Status“, „Netzebene“, „Eigentümer“, „Baufirma“, „Hersteller“, „Datum“, „Projekt“ und „Kennzeichen“ herunter. „Excel Import“ öffnet die Dateiauswahl; sobald Sie eine Datei gewählt haben, startet der Import ohne weitere Rückfrage.

![Screenshot Rohrverwaltung mit Hervorhebung der Schaltflächen „Excel Import“ und „Vorlage“ oben rechts](/images/manual/teil-a/conduit_excel.jpg)

Für die Datei gilt:

- Sie muss im Format .xlsx vorliegen und darf höchstens 10 MB groß sein.
- Die erste Zeile enthält die Spaltenüberschriften der Vorlage. Spalten, die dort nicht vorkommen, werden übergangen; darauf weist eine Meldung hin.
- In der zweiten Zeile der Vorlage steht eine Beispielzeile. Überschreiben oder löschen Sie sie, sonst versucht der Import, sie als Rohr anzulegen.
- Zu welchem Projekt ein Rohr gehört, entscheidet die Spalte „Projekt“ – nicht das Projekt, das in der Kopfzeile ausgewählt ist.
- Die Werte in „Typ“, „Status“, „Netzebene“, „Eigentümer“, „Baufirma“, „Hersteller“, „Projekt“ und „Kennzeichen“ müssen in Qonnectra bereits vorhanden sein und genauso geschrieben werden wie dort.
- Bleibt die Spalte „Typ“ leer, entsteht das Rohr ohne Mikrorohre.

::: warning
Der Import ist ein Alles-oder-nichts-Vorgang: Ist eine einzige Zeile fehlerhaft, wird keine einzige Zeile übernommen. Die Meldung nennt die betroffene Zeilennummer und den Grund. Zurückgewiesen werden unter anderem Zeilen ohne Namen und Namen, die es in Qonnectra bereits gibt – auch in einem anderen Projekt.
:::

::: info
Nach einem erfolgreichen Import nennt die Meldung die Anzahl der übernommenen Rohre; die Tabelle aktualisiert sich anschließend von selbst.
:::
