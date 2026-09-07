# 11. Rohrzuordnung

Die **Rohrzuordnung** ordnet Rohre den **Trassensegmenten** zu, in denen sie liegen. Sie erreichen sie über die linke Navigationsleiste in der Gruppe „Rohr“ durch Klicken auf den Menüpunkt „Zuordnung“.

![Screenshot Rohrzuordnung mit der Karte links und dem Arbeitsbereich rechts](/images/manual/teil-a/conduit_connection.jpg)

Der Bildschirm ist zweigeteilt: links die Karte, rechts der Arbeitsbereich. Die Zuordnung geschieht in der Karte: Sie wählen rechts ein Rohr aus und klicken links das Trassensegment an, in dem es liegt. Ein **Trassensegment** ist ein einzelnes Objekt des Layers „Trasse“ und trägt eine eigene Trassen-ID.

Anklickbar sind ausschließlich die Segmente dieses Layers. Adressen, Netzknoten und Gebiete zeichnet die Karte zwar mit, sie dienen hier aber nur der Orientierung – eine Info-Box wie in der Karte (siehe Kapitel [Karte](./05-karte.md)) öffnet sich nicht.

Solange kein Rohr ausgewählt ist, bleiben Klicks in die Karte ohne Wirkung; ein Hinweis am unteren Rand der Karte fordert zur Auswahl auf. Klicken Sie trotzdem hinein, erscheint die Meldung „Kein Rohr ausgewählt“.

::: warning
Es gibt keinen „Speichern“-Button. Jede Zuordnung ist mit dem Klick gespeichert und lässt sich nur durch Löschen wieder aufheben, siehe Abschnitt [Zuordnung löschen](#_11-2-3-zuordnung-loschen).
:::

Die Karte verhält sich wie in Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster) beschrieben.

## 11.1 Rohr auswählen

Rechts neben der Karte liegt der Arbeitsbereich, von oben nach unten: die Umschalter „Routing-Modus“ und „Trassenverbindungen anzeigen“, die Felder „Kennzeichen“ und „Rohr“ und darunter die Liste der zugeordneten Trassensegmente.

![Screenshot Rohrzuordnung mit Hervorhebung des Arbeitsbereichs rechts neben der Karte](/images/manual/teil-a/conduit_connection_edit_area.jpg)

