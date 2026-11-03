#!/usr/bin/env bash
#
# Stops the local Qonnectra instance that scripts/setup-local-qonnectra.sh
# started, so that the stack does not keep running when no captures are being
# made.
#
# The production compose file of the app sets "restart: always" on every
# service, which also brings the containers back on every start of the Docker
# daemon - i.e. on every boot. The setup script overrides that with
# restart: "no" in docker-compose.override.yml; containers created before that
# still carry the old policy, so this script switches it off on every container
# of the instance first ("docker update --restart=no"), then stops them.
#
# Data is never touched: volumes, database, secrets and the checkout stay. Run
# scripts/setup-local-qonnectra.sh to bring the stack up again, or - after a
# plain stop, without --down - the faster
#   cd local-app/deployment && docker compose -f docker-compose.yml -f docker-compose.override.yml start
#
# Usage:
#   scripts/stop-local-qonnectra.sh [--down]

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$REPO_ROOT/local-app/deployment"

# Every container of the instance has a fixed container_name of this form in
# docker-compose.yml.
CONTAINER_FILTER='name=^qonnectra_.*_prod$'

log() { printf '\n\033[1;32m==>\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33mWARNING:\033[0m %s\n' "$1" >&2; }
die() { printf '\033[1;31mERROR:\033[0m %s\n' "$1" >&2; exit 1; }

usage() {
	cat <<EOF
Usage: $(basename "$0") [--down]

Stops the containers of the local Qonnectra instance and sets their restart
policy to "no", so that they do not come back on the next boot.

  --down      Remove the containers as well ("docker compose down"). Volumes,
              database and secrets are kept; scripts/setup-local-qonnectra.sh
              creates the containers again.
  -h, --help  Show this help.
EOF
}

DOWN=0
for arg in "$@"; do
	case "$arg" in
	--down) DOWN=1 ;;
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

command -v docker >/dev/null 2>&1 || die "docker is not installed."

# Same fallback as in the setup script: right after "usermod -aG docker" the
# running login does not carry the group yet.
if ! docker info >/dev/null 2>&1; then
	if command -v sg >/dev/null 2>&1 && sg docker -c "docker info" >/dev/null 2>&1; then
		warn "No Docker access in this shell, restarting the script through 'sg docker'."
		exec sg docker -c "'$0' $*"
	fi
	die "No access to the Docker daemon. Add the user to the docker group: sudo usermod -aG docker \$USER (then log in again)."
fi

mapfile -t CONTAINERS < <(docker ps -aq --filter "$CONTAINER_FILTER")
if [ "${#CONTAINERS[@]}" -eq 0 ]; then
	log "No containers of the local instance found - nothing to stop."
	exit 0
fi

log "Disabling automatic restart of ${#CONTAINERS[@]} containers"
docker update --restart=no "${CONTAINERS[@]}" >/dev/null

COMPOSE=()
if [ -f "$DEPLOY_DIR/docker-compose.yml" ]; then
	COMPOSE=(docker compose -f "$DEPLOY_DIR/docker-compose.yml")
	if [ -f "$DEPLOY_DIR/docker-compose.override.yml" ]; then
		COMPOSE+=(-f "$DEPLOY_DIR/docker-compose.override.yml")
	fi
fi

if [ "$DOWN" -eq 1 ]; then
	log "Stopping and removing the containers (volumes and database are kept)"
else
	log "Stopping the containers"
fi

# Through compose where possible, from within $DEPLOY_DIR so that the project
# name matches the one used on startup (it is derived from the directory name).
# Without the compose files - local-app/ deleted by hand - the containers are
# stopped directly.
if [ "${#COMPOSE[@]}" -gt 0 ]; then
	if [ "$DOWN" -eq 1 ]; then
		(cd "$DEPLOY_DIR" && "${COMPOSE[@]}" down --remove-orphans)
	else
		(cd "$DEPLOY_DIR" && "${COMPOSE[@]}" stop)
	fi
else
	warn "No compose files in $DEPLOY_DIR - stopping the containers directly."
	docker stop "${CONTAINERS[@]}" >/dev/null
	if [ "$DOWN" -eq 1 ]; then
		docker rm "${CONTAINERS[@]}" >/dev/null
	fi
fi

REMAINING="$(docker ps -q --filter "$CONTAINER_FILTER")"
if [ -n "$REMAINING" ]; then
	warn "Still running: $(docker ps --filter "$CONTAINER_FILTER" --format '{{.Names}}' | tr '\n' ' ')"
	exit 1
fi

log "Local Qonnectra instance stopped. Start it again with: $REPO_ROOT/scripts/setup-local-qonnectra.sh"
