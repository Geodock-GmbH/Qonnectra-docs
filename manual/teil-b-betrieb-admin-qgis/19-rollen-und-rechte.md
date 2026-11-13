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
Ein Konto ohne Gruppe kann sich anmelden, darf aber keine Seite der Weboberfläche öffnen. Es sieht nach der Anmeldung nur die Seite „Kein Zugriff“ mit dem Hinweis „Deinem Konto ist noch keine Rolle zugewiesen, die eine Seite freigibt. Wende dich an deine Administration.“ Wählen Sie die Gruppe deshalb gleich beim Anlegen.
:::

Gehört ein Konto mehreren Gruppen an, gilt je Objektart die höchste Stufe, die eine seiner Gruppen vergibt. Ein Konto in „Viewer“ und „Editor“ darf also bearbeiten.

Ein Konto, das nicht mehr arbeiten soll, deaktivieren Sie, statt es zu löschen: Entfernen Sie den Haken bei „Aktiv“. Die Anmeldung schlägt dann fehl, Einträge im Protokoll und im Änderungsverlauf behalten aber ihren Bezug zu dem Konto.

Das Passwort eines Kontos setzen Sie im Benutzerformular über den Link unter dem Feld „Passwort“ neu. Das alte Passwort lässt sich nicht einsehen; Qonnectra speichert nur einen daraus berechneten Wert.

::: info
Ein geändertes Passwort beendet laufende Sitzungen der Weboberfläche nicht sofort. Die Anmeldung dort hält bis zu sieben Tage und verlängert sich, solange das Konto aktiv bleibt. Wollen Sie ein Konto sofort sperren, deaktivieren Sie es.
:::

