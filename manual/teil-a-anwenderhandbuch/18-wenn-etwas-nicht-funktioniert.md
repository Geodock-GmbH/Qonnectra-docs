# 18. Wenn etwas nicht funktioniert

Dieses Kapitel sammelt die Fälle, die in jeder Ansicht auftreten können: die Meldungen, mit denen Qonnectra antwortet, eine abgelaufene Anmeldung, fehlende Rechte und leere Karten und Diagramme. Am Ende steht, was das Support-Team von Ihnen braucht, damit es Ihnen helfen kann.

Was nur in einer bestimmten Ansicht schiefgehen kann, steht in deren Kapitel – etwa eine fehlgeschlagene Route in der [Rohrzuordnung](./11-rohrzuordnung.md) oder ein Import mit Fehlern in der [Rohrverwaltung](./10-rohrverwaltung.md).

## 18.1 Meldungen der Anwendung und was sie bedeuten

Qonnectra antwortet auf jede Aktion, die etwas an den Daten ändert, mit einer kurzen Meldung am unteren Bildschirmrand. Sie besteht aus einer Überschrift – „Erfolg“ oder „Fehler“ – und einem Satz dazu, etwa „Adresse erfolgreich aktualisiert“ oder „Fehler beim Löschen des Rohres“.

![Screenshot einer Adresse mit Hervorhebung der Meldung „Adresse erfolgreich aktualisiert“ am unteren Bildschirmrand](/images/manual/teil-a/error_toast.jpg)

Die beiden Überschriften sind verlässlich:

- **„Erfolg“** heißt, dass der Server die Änderung angenommen und gespeichert hat. Sie können weiterarbeiten.
- **„Fehler“** heißt, dass nichts geändert wurde. Ihre Eingaben stehen weiter im Formular und lassen sich erneut absenden.

::: warning
Die Meldung verschwindet nach wenigen Sekunden von selbst. Wer währenddessen woanders hinsieht, bekommt nicht mit, ob gespeichert wurde – und ein Formular sieht danach genauso aus wie vorher. Prüfen Sie im Zweifel nach, ob der Wert wirklich in der Ansicht steht, und laden Sie die Seite dafür neu.
:::

