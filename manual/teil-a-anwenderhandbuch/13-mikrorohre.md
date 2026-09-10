# 13. Mikrorohre

Die Ansicht **Mikrorohre** zeigt, welche Mikrorohre in den Rohren einer Trasse liegen und wofür sie belegt sind. Hier dokumentieren Sie außerdem, welcher Hausanschluss an welchem Mikrorohr hängt. Sie erreichen sie über die linke Navigationsleiste in der Gruppe „Rohr“ durch Klicken auf den Menüpunkt „Mikrorohre“.

![Screenshot der Ansicht Mikrorohre mit der Karte des Projekts](/images/manual/teil-a/microduct.jpg)

Die Ansicht besteht aus einem Kartenfenster, das sich wie in Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster) beschrieben verhält, und der Info-Box, die sich mit dem ersten Klick öffnet.

## 13.1 Graben in der Karte auswählen

Klicken Sie in der Karte auf ein Trassensegment. Anklickbar sind ausschließlich Trassen; Adressen, Netzknoten und Gebiete zeichnet die Karte nur zur Orientierung mit. Solange die Info-Box geschlossen ist, steht am unteren Rand der Karte der Hinweis „Klicken Sie auf einen Graben um die Sidebar zu öffnen.“

Mit dem Klick öffnet sich rechts die Info-Box mit der Trassen-ID als Überschrift. Sie hat hier nur den Reiter „Übersicht“ und darin die Rohre, die in der Trasse liegen – jedes in einer eigenen aufklappbaren Zeile mit Namen und Rohrtyp, etwa „St-V02-04 (12x10/6)“.

![Screenshot der Ansicht Mikrorohre mit Hervorhebung der Info-Box am rechten Rand mit den Rohren der angeklickten Trasse](/images/manual/teil-a/microduct_drawer.jpg)

::: info
Die Anwendung nennt das Trassensegment in dieser Ansicht „Graben“ und die Rohre „Leerrohre“. Gemeint sind dieselben Objekte wie in der Karte und in der Rohrverwaltung.
:::

::: info
Liegt in der angeklickten Trasse kein Rohr, meldet die Info-Box „Keine Leerrohre in diesem Graben gefunden“. Welches Rohr in welcher Trasse liegt, legen Sie in der Rohrzuordnung fest, siehe Kapitel [Rohrzuordnung](./11-rohrzuordnung.md).
:::

## 13.2 Mikrorohrtabelle: Nummer, Farbe, Status

