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
# What goes into a spec's hash:
#
#   - the environment every capture is made in: playwright.config.ts, the
#     capture image and its fonts, scripts/capture.sh, the setup script (app
#     pin, tile pin, patches, capture account), the demo project and its
#     importer, the login and seeded state of playwright/auth.setup.ts with
#     what it imports, and the installed Playwright version (it pins Chromium)
#   - the spec itself and every file it imports, followed through the import
#     statements: a video spec does not depend on the screenshot helper, an
#     image spec not on the video helper
#   - for image specs, the JPEG settings of scripts/publish-screenshots.sh -
#     quality, size limit and the convert call - which decide the published
#     bytes; nothing else in that script reaches an image
#
# Precise on purpose. With the strict lock in CI a stale spec costs a local run
# and a stale video spec a decision about re-recording, so a change must only
# stale the specs it can reach. A comment in the publish script reaches none; a
# change to playwright/test.ts reaches all, because every spec imports it.
#
# --touched is how CI picks the specs of a pull request once the lock is
# current: a changed spec, a changed published image or video (through the
# name the spec passes to shoot() or videoPath()), a changed line of the lock -
# the developer's claim to have republished that spec - and a changed input,
# for every spec that depends on it. It verifies what the pull request claims,
# while --stale verifies that it claims anything at all.
set -euo pipefail

# The order the files are hashed in is part of the hash, and `sort` and the
# globs below order by the locale: en_US.UTF-8 puts "noto-sans/400.css" and
# "noto-sans-cyrillic" the other way round from the C.UTF-8 of the GitHub
# runner. With it unpinned every fingerprint differed between a laptop and CI,
# and every pull request ran all specs against a lock that was current.
export LC_ALL=C

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

LOCK=tests/captures.lock
PUBLISH=scripts/publish-screenshots.sh
AUTH_SETUP=playwright/auth.setup.ts

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

# Inputs of every spec, whatever it captures. Directories end in a slash. The
# auth setup is traced like a spec below and counts as environment too.
ENV_PATHS=(
	playwright.config.ts
	playwright/capture.Dockerfile
	playwright/capture-fonts.conf
	playwright/fonts/
	scripts/capture.sh
	scripts/setup-local-qonnectra.sh
	scripts/qonnectra-demo-data/import_geodock_export.py
	scripts/qonnectra-demo-data/testprojekt-export.json
)

# Tracked and untracked-but-not-ignored files, so an uncommitted change counts
# while a gitignored file does not.
env_files() {
	git ls-files -co --exclude-standard -- "${ENV_PATHS[@]}" | sort -u
}

is_env_path() {
	local path
	for path in "${ENV_PATHS[@]}"; do
		[[ "$1" == "$path" ]] && return 0
		[[ "$path" == */ && "$1" == "$path"* ]] && return 0
	done
	return 1
}

# The lines of the publish script that decide the bytes of a published image.
# $1 is the file, or - for stdin.
publish_settings() {
	grep -E '^QUALITY=|^MAX_BYTES=|^[[:space:]]*convert ' "$1"
}

# The version actually installed, not the range in package.json - "^1.62.1"
# stays the same when the lockfile moves Chromium on.
playwright_version() {
	node -p "require('@playwright/test/package.json').version" 2>/dev/null ||
		node -p "require('./package.json').devDependencies['@playwright/test']"
}

# Follows `import ... from './x'` and `export ... from './x'` - relative paths
# only, bare specifiers are packages - from every root given, and prints one
# line per root: "<root>\t<file> <file> ...", the files sorted and including
# the root. One node process for all roots.
trace_imports() {
	node - "$@" <<'JS'
const fs = require('fs')
const path = require('path')

const resolve = (from, spec) => {
  const base = path.resolve(path.dirname(from), spec)
  for (const candidate of [base, `${base}.ts`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
  }
  return null
}

const trace = (file, seen) => {
  if (seen.has(file)) return seen
  seen.add(file)
  const source = fs.readFileSync(file, 'utf8')
  const imports = /^[ \t]*(?:import|export)\b[^"';]*?\bfrom[ \t]+["'](\.{1,2}\/[^"']+)["']/gm
  for (const match of source.matchAll(imports)) {
    const dependency = resolve(file, match[1])
    if (dependency) trace(dependency, seen)
  }
  return seen
}

for (const root of process.argv.filter((argument) => argument.endsWith('.ts'))) {
  const files = [...trace(path.resolve(root), new Set())]
    .map((file) => path.relative(process.cwd(), file))
    .sort()
  console.log(`${root}\t${files.join(' ')}`)
}
JS
}

# Dependency sets: DEPS[spec] = "file file ...", AUTH_DEPS likewise.
declare -A DEPS=()
AUTH_DEPS=""
while IFS=$'\t' read -r root files; do
	if [[ "$root" == "$AUTH_SETUP" ]]; then
		AUTH_DEPS=$files
	else
		DEPS[$root]=$files
	fi
done < <(trace_imports "$AUTH_SETUP" tests/*.spec.ts)

hash_files() {
	local file
	while read -r file; do
		[[ -f "$file" ]] && sha256sum "$file"
	done
}

env_hash="$(
	{
		echo "playwright $(playwright_version)"
		{
			env_files
			tr ' ' '\n' <<<"$AUTH_DEPS"
		} | sort -u | hash_files
	} | sha256sum | cut -c1-16
)"
publish_hash="$(publish_settings "$PUBLISH" | sha256sum | cut -c1-16)"

spec_fingerprint() {
	local spec=$1
	{
		echo "env $env_hash"
		[[ "$spec" == *-video.spec.ts ]] || echo "publish $publish_hash"
		tr ' ' '\n' <<<"${DEPS[$spec]}" | hash_files
	} | sha256sum | cut -c1-16
}

fingerprints() {
	local spec
	for spec in tests/*.spec.ts; do
		printf '%s  %s\n' "$(spec_fingerprint "$spec")" "$spec"
	done
}

# --touched: the specs a change between <ref> and the working tree can have
# affected, one per line. The Playwright version comes from the lockfile, so
# package.json and pnpm-lock.yaml count as environment here.
touched() {
	local file name spec all=0 images=0
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
		"$PUBLISH")
			# Only the JPEG settings reach an image, and no video.
			cmp -s <(git show "$ref:$PUBLISH" 2>/dev/null | publish_settings - || true) \
				<(publish_settings "$PUBLISH") || images=1
			;;
		*)
			if is_env_path "$file" || [[ " $AUTH_DEPS " == *" $file "* ]]; then
				all=1
			else
				for spec in "${!DEPS[@]}"; do
					[[ " ${DEPS[$spec]} " == *" $file "* ]] && specs[$spec]=1
				done
			fi
			;;
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
		return
	fi
	if ((images)); then
		for spec in tests/*.spec.ts; do
			[[ "$spec" == *-video.spec.ts ]] || specs[$spec]=1
		done
	fi
	if ((${#specs[@]} > 0)); then
		printf '%s\n' "${!specs[@]}" | sort
	fi
}

case "$mode" in
all) fingerprints ;;
touched) touched ;;
stale)
	# Every spec whose line is not in the lock as it is.
	if [[ -f "$LOCK" ]]; then
		fingerprints | grep -vxFf "$LOCK" | sed 's/^[^ ]*  //' || true
	else
		fingerprints | sed 's/^[^ ]*  //'
	fi
	;;
esac
