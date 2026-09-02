#!/usr/bin/env bash
#
# Klont/aktualisiert die Qonnectra-App (Geodock-GmbH/Qonnectra) nach
# local-app/ und startet sie lokal gegen die PRODUKTIONS-Compose
# (docker-compose.yml), damit die Screenshots/Beispiele im Handbuch der
# echten Produktions-Konfiguration entsprechen (nicht docker-compose.dev.yml).
#
# local-app/ ist bewusst NICHT Teil dieses Repos (siehe .gitignore) - dieses
# Skript ist der reproduzierbare Ersatz dafür und darf beliebig oft und auf
# jeder Maschine neu ausgeführt werden (idempotent).
#
# Voraussetzungen: git, curl, openssl, Docker Engine 24+, Docker Compose v2
# ("docker compose") sowie Java 21+ für die Kartenkacheln (siehe
# --skip-tiles). Der ausführende Nutzer muss den Docker-Daemon ansprechen
# können (Mitglied der "docker"-Gruppe oder root).
#
# Verwendung:
#   scripts/setup-local-qonnectra.sh [--reset] [--reset-checkout]
#
# --reset verwirft die Daten der Instanz (Container, Volumes inkl. Datenbank,
# generierte Konfiguration samt Secrets), --reset-checkout zusätzlich den
# Checkout local-app/. Die lokale Dev-CA bleibt in beiden Fällen erhalten.
#
# HTTPS läuft über eine persistente lokale Dev-CA in ~/.local/share/
# qonnectra-local-ca/, die read-only in den Caddy-Container gemountet wird.
# Sie liegt außerhalb von local-app/ und außerhalb der Docker-Volumes und muss
# deshalb nur einmal pro Rechner in die Truststores importiert werden
# (scripts/install-local-ca.sh) - nicht nach jedem Rebuild.
#
# Nach dem Lauf erreichbar unter https://app.qonnectra.localhost (siehe
# Ausgabe am Skriptende für Zugangsdaten und Zertifikats-Import).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL_APP_DIR="$REPO_ROOT/local-app"
DEPLOY_DIR="$LOCAL_APP_DIR/deployment"
QONNECTRA_REPO_URL="https://github.com/Geodock-GmbH/Qonnectra.git"

# Persistente lokale Dev-CA. Liegt bewusst AUSSERHALB von local-app/ (wird
# geklont/gelöscht) und außerhalb dieses Repos (enthält einen privaten
# Schlüssel), damit sie Rebuilds, "docker compose down -v" und Neu-Klone
# überlebt und nur EINMAL in die Truststores von System/Browser importiert
# werden muss. Überschreibbar via QONNECTRA_CA_DIR.
CA_DIR="${QONNECTRA_CA_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/qonnectra-local-ca}"
CA_CRT="$CA_DIR/root.crt"
CA_KEY="$CA_DIR/root.key"
CA_NAME="Qonnectra Local Dev CA"

# Kartenkacheln (.mbtiles) für den tileserver. Die App liefert bewusst keine
# mit aus, tileserver-gl beendet sich ohne sie aber sofort und läuft dank
# "restart: always" in eine Endlosschleife - die Karte fiele dann auf
# OSM-Rasterkacheln zurück statt die echte Vektor-Basiskarte zu zeigen.
#
# Die Kacheln liegen wie die Dev-CA AUSSERHALB von local-app/ (wird geklont/
# gelöscht) und außerhalb dieses Repos (mehrere hundert MB), damit --reset,
# --reset-checkout und ein Neu-Klon nicht jedes Mal einen mehrminütigen
# Planetiler-Lauf auslösen. Voreingestellt ist Schleswig-Holstein: das
# Testprojekt liegt vollständig bei 9,74° O / 54,73° N (nordöstlich von
# Flensburg). Überschreibbar via QONNECTRA_TILE_AREA (z. B. "germany",
# dauert dann deutlich länger und braucht ~3 GB).
TILES_DIR="${QONNECTRA_TILES_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/qonnectra-local-tiles}"
TILE_AREA="${QONNECTRA_TILE_AREA:-schleswig-holstein}"
TILE_MBTILES="$TILES_DIR/$TILE_AREA.mbtiles"
PLANETILER_JAR="$TILES_DIR/planetiler.jar"
PLANETILER_URL="https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar"

# Hilfe-Link der App (PUBLIC_DOCUMENTATION_URL). Die App zeigt ihn in
# Kopfzeile, Navigationsleiste und mobiler Navigation und blendet ihn aus,
# solange die Variable leer ist - für Screenshots der Oberfläche muss sie
# also gesetzt sein. Zeigt auf diese Doku-Site.
DOCUMENTATION_URL="${QONNECTRA_DOCUMENTATION_URL:-https://qonnectra.de/}"

# Zweites Konto OHNE Administrationsrechte. Der Django-Superuser sieht alle
# Menüpunkte und darf alles - Bilder daraus zeigen eine Oberfläche, die
# normale Nutzende so nie zu Gesicht bekommen. Teil A des Handbuchs
# beschreibt aber genau deren Sicht, deshalb entstehen die Screenshots mit
# diesem Konto (siehe playwright/local-app.ts).
#
# Gruppe "Editor" (aus Migration api/0058_seed_permission_data): alle
# Fachdaten bearbeitbar - "Speichern" und die Bearbeitungsdialoge sind also
# im Bild -, aber kein Zugriff auf /admin/* und damit kein Menüpunkt "Logs".
# Alternativen: "Viewer" (nur lesend, keine Bearbeitungsschaltflächen) oder
# "Admin" (wie Editor plus /admin/*).
#
# Beide Werte greifen nur, solange local-app/deployment/.env noch nicht
# existiert - danach gilt, was dort steht (Name und Passwort müssen zum
# Nutzer in der Datenbank passen). Die Gruppe lässt sich nachträglich in
# .env ändern, sie wird bei jedem Lauf neu zugewiesen.
APP_USER_NAME="${QONNECTRA_APP_USER:-anwender}"
APP_USER_GROUP_NAME="${QONNECTRA_APP_USER_GROUP:-Editor}"

# Alle Services außer "wireguard" (VPN-Zugang, für lokales Ausprobieren/
# Handbuch-Screenshots irrelevant, würde nur zusätzliche Host-Capabilities
# brauchen).
SERVICES=(db backend backend-wms qgis-server pg-error-parser frontend nginx tileserver caddy)

