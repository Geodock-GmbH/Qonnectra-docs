#!/usr/bin/env bash
#
# Importiert die lokale Qonnectra-Dev-CA (siehe setup-local-qonnectra.sh) in
# die Truststores von System und Browsern, damit https://app.qonnectra.localhost
# & Co. ohne Zertifikatswarnung funktionieren.
#
# Muss nur EINMAL pro Rechner laufen: die CA liegt außerhalb von local-app/ und
# außerhalb des caddy_data-Volumes und wird von Caddy bei Rebuilds weiter-
# verwendet statt neu erzeugt.
#
# Verwendung:
#   scripts/install-local-ca.sh
#
# Der System-Truststore braucht root, das Skript ruft dafür sudo auf.

set -euo pipefail

CA_DIR="${QONNECTRA_CA_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/qonnectra-local-ca}"
CA_CRT="$CA_DIR/root.crt"
CA_NICKNAME="Qonnectra Local Dev CA"
CA_FILENAME="qonnectra-local-dev-ca.crt"

log() { printf '\n\033[1;32m==>\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33mWARNUNG:\033[0m %s\n' "$1" >&2; }
die() { printf '\033[1;31mFEHLER:\033[0m %s\n' "$1" >&2; exit 1; }

[ -f "$CA_CRT" ] || die "Keine lokale Dev-CA unter $CA_CRT gefunden. Zuerst scripts/setup-local-qonnectra.sh ausführen."

# --- System-Truststore ------------------------------------------------------
#
# Deckt curl, wget, Chrome/Chromium (nutzt zusätzlich den NSS-Store unten) und
# alles ab, was OpenSSL/GnuTLS nutzt.

if openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt "$CA_CRT" >/dev/null 2>&1; then
	log "CA liegt bereits im System-Truststore - übersprungen (kein sudo nötig)"
elif command -v update-ca-certificates >/dev/null 2>&1; then
	# Debian/Ubuntu
	log "Importiere CA in den System-Truststore (sudo)"
	sudo install -m 644 "$CA_CRT" "/usr/local/share/ca-certificates/$CA_FILENAME"
	sudo update-ca-certificates >/dev/null
elif command -v update-ca-trust >/dev/null 2>&1; then
	# Fedora/RHEL
	log "Importiere CA in den System-Truststore (sudo)"
	sudo install -m 644 "$CA_CRT" "/etc/pki/ca-trust/source/anchors/$CA_FILENAME"
	sudo update-ca-trust extract
else
	warn "Kein bekanntes Truststore-Tool (update-ca-certificates/update-ca-trust) gefunden - System-Truststore bitte manuell befüllen."
fi

# --- NSS-Truststores (Firefox, Chrome/Chromium) -----------------------------
#
# Firefox nutzt den System-Truststore nicht, sondern eine eigene NSS-Datenbank
# pro Profil; Chrome/Chromium nutzt zusätzlich ~/.pki/nssdb.
#
# Wichtig: snap- und flatpak-Browser laufen mit eigenem $HOME und sehen
# ~/.pki/nssdb NICHT - der snap-Chromium liest z. B.
# ~/snap/chromium/current/.pki/nssdb. Deshalb alle Varianten absuchen statt
# nur die deb-Pfade. Nicht passende Globs fallen durch die cert9.db-Prüfung.

NSS_DIRS=()
for candidate in \
	"$HOME"/.pki/nssdb \
	"$HOME"/snap/*/current/.pki/nssdb \
	"$HOME"/.var/app/*/.pki/nssdb \
	"$HOME"/.mozilla/firefox/*/ \
	"$HOME"/snap/firefox/common/.mozilla/firefox/*/ \
	"$HOME"/.var/app/org.mozilla.firefox/.mozilla/firefox/*/; do
	candidate="${candidate%/}"
	# Nur echte Datenbanken/Profile, nicht "Crash Reports" u. ä.
	if [ -f "$candidate/cert9.db" ] || [ -f "$candidate/cert8.db" ]; then
		NSS_DIRS+=("$candidate")
	fi
done

if [ ${#NSS_DIRS[@]} -eq 0 ]; then
	log "Keine NSS-Datenbanken (Firefox-Profile, ~/.pki/nssdb) gefunden - übersprungen."
elif ! command -v certutil >/dev/null 2>&1; then
	warn "certutil fehlt, Browser-Truststores übersprungen. Nachinstallieren und Skript erneut ausführen:
  Debian/Ubuntu: sudo apt install libnss3-tools
  Fedora:        sudo dnf install nss-tools
Gefundene NSS-Datenbanken: ${NSS_DIRS[*]}"
else
	for db in "${NSS_DIRS[@]}"; do
		log "Importiere CA in NSS-Datenbank $db"
		# Erst löschen, damit ein erneuter Lauf nicht an einem bereits
		# vorhandenen Nickname scheitert (idempotent).
		certutil -D -d "sql:$db" -n "$CA_NICKNAME" >/dev/null 2>&1 || true
		certutil -A -d "sql:$db" -t "C,," -n "$CA_NICKNAME" -i "$CA_CRT"
	done
fi

log "Fertig!"
cat <<EOF

Importiert: $CA_CRT
  Fingerprint: $(openssl x509 -in "$CA_CRT" -noout -fingerprint -sha256 | cut -d= -f2)

Laufende Browser einmal neu starten, danach sind https://app.qonnectra.localhost
& Co. ohne Warnung erreichbar - auch nach künftigen Rebuilds des Stacks.

Entfernen:
  sudo rm -f /usr/local/share/ca-certificates/$CA_FILENAME && sudo update-ca-certificates --fresh
  certutil -D -d sql:<nss-verzeichnis> -n "$CA_NICKNAME"
EOF
