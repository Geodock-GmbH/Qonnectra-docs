# 4. Dashboard

Das **Dashboard** ist die zentrale Übersichtsseite von Qonnectra. Es fasst den dokumentierten Netzbestand eines Projekts in Kennzahlen und Diagrammen zusammen, damit Sie den Ausbauzustand ohne Umweg über Listen oder die Karte erfassen können. Nach der Anmeldung ist das Dashboard die Startansicht; später erreichen Sie es über die linke Navigationsleiste durch Klicken auf den Menüpunkt „Dashboard“ in der Gruppe „Info“.

![Screenshot Dashboard](/images/manual/teil-a/dashboard.jpg)

Alle Auswertungen beziehen sich auf das Projekt, das oben links in der Kopfzeile ausgewählt ist (siehe Abschnitt [Projekt auswählen und wechseln](./01-erste-schritte.md#_1-3-projekt-auswahlen-und-wechseln)), und sind ausschließlich zur Ansicht bestimmt: Werte lassen sich hier nicht bearbeiten, eine Exportfunktion gibt es nicht.

Unterhalb der Kopfzeile stehen sechs Reiter (Tabs): „Übersicht“ mit den Kennzahlen aller Datenbereiche auf einen Blick sowie „Trasse“, „Rohre“, „Netzknoten“, „Adressen“ und „Gebiete“ mit den Auswertungen des jeweiligen Bereichs. Alle Auswertungen werden beim Öffnen des Dashboards gemeinsam geladen, der Wechsel zwischen den Reitern lädt also keine Daten nach.

![Screenshot Dashboard mit Hervorhebung der Reiterleiste oberhalb der Inhaltsfläche](/images/manual/teil-a/dashboard_tabs.jpg)

::: info
Bei einem schmalen Fenster sind nicht alle sechs Beschriftungen gleichzeitig zu sehen. Die Reiterleiste lässt sich dann waagerecht verschieben, zeigt dabei aber keinen Scrollbalken.
:::

::: info
Liegen für ein Diagramm keine Werte vor, steht an seiner Stelle „Keine Daten verfügbar“. Das ist kein Fehler: Fehlt eine Angabe im Projekt durchgängig – etwa die Netzebene der Rohre –, bleibt das zugehörige Diagramm leer, während die übrigen gefüllt sind.
:::

## 4.1 Reiter „Übersicht“

Der Reiter „Übersicht“ enthält sechs Karten. Jede nennt eine oder zwei Kennzahlen und darunter die Aufschlüsselung als Liste; der farbige Balken im Hintergrund einer Zeile zeigt deren Anteil am größten Wert der Liste.

- „Trassenstatistik“ – Gesamtlänge aller Trassen, aufgeschlüsselt nach Verlegeart und Oberfläche
- „Netzknotenstatistik“ – Anzahl aller Netzknoten, aufgeschlüsselt nach Knotentyp
- „Rohrstatistiken“ – Gesamtlänge aller Rohre, aufgeschlüsselt nach Rohrtyp
- „Adress-Statistiken“ – Adressen und Wohneinheiten gesamt, aufgeschlüsselt nach Ort
- „Gebietsstatistiken“ – Anzahl und Gesamtfläche der Gebiete, aufgeschlüsselt nach Gebietstyp
- „Gewährleistung“ – die als nächstes ablaufenden Gewährleistungsfristen, siehe Abschnitt [Gewährleistungsfristen im Blick behalten](#_4-7-gewahrleistungsfristen-im-blick-behalten)

![Screenshot Dashboard mit Hervorhebung der Karten im Reiter „Übersicht“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_overview.jpg)

Adressen ohne Ortsangabe und Gebiete ohne Typ erscheinen in ihrer Liste unter „Unbekannt“.

## 4.2 Reiter „Trasse“

Im Reiter „Trasse“ finden Sie acht Diagramme zu den Trassen des Projekts:

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

## 4.3 Reiter „Rohre“

Der Reiter „Rohre“ beginnt mit dem Kasten „Top 5 längste Rohre“, der Rang, Name, Typ und Länge der fünf längsten Rohre nennt; sind keine Rohre vorhanden, fehlt der Kasten. Darunter folgen die Diagramme:

- „Länge nach Rohrtyp“
- „Länge nach Status und Typ“ – gestapelte Balken je Status, aufgeschlüsselt nach Rohrtyp
- „Gesamtlänge pro Netzebene“ – Ringdiagramm
- „Durchschnittliche Länge nach Typ“
- „Anzahl Rohre nach Status“
- „Länge nach Eigentümer“
- „Länge nach Hersteller“ – Ringdiagramm
- „Rohre im Zeitverlauf“ – Anzahl der Rohre je Monat

![Screenshot Dashboard mit Hervorhebung der Auswertungen im Reiter „Rohre“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_conduit.jpg)

Angelegt und bearbeitet werden Rohre im Bereich Rohrverwaltung, siehe Kapitel [Rohrverwaltung](./10-rohrverwaltung.md).

## 4.4 Reiter „Netzknoten“

Der Reiter „Netzknoten“ enthält sechs Diagramme: „Netzknoten nach Ort“, „Netzknoten nach Status“, „Netzknoten nach Netzebene“, „Netzknoten nach Typ“, „Netzknoten nach Eigentümer“ und „Neueste Netzknoten“.

![Screenshot Dashboard mit Hervorhebung der Diagramme im Reiter „Netzknoten“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_node.jpg)

::: info
„Neueste Netzknoten“ ist eine Aufzählung, keine Mengenauswertung. Das Diagramm listet die fünf zuletzt datierten Netzknoten mit Namen und Typ auf; alle Balken sind deshalb gleich lang. Netzknoten, bei denen die jeweilige Angabe fehlt, bleiben in allen Diagrammen unberücksichtigt – die Summe der Balken muss daher nicht der Gesamtzahl aus dem Reiter „Übersicht“ entsprechen.
:::

## 4.5 Reiter „Adressen“

Der Reiter „Adressen“ enthält vier Diagramme: „Adressen nach Ort“, „Adressen nach Ausbaustatus“, „Wohneinheiten nach Ort“ und „Wohneinheiten nach Typ“ als Ringdiagramm.

![Screenshot Dashboard mit Hervorhebung der Diagramme im Reiter „Adressen“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_address.jpg)

## 4.6 Reiter „Gebiete“

Der Reiter „Gebiete“ zeigt, wie viele Gebiete im Projekt hinterlegt sind und welcher Anteil des Bestands innerhalb dieser Gebiete liegt. In der ersten Reihe stehen die Karten „Anzahl Gebiete“, „Gesamtfläche“ und „Gebiete nach Typ“ als Ringdiagramm.

Darunter folgen drei Karten zur **Abdeckung** – „Adress-Abdeckung“, „Netzknoten-Abdeckung“ und „Wohneinheiten-Abdeckung“. Jede nennt den Wert innerhalb der Gebiete, den Gesamtwert des Projekts und den auf ganze Zahlen gerundeten Anteil in Prozent.

Den unteren Block bilden sechs Diagramme: „Adressen pro Gebiet“, „Adressen nach Gebietstyp“, „Netzknoten pro Gebiet“, „Netzknoten nach Gebietstyp“, „Trassenlänge pro Gebiet“ und „Wohneinheiten nach Gebietstyp“.

![Screenshot Dashboard mit Hervorhebung der Karten und Diagramme im Reiter „Gebiete“ in der Inhaltsfläche](/images/manual/teil-a/dashboard_area.jpg)

::: warning
Die Diagramme „Adressen pro Gebiet“, „Netzknoten pro Gebiet“ und „Trassenlänge pro Gebiet“ zeigen höchstens die zehn Gebiete mit den höchsten Werten. Bei mehr als zehn Gebieten ist die Auswertung also keine vollständige Liste. Gebiete, in denen es keine Adressen, keine Netzknoten bzw. keine Trassen gibt, fehlen darin ganz.
:::

## 4.7 Gewährleistungsfristen im Blick behalten

Die Karte „Gewährleistung“ im Reiter „Übersicht“ zeigt bis zu fünf Netzknoten, deren Gewährleistungsfrist als nächste abläuft, aufsteigend nach Datum sortiert. Je Eintrag stehen der Name des Netzknotens, die verbleibende Restlaufzeit und das Ablaufdatum. Die Einträge sind nach Dringlichkeit farbig hinterlegt:

- rot: weniger als 30 Tage Restlaufzeit
- gelb: weniger als 90 Tage Restlaufzeit
- grün: 90 Tage Restlaufzeit oder mehr

Sind für das Projekt keine Fristen hinterlegt, erscheint stattdessen „Keine Garantien laufen bald ab“.

![Screenshot Dashboard mit Hervorhebung der Karte „Gewährleistung“ und ihren farbig hinterlegten Einträgen unten rechts in der Inhaltsfläche](/images/manual/teil-a/dashboard_warranty.jpg)

::: warning
Die Karte ist keine vollständige Liste aller Gewährleistungsfristen des Projekts – sie zeigt höchstens fünf Netzknoten, bereits abgelaufene Fristen erscheinen nicht mehr. Die Frist eines einzelnen Netzknotens finden Sie in dessen Info-Box im Reiter „Eigenschaften“ (siehe Kapitel [Karte](./05-karte.md)).
:::

## 4.8 Nach Kennzeichen filtern und wie aktuell die Werte sind

### 4.8.1 Nach Kennzeichen filtern

Das Kennzeichen ist das projektweite Ordnungsmerkmal von Qonnectra, das jede Trasse, jedes Rohr, jeden Netzknoten, jedes Kabel, jede Adresse und jedes Gebiet trägt, siehe Abschnitt [Kennzeichen als projektweiter Filter](./02-grundbegriffe-und-datenmodell.md#_2-6-kennzeichen-als-projektweiter-filter).

Das Dashboard gehört nicht dazu. Seine Kennzahlen, Diagramme und Karten beziehen sich immer auf den gesamten Bestand des ausgewählten Projekts; einen Filter nach Kennzeichen gibt es hier nicht.

::: info
Brauchen Sie die Auswertung eines einzelnen Kennzeichens, grenzen Sie in der jeweiligen Ansicht ein: in der Rohrzuordnung über die Auswahl „Kennzeichen“ (siehe Abschnitt [Nach Kennzeichen eingrenzen](./11-rohrzuordnung.md#_11-6-nach-kennzeichen-eingrenzen)), in der Rohrverwaltung und bei den Adressen über das Suchfeld unter der Spalte „Kennzeichen“ (siehe Abschnitt [Tabellen](./03-wiederkehrende-bedienelemente.md#_3-1-tabellen-suche-spaltenfilter-sortierung-seitenwechsel)).
:::

### 4.8.2 Wie aktuell die Werte sind

Das Dashboard liest seine Werte nicht bei jedem Aufruf neu aus der Datenbank.

::: info
Die Kennzahlen werden auf dem Server bis zu fünf Minuten zwischengespeichert. Daten, die Sie gerade in einer anderen Ansicht erfasst haben, erscheinen deshalb unter Umständen erst mit einigen Minuten Verzögerung – ein Neuladen der Seite beschleunigt das nicht.
:::