log() { printf '\n\033[1;32m==>\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33mWARNUNG:\033[0m %s\n' "$1" >&2; }
die() { printf '\033[1;31mFEHLER:\033[0m %s\n' "$1" >&2; exit 1; }

random_alnum() {
	LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c "$1"
}

random_fernet_key() {
	# Fernet-Key: base64(urlsafe) von 32 Zufallsbytes, siehe FIELD_ENCRYPTION_KEY
	head -c 32 /dev/urandom | base64 | tr '+/' '-_'
}

usage() {
	cat <<EOF
Verwendung: $(basename "$0") [--reset] [--reset-checkout] [--skip-tiles]

  --reset           Daten der lokalen Instanz verwerfen und neu aufbauen:
                    Container, Docker-Volumes (Datenbank, Medien,
                    Caddy-Daten) und die generierte Konfiguration inkl.
                    Secrets in local-app/deployment/.env. Der Checkout
                    local-app/ bleibt unangetastet.
  --reset-checkout  Den Checkout local-app/ löschen und neu klonen. Verwirft
                    auch eigene Änderungen darin. Lässt für sich genommen
                    Datenbank und Secrets in Ruhe, ist mit --reset
                    kombinierbar.
  --skip-tiles      Keine Kartenkacheln erzeugen. Der tileserver läuft dann
                    ohne Daten in eine Restart-Schleife, die Karte fällt auf
                    OSM-Rasterkacheln zurück.
  -h, --help        Diese Hilfe anzeigen.

Die lokale Dev-CA in
  $CA_DIR
bleibt in jedem Fall erhalten - der Truststore-Import muss also nicht
wiederholt werden. Ebenso bleiben die Kartenkacheln in
  $TILES_DIR
erhalten; sie werden nur erzeugt, wenn sie dort fehlen.

Angelegt werden zwei Konten: der Django-Superuser für die Administration und
ein Konto ohne Administrationsrechte, mit dem die Handbuch-Screenshots
entstehen (Name/Gruppe beim ersten Lauf über QONNECTRA_APP_USER bzw.
QONNECTRA_APP_USER_GROUP wählbar, danach über local-app/deployment/.env).
Den Hilfe-Link der App setzt QONNECTRA_DOCUMENTATION_URL.
EOF
}

RESET=0
RESET_CHECKOUT=0
SKIP_TILES=0
ENV_BACKUP=""
for arg in "$@"; do
	case "$arg" in
	--reset) RESET=1 ;;
	--reset-checkout) RESET_CHECKOUT=1 ;;
	--skip-tiles) SKIP_TILES=1 ;;
	-h | --help)
		usage
		exit 0
		;;
	*)
		usage >&2
		die "Unbekannte Option: $arg"
		;;
	esac
done

# --- Voraussetzungen prüfen -------------------------------------------------

command -v git >/dev/null 2>&1 || die "git ist nicht installiert."
command -v curl >/dev/null 2>&1 || die "curl ist nicht installiert."
command -v openssl >/dev/null 2>&1 || die "openssl ist nicht installiert."
command -v docker >/dev/null 2>&1 || die "docker ist nicht installiert."
docker compose version >/dev/null 2>&1 || die "docker compose (v2 Plugin) ist nicht verfügbar."

# Docker-Zugriff sicherstellen. Falls der aktuelle Login noch nicht die
# docker-Gruppenmitgliedschaft im laufenden Prozess hat (z. B. direkt nach
# "usermod -aG docker"), einmalig über "sg docker" neu ausführen.
if ! docker info >/dev/null 2>&1; then
	if command -v sg >/dev/null 2>&1 && sg docker -c "docker info" >/dev/null 2>&1; then
		warn "Kein Docker-Zugriff in dieser Shell, starte Skript erneut über 'sg docker'."
		exec sg docker -c "'$0' $*"
	fi
	die "Kein Zugriff auf den Docker-Daemon. Nutzer zur docker-Gruppe hinzufügen: sudo usermod -aG docker \$USER (danach neu einloggen)."
fi

# --- Reset (nur mit --reset / --reset-checkout) ------------------------------
#
# --reset entfernt alles, was Zustand hält: Container, die Docker-Volumes mit
# Datenbank/Medien/Caddy-Daten und die generierte Konfiguration samt Secrets.
# --reset-checkout wirft zusätzlich den Checkout local-app/ weg. Beides wird
# weiter unten neu erzeugt. Ausgenommen ist in jedem Fall die Dev-CA in
# $CA_DIR: sie liegt außerhalb und soll den einmaligen Truststore-Import
# überleben.

if [ "$RESET" -eq 1 ] || [ "$RESET_CHECKOUT" -eq 1 ]; then
	# Container in beiden Fällen anhalten - bei --reset samt Volumes, sonst
	# nur die Container, damit der neue Checkout nicht gegen Reste des alten
	# hochgefahren wird. Muss vor dem Löschen von local-app/ passieren, weil
	# die Compose-Dateien dort liegen.
	if [ -f "$DEPLOY_DIR/docker-compose.yml" ]; then
		DOWN=(docker compose -f "$DEPLOY_DIR/docker-compose.yml")
		if [ -f "$DEPLOY_DIR/docker-compose.override.yml" ]; then
			DOWN+=(-f "$DEPLOY_DIR/docker-compose.override.yml")
		fi
		if [ "$RESET" -eq 1 ]; then
			log "Reset: verwerfe Container, Volumes (inkl. Datenbank) und Secrets"
			DOWN+=(down -v --remove-orphans)
		else
			log "Halte Container an (Volumes und Datenbank bleiben erhalten)"
			DOWN+=(down --remove-orphans)
		fi
		# Aus $DEPLOY_DIR heraus, damit derselbe Compose-Projektname wie beim
		# Start greift (er leitet sich vom Verzeichnisnamen ab).
		(cd "$DEPLOY_DIR" && "${DOWN[@]}") ||
			warn "\"docker compose down\" schlug fehl - Reste werden gleich direkt entfernt."
	fi

	if [ "$RESET" -eq 1 ]; then
		# Nachlauf bzw. Fallback: die Volumes tragen feste Namen (siehe
		# docker-compose.yml) und überleben sonst, wenn local-app/ vorher von
		# Hand gelöscht wurde oder "down" fehlgeschlagen ist.
		VOLUMES=(
			qonnectra_postgres_data_prod
			qonnectra_caddy_data_prod
			qonnectra_caddy_config_prod
			qonnectra_static_prod
			qonnectra_media_prod
			qonnectra_wms_cache_prod
		)
		docker volume rm -f "${VOLUMES[@]}" >/dev/null 2>&1 || true
		REMAINING="$(docker volume ls -q --filter name='^qonnectra_.*_prod$' || true)"
		if [ -n "$REMAINING" ]; then
			warn "Diese Volumes ließen sich nicht entfernen (vermutlich noch von einem Container belegt): $(echo "$REMAINING" | tr '\n' ' ')"
		fi

		# Generierte Konfiguration inkl. Secrets. Ohne das behielte die neue,
		# leere Datenbank die alten Passwörter aus .env.
		rm -f "$DEPLOY_DIR/.env" \
			"$DEPLOY_DIR/Caddyfile.production.local" \
			"$DEPLOY_DIR/docker-compose.override.yml"
	fi

	if [ "$RESET_CHECKOUT" -eq 1 ]; then
		# .env liegt zwar im Checkout, gehört aber zur Instanz und nicht zum
		# App-Code: ohne sie bekäme die bei --reset-checkout absichtlich
		# erhaltene Datenbank neue Zufallspasswörter und wäre für das Backend
		# nicht mehr erreichbar. Also zwischenspeichern und nach dem Klonen
		# zurücklegen - bei --reset sollen die Secrets dagegen neu sein.
		if [ "$RESET" -eq 0 ] && [ -f "$DEPLOY_DIR/.env" ]; then
			ENV_BACKUP="$(mktemp)"
			cp "$DEPLOY_DIR/.env" "$ENV_BACKUP"
		fi

		log "Verwerfe Checkout local-app/ (wird neu geklont)"
		rm -rf "$LOCAL_APP_DIR"
	fi

	log "Reset abgeschlossen. Die lokale Dev-CA in $CA_DIR bleibt erhalten."
