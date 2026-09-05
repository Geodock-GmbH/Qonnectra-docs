# 4. Dashboard

Das **Dashboard** ist die zentrale Übersichtsseite von Qonnectra. Es fasst den dokumentierten Netzbestand eines Projekts in Kennzahlen und Diagrammen zusammen, damit Sie den Ausbauzustand ohne Umweg über Listen oder die Karte erfassen können. Nach der Anmeldung ist das Dashboard die Startansicht; später erreichen Sie es über die linke Navigation durch Klicken auf den Menüpunkt „Dashboard“ in der Gruppe „Info“.

![Screenshot Dashboard](/images/manual/teil-a/dashboard.jpg)

Alle Inhalte des Dashboards beziehen sich immer auf das Projekt, das oben links in der Kopfzeile ausgewählt ist. Die Auswertungen sind ausschließlich zur Ansicht bestimmt: Sie können hier keine Werte bearbeiten, und eine Exportfunktion für Kennzahlen oder Diagramme gibt es nicht.

Hinweis: Die Kennzahlen werden auf dem Server bis zu fünf Minuten zwischengespeichert. Daten, die Sie gerade in einer anderen Ansicht erfasst haben, erscheinen deshalb unter Umständen erst mit einigen Minuten Verzögerung – ein Neuladen der Seite beschleunigt das nicht.

## 4.1 Projekt auswählen

Bevor Kennzahlen sichtbar werden, muss ein Projekt ausgewählt sein. Die Projektauswahl befindet sich oben links in der Kopfzeile und ist eine Kombination aus Eingabefeld und Auswahlliste. Solange kein Projekt gewählt ist, steht im Feld der Platzhalter „Projekt“. Gehen Sie so vor:

1. Klicken Sie auf den Pfeil nach unten am rechten Rand des Feldes. Die Liste aller für Sie freigegebenen Projekte öffnet sich. Alternativ tippen Sie in das Feld; die Liste zeigt dann nur noch Projekte, deren Name Ihre Eingabe enthält.
2. Klicken Sie auf den gewünschten Eintrag. Das aktuell gewählte Projekt ist in der Liste farbig hinterlegt.

Alle Karten und Diagramme des Dashboards werden daraufhin automatisch neu geladen.

![Screenshot Dashboard mit Hervorhebung der Projektauswahl oben links in der Kopfzeile](/images/manual/teil-a/dashboard_project.jpg)
![Screenshot Ausschnittvergrößerung der geöffneten Projektliste in der Kopfzeile mit dem hervorgehobenen Eintrag „Testprojekt“](/images/manual/teil-a/dashboard_project_detail.jpg)
{.img-row}

Wichtig: Die Eingabe im Feld allein wählt nichts aus – erst der Klick auf einen Eintrag der Liste wechselt das Projekt. Passt kein Projekt zu Ihrer Eingabe, zeigt die Liste wieder alle Projekte an; eine Meldung über den fehlenden Treffer erscheint nicht.

Ist noch kein Projekt gewählt, bleiben alle Kennzahlen auf Null und die Diagramme zeigen „Keine Daten verfügbar“.

Hinweis: Die Projektauswahl gilt für die gesamte Anwendung und bleibt beim Wechsel in eine andere Ansicht erhalten (siehe Kapitel [Einstieg und Anmeldung](./03-einstieg-und-anmeldung.md)). Sind für Ihr Benutzerkonto keine Projekte freigegeben, erscheint anstelle des Feldes der Hinweis „Keine Projekte verfügbar“.

## 4.2 Reiter im Dashboard

Unterhalb der Kopfzeile stehen sechs Reiter (Tabs) waagerecht nebeneinander:

- „Übersicht“ – Kennzahlen aller Datenbereiche auf einen Blick
- „Trasse“ – Auswertungen zu den Trassen
- „Rohre“ – Auswertungen zu den Rohren
- „Netzknoten“ – Auswertungen zu den Netzknoten
- „Adressen“ – Auswertungen zu Adressen und Wohneinheiten
- „Gebiete“ – Auswertungen zu Gebieten und deren Abdeckung

![Screenshot Dashboard mit Hervorhebung der Reiterleiste oberhalb der Inhaltsfläche](/images/manual/teil-a/dashboard_tabs.jpg)

