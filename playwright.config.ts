// Playwright setup of this repo. Always runs against the local Qonnectra
// instance in local-app/ (see playwright/local-app.ts and
// scripts/setup-local-qonnectra.sh) - there is deliberately no way to configure
// a different address.
//
// The context values match the target values from CLAUDE.md: 1792 x 1120 at
// deviceScaleFactor 2 (= images of 3584 x 2240), light mode, language DE.
import { defineConfig } from '@playwright/test'

import { localAppUrl } from './playwright/local-app'
import { APP_TIME_ZONE } from './playwright/stable-dates'

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

  reporter: [['list'], ['html', { open: 'never' }]],
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
      // auth-state.json.
      name: 'setup',
      testDir: './playwright',
      testMatch: /auth\.setup\.ts/,
    },
    {
      // Everything that produces still images. Deliberately without the video
      // specs - see the project "videos" below.
      name: 'chromium',
      use: { storageState: 'auth-state.json' },
      dependencies: ['setup'],
      testIgnore: /-video\.spec\.ts$/,
    },
    {
      // Videos are a project of their own so that `pnpm test:e2e` does not
      // re-record them.
      //
      // A recording can never come out byte-identical: it is a screencast of a
      // real interaction, and its length follows render and network latency.
      // Measured across two consecutive runs of the same specs, all 13 videos
      // differed, with durations 1 to 19 frames apart - while of 137 still
      // images only 8 changed. Re-recording therefore has to be a decision, not
      // a side effect: a video is renewed when its spec or the app changed, and
      // `pnpm test:e2e:videos [file]` is how that is done.
      name: 'videos',
      use: { storageState: 'auth-state.json' },
      dependencies: ['setup'],
      testMatch: /-video\.spec\.ts$/,
    },
  ],
})