fi

# --- App-Repo klonen/aktualisieren ------------------------------------------

if [ -d "$LOCAL_APP_DIR/.git" ]; then
	log "local-app/ existiert bereits, überspringe Klonen (kein automatisches 'git pull', um lokale Änderungen nicht zu überschreiben)."
else
	log "Klone $QONNECTRA_REPO_URL nach local-app/"
	git clone "$QONNECTRA_REPO_URL" "$LOCAL_APP_DIR"
fi

if [ -n "$ENV_BACKUP" ]; then
	log "Übernehme bisherige .env (Secrets) in den neuen Checkout"
	mv "$ENV_BACKUP" "$DEPLOY_DIR/.env"
	ENV_BACKUP=""
fi

IMPORT_COMMAND_SRC="$REPO_ROOT/scripts/qonnectra-demo-data/import_geodock_export.py"
COMMANDS_DIR="$LOCAL_APP_DIR/backend/apps/api/management/commands"

# JSON-Export des echten "Testprojekt" aus der Qonnectra-Demo-Umgebung
# (app.geodock.de), versioniert in diesem Repo. Wie er aktualisiert wird,
# steht in scripts/qonnectra-demo-data/README.md. Ein abweichender Export
# lässt sich über QONNECTRA_EXPORT_FILE einhängen.
EXPORT_FILE="${QONNECTRA_EXPORT_FILE:-$REPO_ROOT/scripts/qonnectra-demo-data/testprojekt-export.json}"
EXPORT_FILE_IN_CONTAINER=/tmp/testprojekt-export.json
IMPORT_OK=0
APP_USER_OK=0

# --- Import-Command einspielen -----------------------------------------------
#
# local-app/ ist gitignored (siehe oben) und wird bei jedem Lauf frisch
# geklont bzw. wiederverwendet - das Management-Command für den Import des
# Testprojekt-Exports liegt daher versioniert in diesem Repo
# (scripts/qonnectra-demo-data/) und wird hier vor dem Image-Build in den
# Checkout kopiert (das Backend-Image bäckt den Code zur Build-Zeit ein, ein
# reiner Volume-Mount für Quellcode existiert nicht).

log "Kopiere import_geodock_export-Command nach local-app/"
cp "$IMPORT_COMMAND_SRC" "$COMMANDS_DIR/import_geodock_export.py"

# Rückstand älterer Skript-Versionen: der fiktive Demo-Generator ist durch den
# Import des echten Testprojekts ersetzt und würde sonst im Image bleiben.
rm -f "$COMMANDS_DIR/generate_demo_project.py"

if [ ! -f "$EXPORT_FILE" ]; then
	warn "Kein Testprojekt-Export unter $EXPORT_FILE - der Stack startet ohne Projektdaten (Hinweis am Skriptende)."
fi

cd "$DEPLOY_DIR"

# --- .env erzeugen (nur beim ersten Lauf, danach idempotent) ----------------
#
# "qonnectra.localhost" statt nur "localhost" als Basisdomain: Browser lehnen
# Cookies mit Domain=.localhost als Public-Suffix ab (verifiziert per curl/
# libpsl und im echten Browser reproduziert), eine Ebene tiefer
# (.qonnectra.localhost) wird akzeptiert. Jede Subdomain-Tiefe unter
# .localhost löst weiterhin automatisch auf 127.0.0.1 auf (RFC 6761), kein
# /etc/hosts-Eintrag nötig.

if [ -f "$DEPLOY_DIR/.env" ]; then
	log ".env existiert bereits, überspringe Erzeugung (Secrets/Domains bleiben erhalten)."
else
	log "Erzeuge .env mit lokalen Test-Secrets"
	cat >"$DEPLOY_DIR/.env" <<EOF
# Lokale Test-Umgebung, Produktions-Compose (docker-compose.yml) gegen
# *.qonnectra.localhost-Domains statt echter Domains mit Let's-Encrypt-
# Zertifikaten (siehe Caddyfile.production.local + docker-compose.override.yml,
# beide werden von scripts/setup-local-qonnectra.sh generiert).
#
# NUR für lokales Ausprobieren/Handbuch-Screenshots. Nicht für Produktion.

DOMAIN_NAME=qonnectra.localhost
API_DOMAIN=api.qonnectra.localhost
APP_DOMAIN=app.qonnectra.localhost
FILES_DOMAIN=files.qonnectra.localhost
QGIS_DOMAIN=qgis.qonnectra.localhost
ADMIN_DOMAIN=admin.qonnectra.localhost
TILE_SERVER_DOMAIN=tiles.qonnectra.localhost

