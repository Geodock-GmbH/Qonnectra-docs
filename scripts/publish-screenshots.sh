#!/usr/bin/env bash
# Übernimmt die von Playwright erzeugten Screenshots aus tests/screenshots/
# nach public/images/manual/ – als JPEG in der im Handbuch üblichen Qualität.
#
# Das Zielverzeichnis wird nicht geraten, sondern aus dem Handbuch gelesen:
# für jedes Bild wird in manual/ die Stelle gesucht, die es einbindet. Ein Bild,
# das im Handbuch (noch) nicht referenziert ist, wird übersprungen – so kann
# nichts im falschen Teil-Ordner landen.
#
#   scripts/publish-screenshots.sh              # alle Kapitel
#   scripts/publish-screenshots.sh 05-karte     # nur ein Kapitel
#   scripts/publish-screenshots.sh --dry-run    # nur zeigen, was passieren würde
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

QUALITAET=85
MAX_BYTES=$((1200 * 1024)) # Zielwert aus CLAUDE.md: < 1,2 MB
DRY_RUN=0
KAPITEL_FILTER=()

for arg in "$@"; do
	case "$arg" in
	--dry-run) DRY_RUN=1 ;;
	-h | --help)
		sed -n '2,14p' "${BASH_SOURCE[0]}" | sed 's/^# \?//'
		exit 0
		;;
	-*)
		echo "Unbekannte Option: $arg" >&2
		exit 1
		;;
	*) KAPITEL_FILTER+=("$arg") ;;
	esac
done

if ! command -v convert >/dev/null 2>&1; then
	echo "ImageMagick (convert) fehlt. Installieren mit: sudo apt install imagemagick" >&2
	exit 1
fi

if [[ ! -d tests/screenshots ]]; then
	echo "tests/screenshots/ existiert nicht – zuerst die Screenshots erzeugen:" >&2
	echo "  pnpm test:e2e" >&2
	exit 1
fi

uebernommen=0
uebersprungen=0

for png in $(find tests/screenshots -name '*.png' | sort); do
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

echo
if ((DRY_RUN)); then
	echo "Probelauf: ${uebernommen} Bild(er) würden übernommen, ${uebersprungen} übersprungen."
else
	echo "${uebernommen} Bild(er) übernommen, ${uebersprungen} übersprungen."
	((uebernommen > 0)) && echo "Änderungen prüfen mit: git status public/images/"
fi
