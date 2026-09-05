# 4. Dashboard

Das **Dashboard** ist die zentrale Übersichtsseite von Qonnectra. Es fasst den dokumentierten Netzbestand eines Projekts in Kennzahlen und Diagrammen zusammen, damit Sie den Ausbauzustand ohne Umweg über Listen oder die Karte erfassen können. Nach der Anmeldung ist das Dashboard die Startansicht; später erreichen Sie es über die linke Navigation durch Klicken auf den Menüpunkt „Dashboard“ in der Gruppe „Info“.

![Screenshot Dashboard](/images/manual/teil-a/dashboard.jpg)

Alle Auswertungen beziehen sich auf das Projekt, das oben links in der Kopfzeile ausgewählt ist, und sind ausschließlich zur Ansicht bestimmt: Werte lassen sich hier nicht bearbeiten, eine Exportfunktion gibt es nicht.

::: info
Die Kennzahlen werden auf dem Server bis zu fünf Minuten zwischengespeichert. Daten, die Sie gerade in einer anderen Ansicht erfasst haben, erscheinen deshalb unter Umständen erst mit einigen Minuten Verzögerung – ein Neuladen der Seite beschleunigt das nicht.
:::

## 4.1 Projekt auswählen

Bevor Kennzahlen sichtbar werden, muss ein Projekt ausgewählt sein. Die Projektauswahl oben links in der Kopfzeile ist eine Kombination aus Eingabefeld und Auswahlliste: Über den Pfeil am rechten Rand öffnen Sie die Liste aller für Sie freigegebenen Projekte, über eine Eingabe in das Feld schränken Sie die Liste auf passende Namen ein. Mit dem Klick auf einen Eintrag wechseln Sie das Projekt; alle Karten und Diagramme werden daraufhin neu geladen.

![Screenshot Dashboard mit Hervorhebung der Projektauswahl oben links in der Kopfzeile](/images/manual/teil-a/dashboard_project.jpg)
![Screenshot Ausschnittvergrößerung der geöffneten Projektliste in der Kopfzeile mit dem hervorgehobenen Eintrag „Testprojekt“](/images/manual/teil-a/dashboard_project_detail.jpg)
{.img-row}

::: warning
Die Eingabe im Feld allein wählt nichts aus – erst der Klick auf einen Eintrag der Liste wechselt das Projekt. Solange kein Projekt gewählt ist, bleiben alle Kennzahlen auf Null und die Diagramme zeigen „Keine Daten verfügbar“.
:::

::: info
Die Projektauswahl gilt für die gesamte Anwendung und bleibt beim Wechsel in eine andere Ansicht erhalten (siehe Kapitel [Einstieg und Anmeldung](./03-einstieg-und-anmeldung.md)). Sind für Ihr Benutzerkonto keine Projekte freigegeben, erscheint anstelle des Feldes der Hinweis „Keine Projekte verfügbar“.
:::

## 4.2 Reiter im Dashboard

Unterhalb der Kopfzeile stehen sechs Reiter (Tabs): „Übersicht“ mit den Kennzahlen aller Datenbereiche auf einen Blick sowie „Trasse“, „Rohre“, „Netzknoten“, „Adressen“ und „Gebiete“ mit den Auswertungen des jeweiligen Bereichs. Der aktive Reiter ist farbig hervorgehoben. Alle Auswertungen werden beim Öffnen des Dashboards gemeinsam geladen, der Wechsel zwischen den Reitern lädt also keine Daten nach.

![Screenshot Dashboard mit Hervorhebung der Reiterleiste oberhalb der Inhaltsfläche](/images/manual/teil-a/dashboard_tabs.jpg)

::: info
Bei einem schmalen Fenster sind nicht alle sechs Beschriftungen gleichzeitig zu sehen. Die Reiterleiste lässt sich dann waagerecht verschieben, zeigt dabei aber keinen Rollbalken. Auch die Inhaltsfläche darunter ist scrollbar – die unteren Karten und Diagramme werden erst nach dem Scrollen sichtbar.
:::

::: info
Liegen für ein Diagramm keine Werte vor, steht an seiner Stelle „Keine Daten verfügbar“. Das ist kein Fehler: Fehlt eine Angabe im Projekt durchgängig – etwa die Netzebene der Rohre –, bleibt das zugehörige Diagramm leer, während die übrigen gefüllt sind.
:::

