# 5. Karte

Die **Karte** zeigt den Netzbestand eines Projekts in seiner Lage im Raum: Trassen, Netzknoten, Adressen und Gebiete. Zu jedem dieser Objekte rufen Sie hier die Eigenschaften, die Rohre und Kabel darin sowie die Anhänge ab. Sie erreichen sie über die linke Navigationsleiste in der Gruppe „Info“ durch Klicken auf den Menüpunkt „Karte“.

![Screenshot Karte](/images/manual/teil-a/map.jpg)

Bewegung, Legende, Transparenz und Suche funktionieren wie in Kapitel [Wiederkehrende Bedienelemente](./03-wiederkehrende-bedienelemente.md) beschrieben. Dieses Kapitel behandelt, was nur für die Kartenansicht gilt.

## 5.1 Kartenausschnitt, Zoomstufe und gespeicherte Position

Qonnectra merkt sich den letzten Kartenausschnitt. Wenn Sie die Karte erneut öffnen, sehen Sie wieder die Stelle, an der Sie zuletzt gearbeitet haben.

::: warning
Das gilt auch über einen Projektwechsel hinweg: Wählen Sie bei geöffneter Karte ein anderes Projekt, bleibt der Ausschnitt stehen und die Karte springt **nicht** in das Gebiet des neuen Projekts. Sie sehen dann unter Umständen eine leere Karte, obwohl das Projekt Daten hat. Holen Sie sich die Daten mit „Auf Ausdehnung zoomen“ beim Legendeneintrag „Adresse“ ins Bild, siehe Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster).
:::

Die Beschränkung auf das gewählte Projekt heben Sie in der Karte über die Schaltfläche „Alle Projekte anzeigen“ neben der Projektauswahl vorübergehend auf; die Karte zeichnet dann den Bestand aller Projekte, für die Sie berechtigt sind, siehe Abschnitt [Projekt auswählen und wechseln](./01-erste-schritte.md#_1-3-projekt-auswahlen-und-wechseln).

## 5.2 Layer der Karte

Welche Layer die Legende führt, welche sich nach Typen aufklappen lassen und wie Sie sie schalten, beschreibt Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster) – in der Kartenansicht gilt das unverändert.

Kartenspezifisch ist nur die Darstellung selbst: Die Farben und Formen der Layer stellen Sie unter „Einstellungen“ ein, siehe Kapitel [Einstellungen](./17-einstellungen.md). Davon hängt auch ab, ob sich der Eintrag „Trasse“ aufklappen lässt.

## 5.3 Objekte auswählen und Eigenschaften lesen

