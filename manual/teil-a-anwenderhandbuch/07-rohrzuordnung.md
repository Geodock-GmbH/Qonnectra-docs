# 7. Rohrzuordnung

Die **Rohrzuordnung** dient ausschließlich der Zuordnung von Rohren zu bestehenden **Trassenabschnitten (Trassensegmenten)**. Ziel ist es, zu dokumentieren, welche Rohre auf welchen Trassenverläufen liegen. Die Rohrzuordnung ist damit ein zentrales Werkzeug zur strukturellen Verknüpfung von Netzbestandteilen – nicht zur allgemeinen Kartennavigation.

<img
  src="/images/manual/teil-a/conduit_connection.jpg"
  alt="Screenshot Rohrzurdnung Übersicht"
  style="display: block; max-width: 512px; width: 100%; margin: 0 auto;"
/>

## 7.1 Grundprinzip

Solange kein Rohr ausgewählt ist, kann nichts in der Karte selektiert werden. Die Karte zeigt Elemente wie Trassen, Rohrabzweige, Hausanschlüsse und Adresspunkte an, diese sind jedoch nur zur Orientierung sichtbar. Die Karte dient hier ausschließlich der Zuordnung von Rohren zu Trassen.

## 7.2 Kartennavigation und Modi

Die Kartenfunktionen entsprechen vollständig denen in der allgemeinen Karte (siehe Kapitel [Karte](./05-karte.md)):

- Suchen über das Suchfeld (oben links)
- Transparenz anpassen (unten links)
- Ein- und Ausblenden von Layern über die interaktive Legende (oben rechts)

Rechts neben der Karte befindet sich der Bearbeitungsbereich mit verschiedenen Auswahlmöglichkeiten und einer Liste der zugeordneten Trassensegmente zu einem ausgewählten Rohr. 

<img
  src="/images/manual/teil-a/conduit_connection_editArea.jpg"
  alt="Screenshot Rohrzuordnung mit Hervorhebung des Bearbeitungsbereichs rechts"
  style="display: block; max-width: 512px; width: 100%; margin: 0 auto;"
/>

### 7.2.1 Routing-Modus

Der Routing-Modus bestimmt, wie die Zuordnung von Rohr zu Trasse beim Klicken auf Trassensegmente in der Karte vollzogen wird.

<img
  src="/images/manual/teil-a/conduit_connection_routing.jpg"
  alt="Screenshot Rohrverwaltung Arbeitsbereich mit Hervorhebung der Schaltfläche für den Routing-Modus"
  style="display: block; max-width: 512px; width: 100%; margin: 0 auto;"
/>

- Routing-Modus **ausgeschaltet** (Regler links und grau): Einzelne Trassenabschnitte können per Klick ausgewählt und dem Rohr hinzugefügt werden. Hierbei wird immer nur ein Trassensegment der Liste hinzugefügt.

- Routing-Modus **eingeschaltet** (Regler rechts und farbig): Wählen Sie zuerst ein Trassensegment als Start- und dann eins als Endpunkt aus (2 Klicks in der Karte). Das System berechnet automatisch den besten Pfad zwischen beiden Punkten und ordnet die entsprechenden Trassensegmente dem Rohr zu. Hierbei werden mehrere Segmente der Liste auf der rechten Seite hinzugefügt.

### 7.2.2 Trassenverbindungen anzeigen

Beim Umschalter "Trassenverbindungen anzeigen" haben Sie die Möglichkeit bei einer Rohrauswahl, eine visuelle Rückmeldung über bereits bestehende Zuordnungen zu Segmenten in der Karte zu erhalten. 

<img
  src="/images/manual/teil-a/conduit_connection_showTrench.jpg"
  alt="Screenshot Rohrverwaltung Arbeitsbereich mit Hervorhebung der Schaltfläche Trassenverbindungen anzeigen"
  style="display: block; max-width: 512px; width: 100%; margin: 0 auto;"
/>

- Trassenverbindungen anzeigen **ausgeschaltet** (Regler links und grau): Es erfolgt keine visuelle Hervorhebung in der Karte.

- Trassenverbindungen **eingeschaltet** (Regler rechts und farbig): Beim Auswählen eines Rohrs werden alle zugehörigen Trassenabschnitte in der Karte farblich hervorgehoben.

<video
  controls
  playsinline
  preload="metadata"
  style="max-width: 100%; border-radius: 12px;"
  src="/videos/conduit_connection_showTrench.webm"
