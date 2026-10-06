# 9. Wertermittlung

Die **Wertermittlung** rechnet aus, was ein Netz gekostet hat oder heute kosten würde: Sie zählt die Mengen im gewählten Gebiet – Trassenlänge und Netzknoten je Art – und multipliziert sie mit den Kostensätzen, die für das Projekt hinterlegt sind. Das Ergebnis ist eine Aufstellung nach Kostenbereichen, die Gesamtinvestition, zwei Kennzahlen und eine Fortschreibung über die kommenden Jahre. Sie erreichen sie über die linke Navigationsleiste in der Gruppe „Funktionen“ durch Klicken auf den Menüpunkt „Wertermittlung“.

![Screenshot Wertermittlung mit der Karte links und dem Bedienfeld rechts](/images/manual/teil-a/valuation.jpg)

Links liegt die Karte, rechts das Bedienfeld mit der Gebietsauswahl, den Eingaben für die Fortschreibung und dem Button „Berechnen“. Das Ergebnis erscheint unter dem Button im selben Feld. Gerechnet wird ausschließlich; am Datenbestand ändert die Wertermittlung nichts, und das Ergebnis wird nicht gespeichert.

Die Karte verhält sich wie in Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster) beschrieben, mit einer Ausnahme: Ein Klick wählt hier kein Objekt aus und öffnet keine Info-Box, sondern schaltet ein Gebiet in der Auswahl an oder ab, siehe Abschnitt [Gebiet oder Gesamtprojekt wählen](#_9-1-gebiet-oder-gesamtprojekt-wahlen).

## 9.1 Gebiet oder Gesamtprojekt wählen

Der Bereich „Gebiet auswählen“ oben im Bedienfeld bestimmt, worüber gerechnet wird. Beim Öffnen der Ansicht ist „Gesamt (ganzes Projekt)“ angehakt.

Darunter stehen die Gebiete des Projekts, gruppiert nach Gebietstyp; hinter jedem Gruppennamen steht die Anzahl, und ein Klick darauf klappt die Gruppe zu und wieder auf. Gebiete ohne Typ sammelt die Gruppe „Sonstige“. Was ein Gebiet ist, erklärt Abschnitt [Gebiet und Gebietstyp](./02-grundbegriffe-und-datenmodell.md#_2-5-gebiet-und-gebietstyp).

Sie wählen entweder das Gesamtprojekt oder einzelne Gebiete:

- Ein Häkchen an einem Gebiet nimmt das Häkchen bei „Gesamt (ganzes Projekt)“ weg.
- Ein Häkchen bei „Gesamt (ganzes Projekt)“ hebt die Gebietsauswahl auf.
- Mehrere Gebiete lassen sich gleichzeitig anhaken; gerechnet wird dann über deren Gesamtfläche.

Die gewählten Gebiete umrandet die Karte orange. Umgekehrt geht es genauso: Ein Klick auf ein Gebiet in der Karte setzt oder entfernt dessen Häkchen in der Liste.

![Screenshot Wertermittlung mit Hervorhebung der Gebietsauswahl im Bedienfeld und des orange umrandeten Gebiets in der Karte](/images/manual/teil-a/valuation_area.jpg)

![](/videos/valuation_area_select.webm)

Ist weder „Gesamt“ noch ein Gebiet gewählt, bleibt „Berechnen“ ausgeschaltet und darunter steht der Hinweis „Wähle ein Ausbaugebiet oder „Gesamt“, um die Wertermittlung zu starten.“

::: info
Sind für das Projekt keine Gebiete hinterlegt, steht anstelle der Liste „Keine Ausbaugebiete für dieses Projekt vorhanden.“ Über „Gesamt (ganzes Projekt)“ können Sie dann trotzdem rechnen.
:::

::: warning
Neben der Projektauswahl in der Kopfzeile liegt in dieser Ansicht die Schaltfläche „Alle Projekte anzeigen“, siehe Abschnitt [Projekt auswählen und wechseln](./01-erste-schritte.md#_1-3-projekt-auswahlen-und-wechseln). Eingeschaltet listet die Gebietsauswahl die Gebiete **aller** Projekte auf – gerechnet wird aber weiterhin nur über das Projekt aus der Kopfzeile. Haken Sie ein Gebiet eines anderen Projekts an, wird es stillschweigend übergangen und Sie erhalten das Ergebnis für das ganze aktuelle Projekt, als hätten Sie „Gesamt“ gewählt. Lassen Sie die Schaltfläche für die Wertermittlung deshalb ausgeschaltet.
:::

::: info
Beim Umschalten dieser Schaltfläche wird die Auswahl auf „Gesamt“ zurückgesetzt und ein vorhandenes Ergebnis verworfen.
:::

::: danger
Ein Projektwechsel räumt dagegen nichts auf: Das Ergebnis des vorherigen Projekts bleibt im Bedienfeld stehen, und die Häkchen bleiben auf Gebieten, die es im neuen Projekt nicht gibt. Die Ansicht zeigt dann eine Aufstellung, die nicht zum Projekt in der Kopfzeile gehört – ohne jeden Hinweis darauf, und selbst dann, wenn für das neue Projekt gar keine Kostensätze hinterlegt sind. Rechnen Sie nach einem Projektwechsel neu, bevor Sie das Ergebnis lesen oder weitergeben.
:::

## 9.2 Jahr des Bauabschlusses und jährlicher Korrekturwert

Der Bereich „Zukunftsabhängige Wertermittlung“ enthält die beiden Eingaben für die Fortschreibung:

- **„Jahr Bauabschluss“** – das Startjahr der Fortschreibung, vorbelegt mit dem laufenden Jahr.
- **„Jährlicher Korrekturwert (%)“** – die jährliche Veränderung in Prozent, vorbelegt mit 2,5. Darunter steht der Hinweis „Positiver Wert = Wiederherstellungswert, negativer Wert = Wertverfall.“, also: ein positiver Wert schreibt fort, was die Wiederherstellung des Netzes künftig kostet, ein negativer rechnet den Wertverlust.

![Screenshot Wertermittlung mit Hervorhebung der Felder „Jahr Bauabschluss“ und „Jährlicher Korrekturwert (%)“](/images/manual/teil-a/valuation_year.jpg)

Beide Eingaben wirken ausschließlich auf die Tabelle in Abschnitt [Zukunftsabhängige Wertermittlung](#_9-6-zukunftsabhangige-wertermittlung). Die Gesamtinvestition und die beiden Kennzahlen bleiben davon unberührt.

::: info
Nach einer Änderung müssen Sie **nicht** erneut auf „Berechnen“ klicken: Solange ein Ergebnis angezeigt wird, rechnet Qonnectra die Fortschreibung bei jeder Eingabe sofort neu.
:::

::: warning
Die beiden leeren Felder verhalten sich unterschiedlich. Ohne „Jahr Bauabschluss“ verschwindet die Tabelle der Fortschreibung ganz. Ohne „Jährlicher Korrekturwert (%)“ bleibt sie stehen und rechnet mit 0 %: Alle Jahre stehen dann auf demselben Netzwert und die Spalte „Steigerung“ auf 0,00 €. Das ist keine Aussage über die Wertentwicklung, sondern nur ein fehlender Wert – lassen Sie das Feld nicht leer, wenn Sie die Tabelle weitergeben.
:::

## 9.3 Woher die Kostensätze kommen

Die Kostensätze sind je Projekt hinterlegt und werden im Administrationsbereich gepflegt, siehe Kapitel [Projektbezogene Konfiguration](../teil-b-betrieb-admin-qgis/22-projektbezogene-konfiguration.md). In der Wertermittlung selbst lassen sie sich nicht ändern; die Ansicht liest sie nur.

Jeder Kostensatz besteht aus einem Namen – dem **Kostenbereich** –, einem Betrag und einer Einheit. Die Einheit entscheidet, welche Menge Qonnectra dazu zählt:

- **„pro Meter“** – die Länge der Trassen im gewählten Gebiet.
- **„Stück“** – die Anzahl der Netzknoten im gewählten Gebiet, und zwar nur derjenigen Netzknotentypen, die dem Kostensatz zugeordnet sind. Ein Kostensatz kann mehrere Typen zusammenfassen.

Zusätzlich ist an den Kostensätzen vermerkt, welche davon einen Hausanschluss darstellen. Daraus entsteht die Kennzahl „Kosten pro Hausanschluss“, siehe Abschnitt [Kennzahlen](#_9-5-kennzahlen-kosten-pro-meter-und-pro-hausanschluss).

::: warning
Sind für das Projekt keine Kostensätze hinterlegt, bleibt „Berechnen“ ausgeschaltet und darüber steht „Keine Kostensätze konfiguriert. Bitte im Adminbereich anlegen.“ Die Wertermittlung setzt damit – wie die Rohrverzweigung, siehe Kapitel [Rohrverzweigung](./12-rohrverzweigung.md) – eine Vorarbeit der Administration voraus und ist ohne sie nicht benutzbar.
:::

::: warning
Ein Kostensatz mit der Einheit „Stück“, dem kein Netzknotentyp zugeordnet ist, kommt immer auf die Menge 0 und damit auf 0,00 €. Er steht dann mit Nullen in der Tabelle, ohne dass ein Fehler gemeldet wird. Erscheint ein Kostenbereich unerwartet mit 0, prüfen Sie zuerst seine Zuordnung der Netzknotentypen.
:::

## 9.4 Ergebnis lesen: Kostenbereich, Menge, Einheitspreis, Gesamtinvestition

„Berechnen“ ermittelt die Mengen und stellt das Ergebnis unter dem Button dar. Die Tabelle hat vier Spalten:

- **„Kostenbereich“** – der Name des Kostensatzes.
- **„Kosten (EP)“** – der Einheitspreis, dahinter die Einheit („/ Stück“ oder „/ pro Meter“).
- **„Menge“** – die gezählte Menge: Stückzahl oder Länge in Metern.
- **„Gesamt (GP)“** – Einheitspreis mal Menge.

Die Fußzeile der Tabelle nennt als **„Gesamtinvestition“** die Summe aller Zeilen.

![Screenshot Wertermittlung mit dem Ergebnis: Tabelle der Kostenbereiche, Gesamtinvestition und den beiden Kennzahlen](/images/manual/teil-a/valuation_result.jpg)

::: info
Bei einem gewählten Gebiet wird die Trassenlänge an der Gebietsgrenze abgeschnitten: Eine Trasse, die halb im Gebiet liegt, geht auch nur mit ihrer halben Länge ein. Netzknoten dagegen werden ganz gezählt oder gar nicht, je nachdem, ob sie im Gebiet liegen.
:::

::: warning
Gezählt wird der Bestand, wie er in Qonnectra erfasst ist. Fehlende Trassenlängen, nicht erfasste Netzknoten oder ein falscher Netzknotentyp verändern das Ergebnis unmittelbar, ohne dass die Ansicht darauf hinweist. Eine Wertermittlung ist deshalb nur so gut wie die Datenpflege des Projekts.
:::

::: warning
Ein neuer Klick auf „Berechnen“ ersetzt das angezeigte Ergebnis. Ein Vergleich zweier Gebiete nebeneinander ist in der Ansicht nicht möglich – notieren Sie das erste Ergebnis, bevor Sie das zweite rechnen.
:::

## 9.5 Kennzahlen: Kosten pro Meter und pro Hausanschluss

Unter der Tabelle stehen zwei Kennzahlen:

- **„Kosten pro Hausanschluss“** – die Gesamtinvestition geteilt durch die Anzahl der Netzknoten aus den Kostensätzen, die als Hausanschluss gekennzeichnet sind.
- **„Gesamtkosten pro Meter“** – die Gesamtinvestition geteilt durch die Trassenlänge.

![Screenshot Wertermittlung mit Hervorhebung der beiden Kennzahlen „Kosten pro Hausanschluss“ und „Gesamtkosten pro Meter“](/images/manual/teil-a/valuation_kpi.jpg)

::: warning
Beide Kennzahlen teilen die **gesamte** Investition und nicht den Anteil des jeweiligen Kostenbereichs. „Kosten pro Hausanschluss“ ist also nicht der Preis eines Hausanschlusses, sondern der Anteil des gesamten Netzes, der auf einen Hausanschluss entfällt – Tiefbau, Verteiler und POP eingerechnet. Entsprechend ist „Gesamtkosten pro Meter“ höher als der Einheitspreis des Tiefbaus.
:::

::: info
Gibt es im gewählten Gebiet keinen Hausanschluss oder keine Trasse, steht anstelle der Kennzahl ein Gedankenstrich.
:::

## 9.6 Zukunftsabhängige Wertermittlung

Ganz unten im Bedienfeld steht die Fortschreibung unter der Überschrift „Zukunftsabhängige Wertermittlung“ mit den Spalten „Jahr“, „Netzwert“ und „Steigerung“. Sie beginnt beim Jahr aus „Jahr Bauabschluss“ und umfasst 22 Jahre. Der Netzwert des ersten Jahres ist die Gesamtinvestition; jedes weitere Jahr wird mit dem Korrekturwert aus Abschnitt [Jahr des Bauabschlusses und jährlicher Korrekturwert](#_9-2-jahr-des-bauabschlusses-und-jahrlicher-korrekturwert) fortgeschrieben. „Steigerung“ ist die Veränderung gegenüber dem Vorjahr und bleibt im ersten Jahr leer.

![Screenshot Wertermittlung mit Hervorhebung der Tabelle „Zukunftsabhängige Wertermittlung“](/images/manual/teil-a/valuation_projection.jpg)

Der Korrekturwert wirkt auf den jeweils erreichten Wert und nicht auf den Ausgangswert; die Steigerung wächst deshalb von Jahr zu Jahr, auch wenn der Prozentsatz gleich bleibt. Bei einem negativen Korrekturwert fällt der Netzwert entsprechend, und in der Spalte „Steigerung“ stehen negative Beträge.

::: warning
Die Fortschreibung ist eine reine Zinsrechnung mit einem einzigen Prozentsatz. Sie kennt weder unterschiedliche Entwicklungen je Kostenbereich noch die Nutzungsdauer der Bauteile und ist damit eine Überschlagsrechnung, keine Bewertung nach handels- oder steuerrechtlichen Vorgaben.
:::

::: info
Das Bedienfeld ist ein eigener Scrollbereich. Ist die Fortschreibung nicht zu sehen, scrollen Sie darin nach unten – die Karte links bleibt dabei stehen.
:::
