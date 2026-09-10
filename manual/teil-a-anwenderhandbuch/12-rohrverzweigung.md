# 12. Rohrverzweigung

An einem Rohrabzweig treffen mehrere Rohre aufeinander, und die Mikrorohre des einen setzen sich in denen eines anderen fort. Die **Rohrverzweigung** hält diese Übergänge fest: Sie verbinden darin Mikrorohr für Mikrorohr und dokumentieren so, welcher Weg an dieser Stelle weiterführt. Sie erreichen sie über die linke Navigationsleiste in der Gruppe „Rohr“ durch Klicken auf den Menüpunkt „Verzweigung“.

![Screenshot der Rohrverzweigung mit dem Bereich „Eigenschaften“ oben links und der noch leeren Arbeitsfläche](/images/manual/teil-a/pipe_branch.jpg)

Den größten Teil der Ansicht nimmt die **Arbeitsfläche** ein. Sie ist ein Diagramm und keine Karte: Wo ein Rohr darin liegt, hat mit seiner Lage im Gelände nichts zu tun. Oben links steht der Bereich „Eigenschaften“ mit der Auswahl der Rohrverzweigung, unten links die Schaltflächen zum Zoomen und Sperren, siehe Abschnitt [Arbeitsfläche](#_12-4-arbeitsflache-anordnen-zoomen-sperren).

Der Weg durch diese Ansicht ist immer derselbe: Netzknoten auswählen, Trassen und Rohre auf die Arbeitsfläche laden, Mikrorohre verbinden.

## 12.1 Rohrverzweigung auswählen

Im Feld „Rohrverzweigung auswählen“ stehen die Netzknoten des Projekts, die als Rohrabzweig infrage kommen. Welche das sind, legt Ihre Administration fest, siehe Abschnitt [Voraussetzung](#_12-5-voraussetzung-konfigurierte-rohrabzweig-einstellungen).

![Screenshot der Rohrverzweigung mit Hervorhebung des Feldes „Rohrverzweigung auswählen“ und der geöffneten Liste der Netzknoten oben links](/images/manual/teil-a/pipe_branch_select.jpg)

Mit der Auswahl sucht Qonnectra alle Trassen, die höchstens fünf Meter vom Netzknoten entfernt liegen, und öffnet damit sofort das Fenster „Trassen auswählen“, siehe den nächsten Abschnitt.

::: warning
Findet Qonnectra in diesem Umkreis keine Trasse, meldet es „Keine Trassen in der Nähe dieses Netzknotens gefunden“, und die Arbeitsfläche bleibt leer. Prüfen Sie in der Karte, ob die Trassen tatsächlich am Netzknoten enden – die fünf Meter lassen sich nicht einstellen.
:::

## 12.2 Grabenauswahl bearbeiten

Das Fenster „Trassen auswählen“ bestimmt, was auf der Arbeitsfläche landet. Unter der Überschrift steht, wie viele Trassen gefunden wurden und wie viele Rohre davon derzeit ausgewählt sind.

Jede Trasse steht mit ihrer Trassen-ID in einer eigenen Zeile, darunter die Zahl ihrer ausgewählten Rohre („1/2 Rohr“). Klappen Sie eine Trasse auf, sehen Sie ihre Rohre einzeln, jedes mit der Zahl seiner Mikrorohre. Das Kästchen vor der Trassen-ID wählt alle Rohre einer Trasse auf einmal, die Schaltflächen „Alle auswählen“ und „Keine auswählen“ oben rechts alle Rohre aller Trassen.

![Screenshot der Rohrverzweigung mit Hervorhebung des Fensters „Trassen auswählen“ mit aufgeklappten Trassen oben links](/images/manual/teil-a/pipe_branch_trench_selection.jpg)

Rohre, die an diesem Netzknoten bereits Mikrorohrverbindungen haben, sind mit „Hat Verbindungen“ gekennzeichnet, von vornherein ausgewählt und mit einem Schloss gesperrt. Sie lassen sich nicht abwählen – sonst blieben gespeicherte Verbindungen ohne Gegenstück auf der Arbeitsfläche.

„Auf Canvas laden“ übernimmt die Auswahl auf die Arbeitsfläche. „Abbrechen“ verwirft nicht nur die Auswahl, sondern auch den Netzknoten; Sie beginnen dann wieder mit Abschnitt [Rohrverzweigung auswählen](#_12-1-rohrverzweigung-auswahlen). Solange ein Netzknoten ausgewählt ist, öffnet die Schaltfläche „Grabenauswahl bearbeiten“ das Fenster erneut.

::: info
Das Fenster spricht von „Trassen“, die Schaltfläche daneben von der „Grabenauswahl“. Gemeint ist beides Mal dasselbe: die Trassen rund um den Netzknoten.
:::

::: warning
Qonnectra meldet „Trassenauswahl erfolgreich gespeichert“, merkt sich die Auswahl aber nicht. Kehren Sie später zu demselben Netzknoten zurück, ist wieder nur ausgewählt, was dort bereits Verbindungen hat; die übrigen Rohre stellen Sie erneut zusammen. Verloren geht dabei nichts – die gespeicherten Mikrorohrverbindungen bleiben erhalten. Das Speichern der Auswahl setzt Rechte voraus, die keine der mitgelieferten Rollen enthält, siehe Kapitel [Rollen und Rechte](../teil-b-betrieb-admin-qgis/19-rollen-und-rechte.md).
:::

## 12.3 Mikrorohre verbinden und Auto-Verbindung

Jedes geladene Rohr erscheint als Kreis auf der Arbeitsfläche. Der Kasten daneben nennt die Trassen-ID, den Namen des Rohrs und die Zahl seiner Mikrorohre. Auf dem Kreis liegen die Mikrorohre als farbige Punkte untereinander, von oben nach unten in der Reihenfolge ihrer Nummern.

![Screenshot der Rohrverzweigung mit fünf Rohren als Kreise auf der Arbeitsfläche](/images/manual/teil-a/pipe_branch_canvas.jpg)
![Ausschnitt eines Rohrs auf der Arbeitsfläche mit seinen Mikrorohren als farbige Punkte](/images/manual/teil-a/pipe_branch_canvas_detail.jpg)
{.img-row}

Zeigen Sie auf einen Punkt, nennt der Hinweis Rohr, Nummer und Farbe des Mikrorohrs. Er ist englisch beschriftet, etwa „St-VL-01 - Microduct 3 (blau)“.

Mikrorohre mit einem Status – etwa „Defekt“, siehe Abschnitt [Mikrorohre eines Rohrs](./10-rohrverwaltung.md#_10-4-mikrorohre-eines-rohrs) – sind blass gezeichnet und tragen ein Kreuz.

### 12.3.1 Einzelne Mikrorohre verbinden

Ziehen Sie mit gedrückter linker Maustaste vom Punkt des einen Mikrorohrs zum Punkt des anderen. Zwischen beiden entsteht eine Linie, beschriftet mit den beiden Nummern („5 ↔ 5“) und einem roten Kreuz zum Löschen.

![](/videos/pipe_branch_connect.webm)

Die Verbindung ist mit dem Loslassen gespeichert, Qonnectra bestätigt mit „Verbindung erfolgreich erstellt“. Einen „Speichern“-Button gibt es nicht.

::: info
Ein Mikrorohr lässt sich nicht mit sich selbst verbinden; Qonnectra meldet dann „Mikrorohr kann nicht mit sich selbst verbunden werden“. Das betrifft auch den Fall, dass dasselbe Rohr über zwei Trassen auf die Arbeitsfläche gelangt ist: Beide Kreise zeigen dieselben Mikrorohre.
:::

### 12.3.2 Auto-Verbindung

Der Umschalter „Auto-Verbindung“ verbindet zwei Rohre auf einmal – jedes Mikrorohr mit dem Mikrorohr derselben Nummer im anderen Rohr.

1. Schalten Sie „Auto-Verbindung“ ein.
2. Umkreisen Sie mit gedrückter linker Maustaste die beiden Kreise, die Sie verbinden wollen. Der Bereich „Eigenschaften“ zeigt darauf „Ausgewählt: 2 Netzknoten“.
3. Klicken Sie auf „Ausgewählte Netzknoten verbinden“.

![](/videos/pipe_branch_auto_connect.webm)

Verbunden wird jedes Paar gleicher Nummer, das noch nicht verbunden ist. Qonnectra meldet anschließend die Zahl der neuen Verbindungen, etwa „7x Verbindungen erfolgreich erstellt“.

![Screenshot der Rohrverzweigung mit Hervorhebung des Umschalters „Auto-Verbindung“ und der Schaltfläche „Ausgewählte Netzknoten verbinden“ oben links](/images/manual/teil-a/pipe_branch_auto_connect.jpg)

„Auswahl löschen“ hebt die Auswahl wieder auf. Haben Sie mehr als zwei Kreise umkreist, steht statt der Schaltfläche der Hinweis „Bitte wählen Sie genau 2 Netzknoten aus“.

::: warning
Solange „Auto-Verbindung“ eingeschaltet ist, liegt eine Zeichenfläche über der Arbeitsfläche: Einzelne Mikrorohre lassen sich nicht mehr anklicken, und den Ausschnitt verschieben Sie nur noch mit der mittleren Maustaste. Das Mausrad zoomt weiterhin. Schalten Sie den Umschalter aus, wenn Sie wieder einzeln verbinden wollen.
:::

::: info
Haben die beiden Rohre keine Nummer gemeinsam oder sind alle Paare schon verbunden, meldet Qonnectra „Keine passenden Mikrorohre für die Verbindung verfügbar“ und ändert nichts.
:::

### 12.3.3 Verbindung löschen

Das rote Kreuz an der Beschriftung einer Verbindung löscht sie. Gelöscht wird dabei nur die Verbindung – die beiden Mikrorohre bleiben erhalten.

::: danger
Das Löschen erfolgt ohne Rückfrage.
:::

::: warning
Das Löschen setzt die Zugriffsstufe „Vollzugriff“ voraus; die Berechtigung zum Bearbeiten genügt dafür nicht. Fehlt sie, verschwindet die Verbindung zwar von der Arbeitsfläche, und Qonnectra meldet „Verbindung erfolgreich gelöscht“ – gelöscht ist sie damit aber nicht. Laden Sie den Netzknoten erneut, ist sie wieder da. Wenden Sie sich in diesem Fall an Ihre Administration.
:::

## 12.4 Arbeitsfläche: Anordnen, Zoomen, Sperren

Unten links liegen vier Schaltflächen: hineinzoomen, herauszoomen, alles einpassen und das Schloss. Ihre Hinweise sind englisch beschriftet („Zoom In“, „Zoom Out“, „Fit View“, „Toggle Interactivity“).

![Screenshot der Rohrverzweigung mit Hervorhebung der Schaltflächen zum Zoomen und Sperren unten links](/images/manual/teil-a/pipe_branch_controls.jpg)

Beim Öffnen ist die Arbeitsfläche **gesperrt**: Das Schloss ist geschlossen, und die Kreise lassen sich nicht verschieben. Ein Klick auf das Schloss hebt die Sperre auf – danach ziehen Sie die Kreise an eine Stelle, an der sich die Verbindungen gut lesen lassen.

Den Ausschnitt verschieben, mit dem Mausrad zoomen und Mikrorohre verbinden können Sie in beiden Zuständen; die Sperre betrifft nur das Verschieben und Auswählen der Kreise.

::: info
Die Anordnung der Kreise wird nicht gespeichert. Laden Sie den Netzknoten erneut, liegen sie wieder gleichmäßig verteilt auf einem großen Kreis.
:::

## 12.5 Voraussetzung: konfigurierte Rohrabzweig-Einstellungen

Welche Netzknoten im Feld „Rohrverzweigung auswählen“ stehen, ergibt sich aus den **Rohrabzweig-Einstellungen** des Projekts. Ihre Administration legt dort die Netzknotentypen fest, die als Rohrabzweig gelten; eingerichtet werden sie in Kapitel [Projektbezogene Konfiguration](../teil-b-betrieb-admin-qgis/22-projektbezogene-konfiguration.md).

Fehlen die Einstellungen, arbeitet die Ansicht trotzdem – die Auswahl enthält dann aber jeden Netzknoten des Projekts, und über dem Feld steht „Rohrabzweig-Einstellungen für dieses Projekt nicht konfiguriert.“ Bei vielen Netzknoten wird die Suche nach dem richtigen dadurch mühsam.