Gruppen pflegen Sie unter „Authentifizierung und Autorisierung“ → „Gruppen“. Das Formular einer Gruppe zeigt unter dem Feld „Berechtigungen“ ihre „Modell-Zugriffsrechte“ und „Seiten-Zugriffsrechte“, die Sie dort auch direkt bearbeiten; was sie bedeuten, beschreiben die folgenden Abschnitte. Eine neue Gruppe hat zunächst kein Modellrecht. Wie Sie sie mit den Rechten einer bestehenden Gruppe beginnen, beschreibt Abschnitt [Eigene Rollen anlegen und Rechte ergänzen](#_19-6-eigene-rollen-anlegen-und-rechte-erganzen).

## 19.2 Modellrechte: Zugriff je Datenmodell

Die **Modellrechte** legen je Gruppe und Objektart fest, was ein Konto mit den Daten tun darf. Sie stehen unter „Api“ → „Modell-Zugriffsrechte“, eine Zeile je Gruppe und Objektart.

![Screenshot der Modell-Zugriffsrechte, gefiltert auf die Gruppe „Editor“, mit Hervorhebung der Filterleiste rechts und der Spalte „Zugriffsebene“](/images/manual/teil-b/permission_model_list.jpg)

Jede Zeile hat eine von vier Zugriffsebenen:

- „Kein Zugriff“ – die Objektart bleibt verborgen; jede Anfrage scheitert.
- „Nur Ansehen“ – lesen.
- „Ansehen und Bearbeiten“ – lesen, anlegen und ändern, aber nicht löschen.
- „Vollzugriff“ – zusätzlich löschen.

Die Spalte „Zugriffsebene“ lässt sich direkt in der Liste ändern, siehe Abschnitt [Suchen, Filtern und Massenbearbeitung](./20-administrationsbereich.md#_20-2-suchen-filtern-und-massenbearbeitung).

Die Objektarten stehen in der Spalte „Modellname“ mit ihrem technischen Namen. Wirksam sind diese Zeilen:

| Modellname | Bereich der Weboberfläche |
|---|---|
| `trench`, `conduit`, `microduct` | Trassen, Rohre und Mikrorohre; `conduit` auch für den Excel-Import der Rohrverwaltung |
| `trenchconduitconnection`, `trenchconduitcanvas` | Rohrzuordnung und Grabenprofil |
| `microductconnection`, `nodetrenchselection` | Verbindungen der Mikrorohre und Grabenauswahl in der Rohrverzweigung |
| `node`, `address`, `residentialunit`, `area` | Netzknoten, Adressen, Wohneinheiten, Gebiete |
| `cable`, `fiber`, `fibersplice`, `cablelabel` | Kabel, Fasern, Spleiße und Kabelbeschriftungen im Netzschema |
| `microductcableconnection` | Verknüpfung von Kabeln mit Mikrorohren im Netzschema |
| `nodeslotconfiguration`, `nodestructure`, `container`, `nodeslotclipnumber`, `nodeslotdivider` | Aufbau eines Netzknotens, samt Clip-Nummern und Trennlinien der Slot-Ansicht |
| `pipelinerecord`, `pipelineinquiryarea` | Auskünfte und Auskunftsbereiche der Leitungsauskunft |
| `featurefiles` | Anhänge |
| `wmssource`, `wmslayer` | externe Kartendienste und ihre Layer in der Legende der Karte, siehe Abschnitt [Externe WMS-Quellen als Hintergrund einbinden](./27-qgis-server-und-kartendienste.md#_27-4-externe-wms-quellen-als-hintergrund-einbinden) |

Neben den Objektarten bietet das Feld „Modellname“ die Zeile „\* (jedes Modell ohne eigene Zeile)“. Ihre Stufe gilt in der Gruppe für jede Objektart, für die die Gruppe keine eigene Zeile hat. Daraus ergibt sich die Stufe eines Kontos je Objektart:

- Innerhalb einer Gruppe geht die Zeile der Objektart der Zeile `*` vor, auch wenn sie weniger erlaubt.
- Hat die Gruppe weder die eine noch die andere, gilt für sie „Kein Zugriff“.
- Zwischen mehreren Gruppen eines Kontos gilt die höchste Stufe, die eine von ihnen ergibt.

::: warning
Eine Zeile, die weniger erlaubt, schränkt nur ihre eigene Gruppe ein. Steht ein Konto zusätzlich in einer Gruppe, deren Zeile `*` mehr erlaubt, gilt für die Objektart das Mehr.
:::

Sieben weitere Zeilen bringt Qonnectra mit, sie wirken aber nicht: `projects`, `flags`, `containertype`, `typeofwork`, `requestreason`, `qgisproject` und `logentry`. Dasselbe gilt für alle übrigen Einträge, die das Feld „Modellname“ zur Auswahl anbietet, etwa die Stammdaten. Projekte, Kennzeichen, Container-Typen und die Auswahllisten der Leitungsauskunft sind wie alle übrigen Stammdaten – Status, Rohrtypen, Firmen – für jedes angemeldete Konto lesbar und lassen sich nur im Administrationsbereich ändern. Wer die Systemprotokolle lesen darf, regeln „Mitarbeiter-Status“ und Routenrecht, siehe Abschnitt [Superuser gegenüber Gruppenmitgliedschaft](#_19-4-superuser-gegenuber-gruppenmitgliedschaft).

::: warning
Eine geänderte Zugriffsebene greift nicht sofort. Qonnectra hält die Rechte eines Kontos bis zu fünf Minuten zwischengespeichert. Die Navigationsleiste zeigt die neuen Rechte erst, wenn das Konto die Seite neu lädt, und auch dann mit bis zu 30 Sekunden Verzögerung. Eine Aktion kann in dieser Zeit noch mit dem alten Recht gelingen oder scheitern.
:::

## 19.3 Routenrechte: Zugriff je Menüpunkt

Die **Routenrechte** sperren Seiten der Weboberfläche für eine Gruppe. Sie stehen unter „Api“ → „Seiten-Zugriffsrechte“. Jede Zeile nennt eine Gruppe, ein „Route-Muster“ und ob es „Erlaubt“ ist.

![Screenshot der Seiten-Zugriffsrechte mit den drei mitgelieferten Zeilen für das Muster „/admin/*“ in der Mitte](/images/manual/teil-b/permission_route_list.jpg)

Mitgeliefert ist für jede der drei Gruppen genau eine Zeile: Das Muster `/admin/*` ist für „Admin“ erlaubt und für „Editor“ und „Viewer“ gesperrt. Es betrifft in der Weboberfläche nur einen Menüpunkt, die „Logs“ am Fuß der Navigationsleiste. Alles, wofür keine Zeile existiert, ist erlaubt.

Eine Seite wird über ihren **Seitenschlüssel** angesprochen: den Pfad der Seite ohne die Nummer des Projekts und ohne die Kennungen einzelner Objekte. Die Karte hat in jedem Projekt den Schlüssel `/map`. Das Route-Muster ist ein Seitenschlüssel oder ein Muster mit `/*` am Ende:

- `/valuation` – die Seite und alle Seiten darunter.
- `/network-schema/*` – nur die Seiten darunter, etwa das Subnetz, nicht das Netzschema selbst.
- `/*` – alle Seiten.

Großbuchstaben, Leerzeichen und ein fehlender Schrägstrich am Anfang weist das Formular beim Speichern ab. Einen Pfad aus der Adresszeile des Browsers wie `/project/2/valuation` nimmt es dagegen an, obwohl er keine Seite trifft; tragen Sie nur den Schlüssel ein. Die Schlüssel der Menüpunkte:

| Menüpunkt | Schlüssel | Menüpunkt | Schlüssel |
|---|---|---|---|
| „Dashboard“ | `/dashboard` | „Verwaltung“ (Rohr) | `/conduit` |
| „Karte“ | `/map` | „Zuordnung“ (Rohr) | `/trench` |
| „Störungsanalyse“ | `/fault-simulation` | „Verzweigung“ (Rohr) | `/pipe-branch` |
| „Nachverdichtung“ | `/post-compaction` | „Mikrorohre“ | `/house-connections` |
| „Leitungsauskunft“ | `/pipeline-records` | „Netzschema“ | `/network-schema` |
| „Wertermittlung“ | `/valuation` | „Faserweg“ | `/trace` |
| „Adressen“ | `/address` | „Einstellungen“ | `/settings` |
| „Logs“ | `/admin/logs` | | |

Einige Seiten, die die Ansichten öffnen, haben einen eigenen Schlüssel unter dem des Menüpunkts: `/network-schema/node` (Subnetz eines Netzknotens), `/pipe-branch/node` (Rohrverzweigung eines Netzknotens), `/address/unit` (Wohneinheit), `/pipeline-records/new` und `/pipeline-records/inquiry` (neue Auskunft und Auskunftsabfrage). Eine Zeile `/network-schema` sperrt das Subnetz deshalb mit.

Umfassen mehrere Zeilen eine Seite, entscheidet die genaueste: Ist `/address` gesperrt und `/address/unit` erlaubt, öffnen sich die Wohneinheiten, die Liste der Adressen nicht. Widersprechen sich gleich genaue Zeilen, auch aus verschiedenen Gruppen eines Kontos, gewinnt „Erlaubt“.

Eine gesperrte Seite verschwindet aus der Navigationsleiste. Wird sie trotzdem aufgerufen, etwa über ein Lesezeichen, leitet die Weboberfläche ohne Meldung zur Karte um. Ist auch die Karte gesperrt, leitet sie zur obersten Seite der Navigationsleiste um, die das Konto öffnen darf, siehe Abschnitt [Fehlende Rechte erkennen](../teil-a-anwenderhandbuch/18-wenn-etwas-nicht-funktioniert.md#_18-3-fehlende-rechte-erkennen). Ist keine Seite erlaubt, erscheint die Seite „Kein Zugriff“.

::: warning
Eine Gruppe, die mit `/*` alles erlaubt, hebt die Sperre einer genaueren Zeile in einer anderen Gruppe desselben Kontos nicht auf. Ist `/valuation` für „Viewer“ gesperrt, bleibt die Wertermittlung für ein Konto in „Viewer“ und einer Gruppe mit `/*` gesperrt.
:::

::: warning
Bis Version 1.7 stand die Nummer des Projekts am Ende des Pfads, und eine Seite zu sperren brauchte zwei Zeilen, etwa `/valuation` und `/valuation/*`. Seither umfasst ein Muster mit `/*` nur noch die Seiten darunter: `/valuation/*` allein sperrt nichts mehr, `/network-schema/*` allein nur noch das Subnetz. Prüfen Sie die Seiten-Zugriffsrechte nach der Aktualisierung einer älteren Installation und ergänzen Sie, wo nötig, die Zeile ohne `/*`.
:::

::: warning
Routenrechte sind kein Schutz der Daten. Sie verbergen einen Menüpunkt, nicht die Daten dahinter: Dieselben Daten erscheinen in anderen Ansichten und sind über die Schnittstelle abrufbar. Was eine Gruppe nicht sehen darf, sperren Sie über die Modellrechte.
:::

## 19.4 Superuser gegenüber Gruppenmitgliedschaft

Ein Konto mit „Administrator-Status“ ist **Superuser**. Für ein solches Konto gelten weder Modell- noch Routenrechte: Es sieht jeden Menüpunkt, darf jede Objektart löschen und sieht auch die Daten, für die seine Gruppen kein Recht vergeben. Seine Gruppenmitgliedschaft spielt keine Rolle.

Für den Administrationsbereich gilt anderes als für die Weboberfläche:

- Anmelden kann sich dort nur ein Konto mit „Mitarbeiter-Status“.
- Bearbeiten kann es dort nur, was ihm das Feld „Berechtigungen“ im Gruppen- oder Benutzerformular erlaubt. Bei den mitgelieferten Gruppen ist dieses Feld leer.

![Screenshot des Formulars der Gruppe „Admin“ mit Hervorhebung des leeren Feldes „Berechtigungen“ unter dem Namen](/images/manual/teil-b/permission_group_form.jpg)

In der Praxis ist der Administrationsbereich deshalb dem Superuser-Konto vorbehalten. Ein Konto, das nur „Mitarbeiter-Status“ hat, kommt zwar hinein, sieht dort aber statt der Bereiche nur die Meldung „Das Benutzerkonto besitzt nicht die nötigen Rechte, um etwas anzusehen oder zu ändern.“ Bei einem Konto ohne den Status scheitert schon die Anmeldung: „Bitte Benutzername und Passwort für einen Staff-Account eingeben.“

::: info
Die Berechtigungen im Gruppen- und im Benutzerformular („Can add …“, „Can change …“) wirken nur im Administrationsbereich. Auf die Weboberfläche haben sie keinen Einfluss – dort zählen ausschließlich die Modell- und Routenrechte.
:::

Die „Logs“ der Weboberfläche öffnen sich nur, wenn beides zutrifft: Das Konto hat „Mitarbeiter-Status“, und seine Gruppe darf die Seite `/admin/logs` öffnen, etwa über das Muster `/admin/*` – von den mitgelieferten Gruppen nur „Admin“. Die „Log-Einträge“ im Administrationsbereich sieht ohnehin nur das Superuser-Konto.

::: warning
Fehlt eine der beiden Voraussetzungen, landet das Konto ohne Meldung in der Karte. Ein Mitglied der Gruppe „Admin“ ohne „Mitarbeiter-Status“ sieht den Menüpunkt „Logs“ sogar, kommt aber nicht auf die Seite.
:::

Der erste Superuser entsteht bei der Einrichtung der Instanz aus der Konfiguration, siehe Abschnitt [Konfiguration über Umgebungsvariablen](./28-betrieb-der-instanz.md#_28-2-konfiguration-uber-umgebungsvariablen). Legen Sie für die tägliche Arbeit eigene Konten an und nutzen Sie den Superuser nur für die Verwaltung.

## 19.5 Typische Rollenprofile: Betrachten, Bearbeiten, Verwalten

Qonnectra bringt drei Gruppen mit, die drei Rollen entsprechen:

| Gruppe | Fachdaten | Menüpunkt „Logs“ | Typisch für |
|---|---|---|---|
| „Viewer“ | „Nur Ansehen“ | ausgeblendet | Auskunft, Entscheidung, externe Stellen |
| „Editor“ | „Ansehen und Bearbeiten“ | ausgeblendet | Sachbearbeitung, Dokumentation |
| „Admin“ | „Vollzugriff“ | sichtbar, öffnet sich mit „Mitarbeiter-Status“ | fachlich Verantwortliche, die auch löschen |

Der wichtigste Unterschied zwischen „Editor“ und „Admin“ ist das Löschen. Mit „Editor“ lässt sich in der Weboberfläche nichts entfernen – kein Rohr, kein Anhang, keine Slot-Konfiguration, auch keine Faser von einem Port und keine Verknüpfung zwischen Kabel und Mikrorohr. „Ansehen und Bearbeiten“ umfasst dagegen das Anlegen: Rohre, Anhänge, Wohneinheiten und Auskünfte legt ein „Editor“ selbst an, auch über den Excel-Import der Rohrverwaltung.

Die Weboberfläche zeigt jeder Rolle dieselben Schaltflächen. Ob eine Aktion erlaubt ist, entscheidet sich erst beim Speichern; scheitert sie, erscheint in der Regel die Meldung „Deine Rolle erlaubt diese Aktion nicht. Wende dich an deine Administration.“, siehe Abschnitt [Fehlende Rechte erkennen](../teil-a-anwenderhandbuch/18-wenn-etwas-nicht-funktioniert.md#_18-3-fehlende-rechte-erkennen). Weisen Sie Nutzende mit der Rolle „Viewer“ darauf hin.

Eine eigene Rolle legen Sie als Abwandlung einer dieser drei an, siehe Abschnitt [Eigene Rollen anlegen und Rechte ergänzen](#_19-6-eigene-rollen-anlegen-und-rechte-erganzen).

## 19.6 Eigene Rollen anlegen und Rechte ergänzen

Eine eigene Rolle ist eine Gruppe mit eigenen Modell- und Routenrechten. Am schnellsten beginnen Sie sie mit den Rechten der Gruppe, die ihr am nächsten kommt:

1. Öffnen Sie „Authentifizierung und Autorisierung“ → „Gruppen“ und klicken Sie oben rechts auf „Gruppe hinzufügen“.
2. Geben Sie den „Name“ ein und wählen Sie unter „Berechtigungen übernehmen von“ die Vorlage.
3. Tragen Sie unter „Modell-Zugriffsrechte“ und „Seiten-Zugriffsrechte“ nur die Zeilen ein, die von der Vorlage abweichen sollen.
4. Klicken Sie auf „Sichern“.

Beim Sichern übernimmt die neue Gruppe alle Zeilen der Vorlage, die sie nicht schon hat; eine Zeile, die Sie im Formular für dieselbe Objektart oder dasselbe Muster eingetragen haben, hat Vorrang. Danach sind beide Gruppen unabhängig: Spätere Änderungen an der Vorlage übernimmt die neue Gruppe nicht. „Berechtigungen übernehmen von“ gibt es nur beim Anlegen.

::: warning
„Berechtigungen übernehmen von“ und das Feld „Berechtigungen“ darüber haben nichts miteinander zu tun. Das Feld „Berechtigungen“ wirkt nur im Administrationsbereich, siehe Abschnitt [Superuser gegenüber Gruppenmitgliedschaft](#_19-4-superuser-gegenuber-gruppenmitgliedschaft); lassen Sie es leer.
:::

Eine einzelne Zeile ergänzen Sie im Formular der Gruppe oder über die Liste:

1. Öffnen Sie „Api“ → „Modell-Zugriffsrechte“ und klicken Sie oben rechts auf „Modell-Zugriffsrecht hinzufügen“.
2. Wählen Sie die „Gruppe“ und unter „Modellname“ die Objektart, siehe Abschnitt [Modellrechte](#_19-2-modellrechte-zugriff-je-datenmodell).
3. Wählen Sie die „Zugriffsebene“ und klicken Sie auf „Sichern“.

![Screenshot des Formulars „Modell-Zugriffsrecht hinzufügen“ mit einer eigenen Gruppe „Auskunft“, dem Modellnamen „wmssource“ und der Zugriffsebene „Nur Ansehen“ oben im Formular](/images/manual/teil-b/permission_model_add.jpg)

Für eine Rolle, die fast überall dieselbe Stufe hat, genügt eine Zeile „\* (jedes Modell ohne eigene Zeile)“ und je eine Zeile für die Ausnahmen.

::: warning
Die mitgelieferten Gruppen enthalten seit Version 1.8 auch die Rechte für externe Kartendienste (`wmssource`), die Grabenauswahl der Rohrverzweigung (`nodetrenchselection`) sowie Clip-Nummern und Trennlinien der Slot-Ansicht (`nodeslotclipnumber`, `nodeslotdivider`): „Admin“ mit „Vollzugriff“, „Editor“ mit „Ansehen und Bearbeiten“, „Viewer“ mit „Nur Ansehen“. Die Aktualisierung einer älteren Installation ergänzt diese Zeilen nur in Gruppen, die genau „Admin“, „Editor“ oder „Viewer“ heißen, und lässt Zeilen, die dort schon bestehen, unverändert. Eigenen Gruppen fehlen sie, und ihre Konten sehen z. B. die externen Kartendienste nicht. Ergänzen Sie dort die vier Zeilen oder eine Zeile `*`.
:::
