#!/usr/bin/env bash
# Prints a fingerprint per spec: a hash over everything that decides what the
# spec's captures look like.
#
#   scripts/capture-fingerprint.sh            # "<hash>  tests/<spec>" for every spec
#   scripts/capture-fingerprint.sh --stale    # the specs whose hash differs from tests/captures.lock
#   scripts/capture-fingerprint.sh --touched <ref>
#                                             # the specs a change since <ref> can have affected
#
# tests/captures.lock holds the hash each spec was last published under (written
# by scripts/publish-screenshots.sh). A spec whose hash still matches has nothing
# new to show, and `pnpm test:e2e` skips it - see scripts/capture.sh. CI fails
# on a stale spec outright: only a local run and publish can bring the lock
# forward, and the developer owes the manual that run.
#
# --touched is how CI picks the specs of a pull request once the lock is
# current: a changed spec, a changed published image or video (through the
# name the spec passes to shoot() or videoPath()), a changed line of the lock -
# the developer's claim to have republished that spec - and any change to a
# shared input, which affects every spec. It verifies what the pull request
# claims, while --stale verifies that it claims anything at all.
#
# A capture depends on far more than its spec file, and all of it goes into
# every hash:
#
#   - the spec itself
#   - playwright/ (helpers, the auth setup, the capture image and its fonts)
#   - playwright.config.ts and scripts/capture.sh (how the browser is started)
#   - scripts/setup-local-qonnectra.sh (the pinned app QONNECTRA_REF, the
#     pinned map tiles, the patches to the stack, the capture account)
#   - scripts/qonnectra-demo-data/ (the demo project and its importer)
#   - scripts/publish-screenshots.sh (the JPEG quality and the size limit the
#     published files are written with)
#   - the installed Playwright version (it pins Chromium)
#
# Deliberately coarse: a change to a shared helper marks every spec as stale,
# and so does a comment in the setup script. Tracing which spec uses which
# helper is not worth it - a stale spec whose images come out unchanged costs a
# run, a spec wrongly taken as current costs a stale manual.
set -euo pipefail

# The order the files are hashed in is part of the hash, and `sort` and the
# glob below order by the locale: en_US.UTF-8 puts "noto-sans/400.css" and
# "noto-sans-cyrillic" the other way round from the C.UTF-8 of the GitHub
# runner. With it unpinned every fingerprint differed between a laptop and CI,
# and every pull request ran all specs against a lock that was current.
export LC_ALL=C

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

LOCK=tests/captures.lock

mode=all
ref=""
case "${1:-}" in
'') ;;
--stale) mode=stale ;;
--touched)
	mode=touched
	ref="${2:-}"
	if [[ -z "$ref" ]]; then
		echo "--touched needs a git ref to compare with." >&2
		exit 1
	fi
	;;
-h | --help)
	sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d' | sed 's/^# \?//'
	exit 0
	;;
*)
	echo "Unknown option: $1" >&2
	exit 1
	;;
esac

# What every spec depends on besides itself. Directories end in a slash.
SHARED_PATHS=(
	playwright/
	playwright.config.ts
	scripts/capture.sh
	scripts/setup-local-qonnectra.sh
	scripts/publish-screenshots.sh
	scripts/qonnectra-demo-data/
)

# Tracked and untracked-but-not-ignored files, so an uncommitted change counts
# while the gitignored .env next to the demo data does not.
shared_files() {
	git ls-files -co --exclude-standard -- "${SHARED_PATHS[@]}" | sort -u
}

is_shared() {
	local path
	for path in "${SHARED_PATHS[@]}"; do
		[[ "$1" == "$path" ]] && return 0
		[[ "$path" == */ && "$1" == "$path"* ]] && return 0
	done
	return 1
}

# --touched: the specs a change between <ref> and the working tree can have
# affected, one per line. The Playwright version comes from the lockfile, so
# package.json and pnpm-lock.yaml count as shared inputs here.
touched() {
	local file name spec all=0
	local -A specs=()

	while IFS= read -r file; do
		[[ -z "$file" ]] && continue
		case "$file" in
		tests/*.spec.ts)
			[[ -f "$file" ]] && specs[$file]=1
			;;
		public/images/manual/*.jpg)
			name="$(basename "$file" .jpg)"
			for spec in $(grep -lF "'${name}'" tests/*.spec.ts 2>/dev/null); do
				[[ "$spec" == *-video.spec.ts ]] || specs[$spec]=1
			done
			;;
		public/videos/*.webm)
			name="$(basename "$file" .webm)"
			for spec in $(grep -lF "'${name}'" tests/*-video.spec.ts 2>/dev/null); do
				specs[$spec]=1
			done
			;;
		package.json | pnpm-lock.yaml) all=1 ;;
		*) is_shared "$file" && all=1 ;;
		esac
	done < <(git diff --name-only "$ref" -- .)

	# A changed line of the lock is the developer's claim to have republished
	# that spec - the run verifies it. Without a lock at <ref>, every line is a
	# claim.
	while read -r _ spec; do
		[[ -n "$spec" && -f "$spec" ]] && specs[$spec]=1
	done < <(comm -3 <(git show "$ref:$LOCK" 2>/dev/null | sort) <(sort "$LOCK"))

	if ((all)); then
		ls tests/*.spec.ts
	elif ((${#specs[@]} > 0)); then
		printf '%s\n' "${!specs[@]}" | sort
	fi
}

# The version actually installed, not the range in package.json - "^1.62.1"
# stays the same when the lockfile moves Chromium on.
playwright_version() {
	node -p "require('@playwright/test/package.json').version" 2>/dev/null ||
		node -p "require('./package.json').devDependencies['@playwright/test']"
}

shared="$(
	{
		echo "playwright $(playwright_version)"
		shared_files | while read -r file; do
			[[ -f "$file" ]] && sha256sum "$file"
		done
	} | sha256sum | cut -c1-16
)"

fingerprints() {
	local spec
	for spec in tests/*.spec.ts; do
		printf '%s  %s\n' "$({ echo "$shared"; cat "$spec"; } | sha256sum | cut -c1-16)" "$spec"
	done
}

if [[ "$mode" == all ]]; then
	fingerprints
	exit 0
fi

if [[ "$mode" == touched ]]; then
	touched
	exit 0
fi

# --stale: every spec whose line is not in the lock as it is.
if [[ -f "$LOCK" ]]; then
	fingerprints | grep -vxFf "$LOCK" | sed 's/^[^ ]*  //' || true
else
	fingerprints | sed 's/^[^ ]*  //'
fi
