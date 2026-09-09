# 7. Nachverdichtung

Die **Nachverdichtung** stellt zu einer einzelnen Adresse alle Angaben zusammen, die für einen nachträglichen Hausanschluss gebraucht werden, und gibt sie als PDF-Dokument aus – für die Montage vor Ort, für die Akte oder für die Weitergabe an ein ausführendes Unternehmen. Sie erreichen sie über die linke Navigationsleiste in der Gruppe „Funktionen“ durch Klicken auf den Menüpunkt „Nachverdichtung“.

![Screenshot Nachverdichtung mit dem Suchfeld für Adressen](/images/manual/teil-a/compaction.jpg)

Die Ansicht führt durch drei Schritte: Adresse suchen, Angaben prüfen, PDF erzeugen. Bearbeiten lässt sich hier nichts – mit einer Ausnahme, dem Ausbaustatus, siehe Abschnitt [Ausbaustatus ändern und Bemerkung erfassen](#_7-3-ausbaustatus-andern-und-bemerkung-erfassen).

## 7.1 Adresse suchen

Geben Sie im Feld „Adresse suchen...“ einen Suchbegriff ein. Ab zwei Zeichen sucht Qonnectra von selbst, kurz nachdem Sie zu tippen aufgehört haben; einen Button zum Auslösen gibt es nicht. Darunter erscheinen die Treffer mit Straße, Hausnummer, Postleitzahl und Ort, darunter jeweils die Adress-ID.

![Screenshot Nachverdichtung mit Hervorhebung des Suchfelds und der Trefferliste darunter](/images/manual/teil-a/compaction_search.jpg)

![](/videos/compaction_search.webm)

Gesucht wird nur innerhalb des Projekts, das oben links in der Kopfzeile ausgewählt ist, siehe Abschnitt [Projekt auswählen und wechseln](./01-erste-schritte.md#_1-3-projekt-auswahlen-und-wechseln). Durchsucht werden „Straße“, „Ort“, „PLZ“ und „Ortsteil“ sowie „Hausnummer“ und „Adress-ID“. Mehrere durch Leerzeichen getrennte Wörter müssen alle zutreffen: „Toft 1“ findet die Adressen der Straße Toft, deren Hausnummer eine 1 enthält – also auch die Nummern 10, 17 und 21.

::: info
Die Suche über „Straße“, „Ort“, „PLZ“ und „Ortsteil“ ist unscharf: Sie verzeiht Tippfehler und sortiert die Treffer nach Ähnlichkeit, nicht alphabetisch. Bei mehreren Wörtern richtet sich die Reihenfolge allein nach dem ersten. Angezeigt werden höchstens 20 Adressen. Grenzen Sie den Suchbegriff ein, wenn die gesuchte Adresse nicht dabei ist; „Keine Ergebnisse gefunden“ erscheint erst, wenn gar nichts passt.
:::

::: warning
Die Unschärfe holt auch ähnlich geschriebene Straßen herein: „Toft“ findet ebenso die Adressen der Straße „Oster Torf“. Prüfen Sie deshalb bei jedem Treffer den Straßennamen, bevor Sie ihn anklicken – die Trefferliste zeigt keinen Hinweis darauf, wie gut ein Eintrag gepasst hat.

Wörter mit weniger als drei Zeichen sucht Qonnectra dagegen buchstäblich, dafür zusätzlich in „Hausnummer“, „Hausnummernzusatz“ und „Adress-ID“. Eine „1“ kann deshalb auch über eine Adress-ID oder eine Postleitzahl treffen und nicht über die Hausnummer.
:::

## 7.2 Angaben zur Adresse und Kartenausschnitt

Mit dem Klick auf einen Treffer tritt an die Stelle des Suchfelds die gewählte Adresse. Darunter stehen „Adress-ID“, „Straße“, „Hausnummer“, „PLZ“, „Ort“ und „Ortsteil“, darunter ein Kartenausschnitt mit der Adresse und dem Weg der Kabel, die sie versorgen.

![Screenshot Nachverdichtung mit Hervorhebung der Adressangaben und des Kartenausschnitts](/images/manual/teil-a/compaction_address.jpg)

Der Ausschnitt ist beim Öffnen auf die Adresse zentriert, lässt sich aber wie jede andere Karte verschieben und zoomen. Legende, Suche und Transparenzregler fehlen ihm, siehe Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster); Strecke und Fläche messen können Sie dagegen auch hier, siehe Abschnitt [Strecke und Fläche messen](./03-wiederkehrende-bedienelemente.md#_3-5-strecke-und-flache-messen). Sind für das Projekt WMS-Dienste eingerichtet, werden deren Layer mitgezeichnet, siehe Kapitel [Projektbezogene Konfiguration](../teil-b-betrieb-admin-qgis/22-projektbezogene-konfiguration.md).

::: info
Die Linie im Ausschnitt ist der ermittelte **Kabelweg** zur Adresse und nicht die Trasse, auch wenn sie in der Trassenfarbe gezeichnet ist: Qonnectra verfolgt die Fasern der Adresse über ihre Spleiße zurück und zeichnet die Strecke, die die gefundenen Kabel nehmen, siehe Kapitel [Faserweg](./15-faserweg.md). Sie verläuft damit in den Trassen, deckt aber nur den Teil des Netzes ab, der die Adresse wirklich versorgt. Erst wenn sich kein Faserweg ermitteln lässt, zeichnet Qonnectra stattdessen die Trassen, deren Rohre über ein Mikrorohr an der Adresse hängen.
:::

Über das Kreuz rechts neben der Adresse kommen Sie zur Suche zurück. Ein Projektwechsel setzt die Auswahl ebenfalls zurück.

::: info
Hat die Adresse keine Koordinaten, steht an dieser Stelle „Keine Standortdaten verfügbar“. Das PDF enthält dann weder Karte noch Koordinaten; alles Übrige wird erzeugt.
:::

## 7.3 Ausbaustatus ändern und Bemerkung erfassen

Der Button „Start“ öffnet das Fenster „Nachverdichtung“. Es wiederholt „Adress-ID“, „Straße“, „PLZ“ und „Ort“ und enthält darunter zwei Felder.

**„Ausbaustatus“** ist mit dem Status vorbelegt, den die Adresse derzeit hat. Zur Auswahl stehen die Werte, die in den Stammdaten hinterlegt sind, siehe Abschnitt [Stammdaten](./02-grundbegriffe-und-datenmodell.md#_2-7-stammdaten-status-phase-netzebene-firmen).

**„Kommentar“** nimmt einen freien Text auf, etwa eine Absprache mit den Eigentümer\*Innen oder einen Hinweis für die Montage.

![Screenshot Nachverdichtung mit dem geöffneten Fenster „Nachverdichtung“ und den Feldern „Ausbaustatus“ und „Kommentar“](/images/manual/teil-a/compaction_export.jpg)

::: danger
Ein geänderter Ausbaustatus landet nicht nur im Dokument: Mit „Exportieren“ wird er an der Adresse gespeichert, gemeldet durch „Adresse erfolgreich aktualisiert“. Wenn Sie den Status nur für das Dokument ändern wollten, ist das nicht möglich – die Adresse ist danach geändert. „Abbrechen“ verwirft die Änderung.
:::

::: info
Der Kommentar wird umgekehrt **nicht** gespeichert. Er steht nur in dem einen Dokument; beim nächsten Öffnen des Fensters ist das Feld wieder leer. Was dauerhaft an der Adresse hängen soll, gehört in deren Angaben oder als Datei in die Anhänge, siehe Kapitel [Adressen](./16-adressen.md).
:::

## 7.4 PDF erzeugen und Inhalt des Dokuments

„Exportieren“ erzeugt das Dokument und lädt es unter dem Namen `Straße_Hausnummer.pdf` herunter. Das Fenster schließt sich, und Qonnectra meldet „PDF erfolgreich heruntergeladen“.

Die erste Seite trägt die Adresse als Überschrift und enthält:

- **„Adressinformationen“** – „Adress-ID“, „Straße“, „Hausnummer“, „PLZ“, „Ort“ und „Ortsteil“.
- **„Klassifizierung“** – „Ausbaustatus“, „Kennzeichen“ und „Projekt“.
- den **Kartenausschnitt** aus Abschnitt [Angaben zur Adresse und Kartenausschnitt](#_7-2-angaben-zur-adresse-und-kartenausschnitt), und zwar so, wie er beim Export auf dem Bildschirm steht – haben Sie ihn vorher verschoben oder gezoomt, steht dieser Ausschnitt im Dokument. Darunter folgen die Koordinaten der Adresse zweimal: in dem Koordinatensystem, in dem Qonnectra die Geometrien führt, und in EPSG:4326, also in geografischer Breite und Länge. Vor jedem Wert steht die EPSG-Kennung des jeweiligen Systems.
- **„Mikrorohrverbindungen“** – die Mikrorohre der Netzknoten, die an der Adresse hängen, mit den Spalten „Überg. Netzknoten“, „Netzknoten“, „Rohrname“, „Rohrtyp“, „Nummer“ und „Farbe“.
- **„Kommentar“**, sofern Sie einen erfasst haben.

::: warning
Für das Dokument wird der Kartenausschnitt so abfotografiert, wie er auf dem Bildschirm liegt – mit allem, was gerade darin gezeichnet ist. Eine Messung aus Abschnitt [Strecke und Fläche messen](./03-wiederkehrende-bedienelemente.md#_3-5-strecke-und-flache-messen), die Sie nicht über „Messung beenden“ aufgeräumt haben, steht deshalb mit im PDF. Räumen Sie sie vor dem Export weg.
:::

Danach folgt eine Seite je Wohneinheit der Adresse, in dieser Reihenfolge: „Wohneinheit-ID“ (ID und die beiden externen Kennungen), „Klassifizierung“ („Typ“ und „Status“), „Standort“ („Etage“, „Seite“, „Gebäudeteil“) und „Bewohner“ („Name des Bewohners“, „Erfassungsdatum Bewohner“, „Betriebsbereit“). Sind der Wohneinheit Fasern zugeordnet, steht darunter „Faserverbindungen“ mit den Spalten „Überg. Netzknoten“, „Netzknoten“, „Kabelname“, „Absolute Faser“, „Bündel“ und „Faser“.

::: info
Das Dokument wird im Browser erzeugt und nur heruntergeladen. Qonnectra legt keine Kopie ab – wer es später wiederfinden soll, braucht es als Anhang an der Adresse, siehe Abschnitt [Anhänge hochladen, ansehen und löschen](./03-wiederkehrende-bedienelemente.md#_3-7-anhange-hochladen-ansehen-und-loschen).
:::

::: warning
Schlägt die Erzeugung fehl, meldet Qonnectra „Fehler beim Erstellen der PDF“ und es wird nichts heruntergeladen. Ein bereits geänderter Ausbaustatus ist dann trotzdem gespeichert.
:::
