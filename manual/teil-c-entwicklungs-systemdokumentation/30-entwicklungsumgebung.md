# 30. Entwicklungsumgebung

Dieses Kapitel beschreibt, wie Sie Qonnectra auf dem eigenen Rechner zum Laufen bringen, um daran zu entwickeln. Es gibt zwei Wege:

- **Backend und Frontend direkt auf dem Rechner**, nur die Datenbank im Container. Änderungen am Code wirken sofort: Django lädt sich bei jeder Änderung neu, Vite tauscht geänderte Komponenten im Browser aus. Das ist der Weg für die tägliche Arbeit am Code, beschrieben in den Abschnitten [Backend starten](#_30-2-backend-starten) und [Frontend starten](#_30-3-frontend-starten).
- **Alles in Containern**, so wie auf einem Server. Jede Änderung am Code braucht einen neuen Build der Images. Das ist der Weg, um das Zusammenspiel aller Dienste zu prüfen – Caddy, nginx, QGIS Server, WebDAV –, beschrieben in den Abschnitten [Varianten der Docker-Compose-Dateien](#_30-4-varianten-der-docker-compose-dateien) und [Lokales HTTPS und Zertifikate](#_30-5-lokales-https-und-zertifikate).

Alle Pfade in diesem Kapitel sind relativ zum Wurzelverzeichnis des Repositorys.

## 30.1 Voraussetzungen

| Werkzeug | Version | Wofür |
|---|---|---|
| Python | 3.12 oder neuer | Backend; `backend/.python-version` nennt 3.12 |
| [uv](https://docs.astral.sh/uv/) | aktuell | Abhängigkeiten des Backends, gesperrt in `backend/uv.lock` |
| GDAL und GEOS | aus dem Paketmanager | GeoDjango; nur für das Backend auf dem Rechner |
| Node.js | 22 | Frontend; die Images bauen mit `node:22-alpine` |
| Docker Engine, Docker Compose | 20.10 bzw. 2.24.4 oder neuer, mit BuildKit | Datenbank, und alle Dienste im zweiten Weg |

Unter Linux findet Django GDAL und GEOS ohne weitere Einstellung, sobald die Bibliotheken über den Paketmanager installiert sind. Für macOS und Windows stehen die Pfade fest in `backend/core/settings.py`: unter macOS die von Homebrew (`/opt/homebrew/opt/gdal`, `/opt/homebrew/opt/geos`), unter Windows die von OSGeo4W (`C:\OSGeo4W\bin`). Liegen die Bibliotheken woanders, passen Sie die Pfade dort an.

Für den Betrieb aller Dienste in Containern rechnet `deployment/README.md` mit 8 CPU-Kernen und 16 GB Arbeitsspeicher; QGIS Server und die Datenbank sind die größten Posten. Die Ports 80 und 443 müssen frei sein.

## 30.2 Backend starten

Das Backend liest seine Einstellungen aus `deployment/.env`, auch wenn es nicht im Container läuft (`load_dotenv` in `backend/core/settings.py`). Variablen, die in der Shell bereits gesetzt sind, haben Vorrang vor der Datei. So bleibt eine einzige `.env` für beide Wege, und was auf dem Rechner anders sein muss, setzen Sie beim Start.

1. Legen Sie `deployment/.env` aus der Vorlage an und setzen Sie mindestens `DJANGO_SECRET_KEY`, `DB_NAME`, `DB_USER` und `DB_PASSWORD`:

   ```bash
   cp deployment/.env.production.template deployment/.env
   ```

   Was die übrigen Variablen bedeuten, beschreibt Abschnitt [Referenz der Umgebungsvariablen](./35-bereitstellung-und-infrastruktur.md#_35-7-referenz-der-umgebungsvariablen).

2. Starten Sie eine Datenbank. Für die Entwicklung genügt das Basis-Image von PostGIS, auf dem das Image von Qonnectra aufbaut; die zusätzliche Erweiterung pgRouting nutzt der Code nicht.

   ```bash
   docker run -d --name qonnectra-dev-db -p 127.0.0.1:5440:5432 \
     -e POSTGRES_DB=qonnectra -e POSTGRES_USER=qonnectra -e POSTGRES_PASSWORD=qonnectra \
     postgis/postgis:17-3.5
   ```

   `127.0.0.1` vor dem Port hält die Datenbank vom Netz fern; ohne ihn ist sie auf allen Schnittstellen des Rechners erreichbar. Die Werte müssen zu `DB_NAME`, `DB_USER` und `DB_PASSWORD` in der `.env` passen. Die Erweiterungen, die das Backend braucht – PostGIS, `pgcrypto`, `pg_trgm` –, legen die Migrationen selbst an.

3. Installieren Sie die Abhängigkeiten:

   ```bash
   cd backend
   uv sync --dev
   ```

4. Setzen Sie für die Sitzung, was vom Container abweicht:

   ```bash
   export DB_HOST=localhost DB_PORT=5440 DEBUG=True USE_COOKIE_DOMAIN_MIDDLEWARE=False \
     CORS_ALLOWED_ORIGINS=http://localhost:5173
   ```

5. Legen Sie Tabellen, Stammdaten und ein Konto für die Anmeldung an:

   ```bash
   uv run manage.py migrate
   uv run manage.py load_initial_data
   uv run manage.py createsuperuser
   ```

6. Starten Sie den Entwicklungsserver:

   ```bash
   uv run manage.py runserver
   ```

Die Schnittstelle antwortet dann unter `http://localhost:8000/api/v1/`, der Administrationsbereich unter `http://localhost:8000/admin/`. Ohne Caddy davor gibt es die Trennung der beiden Adressen nicht.

`DEBUG=True` ist auf dem Rechner keine Bequemlichkeit, sondern Voraussetzung für mehrere Funktionen:

- **Anhänge** liefert das Backend nur mit `DEBUG` selbst aus. Sonst antwortet es mit einem `X-Accel-Redirect`, den nur nginx auflösen kann, und der Download bleibt leer.
- Die **Swagger-Oberfläche** unter `/api/v1/docs/` und das Schema unter `/api/v1/schema/` gibt es nur mit `DEBUG`, ebenso die im Browser bedienbare Schnittstelle von Django REST Framework, siehe Abschnitt [OpenAPI-Schema und Typgenerierung](./32-rest-api.md#_32-7-openapi-schema-und-typgenerierung).
- Die **Stylesheets des Administrationsbereichs** liefert `runserver` nur mit `DEBUG` aus.

`CORS_ALLOWED_ORIGINS` muss die Adresse des Frontends nennen, weil der Browser Kacheln, Suchtreffer und Speichervorgänge direkt beim Backend auf einem anderen Port anfragt; die Vorlage trägt dort die Adressen eines Servers ein, und der Browser verweigert die Antworten.

`USE_COOKIE_DOMAIN_MIDDLEWARE=False` sorgt dafür, dass die Anmelde-Cookies ohne Domain gesetzt werden. Mit der Domain aus der Vorlage verwirft der Browser sie auf `localhost`, und die Anmeldung scheitert, ohne dass eine Meldung erscheint.

::: info
In VS Code liegen dieselben Schritte als Aufgaben in `.vscode/tasks.json` („Django Migrate“, „Django Runserver“ usw.), Startkonfigurationen zum Debuggen in `.vscode/launch.json`. Die Aufgaben setzen die Variablen aus Schritt 4 nicht; tragen Sie sie in das `env` der Aufgaben bzw. Startkonfigurationen ein oder starten Sie VS Code aus einer Shell, in der sie gesetzt sind. In `deployment/.env` gehören sie nicht: Die Datei gilt auch für die Container, und dort liefe das Backend mit `DEBUG`. Die Aufgabe „Django Migrate“ ruft `python` statt `uv run` auf und braucht deshalb die aktivierte Umgebung aus `backend/.venv`.
:::

## 30.3 Frontend starten

1. Installieren Sie die Abhängigkeiten nach `frontend/package-lock.json`:

   ```bash
   cd frontend
   npm ci
   ```

2. Legen Sie die Einstellungen an:

   ```bash
   cp .env.example .env
   ```

   Die Vorlage zeigt mit `API_URL` und `PUBLIC_API_URL` auf das Backend unter `http://localhost:8000/api/v1/`. `API_URL` nutzt das Frontend für Anfragen vom Server aus, `PUBLIC_API_URL` der Browser; auf dem Rechner sind beide gleich. Für die Hintergrundkarte ergänzen Sie `PUBLIC_TILE_SERVER_URL`, wenn ein Kachelserver erreichbar ist; die Vorlage enthält die Variable nicht, und ohne sie fällt die Karte auf die Rasterkacheln von OpenStreetMap zurück.

3. Starten Sie den Entwicklungsserver:

   ```bash
   npm run dev
   ```

Die Weboberfläche läuft dann unter `http://localhost:5173`. Melden Sie sich mit dem Konto aus Schritt 5 des vorigen Abschnitts an; ausgewählt ist danach das Projekt „Default“, das `load_initial_data` anlegt.

Die Anmeldung läuft über die Formularaktion des Frontends: Sie übernimmt die Cookies aus der Antwort des Backends und setzt sie selbst für `localhost`. Weil Cookies nicht an den Port gebunden sind, schickt der Browser sie auch an `localhost:8000`. Sie tragen das Attribut `Secure`, das Chromium und Firefox auf `localhost` auch ohne HTTPS akzeptieren.

## 30.4 Varianten der Docker-Compose-Dateien

`deployment/` enthält drei Compose-Dateien:

| Datei | Gedacht für | Zustand |
|---|---|---|
| `docker-compose.yml` | den Betrieb auf einem Server | vollständig, alle zehn Dienste; braucht öffentliche Domains, weil Caddy Zertifikate bei Let’s Encrypt holt |
| `docker-compose.dev.yml` | alle Dienste lokal unter `*.localhost` | startet nicht, siehe unten |
| `docker-compose.override.yml.template` | eigene Anpassungen | nur auskommentierte Beispiele: Containernamen, Datenbankport, Code einbinden, Worker skalieren |

`docker-compose.dev.yml` verzichtet auf `backend-wms` und `wireguard`, legt die Datenbank in den Ordner `deployment/postgres/data` statt in ein Volume und öffnet ihren Port als 5440. Die Datei startet zum Stand des Handbuchs aber nicht: Sie bindet `nginx/nginx.conf` – eine vollständige Hauptkonfiguration mit `worker_processes` und `http`-Block – als `conf.d/default.conf` ein, und nginx bricht mit „"worker_processes" directive is not allowed here“ ab. Dazu kommt, dass sie die Adressen direkt unter `localhost` setzt (`api.localhost`, `app.localhost`), wo kein Browser Cookies mit `Domain=.localhost` annimmt – `localhost` gilt als öffentliches Suffix.

Wenn Sie alle Dienste lokal betreiben wollen, nehmen Sie deshalb die Datei für den Server und passen sie über eine Override-Datei an. Docker Compose liest `docker-compose.override.yml` neben `docker-compose.yml` automatisch mit ein.

1. Wählen Sie eine Basisdomain eine Ebene unter `localhost`, etwa `qonnectra.localhost`. Alle Namen unter `localhost` zeigen ohne Eintrag in `/etc/hosts` auf den eigenen Rechner. Tragen Sie in `deployment/.env` ein:
   - die sechs Adressen, `APP_DOMAIN=app.qonnectra.localhost`, `API_DOMAIN=api.qonnectra.localhost` usw.,
   - `COOKIE_DOMAIN=.qonnectra.localhost` und `USE_COOKIE_DOMAIN_MIDDLEWARE=True`,
   - `CORS_ALLOWED_ORIGINS=https://app.qonnectra.localhost` und `CSRF_TRUSTED_ORIGINS=https://api.qonnectra.localhost,https://app.qonnectra.localhost,https://admin.qonnectra.localhost`,
   - in `DJANGO_ALLOWED_HOSTS` die Adressen `api.`, `admin.`, `files.` und `qgis.` sowie `backend` – unter diesem Namen spricht das Frontend das Backend im Docker-Netz an, und Caddy prüft jede Anfrage an `files.` und `qgis.` beim Backend unter deren eigenem Namen,
   - `API_URL=http://backend:8000/api/v1/`, `PUBLIC_API_URL=https://api.qonnectra.localhost/api/v1/` und `PUBLIC_TILE_SERVER_URL=https://tiles.qonnectra.localhost`.
2. Kopieren Sie `Caddyfile.production` nach `Caddyfile.local` und ergänzen Sie in jedem der sechs Adressblöcke die Zeile `tls internal`. Caddy stellt die Zertifikate dann selbst aus, statt sie bei Let’s Encrypt anzufragen, siehe nächster Abschnitt.
3. Legen Sie `deployment/docker-compose.override.yml` an:

   ```yaml
   services:
     caddy:
       volumes:
         - ./Caddyfile.local:/etc/caddy/Caddyfile:ro
   ```

   Docker Compose führt die Volumes beider Dateien nach ihrem Ziel im Container zusammen. Der Eintrag ersetzt nur die Einbindung von `Caddyfile.production`, alle übrigen Volumes von `caddy` bleiben, wie sie sind.

4. Bauen und starten Sie alles:

   ```bash
   cd deployment
   docker compose up -d --build
   ```

::: warning
Das Image der Datenbank lässt sich zum Stand des Handbuchs aus einem leeren Cache nicht mehr bauen. `deployment/postgres/Dockerfile` installiert pgRouting über `apt.postgresql.org` auf `postgis/postgis:17-3.5`, das auf Debian 11 („bullseye“) beruht, und für bullseye bietet das Repository keine Pakete mehr an. Sie liegen unverändert unter `apt-archive.postgresql.org`. Bis das Dockerfile angepasst ist, bauen Sie das Image über die Override-Datei mit dem Archiv:

```yaml
services:
  db:
    build:
      dockerfile: !reset null
      dockerfile_inline: |
        FROM postgis/postgis:17-3.5
        RUN sed -i 's#http://apt.postgresql.org/#http://apt-archive.postgresql.org/#' /etc/apt/sources.list.d/pgdg.list && \
            apt-get update && \
            apt-get install -y --no-install-recommends postgresql-17-pgrouting && \
            rm -rf /var/lib/apt/lists/*
```
:::

::: warning
Sind `QGIS_DB_USER` und `QGIS_DB_PASSWORD` gesetzt, bricht der allererste Start der Datenbank mit einem leeren Volume ab: `deployment/postgres/init.sh` greift auf Tabellen zu, die erst die Migrationen des Backends anlegen. Starten Sie die Dienste erneut; ein Volume, das bereits initialisiert ist, durchläuft das Skript nicht noch einmal. Was danach für den QGIS-Benutzer zu tun ist, beschreibt Abschnitt [Datenbank, PostGIS und Datenbankzugang](./35-bereitstellung-und-infrastruktur.md#_35-4-datenbank-postgis-und-datenbankzugang).
:::

## 30.5 Lokales HTTPS und Zertifikate

Mit `tls internal` stellt Caddy die Zertifikate über eine eigene Zertifizierungsstelle aus, die es beim ersten Start anlegt. Der Browser kennt sie nicht und warnt bei jeder der sechs Adressen. Machen Sie ihr Wurzelzertifikat dem Rechner bekannt; es liegt im Volume `caddy_data`:

```bash
docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
```

Importieren Sie `caddy-root.crt` in den Zertifikatsspeicher des Betriebssystems, unter Debian und Ubuntu etwa nach `/usr/local/share/ca-certificates/` mit anschließendem `update-ca-certificates`. Firefox und Chromium unter Linux führen einen eigenen Speicher und brauchen den Import zusätzlich in ihren Einstellungen.

`deployment/README.md` nennt dafür den Befehl `docker compose -f docker-compose.dev.yml exec caddy caddy trust`. Er installiert das Zertifikat im Container, nicht auf dem Rechner, und hilft dem Browser deshalb nicht.

::: warning
Die Zertifizierungsstelle lebt im Volume `caddy_data`. Wird es gelöscht, etwa mit `docker compose down -v`, legt Caddy beim nächsten Start eine neue an, und der Import ist zu wiederholen. Um das zu vermeiden, erzeugen Sie eine eigene Zertifizierungsstelle, binden ihr Zertifikat und ihren Schlüssel in den Container ein und nennen sie Caddy im globalen Block von `Caddyfile.local`:

```text
{
    pki {
        ca local {
            root {
                cert /etc/caddy/ca/root.crt
                key /etc/caddy/ca/root.key
            }
        }
    }
}
```
:::

## 30.6 Stamm- und Ausgangsdaten laden

Qonnectra bringt keine Beispieldaten mit, wohl aber die Stammdaten, ohne die keine Ansicht funktioniert. Es gibt zwei Quellen:

- **Migrationen** legen die drei Gruppen „Admin“, „Editor“ und „Viewer“ mit ihren Modell- und Routenrechten an (Migrationen `0058`, `0068`, `0071`). Sie sind nach `migrate` immer da. Was die Gruppen dürfen, beschreibt Kapitel [Rollen und Rechte](../teil-b-betrieb-admin-qgis/19-rollen-und-rechte.md).
- **`load_initial_data`** lädt die Fixtures aus `backend/apps/api/fixtures/`:
  - das Projekt „Default“ und das Kennzeichen „Default“, beide mit der Nummer 1, samt Netzschema- und Rohrverzweigungs-Einstellungen für dieses Projekt,
  - Status, Phasen, Netzebenen, Oberflächen, Bauarten und Firmen,
  - Rohr- und Kabeltypen mit ihren Farbzuordnungen, Mikrorohr- und Faserfarben, Mikrorohr- und Faserstatus,
  - Netzknoten- und Komponententypen mit ihren Portbelegungen, Gebietstypen,
  - Ausbaustatus der Adressen, Typen und Status der Wohneinheiten,
  - die Speicherpräferenzen und Dateitypkategorien der Anhänge,
  - die Nachschlagelisten der Leitungsauskunft.

Der Container `backend` ruft `migrate` und `load_initial_data` bei jedem Start selbst auf. Auf dem Rechner tun Sie es von Hand, siehe Abschnitt [Backend starten](#_30-2-backend-starten).

`load_initial_data` lädt die Fixtures in sieben Gruppen. Jede Gruppe hat ein Leitmodell, und sie wird übersprungen, sobald dessen Tabelle eine Zeile enthält – so überlebt der Befehl jeden Neustart, ohne doppelte Einträge anzulegen. Daraus folgt zweierlei:

- Kommt in einer neuen Version eine Fixture zu einer bestehenden Gruppe hinzu, lädt der Befehl sie auf einer Installation, deren Gruppe schon befüllt ist, nie. Laden Sie sie dann einzeln mit `uv run manage.py loaddata <name>`, solange ihre Tabelle noch leer ist, siehe den Kasten unten.
- `--force` lädt alle Gruppen ohne Prüfung. Die Farbzuordnungen haben eindeutige Schlüssel; auf einer befüllten Datenbank bricht der Befehl an ihnen ab.

Zwei Fixtures gehören zu keiner Gruppe und werden nie automatisch geladen: `container_types.json` und `valuation_cost_rates.json`. Container-Typen und Kostensätze der Wertermittlung legen Sie im Administrationsbereich an, siehe die Abschnitte [Container-Typen](../teil-b-betrieb-admin-qgis/21-projekte-und-stammdaten.md#_21-7-container-typen) und [Kostensätze der Wertermittlung](../teil-b-betrieb-admin-qgis/22-projektbezogene-konfiguration.md#_22-3-kostensatze-der-wertermittlung), oder laden sie mit `loaddata`.

::: danger
`loaddata` überschreibt Zeilen mit derselben Nummer ohne Rückfrage. Die Fixtures tragen feste Nummern; auf einer Installation, in der jemand schon Container-Typen, Kostensätze oder andere Stammdaten angelegt hat, ersetzt der Befehl diese Einträge. Laden Sie eine Fixture einzeln nur in eine leere Tabelle.
:::

Für Netzdaten, mit denen sich die Ansichten ausprobieren lassen, gibt es keinen mitgelieferten Weg. Sie entstehen über QGIS, über den Excel-Import der Rohre oder über die Schnittstelle, siehe Kapitel [Daten importieren und exportieren](../teil-b-betrieb-admin-qgis/24-daten-import-und-export.md).
