#!/usr/bin/env bash
# Checks the videos a run has just produced in tests/videos/.
#
# What this deliberately does NOT do: compare them with the published videos in
# public/videos/. A recording is a screencast of a real interaction and its
# length follows render and network latency - two runs of the same spec differ
# by a handful of frames, always. Comparing them would fail every time and say
# nothing (see the project "videos" in playwright.config.ts).
#
# What is worth checking is everything around that:
#
#   - every video the manual embeds was actually produced by this run
#   - the file is a WebM with the VP8 stream the manual expects
#   - width, length and size are in the range the manual is built for
#   - the picture is not empty
#
# The last one is the interesting case. The specs assert their way through the
# interaction, so a broken flow fails the spec itself - but the crop happens
# afterwards (postProcessVideo() in playwright/manual-videos.ts) and knows
# nothing about the layout. A moved panel leaves the spec green and the crop
# pointing at an empty corner of the page.
#
#   scripts/check-videos.sh
#
# Run it after `pnpm test:e2e:videos`.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Target values from CLAUDE.md, with the room the existing videos actually use
# (measured: 1000-1190 px wide, 6.8-50.7 s, 169-895 KB, frame deviation 20-38).
MIN_WIDTH=900
MAX_WIDTH=1400
MIN_SECONDS=3
MAX_SECONDS=120
MIN_KB=20
# A blank frame sits near 0. The lowest of the real videos is 20.
MIN_DEVIATION=5

problems=0

problem() {
	echo "  ✗ $1" >&2
	problems=$((problems + 1))
}

# The ffmpeg Playwright ships anyway - same lookup as ffmpegPath() in
# playwright/manual-videos.ts, so no extra tool has to be on the machine.
find_ffmpeg() {
	local base="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}" candidate
	candidate="$(find "$base" -maxdepth 2 -name 'ffmpeg-linux' -type f 2>/dev/null | sort -V | tail -n 1)"
	if [[ -n "$candidate" ]]; then
		echo "$candidate"
		return 0
	fi
	command -v ffmpeg 2>/dev/null && return 0
	return 1
}

FFMPEG="$(find_ffmpeg || true)"
if [[ -z "$FFMPEG" ]]; then
	echo "ffmpeg is missing. Install it with: pnpm exec playwright install ffmpeg" >&2
	exit 1
fi

if ! command -v identify >/dev/null 2>&1; then
	echo "ImageMagick (identify) is missing. Install it with: sudo apt install imagemagick" >&2
	exit 1
fi

if [[ ! -d tests/videos ]]; then
	echo "tests/videos/ does not exist - record the videos first:" >&2
	echo "  pnpm test:e2e:videos" >&2
	exit 1
fi

frame_dir="$(mktemp -d)"
trap 'rm -rf "$frame_dir"' EXIT

# The manual is the list of what has to exist; a spec producing something no
# chapter embeds is the publish script's business, not this one's.
referenced="$(grep -rhoE '/videos/[a-z0-9_]+\.webm' manual/ | sort -u || true)"
if [[ -z "$referenced" ]]; then
	echo "No video is embedded in manual/ - nothing to check."
	exit 0
fi

checked=0
while read -r reference; do
	[[ -z "$reference" ]] && continue
	name="$(basename "$reference" .webm)"

	capture="$(find tests/videos -name "${name}.webm" -type f | head -n 1)"
	if [[ -z "$capture" ]]; then
		problem "${name}: embedded in the manual, but this run produced no recording.
      Has its spec been renamed, or is its chapter missing from tests/*-video.spec.ts?"
		continue
	fi

	checked=$((checked + 1))
	info="$("$FFMPEG" -i "$capture" 2>&1 || true)"

	codec="$(grep -oP 'Video: \K[a-z0-9]+' <<<"$info" | head -n 1)"
	[[ "$codec" == "vp8" ]] ||
		problem "${name}: stream is '${codec:-none}', the manual expects vp8."

	dimensions="$(grep -oP 'Video:.*?\K[0-9]{3,4}x[0-9]{3,4}' <<<"$info" | head -n 1)"
	width="${dimensions%x*}"
	if [[ -z "$width" ]]; then
		problem "${name}: no video stream found - is the file broken?"
		continue
	fi
	((width >= MIN_WIDTH && width <= MAX_WIDTH)) ||
		problem "${name}: ${dimensions} - a crop of ${MIN_WIDTH} to ${MAX_WIDTH} px wide is expected.
      Wider shrinks everything in the manual, which renders videos at the width of the text column."

	clock="$(grep -oP 'Duration: \K[0-9:.]+' <<<"$info" | head -n 1)"
	seconds="$(awk -F: '{printf "%.0f", $1*3600 + $2*60 + $3}' <<<"${clock:-00:00:00}")"
	((seconds >= MIN_SECONDS && seconds <= MAX_SECONDS)) ||
		problem "${name}: ${clock} long - expected between ${MIN_SECONDS} and ${MAX_SECONDS} s.
      Too short usually means postProcessVideo() cut away more than the page load."

	kb=$(($(stat -c%s "$capture") / 1024))
	((kb >= MIN_KB)) ||
		problem "${name}: only ${kb} KB - that is not a recording of an interaction."

	# A frame from the middle, where the demonstration is running.
	middle="$(awk -v s="$seconds" 'BEGIN{printf "%.0f", s*0.6}')"
	frame="$frame_dir/$name.png"
	"$FFMPEG" -y -i "$capture" -ss "$middle" -frames:v 1 "$frame" >/dev/null 2>&1 || true
	if [[ ! -s "$frame" ]]; then
		problem "${name}: no frame could be read at ${middle} s."
		continue
	fi

	deviation="$(identify -format '%[fx:int(standard_deviation*255)]' "$frame")"
	((deviation >= MIN_DEVIATION)) ||
		problem "${name}: the frame at ${middle} s is as good as empty (deviation ${deviation}).
      The recording ran, but the crop of postProcessVideo() is probably pointing past the interface."
done <<<"$referenced"

echo
if ((problems > 0)); then
	echo "${problems} problem(s) in ${checked} recording(s)." >&2
	exit 1
fi

echo "${checked} recording(s) checked, all in order."
