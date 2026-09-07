# 7. Rohrzuordnung

Die **Rohrzuordnung** ordnet Rohre den **Trassensegmenten** zu, in denen sie liegen. Sie erreichen sie über die linke Navigation in der Gruppe „Rohr“ durch Klicken auf den Menüpunkt „Zuordnung“.

![Screenshot Rohrzuordnung mit der Karte links und dem Arbeitsbereich rechts](/images/manual/teil-a/conduit_connection.jpg)

Der Bildschirm ist zweigeteilt: links die Karte, rechts der Arbeitsbereich.

## 7.1 Grundprinzip

Die Zuordnung geschieht in der Karte: Sie wählen rechts ein Rohr aus und klicken links das Trassensegment an, in dem es liegt. Ein **Trassensegment** ist ein einzelnes Objekt des Layers „Trasse“ und trägt eine eigene Trassen-ID.

Anklickbar sind ausschließlich die Segmente dieses Layers. Adressen, Netzknoten und Gebiete zeichnet die Karte zwar mit, sie dienen hier aber nur der Orientierung – eine Info-Box wie in der Karte (siehe Kapitel [Karte](./05-karte.md)) öffnet sich nicht.

Solange kein Rohr ausgewählt ist, bleiben Klicks in die Karte ohne Wirkung; ein Hinweis am unteren Rand der Karte fordert zur Auswahl auf. Klicken Sie trotzdem hinein, erscheint die Meldung „Kein Rohr ausgewählt“.

