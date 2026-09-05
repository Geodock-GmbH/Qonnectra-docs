#!/usr/bin/env bash
#
# Clones/updates the Qonnectra app (Geodock-GmbH/Qonnectra) into local-app/ and
# runs it locally against the PRODUCTION compose file (docker-compose.yml), so
# that the screenshots/examples in the manual match the real production
# configuration (not docker-compose.dev.yml).
#
# local-app/ is deliberately NOT part of this repo (see .gitignore) - this
# script is the reproducible replacement for it and may be run as often as you
# like on any machine (idempotent).
#
# Requirements: git, curl, openssl, Docker Engine 24+, Docker Compose v2
# ("docker compose") as well as Java 21+ for the map tiles (see --skip-tiles).
# The invoking user must be able to talk to the Docker daemon (member of the
# "docker" group or root).
#
# Usage:
#   scripts/setup-local-qonnectra.sh [--reset] [--reset-checkout]
#
# --reset discards the data of the instance (containers, volumes including the
# database, generated configuration together with its secrets),
# --reset-checkout additionally the checkout in local-app/. The local dev CA is
# kept in both cases.
#
# HTTPS runs through a persistent local dev CA in ~/.local/share/
# qonnectra-local-ca/, mounted read-only into the Caddy container. It lives
# outside local-app/ and outside the Docker volumes and therefore only has to be
# imported into the trust stores once per machine
# (scripts/install-local-ca.sh) - not after every rebuild.
#
# After the run it is reachable at https://app.qonnectra.localhost (see the
# output at the end of the script for credentials and certificate import).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL_APP_DIR="$REPO_ROOT/local-app"
DEPLOY_DIR="$LOCAL_APP_DIR/deployment"
QONNECTRA_REPO_URL="https://github.com/Geodock-GmbH/Qonnectra.git"

# Persistent local dev CA. Deliberately lives OUTSIDE local-app/ (which gets
# cloned/deleted) and outside this repo (it contains a private key), so that it
# survives rebuilds, "docker compose down -v" and fresh clones and only has to
# be imported into the system/browser trust stores ONCE. Overridable via
# QONNECTRA_CA_DIR.
CA_DIR="${QONNECTRA_CA_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/qonnectra-local-ca}"
CA_CRT="$CA_DIR/root.crt"
CA_KEY="$CA_DIR/root.key"
CA_NAME="Qonnectra Local Dev CA"

# Map tiles (.mbtiles) for the tileserver. The app deliberately ships none, but
# tileserver-gl exits immediately without them and, thanks to
# "restart: always", ends up in an endless loop - the map would then fall back
# to OSM raster tiles instead of showing the real vector base map.
#
# Like the dev CA, the tiles live OUTSIDE local-app/ (which gets cloned/deleted)
# and outside this repo (several hundred MB), so that --reset,
# --reset-checkout and a fresh clone do not trigger a multi-minute Planetiler
# run every time. The default is Schleswig-Holstein: the test project lies
# entirely at 9.74 E / 54.73 N (north-east of Flensburg). Overridable via
# QONNECTRA_TILE_AREA (e.g. "germany", which takes considerably longer and
# needs ~3 GB).
TILES_DIR="${QONNECTRA_TILES_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/qonnectra-local-tiles}"
TILE_AREA="${QONNECTRA_TILE_AREA:-schleswig-holstein}"
TILE_MBTILES="$TILES_DIR/$TILE_AREA.mbtiles"
PLANETILER_JAR="$TILES_DIR/planetiler.jar"
PLANETILER_URL="https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar"

# Help link of the app (PUBLIC_DOCUMENTATION_URL). The app shows it in the
# header, the navigation bar and the mobile navigation, and hides it while the
# variable is empty - so for screenshots of the interface it has to be set.
# Points at this documentation site.
DOCUMENTATION_URL="${QONNECTRA_DOCUMENTATION_URL:-https://qonnectra.de/}"

# Second account WITHOUT administration rights. The Django superuser sees every
# menu entry and may do anything - images taken with it show an interface
# ordinary users never get to see. Part A of the manual describes exactly their
# view though, which is why the screenshots are made with this account (see
# playwright/local-app.ts).
#
# Group "Editor" (from migration api/0058_seed_permission_data): all domain data
# editable - so "Speichern" and the editing dialogs are in the picture - but no
# access to /admin/* and therefore no "Logs" menu entry. Alternatives: "Viewer"
# (read-only, no editing buttons) or "Admin" (like Editor plus /admin/*).
#
# Both values only take effect while local-app/deployment/.env does not exist
# yet - after that whatever is in there applies (name and password have to match
# the user in the database). The group can be changed in .env afterwards; it is
# reassigned on every run.
APP_USER_NAME="${QONNECTRA_APP_USER:-anwender}"
APP_USER_GROUP_NAME="${QONNECTRA_APP_USER_GROUP:-Editor}"

