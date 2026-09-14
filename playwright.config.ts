// Playwright setup of this repo. Always runs against the local Qonnectra
// instance in local-app/ (see playwright/local-app.ts and
// scripts/setup-local-qonnectra.sh) - there is deliberately no way to configure
// a different address.
//
// The context values match the target values from CLAUDE.md: 1792 x 1120 at
// deviceScaleFactor 2 (= images of 3584 x 2240), light mode, language DE.
import { defineConfig } from '@playwright/test'

import { localAdminUrl, localAppUrl } from './playwright/local-app'

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

  reporter: process.env.CI ? 'html' : [['list'], ['html', { open: 'never' }]],
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

    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
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
      // Everything except the administration chapters: the account without
      // administration rights, which is the interface part A describes.
      name: 'chromium',
      testIgnore: ADMIN_SPECS,
      use: { storageState: 'auth-state.json' },
      dependencies: ['setup'],
    },
    {
      // The chapters 19-24 of part B show the Django administration, which no
      // account without administration rights can open. Splitting them off by
      // chapter number keeps a plain `pnpm test:e2e` covering both parts in one
      // run - the alternative, a whole run switched over with
      // QONNECTRA_LOGIN=admin, silently retakes the part A images with the
      // wrong account.
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
