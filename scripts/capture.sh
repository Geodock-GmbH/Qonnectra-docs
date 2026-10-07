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
#   scripts/capture.sh                          # every spec
#   scripts/capture.sh --stale                  # only the specs tests/captures.lock calls stale
#   scripts/capture.sh --stale --all            # every spec after all (what `pnpm test:e2e --all` does)
#   scripts/capture.sh tests/05-karte.spec.ts   # one chapter, stale or not
#
# --stale and --all are this script's own; everything else is passed to
# `playwright test`. Naming spec files always runs them - --stale only decides
# when nothing is named. Pass Playwright options as --option=value: a value
# given as a word of its own counts as a name.
#
# After the run every spec whose tests all passed is stamped in
# tests/.capture-stamps with the fingerprint it ran under
# (scripts/capture-fingerprint.sh). scripts/publish-screenshots.sh moves the
# stamps into tests/captures.lock when it publishes; a spec that failed loses
# its stamp. A run filtered below the spec level (--grep, file:line, ...) stamps
# nothing - it has not shown that the whole spec still works.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

STAMPS=tests/.capture-stamps
REPORT=test-results/report.json

stale=0
all=0
named=0
partial=0
args=()
for arg in "$@"; do
	case "$arg" in
	--stale) stale=1 ;;
	--all) all=1 ;;
	-g | --grep* | --grep-invert* | --last-failed | --only-changed* | --shard*)
		partial=1
		args+=("$arg")
		;;
	-*) args+=("$arg") ;;
	*)
		named=1
		[[ "$arg" =~ :[0-9]+$ ]] && partial=1
		args+=("$arg")
		;;
	esac
done

# Taken before the run: a stamp says which inputs the spec passed with, and an
# edit made while the run is going must not be credited to it.
fingerprints="$(scripts/capture-fingerprint.sh)"

if ((stale && !all && !named)); then
	mapfile -t specs < <(scripts/capture-fingerprint.sh --stale)
	if ((${#specs[@]} == 0)); then
		echo "Every spec matches tests/captures.lock - nothing to capture."
		echo "Run them anyway with: pnpm test:e2e --all"
		exit 0
	fi
	echo "Stale against tests/captures.lock (${#specs[@]}):"
	printf '  %s\n' "${specs[@]}"
	args+=("${specs[@]}")
fi

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

# A report left over from an earlier run would stamp specs this run never got
# to - Playwright only rewrites it at the end.
rm -f "$REPORT"

# --init, because PID 1 of a container gets no default signal handlers: with
# npx as PID 1 the Ctrl+C that docker forwards was ignored and the run went on.
# tini passes it to Playwright, which stops and runs its teardown (the
# placeholder accounts and seeded data are removed again).
#
# The trap only takes effect once the container has exited: an interrupted run
# says nothing about the specs it did not finish, so nothing is stamped.
interrupted=0
trap 'interrupted=1' INT TERM

status=0
docker run --rm \
	--init \
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
	npx playwright test "${args[@]}" || status=$?

if ((interrupted)); then
	echo "Interrupted - no spec stamped." >&2
	exit 130
fi

if ((partial)); then
	echo "Filtered below the spec level - no spec stamped."
	exit "$status"
fi

# QONNECTRA_LOGIN=admin retakes the part A images as superuser - an interface
# their audience never sees (menu entry "Logs", no permission checks). The
# fingerprint does not include the login, so a stamp from such a run would put
# those images into tests/captures.lock as current.
if [[ "${QONNECTRA_LOGIN:-}" == admin ]]; then
	echo "QONNECTRA_LOGIN=admin - no spec stamped."
	exit "$status"
fi

# Per spec file of the run: did every test of it pass? The setup project is not
# a spec of the manual and is left out.
if [[ -f "$REPORT" ]]; then
	results="$(node -e '
		const report = require(process.argv[1])
		const passed = {}
		const walk = (suite) => {
			for (const spec of suite.specs ?? []) {
				for (const test of spec.tests) {
					if (test.projectName === "setup") continue
					const file = "tests/" + spec.file
					passed[file] = (passed[file] ?? true) && test.status === "expected"
				}
			}
			for (const child of suite.suites ?? []) walk(child)
		}
		report.suites.forEach(walk)
		for (const [file, ok] of Object.entries(passed)) console.log((ok ? "passed " : "failed ") + file)
	' "$REPO_ROOT/$REPORT")"

	# Drop the old line of every spec in the run, add the fresh one of those that
	# passed. Specs outside the run keep their stamp.
	touch "$STAMPS"
	awk -v results="$results" -v fingerprints="$fingerprints" '
		BEGIN {
			n = split(results, lines, "\n")
			for (i = 1; i <= n; i++) { split(lines[i], f, " "); if (f[2] != "") ran[f[2]] = f[1] }
			n = split(fingerprints, lines, "\n")
			for (i = 1; i <= n; i++) { split(lines[i], f, "  "); hash[f[2]] = f[1] }
		}
		!($2 in ran) { print }
		END { for (spec in ran) if (ran[spec] == "passed") print hash[spec] "  " spec }
	' "$STAMPS" | LC_ALL=C sort -k2 >"$STAMPS.tmp"
	mv "$STAMPS.tmp" "$STAMPS"
fi

exit "$status"
