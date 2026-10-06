#!/usr/bin/env bash
#
# Builds a new map tile set for the local Qonnectra instance with Planetiler
# and prints how to publish it as a release of this repo.
#
# Not part of the normal setup: scripts/setup-local-qonnectra.sh downloads the
# pinned, already published tile set (TILE_ID/TILE_SHA256 there). This script
# is only for moving that pin on - which changes the base map of every map
# image and is therefore a deliberate step:
#
#   1. scripts/build-map-tiles.sh <dated Geofabrik extract URL>
#   2. publish the result with the printed `gh release create` command
#   3. bump TILE_ID and TILE_SHA256 in scripts/setup-local-qonnectra.sh
#   4. run the setup script and regenerate the map images
#
# Requirements: curl, sha256sum, Java 21+.
#
# Usage:
#   scripts/build-map-tiles.sh <osm-pbf-url>
#   e.g. https://download.geofabrik.de/europe/germany/schleswig-holstein-261001.osm.pbf
#
# Use a DATED extract (…-YYMMDD.osm.pbf), not the moving "-latest" one: the
# name of the tile set and of its release is derived from the file name, and
# it has to say which state of OSM the map images show. Geofabrik keeps the
# dated extracts for a few months only - which is why the result is published
# rather than rebuilt per machine.

set -euo pipefail

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() {
	printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2
	exit 1
}

[ $# -eq 1 ] || die "Usage: $(basename "$0") <osm-pbf-url>"
OSM_URL="$1"
command -v java >/dev/null 2>&1 || die "java is missing (Planetiler needs Java 21+)."

WORK_DIR="${QONNECTRA_TILES_BUILD_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/qonnectra-tile-build}"
TILE_ID="$(basename "$OSM_URL" .osm.pbf)"
OUTPUT="$WORK_DIR/$TILE_ID.mbtiles"

# Pinned for the same reason as the extract: the tiles are only reproducible if
# both inputs are. The version is part of the file name so that a bump is
# fetched instead of the old jar being reused.
PLANETILER_VERSION="${QONNECTRA_PLANETILER_VERSION:-v0.10.2}"
PLANETILER_JAR="$WORK_DIR/planetiler-$PLANETILER_VERSION.jar"
PLANETILER_URL="https://github.com/onthegomap/planetiler/releases/download/$PLANETILER_VERSION/planetiler.jar"

mkdir -p "$WORK_DIR"

if [ ! -f "$PLANETILER_JAR" ]; then
	log "Downloading Planetiler $PLANETILER_VERSION"
	curl -fSL --retry 3 -o "$PLANETILER_JAR.tmp" "$PLANETILER_URL" ||
		die "Planetiler could not be downloaded: $PLANETILER_URL"
	mv "$PLANETILER_JAR.tmp" "$PLANETILER_JAR"
fi

log "Generating map tiles from $OSM_URL (takes a few minutes)"
# Write under an intermediate name first and rename afterwards, so an aborted
# run leaves nothing that looks finished. The extension has to stay .mbtiles -
# Planetiler derives the archive format from it ("Unsupported format").
# Working directory $WORK_DIR, so that Planetiler puts its downloads
# (data/sources) and temporary files there as well.
# --area only names the downloaded file; --osm-url decides what is fetched. It
# is set to the snapshot all the same, because Planetiler skips the download
# when the local file already exists - with the default name a new snapshot
# would silently be built from the previous extract.
TMP="$WORK_DIR/.$TILE_ID.partial.mbtiles"
if ! (cd "$WORK_DIR" && java -Xmx4g -jar "$PLANETILER_JAR" \
	--download --osm-url="$OSM_URL" --area="$TILE_ID" --force \
	--output="$TMP"); then
	rm -f "$TMP"
	die "Planetiler run for $OSM_URL failed."
fi
mv "$TMP" "$OUTPUT"

SHA256="$(sha256sum "$OUTPUT" | cut -d' ' -f1)"
log "Finished: $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"
cat <<EOM

Publish it as a release of this repo:

  gh release create tiles-$TILE_ID "$OUTPUT" --latest=false \\
    --title "Map tiles $TILE_ID" \\
    --notes "Vector map tiles for the local Qonnectra instance, built with Planetiler $PLANETILER_VERSION from $OSM_URL. Map data (c) OpenStreetMap contributors, ODbL. sha256: $SHA256"

Then pin it in scripts/setup-local-qonnectra.sh:

  TILE_ID ... :-$TILE_ID
  TILE_SHA256 ... -$SHA256

and regenerate the map images.
EOM