DJANGO_SECRET_KEY=$(random_alnum 60)
DJANGO_ALLOWED_HOSTS=api.qonnectra.localhost,admin.qonnectra.localhost,qonnectra.localhost,localhost,127.0.0.1,backend
DEBUG=False
CSRF_TRUSTED_ORIGINS=https://api.qonnectra.localhost,https://app.qonnectra.localhost,https://admin.qonnectra.localhost

DB_NAME=qonnectra
DB_USER=qonnectra_user
DB_PASSWORD=$(random_alnum 32)
DB_HOST=db
DB_PORT=5432

QGIS_DB_USER=qgis_user
QGIS_DB_PASSWORD=$(random_alnum 32)
QGIS_PG_SERVICE_NAME=qonnectra

DEFAULT_SRID=25832

CORS_ALLOWED_ORIGINS=https://app.qonnectra.localhost

DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@example.com
DJANGO_SUPERUSER_PASSWORD=$(random_alnum 16)

# Browser lehnen Domain=.localhost-Cookies ab, Domain=.qonnectra.localhost
# (eine Ebene tiefer) wird akzeptiert -> Cross-Domain-Auth-Cookies
# (api-access-token/api-refresh-token, für Kartenkacheln u.a.) UND der
# same-origin Admin-Login funktionieren damit beide gleichzeitig.
USE_COOKIE_DOMAIN_MIDDLEWARE=True
COOKIE_DOMAIN=.qonnectra.localhost

FIELD_ENCRYPTION_KEY=$(random_fernet_key)

# API_URL ist der serverseitige (SSR) Aufruf des Frontend-Containers selbst
# -> muss auf den internen Docker-Service zeigen, "api.qonnectra.localhost"
# ist aus dem Container heraus nicht erreichbar (nur über Caddy vom Host aus).
API_URL=http://backend:8000/api/v1/
PUBLIC_API_URL=https://api.qonnectra.localhost/api/v1/
PUBLIC_TILE_SERVER_URL=https://tiles.qonnectra.localhost

# Hilfe-Link in Kopfzeile und Navigationsleiste. Leer = Link ausgeblendet.
PUBLIC_DOCUMENTATION_URL=$DOCUMENTATION_URL

# Konto ohne Administrationsrechte für Screenshots aus Sicht normaler
# Nutzender. Wird nach dem Start angelegt und der Gruppe unten zugeordnet;
# angemeldet wird sich damit standardmäßig in allen Playwright-Läufen.
APP_USER_USERNAME=$APP_USER_NAME
APP_USER_EMAIL=$APP_USER_NAME@example.com
APP_USER_PASSWORD=$(random_alnum 16)
APP_USER_GROUP=$APP_USER_GROUP_NAME
EOF
fi

# --- Fehlende Schlüssel in einer bestehenden .env nachtragen ----------------
#
# Der Block oben läuft nur beim ersten Lauf. Instanzen, die mit einer
# früheren Skript-Version aufgesetzt wurden, haben die neueren Schlüssel
# deshalb nicht - ohne Nachtragen wäre ein --reset (und damit eine leere
# Datenbank) nötig, nur um an einen Konfigurationswert zu kommen.

# Fügt den Schlüssel an, falls er fehlt. Ein vorhandener Wert bleibt
# unangetastet: Secrets aus dem ersten Lauf müssen zum Stand der Datenbank
# passen, ein neu gewürfeltes Passwort passte nicht mehr zum Nutzer darin.
env_nachtragen() {
	local schluessel="$1" wert="$2" kommentar="${3:-}"
	if grep -qE "^[[:space:]]*$schluessel=" "$DEPLOY_DIR/.env"; then
		return
	fi
	log "Trage $schluessel in local-app/deployment/.env nach"
	{
		printf '\n'
		if [ -n "$kommentar" ]; then printf '%s\n' "$kommentar"; fi
		printf '%s=%s\n' "$schluessel" "$wert"
	} >>"$DEPLOY_DIR/.env"
}

# Wie env_nachtragen, überschreibt aber einen abweichenden Wert. Nur für
# Werte ohne Geheimnischarakter, die das Skript vorgibt - für Secrets nicht
# benutzen (siehe Kommentar oben).
env_setzen() {
	local schluessel="$1" wert="$2" kommentar="${3:-}"
	if ! grep -qE "^[[:space:]]*$schluessel=" "$DEPLOY_DIR/.env"; then
		env_nachtragen "$schluessel" "$wert" "$kommentar"
		return
	fi
	if [ "$(sed -nE "s|^[[:space:]]*$schluessel=||p" "$DEPLOY_DIR/.env" | head -1)" != "$wert" ]; then
		log "Setze $schluessel in local-app/deployment/.env auf $wert"
		sed -i -E "s|^[[:space:]]*$schluessel=.*|$schluessel=$wert|" "$DEPLOY_DIR/.env"
	fi
}

env_setzen PUBLIC_DOCUMENTATION_URL "$DOCUMENTATION_URL" \
	"# Hilfe-Link in Kopfzeile und Navigationsleiste. Leer = Link ausgeblendet."
env_nachtragen APP_USER_USERNAME "$APP_USER_NAME" \
	"# Konto ohne Administrationsrechte für Screenshots aus Sicht normaler Nutzender."
env_nachtragen APP_USER_EMAIL "$APP_USER_NAME@example.com"
env_nachtragen APP_USER_PASSWORD "$(random_alnum 16)"
env_nachtragen APP_USER_GROUP "$APP_USER_GROUP_NAME"

# shellcheck disable=SC1091
source "$DEPLOY_DIR/.env"

# --- Persistente lokale Dev-CA erzeugen/wiederverwenden ---------------------
#
# Ohne das hier legt Caddy bei jedem frischen caddy_data-Volume eine NEUE
# eigene CA an ("Caddy Local Authority") - der Truststore-Import im Browser
# ist danach wertlos und muss wiederholt werden. Stattdessen: einmalig eine
# eigene Root-CA auf dem Host erzeugen, read-only in den Caddy-Container
# mounten (siehe pki-Block in Caddyfile.production.local) und nur diese
# importieren.

if [ -f "$CA_CRT" ] && [ -f "$CA_KEY" ]; then
	log "Verwende vorhandene lokale Dev-CA aus $CA_DIR"
