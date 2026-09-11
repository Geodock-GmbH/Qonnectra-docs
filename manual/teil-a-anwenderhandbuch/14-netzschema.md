# 14. Netzschema

Das **Netzschema** ist die Ansicht, in der das Kabelnetz entsteht: Hier legen Sie Kabel zwischen Netzknoten an, verknüpfen sie mit Mikrorohren, spleißen Fasern auf Ports und dokumentieren den inneren Aufbau eines Netzknotens. Sie erreichen sie über die linke Navigationsleiste in der Gruppe „Kabel“ durch Klicken auf den Menüpunkt „Netzschema“.

![Screenshot des Netzschemas mit Netzknoten und Kabeln und dem Bereich „Eigenschaften“ oben links](/images/manual/teil-a/schema.jpg)

Alles, was Kapitel [Grundbegriffe und Datenmodell](./02-grundbegriffe-und-datenmodell.md) über Kabel, Bündel, Fasern und Spleiße sagt, entsteht in dieser Ansicht. Die Karte und die Rohrverwaltung zeigen dieselben Objekte nur zum Lesen.

## 14.1 Aufbau des Schemas: Netzknoten und Kabel

Den größten Teil der Ansicht nimmt die **Zeichenfläche** ein. Sie ist ein Diagramm und keine Karte: Ein Netzknoten steht als Kasten mit seinem Namen darin, ein Kabel als Linie zwischen zwei Kästen, beschriftet mit dem Kabelnamen. An jeder Seite eines Kastens sitzt ein grüner Punkt – ein **Fangpunkt**, an dem ein Kabel andockt.