Klappen Sie ein Rohr auf, listet die Tabelle darunter seine Mikrorohre auf – mit denselben Spalten wie der Reiter „Status“ der Rohrverwaltung, siehe Abschnitt [Mikrorohre eines Rohrs](./10-rohrverwaltung.md#_10-4-mikrorohre-eines-rohrs): „#“, „Farbe“, „Adresse“, „Kabel“ und „Status“.

![Screenshot der Ansicht Mikrorohre mit der Tabelle der Mikrorohre eines Rohrs in der verbreiterten Info-Box](/images/manual/teil-a/microduct_table.jpg)

Zwei Unterschiede zur Rohrverwaltung: Der Status ist hier nur zu lesen, und hinter jeder Zeile stehen die Schaltflächen zum Dokumentieren des Hausanschlusses, siehe Abschnitt [Hausanschlüsse dokumentieren](#_13-4-hausanschlusse-dokumentieren).

In der Standardbreite der Info-Box reicht die Tabelle über deren rechten Rand hinaus. Ziehen Sie die Info-Box breiter, bis die Schaltflächen sichtbar sind, siehe Abschnitt [Die Info-Box](./03-wiederkehrende-bedienelemente.md#_3-6-die-info-box-mit-ihren-reitern).

Sie können mehrere Rohre gleichzeitig aufgeklappt lassen; ein erneuter Klick auf die Zeile klappt eines wieder zu.

## 13.3 Belegung und Verbindungen

Womit ein Mikrorohr belegt ist, steht in zwei Spalten: „Adresse“ nennt den Hausanschluss, der daran hängt, „Kabel“ das eingezogene Kabel mit seinem Kabeltyp in Klammern. Bleiben beide leer, ist das Mikrorohr frei.

Die beiden Belegungen entstehen an verschiedenen Stellen: Den Hausanschluss tragen Sie hier ein, siehe Abschnitt [Hausanschlüsse dokumentieren](#_13-4-hausanschlusse-dokumentieren), das Kabel verknüpfen Sie im Netzschema, siehe Kapitel [Netzschema](./14-netzschema.md). Welche Mikrorohre an einem Rohrabzweig ineinander übergehen, zeigt diese Ansicht nicht; das steht in der Rohrverzweigung, siehe Kapitel [Rohrverzweigung](./12-rohrverzweigung.md).

Solange ein Rohr aufgeklappt ist, hebt die Karte alle Trassensegmente hervor, in denen dieses Rohr liegt – nicht nur das angeklickte. So sehen Sie, welchen Weg das Rohr im Netz nimmt, dessen Mikrorohre Sie gerade vor sich haben.

![Screenshot der Ansicht Mikrorohre mit Hervorhebung des aufgeklappten Rohrs in der Info-Box und der farbig hervorgehobenen Trassensegmente in der Karte](/images/manual/teil-a/microduct_highlight.jpg)

Die Schaltfläche mit den Pfeilen in der Zeile eines Rohrs lädt dessen Mikrorohre neu aus der Datenbank. Sie hilft, wenn jemand anderes die Daten in der Zwischenzeit geändert hat.

## 13.4 Hausanschlüsse dokumentieren

Mit „Zuordnen“ verknüpfen Sie ein Mikrorohr mit einem Hausanschluss:

1. Klicken Sie in der Zeile des Mikrorohrs auf „Zuordnen“.
2. Klicken Sie in der Karte auf den Netzknoten des Hausanschlusses.

![](/videos/microduct_assign.webm)

Danach steht die Adresse des Netzknotens in der Spalte „Adresse“, und Qonnectra meldet „Hausanschluss erfolgreich zugeordnet“.

Zwischen den beiden Klicks befindet sich die Ansicht in einem eigenen Modus: In der Karte sind dann nur noch Netzknoten anklickbar, und alle Schaltflächen der Tabelle sind ausgegraut. Daran allein erkennen Sie den Modus – der Mauszeiger bleibt unverändert. Mit der Taste Esc brechen Sie ab, ohne etwas zu ändern.

![Screenshot der Ansicht Mikrorohre mit Hervorhebung der Schaltflächen „Zuordnen“ und „Aufheben“ in der Tabelle der Mikrorohre](/images/manual/teil-a/microduct_assign.jpg)

::: warning
Der angeklickte Netzknoten muss eine Adresse haben. Andernfalls meldet Qonnectra „Diesem Netzknoten wurde noch keine Adresse zugeordnet.“ und ändert nichts; der Modus bleibt aktiv, sodass Sie es gleich erneut versuchen können.
:::

::: warning
Trifft Ihr Klick gar keinen Netzknoten, schließt sich die Info-Box – der Modus bleibt trotzdem aktiv. Weil in ihm nur Netzknoten anklickbar sind, öffnet danach auch ein Klick auf eine Trasse keine Info-Box mehr, und die Ansicht wirkt, als reagiere sie nicht mehr. Drücken Sie Esc; erst danach können Sie wieder einen Graben auswählen.
:::

„Aufheben“ löst die Verknüpfung wieder; die Schaltfläche steht nur in Zeilen, die eine Adresse haben. Qonnectra meldet „Hausanschluss erfolgreich aufgehoben“, und die Spalte „Adresse“ ist wieder leer.

::: info
Verknüpft wird das Mikrorohr mit dem Netzknoten, nicht mit der Adresse selbst; die Tabelle zeigt die Adresse dieses Netzknotens. Ein Netzknoten ohne Adresse kommt deshalb nicht infrage.
:::
