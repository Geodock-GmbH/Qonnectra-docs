# 16. Adressen

Die **Adressen** führen die Gebäude des Projekts auf und verbinden sie mit dem Netz: Zu jeder Adresse gehören ihre Wohneinheiten, die Mikrorohre, die an ihr enden, und die Dateien, die Sie dort ablegen. Sie erreichen sie über die linke Navigationsleiste in der Gruppe „Gebäude“ durch Klicken auf den Menüpunkt „Adressen“.

![Screenshot der Adressliste mit der Tabelle aller Adressen des Projekts](/images/manual/teil-a/address.jpg)

Was eine Adresse und eine Wohneinheit im Datenmodell sind, beschreibt Abschnitt [Adresse und Wohneinheit](./02-grundbegriffe-und-datenmodell.md#_2-4-adresse-und-wohneinheit). Dieses Kapitel beschreibt die Ansicht.

## 16.1 Adressliste durchsuchen und filtern

Die Adressen stehen in einer Tabelle mit den Spalten „Adress-ID“, „Straße“, „Hausnummer“, „Zusatz“, „PLZ“, „Ort“, „Ortsteil“, „Ausbaustatus“ und „Kennzeichen“. Sortierung, Spaltenfilter und Seitenwechsel arbeiten wie überall, siehe Abschnitt [Tabellen](./03-wiederkehrende-bedienelemente.md#_3-1-tabellen-suche-spaltenfilter-sortierung-seitenwechsel). Ein Klick auf eine Zeile öffnet die Adresse auf einer eigenen Seite.

Das Suchfeld über der Tabelle durchsucht alle Adressen des Projekts. Es sucht nach Ähnlichkeit über Straße, Ort, PLZ und Ortsteil und zusätzlich nach enthaltenen Zeichenfolgen in Hausnummer und Adress-ID. Mehrere durch Leerzeichen getrennte Begriffe werden **und**-verknüpft: „Toft 15“ findet die Hausnummer 15 in der Straße Toft, nicht alle Toft-Adressen.

![Screenshot der Adressliste mit Hervorhebung des Suchfeldes und der einen verbleibenden Trefferzeile](/images/manual/teil-a/address_search.jpg)

::: info
Das Suchergebnis ist nach Ähnlichkeit sortiert, die ungefilterte Liste dagegen nach Straße und Hausnummer. Nach einer Suche stehen die Zeilen deshalb in einer anderen Reihenfolge als vorher.
:::

::: warning
Neue Adressen legen Sie in dieser Ansicht nicht an – eine Schaltfläche dafür gibt es nicht. Adressen kommen über einen Import oder aus QGIS in den Bestand, siehe Kapitel [Daten importieren und exportieren](../teil-b-betrieb-admin-qgis/24-daten-import-und-export.md) und [Netzdaten in QGIS bearbeiten](../teil-b-betrieb-admin-qgis/26-netzdaten-in-qgis-bearbeiten.md).
:::

## 16.2 Adressdetails: Standort, Klassifizierung, Ausbaustatus

Die Detailseite trägt oben die Adresse als Überschrift, darunter Postleitzahl und Ort. Links daneben führt „Zurück“ in die Liste, rechts stehen „Löschen“ und „Speichern“. Darunter liegen die Abschnitte „Adressinformationen“, „Klassifizierung“ und „Standort“; weiter unten folgen „Mikrorohrverbindungen“, „Anhänge“ und „Wohneinheiten“.

![Screenshot der Adressdetailansicht mit den Abschnitten „Adressinformationen“, „Klassifizierung“ und „Standort“](/images/manual/teil-a/address_detail.jpg)

**„Adressinformationen“** enthält die Bezeichnung des Gebäudes: „Adress-ID“ und „Adress-ID 2“, „Straße“, „Hausnummer“, „Zusatz“, „PLZ“, „Ort“ und „Ortsteil“. Die Adress-ID erzeugt Qonnectra selbst, siehe Abschnitt [Adress-ID neu generieren](#_16-4-adress-id-neu-generieren); „Adress-ID 2“ nimmt eine Kennung aus einem anderen System auf. Beide Felder fassen sieben Zeichen und werden beim Speichern in Großbuchstaben umgewandelt.

**„Klassifizierung“** enthält den „Ausbaustatus“, das „Kennzeichen“ und das „Projekt“. Ausbaustatus und Kennzeichen sind Kombinationsfelder mit den Werten aus den Stammdaten, siehe Abschnitt [Auswahllisten und Kombinationsfelder](./03-wiederkehrende-bedienelemente.md#_3-2-auswahllisten-und-kombinationsfelder). Das Projekt lässt sich hier nicht ändern; eine Adresse wechselt nicht das Projekt.

Ein Stern hinter der Feldbezeichnung kennzeichnet ein Pflichtfeld: „Straße“, „Hausnummer“, „PLZ“, „Ort“, „Kennzeichen“ und „Projekt“.

**„Standort“** zeigt die Adresse als Punkt in einer verkleinerten Karte, zusammen mit den Trassen, über die sie angebunden ist. Suche, Legende und Transparenzregler fehlen darin, siehe Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster). Darunter stehen die Koordinaten zweimal: zuerst in dem Koordinatensystem, in dem Qonnectra die Geometrien führt, dann in EPSG:4326. Hat die Adresse keine Geometrie, steht dort „Keine Standortdaten verfügbar“.

„Speichern“ überträgt alle geänderten Felder auf einmal und meldet „Adresse erfolgreich aktualisiert“.

::: danger
Die Anwendung fragt beim Verlassen der Seite nicht nach. Wechseln Sie mit „Zurück“, über die Navigationsleiste oder mit dem Zurück-Knopf des Browsers, gehen nicht gespeicherte Änderungen ohne Warnung verloren.
:::

::: warning
Ein Feld leeren und speichern löscht den Wert **nicht**. Qonnectra überträgt nur Felder, in denen etwas steht; das leer gemachte Feld behält in der Datenbank seinen alten Inhalt und steht nach dem nächsten Öffnen der Seite wieder da. Einzige Ausnahme ist „Adress-ID 2“, die sich auf diesem Weg tatsächlich entfernen lässt. Alle übrigen Werte kann nur Ihre Administration leeren.
:::

**Löschen**

„Löschen“ fragt nach und entfernt die Adresse anschließend mitsamt ihren Wohneinheiten. Hängt an der Adresse ein Netzknoten, ist der Button abgeschaltet; ein Zeigen mit der Maus nennt den Grund („Diese Adresse ist mit einem Netzknoten verknüpft und kann nicht gelöscht werden.“).

::: info
Die Verknüpfung zwischen Netzknoten und Adresse lässt sich in der Weboberfläche nicht lösen: In der Karte sind die Eigenschaften eines Netzknotens nur zu lesen. Eine so verknüpfte Adresse kann deshalb nur Ihre Administration entfernen, siehe Kapitel [Netzdaten in QGIS bearbeiten](../teil-b-betrieb-admin-qgis/26-netzdaten-in-qgis-bearbeiten.md).
:::

::: warning
Löschen ist in den mitgelieferten Rollen nur der Rolle „Admin“ erlaubt. Mit der Rolle „Editor“ ist der Button zwar da und die Rückfrage erscheint, die Meldung danach lautet aber „Sie sind nicht berechtigt, diese Aktion durchzuführen.“ und die Adresse bleibt bestehen, siehe Abschnitt [Fehlende Rechte erkennen](./18-wenn-etwas-nicht-funktioniert.md#_18-3-fehlende-rechte-erkennen).
:::

**„Mikrorohrverbindungen“**

Der Abschnitt listet die Mikrorohre auf, die an den Netzknoten dieser Adresse enden, mit den Spalten „Überg. Netzknoten“, „Netzknoten“, „Rohrname“, „Rohrtyp“, „Nummer“ und „Farbe“. Die Angaben sind nur zur Information; geändert werden sie in den Mikrorohren, siehe Kapitel [Mikrorohre](./13-mikrorohre.md). Ohne Verknüpfung steht dort „Keine Mikrorohre mit dieser Adresse verknüpft“.

**PDF zur Adresse**

„PDF herunterladen“ im Abschnitt „Standort“ erzeugt ein Datenblatt zu der Adresse und lädt es unter dem Namen `Straße_Hausnummer.pdf` herunter. Der kleine Pfeil rechts daneben öffnet die Option „mit Wohneinheiten“; ist sie angekreuzt, folgt dem Datenblatt eine Seite je Wohneinheit.

![Screenshot der Adressdetailansicht mit Hervorhebung der Schaltfläche „PDF herunterladen“ und der geöffneten Option „mit Wohneinheiten“](/images/manual/teil-a/address_pdf.jpg)

Inhalt und Aufbau des Dokuments sind dieselben wie in der Nachverdichtung, nur ohne den dortigen Kommentar; sie sind in Abschnitt [PDF erzeugen und Inhalt des Dokuments](./07-nachverdichtung.md#_7-4-pdf-erzeugen-und-inhalt-des-dokuments) beschrieben. Auch hier wird der Kartenausschnitt so übernommen, wie er gerade auf dem Bildschirm steht.

## 16.3 Wohneinheiten anlegen und bearbeiten

Der Abschnitt „Wohneinheiten“ am Fuß der Adressdetails führt die Nutzungseinheiten des Gebäudes auf, mit den Spalten „ID“, „Etage“, „Seite“, „Typ“, „Status“ und „Aktionen“. Die Zahl neben der Überschrift nennt die Anzahl; filtern Sie über die Suchfelder unter den Spaltenüberschriften, steht dort die Zahl der Treffer und dahinter die Gesamtzahl. Ab elf Wohneinheiten blättern Sie unter der Tabelle weiter.

![Screenshot der Adressdetailansicht mit Hervorhebung des Abschnitts „Wohneinheiten“ und der Schaltfläche „Hinzufügen“](/images/manual/teil-a/address_units.jpg)

**Anlegen**

„+ Hinzufügen“ öffnet das Fenster „Wohneinheit hinzufügen“ mit den Feldern „Wohneinheit-ID“, „Etage“, „Seite“, „Gebäudeteil“, „Externe Kennung 1“, „Externe Kennung 2“, „Typ“ und „Status“. Kein Feld ist Pflicht. Lassen Sie die „Wohneinheit-ID“ leer, vergibt Qonnectra sie beim Speichern selbst.

![Screenshot des Fensters „Wohneinheit hinzufügen“ mit ausgefüllten Feldern](/images/manual/teil-a/address_unit_modal.jpg)

::: warning
Das Fenster bleibt nach dem Speichern geöffnet, und Ihre Eingaben stehen weiter in den Feldern. Die Wohneinheit ist trotzdem angelegt – Qonnectra meldet „Wohneinheit erfolgreich erstellt“ und die Tabelle dahinter ist eine Zeile länger. Schließen Sie das Fenster mit „Schließen“; ein zweiter Klick auf „Speichern“ legt eine weitere Wohneinheit mit denselben Werten an.
:::

![](/videos/address_unit_add.webm)

**Bearbeiten**

Ein Klick auf eine Zeile öffnet die Wohneinheit auf einer eigenen Seite, aufgebaut wie die Adressdetails: oben „Zurück“, „Löschen“ und „Speichern“, darunter die Abschnitte „Wohneinheit-ID“, „Klassifizierung“, „Standort“, „Bewohner“, „Faserverbindungen“ und „Anhänge“.

![Screenshot der Wohneinheit mit den Abschnitten „Wohneinheit-ID“, „Klassifizierung“, „Standort“ und „Bewohner“](/images/manual/teil-a/address_unit.jpg)

- **„Wohneinheit-ID“** – die ID selbst und die beiden Felder „Externe Kennung 1“ und „Externe Kennung 2“ für Kennungen aus anderen Systemen. „ID neu generieren“ arbeitet wie bei der Adresse, siehe Abschnitt [Adress-ID neu generieren](#_16-4-adress-id-neu-generieren).
- **„Klassifizierung“** – „Typ“ und „Status“ aus den Stammdaten.
- **„Standort“** – „Etage“, „Seite“ und „Gebäudeteil“, also die Lage der Einheit im Gebäude.
- **„Bewohner“** – „Name des Bewohners“ sowie die beiden Datumsfelder „Erfassungsdatum Bewohner“ und „Betriebsbereit“.
- **„Faserverbindungen“** – die Fasern, die auf dieser Wohneinheit aufliegen, mit „Überg. Netzknoten“, „Netzknoten“, „Kabelname“, „Absolute Faser“, „Bündel“ und „Faser“. Nur zur Information: Gelegt werden sie im Netzschema, siehe Abschnitt [Spleiße und Ports](./14-netzschema.md#_14-8-spleiße-und-ports). Ohne Verbindung steht dort „Keine Faserverbindungen mit dieser Wohneinheit verknüpft“.

Auch hier gilt der Hinweis aus Abschnitt [Adressdetails](#_16-2-adressdetails-standort-klassifizierung-ausbaustatus): Ein Feld leeren und speichern entfernt den Wert nicht, und nicht gespeicherte Änderungen gehen beim Verlassen der Seite verloren.

**Löschen**

Eine Wohneinheit löschen Sie entweder auf ihrer eigenen Seite über „Löschen“ oder in der Tabelle über das Papierkorbsymbol in der Spalte „Aktionen“. Beide Wege fragen nach. Auch hier braucht es das Recht zum Löschen, sonst bleibt es bei der Meldung „Sie sind nicht berechtigt, diese Aktion durchzuführen.“

::: danger
Mit der Wohneinheit geht ihre Anbindung verloren. Die Spleiße im Netzschema bleiben zwar bestehen, verlieren aber ihr Ziel: Der Faserweg endet danach am Port, und die Störungsanalyse führt die Einheit nicht mehr unter den betroffenen auf, siehe Kapitel [Faserweg](./15-faserweg.md) und [Störungsanalyse](./06-stoerungsanalyse.md). Wiederherstellen lässt sich die Zuordnung nur, indem Sie die Wohneinheit neu anlegen und im Netzschema erneut auf einen Port legen.
:::

## 16.4 Adress-ID neu generieren

Die „Adress-ID“ ist eine siebenstellige Kennung, die Qonnectra beim Anlegen der Adresse selbst vergibt; innerhalb eines Projekts kommt jede nur einmal vor. Sie besteht aus Großbuchstaben und Ziffern, aus denen die leicht zu verwechselnden Zeichen I, O, 0, 1, 8 und 9 herausgenommen sind – eine abgelesene ID lässt sich dadurch zuverlässig wieder eintippen. Die „Wohneinheit-ID“ ist nach demselben Muster achtstellig aufgebaut.

Die Schaltfläche „ID neu generieren“ neben dem Feld ersetzt die Kennung durch eine neue, zufällig gebildete. Qonnectra fragt vorher nach und meldet anschließend „Adress-ID erfolgreich neu generiert.“ Die neue ID steht sofort in der Datenbank; ein Klick auf „Speichern“ ist dafür nicht nötig.

::: danger
Die alte Kennung ist danach verloren und lässt sich nicht wiederherstellen. Wurde sie in Bauunterlagen, Aufträgen oder einem anderen System verwendet, stimmen diese Angaben anschließend nicht mehr. Brauchen Sie eine bestimmte ID, tragen Sie sie von Hand in das Feld ein und speichern Sie – oder nutzen Sie „Adress-ID 2“ für die Kennung aus dem anderen System.
:::

::: info
Eine von Hand vergebene ID darf im Projekt noch nicht vorkommen. Andernfalls schlägt das Speichern fehl; die Meldung nennt als Grund, dass Projekt und Adress-ID zusammen eindeutig sein müssen. Die Adresse behält dann ihre bisherige ID.
:::

## 16.5 Anhänge an einer Adresse

Der Abschnitt „Anhänge“ auf der Adressdetailseite und auf der Seite einer Wohneinheit nimmt Dateien zu diesem Objekt auf – Fotos vom Hausanschluss, den unterschriebenen Grundstückseigentümervertrag, ein Aufmaß. Hochladen, Ansehen, Umbenennen und Löschen sind überall gleich und in Abschnitt [Anhänge hochladen, ansehen und löschen](./03-wiederkehrende-bedienelemente.md#_3-7-anhange-hochladen-ansehen-und-loschen) beschrieben.

Anders als in der Karte und in der Rohrverwaltung steht der Bereich hier nicht in der Info-Box, sondern als eigener Abschnitt auf der Seite. Adresse und Wohneinheit haben getrennte Ablagen: Eine Datei an der Adresse erscheint nicht an deren Wohneinheiten und umgekehrt.

::: warning
Dateinamen von Anhängen sind für alle sichtbar, die die Adresse öffnen dürfen. Namen wie `Vertrag_Mustermann.pdf` geben damit personenbezogene Angaben preis, auch ohne dass jemand die Datei öffnet.
:::
