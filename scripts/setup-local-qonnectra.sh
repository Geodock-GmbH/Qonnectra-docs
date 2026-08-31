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
# Voraussetzungen: git, Docker Engine 24+, Docker Compose v2 ("docker compose").
# Der ausführende Nutzer muss den Docker-Daemon ansprechen können (Mitglied
# der "docker"-Gruppe oder root).
#
# Verwendung:
#   scripts/setup-local-qonnectra.sh
#
# Nach dem Lauf erreichbar unter https://app.qonnectra.localhost (siehe
# Ausgabe am Skriptende für Zugangsdaten und Zertifikats-Import).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL_APP_DIR="$REPO_ROOT/local-app"
DEPLOY_DIR="$LOCAL_APP_DIR/deployment"
QONNECTRA_REPO_URL="https://github.com/Geodock-GmbH/Qonnectra.git"

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

# --- Voraussetzungen prüfen -------------------------------------------------

command -v git >/dev/null 2>&1 || die "git ist nicht installiert."
command -v curl >/dev/null 2>&1 || die "curl ist nicht installiert."
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

# --- App-Repo klonen/aktualisieren ------------------------------------------

if [ -d "$LOCAL_APP_DIR/.git" ]; then
	log "local-app/ existiert bereits, überspringe Klonen (kein automatisches 'git pull', um lokale Änderungen nicht zu überschreiben)."
else
	log "Klone $QONNECTRA_REPO_URL nach local-app/"
	git clone "$QONNECTRA_REPO_URL" "$LOCAL_APP_DIR"
fi

DEMO_DATA_COMMAND_SRC="$REPO_ROOT/scripts/qonnectra-demo-data/generate_demo_project.py"
DEMO_DATA_COMMAND_DEST="$LOCAL_APP_DIR/backend/apps/api/management/commands/generate_demo_project.py"

# --- Demo-Datensatz-Command einspielen ---------------------------------------
#
# local-app/ ist gitignored (siehe oben) und wird bei jedem Lauf frisch
# geklont bzw. wiederverwendet - das Management-Command für die fiktiven
# Handbuch-Testdaten liegt daher versioniert in diesem Repo
# (scripts/qonnectra-demo-data/) und wird hier vor dem Image-Build in den
# Checkout kopiert (das Backend-Image bäckt den Code zur Build-Zeit ein, ein
# reiner Volume-Mount für Quellcode existiert nicht).

log "Kopiere generate_demo_project-Command nach local-app/"
cp "$DEMO_DATA_COMMAND_SRC" "$DEMO_DATA_COMMAND_DEST"

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
EOF
fi

# shellcheck disable=SC1091
source "$DEPLOY_DIR/.env"

# --- Caddyfile.production.local erzeugen ------------------------------------
#
# Caddyfile.production erwartet echte, öffentlich auflösbare Domains für
# automatisches Let's-Encrypt-HTTPS. Für *.qonnectra.localhost gibt es keine
# öffentliche Validierung, daher hier "tls internal" (Caddys eigene lokale CA)
# pro Domain-Block ergänzen. Wird bei jedem Lauf neu aus der aktuellen
# Caddyfile.production erzeugt.

log "Erzeuge Caddyfile.production.local (tls internal pro Domain)"
sed -E \
	-e 's/^(\{\$(API|ADMIN|APP|FILES|QGIS|TILE_SERVER)_DOMAIN\} \{)$/\1\n    tls internal/' \
	"$DEPLOY_DIR/Caddyfile.production" >"$DEPLOY_DIR/Caddyfile.production.local"

# --- docker-compose.override.yml erzeugen -----------------------------------
#
# Einzige lokal nötige Anpassung an der Produktions-Compose: Caddy auf die
# oben erzeugte Caddyfile mit "tls internal" umbiegen. nginx- und
# qgis-server-Kommandos sind in docker-compose.yml (anders als in
# docker-compose.dev.yml) bereits korrekt.

