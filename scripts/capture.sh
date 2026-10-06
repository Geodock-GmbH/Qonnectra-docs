#!/usr/bin/env bash
# Runs the Playwright specs in the capture container, so that an image looks the
# same whoever produced it.
#
# The app asks for `system-ui` and brings no font of its own, so every glyph in
# every screenshot comes from the machine running the browser. On a developer
# machine system-ui resolves to Noto Sans, on a GitHub runner to something else,
# and the first CI run reported all 50 images of the manual as changed - text
# everywhere, up to 236 of 255 difference. Fonts are only half of it: freetype
# and harfbuzz decide the hinting, and those differ between distributions too.
#
# Playwright pins Chromium; playwright/capture.Dockerfile pins the rest.
#
#   scripts/capture.sh                          # the image specs
#   scripts/capture.sh --project=videos         # the recordings
#   scripts/capture.sh tests/05-karte.spec.ts   # one chapter
#
# Everything after the script name is passed to `playwright test`.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

IMAGE="qonnectra/capture:$(node -p "require('./package.json').devDependencies['@playwright/test'].replace(/[^0-9.]/g, '')")"

command -v docker >/dev/null 2>&1 || {
	echo "docker is not installed - the captures are produced in a container." >&2
	exit 1
}

# Built on demand and then reused; the layer cache makes a rebuild a few seconds.
if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
	echo "Building the capture image $IMAGE ..."
	docker build \
		--build-arg "PLAYWRIGHT_VERSION=${IMAGE##*:}" \
		-f playwright/capture.Dockerfile \
		-t "$IMAGE" \
		playwright/
fi

# --network host, because the app runs in its own compose stack on the host and
# is reached at https://app.qonnectra.localhost. Any other network mode would
# need the domains mapped into the container by hand.
#
# --ipc=host is what Playwright recommends for Chromium: the default 64 MB of
# /dev/shm are not enough and tabs start crashing.
#
# The repo is mounted at the same path it has on the host, so the paths in the
# output are the ones a developer can click.
# The docker socket, because tests/04-dashboard.spec.ts HUPs the gunicorn
# workers of the backend to drop their five-minute statistics cache. The group
# is added by id: the socket belongs to a group the container does not know by
# name, and the container runs as the calling user.
DOCKER_SOCKET=/var/run/docker.sock
socket_args=()
if [[ -S "$DOCKER_SOCKET" ]]; then
	socket_args=(
		--volume "$DOCKER_SOCKET:$DOCKER_SOCKET"
		--group-add "$(stat -c %g "$DOCKER_SOCKET")"
	)
fi

exec docker run --rm \
	--network host \
	--ipc=host \
	--user "$(id -u):$(id -g)" \
	"${socket_args[@]}" \
	--volume "$REPO_ROOT:$REPO_ROOT" \
	--workdir "$REPO_ROOT" \
	--env HOME=/tmp \
	--env CI \
	--env QONNECTRA_LOGIN \
	"$IMAGE" \
	npx playwright test "$@"
