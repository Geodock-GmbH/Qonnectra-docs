# 6. Störungsanalyse

Die **Störungsanalyse** beantwortet die Frage, was ausfällt, wenn an einer bestimmten Stelle des Netzes ein Schaden entsteht – etwa wenn bei Bauarbeiten ein Bagger eine Trasse aufreißt. Sie erreichen sie über die linke Navigationsleiste in der Gruppe „Funktionen“ durch Klicken auf den Menüpunkt „Störungsanalyse“.

![Screenshot Störungsanalyse mit der Karte und dem Hinweis zum Setzen eines Schadenspunkts am unteren Rand](/images/manual/teil-a/fault.jpg)

Die Simulation rechnet den Schaden nur durch. Sie ändert nichts am Datenbestand: Weder werden Kabel als gestört markiert noch Fasern abgeschaltet, und das Ergebnis wird nirgends gespeichert.

Die Karte verhält sich wie in Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster) beschrieben.

## 6.1 Schadenspunkt in der Karte setzen

Solange kein Schadenspunkt gesetzt ist, steht am unteren Rand der Karte der Hinweis „Klicken Sie auf einen Graben in der Karte, um einen Schadenspunkt zu setzen“. Gemeint ist damit ein Trassensegment, also ein Objekt des Layers „Trasse“.

Klicken Sie auf die Trasse, an der der Schaden liegt. Sie müssen die Linie nicht genau treffen – ein Klick in ihre Nähe genügt, Qonnectra setzt den Punkt auf die nächstgelegene Stelle der Linie. Anklickbar sind ausschließlich Trassensegmente; Adressen, Netzknoten und Gebiete zeichnet die Karte zwar mit, ein Klick auf sie bleibt hier aber wirkungslos.

Über dem gesetzten Punkt erscheint ein kleines Fenster mit der Trassen-ID, der Bauart und dem Button „Simulation starten“.

![Screenshot Störungsanalyse mit Hervorhebung des gesetzten Schadenspunkts und des Fensters „Simulation starten“ in der Kartenmitte](/images/manual/teil-a/fault_damage_point.jpg)

Ein Klick auf eine andere Trasse verschiebt den Schadenspunkt dorthin, solange die Simulation noch nicht gelaufen ist.

![](/videos/fault_simulation.webm)

::: info
An einer Verzweigung kann die Trasse, mit der die Simulation rechnet, von der im Fenster genannten abweichen: Das Fenster nennt die angeklickte Trasse, die Auswertung sucht anschließend erneut die Trasse, die dem gesetzten Punkt am nächsten liegt. Laufen dort zwei Trassen zusammen, ist das nicht zwingend dieselbe. Welche es war, steht in der Kopfzeile des Ergebnisses. Setzen Sie den Punkt deshalb in der Mitte einer Trasse und nicht an ihrem Ende.
:::

