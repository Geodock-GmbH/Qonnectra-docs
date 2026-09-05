#!/usr/bin/env bash
#
# Imports the local Qonnectra dev CA (see setup-local-qonnectra.sh) into the
# trust stores of the system and the browsers, so that
# https://app.qonnectra.localhost & co. work without a certificate warning.
#
# Only has to run ONCE per machine: the CA lives outside local-app/ and outside
# the caddy_data volume, and Caddy keeps reusing it across rebuilds instead of
# generating a new one.
#
# Usage:
#   scripts/install-local-ca.sh
#
# The system trust store needs root, so the script calls sudo for it.

set -euo pipefail

CA_DIR="${QONNECTRA_CA_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/qonnectra-local-ca}"
CA_CRT="$CA_DIR/root.crt"
CA_NICKNAME="Qonnectra Local Dev CA"
CA_FILENAME="qonnectra-local-dev-ca.crt"

log() { printf '\n\033[1;32m==>\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33mWARNING:\033[0m %s\n' "$1" >&2; }
die() { printf '\033[1;31mERROR:\033[0m %s\n' "$1" >&2; exit 1; }

[ -f "$CA_CRT" ] || die "No local dev CA found at $CA_CRT. Run scripts/setup-local-qonnectra.sh first."

# --- System trust store -----------------------------------------------------
#
# Covers curl, wget, Chrome/Chromium (which additionally uses the NSS store
# below) and everything that uses OpenSSL/GnuTLS.

if openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt "$CA_CRT" >/dev/null 2>&1; then
	log "CA is already in the system trust store - skipped (no sudo needed)"
elif command -v update-ca-certificates >/dev/null 2>&1; then
	# Debian/Ubuntu
	log "Importing CA into the system trust store (sudo)"
	sudo install -m 644 "$CA_CRT" "/usr/local/share/ca-certificates/$CA_FILENAME"
	sudo update-ca-certificates >/dev/null
elif command -v update-ca-trust >/dev/null 2>&1; then
	# Fedora/RHEL
	log "Importing CA into the system trust store (sudo)"
	sudo install -m 644 "$CA_CRT" "/etc/pki/ca-trust/source/anchors/$CA_FILENAME"
	sudo update-ca-trust extract
else
	warn "No known trust store tool (update-ca-certificates/update-ca-trust) found - please fill the system trust store manually."
fi

# --- NSS trust stores (Firefox, Chrome/Chromium) ----------------------------
#
# Firefox does not use the system trust store but its own NSS database per
# profile; Chrome/Chromium additionally uses ~/.pki/nssdb.
#
# Important: snap and flatpak browsers run with their own $HOME and do NOT see
# ~/.pki/nssdb - the snap Chromium for instance reads
# ~/snap/chromium/current/.pki/nssdb. That is why all variants are searched
# instead of only the deb paths. Globs that do not match fall through the
# cert9.db check.

NSS_DIRS=()
for candidate in \
	"$HOME"/.pki/nssdb \
	"$HOME"/snap/*/current/.pki/nssdb \
	"$HOME"/.var/app/*/.pki/nssdb \
	"$HOME"/.mozilla/firefox/*/ \
	"$HOME"/snap/firefox/common/.mozilla/firefox/*/ \
	"$HOME"/.var/app/org.mozilla.firefox/.mozilla/firefox/*/; do
	candidate="${candidate%/}"
	# Only real databases/profiles, not "Crash Reports" and the like.
	if [ -f "$candidate/cert9.db" ] || [ -f "$candidate/cert8.db" ]; then
		NSS_DIRS+=("$candidate")
	fi
done

if [ ${#NSS_DIRS[@]} -eq 0 ]; then
	log "No NSS databases (Firefox profiles, ~/.pki/nssdb) found - skipped."
elif ! command -v certutil >/dev/null 2>&1; then
	warn "certutil is missing, browser trust stores skipped. Install it and run the script again:
  Debian/Ubuntu: sudo apt install libnss3-tools
  Fedora:        sudo dnf install nss-tools
NSS databases found: ${NSS_DIRS[*]}"
else
	for db in "${NSS_DIRS[@]}"; do
		log "Importing CA into NSS database $db"
		# Delete first so that a repeated run does not fail on an already
		# existing nickname (idempotent).
		certutil -D -d "sql:$db" -n "$CA_NICKNAME" >/dev/null 2>&1 || true
		certutil -A -d "sql:$db" -t "C,," -n "$CA_NICKNAME" -i "$CA_CRT"
	done
fi

log "Done."
cat <<EOF

Imported: $CA_CRT
  Fingerprint: $(openssl x509 -in "$CA_CRT" -noout -fingerprint -sha256 | cut -d= -f2)

Restart running browsers once, after that https://app.qonnectra.localhost & co.
are reachable without a warning - including after future rebuilds of the stack.

Removing:
  sudo rm -f /usr/local/share/ca-certificates/$CA_FILENAME && sudo update-ca-certificates --fresh
  certutil -D -d sql:<nss-directory> -n "$CA_NICKNAME"
EOF