Wo ein Netzknoten auf der Zeichenfläche liegt, hat mit seiner Lage im Gelände zunächst durchaus zu tun: Qonnectra rechnet die Position beim ersten Öffnen aus den Koordinaten der Karte, siehe Abschnitt [Kartenkoordinaten mit dem Schema synchronisieren](#_14-11-kartenkoordinaten-mit-dem-schema-synchronisieren). Danach sind beide Positionen voneinander unabhängig.

Die Farbe eines Kabels ist keine Eigenschaft des Kabels, sondern eine Anzeigeoption: In der Voreinstellung nimmt die Linie die Farbe des Mikrorohrs mit der niedrigsten Nummer an, mit dem das Kabel verknüpft ist. Umstellen können Sie das unter „Kabelfarbe“ in den Einstellungen, siehe Kapitel [Einstellungen](./17-einstellungen.md).

Oben links liegt der Bereich „Eigenschaften“. Er enthält die beiden Felder für ein neues Kabel („Name“ und „Kabeltyp auswählen“), die „Anzeigeoptionen“ (siehe Abschnitt [Anzeigeoptionen](#_14-10-anzeigeoptionen-einrasten-kabelrichtungs-animation)) und das Suchfeld. Ein Klick auf die Überschrift klappt den ganzen Bereich zu, ein Klick auf „Anzeigeoptionen“ nur diesen Teil.

![Screenshot des Netzschemas mit Hervorhebung des Bereichs „Eigenschaften“ oben links](/images/manual/teil-a/schema_panel.jpg)

Unten links sitzen die Schaltflächen der Zeichenfläche, siehe Abschnitt [Netzknoten verschieben, verbinden und löschen](#_14-2-netzknoten-verschieben-verbinden-und-loschen). Ein Klick auf einen Netzknoten oder auf die Beschriftung eines Kabels öffnet rechts die Info-Box, siehe Abschnitt [Die Info-Box](./03-wiederkehrende-bedienelemente.md#_3-6-die-info-box-mit-ihren-reitern).

::: warning
Das Schema zeigt nicht alle Netzknoten des Projekts, sondern nur die Netzknotentypen, die Ihre Administration in den **Netzschema-Einstellungen** dafür vorgesehen hat, siehe Kapitel [Projektbezogene Konfiguration](../teil-b-betrieb-admin-qgis/22-projektbezogene-konfiguration.md). Üblicherweise bleiben die Hausanschlüsse ausgeblendet – es sind zu viele für ein lesbares Diagramm; Sie erreichen sie über das Subnetz ihres Verteilers, siehe Abschnitt [Subnetz eines Netzknotens](#_14-9-subnetz-eines-netzknotens).

Fehlen die Einstellungen ganz, meldet Qonnectra beim Öffnen „Die Netzschema-Einstellungen sind für dieses Projekt nicht konfiguriert. Bitte konfigurieren Sie diese im Admin-Bereich.“ und zeigt jeden Netzknoten – bei vielen Hausanschlüssen wird das Diagramm damit unübersichtlich.
:::

::: info
Ein Netzknoten ohne Geometrie bekommt keine berechnete Position und landet im Nullpunkt der Zeichenfläche, weit außerhalb der übrigen Netzknoten. Wo ein Netzknoten liegt, erfassen Sie in QGIS, siehe Kapitel [Netzdaten in QGIS bearbeiten](../teil-b-betrieb-admin-qgis/26-netzdaten-in-qgis-bearbeiten.md).
:::

### 14.1.1 Objekte im Schema suchen

Das Suchfeld unter den Anzeigeoptionen durchsucht die Namen der Netzknoten **und** der Kabel des Diagramms. Zu jedem Treffer steht rechts, um welche Art Objekt es sich handelt.

![Screenshot des Netzschemas mit Hervorhebung des Suchfeldes und der Trefferliste mit Netzknoten und Kabeln](/images/manual/teil-a/schema_search.jpg)

Ein Klick auf einen Treffer rückt ihn in die Mitte der Zeichenfläche und hebt ihn hervor. Die Info-Box öffnet er nicht – dafür klicken Sie danach auf den Netzknoten oder die Beschriftung.

## 14.2 Netzknoten verschieben, verbinden und löschen

Beim Öffnen ist die Zeichenfläche **gesperrt**. Unten links liegen vier Schaltflächen: hineinzoomen, herauszoomen, alles einpassen und das Schloss. Die Hinweise der ersten drei sind englisch beschriftet („Zoom In“, „Zoom Out“, „Fit View“), der des Schlosses deutsch („Zeichenfläche entsperren“).

![Screenshot des Netzschemas mit Hervorhebung der Schaltflächen zum Zoomen und Sperren unten links](/images/manual/teil-a/schema_lock.jpg)

Ein Klick auf das Schloss hebt die Sperre auf. Erst danach lassen sich Netzknoten verschieben, Kabel anlegen und Kabel bearbeiten. Den Ausschnitt verschieben, zoomen und Info-Boxen öffnen können Sie in beiden Zuständen.

**Netzknoten verschieben**

Ziehen Sie einen Kasten mit gedrückter linker Maustaste an eine andere Stelle. Er rastet auf einem Raster von 120 Pixeln ein, und mit dem Loslassen ist die neue Position gespeichert; Qonnectra meldet „Position erfolgreich aktualisiert“.

::: info
Verschoben wird ausschließlich die Position im Diagramm. Die Karte bleibt unberührt – umgekehrt ändert eine Verschiebung in QGIS die Position im Schema nicht mehr, sobald der Netzknoten dort einmal einen Platz hat.
:::

**Kabel anlegen**

Ein neues Kabel entsteht in zwei Schritten:

1. Tragen Sie im Bereich „Eigenschaften“ einen „Namen“ ein und wählen Sie unter „Kabeltyp auswählen“ den Kabeltyp.
2. Ziehen Sie mit gedrückter linker Maustaste von einem grünen Fangpunkt des einen Netzknotens auf einen Fangpunkt des anderen.

![Screenshot des Netzschemas mit Hervorhebung des Bereichs „Eigenschaften“ und der geöffneten Liste der Kabeltypen](/images/manual/teil-a/schema_cable_type.jpg)

![](/videos/schema_cable_connect.webm)

Mit dem Loslassen ist das Kabel angelegt, Qonnectra meldet „Kabel erfolgreich erstellt“. Aus dem Kabeltyp entstehen dabei sofort alle Fasern und Bündel, siehe Abschnitt [Kabel, Bündel, Faser und Spleiß](./02-grundbegriffe-und-datenmodell.md#_2-2-kabel-bundel-faser-und-spleiß). Anschließend versucht Qonnectra, das Kabel selbständig mit einem Mikrorohr zu verknüpfen, siehe Abschnitt [Kabel mit Mikrorohren verknüpfen](#_14-5-kabel-mit-mikrorohren-verknupfen).

::: warning
Der Kabeltyp ist Pflicht: Ohne ihn meldet Qonnectra „Kein Kabeltyp ausgewählt“, und es entsteht kein Kabel. Nachträglich lässt er sich nicht mehr ändern, siehe Abschnitt [Kabeleigenschaften](#_14-3-kabeleigenschaften-kabeltyp-und-kabellange-neu-berechnen).
:::

::: info
Der eingetragene Name ist nicht der endgültige: Qonnectra hängt zehn zufällige Zeichen an („St-V05-144-Fs-hK3pQ2Lm9x“), damit der Name in der gesamten Installation eindeutig ist – bei Kabeln gilt das strenger als bei Rohren und Netzknoten, siehe Abschnitt [Kabel, Bündel, Faser und Spleiß](./02-grundbegriffe-und-datenmodell.md#_2-2-kabel-bundel-faser-und-spleiß). Bleibt das Feld leer, besteht der Name nur aus diesen zehn Zeichen. Umbenennen können Sie das Kabel danach im Reiter „Eigenschaften“.
:::

::: info
Welche Seite Anfang und welche Ende des Kabels ist, ergibt sich aus der Ziehrichtung – allerdings andersherum, als man erwartet: Der Netzknoten, auf dem Sie loslassen, wird zum Anfang. Umstellen können Sie das im Reiter „Fangpunkte“, siehe Abschnitt [Bearbeitungsmodus](#_14-4-bearbeitungsmodus-kabelverlauf-beschriftung-und-fangpunkte).
:::

**Netzknoten löschen**

Netzknoten legen Sie in der Weboberfläche nicht an; sie kommen aus QGIS oder aus einem Import, siehe Kapitel [Netzdaten in QGIS bearbeiten](../teil-b-betrieb-admin-qgis/26-netzdaten-in-qgis-bearbeiten.md). Löschen können Sie sie hier: im Reiter „Eigenschaften“ der Info-Box mit „Netzknoten löschen“.

::: danger
Mit dem Netzknoten verschwindet auch sein innerer Aufbau. Die Rückfrage nennt vorher, was betroffen ist („… 2 Komponenten werden gelöscht.“).
:::

::: warning
Solange Kabel am Netzknoten hängen, ist „Netzknoten löschen“ ausgegraut; ein Zeigen mit der Maus nennt den Grund („Dieser Netzknoten kann nicht gelöscht werden, da Kabel verbunden sind. Bitte entferne zuerst die Kabel.“). Dasselbe gilt, wenn ein **untergeordneter** Netzknoten Kabel hat – die sehen Sie erst im Subnetz, siehe Abschnitt [Subnetz eines Netzknotens](#_14-9-subnetz-eines-netzknotens).
:::

## 14.3 Kabeleigenschaften, Kabeltyp und Kabellänge neu berechnen

Ein Klick auf die Beschriftung eines Kabels öffnet die Info-Box mit den Reitern „Eigenschaften“, „Status“, „Fangpunkte“, „Aktionen“ und „Anhänge“. Das ausgewählte Kabel ist auf der Zeichenfläche dicker gezeichnet.

Der Reiter „Eigenschaften“ enthält den Namen, die Stammdaten (Status, Netzebene, Eigentümer, Baufirma, Hersteller, Datum, Kennzeichen) und darunter die drei Reserven „Reserve am Anfang“, „Reserve am Ende“ und „Reserve auf der Strecke“ sowie „Länge“ und „Gesamtlänge“. „Speichern“ übernimmt die Änderungen.

![Screenshot des Netzschemas mit Hervorhebung der Info-Box eines Kabels im Reiter „Eigenschaften“](/images/manual/teil-a/schema_cable_properties.jpg)

Drei Felder verhalten sich anders als die übrigen:

- **„Kabeltyp“** ist ausgegraut und bleibt **leer**, auch wenn das Kabel einen Kabeltyp hat. Er steht damit fest und lässt sich nicht mehr ändern; nachlesen können Sie ihn in der Kabelübersicht einer Trasse, siehe Abschnitt [Rohrübersicht und Kabelübersicht einer Trasse](./05-karte.md#_5-4-rohrubersicht-und-kabelubersicht-einer-trasse).
- **„Verbundene Leerrohre“** listet die Rohre auf, in deren Mikrorohren das Kabel liegt. Das Feld ist nur zu lesen und ergibt sich aus Abschnitt [Kabel mit Mikrorohren verknüpfen](#_14-5-kabel-mit-mikrorohren-verknupfen).
- **„Länge“** und **„Gesamtlänge“** sind berechnet und ebenfalls nur zu lesen, siehe Abschnitt [Kabel, Bündel, Faser und Spleiß](./02-grundbegriffe-und-datenmodell.md#_2-2-kabel-bundel-faser-und-spleiß).

Der Reiter „Aktionen“ hält zwei Schaltflächen bereit: „Mit Mikrorohr verbinden“ (siehe den nächsten Abschnitt) und „Kabellänge neu berechnen“.

![Screenshot des Netzschemas mit Hervorhebung der Info-Box eines Kabels im Reiter „Aktionen“](/images/manual/teil-a/schema_cable_actions.jpg)

„Kabellänge neu berechnen“ ermittelt die Länge erneut aus den Trassen, durch die das Kabel läuft, und meldet „Kabellänge neu berechnet“. Nötig ist das nach jeder Änderung an den Mikrorohr-Verknüpfungen und nach jeder Änderung an den Trassenlängen – von selbst rechnet Qonnectra nicht nach.

::: info
Ist das Kabel mit keinem Mikrorohr verknüpft, ergibt die Berechnung 0 m. Findet Qonnectra keinen durchgehenden Weg zwischen Anfangs- und Endknoten, summiert es stattdessen die Längen aller Trassen, in denen das Kabel liegt – der Wert fällt dann zu groß aus.
:::

„Kabel löschen“ im Reiter „Eigenschaften“ entfernt das Kabel.

::: danger
Mit dem Kabel gehen seine Fasern und alle Spleiße verloren, die auf diesen Fasern liegen. Die Rückfrage nennt vorher deren Anzahl.
:::

## 14.4 Bearbeitungsmodus: Kabelverlauf, Beschriftung und Fangpunkte

Der Verlauf einer Kabellinie und die Lage ihrer Beschriftung lassen sich ändern – aber nur im **Bearbeitungsmodus**, und der gilt immer für genau ein Kabel. Zwei Voraussetzungen: Die Zeichenfläche muss entsperrt sein, und das Kabel muss der Bearbeitungsgegenstand sein.

So schalten Sie den Modus ein:

1. Entsperren Sie die Zeichenfläche, siehe Abschnitt [Netzknoten verschieben, verbinden und löschen](#_14-2-netzknoten-verschieben-verbinden-und-loschen).
2. Klicken Sie mit der rechten Maustaste auf die Beschriftung des Kabels und dann auf „Kabel bearbeiten“.

![Screenshot des Netzschemas mit Hervorhebung der Kabelbeschriftung und des Kontextmenüs mit dem Eintrag „Kabel bearbeiten“](/images/manual/teil-a/schema_edit_mode.jpg)

Am oberen rechten Rand der Zeichenfläche steht danach „Bearbeite:“ mit dem Namen des Kabels. Das Kreuz daneben beendet den Modus, ebenso die Taste Esc oder der Eintrag „Kabelbearbeitung beenden“ im Kontextmenü. Statt über das Menü kommen Sie mit Alt + Klick auf eine Beschriftung direkt in den Modus – auch aus dem Modus eines anderen Kabels heraus.

::: info
Ein Klick auf die Beschriftung ohne Alt öffnet immer die Info-Box, in jedem Zustand. Die Bearbeitung liegt also nicht im Weg, wenn Sie nur die Eigenschaften lesen wollen.
:::

### 14.4.1 Verlauf eines Kabels ändern

Im Bearbeitungsmodus zeichnet Qonnectra die Linie dicker und mit einem Schein. Ein Klick auf die Linie setzt an dieser Stelle einen **Scheitelpunkt** – einen Knick, mit dem Sie das Kabel um andere Objekte herumführen.

![](/videos/schema_cable_path.webm)

Die Punkte sind als blasse Kreise auf der Linie gezeichnet und werden deutlich, sobald der Mauszeiger die Linie berührt. Ziehen verschiebt einen Punkt, Shift + Klick löscht ihn. Jede Änderung ist sofort gespeichert; Qonnectra meldet „Kabelgeometrie erfolgreich aktualisiert“.

::: info
Solange „Einrasten“ eingeschaltet ist, springen die Punkte auf ein Raster von 20 Pixeln, siehe Abschnitt [Anzeigeoptionen](#_14-10-anzeigeoptionen-einrasten-kabelrichtungs-animation). Der Verlauf ist reine Darstellung – für den Weg des Kabels im Gelände sind die Mikrorohre zuständig.
:::

### 14.4.2 Beschriftung verschieben und zurücksetzen

Wo eine Beschriftung liegt, ist am Kabel gespeichert. Ist dort keine Position hinterlegt, setzt Qonnectra sie in die Mitte der Linie; andernfalls steht sie genau an der gespeicherten Stelle.

::: info
Bei importierten Kabeln stammt diese Position aus dem Herkunftssystem. Zeichnet Qonnectra die Linie anders – etwa mit einem rechten Winkel um einen Netzknoten herum –, liegt die Beschriftung dann neben ihrem Kabel. Von selbst rückt sie nicht nach; ziehen Sie sie an die Linie.
:::

Verschieben können Sie sie so: Halten Sie die linke Maustaste eine halbe Sekunde auf der Beschriftung gedrückt – ein Ring am Mauszeiger füllt sich –, danach folgt sie der Maus. Mit dem Loslassen ist die neue Position gespeichert; Qonnectra meldet „Kabelbeschriftung erfolgreich gespeichert“. Shift + Klick setzt die Position zurück, sodass die Beschriftung wieder in der Mitte der Linie liegt.

::: warning
Beides wirkt nur im Bearbeitungsmodus. Außerhalb öffnet auch ein langes Drücken nur die Info-Box – die Beschriftung wirkt dann festgeklebt.
:::

::: warning
Das Zurücksetzen löscht die gespeicherte Position und setzt damit die Zugriffsstufe „Vollzugriff“ voraus; die Berechtigung zum Bearbeiten genügt dafür nicht. Fehlt sie, springt die Beschriftung kurz in die Mitte, Qonnectra meldet „Fehler beim Speichern der Kabelbeschriftung“, und sie liegt danach wieder an ihrer alten Stelle. Verschieben Sie sie in diesem Fall von Hand, siehe Kapitel [Rollen und Rechte](../teil-b-betrieb-admin-qgis/19-rollen-und-rechte.md).
:::

### 14.4.3 Reiter „Fangpunkte“

Der Reiter „Fangpunkte“ der Info-Box zeigt, an welchen Netzknoten das Kabel hängt und an welcher Seite des Kastens: je Ende die Überschrift mit dem Netzknotennamen, darunter das Feld „Netzknoten ändern“ und die vier Möglichkeiten „Oben“, „Rechts“, „Unten“ und „Links“. „Speichern“ übernimmt die Auswahl.

![Screenshot des Netzschemas mit Hervorhebung der Info-Box eines Kabels im Reiter „Fangpunkte“](/images/manual/teil-a/schema_handles.jpg)

::: danger
„Netzknoten ändern“ hängt das Kabelende an einen anderen Netzknoten um. Liegen am alten Netzknoten Spleiße auf den Fasern dieses Kabels, werden sie dabei gelöscht; die Rückfrage nennt ihre Anzahl („Durch das Ändern der Netzknotenverbindung werden Faserverbindungen gelöscht. 24 Faserverbindungen.“). Mit „Abbrechen“ bleibt alles, wie es war.
:::

## 14.5 Kabel mit Mikrorohren verknüpfen

Ein Kabel hat keine eigene Geometrie: Wo es verläuft, ergibt sich aus dem Mikrorohr, in dem es liegt, und aus den Trassen dieses Rohrs. Diese Verknüpfung stellen Sie hier her – sie ist die Voraussetzung für die Kabellänge (Abschnitt [Kabeleigenschaften](#_14-3-kabeleigenschaften-kabeltyp-und-kabellange-neu-berechnen)), für den Faserweg (Kapitel [Faserweg](./15-faserweg.md)) und für die Störungsanalyse (Kapitel [Störungsanalyse](./06-stoerungsanalyse.md)).

**Automatisch beim Anlegen**

Direkt nach dem Anlegen eines Kabels sucht Qonnectra an beiden Enden nach einem passenden Mikrorohr: nach einem, das einem Netzknoten mit derselben Adresse zugeordnet ist – also einem, an dem Sie einen Hausanschluss dokumentiert haben, siehe Kapitel [Mikrorohre](./13-mikrorohre.md). Mikrorohre mit einem Status bleiben außen vor. Findet Qonnectra genau eines, verknüpft es das Kabel damit und meldet „Mikrorohr St-V02-01 #3 blau wurde automatisch verknüpft“.

Hat der Endknoten keine Adresse oder findet sich kein Mikrorohr, geschieht nichts – ohne Meldung. Kommen mehrere Mikrorohre infrage, fragt das Fenster „Mikrorohr auswählen“ nach: Es nennt die Adresse und listet die Kandidaten mit Rohrnamen, Nummer und Farbe auf; zu Mikrorohren, in denen schon ein Kabel liegt, steht dessen Name darunter. „Abbrechen“ überspringt das Ende – verknüpfen können Sie es später von Hand.

**Von Hand**

Im Reiter „Aktionen“ öffnet „Mit Mikrorohr verbinden“ das Fenster „Kabel-Mikrorohr Verknüpfung“. Es ist zweigeteilt: links eine Karte des Projekts, die sich wie in Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster) beschrieben verhält, rechts die Auswahl in zwei Schritten.

Schritt 1 („Gräben“) beginnt mit dem Hinweis „Wählen Sie Gräben auf der Karte aus“. Klicken Sie in der Karte auf die Trassen, durch die das Kabel läuft; ein erneuter Klick nimmt eine Trasse wieder aus der Auswahl, mit Shift und gedrückter linker Maustaste ziehen Sie einen Rahmen um mehrere. Rechts steht darauf, wie viele Gräben ausgewählt sind, und darunter die Leerrohre, die in ihnen liegen. Rohre, in denen bereits ein Kabel liegt, sind mit „Verknüpft“ gekennzeichnet.

![Screenshot des Fensters „Kabel-Mikrorohr Verknüpfung“ mit der Karte links und der Liste der Leerrohre einer ausgewählten Trasse rechts](/images/manual/teil-a/schema_micropipe_trenches.jpg){.big}

Kreuzen Sie die Rohre an, in denen das Kabel liegt, und klicken Sie auf „Weiter“. Schritt 2 („Mikrorohre“) zeigt die Mikrorohre dieser Rohre in einer Tabelle mit „Farbe“, „Verfügbar“ und „Status“. Wählen Sie eines aus und speichern Sie.

![Screenshot des Fensters „Kabel-Mikrorohr Verknüpfung“ mit der Tabelle der Mikrorohre im zweiten Schritt](/images/manual/teil-a/schema_micropipe_microducts.jpg){.big}

Der Umschalter „Route anzeigen“ oben rechts zeichnet den bisherigen Weg des Kabels in die Karte – hilfreich, um zu sehen, wo die nächste Trasse anschließen muss. „Auswahl löschen“ hebt die Trassenauswahl auf, die Ziffern „1“ und „2“ über der Auswahl wechseln zwischen den Schritten.

::: warning
Haben Sie mehrere Rohre angekreuzt, muss dasselbe Mikrorohr in allen vorkommen. Fehlt es in einem, steht in der Zeile „Nicht verfügbar in: …“, und die Auswahl ist gesperrt.
:::

::: info
Die Verknüpfung ändert die Kabellänge nicht von selbst. Rechnen Sie sie anschließend mit „Kabellänge neu berechnen“ nach.
:::

## 14.6 Fasern und Bündel eines Kabels

Der Reiter „Status“ der Info-Box listet die Bündel des Kabels auf; ein Klick auf ein Bündel klappt seine Fasern mit „#“, „Farbe“ und „Status“ auf. Wie diese Nummern und Farben zustande kommen, steht in Abschnitt [Kabel, Bündel, Faser und Spleiß](./02-grundbegriffe-und-datenmodell.md#_2-2-kabel-bundel-faser-und-spleiß).

Diese Ansicht ist die einzige Stelle, an der Sie den **Status einer Faser** ändern können: Wählen Sie in der Zeile der Faser einen Status aus der Liste. Sie enthält „Intakt“ und die Faserstatus Ihrer Installation – meist nur den Begriff „Defekt“.

![Screenshot des Netzschemas mit Hervorhebung der Info-Box eines Kabels im Reiter „Status“ und der geöffneten Statusliste einer Faser](/images/manual/teil-a/schema_fiber_status.jpg)

Die Auswahl ist sofort gespeichert. Eine defekte Faser ist danach überall durchgestrichen dargestellt, und am Bündel steht, wie viele seiner Fasern defekt sind – auch in der Kabelübersicht der Karte, siehe Abschnitt [Rohrübersicht und Kabelübersicht einer Trasse](./05-karte.md#_5-4-rohrubersicht-und-kabelubersicht-einer-trasse).

::: info
Qonnectra bestätigt die Änderung mit „Mikrorohr-Status aktualisiert“. Gemeint ist der Status der Faser; die Meldung ist an dieser Stelle falsch beschriftet.
:::

## 14.7 Netzknoten öffnen: Slot-Konfiguration, Struktur, Container

Der Reiter „Aktionen“ eines Netzknotens führt zu seinem inneren Aufbau: „Slots konfigurieren“ öffnet das Fenster „Netzknoten-Konfiguration“, „Struktur konfigurieren“ das Fenster „Netzknotenstruktur“. Beide Fenster kennen Sie aus der Karte, dort sind sie reine Anzeigen – wie sie aufgebaut sind, steht in Abschnitt [Netzknoten: Slot-Konfiguration und Struktur öffnen](./05-karte.md#_5-6-netzknoten-slot-konfiguration-und-struktur-offnen). Im Netzschema sind sie bearbeitbar.

::: warning
Beide Fenster öffnen mittig und gleich groß übereinander, und „Netzknotenstruktur“ liegt immer oben. Ziehen Sie das obere Fenster an seiner Titelzeile beiseite, wenn Sie beide gleichzeitig brauchen – Abschnitt [Netzknoten: Slot-Konfiguration und Struktur öffnen](./05-karte.md#_5-6-netzknoten-slot-konfiguration-und-struktur-offnen) beschreibt das Verhalten im Einzelnen.
:::

**Einbauplätze und Container anlegen**

„Hinzufügen“ legt eine neue Slot-Konfiguration an: „Seite“ (ein kurzer Name wie „A“ oder „Muffe“) und „Gesamtslots“, also die Anzahl der Einbauplätze. „Container hinzufügen“ legt einen Container an – „Container-Typ“ ist Pflicht, „Name (optional)“ nicht.

![Screenshot des Fensters „Netzknoten-Konfiguration“ mit dem Container „RACK-A1“ und der darin liegenden Slot-Konfiguration](/images/manual/teil-a/schema_slot_config.jpg){.big}

Jede Zeile trägt rechts ihre Schaltflächen: das Auge („Struktur anzeigen“) zeigt die Struktur dieser Seite, der Stift öffnet die Konfiguration zum Bearbeiten, der Papierkorb löscht sie. Das Auge schaltet dabei das Fenster „Netzknotenstruktur“ auf diese Seite um – ist es schon offen, holt es das Fenster aber nicht nach vorn, siehe Abschnitt [Netzknoten: Slot-Konfiguration und Struktur öffnen](./05-karte.md#_5-6-netzknoten-slot-konfiguration-und-struktur-offnen). Am Griff links ziehen Sie eine Slot-Konfiguration in einen Container oder aus ihm heraus; Container lassen sich ineinander schieben. Das Download-Symbol oben rechts speichert den Aufbau als Excel-Datei, siehe Abschnitt [Exportformate im Überblick](./03-wiederkehrende-bedienelemente.md#_3-8-exportformate-im-uberblick).

::: warning
Container-Typen sind Stammdaten der Installation und lassen sich nur im Administrationsbereich anlegen, siehe Kapitel [Projekte und Stammdaten pflegen](../teil-b-betrieb-admin-qgis/21-projekte-und-stammdaten.md). Gibt es keinen einzigen, fehlt die Schaltfläche „Container hinzufügen“ ganz.
:::

::: danger
Der Papierkorb an einer Slot-Konfiguration löscht mit ihr die eingebauten Komponenten und deren Spleiße. Die Rückfrage nennt vorher deren Anzahl.
:::

::: warning
Jedes Löschen in diesem Fenster – Slot-Konfiguration wie Container – setzt die Zugriffsstufe „Vollzugriff“ voraus; die Berechtigung zum Bearbeiten genügt dafür nicht. Fehlt sie, erscheint eine Fehlermeldung, und der Eintrag bleibt stehen. Wenden Sie sich in diesem Fall an Ihre Administration, siehe Kapitel [Rollen und Rechte](../teil-b-betrieb-admin-qgis/19-rollen-und-rechte.md).
:::

**Komponenten einbauen**

Das Fenster „Netzknotenstruktur“ hat im Netzschema drei Spalten: links die Leiste „Komponententypen“, in der Mitte das Slot-Grid, rechts die Leiste „Kabel“.

![Screenshot des Fensters „Netzknotenstruktur“ mit der Leiste „Komponententypen“ links, dem Slot-Grid in der Mitte und der Kabelleiste rechts](/images/manual/teil-a/schema_structure.jpg){.big}

Jeder Eintrag der Leiste „Komponententypen“ nennt den Typ und die Zahl der Slots, die er belegt, dazu ein Zählfeld mit „−“ und „+“. Ziehen Sie den Eintrag in eine freie Zeile des Slot-Grids: Ein grüner Rahmen zeigt, dass die Komponente dort hineinpasst, ein roter, dass die Slots schon belegt sind. Steht im Zählfeld eine höhere Zahl, baut Qonnectra mehrere Komponenten desselben Typs hintereinander ein.

Eine eingebaute Komponente ziehen Sie am Griff auf eine andere Stelle des Grids; der Papierkorb an ihrem rechten Rand entfernt sie.

::: warning
Passt die Komponente nicht mehr in die restlichen Slots, meldet Qonnectra „Nicht genug Slots verfügbar“, bei belegten Slots „Slots sind bereits belegt“ – eingebaut wird dann nichts.
:::

::: danger
Der Papierkorb an einer Komponente löscht auch die Spleiße, die auf ihren Ports liegen. Die Rückfrage nennt deren Anzahl.
:::

::: warning
Auch hier setzt das Löschen die Zugriffsstufe „Vollzugriff“ voraus. Fehlt sie, meldet Qonnectra „Fehler beim Löschen der Struktur“, und die Komponente bleibt eingebaut.
:::

## 14.8 Spleiße und Ports

Ein Klick auf eine eingebaute Komponente im Slot-Grid öffnet ihre Ports mit den Spalten „Port“, „Faser A“ und „Faser B“ – die beiden Seiten, zwischen denen ein Port die Fasern verbindet. „Zurück“ führt wieder in das Grid. Eine Komponente mit vielen Ports füllt mehr, als das Fenster zeigt: Maximieren Sie es über die Titelzeile, siehe Abschnitt [Grabenprofil einer Trasse](./05-karte.md#_5-5-grabenprofil-einer-trasse).

![Screenshot des maximierten Fensters „Netzknotenstruktur“ mit der Tabelle der Ports einer Komponente: auf jedem Port eine Faser auf Seite A und eine auf Seite B](/images/manual/teil-a/schema_ports.jpg){.big}

**Fasern auflegen**

Die Leiste „Kabel“ am rechten Rand führt alle Kabel des Netzknotens auf. Klappen Sie ein Kabel und darin ein Bündel auf und ziehen Sie eine Faser in die Zelle „Faser A“ oder „Faser B“ eines Ports – damit ist der Spleiß gesetzt, und Qonnectra meldet „Faser erfolgreich verbunden“.

![](/videos/schema_splice_drag.webm)

Sie können auch größere Einheiten ziehen:

- Ein **Bündel** füllt die Ports ab der Zelle, in der Sie loslassen, mit seinen Fasern der Reihe nach – bis zum ersten Port, auf dem schon eine Faser liegt. Qonnectra meldet dann, wie viele Fasern verbunden wurden („24 Fasern verbunden“ oder „18 von 24 Fasern verbunden“).
- Ein **Kabel** füllt auf dieselbe Weise weiter und läuft dabei in die folgenden Komponenten der Seite über.
- Eine **Wohneinheit** aus dem Abschnitt „Adressen“ der Leiste belegt einen Port genauso wie eine Faser. So dokumentieren Sie, welche Wohneinheit an welchem Port hängt – der Faserweg zeigt sie später als Ziel, siehe Abschnitt [Betroffene Adressen und Wohneinheiten](./15-faserweg.md#_15-5-betroffene-adressen-und-wohneinheiten).

Fasern, die schon auf einem Port liegen, sind in der Leiste grün hinterlegt; ein vollständig aufgelegtes Bündel ebenso. Innerhalb der Tabelle ziehen Sie eine Faser von einer Zelle in eine andere und verschieben damit den Spleiß.

::: warning
Eine Zelle nimmt immer nur eine Faser auf. Lassen Sie eine Faser auf einer Zelle los, die schon belegt ist, **ersetzt** sie die bisherige – ohne Rückfrage, und ohne dass die alte Faser auf einen anderen Port ausweicht. Bei zusammengeführten Ports gilt das für die ganze Gruppe.
:::

Jede belegte Zelle trägt beim Zeigen mit der Maus drei Schaltflächen: „Folgen“ öffnet den Faserweg dieser Faser (siehe Kapitel [Faserweg](./15-faserweg.md)) und zeigt anschließend in der Zelle eine Zusammenfassung („2 Spleisse · 1 Adresse“), „Löschen“ nimmt die Faser vom Port, und bei zusammengeführten Ports kommt „Trennen“ hinzu.

**Ports zusammenführen**

Auf eine Seite eines Ports gehört immer nur eine Faser. Wenn mehrere Fasern in einen gemeinsamen Anschluss laufen – etwa an einem Splitter –, führen Sie stattdessen die Ports zusammen:

1. Klicken Sie auf das Zusammenführen-Symbol in der Spaltenüberschrift „Faser A“ oder „Faser B“. Die Tabelle wechselt in einen Auswahlmodus und zeigt vor jeder Zeile ein Kästchen.
2. Kreuzen Sie mindestens zwei **aufeinanderfolgende** Ports an. Das Kästchen in der Überschrift wählt alle auf einmal aus.
3. Klicken Sie unten rechts auf „Zusammenführen“; die Schaltfläche nennt die Zahl der ausgewählten Ports. Sie erscheint erst mit dem zweiten Kästchen, links davon steht die betroffene Seite („Seite: A (IN)“).

![Screenshot des maximierten Fensters „Netzknotenstruktur“ mit der Tabelle der Ports im Auswahlmodus zum Zusammenführen von Ports](/images/manual/teil-a/schema_port_merge.jpg){.big}

Die zusammengeführten Ports stehen danach als eine Zelle mit dem Bereich („1-3“) und teilen sich eine Faser. „Trennen“ löst die Gruppe wieder auf. Das Symbol in der Spaltenüberschrift beendet den Auswahlmodus, ohne etwas zusammenzuführen.

::: warning
Zusammenführen geht nur auf einer Seite und nur bei lückenlos aufeinanderfolgenden Ports. Andernfalls meldet Qonnectra „Ports von verschiedenen Seiten können nicht zusammengeführt werden“ beziehungsweise – englisch – „Ports must be consecutive (e.g., 1-2-3, not 1-3)“. Auch andere Meldungen dieser Tabelle sind teils englisch, etwa „No available ports“, wenn ab der Zelle kein freier Port mehr folgt.
:::

::: info
Auf eine zusammengeführte Gruppe gehört ebenfalls nur eine einzelne Faser: Ziehen Sie ein Bündel oder ein Kabel darauf, meldet Qonnectra „Nur einzelne Fasern können mit Ports verbunden werden“.
:::

## 14.9 Subnetz eines Netzknotens

Netzknoten können einander untergeordnet sein, siehe Abschnitt [Netzknoten, Container, Slots, Komponenten und Ports](./02-grundbegriffe-und-datenmodell.md#_2-3-netzknoten-container-slots-komponenten-und-ports). Das **Subnetz** ist das Schema dieser Unterordnung: Es zeigt einen Netzknoten mit den Netzknoten, die unter ihm hängen, und den Kabeln dazwischen.

Sie öffnen es im Reiter „Aktionen“ des übergeordneten Netzknotens mit „Subnetz öffnen“. Die Zeichenfläche verhält sich wie im Hauptschema, passt sich beim Öffnen aber selbst auf das Diagramm an. Im Bereich „Eigenschaften“ steht zusätzlich „Zurück zum Hauptschema“.

![Screenshot des Subnetzes eines Verteilers mit dem Verteiler in der Mitte und den Hausanschlüssen ringsum](/images/manual/teil-a/schema_subnet.jpg)

Das Subnetz ist der Ort für die Hausanschlusskabel: Ein Kabel, das Sie hier anlegen, gehört zu diesem Subnetz und erscheint im Hauptschema nicht. Umgekehrt fehlen die Kabel des Hauptschemas im Subnetz.

::: warning
„Subnetz öffnen“ steht nur an Netzknotentypen, die Ihre Administration in den Netzschema-Einstellungen dafür freigegeben hat, siehe Kapitel [Projektbezogene Konfiguration](../teil-b-betrieb-admin-qgis/22-projektbezogene-konfiguration.md). An allen anderen Netzknoten fehlt die Schaltfläche, auch wenn untergeordnete Netzknoten vorhanden sind.
:::

::: info
Die Position eines Netzknotens im Subnetz wird getrennt von der im Hauptschema gespeichert. Ein Netzknoten, der in beiden Diagrammen vorkommt, kann darin also an verschiedenen Stellen liegen.
:::

::: info
Der übergeordnete Netzknoten steht im Feld „Übergeordneter Netzknoten“ im Reiter „Eigenschaften“. Solange am untergeordneten Netzknoten Kabel hängen, ist das Feld im Subnetz gesperrt („Der übergeordnete Netzknoten kann nicht geändert werden, da dieser Netzknoten verbundene Kabel hat.“).
:::

## 14.10 Anzeigeoptionen: Einrasten, Kabelrichtungs-Animation

Die beiden Umschalter unter „Anzeigeoptionen“ im Bereich „Eigenschaften“ betreffen nur die Darstellung; gespeichert werden sie in Ihrem Browser, nicht am Projekt.

- **„Einrasten“** (voreingestellt eingeschaltet) lässt die Scheitelpunkte einer Kabellinie auf ein Raster von 20 Pixeln springen, siehe Abschnitt [Verlauf eines Kabels ändern](#_14-4-1-verlauf-eines-kabels-andern). Ausgeschaltet folgen sie der Maus frei.
- **„Kabelrichtungs-Animation“** (voreingestellt ausgeschaltet) lässt weiße Striche auf allen Kabeln vom Anfangs- zum Endknoten wandern. So sehen Sie auf einen Blick, welches Ende eines Kabels als Anfang eingetragen ist.

Die Farbe der Kabellinien stellen Sie nicht hier, sondern in den Einstellungen unter „Kabelfarbe“ ein, siehe Kapitel [Einstellungen](./17-einstellungen.md).

## 14.11 Kartenkoordinaten mit dem Schema synchronisieren

Ein Netzknoten hat zwei Positionen: die geografische aus der Karte und die auf der Zeichenfläche. Beim Öffnen des Netzschemas prüft Qonnectra, ob Netzknoten ohne Position auf der Zeichenfläche vorhanden sind, und rechnet sie aus den Kartenkoordinaten aus. Ist das geschehen, meldet es „Canvas Synchronisierung erfolgreich“.

Diese Synchronisierung läuft nur in eine Richtung und nur einmal je Netzknoten:

- Ein neu hinzugekommener Netzknoten steht beim nächsten Öffnen an der Stelle, die seiner Lage im Gelände entspricht – maßstäblich verkleinert und auf das Raster gerundet.
- Sobald er eine Position hat, bleibt sie, wo sie ist. Verschieben Sie ihn in der Zeichenfläche, ändert das die Karte nicht; verschieben Sie ihn in QGIS, ändert das das Schema nicht.

::: info
Arbeiten mehrere Personen gleichzeitig, führt Qonnectra die Synchronisierung nur einmal aus: Läuft sie bereits, wartet die Ansicht bis zu 30 Sekunden auf das Ergebnis.
:::

::: warning
Schlägt die Synchronisierung fehl, meldet Qonnectra „Fehler beim Synchronisieren der Canvas“. Das Schema öffnet trotzdem, greift für die betroffenen Netzknoten aber auf eine grobe Notrechnung zurück: Sie liegen dann alle dicht beieinander und müssen von Hand auseinandergezogen werden.
:::