Sie wechseln durch Klicken auf die jeweilige Beschriftung zwischen den Ansichten. Der aktive Reiter ist farbig hervorgehoben und durch einen Balken unter der Beschriftung gekennzeichnet. Der Wechsel lädt keine Daten nach: Alle Auswertungen werden beim Öffnen des Dashboards gemeinsam geladen und stehen anschließend sofort bereit.

![](/videos/dashboard_tabs.webm)

Hinweis: Bei einem schmalen Fenster sind nicht alle sechs Beschriftungen gleichzeitig zu sehen. Die Reiterleiste lässt sich dann waagerecht verschieben, zeigt dabei aber keinen Rollbalken. Auch die Inhaltsfläche unterhalb der Leiste ist scrollbar – die unteren Karten und Diagramme eines Reiters werden erst nach dem Scrollen sichtbar.

Hinweis: Der gewählte Reiter wird nicht gespeichert. Verlassen Sie das Dashboard und kehren später zurück, ist wieder „Übersicht“ aktiv.

Hinweis: Liegen für ein Diagramm keine Werte vor, steht an seiner Stelle „Keine Daten verfügbar“. Das ist kein Fehler: In einem Projekt, in dem eine Angabe durchgängig fehlt – etwa die Netzebene der Rohre –, bleibt das zugehörige Diagramm leer, während die übrigen gefüllt sind.

### 4.2.1 Übersicht

Der Reiter „Übersicht“ enthält sechs Karten, die auf großen Bildschirmen in zwei Spalten angeordnet sind und bei schmalem Fenster untereinander stehen. Jede Karte nennt oben eine oder zwei große Kennzahlen und darunter die Aufschlüsselung als Liste. Der farbige Balken im Hintergrund einer Listenzeile zeigt deren Anteil am größten Wert der Liste.

![Screenshot Dashboard mit Hervorhebung der Karten im Reiter „Übersicht“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_overview.jpg)

#### Trassenstatistik

- Kennzahl: die Gesamtlänge aller Trassen, gefolgt von „km Gesamtlänge“.
- Je Listenzeile: die Verlegeart in fetter Schrift, darunter kleiner die Oberfläche.
- Rechts in der Zeile: die Länge dieser Kombination in Kilometern.

#### Netzknotenstatistik

- Kennzahl: die Anzahl aller Netzknoten mit angehängtem „x“ und der Beschriftung „Gesamtzahl“.
- Je Listenzeile: der Knotentyp und rechts die Anzahl, ebenfalls mit angehängtem „x“.

#### Rohrstatistiken

- Kennzahl: die Gesamtlänge aller Rohre, gefolgt von „km Leerrohr-Gesamtlänge“.
- Je Listenzeile: der Rohrtyp und rechts dessen Länge in Kilometern.

#### Adress-Statistiken

- Zwei Kennzahlen nebeneinander: „Adressen gesamt“ und „Wohneinheiten gesamt“, beide mit angehängtem „x“.
- Je Listenzeile: der Ort und rechts die Anzahl der Adressen. Adressen ohne Ortsangabe erscheinen unter „Unbekannt“.

#### Gebietsstatistiken

- Zwei Kennzahlen nebeneinander: „Anzahl Gebiete“ mit angehängtem „x“ und die Gesamtfläche in „km²“.
- Je Listenzeile: der Gebietstyp und rechts die Anzahl der Gebiete. Gebiete ohne Typ erscheinen unter „Unbekannt“.

#### Gewährleistung

Diese Karte zeigt bis zu fünf Netzknoten, deren Gewährleistungsfrist als nächste abläuft, aufsteigend nach Datum sortiert. Je Eintrag stehen links der Name des Netzknotens und darunter, sofern hinterlegt, sein Knotentyp, rechts die verbleibende Restlaufzeit – etwa „14 Tagen“, bei einem einzelnen Tag „1 Tag“ – und darunter das Ablaufdatum im Format TT.MM.JJJJ. Am Tag des Ablaufs steht anstelle der Restlaufzeit „Läuft ab am“ mit dem Datum.

Die Einträge sind nach Dringlichkeit farbig hinterlegt:

- rot: weniger als 30 Tage Restlaufzeit
- gelb: weniger als 90 Tage Restlaufzeit
- grün: 90 Tage Restlaufzeit oder mehr

Sind für das Projekt keine Fristen hinterlegt, erscheint stattdessen „Keine Garantien laufen bald ab“.

![Screenshot Dashboard mit Hervorhebung der Karte „Gewährleistung“ und ihren farbig hinterlegten Einträgen unten rechts in der Inhaltsfläche](/images/manual/teil-a/dashboard_warranty.jpg)

Wichtig: Die Karte ist keine vollständige Liste aller Gewährleistungsfristen des Projekts. Sie zeigt höchstens fünf Netzknoten, und bereits abgelaufene Fristen erscheinen nicht mehr. Die Angaben stammen aus dem Feld „Gewährleistung“ des jeweiligen Netzknotens; die Frist eines einzelnen Netzknotens finden Sie in der Karte in der Info-Box im Reiter „Eigenschaften“ (siehe Kapitel [Karte](./05-karte.md)).

Hinweis: Alle sechs Karten begrenzen die Höhe ihrer Liste. Sind mehr Zeilen vorhanden als angezeigt werden, scrollen Sie innerhalb der Karte nach unten. Nutzen Sie dazu das Scrollrad Ihrer Maus oder ein Touchpad, während der Zeiger über der Liste steht.

### 4.2.2 Trasse

Im Reiter „Trasse“ finden Sie acht waagerechte Balkendiagramme zu den Trassen des Projekts. Die x-Achse ist jeweils beschriftet, in der Regel mit „Länge (km)“:

- „Gesamtlänge pro Oberfläche“
- „Gesamtlänge pro Verlegeart“
- „Durchschnittliche Hausanschlusslänge“ – ein einzelner Balken, Achse in Metern („Länge (m)“)
- „Länge gefördert“ – ein einzelner Balken über die als gefördert gekennzeichneten Trassen
- „Länge Eigenleistung“ – ein einzelner Balken über die in Eigenleistung erbrachten Trassen
- „Gesamtlänge pro Status“
- „Gesamtlänge pro Netzebene“
- „Längsten Trassen im Netz“ – die fünf längsten Trassen, beschriftet mit Verlegeart und Oberfläche

![Screenshot Dashboard mit Hervorhebung der Diagramme im Reiter „Trasse“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_trench.jpg)
![Screenshot Ausschnittvergrößerung des Diagramms „Gesamtlänge pro Oberfläche“ mit dem Tooltip über einem Balken](/images/manual/teil-a/dashboard_trench_hover.jpg)
{.img-row}

Genaue Werte lesen Sie einzeln ab: Zeigen Sie mit der Maus auf einen Balken, erscheint ein Tooltip mit dem Wert und seiner Einheit. Die Achsenbeschriftung selbst nennt nur die Skala, nicht die einzelnen Werte.

![](/videos/dashboard_chart_hover.webm)

### 4.2.3 Rohre

