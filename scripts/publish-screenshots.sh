#!/usr/bin/env bash
# Übernimmt die von Playwright erzeugten Aufnahmen ins Handbuch:
#   tests/screenshots/<kapitel>/<name>.png  -> public/images/manual/<teil>/<name>.jpg
#   tests/videos/<kapitel>/<name>.webm      -> public/videos/<name>.webm
#
# Bilder werden dabei nach JPEG gewandelt (Qualität wie im Handbuch üblich),
# Videos nur kopiert – Zuschnitt und Kodierung erledigt bereits die Spec
# (videoNachbearbeiten() in playwright/manual-videos.ts).
#
# Das Ziel wird nicht geraten, sondern aus dem Handbuch gelesen: für jede
# Aufnahme wird in manual/ die Stelle gesucht, die sie einbindet. Was im
# Handbuch (noch) nicht referenziert ist, wird übersprungen – so kann nichts im
# falschen Ordner landen.
#
#   scripts/publish-screenshots.sh              # alle Kapitel, Bilder und Videos
#   scripts/publish-screenshots.sh 05-karte     # nur ein Kapitel
#   scripts/publish-screenshots.sh --videos     # nur Videos übernehmen
#   scripts/publish-screenshots.sh --bilder     # nur Bilder übernehmen
#   scripts/publish-screenshots.sh --dry-run    # nur zeigen, was passieren würde
#
# --videos bzw. --bilder sind kein Luxus: Bilder mit handgezeichneten
# Markierungen (Muster 3) werden nach dem Übernehmen von Hand nachbearbeitet.
# Ein Lauf ohne Einschränkung überschreibt diese Handarbeit mit der Rohaufnahme.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

QUALITAET=85
MAX_BYTES=$((1200 * 1024)) # Zielwert aus CLAUDE.md: < 1,2 MB
DRY_RUN=0
MIT_BILDERN=1
MIT_VIDEOS=1
KAPITEL_FILTER=()

for arg in "$@"; do
	case "$arg" in
	--dry-run) DRY_RUN=1 ;;
	--videos) MIT_BILDERN=0 ;;
	--bilder) MIT_VIDEOS=0 ;;
	-h | --help)
		sed -n '2,18p' "${BASH_SOURCE[0]}" | sed 's/^# \?//'
		exit 0
		;;
	-*)
		echo "Unbekannte Option: $arg" >&2
		exit 1
		;;
	*) KAPITEL_FILTER+=("$arg") ;;
	esac
done

if ((MIT_BILDERN)) && ! command -v convert >/dev/null 2>&1; then
	echo "ImageMagick (convert) fehlt. Installieren mit: sudo apt install imagemagick" >&2
	exit 1
fi

if [[ ! -d tests/screenshots && ! -d tests/videos ]]; then
	echo "tests/screenshots/ und tests/videos/ existieren nicht – zuerst die Aufnahmen erzeugen:" >&2
	echo "  pnpm test:e2e" >&2
	exit 1
fi

uebernommen=0
uebersprungen=0

for png in $(((MIT_BILDERN)) && find tests/screenshots -name '*.png' 2>/dev/null | sort); do
	kapitel="$(basename "$(dirname "$png")")"
	name="$(basename "$png" .png)"

	if ((${#KAPITEL_FILTER[@]} > 0)); then
		treffer=0
		for filter in "${KAPITEL_FILTER[@]}"; do
			[[ "$kapitel" == "$filter" ]] && treffer=1
		done
		((treffer)) || continue
	fi

	# Einbindung im Handbuch suchen: /images/manual/<teil>/<name>.jpg
	ziel_pfad="$(grep -rhoE "/images/manual/[^)\"' ]*/${name}\.jpg" manual/ | head -n 1 || true)"
	if [[ -z "$ziel_pfad" ]]; then
		echo "  übersprungen  ${kapitel}/${name}.png – im Handbuch nicht eingebunden"
		uebersprungen=$((uebersprungen + 1))
		continue
	fi

	ziel="public${ziel_pfad}"

	if ((DRY_RUN)); then
		zustand="neu"
		[[ -f "$ziel" ]] && zustand="ersetzt"
		echo "  $zustand  ${kapitel}/${name}.png -> ${ziel}"
		uebernommen=$((uebernommen + 1))
		continue
	fi

	mkdir -p "$(dirname "$ziel")"

	# Qualität so weit senken, wie für die Zieldateigröße nötig.
	qualitaet=$QUALITAET
	while :; do
		convert "$png" -quality "$qualitaet" -strip "$ziel"
		groesse=$(stat -c%s "$ziel")
		if ((groesse <= MAX_BYTES)) || ((qualitaet <= 60)); then
			break
		fi
		qualitaet=$((qualitaet - 5))
	done

	kb=$((groesse / 1024))
	hinweis=""
	((qualitaet != QUALITAET)) && hinweis=" (Qualität auf ${qualitaet} gesenkt)"
	((groesse > MAX_BYTES)) && hinweis=" (über 1,2 MB – bitte prüfen)"
	echo "  ${ziel}  ${kb} KB${hinweis}"
	uebernommen=$((uebernommen + 1))
done

# --- Videos ---------------------------------------------------------------
#
# Kein Umwandeln: Die Spec liefert bereits ein fertig zugeschnittenes WebM.
# Zielordner ist public/videos/ (flach, ohne Teil-Unterordner), was hier
# ebenfalls aus der Einbindung im Handbuch abgeleitet wird.
for webm in $(((MIT_VIDEOS)) && find tests/videos -name '*.webm' 2>/dev/null | sort); do
	kapitel="$(basename "$(dirname "$webm")")"
	name="$(basename "$webm" .webm)"

	if ((${#KAPITEL_FILTER[@]} > 0)); then
		treffer=0
		for filter in "${KAPITEL_FILTER[@]}"; do
			[[ "$kapitel" == "$filter" ]] && treffer=1
		done
		((treffer)) || continue
	fi

	ziel_pfad="$(grep -rhoE "/videos/${name}\.webm" manual/ | head -n 1 || true)"
	if [[ -z "$ziel_pfad" ]]; then
		echo "  übersprungen  ${kapitel}/${name}.webm – im Handbuch nicht eingebunden"
		uebersprungen=$((uebersprungen + 1))
		continue
	fi

	ziel="public${ziel_pfad}"

	if ((DRY_RUN)); then
		zustand="neu"
		[[ -f "$ziel" ]] && zustand="ersetzt"
		echo "  $zustand  ${kapitel}/${name}.webm -> ${ziel}"
		uebernommen=$((uebernommen + 1))
		continue
	fi

	mkdir -p "$(dirname "$ziel")"
	cp "$webm" "$ziel"
	kb=$(($(stat -c%s "$ziel") / 1024))
	echo "  ${ziel}  ${kb} KB"
	uebernommen=$((uebernommen + 1))
done

echo
if ((DRY_RUN)); then
	echo "Probelauf: ${uebernommen} Aufnahme(n) würden übernommen, ${uebersprungen} übersprungen."
else
	echo "${uebernommen} Aufnahme(n) übernommen, ${uebersprungen} übersprungen."
	((uebernommen > 0)) && echo "Änderungen prüfen mit: git status public/images/ public/videos/"
fi
