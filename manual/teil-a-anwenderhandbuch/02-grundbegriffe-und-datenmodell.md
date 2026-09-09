# 2. Grundbegriffe und Datenmodell

Qonnectra beschreibt ein Glasfasernetz nicht als Zeichnung, sondern als Sammlung von Objekten, die ineinanderstecken: Im Graben liegen Rohre, in den Rohren Mikrorohre, in den Mikrorohren Kabel, in den Kabeln Bündel und Fasern. Dieses Kapitel erklärt diese Objekte und ihre Beziehungen einmal zusammenhängend. Die Kapitel 4 bis 17 setzen die Begriffe voraus und beschreiben nur noch, wo Sie sie erfassen und auswerten.

Alle Objekte gehören zu genau einem **Projekt**, das Sie oben links in der Kopfzeile auswählen, siehe Abschnitt [Projekt auswählen und wechseln](./01-erste-schritte.md#_1-3-projekt-auswahlen-und-wechseln). Eine Auswertung über mehrere Projekte hinweg gibt es nur in der Karte und in der Wertermittlung.

Vier Objektarten haben eine Lage im Raum und erscheinen deshalb in der Karte: die **Trasse** als Linie, der **Netzknoten** und die **Adresse** als Punkt und das **Gebiet** als Fläche. Alles andere hängt an diesen vier.

![Screenshot der Karte mit Trassen als blauen Linien, Netzknoten als Quadraten, Adressen als orangen Punkten und dem grün eingefärbten Projektgebiet](/images/manual/teil-a/model_objects.jpg)

## 2.1 Trasse, Rohr und Mikrorohr

Eine **Trasse** ist ein einzelner Grabenabschnitt mit einer eigenen Trassen-ID, etwa „TR-W55WVN3“. Sie ist die kleinste Baueinheit des Netzes: Alle Angaben einer Trasse gelten für ihre gesamte Länge – wo Bauart, Oberfläche oder Verlegetiefe wechseln, sind es zwei Trassen. Die Trassen-ID ist innerhalb eines Projekts eindeutig. Dieses Handbuch nennt eine einzelne Trasse dort **Trassensegment**, wo es auf die Abgrenzung ankommt – vor allem in der Rohrzuordnung, siehe Kapitel [Rohrzuordnung](./11-rohrzuordnung.md).

An einer Trasse hinterlegt sind unter anderem Oberfläche, Bauart, Verlegetiefe, Status, Phase, Eigentümer, Baufirma und Datum sowie die Ja-Nein-Angaben „Hausanschluss“, „Eigenleistung“ und „Förderstatus“, nach denen das Dashboard auswertet (siehe Kapitel [Dashboard](./04-dashboard.md)).

::: info
Die Länge einer Trasse geben Sie nicht ein – Qonnectra berechnet sie aus der Geometrie. Gezeichnet werden Trassen in QGIS, siehe Kapitel [Netzdaten in QGIS bearbeiten](../teil-b-betrieb-admin-qgis/26-netzdaten-in-qgis-bearbeiten.md).
:::

Ein **Rohr** (Leerrohr) hat einen Namen, der innerhalb des Projekts eindeutig ist, und einen **Rohrtyp**. Der Rohrtyp beschreibt den Aufbau: „12x10/6“ steht für zwölf Mikrorohre der Größe 10/6 – Außen- und Innendurchmesser in Millimetern –, „16/12“ für ein einzelnes Rohr ohne Unterteilung. Liegt das Rohr in einem weiteren Rohr, steht dieses im Feld „Schutzrohr“.

Ein Rohr hat **keine eigene Geometrie**. Wo es verläuft, ergibt sich aus den Trassensegmenten, denen es zugeordnet ist. Diese Zuordnung ist beidseitig mehrfach: Ein Rohr läuft über mehrere Trassensegmente, und ein Trassensegment führt mehrere Rohre. Deshalb hat der Kartenlayer „Rohr“ auch nur Beschriftungen und keine eigene Darstellung, siehe Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster).

