# 28. Betrieb der Instanz

Dieses Kapitel richtet sich an die Stelle, die den Server betreibt, auf dem Qonnectra läuft. Es beschreibt, aus welchen Diensten eine Installation besteht, welche Einstellungen im laufenden Betrieb angefasst werden, und wie Aktualisierung, Sicherung, Protokolle und die Hintergrundkarte gehandhabt werden. Die Installation selbst und die vollständige Liste der Einstellungen beschreibt Teil C, siehe Kapitel [Bereitstellung und Infrastruktur](../teil-c-entwicklungs-systemdokumentation/35-bereitstellung-und-infrastruktur.md).

Alle Befehle dieses Kapitels werden auf dem Server im Ordner `deployment` der Installation ausgeführt.

## 28.1 Systemüberblick: Dienste und ihre Aufgaben

Qonnectra läuft als Gruppe von Docker-Containern, beschrieben in `docker-compose.yml`:

| Dienst | Aufgabe |
|---|---|
| `caddy` | nimmt alle Anfragen aus dem Internet an, verteilt sie nach Adresse auf die übrigen Dienste und holt die HTTPS-Zertifikate; liefert außerdem den WebDAV-Zugang aus |
| `frontend` | die Weboberfläche |
| `nginx` | leitet Anfragen an das Backend weiter, liefert Anhänge aus und hält Kartenkacheln und WMS-Bilder zwischengespeichert |
| `backend` | die Schnittstelle und der Administrationsbereich |
| `backend-wms` | ein zweites Backend nur für den WMS-Proxy, damit langsame Kartendienste die übrige Anwendung nicht ausbremsen |
| `db` | die Datenbank, PostgreSQL mit PostGIS |
| `qgis-server` | die Kartendienste, siehe Kapitel [QGIS-Server und Kartendienste](./27-qgis-server-und-kartendienste.md) |
| `tileserver` | die Hintergrundkarte, siehe Abschnitt [Kartenkacheln bereitstellen und erneuern](#_28-6-kartenkacheln-bereitstellen-und-erneuern) |
| `pg-error-parser` | liest die Fehler der Datenbank mit und schreibt sie in die Protokolle, siehe Abschnitt [Protokolle auswerten](#_28-5-protokolle-auswerten) |
| `wireguard` | das VPN für den direkten Datenbankzugang aus QGIS; startet immer und öffnet nach außen den UDP-Port 51820 (`WIREGUARD_PORT`), auch wenn kein QGIS-Arbeitsplatz ihn nutzt |

Nach außen hat eine Installation sechs Adressen, je eine für die Weboberfläche (`app.`), die Schnittstelle (`api.`), den Administrationsbereich (`admin.`), den WebDAV-Zugang (`files.`), den QGIS-Server (`qgis.`) und die Hintergrundkarte (`tiles.`).

Die Daten liegen in Docker-Volumes: die Datenbank in `qonnectra_postgres_data_prod`, die Anhänge in `qonnectra_media_prod`, die Zertifikate in `qonnectra_caddy_data_prod`, der Zwischenspeicher der WMS-Bilder in `qonnectra_wms_cache_prod`. In `docker-compose.yml` stehen sie unter kürzeren Namen (`postgres_data`, `media_volume` usw.); `docker volume ls` zeigt die vollständigen. Die hinterlegten QGIS-Projekte und ihre Datendateien liegen im Ordner `deployment/qgis`.

## 28.2 Konfiguration über Umgebungsvariablen

Die Einstellungen stehen in der Datei `deployment/.env`. Die vollständige Liste beschreibt Kapitel [Bereitstellung und Infrastruktur](../teil-c-entwicklungs-systemdokumentation/35-bereitstellung-und-infrastruktur.md); im laufenden Betrieb werden vor allem diese angefasst:

- **Adressen** – `APP_DOMAIN`, `API_DOMAIN`, `ADMIN_DOMAIN`, `FILES_DOMAIN`, `QGIS_DOMAIN`, `TILE_SERVER_DOMAIN`. Jede Adresse muss außerdem in `DJANGO_ALLOWED_HOSTS` stehen, die Adressen von Weboberfläche und Administrationsbereich zusätzlich in `CSRF_TRUSTED_ORIGINS`.
- **`COOKIE_DOMAIN`** – die gemeinsame Domain aller Adressen mit führendem Punkt, etwa `.ihre-domain.de`. Die Anmeldung gilt über sie für alle Adressen.
- **`PUBLIC_DOCUMENTATION_URL`** – der Link „Dokumentation“ in Kopfzeile und Navigationsleiste; leer blendet ihn aus.
- **`QGIS_SERVER_VERSION`** – die Version des QGIS-Servers, für die Warnung beim Hochladen von QGIS-Projekten.
- **`WIREGUARD_PEERS`** – die Namen der VPN-Zugänge, siehe Abschnitt [Verbindung zur PostGIS-Datenbank](./25-qgis-arbeitsplatz-einrichten.md#_25-2-verbindung-zur-postgis-datenbank-und-zu-den-diensten).

Das erste Superuser-Konto legt das Backend aus `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_PASSWORD` und `DJANGO_SUPERUSER_EMAIL` an. Es prüft das bei jedem Start und legt das Konto nur an, wenn es noch keines mit diesem Benutzernamen gibt. Setzen Sie die drei Werte vor dem ersten Start; die Vorlage enthält für das Passwort nur einen Platzhalter.

::: warning
Ein später in `.env` geändertes Passwort ändert das bestehende Konto nicht; setzen Sie es im Benutzerformular des Administrationsbereichs neu, siehe Abschnitt [Benutzende und Gruppen anlegen](./19-rollen-und-rechte.md#_19-1-benutzende-und-gruppen-anlegen). Ein geänderter Benutzername legt beim nächsten Start ein weiteres Superuser-Konto an.
:::

::: danger
`FIELD_ENCRYPTION_KEY` verschlüsselt die Passwörter der WMS-Quellen. Geht der Schlüssel verloren oder wird er geändert, lassen sich diese Passwörter nicht mehr lesen, und jede WMS-Quelle mit Anmeldung muss neu eingegeben werden. Sichern Sie die Datei `.env` mit, siehe Abschnitt [Sicherung und Wiederherstellung](#_28-4-sicherung-und-wiederherstellung).
:::

::: warning
Ändern Sie `DB_PASSWORD` und `QGIS_DB_PASSWORD` nicht in der Datei allein. Die Datenbank übernimmt sie nur beim ersten Start; danach passt die Datei nicht mehr zur Datenbank, und Backend und QGIS-Server erreichen sie nicht.
:::

::: warning
`DEFAULT_SRID` legt das Koordinatenbezugssystem der Geometrien fest. Ändern Sie es nie, sobald Daten erfasst sind – die vorhandenen Koordinaten würden danach falsch gelesen.
:::

Eine geänderte Variable wirkt erst, wenn die betroffenen Dienste neu erstellt werden:

```bash
docker compose up -d
```

Die Adresse der Schnittstelle (`API_URL`, `PUBLIC_API_URL`) ist in die Weboberfläche eingebaut. Wer sie ändert, muss die Weboberfläche neu bauen:

```bash
docker compose up -d --build frontend
```

## 28.3 Aktualisierung auf eine neue Version

Qonnectra wird aus dem Quellcode gebaut. Eine Aktualisierung:

1. Sichern Sie Datenbank, Anhänge und `.env`, siehe Abschnitt [Sicherung und Wiederherstellung](#_28-4-sicherung-und-wiederherstellung).
2. Lesen Sie im `CHANGELOG.md` der neuen Version, ob sie neue Umgebungsvariablen verlangt, und vergleichen Sie `deployment/.env` mit `.env.production.template`.
3. Holen Sie die neue Version, etwa mit `git fetch --tags` und `git checkout v1.8.0`.
4. Bauen und starten Sie die Dienste neu:

   ```bash
   docker compose up -d --build
   ```

5. Prüfen Sie mit `docker compose ps`, dass alle Dienste laufen, und melden Sie sich in der Weboberfläche und im Administrationsbereich an.

Beim Start bringt das Backend die Datenbank selbst auf den neuen Stand. Bis dahin antworten Weboberfläche und Schnittstelle mit Fehlern; das dauert je nach Umfang der Änderungen einige Minuten.

::: warning
Neue Stammdaten, die eine Version mitbringt, kommen nur in eine leere Installation. Das Backend lädt seine Grundausstattung gruppenweise und überspringt jede Gruppe, von der es schon Einträge gibt. Bringt eine Version etwa einen neuen Netzknotentyp mit, legen Sie ihn in einer bestehenden Installation selbst an, siehe Kapitel [Projekte und Stammdaten pflegen](./21-projekte-und-stammdaten.md).
:::

Die Versionsnummer in der Kopfzeile der Weboberfläche zeigt nach der Aktualisierung die neue Version, siehe Abschnitt [Sprache, Hell- und Dunkelmodus, Versionsanzeige und Dokumentation](../teil-a-anwenderhandbuch/01-erste-schritte.md#_1-4-sprache-hell-und-dunkelmodus-versionsanzeige-und-dokumentation).

## 28.4 Sicherung und Wiederherstellung

Eine vollständige Sicherung umfasst:

- die Datenbank,
- die Anhänge im Volume `qonnectra_media_prod`,
- die QGIS-Projekte und ihre Datendateien in `deployment/qgis`,
- die Datei `deployment/.env`,
- die Zertifikate im Volume `qonnectra_caddy_data_prod` und die VPN-Zugänge in `deployment/wireguard`, falls verwendet.

Die Datenbank allein sichern Sie mit:

```bash
docker compose exec -T db pg_dump -U <DB_USER> -d <DB_NAME> --format=custom > qonnectra.dump
```

Datenbank und Anhänge gehören zusammen: Jeder Anhang hat einen Eintrag in der Datenbank, siehe Kapitel [Dateien und Anhänge verwalten](./23-dateien-und-anhaenge.md). Sichern Sie beide zur selben Zeit; eine ältere Datenbank mit neueren Anhängen ergibt Dateien ohne Eintrag, eine neuere Datenbank mit älteren Anhängen Einträge ohne Datei.

Im Ordner `deployment/backup` liegen zwei Skripte, `backup.sh` und `restore.sh`, die das alles erledigen und die Sicherungen zusätzlich mit `rclone` an einen entfernten Speicher übertragen. Sie lesen ihre Einstellungen – Zielordner, Namen der Container und Volumes, Ziel von `rclone`, Aufbewahrungsdauer – aus einer Datei `backup.conf` daneben, die Sie selbst anlegen; sie wird nicht mitgeliefert. Richten Sie `backup.sh` als nächtliche Aufgabe ein. `restore.sh` mit einem Datum stellt die Sicherung dieses Tages wieder her, mit `--db-only` oder `--media-only` nur einen Teil, mit `--list` zeigt es die vorhandenen Sicherungen.

::: warning
Tragen Sie in `backup.conf` unter `MEDIA_VOLUME` und `CADDY_VOLUME` die vollständigen Namen der Volumes ein, `qonnectra_media_prod` und `qonnectra_caddy_data_prod`, nicht die kurzen aus `docker-compose.yml`. Ein Volume mit falschem Namen legt Docker beim Sichern ohne Meldung neu und leer an – die Sicherung läuft durch und enthält keine Anhänge.
:::

::: danger
Eine Wiederherstellung ersetzt die Datenbank vollständig. Alles, was seit der Sicherung erfasst wurde, ist danach verloren. Stellen Sie im Zweifel zuerst in eine zweite Installation wieder her und übernehmen Sie nur, was fehlt.
:::

::: warning
Auch mit einem Datum stellt `restore.sh` nicht die Anhänge dieses Tages her. Die Anhänge liegen in einem einzigen Spiegel am entfernten Speicher, den jede Sicherung nur ergänzt und aus dem nie etwas gelöscht wird. Wiederhergestellt wird immer der Stand der letzten Sicherung, samt aller Dateien, die in Qonnectra inzwischen gelöscht wurden; zu einer älteren Datenbank ergibt das Dateien ohne Eintrag.

Die Datei `.env` stellt das Skript nicht wieder her, es nennt nur den Pfad der gesicherten Kopie. Vergleichen und übernehmen Sie sie selbst.

`restore.sh` liest `.env` als Shell-Skript ein und bricht sofort ab, wenn eine Zeile dort Leerzeichen um das Gleichheitszeichen hat. Die Vorlage `.env.production.template` enthält eine solche Zeile (`COOKIE_DOMAIN = .your-domain.com`). Schreiben Sie jede Zuweisung ohne Leerzeichen, etwa `COOKIE_DOMAIN=.ihre-domain.de`.
:::

Prüfen Sie Sicherungen regelmäßig durch eine Wiederherstellung auf einem Testsystem.

## 28.5 Protokolle auswerten

Qonnectra schreibt Fehler und Warnungen in eine eigene Protokolltabelle. Jeder Eintrag hat eine Stufe, eine Quelle, das Konto, das Projekt und die Nachricht. Es gibt drei Quellen:

- **„Backend“** – Fehler und Warnungen der Schnittstelle, etwa ein abgelehnter Import oder eine Anfrage, die mit einem Serverfehler endete.
- **„Frontend“** – Fehler, die im Browser der Nutzenden auftreten und die die Weboberfläche meldet, etwa ein gescheitertes Hochladen eines Anhangs oder eine Suche ohne Antwort.
- **„WFS (QGIS Server)“** – jeder Fehler, den die Datenbank meldet, etwa ein abgelehntes Löschen aus QGIS, siehe Kapitel [Netzdaten in QGIS bearbeiten](./26-netzdaten-in-qgis-bearbeiten.md). Trotz des Namens stehen hier auch Datenbankfehler, die die Weboberfläche ausgelöst hat. Diese Einträge haben weder Konto noch Projekt.

Die Einträge sehen Sie an zwei Stellen. In der Weboberfläche unter „Logs“ am Fuß der Navigationsleiste, mit Filtern nach Stufe, Quelle, Projekt, Text und Zeitraum:

![Screenshot der Seite „Logs“ der Weboberfläche mit den Filtern oben und der Liste der Einträge darunter](/images/manual/teil-b/ops_logs.jpg)

Wer die Seite öffnen darf, beschreibt Abschnitt [Superuser gegenüber Gruppenmitgliedschaft](./19-rollen-und-rechte.md#_19-4-superuser-gegenuber-gruppenmitgliedschaft).

Im Administrationsbereich unter „Log-Einträge“, mit denselben Filtern und zusätzlich zwei Aktionen zum Löschen: „Ausgewählte Log-Einträge löschen“ für die angehakten Einträge und „Alle Log-Einträge mit aktuellen Filtern löschen“ für alle, die der Filter zeigt.

![Screenshot der Log-Einträge im Administrationsbereich mit Hervorhebung der Filter rechts und der Aktionen über der Liste, Ausschnitt des oberen Teils](/images/manual/teil-b/ops_logs_admin.jpg)

::: warning
Die Protokolltabelle wächst ohne Grenze; Qonnectra löscht keine Einträge von selbst. Löschen Sie alte Einträge regelmäßig, etwa alle, die älter als ein Jahr sind. Ohne Filter löscht „Alle Log-Einträge mit aktuellen Filtern löschen“ das gesamte Protokoll.
:::

Meldet jemand einen Fehler, finden Sie den Eintrag über Zeitpunkt und Konto, siehe Abschnitt [Was das Support-Team von Ihnen braucht](../teil-a-anwenderhandbuch/18-wenn-etwas-nicht-funktioniert.md#_18-5-was-das-support-team-von-ihnen-braucht). Einträge der Quelle „WFS (QGIS Server)“ finden Sie nur über den Zeitpunkt; ein Filter nach Projekt blendet sie aus. Mehr als die Protokolltabelle zeigen die Ausgaben der Container selbst:

```bash
docker compose logs --since 1h backend
```

Docker behält davon je Dienst nur die letzten 30 MB – außer bei `nginx` und `caddy`, deren Ausgaben `docker-compose.yml` nicht begrenzt. Sie wachsen, solange die Docker-Einstellungen des Servers keine Grenze setzen.

## 28.6 Kartenkacheln bereitstellen und erneuern

Die Hintergrundkarte der Weboberfläche liefert der Dienst `tileserver` aus einer Kacheldatei im Format MBTiles, die im Ordner `deployment/tiles` liegt; ihren Namen nennt `deployment/tiles/config.json`. Qonnectra bringt keine Kacheldatei mit. Sie wird aus Daten von OpenStreetMap erzeugt, mit dem Werkzeug [Planetiler](https://github.com/onthegomap/planetiler), für das Gebiet, in dem die Netze liegen – ein Bundesland genügt meist.

So erneuern Sie die Karte:

1. Erzeugen Sie eine neue Kacheldatei mit Planetiler aus einem aktuellen Auszug von OpenStreetMap.
2. Legen Sie sie in `deployment/tiles` ab und tragen Sie ihren Namen in `config.json` ein.
3. Starten Sie den Dienst neu: `docker compose restart tileserver`.

Die Adresse des Kachelservers steht in `PUBLIC_TILE_SERVER_URL`. Fehlt sie, zeigt die Karte stattdessen die Kacheln von OpenStreetMap aus dem Internet.

::: warning
Fehlt die Kacheldatei, startet der Dienst `tileserver` immer wieder neu; `docker compose ps` zeigt ihn dann als „Restarting“. Die Karte zeigt in dieser Zeit die Kacheln von OpenStreetMap aus dem Internet und bleibt nur leer, wenn auch diese nicht erreichbar sind. Der Ausfall fällt in der Weboberfläche deshalb kaum auf.
:::

## 28.7 Häufige Störungen und ihre Behebung

| Anzeichen | Ursache | Behebung |
|---|---|---|
| Nach einem Neustart des Backends antwortet die Schnittstelle dauerhaft mit „502“ | `nginx` hält die alte interne Adresse des Backends fest | `docker compose restart nginx` |
| Anmeldung in der Weboberfläche führt sofort zurück zur Anmeldeseite | `COOKIE_DOMAIN` passt nicht zu den Adressen | `COOKIE_DOMAIN` auf die gemeinsame Domain mit führendem Punkt setzen |
| Anmeldung im Administrationsbereich endet mit „403“ | Adresse des Administrationsbereichs fehlt in `CSRF_TRUSTED_ORIGINS` | ergänzen, `docker compose up -d` |
| WebDAV oder die Dienste des QGIS-Servers antworten auf jede Anmeldung mit „400“ | `files.`- oder `qgis.`-Adresse fehlt in `DJANGO_ALLOWED_HOSTS` | ergänzen, `docker compose up -d` |
| Hintergrundkarte zeigt die Kacheln von OpenStreetMap statt der eigenen oder bleibt leer, `tileserver` startet ständig neu | Kacheldatei fehlt oder `config.json` nennt einen falschen Namen | siehe Abschnitt [Kartenkacheln](#_28-6-kartenkacheln-bereitstellen-und-erneuern) |
| WMS-Layer zeigt veraltete Bilder | Zwischenspeicher des WMS-Proxys | `docker compose exec nginx sh -c 'rm -rf /var/cache/nginx/wms/*'` |
| WMS-Quellen mit Anmeldung liefern nichts mehr | `FIELD_ENCRYPTION_KEY` geändert | alten Schlüssel wiederherstellen oder Passwörter neu eingeben |
| Neue Daten erscheinen in der Karte erst nach einer halben Minute, in bisher leeren Kartenbereichen nach bis zu zehn Minuten, im Dashboard nach Minuten | Zwischenspeicher, gewollt | abwarten, siehe Abschnitt [Gleichzeitiges Arbeiten mit der Weboberfläche](./26-netzdaten-in-qgis-bearbeiten.md#_26-3-gleichzeitiges-arbeiten-mit-der-weboberflache) |

::: info
Der Administrationsbereich und der WebDAV-Zugang sind aus dem ganzen Internet erreichbar. Wer sie auf das eigene Netz oder das VPN beschränken will, ergänzt in `Caddyfile.production` bei der jeweiligen Adresse eine Sperre nach Absender-IP; ein Beispiel steht dort beim Administrationsbereich als Kommentar.
:::
