// Playwright-Setup dieses Repos. Läuft immer gegen die lokale
// Qonnectra-Instanz aus local-app/ (siehe playwright/local-app.ts und
// scripts/setup-local-qonnectra.sh) – es gibt bewusst keine Möglichkeit,
// eine andere Adresse zu konfigurieren.
//
// Kontextwerte entsprechen den Zielwerten aus CLAUDE.md: 1792 × 1120 bei
// deviceScaleFactor 2 (= Bilder mit 3584 × 2240), Hellmodus, Sprache DE.
import { defineConfig } from '@playwright/test'

import { localAppUrl } from './playwright/local-app'

export default defineConfig({
  testDir: './tests',

  // Wegwerf-Specs, mit denen Selektoren gegen die laufende Instanz geprüft
  // werden, gehören nicht in den Lauf. Playwright durchsucht auch Ordner mit
  // führendem Punkt, ein .tmp-Name allein genügt also nicht.
  testIgnore: ['**/.tmp-*/**'],

  // Screenshots entstehen gegen eine einzige lokale Instanz mit gemeinsamem
  // Zustand (ausgewähltes Projekt, Kartenposition). Parallele Läufe würden
  // sich gegenseitig die Ansicht verändern.
  fullyParallel: false,
  workers: 1,

  // Bilder sollen bei jedem Lauf gleich aussehen; ein stiller Retry würde
  // stattdessen ein Bild aus einem halb aufgeräumten Zustand liefern.
  retries: 0,

  reporter: process.env.CI ? 'html' : [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',

  use: {
    // Kein devices[...]-Preset: die Presets setzen selbst viewport und
    // deviceScaleFactor und würden die Zielwerte unten still überschreiben.
    browserName: 'chromium',

    baseURL: localAppUrl(),

    // Die lokale Dev-CA ist nicht in jedem Browser-Profil importiert
    // (scripts/install-local-ca.sh ist optional).
    ignoreHTTPSErrors: true,

    // 1120 px Höhe, weil die Navigationsleiste mit allen aufgeklappten Gruppen
    // 1093 px braucht (gemessen) – bei 800 px lag die Gruppe „System“ unter dem
    // sichtbaren Bereich und musste für Bilder erst herangescrollt werden. Die
    // Breite hält das Seitenverhältnis bei 16 : 10, wie bei allen bestehenden
    // Handbuchbildern und beim 16-:-10-Rahmen der Bildpaare (`.img-row` in
    // .vitepress/theme/custom.css).
    viewport: { width: 1792, height: 1120 },
    deviceScaleFactor: 2,

    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    colorScheme: 'light',

    // Handbuch-Screenshots werden in den Specs explizit gespeichert; diese
    // Artefakte hier dienen nur der Fehlersuche.
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      // Prüft die Instanz und meldet sich programmatisch an; Ergebnis landet
      // in auth-state.json.
      name: 'setup',
      testDir: './playwright',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { storageState: 'auth-state.json' },
      dependencies: ['setup'],
    },
  ],
})