::: warning
Bei Abläufen aus mehreren Schritten gilt „Fehler“ nur für den Schritt, in dem er auftritt. In der Nachverdichtung etwa wird der geänderte Ausbaustatus gespeichert, auch wenn das PDF danach nicht zustande kommt, siehe Abschnitt [PDF erzeugen und Inhalt des Dokuments](./07-nachverdichtung.md#_7-4-pdf-erzeugen-und-inhalt-des-dokuments).
:::

**Rückfragen**

Vor dem Löschen und vor dem Neuvergeben einer ID fragt Qonnectra in einem kleinen Fenster nach. Es nennt, was passieren wird, und bietet „Abbrechen“ und die Aktion selbst an. „Abbrechen“ oder ein Klick daneben lässt alles, wie es war.

**Hinweise anstelle von Inhalten**

Steht in einer Tabelle oder einem Abschnitt ein Satz wie „Keine Ergebnisse gefunden“, „Keine Daten verfügbar“ oder „Keine Standortdaten verfügbar“, ist das keine Fehlermeldung: An dieser Stelle gibt es nichts anzuzeigen. Das kann an einem Filter liegen, an einem leeren Projekt oder an fehlenden Stammdaten, siehe Abschnitt [Karte oder Diagramm bleibt leer](#_18-4-karte-oder-diagramm-bleibt-leer).

**Die Wartemeldung**

Beim Wechsel in eine andere Ansicht legt sich kurz ein Fenster mit „Laden...“ und „Bitte warten...“ über die Oberfläche; beim Netzschema steht dort „Netzwerkschema synchronisiert...“. Bleibt es stehen, statt nach ein paar Sekunden zu verschwinden, kommt die Ansicht nicht zustande. Laden Sie die Seite neu; bleibt es dabei, siehe Abschnitt [Was das Support-Team von Ihnen braucht](#_18-5-was-das-support-team-von-ihnen-braucht).

**Die Fehlerseite**

Führt eine Adresse ins Leere, ersetzt Qonnectra die Ansicht durch eine Seite mit einer Zahl – dem HTTP-Statuscode – und darunter einem kurzen englischen Text, etwa der 404 mit „Not Found“. „Zurück zur Startseite“ bringt Sie in die Anwendung zurück.

![Screenshot der Fehlerseite mit der Statusnummer 404, dem Text „Not Found“ und der Schaltfläche „Zurück zur Startseite“](/images/manual/teil-a/error_not_found.jpg)

::: info
Ein tippfehlerhaft eingegebener Link ist die häufigste Ursache. Kommt die Seite bei einem Verweis aus Qonnectra selbst oder aus diesem Handbuch, notieren Sie die Zahl und die Adresse und melden Sie es, siehe Abschnitt [Was das Support-Team von Ihnen braucht](#_18-5-was-das-support-team-von-ihnen-braucht).
:::

## 18.2 Sitzung abgelaufen, Anmeldung schlägt fehl

**Die Anmeldung schlägt fehl**

Stimmen Benutzername oder Passwort nicht, bleiben Sie auf der Anmeldeseite und Qonnectra meldet „Fehler beim Anmelden“, siehe Abschnitt [Anmelden und abmelden](./01-erste-schritte.md#_1-1-anmelden-und-abmelden). Welches der beiden Felder falsch war, nennt die Meldung nicht. Prüfen Sie die Groß- und Kleinschreibung und ob die Feststelltaste eingeschaltet ist. Nach mehreren Versuchen hilft nur Ihre Administration weiter, siehe Abschnitt [Passwort vergessen?](./01-erste-schritte.md#_1-1-2-passwort-vergessen).

**Die Sitzung ist abgelaufen**

Ihre Anmeldung verlängert sich, solange Sie mit Qonnectra arbeiten. Liegt die Anwendung dagegen länger als eine Woche ungenutzt, ist sie abgelaufen: Der nächste Klick bringt Sie auf die Anmeldeseite. Melden Sie sich dort erneut an.

::: warning
Nach der erneuten Anmeldung landen Sie auf dem Dashboard, nicht auf der Seite, auf der Sie vorher waren. Notieren Sie sich vorher, wo Sie gearbeitet haben.
:::

::: danger
Läuft die Sitzung ab, während ein Formular offen steht, scheitert „Speichern“ mit der gewöhnlichen Fehlermeldung, und beim erneuten Anmelden gehen die Eingaben verloren. Kopieren Sie längere Texte vorher heraus.
:::

**Abmelden wirkt überall**

Die Anmeldung gilt für den ganzen Browser. Melden Sie sich in einem Reiter ab, sind auch die übrigen Reiter abgemeldet; der nächste Klick darin führt auf die Anmeldeseite.

## 18.3 Fehlende Rechte erkennen

Was Sie sehen und ändern dürfen, hängt an der Rolle Ihres Kontos, siehe Abschnitt [Warum manche Menüpunkte fehlen: Berechtigungen](./01-erste-schritte.md#_1-7-warum-manche-menupunkte-fehlen-berechtigungen). Fehlende Rechte zeigen sich auf drei Arten, und nur eine davon sagt es Ihnen auch:

1. **Der Menüpunkt fehlt.** Ein Bereich, den dieses Handbuch beschreibt, steht nicht in der Navigationsleiste.
2. **Die Anwendung springt weg.** Rufen Sie eine gesperrte Adresse direkt auf – über ein Lesezeichen oder einen Link –, landen Sie ohne jede Meldung in der Karte. Das sieht aus, als hätte der Link nicht funktioniert.
3. **Die Aktion scheitert.** Der Button ist da, die Rückfrage kommt, und danach erscheint die Meldung „Sie sind nicht berechtigt, diese Aktion durchzuführen.“ Die Daten bleiben unverändert.

![Screenshot einer Adresse mit Hervorhebung der Meldung „Sie sind nicht berechtigt, diese Aktion durchzuführen.“](/images/manual/teil-a/error_permission.jpg)

![](/videos/error_permission.webm)

Die Rechte sind nach Objektart und Stufe vergeben – ansehen, bearbeiten, löschen. Der häufigste Fall in der Praxis ist deshalb nicht ein gesperrter Bereich, sondern ein fehlendes Löschrecht: Mit der mitgelieferten Rolle „Editor“ dürfen Sie alle Fachdaten anlegen und ändern, aber nichts davon löschen. Welche Rollen es gibt und was sie umfassen, beschreibt Kapitel [Rollen und Rechte](../teil-b-betrieb-admin-qgis/19-rollen-und-rechte.md).

::: warning
Ein fehlendes Recht kann sich auch als vollständig fehlender Inhalt zeigen, ohne Button und ohne Meldung. So bleibt die Gruppe der externen Kartendienste in der Legende der Karte aus, wenn Ihr Konto sie nicht lesen darf, siehe Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster). Vermissen Sie etwas, das hier beschrieben ist, fragen Sie Ihre Administration, bevor Sie es für einen Fehler halten.
:::

## 18.4 Karte oder Diagramm bleibt leer

Eine leere Karte ist selten ein Defekt. Gehen Sie die Ursachen der Reihe nach durch:

1. **Das falsche Projekt.** Die Projektauswahl in der Kopfzeile bestimmt, was jede Ansicht zeigt. Prüfen Sie sie zuerst, siehe Abschnitt [Projekt auswählen und wechseln](./01-erste-schritte.md#_1-3-projekt-auswahlen-und-wechseln).
2. **Der Kartenausschnitt liegt woanders.** Die Karte rückt nicht von selbst auf die Daten, sondern öffnet sich dort, wo Sie sie zuletzt verlassen haben – nach einem Projektwechsel also womöglich hunderte Kilometer entfernt. Klappen Sie die Legende auf und wählen Sie beim Eintrag „Adresse“ „Auf Ausdehnung zoomen“, siehe Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster).
3. **Der Layer ist ausgeblendet.** Ein- und ausgeblendete Layer merkt sich der Browser über die Sitzung hinaus. Was Sie gestern ausgeblendet haben, fehlt heute noch.
4. **Die Zoomstufe reicht nicht.** Beschriftungen und externe Kartendienste erscheinen erst ab einer bestimmten Zoomstufe. Zoomen Sie weiter hinein.
5. **Ein Recht fehlt.** Siehe Abschnitt [Fehlende Rechte erkennen](#_18-3-fehlende-rechte-erkennen).

![Screenshot der Karte ohne Netzdaten im Ausschnitt, mit Hervorhebung der Projektauswahl in der Kopfzeile und des Eintrags „Adresse“ in der Legende](/images/manual/teil-a/error_map_empty.jpg)

::: info
Fehlt nur die Hintergrundkarte und die Netzdaten sind da, liegt es am Kartendienst und nicht an Ihren Daten. Qonnectra meldet das mit „Es konnten keine Kacheln geladen werden.“ Arbeiten lässt sich trotzdem: Alle Objekte sind weiter anklickbar.
:::

Bei den Auswertungen kommen zwei weitere Ursachen dazu:

- **Das Dashboard zeigt alte Zahlen.** Die Kennzahlen werden bis zu fünf Minuten zwischengespeichert; frisch erfasste Daten erscheinen verzögert, siehe Kapitel [Dashboard](./04-dashboard.md).
- **Es fehlen Spleiße.** Störungsanalyse, Netzschema und Faserweg rechnen über die Faserverbindungen. Sind für den betrachteten Bereich keine angelegt, ist das Ergebnis leer, obwohl Kabel vorhanden sind, siehe Kapitel [Störungsanalyse](./06-stoerungsanalyse.md) und [Faserweg](./15-faserweg.md).

::: warning
Eine Tabelle, die „Keine Ergebnisse gefunden“ zeigt, obwohl Sie nichts gefiltert haben und Daten vorhanden sein müssten, kann auch eine gestörte Verbindung zum Server bedeuten: Qonnectra unterscheidet an dieser Stelle nicht zwischen „nichts gefunden“ und „nicht geladen“. Laden Sie die Seite einmal neu, bevor Sie weitersuchen.
:::

## 18.5 Was das Support-Team von Ihnen braucht

Je genauer die Meldung, desto schneller die Antwort. Halten Sie fest:

- **Den Wortlaut der Meldung**, am besten als Bildschirmfoto der ganzen Ansicht.
- **Was Sie getan haben**, Schritt für Schritt bis zu dem Punkt, an dem es schiefging, und was Sie stattdessen erwartet hatten.
- **Das Projekt und das Objekt**, an dem es passiert ist – mit Adress-ID, Trassen-ID oder Rohrname, nicht nur „eine Adresse in Musterstadt“.
- **Die Adresse aus der Adresszeile des Browsers**. Sie enthält die Ansicht und das Objekt und ist deshalb oft die hilfreichste Angabe überhaupt.
- **Datum und ungefähre Uhrzeit.** Die Anwendung schreibt Fehler von sich aus in das Protokoll des Servers; mit der Uhrzeit findet Ihre Administration den passenden Eintrag, siehe Kapitel [Betrieb der Instanz](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md).
- **Die Versionsnummer** aus der Kopfzeile, z. B. „v1.7.0“, sowie Browser und Betriebssystem.

![Screenshot der Kopfzeile mit Hervorhebung der Projektauswahl links und der Versionsnummer rechts](/images/manual/teil-a/error_support_info.jpg)

::: danger
Legen Sie Ihr Passwort niemals bei. Niemand aus dem Support und niemand aus Ihrer Administration braucht es – ein Konto lässt sich auch ohne zurücksetzen.
:::

::: info
Ist die Anwendung gar nicht erreichbar oder antwortet sie auf jeder Seite mit einem Fehler, ist das kein Fall für die Fachabteilung, sondern für den Betrieb der Instanz. Nennen Sie dann zusätzlich, ob es nur Sie betrifft oder alle im Haus.
:::