### 4.2.1 Übersicht

Der Reiter „Übersicht“ enthält sechs Karten. Jede nennt oben eine oder zwei große Kennzahlen und darunter die Aufschlüsselung als Liste; der farbige Balken im Hintergrund einer Zeile zeigt deren Anteil am größten Wert der Liste.

- „Trassenstatistik“ – Gesamtlänge aller Trassen, aufgeschlüsselt nach Verlegeart und Oberfläche
- „Netzknotenstatistik“ – Anzahl aller Netzknoten, aufgeschlüsselt nach Knotentyp
- „Rohrstatistiken“ – Gesamtlänge aller Rohre, aufgeschlüsselt nach Rohrtyp
- „Adress-Statistiken“ – Adressen und Wohneinheiten gesamt, aufgeschlüsselt nach Ort
- „Gebietsstatistiken“ – Anzahl und Gesamtfläche der Gebiete, aufgeschlüsselt nach Gebietstyp
- „Gewährleistung“ – die als nächstes ablaufenden Gewährleistungsfristen

![Screenshot Dashboard mit Hervorhebung der Karten im Reiter „Übersicht“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_overview.jpg)

Adressen ohne Ortsangabe und Gebiete ohne Typ erscheinen in ihrer Liste unter „Unbekannt“.

::: info
Alle Karten begrenzen die Höhe ihrer Liste. Sind mehr Zeilen vorhanden als angezeigt werden, scrollen Sie innerhalb der Karte nach unten.
:::

#### Gewährleistung

Die Karte „Gewährleistung“ zeigt bis zu fünf Netzknoten, deren Gewährleistungsfrist als nächste abläuft, aufsteigend nach Datum sortiert. Je Eintrag stehen der Name des Netzknotens, die verbleibende Restlaufzeit und das Ablaufdatum. Die Einträge sind nach Dringlichkeit farbig hinterlegt:

- rot: weniger als 30 Tage Restlaufzeit
- gelb: weniger als 90 Tage Restlaufzeit
- grün: 90 Tage Restlaufzeit oder mehr

Sind für das Projekt keine Fristen hinterlegt, erscheint stattdessen „Keine Garantien laufen bald ab“.

![Screenshot Dashboard mit Hervorhebung der Karte „Gewährleistung“ und ihren farbig hinterlegten Einträgen unten rechts in der Inhaltsfläche](/images/manual/teil-a/dashboard_warranty.jpg)

::: warning
Die Karte ist keine vollständige Liste aller Gewährleistungsfristen des Projekts – sie zeigt höchstens fünf Netzknoten, bereits abgelaufene Fristen erscheinen nicht mehr. Die Frist eines einzelnen Netzknotens finden Sie in dessen Info-Box im Reiter „Eigenschaften“ (siehe Kapitel [Karte](./05-karte.md)).
:::

### 4.2.2 Trasse

Im Reiter „Trasse“ finden Sie acht waagerechte Balkendiagramme zu den Trassen des Projekts:

- „Gesamtlänge pro Oberfläche“
- „Gesamtlänge pro Verlegeart“
- „Durchschnittliche Hausanschlusslänge“
- „Länge gefördert“ – über die als gefördert gekennzeichneten Trassen
- „Länge Eigenleistung“ – über die in Eigenleistung erbrachten Trassen
- „Gesamtlänge pro Status“
- „Gesamtlänge pro Netzebene“
- „Längsten Trassen im Netz“ – die fünf längsten Trassen, beschriftet mit Verlegeart und Oberfläche

![Screenshot Dashboard mit Hervorhebung der Diagramme im Reiter „Trasse“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_trench.jpg)
![Screenshot Ausschnittvergrößerung des Diagramms „Gesamtlänge pro Oberfläche“ mit dem Tooltip über einem Balken](/images/manual/teil-a/dashboard_trench_hover.jpg)
{.img-row}

Genaue Werte lesen Sie einzeln ab: Zeigen Sie mit der Maus auf einen Balken, erscheint ein Tooltip mit dem Wert und seiner Einheit. Das gilt ebenso für die Segmente der Ringdiagramme in den übrigen Reitern; dort nennt der Tooltip zusätzlich den Anteil in Prozent.

