# 35. Bereitstellung und Infrastruktur

Dieses Kapitel beschreibt, wie eine Installation von Qonnectra auf einem Server entsteht, wie ihre Dienste gebaut und eingestellt sind und was für einen sicheren Betrieb zu tun ist. Den laufenden Betrieb – Aktualisierung, Sicherung, Protokolle, Kartenkacheln, Störungen – beschreibt Kapitel [Betrieb der Instanz](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md); welche Dienste es gibt und wofür, steht dort in Abschnitt [Systemüberblick](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-1-systemuberblick-dienste-und-ihre-aufgaben).

Alle Pfade sind relativ zum Wurzelverzeichnis des Repositorys, alle Befehle laufen im Ordner `deployment`.

## 35.1 Erstinstallation auf einem Server

**Voraussetzungen**

- Ein Linux-Server mit mindestens 8 CPU-Kernen und 16 GB Arbeitsspeicher; auf diese Größe sind die Speichergrenzen der Dienste in `docker-compose.yml` eingestellt.
- Docker Engine und Docker Compose 2.24.4 oder neuer mit BuildKit. Die Images werden auf dem Server gebaut; ohne BuildKit scheitert der Build des Frontends mit „unknown flag: mount“.
- Sechs DNS-Einträge, die auf den Server zeigen, etwa `app.`, `api.`, `admin.`, `files.`, `qgis.` und `tiles.` unter einer gemeinsamen Domain.
- Offene Ports 80 und 443 (TCP) für Caddy und die Zertifikate von Let’s Encrypt, 51820 (UDP), wenn QGIS-Arbeitsplätze direkt auf die Datenbank zugreifen sollen.
- Eine Kacheldatei für die Hintergrundkarte, siehe Abschnitt [Kartenkacheln bereitstellen und erneuern](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-6-kartenkacheln-bereitstellen-und-erneuern).

**Ablauf**

1. Holen Sie den Quellcode und wechseln Sie auf die gewünschte Version:

   ```bash
   git clone https://github.com/Geodock-GmbH/Qonnectra.git qonnectra
   cd qonnectra
   git checkout <Version>   # etwa das Tag der neuesten Version
   cd deployment
   ```