::: warning
Es gibt keinen „Speichern“-Button. Jede Zuordnung ist mit dem Klick gespeichert und lässt sich nur durch Löschen wieder aufheben, siehe Abschnitt [Löschen einer Zuordnung](#_7-3-4-loschen-einer-zuordnung).
:::

## 7.2 Kartennavigation und Arbeitsbereich

Die Karte verhält sich wie unter dem Menüpunkt „Karte“, siehe Kapitel [Karte](./05-karte.md).

Rechts daneben liegt der Arbeitsbereich, von oben nach unten: die Umschalter „Routing-Modus“ und „Trassenverbindungen anzeigen“, die Felder „Kennzeichen“ und „Rohr“ und darunter die Liste der zugeordneten Trassensegmente.

![Screenshot Rohrzuordnung mit Hervorhebung des Arbeitsbereichs rechts neben der Karte](/images/manual/teil-a/conduit_connection_edit_area.jpg)

### 7.2.1 Routing-Modus

Der **Routing-Modus** bestimmt, wie viele Trassensegmente ein Klick in die Karte zuordnet.

- Routing-Modus **ausgeschaltet**: Jeder Klick ordnet genau das angeklickte Trassensegment zu.
- Routing-Modus **eingeschaltet**: Der erste Klick setzt den Start-, der zweite den Endpunkt. Qonnectra berechnet den kürzesten Weg zwischen beiden und ordnet alle Trassensegmente auf diesem Weg auf einmal zu.

![Screenshot Rohrzuordnung mit Hervorhebung des Umschalters „Routing-Modus“ oben im Arbeitsbereich](/images/manual/teil-a/conduit_connection_routing.jpg)

![](/videos/conduit_connection_routing.webm)

Ein dritter Klick verwirft die berechnete Route und setzt einen neuen Startpunkt; dasselbe bewirkt das Aus- und Wiedereinschalten des Routing-Modus. Verworfen wird dabei nur die Auswahl in der Karte – was bereits zugeordnet ist, bleibt in der Liste.

::: warning
Start- und Endpunkt müssen im Trassennetz miteinander verbunden sein. Findet Qonnectra keinen Weg, meldet es „Fehler beim Berechnen der Route“, und es wird nichts zugeordnet. Wie groß der Abstand zwischen zwei Segmenten dabei sein darf, legt die „Routing-Toleranz“ unter „Einstellungen“ im Abschnitt „Rohrzuordnung“ fest.
:::

### 7.2.2 Trassenverbindungen anzeigen

Der Umschalter „Trassenverbindungen anzeigen“ hebt die Trassensegmente, die dem ausgewählten Rohr bereits zugeordnet sind, in der Karte farbig hervor. So sehen Sie, welchen Weg das Rohr im Netz nimmt und an welcher Stelle noch eine Zuordnung fehlt.

![Screenshot Rohrzuordnung mit Hervorhebung des Umschalters „Trassenverbindungen anzeigen“ oben im Arbeitsbereich und der hervorgehobenen Trassensegmente in der Kartenmitte](/images/manual/teil-a/conduit_connection_linked_trenches.jpg)

Ohne ausgewähltes Rohr bleibt der Umschalter wirkungslos.

## 7.3 Zuordnung von Rohren zu Trassensegmenten

Die Arbeit besteht aus zwei Schritten: erst das Rohr auswählen, dann die Trassensegmente in der Karte anklicken, in denen es liegt.

### 7.3.1 Auswahl von Rohren

Zur Auswahl stehen die Rohre des Projekts, das oben links in der Kopfzeile ausgewählt ist – eingegrenzt auf das Kennzeichen im gleichnamigen Feld.

![Screenshot Rohrzuordnung mit Hervorhebung der Projektauswahl in der Kopfzeile und des Feldes „Kennzeichen“ im Arbeitsbereich](/images/manual/teil-a/conduit_connection_project_flag.jpg)

Die Rohre stehen in der Liste mit ihrem Rohrtyp in Klammern, etwa „St-VL-02 (7x16/12)“ – anders als in der Rohrverwaltung, die Name und Rohrtyp in getrennten Spalten führt.

![Screenshot Rohrzuordnung mit Hervorhebung des Feldes „Rohr“ und der geöffneten Rohrliste im Arbeitsbereich](/images/manual/teil-a/conduit_connection_conduit.jpg)

::: info
Wechseln Sie das Kennzeichen, wird die Rohrauswahl zurückgesetzt. Gibt es zu Projekt und Kennzeichen kein Rohr, meldet das Feld „Keine Rohre gefunden“.
:::

Mit der Auswahl füllt sich die Liste darunter mit den Trassensegmenten, die dem Rohr bereits zugeordnet sind.

### 7.3.2 Trassensegmente zuordnen

Klicken Sie in der Karte auf das Trassensegment, in dem das ausgewählte Rohr liegt. Achten Sie darauf, dass der Layer „Trasse“ in der Legende eingeschaltet ist und dass der Routing-Modus so steht, wie Sie ihn brauchen, siehe Abschnitt [Routing-Modus](#_7-2-1-routing-modus).

Nach der Zuordnung erscheint kurz die Meldung „Trassenverbindung gespeichert“, und das Segment steht in der Liste.

![](/videos/conduit_connection_map_selection.webm)

::: info
Ein Trassensegment kann mehrere Rohre führen; dasselbe Segment taucht deshalb bei mehreren Rohren in der Liste auf. Klicken Sie ein Segment an, das dem Rohr schon zugeordnet ist, meldet Qonnectra „Keine neuen Trassenverbindungen“ und ändert nichts.
:::

### 7.3.3 Zugeordnete Trassensegmente finden

Die Liste führt die Trassen-IDs der zugeordneten Segmente auf. Ein Klick auf die Spaltenüberschrift „Trassen-ID“ kehrt die Sortierung um, das Suchfeld darüber grenzt die Liste ein; beides bezieht sich auf alle Einträge, nicht nur auf die angezeigte Seite. Eine Seite umfasst zehn Einträge; darunter stehen die Gesamtzahl und die Seitenauswahl.

![Screenshot Rohrzuordnung mit Hervorhebung der Liste der zugeordneten Trassensegmente samt Suchfeld und Seitenauswahl im Arbeitsbereich](/images/manual/teil-a/conduit_connection_list.jpg)

Ein Klick auf eine Zeile zoomt die Karte auf das Segment und hebt es kurz blinkend hervor.

![](/videos/conduit_connection_map_find.webm)

Um Liste und Karte abzugleichen, schalten Sie in der Legende die Beschriftungen des Layers „Trasse“ ein: Die Karte zeigt dann die Trassen-IDs an, die in der Liste stehen.

### 7.3.4 Löschen einer Zuordnung

Über das Papierkorb-Symbol am rechten Rand einer Zeile heben Sie eine Zuordnung wieder auf. Gelöscht wird dabei nur die Verbindung zwischen Rohr und Trassensegment – beide selbst bleiben erhalten.

::: danger
Das Löschen erfolgt ohne Rückfrage: Der Eintrag verschwindet mit dem Klick, und rückgängig machen lässt sich das nicht.
:::

::: warning
Das Löschen setzt die Zugriffsstufe „Vollzugriff“ voraus; die Berechtigung zum Bearbeiten genügt dafür nicht. Fehlt sie, erscheint „Fehler beim Löschen der Trassenverbindung“, und die Zuordnung bleibt bestehen. Wenden Sie sich in diesem Fall an Ihre Administration.
:::