else
	log "Erzeuge lokale Dev-CA in $CA_DIR (einmalig, überlebt Rebuilds)"
	mkdir -p "$CA_DIR"
	chmod 700 "$CA_DIR"
	openssl ecparam -name prime256v1 -genkey -noout -out "$CA_KEY"
	chmod 600 "$CA_KEY"
	openssl req -x509 -new -key "$CA_KEY" -sha256 -days 3650 \
		-subj "/CN=$CA_NAME/O=Qonnectra lokale Entwicklung" \
		-addext "basicConstraints=critical,CA:TRUE,pathlen:1" \
		-addext "keyUsage=critical,keyCertSign,cRLSign" \
		-addext "subjectKeyIdentifier=hash" \
		-out "$CA_CRT"
	chmod 644 "$CA_CRT"
fi

CA_FINGERPRINT="$(openssl x509 -in "$CA_CRT" -noout -fingerprint -sha256 | cut -d= -f2)"

# --- Caddyfile.production.local erzeugen ------------------------------------
#
# Caddyfile.production erwartet echte, öffentlich auflösbare Domains für
# automatisches Let's-Encrypt-HTTPS. Für *.qonnectra.localhost gibt es keine
# öffentliche Validierung, daher hier "tls internal" pro Domain-Block ergänzen
# und global die interne CA auf die Dev-CA von oben umbiegen. Wird bei jedem
# Lauf neu aus der aktuellen Caddyfile.production erzeugt.

log "Erzeuge Caddyfile.production.local (eigene Dev-CA + tls internal pro Domain)"
{
	cat <<EOF
# Automatisch erzeugt von scripts/setup-local-qonnectra.sh - nicht bearbeiten.
#
# Der globale pki-Block biegt die von "tls internal" (unten pro Domain)
# genutzte interne CA "local" auf die persistente Dev-CA vom Host um, die
# read-only nach /etc/caddy/ca gemountet ist:
#   $CA_CRT
# Ohne das würde Caddy die CA bei jedem frischen caddy_data-Volume neu
# erzeugen und der Truststore-Import müsste jedes Mal wiederholt werden.
{
    pki {
        ca local {
            name "$CA_NAME"
            root {
                cert /etc/caddy/ca/root.crt
                key /etc/caddy/ca/root.key
            }
        }
    }
}

EOF
	sed -E \
		-e 's/^(\{\$(API|ADMIN|APP|FILES|QGIS|TILE_SERVER)_DOMAIN\} \{)$/\1\n    tls internal/' \
		"$DEPLOY_DIR/Caddyfile.production"
} >"$DEPLOY_DIR/Caddyfile.production.local"

# --- Kartenkacheln erzeugen --------------------------------------------------
#
# tileserver-gl braucht eine .mbtiles-Datei; die App liefert keine mit (siehe
# local-app/deployment/README.md, "Generating Map Tiles with Planetiler").
# Ohne sie beendet sich der Container beim Start ("Not valid input file") und
# wird von "restart: always" endlos neu gestartet.
#
# Der Lauf passiert nur einmal pro Rechner: Ergebnis und heruntergeladene
# OSM-Rohdaten liegen in $TILES_DIR außerhalb von local-app/.

if [ "$SKIP_TILES" -eq 1 ]; then
	warn "--skip-tiles: überspringe Kartenkacheln. Der tileserver wird in einer Restart-Schleife laufen, die Karte nutzt OSM-Rasterkacheln."
elif [ -f "$TILE_MBTILES" ]; then
	log "Kartenkacheln vorhanden: $TILE_MBTILES ($(du -h "$TILE_MBTILES" | cut -f1))"
elif ! command -v java >/dev/null 2>&1; then
	warn "java fehlt - Kartenkacheln können nicht erzeugt werden (Planetiler braucht Java 21+). Der tileserver läuft dadurch in einer Restart-Schleife, die Karte nutzt OSM-Rasterkacheln. Java installieren und Skript erneut ausführen, oder mit --skip-tiles absichtlich darauf verzichten."
else
	mkdir -p "$TILES_DIR"

	if [ ! -f "$PLANETILER_JAR" ]; then
		log "Lade Planetiler nach $PLANETILER_JAR"
		curl -fSL --retry 3 -o "$PLANETILER_JAR.tmp" "$PLANETILER_URL" ||
			die "Planetiler konnte nicht geladen werden: $PLANETILER_URL"
		mv "$PLANETILER_JAR.tmp" "$PLANETILER_JAR"
	fi

	log "Erzeuge Kartenkacheln für \"$TILE_AREA\" (einmalig, dauert einige Minuten)"
	# Erst unter einem Zwischennamen schreiben und dann umbenennen: ein
	# abgebrochener Lauf hinterlässt sonst eine halbe .mbtiles, die beim
	# nächsten Lauf als fertig gilt. Die Endung muss dabei .mbtiles bleiben -
	# Planetiler leitet das Archivformat aus ihr ab und bricht sonst mit
	# "Unsupported format" ab.
	# Arbeitsverzeichnis $TILES_DIR, damit Planetiler seine Downloads
	# (data/sources) und temporären Dateien ebenfalls dort ablegt und beim
	# nächsten Mal wiederverwenden kann.
	TILE_TMP="$TILES_DIR/.$TILE_AREA.partial.mbtiles"
	if (cd "$TILES_DIR" && java -Xmx4g -jar "$PLANETILER_JAR" \
		--download --area="$TILE_AREA" --force \
		--output="$TILE_TMP"); then
		mv "$TILE_TMP" "$TILE_MBTILES"
		log "Kartenkacheln fertig: $TILE_MBTILES ($(du -h "$TILE_MBTILES" | cut -f1))"
	else
		rm -f "$TILE_TMP"
		warn "Planetiler-Lauf für \"$TILE_AREA\" fehlgeschlagen. Der tileserver läuft dadurch in einer Restart-Schleife, die Karte nutzt OSM-Rasterkacheln."
	fi
fi