Die **Mikrorohre** eines Rohrs entstehen automatisch beim Anlegen, und zwar aus dem Rohrtyp: Er gibt ihre Anzahl und ihre Farben vor. Jedes Mikrorohr hat eine durchlaufende Nummer, eine Farbe und einen Status, der auf „Intakt“ steht, solange nichts anderes eingetragen ist. Zusätzlich kann an einem Mikrorohr hinterlegt sein, zu welcher Adresse es führt und welches Kabel darin liegt.

![Screenshot der Ansicht „Mikrorohre“ mit der Info-Box rechts: das aufgeklappte Rohr St-V02-01 und die Liste seiner zwölf Mikrorohre mit Farbe, Adresse, Kabel und Status](/images/manual/teil-a/model_conduit_microducts.jpg){.big}

::: warning
Anzahl und Farben der Mikrorohre lassen sich nachträglich nicht ändern. Sie richten sich nach dem Rohrtyp zum Zeitpunkt des Anlegens; ein später geänderter Rohrtyp lässt die Liste unverändert, siehe Abschnitt [Mikrorohre eines Rohrs](./10-rohrverwaltung.md#_10-4-mikrorohre-eines-rohrs).
:::

## 2.2 Kabel, Bündel, Faser und Spleiß

Ein **Kabel** hat einen Namen, einen **Kabeltyp** und je einen Netzknoten als Anfang und Ende. Der Kabeltyp beschreibt den Aufbau: „LTMC288(12x24)“ steht für 288 Fasern, aufgeteilt in zwölf **Bündel** mit je 24 **Fasern**.

Wie ein Rohr hat ein Kabel keine eigene Geometrie. Es liegt in einem oder mehreren Mikrorohren, und aus deren Rohren und den Trassensegmenten dieser Rohre ergibt sich der Weg des Kabels. Die Verknüpfung stellen Sie im Netzschema her, siehe Kapitel [Netzschema](./14-netzschema.md).

::: info
Auch die Länge eines Kabels ist berechnet und nicht eingegeben: Qonnectra ermittelt den kürzesten Weg zwischen Anfangs- und Endknoten über die Trassensegmente, in denen das Kabel liegt. Die Angaben „Reserve am Anfang“, „Reserve am Ende“ und „Reserve auf der Strecke“ geben Sie dagegen selbst ein; sie ergeben zusammen mit der Länge die „Gesamtlänge“.
:::

Die Fasern eines Kabels entstehen wie die Mikrorohre eines Rohrs automatisch aus dem Kabeltyp. Jede Faser gehört zu einem Bündel und trägt vier Angaben, die sie eindeutig machen: die Nummer und die Farbe ihres Bündels sowie ihre eigene Nummer und Farbe. Die Nummer läuft über das ganze Kabel durch, die Farben wiederholen sich in jedem Bündel. Dazu kommt ein Status, der wie beim Mikrorohr auf „Intakt“ steht, solange nichts anderes eingetragen ist.

![Screenshot des Netzschemas mit der Info-Box rechts: das Kabel St-S01-288-Fs im Reiter „Status“, darin das aufgeklappte Bündel 1 mit seinen Fasern samt Nummer, Farbe und Status](/images/manual/teil-a/model_cable_fibers.jpg){.big}

Ein **Spleiß** ist die Verbindung zweier Fasern. Er liegt nicht am Kabel, sondern in einem Netzknoten – genauer an einem Port einer Komponente, die dort eingebaut ist, siehe Abschnitt [Netzknoten, Container, Slots, Komponenten und Ports](#_2-3-netzknoten-container-slots-komponenten-und-ports). Erst die Kette aus Kabeln und Spleißen ergibt einen durchgehenden Weg von der Faser im Verteiler bis zur Wohneinheit; ermitteln lässt er sich im Faserweg, siehe Kapitel [Faserweg](./15-faserweg.md).

::: warning
Kabelnamen müssen in der gesamten Installation eindeutig sein, nicht nur innerhalb des Projekts. Bei Rohren und Netzknoten genügt Eindeutigkeit im Projekt. Ein Kabelname, den es in einem anderen Projekt schon gibt, wird deshalb abgewiesen.
:::

## 2.3 Netzknoten, Container, Slots, Komponenten und Ports

Ein **Netzknoten** ist ein Punkt im Netz, an dem Trassen zusammenlaufen und Kabel beginnen, enden oder verbunden werden. Er hat einen Namen, der innerhalb des Projekts eindeutig ist, und einen **Netzknotentyp** – etwa „Hausanschluss“, „Muffe“, „MFG“, „NVt 48“ oder „Kabelring“. Optional sind eine Adresse, Eigentümer, Baufirma, Hersteller und ein Datum sowie die Gewährleistungsfrist, die das Dashboard überwacht (siehe Abschnitt [Gewährleistungsfristen im Blick behalten](./04-dashboard.md#_4-7-gewahrleistungsfristen-im-blick-behalten)).

Netzknoten können einander untergeordnet sein: Das Feld „Übergeordneter Netzknoten“ hängt einen Knoten unter einen anderen, etwa alle Hausanschlüsse unter den Verteiler, der sie versorgt. Das Netzschema nutzt diese Über- und Unterordnung, um ein großes Netz auf mehrere Ebenen zu verteilen, siehe Kapitel [Netzschema](./14-netzschema.md).

Der innere Aufbau eines Netzknotens ist in vier Stufen von außen nach innen beschrieben:

- **Container** – eine Gruppe von Slot-Konfigurationen, etwa ein Rack oder eine Gehäusetür. Container sind optional und können ineinander liegen; ihre Typen richtet die Administration ein, siehe Kapitel [Projekte und Stammdaten pflegen](../teil-b-betrieb-admin-qgis/21-projekte-und-stammdaten.md).
- **Slot-Konfiguration** – je Einbauseite eines Netzknotens eine Konfiguration mit einem Namen („A“, „B“) und einer Anzahl von Gesamtslots. Ein **Slot** ist ein einzelner Einbauplatz.
- **Komponente** – das Bauteil, das in den Slots sitzt: eine Spleißkassette, ein Splitter, ein Patchfeld. Der Komponententyp gibt vor, wie viele Slots das Bauteil belegt – eine Spleißkassette einen, ein „Splitter 1:8“ zwei, ein „4HE (12xLC-APC)“ vier. Dazu kann eine Clip-Nummer hinterlegt sein.
- **Port** – ein Anschluss an der Komponente. Wie viele Ports eine Komponente hat, gibt ebenfalls der Komponententyp vor. Jeder Port verbindet eine Faser auf der Seite A mit einer Faser auf der Seite B – das ist der Spleiß aus Abschnitt [Kabel, Bündel, Faser und Spleiß](#_2-2-kabel-bundel-faser-und-spleiß). Ports ohne Spleiß bleiben leer.

![Screenshot des maximierten Fensters „Netzknotenstruktur“ mit der Komponente „Spleisskassette“ und ihren zwölf Ports: sechs mit je einer Faser auf Seite A und B, sechs leer](/images/manual/teil-a/model_node_ports.jpg){.big}

Das Fenster „Netzknotenstruktur“ zeigt beide Stufen, aber nie gleichzeitig: Ein Klick auf eine Komponente im Slot-Grid führt in ihre Ports, „Zurück“ wieder in das Grid.

![](/videos/model_node_component.webm)

::: info
Angelegt und geändert wird der Aufbau eines Netzknotens im Netzschema, siehe Kapitel [Netzschema](./14-netzschema.md). Aus der Karte heraus sind Slot-Konfiguration und Struktur reine Anzeigen, siehe Abschnitt [Netzknoten: Slot-Konfiguration und Struktur öffnen](./05-karte.md#_5-6-netzknoten-slot-konfiguration-und-struktur-offnen).
:::

::: warning
Der innere Aufbau ist optional und in vielen Projekten gar nicht erfasst. Ist für einen Netzknoten keine Slot-Konfiguration hinterlegt, meldet das Fenster „Keine Slot-Konfigurationen gefunden“ – der Netzknoten selbst ist dann trotzdem vollständig dokumentiert. Ohne Container erscheinen die Konfigurationen als flache Liste.
:::

## 2.4 Adresse und Wohneinheit

Eine **Adresse** ist ein Gebäude als Punkt in der Karte, beschrieben durch Straße, Hausnummer mit Zusatz, Postleitzahl, Ort und Ortsteil. Dazu kommen eine von Qonnectra erzeugte „Adress-ID“, das Feld „Adress-ID 2“ für eine Kennung aus einem anderen System und der **Ausbaustatus**, der den Fortschritt der Erschließung festhält.

Eine **Wohneinheit** ist eine einzelne Nutzungseinheit in diesem Gebäude – eine Wohnung, ein Ladengeschäft, eine Schule. Sie gehört immer zu einer Adresse und hat eine eigene ID, eine Etage, eine Seite, einen Gebäudeteil, einen Typ und einen Status. Für den Vertrieb lassen sich zusätzlich „Name des Bewohners“, „Erfassungsdatum Bewohner“ und das Datum „Betriebsbereit“ hinterlegen sowie zwei Kennungen aus anderen Systemen.

Die Adresse ist damit das Bindeglied zwischen Gebäude und Netz. Was auf der Netzseite an ihr hängt, zeigt der Abschnitt „Mikrorohrverbindungen“ in der Adressdetailansicht: das Mikrorohr mit seiner Nummer und Farbe, das Rohr, in dem es liegt, und der Netzknoten, von dem es kommt.

![Screenshot der Adressdetailansicht mit Hervorhebung der Abschnitte „Mikrorohrverbindungen“ und „Wohneinheiten“](/images/manual/teil-a/model_address_units.jpg){.big}

::: info
Die Wohneinheiten sind die Bezugsgröße für den Ausbaufortschritt. Sie werden im Dashboard nach Ort und Typ ausgewertet (siehe Kapitel [Dashboard](./04-dashboard.md)) und lassen sich in der Nachverdichtung je Adresse als PDF ausgeben, siehe Kapitel [Nachverdichtung](./07-nachverdichtung.md).
:::

## 2.5 Gebiet und Gebietstyp

Ein **Gebiet** ist eine Fläche mit einem Namen und einem **Gebietstyp**. Es enthält selbst keine Netzdaten, sondern grenzt einen Bereich ab: das Projektgebiet, das Versorgungsgebiet eines Verteilers, die Grundfläche eines Gebäudes. In der Legende der Karte lässt sich der Eintrag „Gebiet“ aufklappen; darunter stehen die Gebietstypen, die Sie einzeln ein- und ausblenden können.

![Screenshot der Karte mit Hervorhebung der Legende oben rechts, in der der Eintrag „Gebiet“ aufgeklappt ist und seine Gebietstypen zeigt; in der Kartenmitte die beiden Projektgebiete](/images/manual/teil-a/model_area.jpg)

Wozu die Abgrenzung dient, zeigt der Reiter „Gebiete“ des Dashboards: Er rechnet aus, welcher Anteil der Adressen, Netzknoten und Wohneinheiten eines Projekts innerhalb der Gebiete liegt, siehe Kapitel [Dashboard](./04-dashboard.md).

::: warning
Die Fläche eines Projektgebiets liegt unter dem gesamten Netz. Ein Klick in die Karte trifft deshalb leicht das Gebiet statt der Trasse darüber; welche Hilfen es dagegen gibt, beschreibt Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster) unter „Objekte anklicken“.
:::

## 2.6 Kennzeichen als projektweiter Filter

Das **Kennzeichen** ist eine zweite Ordnungsebene neben dem Projekt. Trasse, Rohr, Netzknoten, Kabel, Adresse und Gebiet tragen jeweils genau eines, und es ist ein Pflichtfeld – ein Objekt ohne Kennzeichen lässt sich nicht speichern. Womit Sie es füllen, ist Ihre Entscheidung: verbreitet sind Bauabschnitte, Ausbaucluster oder Ortsteile.

![Screenshot der Rohrverwaltung mit Hervorhebung der Spaltenüberschrift „Kennzeichen“ und ihres Suchfeldes rechts in der Tabelle](/images/manual/teil-a/model_flag.jpg)

Eingrenzen können Sie den Bestand darüber an zwei Stellen:

- in der Rohrzuordnung über die Auswahl „Kennzeichen“, die die Rohrliste einschränkt, siehe Abschnitt [Nach Kennzeichen eingrenzen](./11-rohrzuordnung.md#_11-6-nach-kennzeichen-eingrenzen)
- in der Rohrverwaltung und bei den Adressen über das Suchfeld unter der Spalte „Kennzeichen“, siehe Abschnitt [Tabellen](./03-wiederkehrende-bedienelemente.md#_3-1-tabellen-suche-spaltenfilter-sortierung-seitenwechsel)

Auch der Excel-Import von Rohren führt eine Spalte „Kennzeichen“. Sie darf in keiner Zeile leer bleiben, sonst scheitert der gesamte Import, siehe Abschnitt [Excel-Import](./10-rohrverwaltung.md#_10-5-excel-import-vorlage-ablauf-fehlermeldungen).

::: warning
Das Kennzeichen ist kein Projekt. Objekte mit unterschiedlichen Kennzeichen gehören weiterhin zum selben Projekt und erscheinen gemeinsam in der Karte, im Dashboard und in allen Auswertungen. Nur wo eine Ansicht ausdrücklich ein Kennzeichen anbietet, wirkt es als Filter.
:::

::: info
Das Dashboard kennt keinen Filter nach Kennzeichen; seine Kennzahlen beziehen sich immer auf den gesamten Bestand des Projekts, siehe Abschnitt [Nach Kennzeichen filtern](./04-dashboard.md#_4-8-1-nach-kennzeichen-filtern).
:::

## 2.7 Stammdaten: Status, Phase, Netzebene, Firmen

Viele Angaben wählen Sie nicht frei, sondern aus einer festen Liste. Diese Listen sind die **Stammdaten** der Installation. Wo eine solche Angabe erfasst wird, steht ein Kombinationsfeld, siehe Abschnitt [Auswahllisten und Kombinationsfelder](./03-wiederkehrende-bedienelemente.md#_3-2-auswahllisten-und-kombinationsfelder).

![Screenshot der Rohrverwaltung mit Hervorhebung des Feldes „Status“ in der Info-Box und der geöffneten Liste mit den Werten „dokumentiert“, „geplant“ und „im Bau“](/images/manual/teil-a/model_master_data.jpg)

Die wichtigsten dieser Listen:

- **Status** – der Bearbeitungsstand eines Objekts, etwa „geplant“, „im Bau“, „dokumentiert“. Trasse, Rohr, Netzknoten und Kabel nutzen dieselbe Liste.
- **Phase** – der Bauabschnitt einer Trasse.
- **Netzebene** – die Stufe des Objekts im Netzaufbau, üblicherweise „Netzebene 1“ bis „Netzebene 4“. Rohr, Netzknoten und Kabel tragen sie.
- **Firmen** – eine gemeinsame Liste für die drei Rollen „Eigentümer“, „Baufirma“ und „Hersteller“. Zu jeder Firma lassen sich Anschrift, Telefonnummer und E-Mail-Adresse hinterlegen.
- **Oberfläche** und **Bauart** einer Trasse. Bei der Oberfläche ist zusätzlich vermerkt, ob sie versiegelt ist – davon hängt die Wertermittlung ab, siehe Kapitel [Wertermittlung](./09-wertermittlung.md).
- **Rohrtyp**, **Kabeltyp**, **Netzknotentyp** und **Komponententyp** mit den Angaben, aus denen Qonnectra Mikrorohre, Fasern und Ports erzeugt.
- die Farblisten für Mikrorohre und Fasern, die Statuslisten für Mikrorohre und Fasern, der **Ausbaustatus** einer Adresse, **Typ** und **Status** einer Wohneinheit, der **Gebietstyp** und der **Container-Typ**.

::: warning
Ein Wert, der nicht in der Liste steht, lässt sich nicht eintippen. Fehlt Ihnen eine Firma, ein Rohrtyp oder ein Status, wenden Sie sich an Ihre Administration; gepflegt werden die Listen im Administrationsbereich, siehe Kapitel [Projekte und Stammdaten pflegen](../teil-b-betrieb-admin-qgis/21-projekte-und-stammdaten.md).
:::

::: warning
Stammdaten gelten für die gesamte Installation und nicht je Projekt. Ein neuer Rohrtyp steht deshalb sofort in allen Projekten zur Auswahl – auch in denen, für die er nicht gedacht war.
:::