Der Reiter „Rohre“ wertet die Rohre des Projekts aus. Ganz oben steht der Kasten „Top 5 längste Rohre“ mit bis zu fünf Feldern; jedes Feld nennt seinen Rang („#1“ bis „#5“), den Namen des Rohrs, dessen Typ und die Länge in Kilometern. Sind keine Rohre vorhanden, fehlt dieser Kasten vollständig.

Darunter folgen die Diagramme in dieser Reihenfolge:

- „Länge nach Rohrtyp“ – waagerechte Balken, Achse in Kilometern
- „Länge nach Status und Typ“ – gestapelte Balken; die Legende über dem Diagramm erklärt, welche Farbe zu welchem Rohrtyp gehört
- „Gesamtlänge pro Netzebene“ – Ringdiagramm mit Legende an der rechten Seite
- „Durchschnittliche Länge nach Typ“ – waagerechte Balken, Achse in Metern
- „Anzahl Rohre nach Status“ – waagerechte Balken, Achse „Anzahl“
- „Länge nach Eigentümer“ – waagerechte Balken, Achse in Kilometern
- „Länge nach Hersteller“ – Ringdiagramm mit Legende an der rechten Seite
- „Rohre im Zeitverlauf“ – Anzahl der Rohre je Monat; die Monate sind im Format „JJJJ-MM“ beschriftet

![Screenshot Dashboard mit Hervorhebung der Auswertungen im Reiter „Rohre“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_conduit.jpg)

Auch in den Ringdiagrammen erhalten Sie den genauen Wert, indem Sie mit der Maus auf ein Segment zeigen; der Tooltip nennt dort zusätzlich den Anteil in Prozent. Angelegt und bearbeitet werden Rohre im Bereich Rohrverwaltung, siehe Kapitel [Rohrverwaltung](./06-rohrverwaltung.md).

### 4.2.4 Netzknoten

Der Reiter „Netzknoten“ enthält sechs waagerechte Balkendiagramme; die Achse ist überall die Anzahl:

- „Netzknoten nach Ort“
- „Netzknoten nach Status“
- „Netzknoten nach Netzebene“
- „Netzknoten nach Typ“
- „Netzknoten nach Eigentümer“
- „Neueste Netzknoten“

![Screenshot Dashboard mit Hervorhebung der Diagramme im Reiter „Netzknoten“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_node.jpg)

Hinweis: „Neueste Netzknoten“ ist eine Aufzählung, keine Mengenauswertung. Das Diagramm listet die fünf zuletzt datierten Netzknoten mit Namen und Typ auf; alle Balken sind deshalb gleich lang. Netzknoten ohne Datum bleiben unberücksichtigt. Auch in den übrigen Diagrammen werden Netzknoten übergangen, bei denen die jeweilige Angabe fehlt – die Summe der Balken muss daher nicht der Gesamtzahl aus dem Reiter „Übersicht“ entsprechen.

### 4.2.5 Adressen

Der Reiter „Adressen“ wertet Adressen und Wohneinheiten aus und enthält vier Diagramme:

- „Adressen nach Ort“ – waagerechte Balken, Achse „Anzahl (x)“
- „Adressen nach Ausbaustatus“ – waagerechte Balken, Achse „Anzahl (x)“
- „Wohneinheiten nach Ort“ – waagerechte Balken, Achse „Anzahl (x)“
- „Wohneinheiten nach Typ“ – Ringdiagramm mit Legende an der rechten Seite

![Screenshot Dashboard mit Hervorhebung der Diagramme im Reiter „Adressen“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_address.jpg)

### 4.2.6 Gebiete

Der Reiter „Gebiete“ zeigt, wie viele Gebiete im Projekt hinterlegt sind und welcher Anteil des Bestands innerhalb dieser Gebiete liegt. Er ist in drei Blöcke gegliedert.

In der ersten Reihe stehen drei Karten:

- „Anzahl Gebiete“ – die Anzahl der Gebiete als große Zahl
- „Gesamtfläche“ – die Summe der Gebietsflächen in „km²“
- „Gebiete nach Typ“ – Ringdiagramm über die Gebietstypen

Darunter folgen drei Karten zur **Abdeckung**. Jede nennt den Wert innerhalb der Gebiete und, durch einen Schrägstrich getrennt, den Gesamtwert des Projekts; darunter steht der Anteil in Prozent:

- „Adress-Abdeckung“
- „Netzknoten-Abdeckung“
- „Wohneinheiten-Abdeckung“

Den unteren Block bilden sechs waagerechte Balkendiagramme:

- „Adressen pro Gebiet“
- „Adressen nach Gebietstyp“
- „Netzknoten pro Gebiet“
- „Netzknoten nach Gebietstyp“
- „Trassenlänge pro Gebiet“ – Achse in Kilometern
- „Wohneinheiten nach Gebietstyp“

![Screenshot Dashboard mit Hervorhebung der Karten und Diagramme im Reiter „Gebiete“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_area.jpg)

Wichtig: Die drei Diagramme „Adressen pro Gebiet“, „Netzknoten pro Gebiet“ und „Trassenlänge pro Gebiet“ zeigen höchstens die zehn Gebiete mit den höchsten Werten. Bei mehr als zehn Gebieten ist die Auswertung also keine vollständige Liste. Der Prozentwert in den drei Karten zur Abdeckung ist auf ganze Zahlen gerundet.
