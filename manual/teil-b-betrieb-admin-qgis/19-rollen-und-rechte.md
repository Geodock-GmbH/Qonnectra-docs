# 19. Rollen und Rechte

Was ein Konto in Qonnectra sehen und ändern darf, legen Sie im Administrationsbereich fest. Dieses Kapitel beschreibt, aus welchen Teilen sich die Rechte eines Kontos zusammensetzen, wie Sie Konten und Gruppen anlegen und welche Rollen Qonnectra mitbringt. Wie Sie den Administrationsbereich erreichen und bedienen, beschreibt Kapitel [Der Administrationsbereich](./20-administrationsbereich.md).

![Screenshot der Benutzerliste im Administrationsbereich mit drei Konten in den Gruppen „Admin“, „Editor“ und „Viewer“](/images/manual/teil-b/permission_users.jpg)

Die Rechte eines Kontos ergeben sich aus drei voneinander unabhängigen Einstellungen:

- **Gruppenmitgliedschaft** – die Gruppe bestimmt, was das Konto in der Weboberfläche darf: welche Objektarten es ansehen, bearbeiten und löschen kann (**Modellrechte**, Abschnitt [Modellrechte](#_19-2-modellrechte-zugriff-je-datenmodell)) und welche Menüpunkte es öffnen darf (**Routenrechte**, Abschnitt [Routenrechte](#_19-3-routenrechte-zugriff-je-menupunkt)).
- **„Mitarbeiter-Status“** – erlaubt die Anmeldung im Administrationsbereich und, zusammen mit dem passenden Routenrecht, das Lesen der Systemprotokolle („Logs“) in der Weboberfläche.
- **„Administrator-Status“** – macht das Konto zum **Superuser**, der jede Prüfung umgeht, siehe Abschnitt [Superuser gegenüber Gruppenmitgliedschaft](#_19-4-superuser-gegenuber-gruppenmitgliedschaft).

::: info
Die Benutzerliste zeigt als Spalte nur den „Mitarbeiter-Status“, nicht den „Administrator-Status“. Welche Konten Superuser sind, sehen Sie über den Filter „Nach Administrator-Status“ rechts neben der Liste oder im Formular des Kontos.
:::

::: warning
Die Gruppe „Admin“ und der Administrationsbereich haben nichts miteinander zu tun, siehe Abschnitt [Superuser gegenüber Gruppenmitgliedschaft](#_19-4-superuser-gegenuber-gruppenmitgliedschaft).
:::

## 19.1 Benutzende und Gruppen anlegen

Konten pflegen Sie unter „Authentifizierung und Autorisierung“ → „Benutzer“. Eine Selbstregistrierung gibt es nicht, und die Weboberfläche kann weder Konten anlegen noch Passwörter zurücksetzen.

1. Klicken Sie in der Benutzerliste oben rechts auf „Benutzer hinzufügen“.
2. Geben Sie unter „Benutzername“ einen Namen und zweimal das Passwort ein und klicken Sie auf „Sichern und weiter bearbeiten“.
3. Tragen Sie im folgenden Formular unter „Persönliche Informationen“ Vor- und Nachnamen und die E-Mail-Adresse ein.
4. Wählen Sie unter „Berechtigungen“ im Feld „Gruppen“ die Gruppe aus, siehe Abschnitt [Typische Rollenprofile](#_19-5-typische-rollenprofile-betrachten-bearbeiten-verwalten).
5. Klicken Sie auf „Sichern“.

![Screenshot des Benutzerformulars im Administrationsbereich mit Hervorhebung der drei Status-Felder und der Gruppen unten im Abschnitt „Berechtigungen“](/images/manual/teil-b/permission_user_form.jpg)

::: warning
Ein Konto ohne Gruppe kann sich anmelden und sieht alle Menüpunkte, aber keine Daten: Ohne Gruppe hat es auf keine Objektart ein Recht, und jede Ansicht scheitert beim Laden. Wählen Sie die Gruppe deshalb gleich beim Anlegen.
:::

Gehört ein Konto mehreren Gruppen an, gilt je Objektart die höchste Stufe, die eine seiner Gruppen vergibt. Ein Konto in „Viewer“ und „Editor“ darf also bearbeiten.

Ein Konto, das nicht mehr arbeiten soll, deaktivieren Sie, statt es zu löschen: Entfernen Sie den Haken bei „Aktiv“. Die Anmeldung schlägt dann fehl, Einträge im Protokoll und im Änderungsverlauf behalten aber ihren Bezug zu dem Konto.

Das Passwort eines Kontos setzen Sie im Benutzerformular über den Link unter dem Feld „Passwort“ neu. Das alte Passwort lässt sich nicht einsehen; Qonnectra speichert nur einen daraus berechneten Wert.

::: info
Ein geändertes Passwort beendet laufende Sitzungen der Weboberfläche nicht sofort. Die Anmeldung dort hält bis zu sieben Tage und verlängert sich, solange das Konto aktiv bleibt. Wollen Sie ein Konto sofort sperren, deaktivieren Sie es.
:::

Gruppen pflegen Sie unter „Authentifizierung und Autorisierung“ → „Gruppen“. Eine neue Gruppe hat zunächst keine Rechte; sie erhält sie erst über die Modell- und Routenrechte der folgenden Abschnitte.

## 19.2 Modellrechte: Zugriff je Datenmodell

Die **Modellrechte** legen je Gruppe und Objektart fest, was ein Konto mit den Daten tun darf. Sie stehen unter „Api“ → „Modell-Zugriffsrechte“, eine Zeile je Gruppe und Objektart.

![Screenshot der Modell-Zugriffsrechte, gefiltert auf die Gruppe „Editor“, mit Hervorhebung der Filterleiste rechts und der Spalte „Zugriffsebene“](/images/manual/teil-b/permission_model_list.jpg)

Jede Zeile hat eine von vier Zugriffsebenen:

- „Kein Zugriff“ – die Objektart bleibt verborgen; jede Anfrage scheitert.
- „Nur Ansehen“ – lesen.
- „Ansehen und Bearbeiten“ – lesen, anlegen und ändern, aber nicht löschen.
- „Vollzugriff“ – zusätzlich löschen.

Die Spalte „Zugriffsebene“ lässt sich direkt in der Liste ändern, siehe Abschnitt [Suchen, Filtern und Massenbearbeitung](./20-administrationsbereich.md#_20-2-suchen-filtern-und-massenbearbeitung). Fehlt für eine Objektart die Zeile, gilt „Kein Zugriff“.

Die Objektarten stehen in der Spalte „Modellname“ mit ihrem technischen Namen. Wirksam sind diese Zeilen:

| Modellname | Bereich der Weboberfläche |
|---|---|
| `trench`, `conduit`, `microduct` | Trassen, Rohre und Mikrorohre |
| `trenchconduitconnection`, `trenchconduitcanvas` | Rohrzuordnung und Grabenprofil |
| `microductconnection` | Verbindungen der Mikrorohre in der Rohrverzweigung |
| `node`, `address`, `residentialunit`, `area` | Netzknoten, Adressen, Wohneinheiten, Gebiete |
| `cable`, `fiber`, `fibersplice`, `cablelabel` | Kabel, Fasern, Spleiße und Kabelbeschriftungen im Netzschema |
| `microductcableconnection` | Verknüpfung von Kabeln mit Mikrorohren, soweit sie einzeln bearbeitet wird |
| `nodeslotconfiguration`, `nodestructure`, `container` | Aufbau eines Netzknotens |
| `pipelinerecord`, `pipelineinquiryarea` | Auskünfte und Auskunftsbereiche der Leitungsauskunft |
| `featurefiles` | Anhänge |
| `wmslayer` | die einzelnen Layer externer Kartendienste; die Dienste selbst (`wmssource`) siehe Abschnitt [Rechte, die keine mitgelieferte Rolle enthält](#_19-6-rechte-die-keine-mitgelieferte-rolle-enthalt) |

Sieben weitere Zeilen bringt Qonnectra mit, sie wirken aber nicht: `projects`, `flags`, `containertype`, `typeofwork`, `requestreason`, `qgisproject` und `logentry`. Projekte, Kennzeichen, Container-Typen und die Auswahllisten der Leitungsauskunft sind wie alle übrigen Stammdaten – Status, Rohrtypen, Firmen – für jedes angemeldete Konto lesbar und lassen sich nur im Administrationsbereich ändern. Wer die Systemprotokolle lesen darf, regeln „Mitarbeiter-Status“ und Routenrecht, siehe Abschnitt [Superuser gegenüber Gruppenmitgliedschaft](#_19-4-superuser-gegenuber-gruppenmitgliedschaft).

::: warning
Eine geänderte Zugriffsebene greift nicht sofort. Qonnectra hält die Rechte eines Kontos bis zu fünf Minuten zwischengespeichert. Die Navigationsleiste zeigt die neuen Rechte zwar beim nächsten Seitenaufruf, eine Aktion kann in dieser Zeit aber noch mit dem alten Recht gelingen oder scheitern.
:::

## 19.3 Routenrechte: Zugriff je Menüpunkt

Die **Routenrechte** blenden Menüpunkte der Weboberfläche für eine Gruppe aus. Sie stehen unter „Api“ → „Seiten-Zugriffsrechte“. Jede Zeile nennt eine Gruppe, ein „Route-Muster“ und ob es „Erlaubt“ ist.

![Screenshot der Seiten-Zugriffsrechte mit den drei mitgelieferten Zeilen für das Muster „/admin/*“ in der Mitte](/images/manual/teil-b/permission_route_list.jpg)

Mitgeliefert ist für jede der drei Gruppen genau eine Zeile: Das Muster `/admin/*` ist für „Admin“ erlaubt und für „Editor“ und „Viewer“ gesperrt. Es betrifft in der Weboberfläche nur einen Menüpunkt, die „Logs“ am Fuß der Navigationsleiste. Alles, wofür keine Zeile existiert, ist erlaubt.

Das Muster ist entweder ein vollständiger Pfad oder ein Pfad mit `/*` am Ende, der alles darunter umfasst. Die Pfade der Menüpunkte:

| Menüpunkt | Pfad | Menüpunkt | Pfad |
|---|---|---|---|
| „Dashboard“ | `/dashboard` | „Verwaltung“ (Rohr) | `/conduit` |
| „Karte“ | `/map` | „Zuordnung“ (Rohr) | `/trench` |
| „Störungsanalyse“ | `/fault-simulation` | „Verzweigung“ (Rohr) | `/pipe-branch` |
| „Nachverdichtung“ | `/post-compaction` | „Mikrorohre“ | `/house-connections` |
| „Leitungsauskunft“ | `/pipeline-records` | „Netzschema“ | `/network-schema` |
| „Wertermittlung“ | `/valuation` | „Faserweg“ | `/trace` |
| „Adressen“ | `/address` | „Einstellungen“ | `/settings` |
| „Logs“ | `/admin/logs` | | |

::: warning
Um einen Menüpunkt zu sperren, brauchen Sie zwei Zeilen, etwa `/valuation` und `/valuation/*`. Die Ansichten hängen die Nummer des Projekts an den Pfad an (`/valuation/2`), und jedes Muster erfasst nur eine der beiden Formen. Mit `/valuation` allein verschwindet der Eintrag aus der Navigationsleiste, ein Lesezeichen auf die Ansicht öffnet sie aber weiterhin. Mit `/valuation/*` allein bleibt der Eintrag stehen und führt beim Klick ohne Meldung in die Karte, siehe Abschnitt [Fehlende Rechte erkennen](../teil-a-anwenderhandbuch/18-wenn-etwas-nicht-funktioniert.md#_18-3-fehlende-rechte-erkennen).
:::

::: warning
Routenrechte sind kein Schutz der Daten. Sie verbergen einen Menüpunkt, nicht die Daten dahinter: Dieselben Daten erscheinen in anderen Ansichten und sind über die Schnittstelle abrufbar. Was eine Gruppe nicht sehen darf, sperren Sie über die Modellrechte.
:::

## 19.4 Superuser gegenüber Gruppenmitgliedschaft

Ein Konto mit „Administrator-Status“ ist **Superuser**. Für ein solches Konto gelten weder Modell- noch Routenrechte: Es sieht jeden Menüpunkt, darf jede Objektart löschen und sieht auch die Daten, für die keine Gruppe ein Recht hat, etwa die externen Kartendienste. Seine Gruppenmitgliedschaft spielt keine Rolle.

Für den Administrationsbereich gilt anderes als für die Weboberfläche:

- Anmelden kann sich dort nur ein Konto mit „Mitarbeiter-Status“.
- Bearbeiten kann es dort nur, wofür es Django-Berechtigungen hat. Die mitgelieferten Gruppen haben keine; das Feld „Berechtigungen“ im Gruppenformular ist leer.

![Screenshot des Formulars der Gruppe „Admin“ mit Hervorhebung des leeren Feldes „Berechtigungen“ unter dem Namen](/images/manual/teil-b/permission_group_form.jpg)

In der Praxis ist der Administrationsbereich deshalb dem Superuser-Konto vorbehalten. Ein Konto, das nur „Mitarbeiter-Status“ hat, kommt zwar hinein, sieht dort aber statt der Bereiche nur die Meldung „Das Benutzerkonto besitzt nicht die nötigen Rechte, um etwas anzusehen oder zu ändern.“ Bei einem Konto ohne den Status scheitert schon die Anmeldung: „Bitte Benutzername und Passwort für einen Staff-Account eingeben.“

::: info
Die Berechtigungen im Gruppen- und im Benutzerformular („Can add …“, „Can change …“) wirken nur im Administrationsbereich. Auf die Weboberfläche haben sie keinen Einfluss – dort zählen ausschließlich die Modell- und Routenrechte.
:::

Die „Logs“ der Weboberfläche öffnen sich nur, wenn beides zutrifft: Das Konto hat „Mitarbeiter-Status“, und seine Gruppe darf den Pfad `/admin/*` öffnen – von den mitgelieferten Gruppen nur „Admin“. Die „Log-Einträge“ im Administrationsbereich sieht ohnehin nur das Superuser-Konto.

::: warning
Fehlt eine der beiden Voraussetzungen, landet das Konto ohne Meldung in der Karte. Ein Mitglied der Gruppe „Admin“ ohne „Mitarbeiter-Status“ sieht den Menüpunkt „Logs“ sogar, kommt aber nicht auf die Seite.
:::

Der erste Superuser entsteht bei der Einrichtung der Instanz aus der Konfiguration, siehe Kapitel [Betrieb der Instanz](./28-betrieb-der-instanz.md). Legen Sie für die tägliche Arbeit eigene Konten an und nutzen Sie den Superuser nur für die Verwaltung.

## 19.5 Typische Rollenprofile: Betrachten, Bearbeiten, Verwalten

Qonnectra bringt drei Gruppen mit, die drei Rollen entsprechen:

| Gruppe | Fachdaten | Menüpunkt „Logs“ | Typisch für |
|---|---|---|---|
| „Viewer“ | „Nur Ansehen“ | ausgeblendet | Auskunft, Entscheidung, externe Stellen |
| „Editor“ | „Ansehen und Bearbeiten“ | ausgeblendet | Sachbearbeitung, Dokumentation |
| „Admin“ | „Vollzugriff“ | sichtbar, öffnet sich mit „Mitarbeiter-Status“ | fachlich Verantwortliche, die auch löschen |

Der wichtigste Unterschied zwischen „Editor“ und „Admin“ ist das Löschen. Mit „Editor“ lässt sich in der Weboberfläche nichts entfernen – kein Rohr, kein Anhang, keine Slot-Konfiguration. „Ansehen und Bearbeiten“ umfasst dagegen das Anlegen: Rohre, Anhänge, Wohneinheiten und Auskünfte legt ein „Editor“ selbst an.

Die Weboberfläche zeigt jeder Rolle dieselben Schaltflächen. Ob eine Aktion erlaubt ist, entscheidet sich erst beim Speichern; scheitert sie, erscheint die Meldung aus Abschnitt [Fehlende Rechte erkennen](../teil-a-anwenderhandbuch/18-wenn-etwas-nicht-funktioniert.md#_18-3-fehlende-rechte-erkennen). Weisen Sie Nutzende mit der Rolle „Viewer“ darauf hin.

::: warning
„Viewer“ ist nicht vollständig schreibgeschützt. Zwei Aktionen prüfen nur die Anmeldung und nicht die Modellrechte, sie gelingen deshalb mit jeder Rolle:

- der Excel-Import in der Rohrverwaltung, der Rohre samt Mikrorohren anlegt, siehe Abschnitt [Excel-Import](../teil-a-anwenderhandbuch/10-rohrverwaltung.md#_10-5-excel-import-vorlage-ablauf-fehlermeldungen),
- das Verknüpfen und Lösen von Kabeln und Mikrorohren im Netzschema, siehe Abschnitt [Kabel mit Mikrorohren verknüpfen](../teil-a-anwenderhandbuch/14-netzschema.md#_14-5-kabel-mit-mikrorohren-verknupfen).

Wer Daten auf keinen Fall ändern darf, bekommt kein Konto, sondern einen Export, siehe Kapitel [Daten importieren und exportieren](./24-daten-import-und-export.md).
:::

Eine eigene Rolle legen Sie an, indem Sie eine Gruppe anlegen und für jede Objektart eine Zeile in den Modell-Zugriffsrechten hinzufügen, siehe Abschnitt [Rechte, die keine mitgelieferte Rolle enthält](#_19-6-rechte-die-keine-mitgelieferte-rolle-enthalt). Am schnellsten geht das, wenn Sie die Zeilen einer bestehenden Gruppe als Vorlage nehmen und die abweichenden Stufen ändern.

## 19.6 Rechte, die keine mitgelieferte Rolle enthält

Für vier Objektarten bringt keine Gruppe eine Zeile mit. Ohne Zeile gilt „Kein Zugriff“, und zwar auch für die Gruppe „Admin“ – nur das Superuser-Konto sieht sie:

| Modellname | Was ohne das Recht fehlt |
|---|---|
| `wmssource` | die externen Kartendienste in der Legende der Karte, siehe Abschnitt [Externe WMS-Quellen als Hintergrund einbinden](./27-qgis-server-und-kartendienste.md#_27-4-externe-wms-quellen-als-hintergrund-einbinden) |
| `nodetrenchselection` | das Speichern der „Grabenauswahl“ in der Rohrverzweigung; die Erfolgsmeldung erscheint trotzdem, siehe Kapitel [Rohrverzweigung](../teil-a-anwenderhandbuch/12-rohrverzweigung.md) |
| `nodeslotclipnumber` | Clip-Nummern in der Slot-Ansicht eines Netzknotens |
| `nodeslotdivider` | Trennlinien in der Slot-Ansicht eines Netzknotens |

Das Recht fügen Sie der Gruppe als neue Zeile hinzu:

1. Öffnen Sie „Api“ → „Modell-Zugriffsrechte“ und klicken Sie oben rechts auf „Modell-Zugriffsrecht hinzufügen“.
2. Wählen Sie die „Gruppe“.
3. Tragen Sie unter „Modellname“ den Namen aus der Tabelle ein, kleingeschrieben und ohne Leerzeichen.
4. Wählen Sie die „Zugriffsebene“ und klicken Sie auf „Sichern“.

![Screenshot des Formulars „Modell-Zugriffsrecht hinzufügen“ mit der Gruppe „Viewer“, dem Modellnamen „wmssource“ und der Zugriffsebene „Nur Ansehen“ oben im Formular](/images/manual/teil-b/permission_model_add.jpg)

::: warning
Der „Modellname“ ist ein freies Textfeld. Ein Tippfehler legt eine Zeile an, die nichts bewirkt, ohne Fehlermeldung. Prüfen Sie das Ergebnis mit einem Konto der Gruppe in der Weboberfläche.
:::