# Die Kacheln müssen als $DEPLOY_DIR/tiles/germany.mbtiles neben config.json
# liegen: docker-compose.yml mountet ./tiles read-only nach /data, und
# config.json verweist fest auf /data/germany.mbtiles. Ein zusätzlicher
# Bind-Mount nur für die Datei funktioniert nicht - Docker kann den
# Mountpoint im read-only gemounteten /data nicht anlegen ("create target of
# file bind-mount ... read-only file system").
#
# Deshalb eine harte Verknüpfung (kein Kopieren: spart die 130+ MB doppelt,
# und der Cache in $TILES_DIR bleibt die einzige echte Kopie). Liegt
# $TILES_DIR auf einem anderen Dateisystem als local-app/, wird kopiert.
# Der Name ist immer germany.mbtiles, unabhängig von der erzeugten Region.
if [ -f "$TILE_MBTILES" ]; then
	TILE_LINK="$DEPLOY_DIR/tiles/germany.mbtiles"
	# Neu verknüpfen, wenn die Datei fehlt oder einen anderen Stand als den
	# Cache hat. Der Größenvergleich deckt beides ab: eine harte Verknüpfung
	# ist immer gleich groß (kein unnötiges Neuanlegen), ein neu erzeugter
	# Extrakt oder ein Wechsel von QONNECTRA_TILE_AREA praktisch nie.
	if [ ! -e "$TILE_LINK" ] ||
		[ "$(stat -c %s "$TILE_MBTILES")" != "$(stat -c %s "$TILE_LINK")" ]; then
		rm -f "$TILE_LINK"
		ln "$TILE_MBTILES" "$TILE_LINK" 2>/dev/null ||
			cp "$TILE_MBTILES" "$TILE_LINK" ||
			warn "Kartenkacheln konnten nicht nach $TILE_LINK verknüpft werden."
	fi
fi

# --- docker-compose.override.yml erzeugen -----------------------------------
#
# Einzige lokal nötige Anpassung an der Produktions-Compose: Caddy auf die
# oben erzeugte Caddyfile mit "tls internal" umbiegen. nginx- und
# qgis-server-Kommandos sind in docker-compose.yml (anders als in
# docker-compose.dev.yml) bereits korrekt.

log "Erzeuge docker-compose.override.yml"
cat >"$DEPLOY_DIR/docker-compose.override.yml" <<EOF
# Automatisch erzeugt von scripts/setup-local-qonnectra.sh - lokale
# Anpassung an docker-compose.yml (Produktion) für *.qonnectra.localhost
# statt echter Domains mit Let's-Encrypt-Zertifikaten.
services:
  # docker-compose.yml listet die Umgebung des Backends einzeln auf und liest
  # kein env_file - die APP_USER_*-Werte müssen deshalb hier ergänzt werden.
  # Sie stehen im Container, damit das Skript das Konto per "manage.py shell"
  # anlegen kann, ohne das Passwort auf die Kommandozeile des Hosts (und
  # damit in die Prozessliste) zu schreiben. Die Platzhalter bleiben
  # absichtlich unaufgelöst: Compose setzt sie beim Start aus .env ein, in
  # dieser Datei steht damit kein Passwort.
  backend:
    environment:
      - APP_USER_USERNAME=\${APP_USER_USERNAME}
      - APP_USER_EMAIL=\${APP_USER_EMAIL}
      - APP_USER_PASSWORD=\${APP_USER_PASSWORD}
      - APP_USER_GROUP=\${APP_USER_GROUP}
  caddy:
    volumes:
      - ./Caddyfile.production.local:/etc/caddy/Caddyfile:ro
      - ./caddy/extra:/etc/caddy/extra:ro
      # Persistente lokale Dev-CA vom Host (siehe pki-Block in der Caddyfile)
      - $CA_DIR:/etc/caddy/ca:ro
      - caddy_data:/data
      - caddy_config:/config
      - ./logs:/var/log/caddy
      - media_volume:/media:ro
EOF

COMPOSE=(docker compose -f "$DEPLOY_DIR/docker-compose.yml" -f "$DEPLOY_DIR/docker-compose.override.yml")

# --- DNS-Check (informativ, RFC 6761 sollte das immer erfüllen) -------------

if command -v getent >/dev/null 2>&1 && ! getent hosts app.qonnectra.localhost >/dev/null 2>&1; then
	warn "app.qonnectra.localhost löst auf diesem Rechner nicht auf. Normalerweise lösen alle *.localhost-Namen automatisch auf 127.0.0.1 auf (RFC 6761); falls nicht, manuell in /etc/hosts eintragen."
fi

# --- Stack bauen und starten -------------------------------------------------

log "Baue Images und starte Stack (das kann beim ersten Lauf mehrere Minuten dauern)"
if ! "${COMPOSE[@]}" up -d --build "${SERVICES[@]}"; then
	# Bekannter Bug in postgres/init.sh: bei komplett leerem DB-Volume schlagen
	# zwei REVOKE-Statements auf noch nicht existierende Tabellen fehl
	# (model_permission/route_permission existieren erst nach den Django-
	# Migrationen). Die Postgres-Cluster-Dateien wurden dabei aber bereits
	# angelegt, ein zweiter Versuch läuft ohne erneutes initdb sauber durch.
	warn "Erster Start fehlgeschlagen (vermutlich der bekannte postgres/init.sh-Bug bei leerem DB-Volume), versuche erneut..."
	"${COMPOSE[@]}" up -d "${SERVICES[@]}"
fi

# nginx muss ggf. neu gestartet werden, falls der Backend-Container beim
# ersten Versuch neu erstellt wurde (nginx löst den Upstream-Namen nur beim
# eigenen Start auf und cached dessen Container-IP).
"${COMPOSE[@]}" restart nginx >/dev/null

# --- Alte Caddy-PKI im Volume verwerfen -------------------------------------
#
# Im caddy_data-Volume können noch Intermediate + Leaf-Zertifikate einer
# früheren (selbst erzeugten) Caddy-CA liegen. Die ketten nicht zu unserer
# Dev-CA und würden weiter ausgeliefert. Deshalb: Fingerprint der aktiven CA
# im Volume hinterlegen und bei Abweichung die lokale PKI einmalig verwerfen -
# Caddy erzeugt Intermediate und Leaf-Zertifikate dann unter unserer Root neu.

CA_MARKER=/data/caddy/.qonnectra-local-ca-fingerprint
STORED_FINGERPRINT="$("${COMPOSE[@]}" exec -T caddy cat "$CA_MARKER" 2>/dev/null || true)"
if [ "$STORED_FINGERPRINT" != "$CA_FINGERPRINT" ]; then
	log "Setze Caddy-PKI im Volume auf die lokale Dev-CA zurück"
	"${COMPOSE[@]}" exec -T caddy sh -c \
		"rm -rf /data/caddy/pki/authorities/local /data/caddy/certificates/local && printf '%s' '$CA_FINGERPRINT' >$CA_MARKER"
	"${COMPOSE[@]}" restart caddy >/dev/null
fi

