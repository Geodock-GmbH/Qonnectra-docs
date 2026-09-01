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
# ("docker compose"). Der ausführende Nutzer muss den Docker-Daemon ansprechen
# können (Mitglied der "docker"-Gruppe oder root).
#
# Verwendung:
#   scripts/setup-local-qonnectra.sh
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

	log "Erzeuge fiktives Demo-Ausbaugebiet 'Glashofen' für Handbuch-Screenshots (idempotent)"
	"${COMPOSE[@]}" exec -T backend python manage.py generate_demo_project || true
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

Zertifikate: Für *.localhost gibt es kein echtes Let's Encrypt (RFC 6761),
Caddy signiert die Zertifikate daher lokal - hier mit der Dev-CA vom Host
statt mit einer bei jedem frischen Volume neu erzeugten Caddy-CA.

$CA_SECTION

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
