#!/usr/bin/env bash
# Static checks on the specs in tests/ - cheap, and run before anything
# expensive. What a recording looks like once it exists is checked by the spec
# that produced it (verifyVideo() in playwright/manual-videos.ts); this is what
# can be seen without running anything.
#
#   scripts/lint-captures.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

problems=0
problem() {
	echo "  ✗ $1" >&2
	problems=$((problems + 1))
}

# The size every recording is made at: the viewport of playwright.config.ts.
# Without it Playwright scales the video down to fit 800 x 800 and the crop
# turns blurry; larger gains nothing, Chromium's screencast delivers CSS pixels.
VIDEO_USE="test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })"

# --- Every spec -------------------------------------------------------------

# Captures go through shoot() / shootTile(). Both screenshot calls default to
# animations: "allow" and catch Svelte transitions halfway through.
while IFS= read -r hit; do
	problem "${hit} - capture through shoot() or shootTile() in playwright/manual-shots.ts"
done < <(grep -rn --include='*.spec.ts' '\.screenshot(' tests/ || true)

# test from playwright/test.ts carries the fixture that serves the vendored
# base map fonts; the one from @playwright/test does not.
while IFS= read -r hit; do
	problem "${hit} - import test from '../playwright/test'"
done < <(grep -rn --include='*.spec.ts' "from '@playwright/test'" tests/ || true)

# Encoding goes through postProcessVideo(), which is what guarantees VP8/WebM
# and checks the result.
while IFS= read -r hit; do
	problem "${hit} - encode through postProcessVideo() in playwright/manual-videos.ts"
done < <(grep -rn --include='*.spec.ts' -e 'ffmpegPath' -e 'ffmpeg' tests/ || true)

# --- Image specs ------------------------------------------------------------

# Recording is a file-level setting, and the -video suffix is how a spec says
# it records - an image spec with a video would record unnoticed.
for spec in tests/*.spec.ts; do
	[[ "$spec" == *-video.spec.ts ]] && continue
	grep -qE "^\s*test\.use\(\{ video" "$spec" &&
		problem "${spec}: records a video - move the recording to $(basename "$spec" .spec.ts)-video.spec.ts"
done

# --- Video specs ------------------------------------------------------------

for spec in tests/*-video.spec.ts; do
	grep -qF "$VIDEO_USE" "$spec" ||
		problem "${spec}: missing ${VIDEO_USE}"
	grep -q 'postProcessVideo(' "$spec" ||
		problem "${spec}: never calls postProcessVideo() - the recording would stay uncropped and unchecked"
done

# --- The manual -------------------------------------------------------------

# Every video the manual embeds is published and has a spec that produces it.
# The name is looked for as a literal: the specs pass it to videoPath() either
# directly or through a helper.
while read -r reference; do
	[[ -z "$reference" ]] && continue
	name="$(basename "$reference" .webm)"
	[[ -f "public${reference}" ]] ||
		problem "${reference}: embedded in the manual, but public${reference} does not exist"
	grep -qF "'${name}'" tests/*-video.spec.ts ||
		problem "${reference}: embedded in the manual, but no tests/*-video.spec.ts records '${name}'"
done < <(grep -rhoE '/videos/[a-z0-9_]+\.webm' manual/ | sort -u || true)

if ((problems > 0)); then
	echo "${problems} problem(s)." >&2
	exit 1
fi
echo "Specs and embedded videos in order."