Zur Auswahl stehen die Rohre des Projekts, das oben links in der Kopfzeile ausgewählt ist (siehe Abschnitt [Projekt auswählen und wechseln](./01-erste-schritte.md#_1-3-projekt-auswahlen-und-wechseln)) – eingegrenzt auf das Kennzeichen im gleichnamigen Feld, siehe Abschnitt [Nach Kennzeichen eingrenzen](#_11-6-nach-kennzeichen-eingrenzen).

Die Rohre stehen in der Liste mit ihrem Rohrtyp in Klammern, etwa „St-VL-02 (7x16/12)“ – anders als in der Rohrverwaltung, die Name und Rohrtyp in getrennten Spalten führt.

![Screenshot Rohrzuordnung mit Hervorhebung des Feldes „Rohr“ und der geöffneten Rohrliste im Arbeitsbereich](/images/manual/teil-a/conduit_connection_conduit.jpg)

Mit der Auswahl füllt sich die Liste darunter mit den Trassensegmenten, die dem Rohr bereits zugeordnet sind.

## 11.2 Trassen einzeln zuordnen und Zuordnung aufheben

### 11.2.1 Trassensegmente zuordnen

Klicken Sie in der Karte auf das Trassensegment, in dem das ausgewählte Rohr liegt. Achten Sie darauf, dass der Layer „Trasse“ in der Legende eingeschaltet ist und dass der Routing-Modus so steht, wie Sie ihn brauchen, siehe Abschnitt [Routing-Modus](#_11-3-routing-modus).

Ein Trassensegment genau zu treffen, ist der schwierigste Teil dieser Arbeit; welche Hilfen es dafür gibt, beschreibt Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster) unter „Objekte anklicken“.

Nach der Zuordnung erscheint kurz die Meldung „Trassenverbindung gespeichert“, und das Segment steht in der Liste.

![](/videos/conduit_connection_map_selection.webm)

::: info
Ein Trassensegment kann mehrere Rohre führen; dasselbe Segment taucht deshalb bei mehreren Rohren in der Liste auf. Klicken Sie ein Segment an, das dem Rohr schon zugeordnet ist, meldet Qonnectra „Keine neuen Trassenverbindungen“ und ändert nichts.
:::

### 11.2.2 Zugeordnete Trassensegmente finden

Die Liste führt die Trassen-IDs der zugeordneten Segmente auf. Ein Klick auf die Spaltenüberschrift „Trassen-ID“ kehrt die Sortierung um, das Suchfeld darüber grenzt die Liste ein; beides bezieht sich auf alle Einträge, nicht nur auf die angezeigte Seite. Eine Seite umfasst zehn Einträge; darunter stehen die Gesamtzahl und die Seitenauswahl.

![Screenshot Rohrzuordnung mit Hervorhebung der Liste der zugeordneten Trassensegmente samt Suchfeld und Seitenauswahl im Arbeitsbereich](/images/manual/teil-a/conduit_connection_list.jpg)

Ein Klick auf eine Zeile zoomt die Karte auf das Segment und hebt es kurz blinkend hervor.

![](/videos/conduit_connection_map_find.webm)

Um Liste und Karte abzugleichen, schalten Sie in der Legende die Beschriftungen des Layers „Trasse“ ein: Die Karte zeigt dann die Trassen-IDs an, die in der Liste stehen.

### 11.2.3 Zuordnung löschen

Über das Papierkorb-Symbol am rechten Rand einer Zeile heben Sie eine Zuordnung wieder auf. Gelöscht wird dabei nur die Verbindung zwischen Rohr und Trassensegment – beide selbst bleiben erhalten.

::: danger
Das Löschen erfolgt ohne Rückfrage: Der Eintrag verschwindet mit dem Klick, und rückgängig machen lässt sich das nicht.
:::

::: warning
Das Löschen setzt die Zugriffsstufe „Vollzugriff“ voraus; die Berechtigung zum Bearbeiten genügt dafür nicht. Fehlt sie, erscheint „Fehler beim Löschen der Trassenverbindung“, und die Zuordnung bleibt bestehen. Wenden Sie sich in diesem Fall an Ihre Administration.
:::

## 11.3 Routing-Modus

Der **Routing-Modus** bestimmt, wie viele Trassensegmente ein Klick in die Karte zuordnet.

- Routing-Modus **ausgeschaltet**: Jeder Klick ordnet genau das angeklickte Trassensegment zu.
- Routing-Modus **eingeschaltet**: Der erste Klick setzt den Start-, der zweite den Endpunkt. Qonnectra berechnet den kürzesten Weg zwischen beiden und ordnet alle Trassensegmente auf diesem Weg auf einmal zu.

![Screenshot Rohrzuordnung mit Hervorhebung des Umschalters „Routing-Modus“ oben im Arbeitsbereich](/images/manual/teil-a/conduit_connection_routing.jpg)

![](/videos/conduit_connection_routing.webm)

Ein dritter Klick verwirft die berechnete Route und setzt einen neuen Startpunkt; dasselbe bewirkt das Aus- und Wiedereinschalten des Routing-Modus. Verworfen wird dabei nur die Auswahl in der Karte – was bereits zugeordnet ist, bleibt in der Liste.

::: warning
Start- und Endpunkt müssen im Trassennetz miteinander verbunden sein. Findet Qonnectra keinen Weg, meldet es „Fehler beim Berechnen der Route“, und es wird nichts zugeordnet.
:::

## 11.4 Routing-Toleranz richtig wählen

Wie groß der Abstand zwischen zwei Segmenten sein darf, damit der Routing-Modus sie noch als verbunden ansieht, legt die „Routing-Toleranz“ unter „Einstellungen“ im Abschnitt „Rohrzuordnung“ fest, siehe Kapitel [Einstellungen](./17-einstellungen.md).

## 11.5 Trassenverbindungen anzeigen

Der Umschalter „Trassenverbindungen anzeigen“ hebt die Trassensegmente, die dem ausgewählten Rohr bereits zugeordnet sind, in der Karte farbig hervor. So sehen Sie, welchen Weg das Rohr im Netz nimmt und an welcher Stelle noch eine Zuordnung fehlt.

![Screenshot Rohrzuordnung mit Hervorhebung des Umschalters „Trassenverbindungen anzeigen“ oben im Arbeitsbereich und der hervorgehobenen Trassensegmente in der Kartenmitte](/images/manual/teil-a/conduit_connection_linked_trenches.jpg)

Ohne ausgewähltes Rohr bleibt der Umschalter wirkungslos.

## 11.6 Nach Kennzeichen eingrenzen

Das Feld „Kennzeichen“ grenzt die Rohrauswahl auf ein Kennzeichen ein.

![Screenshot Rohrzuordnung mit Hervorhebung der Projektauswahl in der Kopfzeile und des Feldes „Kennzeichen“ im Arbeitsbereich](/images/manual/teil-a/conduit_connection_project_flag.jpg)

::: info
Wechseln Sie das Kennzeichen, wird die Rohrauswahl zurückgesetzt. Gibt es zu Projekt und Kennzeichen kein Rohr, meldet das Feld „Keine Rohre gefunden“.
:::
