# 1. Erste Schritte

Dieses Kapitel führt Sie in die Anwendung ein: Anmeldung, Aufbau der Oberfläche und die Einstellungen, die Sie gleich am Anfang brauchen.

## 1.1 Anmelden und abmelden

Qonnectra wird über einen Webbrowser bedient; eine Installation auf Ihrem Rechner ist nicht nötig. Die Adresse zur Anmeldung erhalten Sie von Ihrer Organisation oder zuständigen Verwaltung. Melden Sie sich mit Benutzernamen und Passwort an; „Login“ oder die Eingabetaste bringt Sie zum Dashboard.

![Screenshot Anmeldeseite mit dem Anmeldeformular auf der rechten Seite](/images/manual/teil-a/login_start.jpg)
![Screenshot Ausschnittvergrößerung des Anmeldeformulars mit den Feldern „Benutzername“ und „Passwort“ und der Schaltfläche „Login“](/images/manual/teil-a/login_start_detail.jpg)
{.img-row}

Zum Abmelden klicken Sie in der Kopfzeile rechts auf „Abmelden“.

::: info
Stimmen Benutzername oder Passwort nicht, erscheint am unteren Bildschirmrand kurz die Meldung „Fehler beim Anmelden“ und Sie bleiben auf der Anmeldeseite. Prüfen Sie in diesem Fall die Groß- und Kleinschreibung.
:::

### 1.1.1 Noch keine Zugangsdaten?

Falls Sie noch keine Zugangsdaten erhalten haben, wenden Sie sich bitte an Ihre Projektleitung oder Ihre Administration. Ein Benutzerkonto kann dort für Sie angelegt werden.

### 1.1.2 Passwort vergessen?

Derzeit gibt es keine „Passwort vergessen“-Funktion im System. Wenn Sie Ihr Passwort nicht mehr wissen, hilft Ihnen Ihre Projektleitung oder Administration weiter. Dort kann das Passwort zurückgesetzt oder ein neues vergeben werden.

## 1.2 Aufbau der Oberfläche

Nach der Anmeldung befinden Sie sich auf dem Dashboard. Die Bedienoberfläche ist immer gleich aufgebaut und besteht aus drei Bereichen: der **Navigationsleiste** am linken Rand, der **Kopfzeile** am oberen Rand und der **Inhaltsfläche** in der Mitte.

![Screenshot Startbildschirm mit Hervorhebung der einzelnen Bestandteile der App](/images/manual/teil-a/login_navigation.jpg){.big}{.no-border}

### 1.2.1 Navigationsleiste

Über die Navigationsleiste am linken Rand wechseln Sie zu allen verfügbaren Ansichten; sie bleibt beim Arbeiten immer sichtbar. Die Einträge sind nach Themen gruppiert:

- „Info“ – „Dashboard“ (Startansicht, siehe Kapitel [Dashboard](./04-dashboard.md)) und „Karte“ (siehe Kapitel [Karte](./05-karte.md))
- „Funktionen“ – „Störungsanalyse“, „Nachverdichtung“, „Leitungsauskunft“ und „Wertermittlung“: Auswertungen und Verfahren, die auf den dokumentierten Daten aufbauen
- „Rohr“ – „Verwaltung“ (siehe Kapitel [Rohrverwaltung](./10-rohrverwaltung.md)), „Zuordnung“ (siehe Kapitel [Rohrzuordnung](./11-rohrzuordnung.md)), „Verzweigung“ und „Mikrorohre“
- „Kabel“ – „Netzschema“ und „Faserweg“
- „Gebäude“ – „Adressen“

![Screenshot Dashboard mit Hervorhebung der Navigationsleiste am linken Rand](/images/manual/teil-a/login_sidebar.jpg)

Am Fuß der Leiste steht unter der Überschrift „System“ der Eintrag „Einstellungen“ (siehe Kapitel [Einstellungen](./17-einstellungen.md)) und, wenn Ihre Installation eine Adresse für dieses Handbuch hinterlegt hat, „Dokumentation“. Mit den entsprechenden Rechten erscheint dort zusätzlich „Logs“ mit den Systemprotokollen; deren Auswertung beschreibt Kapitel [Betrieb der Instanz](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md).

![Screenshot Dashboard mit Hervorhebung des Fußbereichs „System“ mit „Logs“ und „Einstellungen“ unten links](/images/manual/teil-a/login_settings.jpg)

::: info
Wenn der Fußbereich „System“ nicht zu sehen ist, scrollen Sie in der Navigationsleiste nach unten.
:::