::: warning
Sobald ein Ergebnis angezeigt wird, nimmt die Karte keine Klicks mehr an. Um einen anderen Schadenspunkt zu untersuchen, verwerfen Sie das Ergebnis zuerst über „Zurücksetzen“, siehe Abschnitt [Ergebnis als CSV exportieren](#_6-4-ergebnis-als-csv-exportieren).
:::

## 6.2 Betroffene Leerrohre, Kabel und Fasern

Mit „Simulation starten“ teilt sich die Ansicht: Oben bleibt die Karte, unten erscheint das Ergebnis. In dessen Kopfzeile stehen die Trassen-ID und die Bauart der getroffenen Trasse, daneben die Buttons „CSV exportieren“ und „Zurücksetzen“.

::: info
Die Auswertung verfolgt jede einzelne Faser jedes betroffenen Kabels und braucht dafür je nach Umfang des Netzes einige Sekunden bis zu einer Minute. Solange dreht sich ein Ladezeichen im Button; warten Sie es ab, ein zweiter Klick beschleunigt nichts. Scheitert die Auswertung, erscheint am unteren Bildschirmrand die Meldung „Fehler bei der Simulation“ und die Ansicht bleibt unverändert.
:::

Darunter liegen zwei Listen, die beim Öffnen des Ergebnisses **zugeklappt** sind; ein Klick auf ihre Überschrift klappt sie auf und wieder zu. Hinter der Überschrift steht in Klammern die Anzahl der Einträge, die Sie also auch ohne Aufklappen ablesen können:

- „Betroffene Leerrohre“ – die Rohre, die der getroffenen Trasse zugeordnet sind, mit ihrem Rohrtyp.
- „Betroffene Kabel“ – die Kabel, die durch diese Rohre laufen, mit Kabeltyp sowie Start- und Endknoten. Führt die Trasse kein Kabel, steht dort „Keine Kabel in dieser Trasse“.

::: warning
Ist der Trasse kein Rohr zugeordnet, fehlt die Überschrift „Betroffene Leerrohre“ vollständig – anders als bei den Kabeln gibt es hier keine Meldung, die den Leerzustand benennt. Das Ergebnis beginnt dann unmittelbar mit den Kabeln oder ist ganz leer. Prüfen Sie in diesem Fall die Rohrzuordnung der Trasse, siehe Kapitel [Rohrzuordnung](./11-rohrzuordnung.md).
:::

Die untere Hälfte ist ein eigener Scrollbereich. Sind beide Listen aufgeklappt, liegt die Adressliste aus Abschnitt [Betroffene Adressen und Wohneinheiten](#_6-3-betroffene-adressen-und-wohneinheiten) unterhalb des sichtbaren Bereichs; scrollen Sie dann im Ergebnis nach unten.

Die Karte zeigt denselben Sachverhalt räumlich: den Schadenspunkt, die Trassen, in denen die betroffenen Kabel verlaufen, sowie die Netzknoten und Adressen, die dadurch ohne Signal wären.

![Screenshot Störungsanalyse mit dem Ergebnis: Karte in der oberen Hälfte, darunter die aufgeklappten Listen „Betroffene Leerrohre“ und „Betroffene Kabel“](/images/manual/teil-a/fault_result.jpg)
![Ausschnitt der Karte mit dem Schadenspunkt und den hervorgehobenen Trassen der betroffenen Kabel](/images/manual/teil-a/fault_result_detail.jpg)
{.img-row}

::: warning
Die Analyse rechnet mit der gesamten Trasse, nicht mit dem angeklickten Punkt. Betroffen ist alles, was der Trasse zugeordnet ist – jedes Rohr und jedes Kabel darin, unabhängig davon, an welcher Stelle Sie geklickt haben. Ein Schaden am Anfang und einer am Ende desselben Trassensegments liefern dasselbe Ergebnis.
:::

Die Fasern zählt Qonnectra ebenfalls mit: Jede Faser eines betroffenen Kabels gilt als durchtrennt. Auf dem Bildschirm erscheinen diese Zahlen nicht; Faserzahlen stehen ausschließlich in der CSV-Datei, siehe Abschnitt [Ergebnis als CSV exportieren](#_6-4-ergebnis-als-csv-exportieren).

## 6.3 Betroffene Adressen und Wohneinheiten

Unter den beiden Listen steht „Betroffene Adressen“, ebenfalls mit der Anzahl in Klammern. Anders als die beiden Listen darüber lässt sich diese Aufstellung nicht zuklappen. Sie ist eine Tabelle mit den Spalten „Adress-ID“, „Straße“, „Ort“ und „Wohneinheiten“; „Straße“ enthält die Hausnummer mit, „Ort“ die Postleitzahl, und „Wohneinheiten“ nennt deren Anzahl je Adresse.

Unter jeder Adresse sind ihre betroffenen Wohneinheiten eingerückt aufgeführt, je Wohneinheit die Wohneinheit-ID, Etage und Seite, der Typ und der Status. Fehlt einer Wohneinheit eine dieser Angaben, bleibt die Stelle leer. Adress-ID und Wohneinheit-ID sind verlinkt und führen in die zugehörige Adresse, siehe Kapitel [Adressen](./16-adressen.md).

![Screenshot Störungsanalyse mit Hervorhebung der Tabelle „Betroffene Adressen“ mit ihren eingerückten Wohneinheiten in der unteren Hälfte](/images/manual/teil-a/fault_addresses.jpg)

Woher diese Liste kommt, ist für die Praxis wichtig: Qonnectra verfolgt jede Faser der betroffenen Kabel über ihre Spleiße weiter – so, wie es der Faserweg tut, siehe Kapitel [Faserweg](./15-faserweg.md). Erst die Netzknoten, die auf diesem Weg erreicht werden, liefern die Adressen und Wohneinheiten.

::: warning
Sind die Fasern eines Kabels nirgends gespleißt, endet die Verfolgung beim Kabel selbst. Anstelle der Tabelle meldet die Störungsanalyse dann „Keine betroffenen Adressen“ – auch dann, wenn das Kabel an einem Hausanschluss endet. Die Meldung heißt also nicht zwingend „niemand ist betroffen“, sondern kann auch bedeuten, dass die Spleiße noch nicht dokumentiert sind.
:::

## 6.4 Ergebnis als CSV exportieren

„CSV exportieren“ lädt das Ergebnis als Datei `fault-simulation-<Trassen-ID>.csv` herunter; Trassen-IDs über 20 Zeichen werden im Dateinamen gekürzt. Die Datei enthält vier Abschnitte:

- die getroffene Trasse mit Trassen-ID und Bauart,
- die betroffenen Leerrohre mit Name und Rohrtyp,
- die betroffenen Kabel mit Name, Kabeltyp, „Fiber Count“, „Dark Fibers“ sowie Start- und Endknoten,
- die betroffenen Adressen, eine Zeile je Wohneinheit.

::: warning
„Fiber Count“ ist die Faseranzahl des Kabels, „Dark Fibers“ ist **nicht** deren gestörter Anteil. Die Spalte zählt jedes Fasersegment, das Qonnectra beim Verfolgen der Kabelfasern ohne Signal findet – also auch die Fasern der nachgelagerten Kabel jenseits der Spleiße. Der Wert kann dadurch größer sein als „Fiber Count“. Als Antwort auf „Wie viele Fasern dieses Kabels sind durchtrennt?“ ist er falsch gelesen: Durchtrennt sind immer alle.
:::

![Screenshot Störungsanalyse mit Hervorhebung der Buttons „CSV exportieren“ und „Zurücksetzen“ in der Kopfzeile des Ergebnisses](/images/manual/teil-a/fault_export.jpg)

::: info
Die Abschnitts- und Spaltenüberschriften der Datei sind englisch, unabhängig von der eingestellten Sprache. Zu den Exportformaten insgesamt siehe Abschnitt [Exportformate im Überblick](./03-wiederkehrende-bedienelemente.md#_3-8-exportformate-im-uberblick).
:::

„Zurücksetzen“ verwirft das Ergebnis. Die Karte nimmt danach wieder die volle Höhe ein und ist bereit für den nächsten Schadenspunkt.

## 6.5 Was die Simulation nicht abbildet

Die Störungsanalyse ist eine Auswertung des dokumentierten Netzes, keine Prognose. Sie sollten die Grenzen kennen, bevor Sie das Ergebnis weitergeben:

- **Die Trasse ist die kleinste Einheit.** Der Schadenspunkt dient der Auswahl der Trasse, nicht der Berechnung. Ein Schaden, der nur ein einzelnes Rohr im Graben trifft, lässt sich nicht abbilden, siehe Abschnitt [Betroffene Leerrohre, Kabel und Fasern](#_6-2-betroffene-leerrohre-kabel-und-fasern).
- **Es gibt keine Ersatzwege.** Jede Faser eines betroffenen Kabels gilt als durchtrennt. Ob ein Signal über eine andere Strecke geführt werden könnte, prüft Qonnectra nicht.
- **Das Ergebnis hängt an drei Zuordnungen.** Die Simulation liest nur, was dokumentiert ist, und sie liest es in dieser Kette: Rohre findet sie über die Rohrzuordnung der Trasse (siehe Kapitel [Rohrzuordnung](./11-rohrzuordnung.md)), Kabel über die Verknüpfung von Mikrorohr und Kabel (siehe Kapitel [Netzschema](./14-netzschema.md)), Adressen über die Spleiße (siehe Abschnitt [Betroffene Adressen und Wohneinheiten](#_6-3-betroffene-adressen-und-wohneinheiten)). Fehlt ein Glied, endet die Auswertung dort – ohne Hinweis darauf, dass sie es getan hat.
- **Immer nur ein Schadenspunkt.** Mehrere gleichzeitige Schäden lassen sich nicht zusammen untersuchen.
- **Kein Ergebnisspeicher.** Die Simulation wird nirgends abgelegt. Sobald Sie den Menüpunkt verlassen, ist sie verloren; halten Sie das Ergebnis über den CSV-Export fest.

Die Störungsanalyse sagt außerdem nichts über Dauer, Aufwand oder Kosten einer Reparatur aus.
