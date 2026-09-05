// Playwright setup of this repo. Always runs against the local Qonnectra
// instance in local-app/ (see playwright/local-app.ts and
// scripts/setup-local-qonnectra.sh) - there is deliberately no way to configure
// a different address.
//
// The context values match the target values from CLAUDE.md: 1792 x 1120 at
// deviceScaleFactor 2 (= images of 3584 x 2240), light mode, language DE.
import { defineConfig } from '@playwright/test'

import { localAppUrl } from './playwright/local-app'

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
      // auth-state.json.
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