### 4.2.3 Rohre

Der Reiter „Rohre“ beginnt mit dem Kasten „Top 5 längste Rohre“, der Rang, Name, Typ und Länge der fünf längsten Rohre nennt; sind keine Rohre vorhanden, fehlt der Kasten. Darunter folgen die Diagramme:

- „Länge nach Rohrtyp“
- „Länge nach Status und Typ“ – gestapelte Balken; die Legende über dem Diagramm erklärt, welche Farbe zu welchem Rohrtyp gehört
- „Gesamtlänge pro Netzebene“ – Ringdiagramm
- „Durchschnittliche Länge nach Typ“
- „Anzahl Rohre nach Status“
- „Länge nach Eigentümer“
- „Länge nach Hersteller“ – Ringdiagramm
- „Rohre im Zeitverlauf“ – Anzahl der Rohre je Monat

![Screenshot Dashboard mit Hervorhebung der Auswertungen im Reiter „Rohre“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_conduit.jpg)

Angelegt und bearbeitet werden Rohre im Bereich Rohrverwaltung, siehe Kapitel [Rohrverwaltung](./06-rohrverwaltung.md).

### 4.2.4 Netzknoten

Der Reiter „Netzknoten“ enthält sechs waagerechte Balkendiagramme: „Netzknoten nach Ort“, „Netzknoten nach Status“, „Netzknoten nach Netzebene“, „Netzknoten nach Typ“, „Netzknoten nach Eigentümer“ und „Neueste Netzknoten“.

![Screenshot Dashboard mit Hervorhebung der Diagramme im Reiter „Netzknoten“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_node.jpg)

::: info
„Neueste Netzknoten“ ist eine Aufzählung, keine Mengenauswertung. Das Diagramm listet die fünf zuletzt datierten Netzknoten mit Namen und Typ auf; alle Balken sind deshalb gleich lang. Netzknoten, bei denen die jeweilige Angabe fehlt, bleiben in allen Diagrammen unberücksichtigt – die Summe der Balken muss daher nicht der Gesamtzahl aus dem Reiter „Übersicht“ entsprechen.
:::

### 4.2.5 Adressen

Der Reiter „Adressen“ enthält vier Diagramme: „Adressen nach Ort“, „Adressen nach Ausbaustatus“ und „Wohneinheiten nach Ort“ als waagerechte Balken sowie „Wohneinheiten nach Typ“ als Ringdiagramm.

![Screenshot Dashboard mit Hervorhebung der Diagramme im Reiter „Adressen“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_address.jpg)

### 4.2.6 Gebiete

Der Reiter „Gebiete“ zeigt, wie viele Gebiete im Projekt hinterlegt sind und welcher Anteil des Bestands innerhalb dieser Gebiete liegt. In der ersten Reihe stehen die Karten „Anzahl Gebiete“, „Gesamtfläche“ und „Gebiete nach Typ“ als Ringdiagramm.

Darunter folgen drei Karten zur **Abdeckung** – „Adress-Abdeckung“, „Netzknoten-Abdeckung“ und „Wohneinheiten-Abdeckung“. Jede nennt den Wert innerhalb der Gebiete und, durch einen Schrägstrich getrennt, den Gesamtwert des Projekts; darunter steht der auf ganze Zahlen gerundete Anteil in Prozent.

Den unteren Block bilden sechs waagerechte Balkendiagramme: „Adressen pro Gebiet“, „Adressen nach Gebietstyp“, „Netzknoten pro Gebiet“, „Netzknoten nach Gebietstyp“, „Trassenlänge pro Gebiet“ und „Wohneinheiten nach Gebietstyp“.

![Screenshot Dashboard mit Hervorhebung der Karten und Diagramme im Reiter „Gebiete“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_area.jpg)

::: warning
Die Diagramme „Adressen pro Gebiet“, „Netzknoten pro Gebiet“ und „Trassenlänge pro Gebiet“ zeigen höchstens die zehn Gebiete mit den höchsten Werten. Bei mehr als zehn Gebieten ist die Auswertung also keine vollständige Liste.
:::
