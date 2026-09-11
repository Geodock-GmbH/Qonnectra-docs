# 10. Rohrverwaltung

Die **Rohrverwaltung** führt alle Rohre des ausgewählten Projekts in einer Tabelle auf. Hier legen Sie neue Rohre an, bearbeiten vorhandene, hinterlegen Anhänge und übernehmen größere Bestände aus einer Excel-Datei. Sie erreichen sie über die linke Navigationsleiste in der Gruppe „Rohr“ durch Klicken auf den Menüpunkt „Verwaltung“.

![Screenshot Rohrverwaltung mit der Tabelle aller Rohre](/images/manual/teil-a/conduit.jpg)

Welche Rohre die Tabelle enthält, hängt von dem Projekt ab, das oben links in der Kopfzeile ausgewählt ist, siehe Abschnitt [Projekt auswählen und wechseln](./01-erste-schritte.md#_1-3-projekt-auswahlen-und-wechseln).

## 10.1 Rohrliste durchsuchen und filtern

Zu jedem Rohr zeigt die Tabelle die Spalten „Name“, „Rohrtyp“, „Schutzrohr“, „Status“, „Netzebene“, „Eigentümer“, „Baufirma“, „Hersteller“, „Datum“ und „Kennzeichen“. Das Suchfeld für den gesamten Bestand steht oben neben „Rohr hinzufügen“.

Sortierung, Suche, Spaltenfilter und Seitenwechsel funktionieren wie in Abschnitt [Tabellen](./03-wiederkehrende-bedienelemente.md#_3-1-tabellen-suche-spaltenfilter-sortierung-seitenwechsel) beschrieben.

![Screenshot Rohrverwaltung mit Hervorhebung der Spaltenüberschriften und der Seitenauswahl unten rechts](/images/manual/teil-a/conduit_table.jpg)

## 10.2 Rohr hinzufügen

Klicken Sie auf „Rohr hinzufügen“. Es öffnet sich ein Dialog mit denselben Angaben, die auch die Tabelle zeigt. Ausgefüllt sein müssen „Name“, „Rohrtyp“ und „Kennzeichen“; solange eines dieser Felder leer ist, lässt sich der Dialog nicht speichern. Der Name muss innerhalb des Projekts eindeutig sein.

![Screenshot des Dialogs „Rohr hinzufügen“ mit den Eingabefeldern für ein neues Rohr](/images/manual/teil-a/conduit_add.jpg)

Nach dem Klick auf „Speichern“ bleibt der Dialog geöffnet und behält alle eingetragenen Werte. So legen Sie mehrere gleichartige Rohre nacheinander an, indem Sie nur den Namen ändern. Über „Schließen“ verlassen Sie den Dialog. Das neue Rohr steht zunächst oben in der Tabelle; beim nächsten Laden der Seite sortiert es sich alphabetisch ein.

![](/videos/conduit_add.webm)

::: info
Die Angaben des zuletzt angelegten Rohrs bleiben erhalten und stehen beim nächsten Öffnen des Dialogs wieder im Formular – auch nach einem Neustart des Browsers.
:::

Aus dem gewählten Rohrtyp entstehen dabei zugleich die Mikrorohre des Rohrs, siehe Abschnitt [Mikrorohre eines Rohrs](#_10-4-mikrorohre-eines-rohrs).

## 10.3 Eigenschaften bearbeiten

Klicken Sie ein Rohr in der Tabelle an, öffnet sich rechts die Info-Box mit dem Namen des Rohrs als Überschrift. An ihrem linken Rand stehen die drei Reiter „Eigenschaften“, „Status“ und „Anhänge“ untereinander. Sie verhält sich wie in Abschnitt [Die Info-Box](./03-wiederkehrende-bedienelemente.md#_3-6-die-info-box-mit-ihren-reitern) beschrieben.

Im Reiter „Eigenschaften“ ändern Sie die Angaben des ausgewählten Rohrs. Die Schaltflächen „Speichern“ und „Rohr löschen“ liegen am unteren Rand der Info-Box und bleiben dort stehen; für die letzten Felder des Formulars scrollen Sie in ihr nach unten.

![Screenshot Rohrverwaltung mit Hervorhebung der Info-Box zum Bearbeiten eines Rohrs im Reiter „Eigenschaften“](/images/manual/teil-a/conduit_properties.jpg)

::: info
Die Auswahlfelder – „Rohrtyp“, „Status“, „Netzebene“, „Eigentümer“, „Baufirma“, „Hersteller“ und „Kennzeichen“ – sind beim Öffnen leer, auch wenn das Rohr dort Werte hat. Die aktuellen Werte lesen Sie in der Tabelle ab. Ein leeres Auswahlfeld löscht beim Speichern nichts: Überschrieben wird nur, was Sie tatsächlich auswählen.
:::

::: danger
Speichern Sie Ihre Änderungen, bevor Sie ein anderes Rohr aus der Tabelle auswählen. Andernfalls gehen sie ohne Warnung verloren.
:::

## 10.4 Mikrorohre eines Rohrs

Der Reiter „Status“ listet die **Mikrorohre** des Rohrs auf, mit den Spalten „#“, „Farbe“, „Adresse“ (des angeschlossenen Netzknotens), „Kabel“ und „Status“. Anzahl und Farben gibt der Rohrtyp vor; ändern lassen sie sich hier nicht.

![Screenshot Rohrverwaltung mit Hervorhebung der Info-Box im Reiter „Status“ mit der Liste der Mikrorohre](/images/manual/teil-a/conduit_status.jpg)

Der Status jedes Mikrorohrs steht auf „Intakt“, solange nichts anderes eingetragen ist. Über das Auswahlfeld in der Zeile vermerken Sie eine Störung, etwa „Defekt“. Diese Änderung wird sofort übernommen, es gibt dafür keinen „Speichern“-Button.

::: warning
Ändern Sie den Rohrtyp nachträglich, bleibt diese Liste unverändert, siehe Abschnitt [Trasse, Rohr und Mikrorohr](./02-grundbegriffe-und-datenmodell.md#_2-1-trasse-rohr-und-mikrorohr).
:::

## 10.5 Excel-Import: Vorlage, Ablauf, Fehlermeldungen

Oben rechts finden Sie zwei Schaltflächen für die Arbeit mit Excel-Dateien. „Vorlage“ lädt eine Excel-Datei mit den Spalten „Name“, „Typ“, „Schutzrohr“, „Status“, „Netzebene“, „Eigentümer“, „Baufirma“, „Hersteller“, „Datum“, „Projekt“ und „Kennzeichen“ herunter. „Excel Import“ öffnet die Dateiauswahl; sobald Sie eine Datei gewählt haben, startet der Import ohne weitere Rückfrage.

![Screenshot Rohrverwaltung mit Hervorhebung der Schaltflächen „Excel Import“ und „Vorlage“ oben rechts](/images/manual/teil-a/conduit_excel.jpg)

Für die Datei gilt:

- Sie muss im Format .xlsx vorliegen und darf höchstens 10 MB groß sein.
- Die erste Zeile enthält die Spaltenüberschriften der Vorlage. Spalten, die dort nicht vorkommen, werden übergangen; darauf weist eine Meldung hin.
- In der zweiten Zeile der Vorlage steht eine Beispielzeile. Überschreiben oder löschen Sie sie, sonst versucht der Import, sie als Rohr anzulegen.
- Zu welchem Projekt ein Rohr gehört, entscheidet die Spalte „Projekt“ – nicht das Projekt, das in der Kopfzeile ausgewählt ist.
- Die Werte in „Typ“, „Status“, „Netzebene“, „Eigentümer“, „Baufirma“, „Hersteller“, „Projekt“ und „Kennzeichen“ müssen in Qonnectra bereits vorhanden sein und genauso geschrieben werden wie dort.
- Bleibt die Spalte „Typ“ leer, entsteht das Rohr ohne Mikrorohre.

::: info
Der Import prüft andere Pflichtangaben als der Dialog „Rohr hinzufügen“, der Name, Rohrtyp und Kennzeichen verlangt (siehe Abschnitt [Rohr hinzufügen](#_10-2-rohr-hinzufugen)). Zeilenweise geprüft wird hier nur der Name; „Typ“ dürfen Sie bewusst leer lassen, wenn das Rohr keine Mikrorohre haben soll.
:::

::: warning
„Projekt“ und „Kennzeichen“ dürfen dagegen in keiner Zeile leer bleiben, obwohl der Import sie nicht zeilenweise prüft: Die Zeile kommt durch die Prüfung, das Speichern scheitert anschließend für die **gesamte** Datei. Die Meldung lautet dann „Fehler beim Speichern in die Datenbank“ und nennt keine Zeilennummer – anders als die übrigen Fehler. Prüfen Sie in diesem Fall die beiden Spalten auf leere Zellen.
:::

::: warning
Der Import ist ein Alles-oder-nichts-Vorgang: Ist eine einzige Zeile fehlerhaft, wird keine einzige Zeile übernommen. Die Meldung nennt die betroffene Zeilennummer und den Grund. Zurückgewiesen werden unter anderem Zeilen ohne Namen und Namen, die es in Qonnectra bereits gibt – auch in einem anderen Projekt. Die Meldungen zu Eigentümer, Baufirma und Hersteller erscheinen auf Englisch, auch wenn die Oberfläche auf Deutsch steht.
:::

::: info
Nach einem erfolgreichen Import nennt die Meldung die Anzahl der übernommenen Rohre; die Tabelle aktualisiert sich anschließend von selbst.
:::

## 10.6 Rohr löschen

Über „Rohr löschen“ im Reiter „Eigenschaften“ entfernen Sie das Rohr; die Rückfrage bestätigen Sie mit „Löschen“. Ob Sie ein Rohr löschen dürfen, hängt von Ihren Rechten ab – fehlt die Berechtigung, erscheint eine Fehlermeldung.

::: danger
Mit dem Rohr verschwinden auch seine Mikrorohre und seine Zuordnungen zu Trassensegmenten (siehe Kapitel [Rohrzuordnung](./11-rohrzuordnung.md)). Rückgängig machen lässt sich das nicht.
:::

## 10.7 Anhänge an einem Rohr

Zu jedem Rohr können Sie Dateien ablegen, etwa Bestandspläne oder Messprotokolle. Hochladen, Herunterladen, Umbenennen und Löschen funktionieren wie in Abschnitt [Anhänge hochladen, ansehen und löschen](./03-wiederkehrende-bedienelemente.md#_3-7-anhange-hochladen-ansehen-und-loschen) beschrieben.

![Screenshot Rohrverwaltung mit Hervorhebung der Info-Box im Reiter „Anhänge“ mit einer hochgeladenen Datei](/images/manual/teil-a/conduit_attachment.jpg)