# All services except "wireguard" (VPN access, irrelevant for local
# experimentation and manual screenshots, and would only need additional host
# capabilities).
SERVICES=(db backend backend-wms qgis-server pg-error-parser frontend nginx tileserver caddy)

log() { printf '\n\033[1;32m==>\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33mWARNING:\033[0m %s\n' "$1" >&2; }
die() { printf '\033[1;31mERROR:\033[0m %s\n' "$1" >&2; exit 1; }

random_alnum() {
	LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c "$1"
}

random_fernet_key() {
	# Fernet key: base64(urlsafe) of 32 random bytes, see FIELD_ENCRYPTION_KEY
	head -c 32 /dev/urandom | base64 | tr '+/' '-_'
}

usage() {
	cat <<EOF
Usage: $(basename "$0") [--reset] [--reset-checkout] [--skip-tiles]

  --reset           Discard the data of the local instance and rebuild it:
                    containers, Docker volumes (database, media, Caddy data)
                    and the generated configuration including the secrets in
                    local-app/deployment/.env. The checkout local-app/ is left
                    untouched.
  --reset-checkout  Delete the checkout local-app/ and clone it again. This
                    also discards your own changes in it. On its own it leaves
                    database and secrets alone, and can be combined with
                    --reset.
  --skip-tiles      Do not generate map tiles. The tileserver then runs into a
                    restart loop without data and the map falls back to OSM
                    raster tiles.
  -h, --help        Show this help.

The local dev CA in
  $CA_DIR
is kept in any case - so the trust store import does not have to be repeated.
The map tiles in
  $TILES_DIR
are likewise kept; they are only generated when they are missing there.

Two accounts are created: the Django superuser for administration and an
account without administration rights, which the manual screenshots are made
with (name/group selectable on the first run via QONNECTRA_APP_USER and
QONNECTRA_APP_USER_GROUP respectively, afterwards via
local-app/deployment/.env). The help link of the app is set by
QONNECTRA_DOCUMENTATION_URL.
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
		die "Unknown option: $arg"
		;;
	esac
done

# --- Check requirements -----------------------------------------------------

command -v git >/dev/null 2>&1 || die "git is not installed."
command -v curl >/dev/null 2>&1 || die "curl is not installed."
command -v openssl >/dev/null 2>&1 || die "openssl is not installed."
command -v docker >/dev/null 2>&1 || die "docker is not installed."
docker compose version >/dev/null 2>&1 || die "docker compose (v2 plugin) is not available."

# Make sure Docker is reachable. If the current login does not have the docker
# group membership in the running process yet (e.g. right after
# "usermod -aG docker"), re-run once through "sg docker".
if ! docker info >/dev/null 2>&1; then
	if command -v sg >/dev/null 2>&1 && sg docker -c "docker info" >/dev/null 2>&1; then
		warn "No Docker access in this shell, restarting the script through 'sg docker'."
		exec sg docker -c "'$0' $*"
	fi
	die "No access to the Docker daemon. Add the user to the docker group: sudo usermod -aG docker \$USER (then log in again)."
fi

# --- Reset (only with --reset / --reset-checkout) ---------------------------
#
# --reset removes everything that holds state: containers, the Docker volumes
# with database/media/Caddy data and the generated configuration together with
# its secrets. --reset-checkout additionally throws away the checkout in
# local-app/. Both are recreated further below. Excluded in any case is the dev
# CA in $CA_DIR: it lives outside and is meant to survive the one-off trust
# store import.

if [ "$RESET" -eq 1 ] || [ "$RESET_CHECKOUT" -eq 1 ]; then
	# Stop the containers in both cases - with --reset including the volumes,
	# otherwise only the containers, so that the new checkout is not brought up
	# against leftovers of the old one. This has to happen before deleting
	# local-app/, because the compose files live there.
	if [ -f "$DEPLOY_DIR/docker-compose.yml" ]; then
		DOWN=(docker compose -f "$DEPLOY_DIR/docker-compose.yml")
		if [ -f "$DEPLOY_DIR/docker-compose.override.yml" ]; then
			DOWN+=(-f "$DEPLOY_DIR/docker-compose.override.yml")
		fi
		if [ "$RESET" -eq 1 ]; then
			log "Reset: discarding containers, volumes (including the database) and secrets"
			DOWN+=(down -v --remove-orphans)
		else
			log "Stopping containers (volumes and database are kept)"
			DOWN+=(down --remove-orphans)
		fi
		# From within $DEPLOY_DIR, so that the same compose project name as on
		# startup applies (it is derived from the directory name).
		(cd "$DEPLOY_DIR" && "${DOWN[@]}") ||
			warn "\"docker compose down\" failed - leftovers are removed directly in a moment."
	fi

	if [ "$RESET" -eq 1 ]; then
		# Follow-up resp. fallback: the volumes have fixed names (see
		# docker-compose.yml) and would otherwise survive if local-app/ had been
		# deleted by hand beforehand or if "down" failed.
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
			warn "These volumes could not be removed (probably still in use by a container): $(echo "$REMAINING" | tr '\n' ' ')"
		fi

		# Generated configuration including the secrets. Without this the new,
		# empty database would keep the old passwords from .env.
		rm -f "$DEPLOY_DIR/.env" \
			"$DEPLOY_DIR/Caddyfile.production.local" \
			"$DEPLOY_DIR/docker-compose.override.yml"
	fi

	if [ "$RESET_CHECKOUT" -eq 1 ]; then
		# .env does live inside the checkout, but it belongs to the instance and
		# not to the app code: without it the database that --reset-checkout
		# deliberately keeps would get new random passwords and would no longer
		# be reachable for the backend. So keep a copy and put it back after
		# cloning - with --reset, by contrast, the secrets are meant to be new.
		if [ "$RESET" -eq 0 ] && [ -f "$DEPLOY_DIR/.env" ]; then
			ENV_BACKUP="$(mktemp)"
			cp "$DEPLOY_DIR/.env" "$ENV_BACKUP"
		fi

		log "Discarding checkout local-app/ (will be cloned again)"
		rm -rf "$LOCAL_APP_DIR"
	fi

	log "Reset finished. The local dev CA in $CA_DIR is kept."
fi

# --- Clone/update the app repo ----------------------------------------------

if [ -d "$LOCAL_APP_DIR/.git" ]; then
	log "local-app/ already exists, skipping the clone (no automatic 'git pull', so that local changes are not overwritten)."
else
	log "Cloning $QONNECTRA_REPO_URL into local-app/"
	git clone "$QONNECTRA_REPO_URL" "$LOCAL_APP_DIR"
fi

if [ -n "$ENV_BACKUP" ]; then
	log "Carrying the previous .env (secrets) over into the new checkout"
	mv "$ENV_BACKUP" "$DEPLOY_DIR/.env"
	ENV_BACKUP=""
fi

IMPORT_COMMAND_SRC="$REPO_ROOT/scripts/qonnectra-demo-data/import_geodock_export.py"
COMMANDS_DIR="$LOCAL_APP_DIR/backend/apps/api/management/commands"

# JSON export of the real "Testprojekt" from the Qonnectra demo environment
# (app.geodock.de), versioned in this repo. How it is updated is described in
# scripts/qonnectra-demo-data/README.md. A different export can be plugged in
# through QONNECTRA_EXPORT_FILE.
EXPORT_FILE="${QONNECTRA_EXPORT_FILE:-$REPO_ROOT/scripts/qonnectra-demo-data/testprojekt-export.json}"
EXPORT_FILE_IN_CONTAINER=/tmp/testprojekt-export.json
IMPORT_OK=0
APP_USER_OK=0

# --- Install the import command ---------------------------------------------
#
# local-app/ is gitignored (see above) and is freshly cloned resp. reused on
# every run - the management command for importing the test project export
# therefore lives versioned in this repo (scripts/qonnectra-demo-data/) and is
# copied into the checkout here before the image build (the backend image bakes
# the code in at build time, there is no plain volume mount for source code).

log "Copying the import_geodock_export command into local-app/"
cp "$IMPORT_COMMAND_SRC" "$COMMANDS_DIR/import_geodock_export.py"

# Leftover from older script versions: the fictional demo generator has been
# replaced by the import of the real test project and would otherwise stay in
# the image.
rm -f "$COMMANDS_DIR/generate_demo_project.py"

if [ ! -f "$EXPORT_FILE" ]; then
	warn "No test project export at $EXPORT_FILE - the stack starts without project data (note at the end of the script)."
fi

cd "$DEPLOY_DIR"

# --- Create .env (only on the first run, idempotent afterwards) -------------
#
# "qonnectra.localhost" instead of just "localhost" as the base domain:
# browsers reject cookies with Domain=.localhost as a public suffix (verified
# with curl/libpsl and reproduced in a real browser), one level deeper
# (.qonnectra.localhost) is accepted. Any subdomain depth below .localhost
# still resolves to 127.0.0.1 automatically (RFC 6761), no /etc/hosts entry
# needed.

if [ -f "$DEPLOY_DIR/.env" ]; then
	log ".env already exists, skipping creation (secrets/domains are kept)."
else
	log "Creating .env with local test secrets"
	cat >"$DEPLOY_DIR/.env" <<EOF
# Local test environment, production compose (docker-compose.yml) against
# *.qonnectra.localhost domains instead of real domains with Let's Encrypt
# certificates (see Caddyfile.production.local + docker-compose.override.yml,
# both generated by scripts/setup-local-qonnectra.sh).
#
# ONLY for local experimentation / manual screenshots. Not for production.

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

# Browsers reject Domain=.localhost cookies, Domain=.qonnectra.localhost (one
# level deeper) is accepted -> cross-domain auth cookies
# (api-access-token/api-refresh-token, for map tiles among others) AND the
# same-origin admin login both work at the same time.
USE_COOKIE_DOMAIN_MIDDLEWARE=True
COOKIE_DOMAIN=.qonnectra.localhost

FIELD_ENCRYPTION_KEY=$(random_fernet_key)

# API_URL is the server-side (SSR) call of the frontend container itself
# -> it has to point at the internal Docker service, "api.qonnectra.localhost"
# is not reachable from inside the container (only through Caddy from the host).
API_URL=http://backend:8000/api/v1/
PUBLIC_API_URL=https://api.qonnectra.localhost/api/v1/
PUBLIC_TILE_SERVER_URL=https://tiles.qonnectra.localhost

# Help link in the header and the navigation bar. Empty = link hidden.
PUBLIC_DOCUMENTATION_URL=$DOCUMENTATION_URL

# Account without administration rights, for screenshots from the perspective
# of ordinary users. Created after startup and assigned to the group below;
# all Playwright runs log in with it by default.
APP_USER_USERNAME=$APP_USER_NAME
APP_USER_EMAIL=$APP_USER_NAME@example.com
APP_USER_PASSWORD=$(random_alnum 16)
APP_USER_GROUP=$APP_USER_GROUP_NAME
EOF
fi

# --- Append missing keys to an existing .env --------------------------------
#
# The block above only runs on the first run. Instances that were set up with
# an earlier version of the script therefore do not have the newer keys -
# without appending them a --reset (and with it an empty database) would be
# necessary just to get at a configuration value.

# Appends the key if it is missing. An existing value is left untouched:
# secrets from the first run have to match the state of the database, and a
# freshly rolled password would no longer match the user in it.
env_append() {
	local key="$1" value="$2" comment="${3:-}"
	if grep -qE "^[[:space:]]*$key=" "$DEPLOY_DIR/.env"; then
		return
	fi
	log "Appending $key to local-app/deployment/.env"
	{
		printf '\n'
		if [ -n "$comment" ]; then printf '%s\n' "$comment"; fi
		printf '%s=%s\n' "$key" "$value"
	} >>"$DEPLOY_DIR/.env"
}

# Like env_append, but overwrites a differing value. Only for values without
# secret character that the script dictates - do not use it for secrets (see
# the comment above).
env_set() {
	local key="$1" value="$2" comment="${3:-}"
	if ! grep -qE "^[[:space:]]*$key=" "$DEPLOY_DIR/.env"; then
		env_append "$key" "$value" "$comment"
		return
	fi
	if [ "$(sed -nE "s|^[[:space:]]*$key=||p" "$DEPLOY_DIR/.env" | head -1)" != "$value" ]; then
		log "Setting $key in local-app/deployment/.env to $value"
		sed -i -E "s|^[[:space:]]*$key=.*|$key=$value|" "$DEPLOY_DIR/.env"
	fi
}

env_set PUBLIC_DOCUMENTATION_URL "$DOCUMENTATION_URL" \
	"# Help link in the header and the navigation bar. Empty = link hidden."
env_append APP_USER_USERNAME "$APP_USER_NAME" \
	"# Account without administration rights, for screenshots from the perspective of ordinary users."
env_append APP_USER_EMAIL "$APP_USER_NAME@example.com"
env_append APP_USER_PASSWORD "$(random_alnum 16)"
env_append APP_USER_GROUP "$APP_USER_GROUP_NAME"

# shellcheck disable=SC1091
source "$DEPLOY_DIR/.env"

# --- Create/reuse the persistent local dev CA -------------------------------
#
# Without this, Caddy creates a NEW CA of its own ("Caddy Local Authority") for
# every fresh caddy_data volume - the trust store import in the browser is
# worthless afterwards and has to be repeated. Instead: generate our own root
# CA on the host once, mount it read-only into the Caddy container (see the pki
# block in Caddyfile.production.local) and import only that one.

if [ -f "$CA_CRT" ] && [ -f "$CA_KEY" ]; then
	log "Using the existing local dev CA from $CA_DIR"
else
	log "Creating a local dev CA in $CA_DIR (one-off, survives rebuilds)"
	mkdir -p "$CA_DIR"
	chmod 700 "$CA_DIR"
	openssl ecparam -name prime256v1 -genkey -noout -out "$CA_KEY"
	chmod 600 "$CA_KEY"
	openssl req -x509 -new -key "$CA_KEY" -sha256 -days 3650 \
		-subj "/CN=$CA_NAME/O=Qonnectra local development" \
		-addext "basicConstraints=critical,CA:TRUE,pathlen:1" \
		-addext "keyUsage=critical,keyCertSign,cRLSign" \
		-addext "subjectKeyIdentifier=hash" \
		-out "$CA_CRT"
	chmod 644 "$CA_CRT"
fi

CA_FINGERPRINT="$(openssl x509 -in "$CA_CRT" -noout -fingerprint -sha256 | cut -d= -f2)"

# --- Create Caddyfile.production.local --------------------------------------
#
# Caddyfile.production expects real, publicly resolvable domains for automatic
# Let's Encrypt HTTPS. For *.qonnectra.localhost there is no public validation,
# so "tls internal" is added per domain block here and the internal CA is
# globally redirected to the dev CA from above. Regenerated from the current
# Caddyfile.production on every run.

log "Creating Caddyfile.production.local (own dev CA + tls internal per domain)"
{
	cat <<EOF
# Generated automatically by scripts/setup-local-qonnectra.sh - do not edit.
#
# The global pki block redirects the internal CA "local" used by "tls internal"
# (below, per domain) to the persistent dev CA from the host, which is mounted
# read-only at /etc/caddy/ca:
#   $CA_CRT
# Without this Caddy would recreate the CA for every fresh caddy_data volume and
# the trust store import would have to be repeated every time.
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

# --- Generate map tiles ------------------------------------------------------
#
# tileserver-gl needs an .mbtiles file; the app ships none (see
# local-app/deployment/README.md, "Generating Map Tiles with Planetiler").
# Without it the container exits on startup ("Not valid input file") and is
# restarted endlessly by "restart: always".
#
# The run only happens once per machine: the result and the downloaded raw OSM
# data live in $TILES_DIR outside local-app/.

if [ "$SKIP_TILES" -eq 1 ]; then
	warn "--skip-tiles: skipping map tiles. The tileserver will run in a restart loop and the map will use OSM raster tiles."
elif [ -f "$TILE_MBTILES" ]; then
	log "Map tiles present: $TILE_MBTILES ($(du -h "$TILE_MBTILES" | cut -f1))"
elif ! command -v java >/dev/null 2>&1; then
	warn "java is missing - map tiles cannot be generated (Planetiler needs Java 21+). Because of that the tileserver runs in a restart loop and the map uses OSM raster tiles. Install Java and run the script again, or deliberately do without them using --skip-tiles."
else
	mkdir -p "$TILES_DIR"

	if [ ! -f "$PLANETILER_JAR" ]; then
		log "Downloading Planetiler to $PLANETILER_JAR"
		curl -fSL --retry 3 -o "$PLANETILER_JAR.tmp" "$PLANETILER_URL" ||
			die "Planetiler could not be downloaded: $PLANETILER_URL"
		mv "$PLANETILER_JAR.tmp" "$PLANETILER_JAR"
	fi

	log "Generating map tiles for \"$TILE_AREA\" (one-off, takes a few minutes)"
	# Write under an intermediate name first and rename afterwards: an aborted
	# run would otherwise leave half an .mbtiles behind that counts as finished
	# on the next run. The extension has to stay .mbtiles - Planetiler derives
	# the archive format from it and would otherwise abort with
	# "Unsupported format".
	# Working directory $TILES_DIR, so that Planetiler puts its downloads
	# (data/sources) and temporary files there as well and can reuse them next
	# time.
	TILE_TMP="$TILES_DIR/.$TILE_AREA.partial.mbtiles"
	if (cd "$TILES_DIR" && java -Xmx4g -jar "$PLANETILER_JAR" \
		--download --area="$TILE_AREA" --force \
		--output="$TILE_TMP"); then
		mv "$TILE_TMP" "$TILE_MBTILES"
		log "Map tiles finished: $TILE_MBTILES ($(du -h "$TILE_MBTILES" | cut -f1))"
	else
		rm -f "$TILE_TMP"
		warn "Planetiler run for \"$TILE_AREA\" failed. Because of that the tileserver runs in a restart loop and the map uses OSM raster tiles."
	fi
fi

# The tiles have to sit next to config.json as $DEPLOY_DIR/tiles/germany.mbtiles:
# docker-compose.yml mounts ./tiles read-only at /data, and config.json refers
# to /data/germany.mbtiles by a fixed path. An additional bind mount for the
# file alone does not work - Docker cannot create the mount point inside the
# read-only mounted /data ("create target of file bind-mount ... read-only file
# system").
#
# Hence a hard link (not a copy: that saves the 130+ MB twice over, and the
# cache in $TILES_DIR stays the only real copy). If $TILES_DIR sits on a
# different file system than local-app/, it is copied. The name is always
# germany.mbtiles, regardless of the region that was generated.
if [ -f "$TILE_MBTILES" ]; then
	TILE_LINK="$DEPLOY_DIR/tiles/germany.mbtiles"
	# Link again when the file is missing or holds a different state than the
	# cache. The size comparison covers both: a hard link always has the same
	# size (no unnecessary recreation), a freshly generated extract or a change
	# of QONNECTRA_TILE_AREA practically never.
	if [ ! -e "$TILE_LINK" ] ||
		[ "$(stat -c %s "$TILE_MBTILES")" != "$(stat -c %s "$TILE_LINK")" ]; then
		rm -f "$TILE_LINK"
		ln "$TILE_MBTILES" "$TILE_LINK" 2>/dev/null ||
			cp "$TILE_MBTILES" "$TILE_LINK" ||
			warn "Map tiles could not be linked to $TILE_LINK."
	fi
fi

# --- Create docker-compose.override.yml -------------------------------------
#
# The only adjustment needed locally on the production compose: point Caddy at
# the Caddyfile generated above with "tls internal". The nginx and qgis-server
# commands in docker-compose.yml are already correct (unlike in
# docker-compose.dev.yml).

log "Creating docker-compose.override.yml"
cat >"$DEPLOY_DIR/docker-compose.override.yml" <<EOF
# Generated automatically by scripts/setup-local-qonnectra.sh - local
# adjustment to docker-compose.yml (production) for *.qonnectra.localhost
# instead of real domains with Let's Encrypt certificates.
services:
  # docker-compose.yml lists the environment of the backend one by one and
  # reads no env_file - the APP_USER_* values therefore have to be added here.
  # They live inside the container so that the script can create the account
  # via "manage.py shell" without writing the password onto the command line of
  # the host (and with it into the process list). The placeholders deliberately
  # stay unresolved: Compose fills them in from .env on startup, so this file
  # contains no password.
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
      # Persistent local dev CA from the host (see the pki block in the Caddyfile)
      - $CA_DIR:/etc/caddy/ca:ro
      - caddy_data:/data
      - caddy_config:/config
      - ./logs:/var/log/caddy
      - media_volume:/media:ro
EOF

COMPOSE=(docker compose -f "$DEPLOY_DIR/docker-compose.yml" -f "$DEPLOY_DIR/docker-compose.override.yml")

# --- DNS check (informational, RFC 6761 should always satisfy this) ---------

if command -v getent >/dev/null 2>&1 && ! getent hosts app.qonnectra.localhost >/dev/null 2>&1; then
	warn "app.qonnectra.localhost does not resolve on this machine. Normally all *.localhost names resolve to 127.0.0.1 automatically (RFC 6761); if they do not, add an entry to /etc/hosts manually."
fi

# --- Build and start the stack ----------------------------------------------

log "Building images and starting the stack (this can take several minutes on the first run)"
if ! "${COMPOSE[@]}" up -d --build "${SERVICES[@]}"; then
	# Known bug in postgres/init.sh: with a completely empty DB volume two
	# REVOKE statements on tables that do not exist yet fail
	# (model_permission/route_permission only exist after the Django
	# migrations). The Postgres cluster files have already been created at that
	# point though, and a second attempt runs through cleanly without another
	# initdb.
	warn "First start failed (probably the known postgres/init.sh bug with an empty DB volume), trying again..."
	"${COMPOSE[@]}" up -d "${SERVICES[@]}"
fi

# nginx may have to be restarted if the backend container was recreated on the
# first attempt (nginx only resolves the upstream name on its own startup and
# caches its container IP).
"${COMPOSE[@]}" restart nginx >/dev/null

# --- Discard the old Caddy PKI in the volume --------------------------------
#
# The caddy_data volume may still hold intermediate and leaf certificates of an
# earlier (self-generated) Caddy CA. Those do not chain to our dev CA and would
# keep being served. Hence: store the fingerprint of the active CA in the volume
# and, if it differs, discard the local PKI once - Caddy then recreates
# intermediate and leaf certificates under our root.

CA_MARKER=/data/caddy/.qonnectra-local-ca-fingerprint
STORED_FINGERPRINT="$("${COMPOSE[@]}" exec -T caddy cat "$CA_MARKER" 2>/dev/null || true)"
if [ "$STORED_FINGERPRINT" != "$CA_FINGERPRINT" ]; then
	log "Resetting the Caddy PKI in the volume to the local dev CA"
	"${COMPOSE[@]}" exec -T caddy sh -c \
		"rm -rf /data/caddy/pki/authorities/local /data/caddy/certificates/local && printf '%s' '$CA_FINGERPRINT' >$CA_MARKER"
	"${COMPOSE[@]}" restart caddy >/dev/null
fi

log "Waiting until the app answers through Caddy (migrations, nginx restart, TLS certificates)..."
READY=0
for _ in $(seq 1 60); do
	# Deliberately with --cacert instead of -k: this also checks that the
	# certificate chain being served really hangs below our dev CA.
	code="$(curl -s --cacert "$CA_CRT" -o /dev/null -w '%{http_code}' "https://${APP_DOMAIN}/login" 2>/dev/null || true)"
	if [ "$code" = "200" ]; then
		READY=1
		break
	fi
	sleep 2
done
if [ "$READY" -eq 1 ]; then
	log "The app answers."

	# The check above only covers the frontend. At that point the backend is
	# still working on migrations and load_initial_data with an empty database -
	# an import before that would fail on missing tables resp. would create
	# reference data without the values from the fixtures, and the groups for
	# the app user account are only created by migration
	# 0058_seed_permission_data. So wait for both here: tables present
	# (Projects) and fixtures loaded (AttributesCableType).
	log "Waiting for migrations and initial data in the backend..."
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
		warn "The backend did not finish migrations/initial data within 3 minutes - skipping the import of the test project and the creation of the app user account."
	else
		if [ -f "$EXPORT_FILE" ]; then
			log "Importing the test project export for manual screenshots (idempotent: an already imported project is left untouched)"
			"${COMPOSE[@]}" cp "$EXPORT_FILE" "backend:$EXPORT_FILE_IN_CONTAINER"
			if "${COMPOSE[@]}" exec -T backend python manage.py import_geodock_export \
				--file "$EXPORT_FILE_IN_CONTAINER"; then
				IMPORT_OK=1
			else
				warn "Import of the test project export failed (output above)."
			fi
		fi

		# --- Create the account without administration rights ---------------
		#
		# The script sends the Python code to "manage.py shell" through standard
		# input (without a terminal the command executes whatever arrives
		# there). The code reads the credentials from the environment of the
		# container, which docker-compose.override.yml has set - that way they
		# appear neither in the process list of the host nor in the output of
		# the script.
		#
		# Idempotent: password, permission flags and group assignment are set
		# anew on every run. A password changed by hand in .env therefore takes
		# effect on the next run.
		log "Creating account \"$APP_USER_USERNAME\" (group \"$APP_USER_GROUP\", no administration rights)"
		if "${COMPOSE[@]}" exec -T backend python manage.py shell <<'PYTHON'; then
import os

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.cache import cache

username = os.environ["APP_USER_USERNAME"]
group_name = os.environ["APP_USER_GROUP"]

group = Group.objects.filter(name=group_name).first()
if group is None:
    existing = ", ".join(Group.objects.values_list("name", flat=True)) or "none"
    raise SystemExit(
        f"Group {group_name!r} does not exist. Existing groups: {existing}"
    )

User = get_user_model()
user, created = User.objects.get_or_create(username=username)
user.email = os.environ.get("APP_USER_EMAIL", "")
# Explicitly both off: is_staff opens the Django administration, is_superuser
# bypasses every permission check in the app (get_user_permissions then returns
# placeholder full access).
user.is_staff = False
user.is_superuser = False
user.is_active = True
user.set_password(os.environ["APP_USER_PASSWORD"])
user.save()
user.groups.set([group])

# The permission check of the API keeps the access levels in a cache for five
# minutes; after a group change the old assignment would otherwise still apply.
cache.delete(f"user_permissions:{user.pk}")

print(f"Account {username!r} {'created' if created else 'updated'}, group {group_name!r}.")
PYTHON
			APP_USER_OK=1
		else
			warn "The account \"$APP_USER_USERNAME\" could not be created (output above). Playwright runs will then fail at login; as a stopgap work with QONNECTRA_LOGIN=admin."
		fi
	fi
else
	if [ "$(curl -sk -o /dev/null -w '%{http_code}' "https://${APP_DOMAIN}/login" 2>/dev/null || true)" = "200" ]; then
		warn "The app answers, but its certificate does not chain to the local dev CA ($CA_CRT) - check the Caddy logs: docker compose -f docker-compose.yml -f docker-compose.override.yml logs caddy"
	else
		warn "The app still does not answer after 2 minutes - check the container logs: docker compose -f docker-compose.yml -f docker-compose.override.yml logs backend"
	fi
fi

# --- Trust store status of the local CA -------------------------------------
#
# The CA itself is no longer exported from the container (it comes from the
# host), the only remaining question is whether it has been imported already.

if openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt "$CA_CRT" >/dev/null 2>&1; then
	CA_TRUSTED=1
else
	CA_TRUSTED=0
fi

# Remove the outdated export of earlier script versions, so that nobody
# accidentally imports the old, no longer used Caddy CA.
rm -f "$DEPLOY_DIR/qonnectra-local-dev-ca.crt"

# --- Summary -----------------------------------------------------------------

if [ "$CA_TRUSTED" -eq 1 ]; then
	CA_SECTION="Local dev CA: $CA_CRT
Already in the system trust store. The CA lives outside local-app/ and outside
the Docker volume and therefore survives rebuilds including
\"docker compose down -v\" - another import is only necessary if $CA_DIR is
deleted.

Firefox and snap/flatpak browsers (e.g. snap Chromium) have trust stores of
their own and are therefore NOT covered automatically. If a certificate warning
still shows up there, run the import once more - the script is idempotent and
no longer needs sudo once the system trust store is in place:
  $REPO_ROOT/scripts/install-local-ca.sh"
else
	CA_SECTION="Local dev CA: $CA_CRT
Not imported yet, so the browser keeps warning. Import it once (this then
applies to all future rebuilds, the CA is not recreated any more):
  $REPO_ROOT/scripts/install-local-ca.sh"
fi

if [ "$IMPORT_OK" -eq 1 ]; then
	PROJECT_SECTION="For screenshots/videos the project \"Testprojekt\", exported from the demo
environment, is available (select it in the top left after logging in). After
an updated export, import it again (--force throws the local project away
first):
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml cp $EXPORT_FILE backend:$EXPORT_FILE_IN_CONTAINER
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml exec backend python manage.py import_geodock_export --file $EXPORT_FILE_IN_CONTAINER --force"
elif [ -f "$EXPORT_FILE" ]; then
	PROJECT_SECTION="The test project export was NOT imported (see the warnings above), so the
instance contains no project data. Catch the import up as soon as the app is
fully running:
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml cp $EXPORT_FILE backend:$EXPORT_FILE_IN_CONTAINER
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml exec backend python manage.py import_geodock_export --file $EXPORT_FILE_IN_CONTAINER"
else
	PROJECT_SECTION="The instance contains NO project data yet: there is no export of the
\"Testprojekt\" at
  $EXPORT_FILE
Normally it ships with this repo
(scripts/qonnectra-demo-data/testprojekt-export.json, see the README.md there) -
restore the file and run the script again (or import it directly):
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml cp <export.json> backend:$EXPORT_FILE_IN_CONTAINER
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml exec backend python manage.py import_geodock_export --file $EXPORT_FILE_IN_CONTAINER"
fi

if [ "$APP_USER_OK" -eq 1 ]; then
	LOGIN_SECTION="Two accounts are ready:

  Application (default for screenshots, no administration rights):
    ${APP_USER_USERNAME} / ${APP_USER_PASSWORD}   (group \"${APP_USER_GROUP}\")
  Administration (Django superuser, sees and may do everything):
    ${DJANGO_SUPERUSER_USERNAME} / ${DJANGO_SUPERUSER_PASSWORD}

Playwright logs in with the application account by default, so that the images
show the view of ordinary users. For a run as the superuser:
  QONNECTRA_LOGIN=admin pnpm test:e2e"
else
	LOGIN_SECTION="Login (Django superuser): ${DJANGO_SUPERUSER_USERNAME} / ${DJANGO_SUPERUSER_PASSWORD}

The account without administration rights was NOT created (see the warnings
above). Playwright runs will therefore fail at login unless they are started
with QONNECTRA_LOGIN=admin. Once that is fixed, another run of this script is
enough."
fi

if [ -f "$TILE_MBTILES" ]; then
	TILES_SECTION="Map tiles: $TILE_MBTILES
With them the map shows the real vector base map (light/dark mode), not the OSM
fallback. The tiles live outside local-app/ and survive --reset and
--reset-checkout. For a different region, delete them and generate again:
  QONNECTRA_TILE_AREA=<region> $REPO_ROOT/scripts/setup-local-qonnectra.sh"
else
	TILES_SECTION="Map tiles: NONE at $TILE_MBTILES
The tileserver therefore runs in a restart loop; the frontend falls back to OSM
raster tiles automatically. To generate them (needs Java 21+):
  $REPO_ROOT/scripts/setup-local-qonnectra.sh"
fi

log "Done."
cat <<EOF

Qonnectra is running at:
  Frontend : https://app.qonnectra.localhost
  Admin    : https://admin.qonnectra.localhost/admin
  API      : https://api.qonnectra.localhost

$LOGIN_SECTION

Help link of the app (PUBLIC_DOCUMENTATION_URL): $DOCUMENTATION_URL

$PROJECT_SECTION

Certificates: for *.localhost there is no real Let's Encrypt (RFC 6761), so
Caddy signs the certificates locally - here with the dev CA from the host
instead of a Caddy CA recreated for every fresh volume.

$CA_SECTION

$TILES_SECTION

Stopping the stack:
  cd $DEPLOY_DIR && docker compose -f docker-compose.yml -f docker-compose.override.yml down

Run the script again to rebuild/restart the stack (secrets/DB are kept as long
as local-app/deployment/.env is not deleted). For a rebuild with an empty
database and fresh secrets:
  $REPO_ROOT/scripts/setup-local-qonnectra.sh --reset
Additionally re-clone the app checkout (discards changes in local-app/):
  $REPO_ROOT/scripts/setup-local-qonnectra.sh --reset --reset-checkout
EOF
