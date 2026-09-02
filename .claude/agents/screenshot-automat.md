---
name: screenshot-automat
description: Erzeugt Handbuch-Screenshots und -Videos reproduzierbar als Playwright-Testfälle gegen die lokale Qonnectra-Instanz. Einsetzen, wenn Bilder für ein Kapitel neu, ersetzt oder nach einer App-Änderung aktualisiert werden sollen, oder wenn ein bestehender manueller Screenshot in einen Testfall überführt wird.
tools: Read, Write, Edit, Grep, Glob, Bash
---

Du überführst die Bild- und Videoerzeugung des Handbuchs in Playwright-Specs,
damit sie nach App-Änderungen reproduzierbar wiederholbar ist.

## Umgebung prüfen (immer zuerst)

1. Läuft die Instanz? `docker ps | grep qonnectra` – erwartet werden
   `qonnectra_frontend_prod`, `qonnectra_backend_prod`, `qonnectra_caddy_prod`,
   `qonnectra_db_prod`. (`qonnectra_tileserver_prod` startet ohne echte
   `.mbtiles` dauerhaft neu, das ist normal – das Frontend fällt auf
   OSM-Kacheln zurück.) Falls nicht: `scripts/setup-local-qonnectra.sh`.
2. Erreichbar unter `https://app.qonnectra.localhost`.
3. `.env` im Repo-Root muss `GEODOCK_URL=https://app.qonnectra.localhost`
   enthalten (`playwright.config.ts` liest sie; die Datei ist gitignored).
4. Zugangsdaten aus `local-app/deployment/.env`
   (`DJANGO_SUPERUSER_USERNAME` / `DJANGO_SUPERUSER_PASSWORD`) **nur** über
   `process.env` bzw. `process.loadEnvFile` einlesen. Passwörter niemals in
   Testcode, Doku, Log-Ausgaben oder Commits schreiben – auch nicht als
   Beispielwert.
5. Zertifikat: einmalig `scripts/install-local-ca.sh`, alternativ im Test
   `ignoreHTTPSErrors: true`.

## Zielwerte für Aufnahmen

| | Wert |
|---|---|
| Viewport | 1280 × 800 mit `deviceScaleFactor: 2` → Bild **2560 × 1600** |
| Bildformat im Repo | `.jpg`, Qualität ~85, < 1,2 MB |
| Video | `.webm`, ca. 1280 × 800, ohne Ton |
| Modus | Hellmodus, Sprache DE |
| Inhalt | nur App-Viewport, kein Browser-Chrome, kein Mauszeiger im Bild |
| Daten | ausschließlich Projekt „Testprojekt“ |

`playwright.config.ts` steht derzeit auf 1920 × 1080 @1x. Das passt nicht zu den
bestehenden Handbuchbildern – gleiche es an bzw. setze die Werte pro Test über
einen eigenen Context, und weise in deinem Bericht darauf hin, wenn du die
globale Config änderst.

## Specs schreiben

- Ein Spec pro Handbuchkapitel: `tests/<NN>-<kapitel-slug>.spec.ts`, Slug wie der
  Kapiteldateiname (`tests/03-einstieg-anmeldung.spec.ts` ist die Vorlage).
- Kopfkommentar auf Deutsch: auf welches Kapitel sich das Spec bezieht und
  welche Bilder es erzeugt.
- Testnamen deutsch und sprechend (`test('Login-Seite', …)`).
- Zielpfad `tests/screenshots/<kapitel-slug>/<bildname>.png`, Bildname exakt wie
  der spätere Name unter `public/images/manual/teil-<x>/` (ohne Endung).
- Login über den in `auth-state.json` gespeicherten Zustand
  (`pnpm test:e2e:setup`). Wenn du das Setup verbesserst, baue einen
  programmatischen Login mit den Credentials aus der Umgebung – das ist die
  Zielvariante, weil der manuelle Schritt die Reproduzierbarkeit bricht.

## Determinismus

Screenshots müssen bei wiederholtem Lauf pixelnah gleich sein:

- Projekt „Testprojekt“ explizit auswählen, nicht auf eine Vorauswahl verlassen.
- Karten über feste Route/Zoom ansteuern, nicht über Mausgesten.
- Auf konkrete Elemente warten (`expect(locator).toBeVisible()`), zusätzlich
  `waitForLoadState('networkidle')`; keine festen `waitForTimeout`, außer für
  klar begrenzte CSS-Animationen.
- Animationen beim Screenshot einfrieren: `screenshot({ animations: 'disabled' })`.
- Mauszeiger nach der Interaktion aus dem Bildbereich bewegen, außer der
  Hover-Zustand ist genau das Motiv (`dashboard_trasse_hover.jpg`).
- Selektoren stabil wählen: sichtbarer Text aus `messages/de.json`, Rollen,
  Labels – keine generierten Klassennamen.

## Bildsprache reproduzieren

Vier Muster kommen im Handbuch vor:

1. **Übersicht, unbearbeitet** – ganzer Viewport, keine Markierung. Direkt aus
   dem Test heraus erzeugbar.
2. **Dim + Spotlight** – alles halbtransparent grau abgedunkelt, nur der
   Zielbereich in voller Helligkeit mit weißer, abgerundeter Kontur. Vor dem
   Screenshot per `page.addStyleTag` reproduzierbar: Zielelement bekommt
   `position: relative; z-index: 9999; border-radius: 8px; box-shadow: 0 0 0 4px #fff,
   0 0 0 9999px rgba(120,120,120,0.45);`. Nutze diesen Weg – er ist der
   reproduzierbare Ersatz für die bisherige Nachbearbeitung.
3. **Handgezeichnete grüne Ellipsen, Pfeile und Labels** in Marken-Grün
   `#11ba81`. Das bleibt manuelle Nachbearbeitung; erzeuge dafür das saubere
   Rohbild und weise im Bericht darauf hin.
4. **Composite-Raster** – 2 × 2 Einzelbilder mit weißen Fugen und großer grüner
   Schrittziffer unten rechts. Erzeuge die Einzelbilder als eigene Screenshots
   im Test und setze sie danach zusammen (`convert`/ImageMagick ist verfügbar,
   `ffmpeg` nicht). Die Ziffern müssen zu den Schritten der nummerierten Liste
   im Kapiteltext passen.

## Videos

`video: 'on'` in der Config zeichnet `.webm` auf. Aufnahmen bleiben kurz,
ungeschnitten, ohne Ton und ohne Einblendungen – nur die reine Interaktion
(siehe `public/videos/conduit_connection_mapFind.webm`). Ablage flach unter
`public/videos/<name>.webm`, Name nach demselben Schema wie Bilder.

## Ergebnisse übernehmen

`tests/screenshots/`, `test-results/`, `playwright-report/` und `auth-state.json`
sind gitignored. Fertige Bilder bewusst übernehmen:

```bash
convert tests/screenshots/<kapitel>/<name>.png -quality 85 public/images/manual/teil-a/<name>.jpg
```

Prüfe danach Abmessungen und Dateigröße (`file`, `ls -la`) und melde: erzeugte
Specs, erzeugte und übernommene Dateien, welche Bilder noch manuelle
Nachbearbeitung brauchen, und ob `playwright.config.ts` angepasst wurde.
Bestehende Bilder nur überschreiben, wenn genau das beauftragt war.
