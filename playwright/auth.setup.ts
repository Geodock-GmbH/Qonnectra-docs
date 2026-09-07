// Setup project (runs automatically before all specs, see playwright.config.ts).
//
// Checks that the local Qonnectra instance is reachable, logs in with the
// credentials from local-app/deployment/.env and stores the logged-in state in
// auth-state.json. No manual login step needed any more.
//
// Login happens with the account WITHOUT administration rights
// (APP_USER_USERNAME, group "Editor") so that the images show the interface the
// way ordinary users see it. For areas only the superuser can see, start the run
// with QONNECTRA_LOGIN=admin - but then every permission check is bypassed and
// the "Logs" menu entry is additionally in the picture.
//
// The credentials are only sent to the API, never printed.
//
// auth-state.json is regenerated on every run and is deliberately not
// reusable: the backend rotates refresh tokens and blacklists the old one
// (SIMPLE_JWT: ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION), and the
// access token lives for 15 minutes.
import { expect, request as playwrightRequest, test as setup } from '@playwright/test'

import { localApp } from './local-app'

const AUTH_STATE = 'auth-state.json'

/** Project "Testprojekt" from scripts/qonnectra-demo-data/testprojekt-export.json. */
const TEST_PROJECT_ID = '2'

/**
 * Map centre and zoom at which the complete network of the test project is in
 * frame. The map has no auto-fit - it starts from these values in localStorage
 * and would sit at zoom 2 in the Atlantic without seeding.
 * Coordinates in EPSG:3857 (projection of the map view).
 */
const MAP_CENTER = [1083532, 7308590]
const MAP_ZOOM = 16.5

setup('Anmelden und Zustand speichern', async ({ browser, request }) => {
  const { appUrl, apiUrl, username, password, role } = localApp()

  // Only the role goes into the output, never the account name - the
  // credentials in .env hang off it.
  setup.info().annotations.push({
    type: 'Login',
    description:
      role === 'admin'
        ? 'Django superuser (QONNECTRA_LOGIN=admin)'
        : 'Account without administration rights (default)',
  })

  // 1. Check reachability first so that a stack that is not running does not
  //    show up as a login error.
  let status: number
  try {
    status = (await request.get(appUrl, { maxRedirects: 0 })).status()
  } catch (error) {
    throw new Error(
      `The local Qonnectra instance is not reachable at ${appUrl}.\n` +
        'Please start it with:\n  scripts/setup-local-qonnectra.sh\n' +
        `Cause: ${(error as Error).message}`,
    )
  }
  expect(
    status,
    `${appUrl} responds with HTTP ${status}. Is the stack running? (scripts/setup-local-qonnectra.sh)`,
  ).toBeLessThan(500)

  // 2. Log in against the API directly instead of through the form - no CSRF
  //    token needed and independent of how the login page looks.
  const apiContext = await playwrightRequest.newContext({
    baseURL: apiUrl,
    ignoreHTTPSErrors: true,
  })
  // After a restart of the stack, Caddy responds with 502 for a while until
  // gunicorn in the backend has come up. That is not a failure of the setup,
  // which is why it is retried for a minute.
  const TIMEOUT_MS = 60_000
  const INTERVAL_MS = 3_000
  const deadline = Date.now() + TIMEOUT_MS
  let login = await apiContext.post('/api/v1/auth/login/', { data: { username, password } })
  while (login.status() >= 500 && Date.now() < deadline) {
    await new Promise((done) => setTimeout(done, INTERVAL_MS))
    login = await apiContext.post('/api/v1/auth/login/', { data: { username, password } })
  }

  if (!login.ok()) {
    // Keep the causes apart - otherwise a 502 while the stack warms up sends
    // you down the wrong trail.
    const reason =
      login.status() >= 500
        ? `The backend still responds with HTTP ${login.status()}. Is the stack fully up?\n` +
          '  docker ps  or  scripts/setup-local-qonnectra.sh\n' +
          'If it stays that way although the backend container is running: nginx has\n' +
          'cached the old container IP of the backend (log: "Host is unreachable").\n' +
          'Then this helps:\n  docker restart qonnectra_nginx_prod'
        : login.status() === 401 || login.status() === 400
          ? role === 'admin'
            ? 'Credentials rejected. Are DJANGO_SUPERUSER_USERNAME/-PASSWORD in ' +
              'local-app/deployment/.env correct? Rebuild with:\n' +
              '  scripts/setup-local-qonnectra.sh --reset'
            : 'Credentials rejected. The account for APP_USER_USERNAME from ' +
              'local-app/deployment/.env does not exist or has a different\n' +
              'password. The setup creates it and resets the password on every run:\n' +
              '  scripts/setup-local-qonnectra.sh'
          : `Unexpected response HTTP ${login.status()}.`
    throw new Error(`Login to ${apiUrl}/api/v1/auth/login/ failed.\n${reason}`)
  }

  const { cookies } = await apiContext.storageState()
  await apiContext.dispose()

  const accessToken = cookies.find((cookie) => cookie.name === 'api-access-token')
  expect(
    accessToken,
    'The API did not set an api-access-token cookie - unexpected login response.',
  ).toBeDefined()

  // 3. Carry the cookies over into a browser context and seed the view
  //    deterministically.
  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  await context.addCookies([
    ...cookies,
    {
      // Controls which project the app shows; a UI login would write "1"
      // (project "Default") here.
      name: 'selected-project',
      value: TEST_PROJECT_ID,
      domain: new URL(appUrl).hostname,
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
  ])

  const page = await context.newPage()
  await page.goto(appUrl, { waitUntil: 'domcontentloaded' })

  // Language, light mode and map extent live in localStorage. Without this the
  // look of the images depends on the previous run.
  await page.evaluate(
    ({ center, zoom }) => {
      localStorage.setItem('PARAGLIDE_LOCALE', 'de')
      localStorage.setItem('mode', 'light')
      localStorage.setItem('lightSwitchMode', JSON.stringify('light'))
      localStorage.setItem('basemapTheme', JSON.stringify('light'))
      localStorage.setItem('mapCenter', JSON.stringify(center))
      localStorage.setItem('mapZoom', JSON.stringify(zoom))
    },
    { center: MAP_CENTER, zoom: MAP_ZOOM },
  )

  // 4. Cross-check: does the app really show the test project?
  await page.goto(`${appUrl}/dashboard`, { waitUntil: 'domcontentloaded' })
  await expect(
    page,
    'The test project was not opened after login.',
  ).toHaveURL(new RegExp(`/dashboard/${TEST_PROJECT_ID}(/|$)`))

  await context.storageState({ path: AUTH_STATE })
  await context.close()
})