2. Legen Sie die Einstellungen an und setzen Sie jeden Wert, siehe Abschnitt [Referenz der Umgebungsvariablen](#_35-7-referenz-der-umgebungsvariablen):

   ```bash
   cp .env.production.template .env
   chmod 600 .env
   ```

   Drei Stellen der Vorlage führen zu Fehlern:

   - `COOKIE_DOMAIN = .your-domain.com` steht mit Leerzeichen um das Gleichheitszeichen. Schreiben Sie `COOKIE_DOMAIN=.ihre-domain.de`; die Skripte der Sicherung lesen die Datei sonst nicht.
   - `DJANGO_ALLOWED_HOSTS` enthält die Platzhalter `BACKEND_SERVICE_NAME`, `QGIS_SERVER_SERVICE_NAME` und `CADDY_SERVICE_NAME`. Ersetzen Sie sie durch `backend` – unter diesem Namen fragt das Frontend das Backend im Docker-Netz an – und lassen Sie die beiden anderen weg.
   - `API_URL` und `PUBLIC_API_URL` sind nur beschrieben, nicht ausgefüllt: `API_URL=http://backend:8000/api/v1/` und `PUBLIC_API_URL=https://api.ihre-domain.de/api/v1/`.

3. Erzeugen Sie die Schlüssel, die die Vorlage verlangt, und tragen Sie sie ein:

   ```bash
   python3 -c 'import secrets; print(secrets.token_urlsafe(50))'       # DJANGO_SECRET_KEY
   python3 -c 'import base64, os; print(base64.urlsafe_b64encode(os.urandom(32)).decode())'  # FIELD_ENCRYPTION_KEY
   ```

   Der zweite Befehl erzeugt einen Schlüssel im Fernet-Format, ohne dass `cryptography` installiert sein muss. Erzeugen Sie `DB_PASSWORD`, `QGIS_DB_PASSWORD` und `DJANGO_SUPERUSER_PASSWORD` mit dem ersten Befehl ebenso; seine Zeichen sind in allen Skripten, die die Werte weiterverarbeiten, unbedenklich.

4. Legen Sie die Kacheldatei in `tiles/` ab und tragen Sie ihren Namen in `tiles/config.json` ein.

5. Legen Sie `docker-compose.override.yml` an, siehe Abschnitt [Container und Images](#_35-2-container-und-images). Sie nimmt die Anpassungen auf, die bei einer Aktualisierung erhalten bleiben sollen.

6. Bauen und starten Sie alle Dienste:

   ```bash
   docker compose up -d --build
   ```

   Sind `QGIS_DB_USER` und `QGIS_DB_PASSWORD` gesetzt, bricht der allererste Start der Datenbank ab, siehe Abschnitt [Varianten der Docker-Compose-Dateien](./30-entwicklungsumgebung.md#_30-4-varianten-der-docker-compose-dateien). Rufen Sie den Befehl dann ein zweites Mal auf.

7. Warten Sie, bis `docker compose ps` alle Dienste als laufend zeigt. Das Backend legt beim ersten Start die Tabellen an, lädt die Stammdaten und legt das erste Superuser-Konto aus `DJANGO_SUPERUSER_*` an; das dauert einige Minuten. Caddy holt währenddessen die Zertifikate.

8. Schränken Sie die Rechte des QGIS-Datenbankbenutzers ein, siehe Abschnitt [Datenbank, PostGIS und Datenbankzugang](#_35-4-datenbank-postgis-und-datenbankzugang).

9. Melden Sie sich unter `https://admin.ihre-domain.de/admin/` mit dem Superuser an und legen Sie Konten, Projekte und Stammdaten an, siehe die Kapitel [Rollen und Rechte](../teil-b-betrieb-admin-qgis/19-rollen-und-rechte.md) und [Projekte und Stammdaten pflegen](../teil-b-betrieb-admin-qgis/21-projekte-und-stammdaten.md).

## 35.2 Container und Images

Fünf Images entstehen auf dem Server aus dem Repository, die übrigen kommen fertig aus Docker Hub bzw. der Registry von LinuxServer.io. Veröffentlichte Images von Qonnectra gibt es nicht; jede Installation baut selbst.

| Dienst | Image | Grundlage |
|---|---|---|
| `db` | `qonnectra/db:latest`, gebaut | `postgis/postgis:17-3.5` mit pgRouting |
| `backend`, `backend-wms`, `pg-error-parser` | `qonnectra/backend:latest` bzw. `qonnectra/pg-error-parser:latest`, gebaut | `python:3.12-slim` mit GDAL, gettext und der Docker-Kommandozeile |
| `frontend` | `qonnectra/frontend:latest`, gebaut | `node:22-alpine`, zweistufig: Build, dann nur das Ergebnis |
| `caddy` | `qonnectra/caddy:latest`, gebaut | `caddy:2` mit dem Modul `caddy-webdav` |
| `qgis-server` | `qgis/qgis-server:3.44.7-noble` | – |
| `nginx` | `nginx:stable-alpine` | – |
| `tileserver` | `maptiler/tileserver-gl:v5.6.0` | – |
| `wireguard` | `lscr.io/linuxserver/wireguard:latest` | – |

Nicht alles davon ist auf eine Version festgelegt: u. a. `caddy:2`, das Modul `caddy-webdav`, `nginx:stable-alpine`, `wireguard:latest`, die Grundlagen `python:3.12-slim`, `node:22-alpine` und `postgis/postgis:17-3.5`, die Systempakete in den Images und die Python-Pakete des Backends, siehe Abschnitt [Technologiestack](./29-architekturueberblick.md#_29-2-technologiestack), ergeben bei jedem Build den Stand dieses Tages. Zwei Builds derselben Version von Qonnectra an zwei Tagen sind deshalb nicht gleich.

Das Backend führt bei jedem Start nacheinander `compilemessages`, `collectstatic`, `migrate`, das Anlegen des Superusers und `load_initial_data` aus und startet dann gunicorn mit sechs Workern. `backend-wms` startet aus demselben Image nur gunicorn mit vier Workern und bedient allein den WMS-Proxy. `pg-error-parser` liest über den eingebundenen Docker-Socket die Ausgaben des Datenbank-Containers mit; dafür enthält das Image die Docker-Kommandozeile.

Alle Dienste hängen in einem Netz, `qonnectra_network_prod`; nach außen öffnen nur Caddy (80, 443) und WireGuard (51820/udp) Ports. Healthchecks haben nur `db` und `qgis-server`. Daten liegen in sechs Volumes und einigen Ordnern unter `deployment/`; die wichtigsten nennt Abschnitt [Systemüberblick](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-1-systemuberblick-dienste-und-ihre-aufgaben).

**Eigene Anpassungen** gehören in `docker-compose.override.yml`, nicht in `docker-compose.yml`: Docker Compose liest die Datei automatisch mit, und sie übersteht ein `git checkout` auf eine neue Version. Für eine Installation auf einem Server empfiehlt sich:

```yaml
services:
  frontend:
    env_file: !reset []
```

Die Zeile beschränkt die Umgebung des Dienstes `frontend` auf die Werte, die `docker-compose.yml` ihm unter `environment` einzeln übergibt.

Docker begrenzt die Ausgaben von `nginx` und `caddy` nicht, siehe Abschnitt [Protokolle auswerten](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-5-protokolle-auswerten). Dieselbe Datei kann ihnen die Grenze der übrigen Dienste geben:

```yaml
services:
  nginx:
    logging:
      driver: json-file
      options: { max-size: "10m", max-file: "3" }
  caddy:
    logging:
      driver: json-file
      options: { max-size: "10m", max-file: "3" }
```

Solange `deployment/postgres/Dockerfile` pgRouting aus dem nicht mehr gepflegten Repository für Debian 11 holt, gehört außerdem die Umstellung auf das Archiv aus Abschnitt [Varianten der Docker-Compose-Dateien](./30-entwicklungsumgebung.md#_30-4-varianten-der-docker-compose-dateien) in die Datei.

## 35.3 Reverse Proxy: Caddy und nginx

**Caddy** nimmt alle Anfragen an, siehe die Tabelle in Abschnitt [Komponenten und Weg einer Anfrage](./29-architekturueberblick.md#_29-1-komponenten-und-weg-einer-anfrage). Die Konfiguration steht in `deployment/Caddyfile.production` und liest die Adressen aus den Variablen `*_DOMAIN`. Caddy

- holt für jede Adresse ein Zertifikat bei Let’s Encrypt und erneuert es selbst; die Zertifikate liegen im Volume `caddy_data`,
- setzt auf allen Adressen HSTS, `X-Content-Type-Options` und – außer bei `qgis.` und `tiles.` – `X-Frame-Options: DENY`, und entfernt den Header `Server`,
- prüft jede Anfrage an `files.` und `qgis.` vorab beim Backend (`forward_auth`), siehe Abschnitt [Authentifizierung](./32-rest-api.md#_32-1-authentifizierung-jwt-cookies-token-rotation),
- liefert unter `files.` den Medienordner per WebDAV aus, eingebunden nur lesend, siehe Abschnitt [Zugriff auf die Medien über WebDAV](../teil-b-betrieb-admin-qgis/23-dateien-und-anhaenge.md#_23-4-zugriff-auf-die-medien-uber-webdav),
- begrenzt Uploads unter `qgis.` auf 100 MB.

Jeder Adressblock bindet zusätzlich alle Dateien `*.caddy` aus einem eigenen Ordner unter `deployment/caddy/extra/` ein – `api/`, `admin/`, `app/`, `files/`, `qgis/`, `tileserver/` –, dazu `sites/` für ganz eigene Adressen. Der Ordner steht nicht unter Versionskontrolle. Eigene Regeln gehören dorthin statt in `Caddyfile.production`; sie überstehen damit jede Aktualisierung.

Legen Sie dort z. B. die Datei `deployment/caddy/extra/admin/intern.caddy` an; sie beschränkt den Administrationsbereich auf die öffentlichen Adressen des eigenen Netzes. `203.0.113.0/24` ist ein Platzhalter aus dem Dokumentationsbereich:

```text
@extern not remote_ip 203.0.113.0/24
handle @extern {
    respond 403
}
```

Dieselbe Datei unter `files/` beschränkt den WebDAV-Zugang. Verwenden Sie die Form mit `handle`: Ein bloßes `respond @extern 403` ordnet Caddy im Block `files.` hinter die Anmeldeprüfung und WebDAV ein, und es greift dort nicht.

Caddy sieht die Adresse, mit der eine Anfrage aus dem Internet kommt. Das VPN aus Abschnitt [Datenbank, PostGIS und Datenbankzugang](#_35-4-datenbank-postgis-und-datenbankzugang) hilft hier nicht: Es leitet nur die Adressen `10.13.13.0/24` um, Anfragen an `admin.` laufen weiter über das Internet.

Nach einer Änderung an diesen Dateien lädt `docker compose restart caddy` die Konfiguration neu.

**nginx** steht zwischen Caddy und dem Backend (`deployment/nginx/nginx.conf`, `deployment/nginx/default.conf`). Es

- liefert die statischen Dateien des Administrationsbereichs aus dem Volume `static_volume` aus,
- liefert Anhänge aus dem Medienordner aus, aber nur auf Anweisung des Backends: `/media/` ist `internal`, und erst ein `X-Accel-Redirect` des Backends öffnet eine Datei,
- leitet `/api/v1/wms-proxy/` an `backend-wms` und hält die Antworten bis zu 30 Tage im Volume `wms_cache` (höchstens 10 GB),
- hält die Vektorkacheln der Netzobjekte 30 Sekunden, leere Kacheln zehn Minuten (höchstens 2 GB, im Container, nicht in einem Volume),
- leitet alles andere an `backend` und lässt Anfragen bis 100 MB zu.

nginx löst die Namen `backend` und `backend-wms` nur beim eigenen Start auf. Wird das Backend neu erstellt, muss nginx neu starten, siehe Abschnitt [Häufige Störungen](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-7-haufige-storungen-und-ihre-behebung).

## 35.4 Datenbank, PostGIS und Datenbankzugang

Die Datenbank ist PostgreSQL 17 mit PostGIS 3.5. Sie läuft im Dienst `db` mit einer Speichergrenze von 6 GB; die Einstellungen für diese Größe – `shared_buffers`, `work_mem` usw. – übergibt `docker-compose.yml` beim Start als Parameter. Einen Port nach außen öffnet sie nicht.

Beim allerersten Start mit leerem Volume führt das Image `deployment/postgres/init.sh` aus. Das Skript legt die Erweiterungen PostGIS, pgRouting, `dblink` und `pgcrypto` an, stellt Zeichensatz und Zeitzone (`Europe/Berlin`) des Hauptbenutzers ein und legt, wenn `QGIS_DB_USER` und `QGIS_DB_PASSWORD` gesetzt sind, einen zweiten Benutzer für QGIS an. Danach läuft das Skript nie wieder; was es einstellt, ändert eine neue `.env` nicht, siehe Abschnitt [Konfiguration über Umgebungsvariablen](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-2-konfiguration-uber-umgebungsvariablen).

**Der QGIS-Datenbankbenutzer** dient zwei Zwecken: QGIS Server liest mit ihm die Layer der hinterlegten Projekte, und QGIS-Arbeitsplätze bearbeiten mit ihm über das VPN die Netzdaten, siehe Abschnitt [Verbindung zur PostGIS-Datenbank](../teil-b-betrieb-admin-qgis/25-qgis-arbeitsplatz-einrichten.md#_25-2-verbindung-zur-postgis-datenbank-und-zu-den-diensten). `init.sh` gibt ihm Lese- und Schreibrechte auf alle Tabellen, auch auf alle, die später entstehen. Beschränken Sie ihn nach dem ersten Start auf die Netzdaten, indem Sie ihm die Tabellen der Konten, Rechte und Einstellungen entziehen:

```bash
docker compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND (tablename LIKE 'auth\_%' OR tablename LIKE 'django\_%' OR tablename LIKE 'token\_blacklist\_%'
           OR tablename LIKE 'authtoken\_%'
           OR tablename IN ('model_permission', 'route_permission', 'user_settings', 'wms_source',
                            'api_historicalwmssource', 'wms_layer', 'api_historicalwmslayer', 'log_entry'))
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM %I', t, 'qgis_user');
  END LOOP;
END $$;
SQL
```

Ersetzen Sie `qgis_user` durch den Wert von `QGIS_DB_USER`. Danach kann der Benutzer Trassen, Netzknoten und alle übrigen Netzdaten weiter lesen und schreiben, ebenso die Auswahllisten, aber keine Konten, Gruppen, Rechte, Sitzungen, Benutzereinstellungen, WMS-Quellen und Protokolle mehr. Lesbar bleibt auch die Leitungsauskunft (`pipeline_record`) mit Namen und Telefonnummern der anfragenden Stellen; wird sie in QGIS nicht gebraucht, nehmen Sie `pipeline_record`, `pipeline_inquiry_area`, `api_historicalpipelinerecord` und `api_historicalpipelineinquiryarea` in die Liste auf.

::: warning
Neue Tabellen, die eine spätere Version mit ihren Migrationen anlegt, bekommt der QGIS-Benutzer wieder mit allen Rechten. Führen Sie den Befehl deshalb nach jeder Aktualisierung erneut aus, siehe Abschnitt [Aktualisierung auf eine neue Version](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-3-aktualisierung-auf-eine-neue-version).
:::

**WireGuard** bringt die QGIS-Arbeitsplätze in das Netz der Datenbank. Der Dienst legt beim Start für jeden Namen in `WIREGUARD_PEERS` einen Zugang an, als Datei `deployment/wireguard/peer_<name>/peer_<name>.conf`; im VPN hat der Server die Adresse `10.13.13.1`. Damit Anfragen an diese Adresse die Datenbank erreichen, braucht die Konfiguration des Servers eine Weiterleitung des Ports 5432 an den Container `db`, die nicht automatisch entsteht. Die Zeilen `PostUp` und `PostDown` dafür stehen in `deployment/wireguard/README.md`, das sie nur in `wireguard/wg_confs/wg0.conf` einträgt. Der Dienst erzeugt `wg0.conf` aber aus der Vorlage `wireguard/templates/server.conf` neu, sobald sich `WIREGUARD_PEERS`, `WIREGUARD_SERVERURL` oder `WIREGUARD_PORT` ändern, und eine Weiterleitung nur in `wg0.conf` ginge dabei verloren. Tragen Sie die Zeilen deshalb an beiden Stellen ein: in `wg0.conf` wie im README beschrieben, damit sie sofort gilt, und in die Vorlage. In der Vorlage schreiben Sie jedes `$` als `\$`. Der Dienst wertet sie beim Erzeugen als Shell-Text aus; ohne Maskierung stünde in der fertigen `wg0.conf` statt der Adresse der Datenbank eine leere Zeichenkette, und das VPN startet nicht:

```ini
PostUp = DB_IP=\$(getent hosts db | awk '{print \$1}'); iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth+ -j MASQUERADE; iptables -t nat -A PREROUTING -i %i -p tcp --dport 5432 -j DNAT --to-destination \$DB_IP:5432
PostDown = DB_IP=\$(getent hosts db | awk '{print \$1}'); iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth+ -j MASQUERADE; iptables -t nat -D PREROUTING -i %i -p tcp --dport 5432 -j DNAT --to-destination \$DB_IP:5432
```

Starten Sie den Dienst danach mit `docker compose restart wireguard` neu.

Geben Sie jeder Person einen eigenen Zugang, behandeln Sie die Zugangsdateien wie Passwörter und entfernen Sie Zugänge, die nicht mehr gebraucht werden.

Wird der direkte Zugang aus QGIS nicht gebraucht, muss WireGuard auch nicht laufen. In `docker-compose.override.yml` hält ihn ein Profil vom Start ab:

```yaml
services:
  wireguard:
    profiles: ["vpn"]
```

`docker compose up -d` startet ihn dann nicht mehr, `docker compose --profile vpn up -d` schon. Einen bereits laufenden Dienst beendet `docker compose rm -sf wireguard` einmalig.

## 35.5 QGIS-Server und WMS-Backend

Der Dienst `qgis-server` nutzt das offizielle Image `qgis/qgis-server:3.44.7-noble` und baut seine Umgebung bei jedem Start selbst auf (`command` in `docker-compose.yml`):

- Er schreibt `/etc/postgresql-common/pg_service.conf` mit einem Dienst namens `QGIS_PG_SERVICE_NAME` (Vorgabe `qonnectra`), der mit `QGIS_DB_USER` auf die Datenbank zeigt. Hinterlegte QGIS-Projekte müssen ihre Layer über diesen Dienst laden, siehe Abschnitt [QGIS-Projekte in Qonnectra hinterlegen](../teil-b-betrieb-admin-qgis/27-qgis-server-und-kartendienste.md#_27-1-qgis-projekte-in-qonnectra-hinterlegen). Die Vorlage `deployment/qgis/pg_service.conf.template` und die Anleitungen in `deployment/README.md` und `deployment/qgis/environment-variables.md`, sie zu kopieren, sind damit überholt.
- Er startet einen virtuellen Bildschirm (Xvfb), den QGIS zum Zeichnen braucht, und drei Prozesse von QGIS Server hinter einem nginx im Container.

Die Projekte liest der Dienst nur lesend aus `deployment/qgis/projects`, ihre Datendateien aus `deployment/qgis/data`. Das Backend bindet dieselben Ordner schreibend ein: Projekte, die im Administrationsbereich hochgeladen werden, landen dort.

`QGIS_SERVER_VERSION` in `.env` muss zum Tag des Images passen; das Backend warnt beim Hochladen eines Projekts, das mit einer neueren QGIS-Version gespeichert wurde. Wer das Image auf eine neue Version hebt, ändert beides zusammen.

Das **WMS-Backend** ist der Dienst `backend-wms`, siehe Abschnitt [Container und Images](#_35-2-container-und-images). Er holt Kacheln von externen WMS-Quellen und vom eigenen QGIS Server – diesen direkt unter `http://qgis-server` im Docker-Netz, siehe Abschnitt [Komponenten und Weg einer Anfrage](./29-architekturueberblick.md#_29-1-komponenten-und-weg-einer-anfrage) –, und nginx hält die Bilder vor. Wie Zwischenspeicher und `warm_wms_cache` zusammenspielen, beschreibt Abschnitt [WMS-Proxy und Zwischenspeicher](../teil-b-betrieb-admin-qgis/27-qgis-server-und-kartendienste.md#_27-5-wms-proxy-und-zwischenspeicher).

## 35.6 Kachelserver

Die Hintergrundkarte liefert TileServer GL (`maptiler/tileserver-gl:v5.6.0`) aus dem Ordner `deployment/tiles`, den der Dienst nur lesend einbindet. `tiles/config.json` erwartet die Kacheldatei `germany.mbtiles` und nennt zwei Stile, `light` und `dark`, aus `tiles/styles/`. Beide liefern nur Vektorkacheln und Stil (`serve_rendered: false`); das Zeichnen übernimmt der Browser. Die Weboberfläche wählt den Stil nach der Einstellung der Hintergrundkarte.

- Der Dienst läuft als Benutzer mit der Nummer 1000. Die Kacheldatei muss für diesen Benutzer lesbar sein.
- `--public_url` setzt `docker-compose.yml` auf `https://${TILE_SERVER_DOMAIN}`, damit die Verweise in den Stilen auf die öffentliche Adresse zeigen.
- Caddy erlaubt den Abruf von jeder Herkunft (`Access-Control-Allow-Origin: *`).

Eine Kacheldatei bringt das Repository nicht mit. Sie entsteht mit Planetiler aus einem Auszug von OpenStreetMap; die Befehle stehen in `deployment/README.md` unter „Generating Map Tiles with Planetiler“, den Ablauf im Betrieb beschreibt Abschnitt [Kartenkacheln bereitstellen und erneuern](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-6-kartenkacheln-bereitstellen-und-erneuern).

Die Vektorkacheln der Netzobjekte kommen nicht von hier, sondern vom Backend, siehe Abschnitt [Vektor-Tile-Endpunkte](./32-rest-api.md#_32-6-vektor-tile-endpunkte).

## 35.7 Referenz der Umgebungsvariablen

Alle Variablen stehen in `deployment/.env`; Docker Compose reicht sie an die Dienste weiter, die sie in `docker-compose.yml` nennen. Die Spalte „Änderung“ sagt, was nach einer Änderung nötig ist:

- **Neustart** – `docker compose up -d`,
- **Build** – `docker compose up -d --build frontend`, weil der Wert beim Bauen in die Weboberfläche eingesetzt wird,
- **nie** – der Wert ist danach falsch oder unwirksam, siehe Abschnitt [Konfiguration über Umgebungsvariablen](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-2-konfiguration-uber-umgebungsvariablen); Passwörter der Datenbank ändern Sie in der Datenbank und in der Datei gemeinsam.

**Adressen**

| Variable | gelesen von | Bedeutung | Änderung |
|---|---|---|---|
| `APP_DOMAIN`, `API_DOMAIN`, `ADMIN_DOMAIN`, `FILES_DOMAIN`, `QGIS_DOMAIN`, `TILE_SERVER_DOMAIN` | Caddy; `APP_DOMAIN` auch Frontend (`ORIGIN`), `QGIS_DOMAIN` auch Backend, `TILE_SERVER_DOMAIN` auch Kachelserver | die sechs Adressen | Neustart; Zertifikate holt Caddy neu |
| `DOMAIN_NAME` | Caddy | gemeinsame Domain; wird nur von einer auskommentierten Weiterleitung genutzt | – |

**Backend (Django)**

| Variable | Vorgabe im Code | Bedeutung | Änderung |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | – | Schlüssel für Signaturen, auch der Anmelde-Tokens | Neustart; alle sind danach abgemeldet |
| `FIELD_ENCRYPTION_KEY` | leer | Schlüssel für die Passwörter der WMS-Quellen | nie |
| `DEBUG` | `false` | Entwicklungsmodus, siehe Abschnitt [Sicherheitsaspekte](#_35-8-sicherheitsaspekte) | auf dem Server immer `False` |
| `DJANGO_ALLOWED_HOSTS` | `localhost` | Hostnamen, die Django annimmt, kommagetrennt: die Adressen `api.`, `admin.`, `files.`, `qgis.` und `backend` | Neustart |
| `CSRF_TRUSTED_ORIGINS` | `https://api.localhost` | Herkünfte für Formulare, mit `https://`: mindestens `admin.` und `app.` | Neustart |
| `CORS_ALLOWED_ORIGINS` | Adressen unter `localhost` | Herkünfte, deren Seiten die Schnittstelle im Browser aufrufen dürfen: `https://app.…` | Neustart |
| `USE_COOKIE_DOMAIN_MIDDLEWARE` | `false` | Anmelde-Cookies für alle Adressen setzen | Neustart |
| `COOKIE_DOMAIN` | `localhost` | gemeinsame Domain mit führendem Punkt | Neustart |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | – | Datenbank und Hauptbenutzer; auch für die Datenbank selbst beim ersten Start | nie |
| `DB_HOST`, `DB_PORT` | – | `db`, `5432` | Neustart |
| `DEFAULT_SRID` | `25832` | Koordinatenbezugssystem, siehe Abschnitt [Geometriemodelle und SRID](./31-datenmodell-des-backends.md#_31-2-geometriemodelle-und-srid) | nie |
| `QGIS_PG_SERVICE_NAME` | `qonnectra` | Name des PostgreSQL-Dienstes in `pg_service.conf`, auch für QGIS Server | Neustart; hinterlegte Projekte müssen den Namen verwenden |
| `QGIS_SERVER_VERSION` | leer | Version für die Warnung beim Hochladen, passend zum Image von QGIS Server | Neustart |
| `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD` | – | erstes Superuser-Konto | bei jedem Start geprüft: legt das Konto an, solange es keines mit diesem Benutzernamen gibt, siehe 28.2 |

**Datenbank und QGIS Server**

| Variable | Bedeutung | Änderung |
|---|---|---|
| `QGIS_DB_USER`, `QGIS_DB_PASSWORD` | Benutzer für QGIS Server und QGIS-Arbeitsplätze, siehe Abschnitt [Datenbank, PostGIS und Datenbankzugang](#_35-4-datenbank-postgis-und-datenbankzugang) | nie |

**Frontend**

| Variable | Bedeutung | Änderung |
|---|---|---|
| `API_URL` | Adresse des Backends für Anfragen vom Server des Frontends, `http://backend:8000/api/v1/` | Build |
| `PUBLIC_API_URL` | Adresse der Schnittstelle für den Browser, `https://api.…/api/v1/` | Build |
| `PUBLIC_TILE_SERVER_URL` | Adresse des Kachelservers, `https://tiles.…`; leer: Rasterkacheln von OpenStreetMap | Neustart |
| `PUBLIC_DOCUMENTATION_URL` | Link „Dokumentation“; leer blendet ihn aus | Neustart |

`ORIGIN` und `NODE_ENV` setzt `docker-compose.yml` selbst.

**WireGuard**

| Variable | Vorgabe | Bedeutung | Änderung |
|---|---|---|---|
| `WIREGUARD_SERVERURL` | `auto` | öffentliche Adresse des Servers in den Zugangsdateien | Neustart, Zugangsdateien neu verteilen |
| `WIREGUARD_PORT` | `51820` | UDP-Port | Neustart, Zugangsdateien neu verteilen |
| `WIREGUARD_PEERS` | leer | Namen der Zugänge, kommagetrennt | Neustart; erzeugt die Konfiguration des Servers neu, siehe Abschnitt [Datenbank, PostGIS und Datenbankzugang](#_35-4-datenbank-postgis-und-datenbankzugang) |

**Ohne Wirkung.** `BACKEND_PORT`, `QGIS_SERVER_PORT`, `CADDY_PORT` und `CADDY_HTTPS_PORT` stehen in der Vorlage, werden aber von keiner Compose-Datei gelesen. Die Ports ändert nur ein Eintrag unter `ports` in `docker-compose.override.yml`.

Die Sicherungsskripte lesen ihre eigenen Einstellungen aus `deployment/backup/backup.conf`, siehe Abschnitt [Sicherung und Wiederherstellung](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-4-sicherung-und-wiederherstellung).

## 35.8 Sicherheitsaspekte

Sicherheitslücken in Qonnectra melden Sie vertraulich per E-Mail an die Geodock GmbH, wie in `SECURITY.md` im Repository beschrieben, nicht über öffentliche Issues. Sicherheitskorrekturen erscheinen nur für die jeweils neueste Version der Reihe 1.x; halten Sie die Installation deshalb aktuell, siehe Abschnitt [Aktualisierung auf eine neue Version](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-3-aktualisierung-auf-eine-neue-version).

Für eine Installation auf einem Server gilt:

- **Geheimnisse.** `.env` enthält alle Passwörter und Schlüssel der Installation. Geben Sie ihr die Rechte `600` und nehmen Sie sie nie in ein Repository auf. `backup.sh` sichert sie unverschlüsselt mit; wählen Sie als Ziel von `rclone` deshalb ein verschlüsseltes, siehe Abschnitt [Sicherung und Wiederherstellung](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-4-sicherung-und-wiederherstellung). Erzeugen Sie `DJANGO_SECRET_KEY`, `FIELD_ENCRYPTION_KEY` und die Datenbankpasswörter zufällig, siehe Abschnitt [Erstinstallation auf einem Server](#_35-1-erstinstallation-auf-einem-server); die Werte der Vorlage sind Platzhalter.
- **`DEBUG=False`.** Mit `DEBUG` zeigt Django bei Fehlern Einzelheiten der Konfiguration, die Schnittstelle bietet ihr Schema und die Swagger-Oberfläche an, und das Backend liefert Anhänge selbst aus statt über nginx.
- **Frontend ohne `.env`.** Entfernen Sie `env_file` beim Dienst `frontend` über die Override-Datei, siehe Abschnitt [Container und Images](#_35-2-container-und-images).
- **QGIS-Datenbankbenutzer.** Beschränken Sie ihn auf die Netzdaten und wiederholen Sie das nach jeder Aktualisierung, siehe Abschnitt [Datenbank, PostGIS und Datenbankzugang](#_35-4-datenbank-postgis-und-datenbankzugang). Seine Zugangsdaten kommen dennoch einem weitgehenden Schreibzugriff auf das Netz gleich; geben Sie sie nur an Personen, die in QGIS bearbeiten.
- **VPN.** Geben Sie jeder Person einen eigenen Zugang, entfernen Sie nicht mehr benötigte Zugänge und starten Sie den Dienst ohne Bedarf gar nicht, siehe Abschnitt [Datenbank, PostGIS und Datenbankzugang](#_35-4-datenbank-postgis-und-datenbankzugang).
- **Erreichbarkeit.** Beschränken Sie den Administrationsbereich und den WebDAV-Zugang über `deployment/caddy/extra/` auf die Adressen des eigenen Netzes, siehe Abschnitt [Reverse Proxy](#_35-3-reverse-proxy-caddy-und-nginx).
- **Konten.** Vergeben Sie Konten nur an Personen und Stellen, die das Netz der Installation sehen dürfen, siehe Abschnitt [Berechtigungsprüfung in der Schnittstelle](./32-rest-api.md#_32-3-berechtigungsprufung-in-der-schnittstelle). Für Netze, die getrennt bleiben müssen, betreiben Sie getrennte Installationen.
- **Protokolle.** Die Protokolltabelle und die Ausgaben von nginx enthalten Benutzernamen, aufgerufene Pfade und IP-Adressen. Löschen Sie alte Einträge regelmäßig, siehe Abschnitt [Protokolle auswerten](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-5-protokolle-auswerten).

Was Caddy an Schutz mitbringt – HTTPS mit HSTS, die Sicherheits-Header, die Anmeldeprüfung vor QGIS Server und WebDAV –, beschreibt Abschnitt [Reverse Proxy](#_35-3-reverse-proxy-caddy-und-nginx). Eine Content Security Policy setzt die mitgelieferte Konfiguration nicht; wer eine braucht, ergänzt sie in `deployment/caddy/extra/app/`.
