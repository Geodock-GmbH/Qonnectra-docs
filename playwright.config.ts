// Playwright setup of this repo. Always runs against the local Qonnectra
// instance in local-app/ (see playwright/local-app.ts and
// scripts/setup-local-qonnectra.sh) - there is deliberately no way to configure
// a different address.
//
// The context values match the target values from CLAUDE.md: 1792 x 1120 at
// deviceScaleFactor 2 (= images of 3584 x 2240), light mode, language DE.
import { defineConfig } from '@playwright/test'

import { localAdminUrl, localAppUrl } from './playwright/local-app'
import { APP_TIME_ZONE } from './playwright/stable-dates'

/**
 * Specs of the chapters 19-24 (part B, administration area). They are the only
 * ones that log in as Django superuser; everything else uses the account
 * without administration rights. Matched on the file name, because the chapter
 * number is part of it (tests/<NN>-<chapter-slug>.spec.ts).
 */
const ADMIN_SPECS = /[\\/](19|20|21|22|23|24)-[^\\/]*\.spec\.ts$/

export default defineConfig({
  testDir: './tests',

  // Throwaway specs used to check selectors against the running instance do not
  // belong in the run. Playwright also searches folders with a leading dot, so
  // a .tmp name alone is not enough.
  testIgnore: ['**/.tmp-*/**'],

  // Screenshots are taken against a single local instance with shared state
  // (selected project, map position). Parallel runs would change the view for
  // one another.
  fullyParallel: false,
  workers: 1,

  // Images should look the same on every run; a silent retry would instead
  // deliver an image from a half cleaned-up state.
  retries: 0,

  // A committed test.only shrinks a spec to one test: the images of the other
  // tests of that chapter are neither captured nor compared, and
  // scripts/capture.sh still counts the spec as passed, because it only sees
  // the tests in the report. Locally it stays allowed for iterating on a
  // selector; scripts/capture.sh passes CI through to the container.
  forbidOnly: !!process.env.CI,

  // The JSON report is what scripts/capture.sh reads to stamp the specs that
  // passed (see tests/captures.lock).
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/report.json' }]],
  outputDir: 'test-results',

  use: {
    // No devices[...] preset: the presets set viewport and deviceScaleFactor
    // themselves and would silently override the target values below.
    browserName: 'chromium',

    baseURL: localAppUrl(),

    // The local dev CA is not imported into every browser profile
    // (scripts/install-local-ca.sh is optional).
    ignoreHTTPSErrors: true,

    // 1120 px high, because the navigation bar with all groups expanded needs
    // 1093 px (measured) - at 800 px the group "System" sat below the visible
    // area and had to be scrolled into view for images first. The width keeps
    // the aspect ratio at 16 : 10, like all existing manual images and like the
    // 16-to-10 frame of the image pairs (`.img-row` in
    // .vitepress/theme/custom.css).
    viewport: { width: 1792, height: 1120 },
    deviceScaleFactor: 2,

    // `locale` covers everything that goes through Intl (toLocaleString,
    // navigator.language, Accept-Language), but not the widgets Chromium draws
    // itself: the placeholder of <input type="date"> ("tt.mm.jjjj" vs.
    // "mm/dd/yyyy") follows the locale of the browser process, i.e. its
    // environment. The capture image sets LC_ALL=C.UTF-8, which beats LANG, so
    // all three are set.
    locale: 'de-DE',
    launchOptions: {
      env: { ...process.env, LANGUAGE: 'de_DE', LC_ALL: 'de_DE.UTF-8', LANG: 'de_DE.UTF-8' },
      // The browser reaches nothing but the local instance. Everything in an
      // image has to come from the pinned stack, and one thing did not: the
      // web font of the base map labels, fetched from a CDN at a moment that
      // depended on its latency (see playwright/vendored-fonts.ts, which now
      // serves it from the repo). Routes are answered before any DNS lookup,
      // so the vendored files still arrive; everything else external fails at
      // once, which turns the next hidden dependency into an error instead of
      // a flaky image.
      args: [
        '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE *.qonnectra.localhost, EXCLUDE localhost',
      ],
    },
    timezoneId: APP_TIME_ZONE,
    colorScheme: 'light',

    // Manual screenshots are saved explicitly in the specs; these artefacts
    // here only serve debugging.
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      // Checks the instance and logs in programmatically; the result lands in
      // auth-state.json and admin-auth-state.json.
      name: 'setup',
      testDir: './playwright',
      testMatch: /auth\.setup\.ts/,
    },
    {
      // Still images and recordings in one run, with the account without
      // administration rights - everything except the administration chapters,
      // see "chromium-admin" below. Which specs run is decided by
      // scripts/capture.sh against tests/captures.lock, not by the project: a
      // spec runs when one of its inputs changed (see
      // scripts/capture-fingerprint.sh), and only then is its video renewed.
      //
      // That used to be a project of its own for the recordings, so that
      // `pnpm test:e2e` would not re-record them as a side effect. A recording
      // never comes out byte-identical - it is a screencast of a real
      // interaction, and its length follows render and network latency - so a
      // video has to be renewed by decision, not by a run. The lock is that
      // decision now: screenshots:publish only replaces a video whose spec was
      // stale, whatever the run recorded.
      name: 'chromium',
      testIgnore: ADMIN_SPECS,
      use: { storageState: 'auth-state.json' },
      dependencies: ['setup'],
    },
    {
      // The chapters 19-24 of part B show the Django administration, which no
      // account without administration rights can open. Splitting them off by
      // chapter number keeps a plain `pnpm test:e2e` covering both parts in one
      // run, each spec with the account its chapter needs. Otherwise it is
      // "chromium": images and recordings, selected against
      // tests/captures.lock the same way - only the login and the origin
      // differ.
      name: 'chromium-admin',
      testMatch: ADMIN_SPECS,
      use: {
        // Its own origin, not the frontend: the administration sits on
        // {$ADMIN_DOMAIN} (Caddy -> nginx -> Django). On the app domain
        // `/admin/...` only knows the route `/admin/logs` and answers
        // everything else with a 303 to `/login`, so a spec with the frontend
        // baseURL would silently capture the login page.
        // The path stays in the spec (`page.goto('/admin/auth/user/')`) -
        // Playwright resolves an absolute path against the origin alone, so a
        // baseURL ending in /admin would be dropped anyway.
        baseURL: localAdminUrl(),
        storageState: 'admin-auth-state.json',
      },
      dependencies: ['setup'],
    },
  ],
})