/>


## 7.3 Zuordnung von Rohren zu Trassensegmenten

Mit Auswahl eines Rohrs wird automatisch der Bearbeitungsmodus aktiviert, in dem Zuordnungen direkt übernommen werden – ohne Speichern-Button. Änderungen werden sofort gespeichert und können nicht rückgängig gemacht werden.

### 7.3.1 Auswahl von Rohren

Die verfügbaren Rohre richten sich nach dem oben ausgewählten Projekt (oben links in der Kopfzeile) und dem eingestellten Kennzeichen (direkt über der Rohrauswahl). 

<img
  src="/images/manual/teil-a/conduit_connection_conduitSelection.jpg"
  alt="Screenshot mit Hervorhebung Projektauswahl und Kennzeichenauswahl"
  style="display: block; max-width: 512px; width: 100%; margin: 0 auto;"
/>

Zur Auswahl eines Kennzeichens klicken Sie auf den "Pfeil-nach-unten" neben dem Eingabefeld oder tippen Sie in das Eingabefeld. Danach öffnet sich eine Liste, aus der Sie das entsprechende Kennzeichen wählen können.

Die Rohrauswahl im Feld darunter funktioniert ebenso. Zur Auswahl eines Rohrs klicken Sie auf den "Pfeil-nach-unten" neben dem Eingabefeld oder tippen Sie in das Eingabefeld. Danach öffnet sich eine Liste, aus der Sie das entsprechende Rohr wählen können.

<img
  src="/images/manual/teil-a/conduit_connection_conduit.jpg"
  alt="Screenshot Bearbeitungsbereich mit Hervorhebung Eingabefeld Rohr"
  style="display: block; max-width: 512px; width: 100%; margin: 0 auto;"
/>

Ist das ausgewählte Rohr bereits Trassensegmenten auf der Karte zugeordnet, erscheint anschließend darunter eine Liste mit Einträgen zu Trassensegmenten (Bezeichnung: Trassen-ID). 

### 7.3.2 Rohre Trassensegementen zuordnen

Die Rohre werden den Trassensegmenten anhand der Auswahl in der Karte hinzugefügt. Hierzu klicken Sie auf ein Trassensegment in der Karte. Beachten Sie, ob die Trassen in der Karte eingeschaltet sind (Layer in der Legende über das Auge-Symbol einschalten). Bitte beachten Sie auch, ob der Routing-Modus an (zwei Klicks auf der Karte für Start- und Endpunkt) oder aus (ein Klick für ein Trassensegment) geschaltet ist. Zum besseren Verständnis finden Sie die Erklärung zum Routing-Modus weiter oben in diesem Abschnitt.

Wenn die Zuordnung erfolgreich war, erscheint am unteren Bildschirmrand eine kurze Bestätigungsnachricht. Gleichzeitig wird das Trassensegment in der Liste unterhalb des ausgewählten Rohrs angezeigt.

<video
  controls
  playsinline
  preload="metadata"
  style="max-width: 100%; border-radius: 12px;"
  src="/videos/conduit_connection_mapSelection.webm"
/>

Sollte "Trassenverbindungen anzeigen" (weiter oben) aktiviert sein, wird das hinzugefügte Trassensegment dauerhaft farblich hervorgehoben.

### 7.3.3 Zugeordnete Trassensegmente finden

Wenn Sie in der Liste auf eine Trassen-ID klicken, wird die Karte zu diesem Segment gezoomt und dieses kurz blinkend hervorgehoben. Bitte beachten Sie, dass die Liste aus mehreren Seiten bestehen kann. Am unteren Ende der Liste finden Sie eine Möglichkeit zum Umblättern. 

<video
  controls
  playsinline
  preload="metadata"
  style="max-width: 100%; border-radius: 12px;"
  src="/videos/conduit_connection_mapFind.webm"
/>


### 7.3.4 Löschen einer Zuordnung

Falls einer Trasse versehentlich ein Rohr zugeordnet wurde, kann diese Zuordnung über das Papierkorb-Symbol neben der Trassen-ID in der Liste wieder gelöscht werden. Um die Zuordnung kontrolliert vorzunehmen, hilft es, über die Legende rechts die Labels (Beschriftungen) der Trassensegmente zu aktivieren. Diese zeigen die Trassen-IDs an, die Sie mit der Liste abgleichen können.