log "Erzeuge docker-compose.override.yml"
cat >"$DEPLOY_DIR/docker-compose.override.yml" <<'EOF'
# Automatisch erzeugt von scripts/setup-local-qonnectra.sh - lokale
# Anpassung an docker-compose.yml (Produktion) für *.qonnectra.localhost
# statt echter Domains mit Let's-Encrypt-Zertifikaten.
services:
  caddy:
    volumes:
      - ./Caddyfile.production.local:/etc/caddy/Caddyfile:ro
      - ./caddy/extra:/etc/caddy/extra:ro
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

log "Warte, bis die App über Caddy antwortet (Migrationen, nginx-Neustart, TLS-Zertifikate)..."
READY=0
for _ in $(seq 1 60); do
	code="$(curl -sk -o /dev/null -w '%{http_code}' "https://app.qonnectra.localhost/login" 2>/dev/null || true)"
	if [ "$code" = "200" ]; then
		READY=1
		break
	fi
	sleep 2
done
if [ "$READY" -eq 1 ]; then
	log "App antwortet."

	log "Erzeuge fiktives Demo-Ausbaugebiet 'Glashofen' für Handbuch-Screenshots (idempotent)"
	"${COMPOSE[@]}" exec -T backend python manage.py generate_demo_project || true
else
	warn "App antwortet nach 2 Minuten noch nicht - Container-Logs prüfen: docker compose -f docker-compose.yml -f docker-compose.override.yml logs backend"
fi

# --- Lokale CA extrahieren (für warnungsfreies HTTPS im Browser) -----------

CA_CERT_PATH="$DEPLOY_DIR/qonnectra-local-dev-ca.crt"
if docker cp qonnectra_caddy_prod:/data/caddy/pki/authorities/local/root.crt "$CA_CERT_PATH" >/dev/null 2>&1; then
	log "Lokale CA nach $CA_CERT_PATH exportiert"
else
	warn "Konnte die lokale CA noch nicht exportieren (Caddy evtl. noch nicht bereit). Einfach das Skript erneut ausführen, sobald der Stack läuft."
fi

# --- Zusammenfassung ---------------------------------------------------------

log "Fertig!"
cat <<EOF

Qonnectra läuft unter:
  Frontend : https://app.qonnectra.localhost
  Admin    : https://admin.qonnectra.localhost/admin
  API      : https://api.qonnectra.localhost

Login: ${DJANGO_SUPERUSER_USERNAME} / ${DJANGO_SUPERUSER_PASSWORD}

Für Screenshots/Videos steht das fiktive Projekt "Ausbaugebiet Glashofen"
zur Verfügung (nach Login oben links auswählen). Neu erzeugen (z. B. nach
Datenänderungen für Screenshots):
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml exec backend python manage.py generate_demo_project --force

Zertifikatswarnung im Browser: Die *.qonnectra.localhost-Zertifikate stammen
von einer lokalen Caddy-CA (kein echtes Let's Encrypt möglich für *.localhost,
siehe RFC 6761). Einmalig importieren, dann keine Warnungen mehr:
  $CA_CERT_PATH
  Firefox: Einstellungen > Datenschutz & Sicherheit > Zertifikate anzeigen >
           Zertifizierungsstellen > Importieren > "Dieser CA vertrauen..." setzen
  Chrome/Linux (System-Speicher):
    sudo cp $CA_CERT_PATH /usr/local/share/ca-certificates/qonnectra-local-dev-ca.crt
    sudo update-ca-certificates

Hinweis: tileserver (Kartenkacheln als Basiskarte) läuft ohne echte
Kartendaten (.mbtiles) weiter in einer Restart-Schleife - das Frontend fällt
dafür automatisch auf OSM-Kacheln zurück. Siehe local-app/deployment/README.md
Abschnitt "Generating Map Tiles with Planetiler", falls echte Kacheln
gebraucht werden.

Stack stoppen:
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml down

Skript erneut ausführen, um den Stack neu zu bauen/starten (Secrets/DB bleiben
erhalten, solange local-app/deployment/.env nicht gelöscht wird).
EOF
