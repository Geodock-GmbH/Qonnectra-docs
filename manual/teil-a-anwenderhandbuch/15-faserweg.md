# 15. Faserweg

Der **Faserweg** verfolgt eine Faser durch das Netz: von einem Einstiegspunkt über Kabel und Spleiße bis zu den Adressen und Wohneinheiten, die an ihr hängen. Sie erreichen ihn über die linke Navigationsleiste in der Gruppe „Kabel“ durch Klicken auf den Menüpunkt „Faserweg“.

![Screenshot der Ansicht Faserweg mit den fünf Einstiegspunkten und dem Suchfeld](/images/manual/teil-a/trace.jpg)

Die Ansicht liest nur: Sie ändert nichts am Datenbestand und speichert kein Ergebnis. Was sie zeigt, entsteht im Netzschema, siehe Kapitel [Netzschema](./14-netzschema.md) – vor allem die Spleiße, denn ohne sie endet jede Verfolgung am ersten Kabel.

## 15.1 Einstiegspunkt wählen: Adresse, Netzknoten, Kabel, Wohneinheit, Faser

Oben stehen die fünf Arten von Einstiegspunkten: „Adresse“, „Netzknoten“, „Kabel“, „Wohneinheiten“ und „Faser“. Jede hat ihr eigenes Suchfeld; die Suche beginnt ab zwei Zeichen, bis dahin steht dort „Mindestens 2 Zeichen eingeben zum Suchen“.

Jeder Treffer nennt in der ersten Zeile das Objekt und darunter eine Zusatzangabe – bei Adressen die Adress-ID, bei Netzknoten den Netzknotentyp, bei Kabeln den Kabeltyp, bei Wohneinheiten die Adresse. Ein Klick startet die Verfolgung.

![Screenshot der Ansicht Faserweg mit Hervorhebung des Suchfeldes und der Trefferliste zu einer Adresse](/images/manual/teil-a/trace_search.jpg)

Was verfolgt wird, hängt vom Einstiegspunkt ab:

- **Adresse** – alle Fasern, die an den Netzknoten und Wohneinheiten dieser Adresse enden.
- **Netzknoten** – alle Fasern, die durch ihn laufen.
- **Kabel** – alle Fasern des Kabels.
- **Wohneinheit** – die Faser, die auf dem Port dieser Wohneinheit liegt.
- **Faser** – genau diese eine Faser. Nur dieser Einstieg kennt die Signalanalyse (siehe Abschnitt [Signalquelle, Signalreichweite und Unterbrechungen](#_15-4-signalquelle-signalreichweite-und-unterbrechungen)) und die Karte (siehe Abschnitt [Geometrie](#_15-6-geometrie-modus-ausrichtung-geojson-download)).

Der Reiter „Faser“ verlangt zwei Schritte: Suchen Sie zuerst das Kabel („Wählen Sie ein Kabel, um dessen Fasern anzuzeigen“). Danach steht das gewählte Kabel mit Kabeltyp und Faserzahl oben, darunter seine Bündel. Klappen Sie ein Bündel auf, stehen dessen Fasern mit „#“ und „Farbe“ darin; „Folgen“ startet die Verfolgung.

![Screenshot der Ansicht Faserweg mit Hervorhebung des ausgewählten Kabels und der Fasern des ersten Bündels](/images/manual/teil-a/trace_fiber_picker.jpg)

Das Kreuz am rechten Rand der Kabelzeile führt zurück zur Kabelsuche.

::: info
Die Suche ist fehlertolerant und sucht nach Ähnlichkeit: „Toft 1“ liefert auch Toft 10 bis Toft 21. Achten Sie deshalb auf die Zusatzangabe unter dem Treffer, bevor Sie klicken.
:::

::: info
Denselben Faserweg erreichen Sie aus anderen Ansichten heraus über die Schaltfläche „Folgen“ – an einem Netzknoten und einer Adresse in der Karte (siehe Abschnitt [Von der Karte in den Faserweg wechseln](./05-karte.md#_5-7-von-der-karte-in-den-faserweg-wechseln)), an einem Kabel und einer Faser in der Kabelübersicht einer Trasse und an einer aufgelegten Faser im Netzschema (siehe Abschnitt [Spleiße und Ports](./14-netzschema.md#_14-8-spleiße-und-ports)).
:::

## 15.2 Weg lesen: Kabelpfad, Spleiße, Containerpfad

Das Ergebnis ist immer gleich aufgebaut: „Statistiken“, „Einstiegspunkt“, „Kabelinfrastruktur“ und „Faserwege“. „Zurück“ oben links führt zur Auswahl des Einstiegspunkts.

![Screenshot des Ergebnisses eines Faserwegs für eine Adresse mit Statistiken, Einstiegspunkt, Kabelinfrastruktur und der Tabelle der Faserwege](/images/manual/teil-a/trace_result.jpg)

Die **Statistiken** zählen, was auf dem Weg liegt: „Fasern“, „Netzknoten“, „Spleiss“, „Kabel“, „Gräben“, „Adressen“ und „Wohneinheiten“. „Verzweigungen“ zählt nicht, sondern steht auf „Ja“ oder „Nein“, je nachdem, ob sich der Weg irgendwo aufteilt.

::: warning
Die Statistiken summieren über alle gefundenen Wege. Jeder Weg bringt seine Kabel, Netzknoten und Trassen erneut mit, sodass bei vielen Fasern Zahlen zustande kommen, die weit über dem liegen, was das Projekt überhaupt enthält – ein Netzknoten mit einigen hundert Fasern meldet leicht mehrere tausend Gräben. Als Größenordnung sind die Werte brauchbar, als Anzahl nicht.
:::

Der **Einstiegspunkt** wiederholt, wonach gesucht wurde, mit der Art des Objekts als Kennzeichnung davor.

Die **Kabelinfrastruktur** nennt je Kabel des Weges, wo es liegt. Aufgeklappt steht darin das „Mikrorohr“ mit Nummer, Farbe und Status, das „Rohr“ mit Namen und Rohrtyp, die „Geometrie“ mit Art und Länge sowie die „Gräben“ – jeder mit Trassen-ID, Bauart und Länge. Die Markierung „GEO“ hinter einer Trasse bedeutet, dass ihre Geometrie mitgeladen wurde, siehe Abschnitt [Geometrie](#_15-6-geometrie-modus-ausrichtung-geojson-download).

Unter **„Faserwege“** steht der Weg selbst – als Baum, wenn Sie von einer Faser aus gesucht haben, und sonst als Tabelle.

**Der Baum**

Jede Station des Weges beginnt mit der Faser („F1“), dem Kabel und dessen Kabeltyp, und wenn der Weg dort über einen Spleiß weitergeht, mit dem Netzknoten dahinter. Darunter stehen die beiden Endknoten des Kabels und die Farbpunkte von Faser und Bündel.

![Screenshot des Ergebnisses eines Faserwegs für eine Faser mit Hervorhebung des Baums und der geöffneten Details](/images/manual/teil-a/trace_tree.jpg)

„Details“ klappt die Angaben zur Station auf:

- **Faser** – „Bündel“, „Faser im Bündel“, die beiden Farben, „Layer“ und der Status.
- **„Spleiss“** – der Port, an dem die Faser aufliegt, mit Komponente, Slots und Seite. Der **„Containerpfad“** nennt die Container, in denen diese Komponente steckt („Rack: RACK-A1“), siehe Abschnitt [Netzknoten, Container, Slots, Komponenten und Ports](./02-grundbegriffe-und-datenmodell.md#_2-3-netzknoten-container-slots-komponenten-und-ports).
- **„Endpunkt (keine Verbindung)“** – die Faser liegt auf einem Port, von dem aus es nicht weitergeht. Hier endet der Weg.
- **„Kabelpfad“** – Anfang und Ende des Kabels mit „START“ und „ENDE“, dazu die Adressen dieser Netzknoten, sofern sie eine haben.
- **„Adresse“** und **„Wohneinheit“** – das Ziel, siehe Abschnitt [Betroffene Adressen und Wohneinheiten](#_15-5-betroffene-adressen-und-wohneinheiten).

Jeder Spleiß rückt die nächste Station eine Stufe ein. Teilt sich der Weg – etwa hinter einem Splitter –, stehen mehrere Stationen auf derselben Stufe, und die Statistik meldet „Verzweigungen: Ja“.

::: info
Die Schaltflächen im Baum tun zwei verschiedene Dinge. Faser, Kabel, Netzknoten und Adresse in den ersten Zeilen einer Station **markieren** das Objekt in der Karte, sofern sie eingeblendet ist (siehe Abschnitt [Geometrie](#_15-6-geometrie-modus-ausrichtung-geojson-download)); ohne Karte bewirken sie nichts. Die Netzknoten- und Adress-Schaltflächen **in den Details** – unter „Endpunkt“, „Kabelpfad“ und „Adresse:“ – starten dagegen einen neuen Faserweg von diesem Objekt aus.
:::

**Die Tabelle**

Bei allen anderen Einstiegspunkten kommen viele Wege zusammen, und „Faserwege“ zeigt sie als Tabelle mit den Spalten „Faser“, „Kabel“, „Farben“, „Ende“ und „Wohneinheiten“. Endet ein Weg an mehreren Stellen, steht in „Ende“ „Mehrere Ziele“ mit deren Anzahl; ein Zeigen mit der Maus nennt sie.

![Screenshot des Ergebnisses eines Faserwegs für einen Netzknoten mit Hervorhebung der gefilterten Tabelle und einer aufgeklappten Zeile](/images/manual/teil-a/trace_paths_table.jpg)

Das Feld darüber filtert nach Fasernummer, Kabelname und Ziel; rechts darin steht, wie viele Wege der Filter übrig lässt („144 / 696“). Der Pfeil am rechten Rand einer Zeile klappt den Baum dieses Weges auf – denselben, den der Faser-Einstieg für sich allein zeigt. Unter der Tabelle steht die Zahl der gefilterten Wege.

## 15.3 Modus „Weg“ und Modus „Signalanalyse“

Sind Sie von einer **Faser** aus eingestiegen, steht über dem Ergebnis ein Umschalter mit zwei Modi:

- **„Weg“** beantwortet, wo die Faser entlangläuft und wo sie endet. Das ist der Modus der beiden vorigen Abschnitte.
- **„Signalanalyse“** beantwortet, was von einer gewählten Signalquelle aus tatsächlich versorgt wird und wo das Signal aufhört.

Bei allen anderen Einstiegspunkten fehlt der Umschalter; dort gibt es nur den Weg.

## 15.4 Signalquelle, Signalreichweite und Unterbrechungen

Die **„Signalquelle“** ist der Netzknoten, von dem aus gerechnet wird. Die Liste enthält die Anfangs- und Endknoten aller Kabel des Weges, jeweils mit dem Hinweis, ob das Kabel dort beginnt („Kabelanfang“) oder endet („Kabelende“); die Voreinstellung ist mit „(Standard)“ gekennzeichnet. Eine andere Quelle rechnet den Weg sofort neu.

![Screenshot der Signalanalyse einer Faser mit Signalquelle, Auswirkungsübersicht und der Karte des Faserwegs](/images/manual/teil-a/trace_signal.jpg)

Darunter steht das Ergebnis:

- Sind alle Fasern versorgt, meldet Qonnectra „Keine Unterbrechungen erkannt - alle Fasern sind aktiv“.
- Andernfalls steht dort „Unterbrechungspunkt“ mit deren Anzahl und je Unterbrechung ein Kasten mit Faser, Kabel und dem Netzknoten, an dem der Weg abbricht.

Die **„Auswirkungsübersicht“** stellt jeweils „Aktiv“ und „Dunkel“ gegenüber: „Fasern“, „Netzknoten“, „Betroffene Adressen“, „Betroffene Wohneinheiten“ und die „Signalreichweite“ in Metern – die Summe der Kabellängen, die vom Signal erreicht werden.

Der Baum unter „Signalanalyse“ ist derselbe wie im Modus „Weg“, jede Station aber zusätzlich mit „Aktiv“, „Kein Signal“ oder „Unterbrechungspunkt“ gekennzeichnet.

::: info
Die Signalanalyse lädt die Geometrie immer mit und zeigt deshalb auch immer die Karte, unabhängig von der Option „Geometrie einbeziehen“, siehe Abschnitt [Geometrie](#_15-6-geometrie-modus-ausrichtung-geojson-download).
:::

::: warning
Eine Unterbrechung ist keine gemeldete Störung, sondern eine Lücke in der Dokumentation: An dieser Stelle fehlt der Spleiß, der weiterführen würde. Was bei einem **Schaden** ausfällt, rechnet die Störungsanalyse aus, siehe Kapitel [Störungsanalyse](./06-stoerungsanalyse.md).
:::

## 15.5 Betroffene Adressen und Wohneinheiten

Am Ende eines Faserwegs steht, wer daran hängt. Im Modus „Weg“ finden Sie das in den Details der letzten Station: der Kasten **„Adresse“** mit Adress-ID, Ortsteil, Ausbaustatus, Projekt und Kennzeichen und der Kasten **„Wohneinheit“** mit Etage, Seite, Gebäudeteil, Typ, Status und – falls erfasst – dem Bewohner. Die Schaltfläche mit der Adresse darunter („Adresse:“) führt zum Faserweg dieser Adresse.

Im Modus „Signalanalyse“ stehen dieselben Angaben, zusätzlich mit „Kein Signal“ gekennzeichnet, wenn sie hinter einer Unterbrechung liegen; die Zahlen dazu nennt die „Auswirkungsübersicht“.

Wohneinheiten erscheinen nur, wenn sie im Netzschema auf einen Port gelegt wurden, siehe Abschnitt [Spleiße und Ports](./14-netzschema.md#_14-8-spleiße-und-ports). Adressen erscheinen auch ohne das – über den Netzknoten, an dem das Kabel endet, sofern diesem eine Adresse zugeordnet ist.

::: info
„Adressen: 0“ und „Wohneinheiten: 0“ bedeuten also nicht, dass niemand versorgt wird, sondern dass auf diesem Weg nichts dokumentiert ist, was ein Ziel wäre. Bei einem Zubringerkabel zwischen zwei Verteilern ist das der Normalfall.
:::

## 15.6 Geometrie: Modus, Ausrichtung, GeoJSON-Download

Ein Faserweg wird ohne Geometrie ermittelt: Die Verfolgung braucht nur Kabel und Spleiße. Wollen Sie den Weg auch in der Karte sehen oder als Datei mitnehmen, kreuzen Sie vor der Suche „Geometrie einbeziehen“ an. Darauf erscheinen zwei weitere Optionen.

![Screenshot der Ansicht Faserweg mit Hervorhebung der Optionen und dem eingeschalteten Feld „Geometrie einbeziehen“](/images/manual/teil-a/trace_geometry.jpg)

Der **„Modus“** bestimmt, wie die Linien gebildet werden:

- **„Segmente“** – jede Trasse als eigene Linie. So sehen Sie, aus welchen Abschnitten der Weg besteht.
- **„Zusammengeführt“** – eine Linie je Kabel.
- **„Geroutet“** – der berechnete kürzeste Weg zwischen Anfangs- und Endknoten des Kabels.

**„Nach Kabelrichtung ausrichten“** dreht die Segmente so, dass sie vom Anfangs- zum Endknoten verlaufen. Ohne diese Option behalten sie die Richtung, in der die Trasse erfasst wurde.

Beim Einstieg über eine Faser rückt das Ergebnis daraufhin nach links, und rechts daneben steht die Karte mit dem Weg.

![Screenshot des Ergebnisses eines Faserwegs mit der Karte rechts und der Schaltfläche „GeoJSON herunterladen“](/images/manual/teil-a/trace_map.jpg)

Karte und Baum sind miteinander verbunden: Ein Klick auf einen Netzknoten, eine Adresse oder eine Wohneinheit im Baum rückt das Objekt in den Kartenausschnitt und hebt es hervor; umgekehrt markiert ein Klick in der Karte den Eintrag im Baum. Für ein Kabel gilt das nur im Modus „Zusammengeführt“ – in „Segmente“ besteht die Linie aus den einzelnen Trassen, und die Karte findet dann kein Kabel zum Hervorheben. Die Faser-Schaltfläche hat in der Karte gar kein Gegenstück; sie bewirkt dort nichts.

„GeoJSON herunterladen“ speichert den Weg als Datei: Kabel und Trassen als Linien, Netzknoten und Adressen als Punkte, dazu ihre Eigenschaften. Die Datei liegt im Koordinatensystem des Projekts, siehe Abschnitt [Exportformate im Überblick](./03-wiederkehrende-bedienelemente.md#_3-8-exportformate-im-uberblick).

::: warning
„Geometrie einbeziehen“ lässt sich nur vor der Suche setzen. Auf der Ergebnisseite gibt es keinen Umschalter dafür: Gehen Sie mit „Zurück“ zur Auswahl, kreuzen Sie die Option an und suchen Sie erneut.
:::

::: info
Die Karte erscheint ausschließlich beim Einstieg über eine Faser. Bei allen anderen Einstiegspunkten wirkt die Option nur auf den Download und auf die Angaben unter „Kabelinfrastruktur“.
:::

## 15.7 Über alle Projekte suchen

Die Suche ist auf das ausgewählte Projekt beschränkt. Das Kästchen „Alle Projekte durchsuchen“ hebt diese Grenze auf – dann stehen auch Adressen, Netzknoten und Kabel der anderen Projekte in der Trefferliste.

::: info
Die Verfolgung selbst kennt keine Projektgrenze: Sie folgt den Spleißen, egal zu welchem Projekt das nächste Kabel gehört. Die Option betrifft nur, was Sie als Einstiegspunkt finden können.
:::

::: warning
Die Trefferliste nennt das Projekt nicht. Bei gleichnamigen Objekten in mehreren Projekten – etwa einem Netzknoten „PoP-1“ – lässt sich anhand der Liste nicht entscheiden, welcher gemeint ist. In welchem Projekt Sie gelandet sind, sehen Sie danach an der Angabe „Projekt“ in den Details der Adresse.
:::
