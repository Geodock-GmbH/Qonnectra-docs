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
#   scripts/publish-screenshots.sh --force      # write even unchanged images
#
# --videos and --images are not a luxury: images with hand-drawn annotations
# (pattern 3) are post-processed by hand after publishing. A run without a
# restriction overwrites that handwork with the raw capture.
#
# An image whose picture matches the published one is left untouched, so that a
# run only shows what really changed - see DIFF_FUZZ below for why that is
# needed and how the tolerance was measured.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

QUALITY=85
MAX_BYTES=$((1200 * 1024)) # target from CLAUDE.md: < 1.2 MB

# An image is only written when it actually differs from the published one.
#
# Without this every run rewrote almost every file: a capture of the same view
# differs from the previous one in the anti-aliasing of the glyph edges, by at
# most 17 of 255 - invisible, but enough to change every byte of the JPEG. One
# commit in the history rewrote 99 of 137 images that way, and 72 of them had no
# visible difference at all. Reviewing that is impossible, and it buries the
# handful of images that really did change.
#
# The two values are measured, not guessed (comparison of two consecutive runs):
# at a fuzz of 10 % the anti-aliasing noise comes out at exactly 0 differing
# pixels, while the smallest genuine change - a map object that was selected in
# one run and not in the other - still counts 217. 50 leaves a wide margin on
# both sides.
DIFF_FUZZ='10%'
MAX_DIFF_PIXELS=50

DRY_RUN=0
FORCE=0
WITH_IMAGES=1
WITH_VIDEOS=1
CHAPTER_FILTER=()

for arg in "$@"; do
	case "$arg" in
	--dry-run) DRY_RUN=1 ;;
	--force) FORCE=1 ;;
	--videos) WITH_IMAGES=0 ;;
	--images) WITH_VIDEOS=0 ;;
	-h | --help)
		# Prints the usage block of the header comment above (lines 2-24).
		sed -n '2,24p' "${BASH_SOURCE[0]}" | sed 's/^# \?//'
		exit 0
		;;
	-*)
		echo "Unknown option: $arg" >&2
		exit 1
		;;
	*) CHAPTER_FILTER+=("$arg") ;;
	esac
done

if ((WITH_IMAGES)); then
	# Both, not just convert: `compare` is what decides whether an image changed
	# at all, and without it every run would look like a full rewrite.
	for tool in convert compare; do
		if ! command -v "$tool" >/dev/null 2>&1; then
			echo "ImageMagick ($tool) is missing. Install it with: sudo apt install imagemagick" >&2
			exit 1
		fi
	done
fi

if [[ ! -d tests/screenshots && ! -d tests/videos ]]; then
	echo "tests/screenshots/ and tests/videos/ do not exist - produce the captures first:" >&2
	echo "  pnpm test:e2e" >&2
	exit 1
fi

# True when the freshly converted image differs from the published one by no
# more than MAX_DIFF_PIXELS pixels outside the fuzz tolerance.
same_picture() {
	local published=$1 candidate=$2 differing

	# `compare` exits 1 when the images differ, and the script runs with
	# `set -e -o pipefail`.
	differing=$(
		compare -metric AE -fuzz "$DIFF_FUZZ" "$published" "$candidate" null: 2>&1 | head -n 1
	) || true

	# Anything that is not a plain number means compare could not do it - most
	# likely different dimensions. That counts as changed.
	[[ "$differing" =~ ^[0-9]+$ ]] || return 1
	((differing <= MAX_DIFF_PIXELS))
}

# Two capture folders holding the same image name publish to the same file, and
# whichever is processed later wins - silently, without either run reporting
# anything.
#
# Not hypothetical: the chapter renumbering left tests/screenshots/
# 03-einstieg-anmeldung/ next to 01-erste-schritte/. Because "03" sorts after
# "01", six login_* images were published from captures weeks old on every
# single run, overwriting the fresh ones - including a hand-annotated image.
abort_on_duplicate_names() {
	local root=$1 ext=$2 duplicates name

	[[ -d "$root" ]] || return 0

	duplicates=$(find "$root" -name "*.${ext}" -printf '%f\n' 2>/dev/null | sort | uniq -d)
	[[ -z "$duplicates" ]] && return 0

	echo "Several capture folders below ${root}/ hold the same name:" >&2
	while read -r name; do
		[[ -z "$name" ]] && continue
		find "$root" -name "$name" -printf '  %TY-%Tm-%Td %TH:%TM  %p\n' | sort >&2
	done <<<"$duplicates"
	echo >&2
	echo "Only one of them can be published, and which one would depend on the" >&2
	echo "sort order of the folder names. Delete the folders left over from the" >&2
	echo "old chapter numbering and run again." >&2
	exit 1
}

if ((WITH_IMAGES)); then abort_on_duplicate_names tests/screenshots png; fi
if ((WITH_VIDEOS)); then abort_on_duplicate_names tests/videos webm; fi

published=0
skipped=0
unchanged=0

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

	# Converted next to the target first, so that an image that turns out to be
	# unchanged never touches the published file.
	candidate="$(mktemp "${target}.XXXXXX")"
	trap 'rm -f "$candidate"' EXIT

	# Lower the quality as far as the target file size requires.
	#
	# "JPEG:" is not decoration. ImageMagick takes the output format from the
	# file name extension, and the name mktemp produces ends in its random
	# suffix - so it fell back to the format of the input and wrote a PNG into a
	# file called .jpg, at roughly three times the size and ignoring -quality.
	quality=$QUALITY
	while :; do
		convert "$png" -quality "$quality" -strip "JPEG:$candidate"
		size=$(stat -c%s "$candidate")
		if ((size <= MAX_BYTES)) || ((quality <= 60)); then
			break
		fi
		quality=$((quality - 5))
	done

	if ((!FORCE)) && [[ -f "$target" ]] && same_picture "$target" "$candidate"; then
		rm -f "$candidate"
		unchanged=$((unchanged + 1))
		continue
	fi

	# mktemp creates with 600; the published images are web assets.
	chmod 644 "$candidate"
	mv "$candidate" "$target"

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
	summary="${published} capture(s) published, ${skipped} skipped"
	if ((unchanged > 0)); then summary="${summary}, ${unchanged} unchanged"; fi
	echo "${summary}."
	if ((published > 0)); then
		echo "Review the changes with: git status public/images/ public/videos/"
	fi
	if ((unchanged > 0)); then
		echo "Unchanged images keep their published file; --force overrides that."
	fi
fi