log "Warte, bis die App über Caddy antwortet (Migrationen, nginx-Neustart, TLS-Zertifikate)..."
READY=0
for _ in $(seq 1 60); do
	# Bewusst mit --cacert statt -k: prüft zugleich, dass die ausgelieferte
	# Zertifikatskette wirklich unter unserer Dev-CA hängt.
	code="$(curl -s --cacert "$CA_CRT" -o /dev/null -w '%{http_code}' "https://${APP_DOMAIN}/login" 2>/dev/null || true)"
	if [ "$code" = "200" ]; then
		READY=1
		break
	fi
	sleep 2
done
if [ "$READY" -eq 1 ]; then
	log "App antwortet."

	# Die Prüfung oben betrifft nur das Frontend. Das Backend arbeitet zu dem
	# Zeitpunkt bei leerer Datenbank noch an Migrationen und
	# load_initial_data - ein Import davor scheitert an fehlenden Tabellen
	# bzw. würde Referenzdaten ohne die Werte aus den Fixtures anlegen, und
	# die Gruppen für das Anwender-Konto legt erst die Migration
	# 0058_seed_permission_data an. Deshalb hier auf beides warten: Tabellen
	# vorhanden (Projects) und Fixtures eingespielt (AttributesCableType).
	log "Warte auf Migrationen und Initialdaten im Backend..."
	BACKEND_READY=0
	for _ in $(seq 1 60); do
		if "${COMPOSE[@]}" exec -T backend python manage.py shell -c \
			"from apps.api.models import AttributesCableType, Projects; assert AttributesCableType.objects.exists() and Projects.objects.exists()" \
			>/dev/null 2>&1; then
			BACKEND_READY=1
			break
		fi
		sleep 3
	done

	if [ "$BACKEND_READY" -eq 0 ]; then
		warn "Backend hat Migrationen/Initialdaten nach 3 Minuten nicht abgeschlossen - Import des Testprojekts und Anlegen des Anwender-Kontos übersprungen."
	else
		if [ -f "$EXPORT_FILE" ]; then
			log "Importiere Testprojekt-Export für Handbuch-Screenshots (idempotent: ein bereits importiertes Projekt bleibt unangetastet)"
			"${COMPOSE[@]}" cp "$EXPORT_FILE" "backend:$EXPORT_FILE_IN_CONTAINER"
			if "${COMPOSE[@]}" exec -T backend python manage.py import_geodock_export \
				--file "$EXPORT_FILE_IN_CONTAINER"; then
				IMPORT_OK=1
			else
				warn "Import des Testprojekt-Exports fehlgeschlagen (Ausgabe oben)."
			fi
		fi

		# --- Konto ohne Administrationsrechte anlegen -----------------------
		#
		# Das Skript schickt den Python-Code über die Standardeingabe an
		# "manage.py shell" (ohne Terminal führt der Befehl aus, was dort
		# ankommt). Die Zugangsdaten liest der Code aus der Umgebung des
		# Containers, die docker-compose.override.yml gesetzt hat - so
		# tauchen sie weder in der Prozessliste des Hosts noch in der
		# Skript-Ausgabe auf.
		#
		# Idempotent: bei jedem Lauf werden Passwort, Rechte-Flags und
		# Gruppenzuordnung neu gesetzt. Ein von Hand geändertes Passwort in
		# .env wirkt damit beim nächsten Lauf.
		log "Lege Konto \"$APP_USER_USERNAME\" (Gruppe \"$APP_USER_GROUP\", keine Administrationsrechte) an"
		if "${COMPOSE[@]}" exec -T backend python manage.py shell <<'PYTHON'; then
import os

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.cache import cache

username = os.environ["APP_USER_USERNAME"]
gruppenname = os.environ["APP_USER_GROUP"]

gruppe = Group.objects.filter(name=gruppenname).first()
if gruppe is None:
    vorhanden = ", ".join(Group.objects.values_list("name", flat=True)) or "keine"
    raise SystemExit(
        f"Gruppe {gruppenname!r} existiert nicht. Vorhandene Gruppen: {vorhanden}"
    )

User = get_user_model()
nutzer, neu = User.objects.get_or_create(username=username)
nutzer.email = os.environ.get("APP_USER_EMAIL", "")
# Ausdrücklich beides aus: is_staff öffnet die Django-Administration,
# is_superuser umgeht in der App jede Rechteprüfung (get_user_permissions
# gibt dann Platzhalter-Vollzugriff zurück).
nutzer.is_staff = False
nutzer.is_superuser = False
nutzer.is_active = True
nutzer.set_password(os.environ["APP_USER_PASSWORD"])
nutzer.save()
nutzer.groups.set([gruppe])

# Die Rechteprüfung der API hält die Zugriffsstufen fünf Minuten im Cache;
# nach einem Gruppenwechsel gälte sonst noch die alte Zuordnung.
cache.delete(f"user_permissions:{nutzer.pk}")

print(f"Konto {username!r} {'angelegt' if neu else 'aktualisiert'}, Gruppe {gruppenname!r}.")
PYTHON
			APP_USER_OK=1
		else
			warn "Das Konto \"$APP_USER_USERNAME\" konnte nicht angelegt werden (Ausgabe oben). Playwright-Läufe scheitern dann an der Anmeldung; als Notbehelf mit QONNECTRA_LOGIN=admin arbeiten."
		fi
	fi
