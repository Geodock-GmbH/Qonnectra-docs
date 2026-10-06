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
#   scripts/publish-screenshots.sh --dry-run    # compare and report, write nothing
#   scripts/publish-screenshots.sh --force      # write even unchanged images
#
# --videos and --images are not a luxury: images with hand-drawn annotations
# (pattern 3) are post-processed by hand after publishing. A run without a
# restriction overwrites that handwork with the raw capture.
#
# An image whose picture matches the committed one is left untouched. The dry
# run converts and compares exactly like the real run and reports every image
# as new, changed or unchanged - it only does not write.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

QUALITY=85
MAX_BYTES=$((1200 * 1024)) # target from CLAUDE.md: < 1.2 MB

# An image is only written when it differs from the committed one.
#
# Without this every run rewrote almost every file, and reviewing that is
# impossible: one commit in the history rewrote 99 of 137 images, 72 of them
# without any visible difference.
#
# The tolerance is zero, deliberately. The captures are reproducible - of the
# 137 images of a run against an unchanged manual, 127 came out pixel-identical
# to the committed JPEG without any fuzz, and each of the remaining ten had a
# cause in a spec: a transition caught halfway, a bounding box measured while
# the element was still sliding open, a crop with fractional coordinates. Those
# are fixed in playwright/manual-shots.ts. The 10 % fuzz with 50 pixels of
# headroom this gate had before hid a genuine change: with the German locale a
# value switched from "2.5" to "2,5", which is 10 to 19 pixels at that
# tolerance, and the five images of the Wertermittlung stayed stale. With zero
# tolerance every change is reported, and whether it matters is decided by
# looking at it. An image that changes on every run is a spec to fix, not a
# tolerance to raise - see "What the pipeline cannot make deterministic" in
# CLAUDE.md.
DIFF_FUZZ='0%'
MAX_DIFF_PIXELS=0

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
		# Prints the header comment above, up to `set -euo pipefail`.
		sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d' | sed 's/^# \?//'
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
	# All three, not just convert: `compare` decides whether an image changed at
	# all, and `git` provides the committed version it is compared with.
	for tool in convert compare git; do
		if ! command -v "$tool" >/dev/null 2>&1; then
			echo "$tool is missing. ImageMagick: sudo apt install imagemagick" >&2
			exit 1
		fi
	done
fi

if [[ ! -d tests/screenshots && ! -d tests/videos ]]; then
	echo "tests/screenshots/ and tests/videos/ do not exist - produce the captures first:" >&2
	echo "  pnpm test:e2e" >&2
	exit 1
fi

# Converted candidates and committed copies live here, never next to the
# published files - an unchanged image must not touch its published file, and
# the dry run must not leave anything behind.
SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

# True when the freshly converted image differs from the reference by no more
# than MAX_DIFF_PIXELS pixels outside the fuzz tolerance.
same_picture() {
	local reference=$1 candidate=$2 differing

	# `compare` exits 1 when the images differ, and the script runs with
	# `set -e -o pipefail`.
	differing=$(
		compare -metric AE -fuzz "$DIFF_FUZZ" "$reference" "$candidate" null: 2>&1 | head -n 1
	) || true

	# Anything that is not a plain number means compare could not do it - most
	# likely different dimensions. That counts as changed.
	[[ "$differing" =~ ^[0-9]+$ ]] || return 1
	((differing <= MAX_DIFF_PIXELS))
}

# Writes the committed version of a published file to $2. Fails when the file
# is not in HEAD, i.e. for a new image.
#
# The comparison runs against HEAD and not against the working tree. Otherwise a
# transient caught in one run and gone in the next leaves a chain of rewrites
# behind: microduct_drawer differed from HEAD by a single pixel and was still
# rewritten, because the run before had put a bigger difference into the
# working tree and this run then differed from that one.
committed_copy() {
	local target=$1 copy=$2
	git cat-file -e "HEAD:${target}" 2>/dev/null || return 1
	git show "HEAD:${target}" >"$copy"
}

# Converts a capture to JPEG into $2, lowering the quality as far as the target
# file size requires. Leaves the quality used in $quality and the size in $size.
#
# "JPEG:" is not decoration. ImageMagick takes the output format from the file
# name extension; without it a scratch file that does not end in .jpg falls
# back to the format of the input, and a PNG lands in a file called .jpg, at
# roughly three times the size and ignoring -quality.
convert_candidate() {
	local png=$1 out=$2
	quality=$QUALITY
	while :; do
		convert "$png" -quality "$quality" -strip "JPEG:$out"
		size=$(stat -c%s "$out")
		if ((size <= MAX_BYTES)) || ((quality <= 60)); then
			break
		fi
		quality=$((quality - 5))
	done
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
restored=0

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
	candidate="${SCRATCH}/${name}.jpg"
	committed="${SCRATCH}/${name}.committed.jpg"
	convert_candidate "$png" "$candidate"

	# What the candidate is compared with: the committed file, or - for an image
	# that has been published but not committed yet - the working tree file,
	# which is the only reference there is at that point.
	reference=""
	if committed_copy "$target" "$committed"; then
		reference=$committed
	elif [[ -f "$target" ]]; then
		reference=$target
	fi

	if ((!FORCE)) && [[ -n "$reference" ]] && same_picture "$reference" "$candidate"; then
		unchanged=$((unchanged + 1))
		# An earlier run left a different picture in the working tree, and this
		# run does not confirm it - so the committed file comes back.
		if [[ "$reference" == "$committed" ]] && ! cmp -s "$committed" "$target" 2>/dev/null; then
			if ((DRY_RUN)); then
				echo "  unchanged  ${chapter}/${name}.png - working tree differs from HEAD, would be restored"
			else
				install -m 644 "$committed" "$target"
				echo "  restored  ${target}"
			fi
			restored=$((restored + 1))
		fi
		continue
	fi

	state="changed"
	[[ -n "$reference" ]] || state="new"
	kb=$((size / 1024))
	note=""
	((quality != QUALITY)) && note=" (quality lowered to ${quality})"
	((size > MAX_BYTES)) && note=" (over 1.2 MB - please check)"

	if ((DRY_RUN)); then
		echo "  ${state}  ${chapter}/${name}.png -> ${target}${note}"
	else
		mkdir -p "$(dirname "$target")"
		install -m 644 "$candidate" "$target"
		echo "  ${state}  ${target}  ${kb} KB${note}"
	fi
	published=$((published + 1))
done

# --- Videos ---------------------------------------------------------------
#
# No conversion: the spec already delivers a finished, cropped WebM. The target
# folder is public/videos/ (flat, without a part subfolder), which is likewise
# derived from the reference in the manual. And no comparison - a recording is
# never byte-identical to the previous one, see the project "videos" in
# playwright.config.ts.
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
	summary="Dry run: ${published} capture(s) would be published, ${skipped} skipped"
	if ((unchanged > 0)); then summary="${summary}, ${unchanged} unchanged"; fi
	if ((restored > 0)); then summary="${summary}, ${restored} would be restored from HEAD"; fi
	echo "${summary}."
else
	summary="${published} capture(s) published, ${skipped} skipped"
	if ((unchanged > 0)); then summary="${summary}, ${unchanged} unchanged"; fi
	if ((restored > 0)); then summary="${summary}, ${restored} restored from HEAD"; fi
	echo "${summary}."
	if ((published > 0 || restored > 0)); then
		echo "Review the changes with: git status public/images/ public/videos/"
	fi
	if ((unchanged > 0)); then
		echo "Unchanged images keep their committed file; --force overrides that."
	fi
fi
