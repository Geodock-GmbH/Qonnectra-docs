#!/usr/bin/env bash
# Publishes the captures produced by Playwright into the manual:
#   tests/screenshots/<chapter>/<name>.png  -> public/images/manual/<part>/<name>.jpg
#   tests/videos/<chapter>/<name>.webm      -> public/videos/<name>.webm
#
# Images are converted to JPEG on the way (quality as usual in the manual),
# videos are only copied - cropping and encoding are already done by the spec
# (postProcessVideo() in playwright/manual-videos.ts).
#
# The target is not guessed but read from the manual itself: for every capture
# the place that embeds it is looked up in manual/. Whatever is not (yet)
# referenced in the manual is skipped - that way nothing can end up in the
# wrong folder.
#
#   scripts/publish-screenshots.sh              # all chapters, images and videos
#   scripts/publish-screenshots.sh 05-karte     # a single chapter only
#   scripts/publish-screenshots.sh --videos     # publish videos only
#   scripts/publish-screenshots.sh --images     # publish images only
#   scripts/publish-screenshots.sh --dry-run    # only show what would happen
#
# --videos and --images are not a luxury: images with hand-drawn annotations
# (pattern 3) are post-processed by hand after publishing. A run without a
# restriction overwrites that handwork with the raw capture.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

QUALITY=85
MAX_BYTES=$((1200 * 1024)) # target from CLAUDE.md: < 1.2 MB
DRY_RUN=0
WITH_IMAGES=1
WITH_VIDEOS=1
CHAPTER_FILTER=()

for arg in "$@"; do
	case "$arg" in
	--dry-run) DRY_RUN=1 ;;
	--videos) WITH_IMAGES=0 ;;
	--images) WITH_VIDEOS=0 ;;
	-h | --help)
		# Prints the usage block of the header comment above (lines 2-19).
		sed -n '2,19p' "${BASH_SOURCE[0]}" | sed 's/^# \?//'
		exit 0
		;;
	-*)
		echo "Unknown option: $arg" >&2
		exit 1
		;;
	*) CHAPTER_FILTER+=("$arg") ;;
	esac
done

if ((WITH_IMAGES)) && ! command -v convert >/dev/null 2>&1; then
	echo "ImageMagick (convert) is missing. Install it with: sudo apt install imagemagick" >&2
	exit 1
fi

if [[ ! -d tests/screenshots && ! -d tests/videos ]]; then
	echo "tests/screenshots/ and tests/videos/ do not exist - produce the captures first:" >&2
	echo "  pnpm test:e2e" >&2
	exit 1
fi

published=0
skipped=0

for png in $(((WITH_IMAGES)) && find tests/screenshots -name '*.png' 2>/dev/null | sort); do
	chapter="$(basename "$(dirname "$png")")"
	name="$(basename "$png" .png)"

	if ((${#CHAPTER_FILTER[@]} > 0)); then
		match=0
		for filter in "${CHAPTER_FILTER[@]}"; do
			[[ "$chapter" == "$filter" ]] && match=1
		done
		((match)) || continue
	fi

	# Look for the reference in the manual: /images/manual/<part>/<name>.jpg
	target_path="$(grep -rhoE "/images/manual/[^)\"' ]*/${name}\.jpg" manual/ | head -n 1 || true)"
	if [[ -z "$target_path" ]]; then
		echo "  skipped  ${chapter}/${name}.png - not referenced in the manual"
		skipped=$((skipped + 1))
		continue
	fi

	target="public${target_path}"

	if ((DRY_RUN)); then
		state="new"
		[[ -f "$target" ]] && state="replaced"
		echo "  $state  ${chapter}/${name}.png -> ${target}"
		published=$((published + 1))
		continue
	fi

	mkdir -p "$(dirname "$target")"

	# Lower the quality as far as the target file size requires.
	quality=$QUALITY
	while :; do
		convert "$png" -quality "$quality" -strip "$target"
		size=$(stat -c%s "$target")
		if ((size <= MAX_BYTES)) || ((quality <= 60)); then
			break
		fi
		quality=$((quality - 5))
	done

	kb=$((size / 1024))
	note=""
	((quality != QUALITY)) && note=" (quality lowered to ${quality})"
	((size > MAX_BYTES)) && note=" (over 1.2 MB - please check)"
	echo "  ${target}  ${kb} KB${note}"
	published=$((published + 1))
done

# --- Videos ---------------------------------------------------------------
#
# No conversion: the spec already delivers a finished, cropped WebM. The target
# folder is public/videos/ (flat, without a part subfolder), which is likewise
# derived from the reference in the manual.
for webm in $(((WITH_VIDEOS)) && find tests/videos -name '*.webm' 2>/dev/null | sort); do
	chapter="$(basename "$(dirname "$webm")")"
	name="$(basename "$webm" .webm)"

	if ((${#CHAPTER_FILTER[@]} > 0)); then
		match=0
		for filter in "${CHAPTER_FILTER[@]}"; do
			[[ "$chapter" == "$filter" ]] && match=1
		done
		((match)) || continue
	fi

	target_path="$(grep -rhoE "/videos/${name}\.webm" manual/ | head -n 1 || true)"
	if [[ -z "$target_path" ]]; then
		echo "  skipped  ${chapter}/${name}.webm - not referenced in the manual"
		skipped=$((skipped + 1))
		continue
	fi

	target="public${target_path}"

	if ((DRY_RUN)); then
		state="new"
		[[ -f "$target" ]] && state="replaced"
		echo "  $state  ${chapter}/${name}.webm -> ${target}"
		published=$((published + 1))
		continue
	fi

	mkdir -p "$(dirname "$target")"
	cp "$webm" "$target"
	kb=$(($(stat -c%s "$target") / 1024))
	echo "  ${target}  ${kb} KB"
	published=$((published + 1))
done

echo
if ((DRY_RUN)); then
	echo "Dry run: ${published} capture(s) would be published, ${skipped} skipped."
else
	echo "${published} capture(s) published, ${skipped} skipped."
	((published > 0)) && echo "Review the changes with: git status public/images/ public/videos/"
fi