Wenn Sie ein Objekt (z. B. eine Trasse oder einen Netzknoten) auf der Karte anklicken, öffnet sich auf der rechten Seite die **Info-Box**, siehe Abschnitt [Die Info-Box](./03-wiederkehrende-bedienelemente.md#_3-6-die-info-box-mit-ihren-reitern). Welche Reiter sie enthält, hängt von der Objektart ab:

- Trasse: „Eigenschaften“, „Rohrübersicht“, „Kabelübersicht“, „Aktionen“, „Anhänge“
- Netzknoten und Adresse: „Eigenschaften“, „Aktionen“, „Anhänge“
- Gebiet: „Eigenschaften“, „Anhänge“

Die Angaben im Reiter „Eigenschaften“ sind hier nicht bearbeitbar, sondern dienen als Informationsquelle. Bearbeiten können Sie in der Karte ausschließlich den Reiter „Anhänge“, siehe Abschnitt [Anhänge an einem Kartenobjekt](#_5-8-anhange-an-einem-kartenobjekt).

![Screenshot Karte mit Hervorhebung eines ausgewählten Objekts und der Anzeige der Details in der Info-Box rechts](/images/manual/teil-a/map_selected_object.jpg)

## 5.4 Rohrübersicht und Kabelübersicht einer Trasse

Der Reiter „Rohrübersicht“ zeigt die Rohre der ausgewählten Trasse, siehe Kapitel [Rohrverwaltung](./10-rohrverwaltung.md), „Kabelübersicht“ die darin liegenden Kabel.

**Rohrübersicht**

Jedes Rohr steht als eigene Zeile mit seinem Namen und dem Rohrtyp in Klammern. Ein Klick auf die Zeile klappt sie auf und lädt die Mikrorohre des Rohrs; die Liste ist dieselbe wie im Reiter „Status“ der Rohrverwaltung, hier aber nicht bearbeitbar, siehe Abschnitt [Mikrorohre eines Rohrs](./10-rohrverwaltung.md#_10-4-mikrorohre-eines-rohrs). Mehrere Zeilen lassen sich gleichzeitig geöffnet halten. Liegt in der Trasse kein Rohr, steht dort „Keine Rohre gefunden“.

![Screenshot der Info-Box einer Trasse im Reiter „Rohrübersicht“ mit einem aufgeklappten Rohr und der Liste seiner Mikrorohre](/images/manual/teil-a/map_trench_conduits.jpg){.big}

Die Schaltfläche „Trassen auf Karte hervorheben“ in der Zeile eines Rohrs markiert alle Trassen, durch die dieses Rohr verläuft. So verfolgen Sie seinen Verlauf über die ausgewählte Trasse hinaus.

**Kabelübersicht**

Die Kabelübersicht ist ebenso aufgebaut: je Kabel eine Zeile mit Namen, Kabeltyp und der Zahl der Fasern. Aufgeklappt stehen darin die **Bündel** des Kabels, jedes mit seiner Farbe, seiner Nummer und der Zahl seiner Fasern; sind Fasern als defekt vermerkt, steht ihre Anzahl am rechten Rand des Bündels. Ein Klick auf ein Bündel zeigt dessen Fasern mit „#“, „Farbe“ und „Status“.

![Screenshot der Info-Box einer Trasse im Reiter „Kabelübersicht“ mit einem aufgeklappten Kabel und den Fasern des ersten Bündels](/images/manual/teil-a/map_trench_cables.jpg){.big}

Jede Kabelzeile trägt zwei Schaltflächen: „Trassen auf Karte hervorheben“ wie bei den Rohren und „Folgen“, das den Faserweg dieses Kabels öffnet, siehe Abschnitt [Von der Karte in den Faserweg wechseln](#_5-7-von-der-karte-in-den-faserweg-wechseln). Dieselbe Schaltfläche „Folgen“ gibt es an jeder einzelnen Faser. Liegt in der Trasse kein Kabel, steht dort „Keine Kabel in dieser Trasse“.

::: info
Den Status einer Faser ändern Sie im Netzschema, siehe Kapitel [Netzschema](./14-netzschema.md).
:::

## 5.5 Grabenprofil einer Trasse

Im Reiter „Aktionen“ einer Trasse öffnet „Grabenprofil anzeigen“ den Querschnitt des Grabens mit der Lage der Rohre.

Das **Grabenprofil** erscheint in einem eigenen Fenster über der Karte. Es zeigt den Graben im Schnitt mit seinen Bodenschichten und darin je Rohr einen Kreis. Im Kreis stehen die Mikrorohre des Rohrs in ihren Farben, zweifarbige geteilt dargestellt; Mikrorohre mit einem hinterlegten Status sind blasser und mit einem ✕ gekennzeichnet. Unter jedem Kreis steht der Name des Rohrs, ein Zeigen mit der Maus nennt zusätzlich den Rohrtyp.

![Screenshot des Fensters „Grabenprofil“ über der Karte mit drei Rohren im Querschnitt](/images/manual/teil-a/map_trench_profile.jpg){.big}

Über die Schaltflächen links unten im Fenster zoomen Sie in die Zeichnung hinein und heraus und richten sie wieder auf ihren Inhalt aus. Das Fenster selbst verschieben Sie an seiner Titelzeile, an der rechten unteren Ecke ändern Sie seine Größe; die Schaltflächen in der Titelzeile verkleinern, maximieren und schließen es.

::: info
Das Profil ist eine schematische Darstellung, keine maßstäbliche Bauzeichnung: Die Rohre werden gleichmäßig angeordnet, ihre Lage im Bild entspricht nicht ihrer Lage im Graben. Verschieben lassen sie sich hier nicht.
:::

Enthält die Trasse keine Rohre, steht im Fenster „Keine Leerrohre in diesem Graben gefunden“.

## 5.6 Netzknoten: Slot-Konfiguration und Struktur öffnen

Im Reiter „Aktionen“ eines Netzknotens führen „Slot-Konfiguration anzeigen“ und „Struktur anzeigen“ zu dessen innerem Aufbau. Beide öffnen ein eigenes Fenster über der Karte, das sich wie das Grabenprofil verschieben und in der Größe ändern lässt.

::: warning
Beide Fenster öffnen mittig und sind gleich groß, und „Netzknotenstruktur“ liegt immer über „Netzknoten-Konfiguration“ – unabhängig davon, welches Sie zuerst geöffnet haben. Sobald die Struktur offen ist, verdeckt sie die Konfiguration vollständig; diese ist nicht geschlossen, sondern nur nicht zu sehen. Ziehen Sie das obere Fenster an seiner Titelzeile beiseite, dann liegen beide nebeneinander; ein Klick auf ein Fenster holt es nach vorn.

Erst dann sehen Sie auch, was „Struktur anzeigen“ in der Konfiguration bewirkt: Es schaltet das bereits geöffnete Strukturfenster auf die gewählte Seite um, holt es aber nicht nach vorn.
:::

**Slot-Konfiguration**

Das Fenster „Netzknoten-Konfiguration“ listet die Einbauplätze des Netzknotens auf, je Seite eine Konfiguration; sind für das Projekt Container eingerichtet, sind die Konfigurationen darin gruppiert. Zu jeder Konfiguration stehen die Seite sowie „Gesamtslots“, „Belegt“ und „Frei“ – so sehen Sie, wie viel Platz im Netzknoten noch ist. Das Auge („Struktur anzeigen“) an einer Konfiguration führt direkt in deren Belegung. Das Download-Symbol oben rechts speichert den Aufbau des Netzknotens als Excel-Datei, siehe Abschnitt [Exportformate im Überblick](./03-wiederkehrende-bedienelemente.md#_3-8-exportformate-im-uberblick).

![Screenshot des Fensters „Netzknoten-Konfiguration“ mit den beiden Konfigurationen A und B des Netzknotens](/images/manual/teil-a/map_node_slots.jpg){.big}

Sind für den Netzknoten keine Einbauplätze hinterlegt, steht dort „Keine Slot-Konfigurationen gefunden“.

**Struktur**

Das Fenster „Netzknotenstruktur“ zeigt die Belegung einer Seite. Es ist zweigeteilt: links das **Slot-Grid**, rechts die Leiste „Kabel“.

![Screenshot des Fensters „Netzknotenstruktur“ mit dem Slot-Grid links und der Kabelleiste rechts](/images/manual/teil-a/map_node_structure.jpg){.big}

Über dem Slot-Grid wählen Sie unter „Seite auswählen“, welche Konfiguration Sie sehen; daneben steht die Zahl der Gesamtslots. Das Grid selbst hat drei Spalten: „TPU“ mit der Nummer des Einbauplatzes, „Komponente“ mit dem dort eingebauten Bauteil und „Clip“ mit der Clip-Nummer, unter der die Komponente im Netzknoten beschriftet ist. Solange keine hinterlegt ist, wiederholt „Clip“ die Nummer aus „TPU“. Eine Komponente, die mehrere Slots belegt – ein Splitter etwa zwei –, steht als ein Block über deren Zeilen; freie Slots zeigen einen Strich.

Ein Klick auf eine Komponente öffnet deren Ports mit den Spalten „Port“, „Faser A“ und „Faser B“, also den beiderseits aufgelegten Fasern. „Zurück“ führt wieder zum Grid. Sind für die Komponente keine Ports hinterlegt, steht dort „Keine Ports für diese Komponente konfiguriert“.

Die Leiste „Kabel“ am rechten Rand führt alle Kabel des Netzknotens auf, je Eintrag den Namen und die Zahl der Fasern; ein Pfeil dahinter zeigt, ob das Kabel am Netzknoten beginnt oder endet. Ein Klick auf ein Kabel klappt seine Bündel auf, ein Klick auf ein Bündel dessen Fasern. Zu jeder Faser stehen ihre Farbe und ihre durchlaufende Nummer, und wenn sie auf einer Komponente aufliegt, deren Bezeichnung. Defekte Fasern sind durchgestrichen; ein Zeigen mit der Maus nennt den Status. Sind dem Netzknoten Adressen zugeordnet, folgt unter den Kabeln der Abschnitt „Adressen“ mit deren Wohneinheiten.

Am linken Rand der Leiste ziehen Sie sie über den Griff „Größe der Seitenleiste ändern“ breiter oder schmaler; die runde Schaltfläche „Einklappen“ an ihrer oberen linken Ecke klappt sie zu einem schmalen Streifen zusammen, „Erweitern“ holt sie zurück. Hat der Netzknoten keine Kabel, steht dort „Keine Kabel an diesem Netzknoten“.

::: info
Aus der Karte heraus sind beide Fenster reine Anzeigen. Angelegt und verändert wird der Aufbau eines Netzknotens im Netzschema, siehe Kapitel [Netzschema](./14-netzschema.md).
:::

## 5.7 Von der Karte in den Faserweg wechseln

Im Reiter „Aktionen“ eines Netzknotens oder einer Adresse springt „Folgen“ in die Ansicht „Faserweg“, siehe Kapitel [Faserweg](./15-faserweg.md).

Der Faserweg wird dabei sofort für das ausgewählte Objekt ermittelt: von einem Netzknoten aus für alle Fasern, die durch ihn laufen, von einer Adresse aus für die Fasern der dort angeschlossenen Netzknoten und Wohneinheiten. Dieselbe Schaltfläche „Folgen“ finden Sie im Reiter „Kabelübersicht“ an jedem Kabel und an jeder einzelnen Faser, siehe Abschnitt [Rohrübersicht und Kabelübersicht einer Trasse](#_5-4-rohrubersicht-und-kabelubersicht-einer-trasse).

„Folgen“ verlässt die Karte. Über die Zurück-Funktion des Browsers oder den Menüpunkt „Karte“ kehren Sie zurück; der Kartenausschnitt bleibt erhalten, die Info-Box öffnet sich nicht erneut.

::: info
Lässt sich zu dem gewählten Objekt kein Faserweg ermitteln, etwa weil noch kein Kabel angeschlossen ist, zeigt die Ansicht „Faserweg“ statt eines Ergebnisses eine Fehlermeldung mit der Kennung des Objekts.
:::

## 5.8 Anhänge an einem Kartenobjekt

Zu jedem Kartenobjekt können Sie Dateien ablegen. Hochladen, Herunterladen, Umbenennen und Löschen funktionieren wie in Abschnitt [Anhänge hochladen, ansehen und löschen](./03-wiederkehrende-bedienelemente.md#_3-7-anhange-hochladen-ansehen-und-loschen) beschrieben.

## 5.9 Grenzen der Darstellung

Ein Klick auf eine freie Stelle der Karte hebt die Auswahl auf – innerhalb eines Projektgebiets ist das allerdings kaum möglich; schließen Sie die Info-Box dann über das Kreuz „Seitenleiste schließen“.

Warum ein Klick oft nicht das gewünschte Objekt trifft und was dagegen hilft, beschreibt Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster) unter „Objekte anklicken“.