Die Breite der Leiste stellen Sie unter „Einstellungen“ ein: „Erweitert“ zeigt die Beschriftungen, „Eingeklappt“ nur die Symbole.

### 1.2.2 Kopfzeile

Oben links in der Anwendung befindet sich das Projektauswahl-Menü, siehe Abschnitt [Projekt auswählen und wechseln](#_1-3-projekt-auswahlen-und-wechseln). Oben rechts in der Kopfzeile finden Sie die Angaben und Schaltflächen, die in Abschnitt [Sprache, Hell- und Dunkelmodus, Versionsanzeige und Dokumentation](#_1-4-sprache-hell-und-dunkelmodus-versionsanzeige-und-dokumentation) beschrieben sind.

![Screenshot Dashboard mit Hervorhebung der Kopfzeile am oberen Rand](/images/manual/teil-a/login_header.jpg)

### 1.2.3 Inhaltsfläche

In der zentralen Inhaltsfläche werden alle projektbezogenen Informationen angezeigt: Statistiken, Listen, Karten usw. Welche Inhalte sichtbar sind, hängt vom gewählten Projekt (oben links in der Kopfzeile), dem gewählten Navigationseintrag (linke Navigationsleiste) und ggf. von dem gewählten Reiter (meist unterhalb der Kopfzeile) ab.

## 1.3 Projekt auswählen und wechseln

Alle Daten in Qonnectra gehören zu einem **Projekt**. Welches Projekt gilt, wählen Sie oben links in der Kopfzeile; die Auswahl gilt für die gesamte Anwendung und bleibt beim Wechsel in eine andere Ansicht erhalten. Kennzahlen, Karteninhalte und Listen zeigen deshalb immer nur den Bestand des ausgewählten Projekts.

Die Projektauswahl ist eine Kombination aus Eingabefeld und Auswahlliste: Über den Pfeil am rechten Rand öffnen Sie die Liste aller für Sie freigegebenen Projekte, über eine Eingabe in das Feld schränken Sie die Liste auf passende Namen ein. Mit dem Klick auf einen Eintrag wechseln Sie das Projekt; alle angezeigten Inhalte aktualisieren sich daraufhin automatisch.

![Screenshot Dashboard mit Hervorhebung der Projektauswahl oben links in der Kopfzeile](/images/manual/teil-a/dashboard_project.jpg)
![Screenshot Ausschnittvergrößerung der geöffneten Projektliste in der Kopfzeile mit dem hervorgehobenen Eintrag „Testprojekt“](/images/manual/teil-a/dashboard_project_detail.jpg)
{.img-row}

::: warning
Die Eingabe im Feld allein wählt nichts aus – erst der Klick auf einen Eintrag der Liste wechselt das Projekt. Solange kein Projekt gewählt ist, bleiben alle Kennzahlen auf Null und die Diagramme zeigen „Keine Daten verfügbar“.
:::

::: info
Sind für Ihr Benutzerkonto keine Projekte freigegeben, erscheint anstelle des Feldes der Hinweis „Keine Projekte verfügbar“.
:::

In der Karte und in der Wertermittlung steht neben der Projektauswahl zusätzlich die Schaltfläche „Alle Projekte anzeigen“, mit der Sie die Beschränkung auf das gewählte Projekt vorübergehend aufheben; eingeschaltet heißt sie „Nur aktuelles Projekt anzeigen“. In den übrigen Ansichten mit einem Kartenfenster gibt es sie nicht.

## 1.4 Sprache, Hell- und Dunkelmodus, Versionsanzeige und Dokumentation

Oben rechts in der Kopfzeile finden Sie:

- die aktuelle Softwareversion, z. B. „v1.7.0“ – geben Sie diese Angabe mit an, wenn Sie einen Fehler bei Ihrer Administration melden
- die Spracheinstellung: Deutsch („DE“) oder Englisch („EN“)
- einen Verweis auf das Projekt bei GitHub, in dem Qonnectra entwickelt wird
- „Hell-/Dunkelmodus umschalten“
- „Abmelden“

::: info
Wenn Ihre Installation eine Adresse für dieses Handbuch hinterlegt hat, erscheint zusätzlich ein Buchsymbol („Dokumentation“), das das Handbuch in einem neuen Tab öffnet.
:::

## 1.5 Navigationsleiste anpassen

Ein Klick auf einen Gruppennamen – etwa „Funktionen“ – klappt die Gruppe zu und wieder auf. Einträge, die Sie nicht benötigen, können Sie dauerhaft ausblenden:

1. Klicken Sie oben rechts neben dem Schriftzug „Qonnectra“ auf das Symbol mit den Schiebereglern („Seitenleiste anpassen“).
2. Klicken Sie neben einem Eintrag auf „Ausblenden“. Über „Einblenden“ holen Sie ihn zurück, „Seitenleiste zurücksetzen“ stellt alle Einträge und Gruppen wieder her.
3. Beenden Sie die Anpassung über dasselbe Symbol („Fertig“).

::: info
Zugeklappte Gruppen und ausgeblendete Einträge merkt sich zunächst nur der Browser, in dem Sie sie eingestellt haben – an einem anderen Rechner sehen Sie wieder die vollständige Navigationsleiste. Speichern Sie Ihre Einstellungen im Benutzerkonto, gehören sie zu den übertragenen Angaben, siehe Kapitel [Einstellungen](./17-einstellungen.md).
:::

Der Fußbereich „System“ lässt sich nicht ausblenden.

## 1.6 Bedienung auf Tablet und Smartphone

Qonnectra lässt sich auch auf einem Tablet oder Smartphone bedienen. Unterhalb einer Fensterbreite von etwa 768 Pixeln entfällt die Navigationsleiste am linken Rand; an ihre Stelle tritt eine Leiste am unteren Bildschirmrand mit „Dashboard“, „Karte“ und „Mehr“.

![Screenshot des Dashboards auf einem Smartphone mit Hervorhebung der Leiste am unteren Bildschirmrand](/images/manual/teil-a/login_mobile_bar.jpg){.small}

„Mehr“ öffnet ein Menü mit allen übrigen Menüpunkten, gegliedert nach denselben Gruppen wie die Navigationsleiste am Rechner. Darunter stehen der Bereich „System“ mit „Einstellungen“ und, sofern hinterlegt, „Dokumentation“ sowie die Umschaltung zwischen „DE“ und „EN“. Ein Tippen neben das Menü schließt es wieder.

![Screenshot des geöffneten Menüs „Weitere Seiten“ auf einem Smartphone mit den Gruppen „Funktionen“, „Rohr“ und „Kabel“](/images/manual/teil-a/login_mobile_more.jpg){.small}

::: info
Ausgeblendete Einträge und zugeklappte Gruppen aus Abschnitt [Navigationsleiste anpassen](#_1-5-navigationsleiste-anpassen) wirken sich hier nicht aus: Das Menü „Mehr“ enthält immer alle Menüpunkte, für die Ihr Konto berechtigt ist.
:::

Die Kopfzeile wird unterhalb von etwa 640 Pixeln auf das Nötigste gekürzt: Projektauswahl, „Hell-/Dunkelmodus umschalten“ und „Abmelden“ bleiben stehen, die Versionsanzeige, die Sprachumschaltung, die „Dokumentation“ und der Verweis auf GitHub entfallen. Sprache und Dokumentation erreichen Sie stattdessen über „Mehr“.

Tabellen erscheinen auf schmalen Bildschirmen nicht als Tabelle, sondern als Liste von Karten – eine Karte je Datensatz mit den Werten untereinander. Anstelle der Suchfelder unter den Spaltenüberschriften steht dann ein einzelnes Suchfeld über der Liste, siehe Abschnitt [Tabellen](./03-wiederkehrende-bedienelemente.md#_3-1-tabellen-suche-spaltenfilter-sortierung-seitenwechsel).

::: info
Zum Nachschlagen unterwegs reicht ein Smartphone. Karte, Netzschema und Netzknotenstruktur brauchen dagegen Platz – zum Erfassen und Bearbeiten ist ein Bildschirm ab Tabletgröße im Querformat die bessere Wahl.
:::

## 1.7 Warum manche Menüpunkte fehlen: Berechtigungen

Welche Menüpunkte Sie sehen und was Sie darin ändern dürfen, hängt von den Rechten Ihres Benutzerkontos ab. Fehlt ein in diesem Handbuch genannter Bereich, ist er für Ihr Konto nicht freigegeben – wenden Sie sich in diesem Fall an Ihre Administration.

::: warning
Die Rechte wirken nicht nur auf die Navigationsleiste: Auch innerhalb einer Ansicht kann eine Aktion an fehlenden Rechten scheitern. In diesem Fall erscheint eine Fehlermeldung und die Daten bleiben unverändert.
:::