else
	if [ "$(curl -sk -o /dev/null -w '%{http_code}' "https://${APP_DOMAIN}/login" 2>/dev/null || true)" = "200" ]; then
		warn "App antwortet, aber ihr Zertifikat kettet nicht zur lokalen Dev-CA ($CA_CRT) - Caddy-Logs prüfen: docker compose -f docker-compose.yml -f docker-compose.override.yml logs caddy"
	else
		warn "App antwortet nach 2 Minuten noch nicht - Container-Logs prüfen: docker compose -f docker-compose.yml -f docker-compose.override.yml logs backend"
	fi
fi

# --- Truststore-Status der lokalen CA ---------------------------------------
#
# Die CA selbst wird nicht mehr aus dem Container exportiert (sie kommt vom
# Host), es bleibt nur die Frage, ob sie schon importiert ist.

if openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt "$CA_CRT" >/dev/null 2>&1; then
	CA_TRUSTED=1
else
	CA_TRUSTED=0
fi

# Veralteten Export früherer Skript-Versionen entfernen, damit niemand
# versehentlich die alte, nicht mehr genutzte Caddy-CA importiert.
rm -f "$DEPLOY_DIR/qonnectra-local-dev-ca.crt"

# --- Zusammenfassung ---------------------------------------------------------

if [ "$CA_TRUSTED" -eq 1 ]; then
	CA_SECTION="Lokale Dev-CA: $CA_CRT
Bereits im System-Truststore. Die CA liegt außerhalb von local-app/ und des
Docker-Volumes und überlebt damit Rebuilds inkl. \"docker compose down -v\" -
ein erneuter Import ist nur nötig, wenn $CA_DIR gelöscht wird.

Firefox und snap-/flatpak-Browser (z. B. snap-Chromium) haben eigene
Truststores und sind damit NICHT automatisch abgedeckt. Falls dort noch eine
Zertifikatswarnung kommt, einmal nachziehen - das Skript ist idempotent und
braucht kein sudo mehr, wenn der System-Truststore schon steht:
  $REPO_ROOT/scripts/install-local-ca.sh"
else
	CA_SECTION="Lokale Dev-CA: $CA_CRT
Noch nicht importiert, der Browser warnt daher weiterhin. Einmalig importieren
(gilt danach für alle künftigen Rebuilds, die CA wird nicht mehr neu erzeugt):
  $REPO_ROOT/scripts/install-local-ca.sh"
fi

if [ "$IMPORT_OK" -eq 1 ]; then
	PROJECT_SECTION="Für Screenshots/Videos steht das aus der Demo-Umgebung exportierte Projekt
\"Testprojekt\" zur Verfügung (nach Login oben links auswählen). Nach einem
aktualisierten Export neu importieren (--force wirft das lokale Projekt vorher
weg):
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml cp $EXPORT_FILE backend:$EXPORT_FILE_IN_CONTAINER
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml exec backend python manage.py import_geodock_export --file $EXPORT_FILE_IN_CONTAINER --force"
elif [ -f "$EXPORT_FILE" ]; then
	PROJECT_SECTION="Der Testprojekt-Export wurde NICHT importiert (siehe Warnungen oben), die
Instanz enthält also keine Projektdaten. Import nachholen, sobald die App
vollständig läuft:
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml cp $EXPORT_FILE backend:$EXPORT_FILE_IN_CONTAINER
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml exec backend python manage.py import_geodock_export --file $EXPORT_FILE_IN_CONTAINER"
else
	PROJECT_SECTION="Die Instanz enthält noch KEINE Projektdaten: unter
  $EXPORT_FILE
liegt kein Export des \"Testprojekt\". Normalerweise kommt er mit diesem Repo
(scripts/qonnectra-demo-data/testprojekt-export.json, siehe README.md dort) -
Datei wiederherstellen und Skript erneut ausführen (oder direkt importieren):
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml cp <export.json> backend:$EXPORT_FILE_IN_CONTAINER
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml exec backend python manage.py import_geodock_export --file $EXPORT_FILE_IN_CONTAINER"
fi

if [ "$APP_USER_OK" -eq 1 ]; then
	LOGIN_SECTION="Zwei Konten stehen bereit:

  Anwendung (Standard für Screenshots, keine Administrationsrechte):
    ${APP_USER_USERNAME} / ${APP_USER_PASSWORD}   (Gruppe \"${APP_USER_GROUP}\")
  Administration (Django-Superuser, sieht und darf alles):
    ${DJANGO_SUPERUSER_USERNAME} / ${DJANGO_SUPERUSER_PASSWORD}

Playwright melden sich standardmäßig mit dem Anwender-Konto an, damit die
Bilder die Sicht normaler Nutzender zeigen. Für einen Lauf als Superuser:
  QONNECTRA_LOGIN=admin pnpm test:e2e"
else
	LOGIN_SECTION="Login (Django-Superuser): ${DJANGO_SUPERUSER_USERNAME} / ${DJANGO_SUPERUSER_PASSWORD}

Das Konto ohne Administrationsrechte wurde NICHT angelegt (siehe Warnungen
oben). Playwright-Läufe scheitern damit an der Anmeldung, solange sie nicht
mit QONNECTRA_LOGIN=admin gestartet werden. Nach dem Beheben genügt ein
erneuter Lauf dieses Skripts."
fi

if [ -f "$TILE_MBTILES" ]; then
	TILES_SECTION="Kartenkacheln: $TILE_MBTILES
Die Karte zeigt damit die echte Vektor-Basiskarte (Hell-/Dunkelmodus), nicht
den OSM-Fallback. Die Kacheln liegen außerhalb von local-app/ und überleben
--reset und --reset-checkout. Für eine andere Region löschen und neu erzeugen:
  QONNECTRA_TILE_AREA=<region> $REPO_ROOT/scripts/setup-local-qonnectra.sh"
else
	TILES_SECTION="Kartenkacheln: KEINE unter $TILE_MBTILES
Der tileserver läuft deshalb in einer Restart-Schleife; das Frontend fällt
automatisch auf OSM-Rasterkacheln zurück. Erzeugen (braucht Java 21+):
  $REPO_ROOT/scripts/setup-local-qonnectra.sh"
fi

log "Fertig!"
cat <<EOF

Qonnectra läuft unter:
  Frontend : https://app.qonnectra.localhost
  Admin    : https://admin.qonnectra.localhost/admin
  API      : https://api.qonnectra.localhost

$LOGIN_SECTION

Hilfe-Link der App (PUBLIC_DOCUMENTATION_URL): $DOCUMENTATION_URL

$PROJECT_SECTION

Zertifikate: Für *.localhost gibt es kein echtes Let's Encrypt (RFC 6761),
Caddy signiert die Zertifikate daher lokal - hier mit der Dev-CA vom Host
statt mit einer bei jedem frischen Volume neu erzeugten Caddy-CA.

$CA_SECTION

$TILES_SECTION

Stack stoppen:
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml down

Skript erneut ausführen, um den Stack neu zu bauen/starten (Secrets/DB bleiben
erhalten, solange local-app/deployment/.env nicht gelöscht wird). Für einen
Neuaufbau mit leerer Datenbank und frischen Secrets:
  $REPO_ROOT/scripts/setup-local-qonnectra.sh --reset
Zusätzlich den App-Checkout neu klonen (verwirft Änderungen in local-app/):
  $REPO_ROOT/scripts/setup-local-qonnectra.sh --reset --reset-checkout
EOF
