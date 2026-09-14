// Setup project (runs automatically before all specs, see playwright.config.ts).
//
// Checks that the local Qonnectra instance is reachable, logs in with the
// credentials from local-app/deployment/.env and stores the logged-in states.
// No manual login step needed any more.
//
// Two states are written, because the manual needs two accounts:
//
// - auth-state.json       account WITHOUT administration rights (APP_USER_*,
//                         group "Editor"). Used by the project "chromium", so
//                         that the images show the interface the way ordinary
//                         users see it. QONNECTRA_LOGIN=admin switches this one
//                         to the superuser - but then every permission check is
//                         bypassed and the "Logs" menu entry is additionally in
//                         the picture.
// - admin-auth-state.json Django superuser, always. Used by the project
//                         "chromium-admin" for the chapters 19-24 of part B,
//                         which show the administration area on {$ADMIN_DOMAIN}.
//                         Only the superuser can open that area at all.
//
// Both are written on every run, so that a plain `pnpm test:e2e` covers part A
// and part B in one go and no image can end up taken with the wrong account.
//
// Two logins, because the instance has two authentication mechanisms:
//
// - The frontend and the REST API work with the JWT cookies api-access-token /
//   api-refresh-token from POST /api/v1/auth/login/.
// - The Django administration works with a **session**: it needs sessionid (and
//   csrftoken for writing forms) from the form under /admin/login/. The JWT
//   cookie does reach the admin domain (SESSION/CSRF/api-* all carry
//   Domain=.qonnectra.localhost), but Django does not evaluate it there - with
//   the JWT alone every /admin/ call answers with a 302 to /admin/login/.
//
// admin-auth-state.json therefore carries both, so that a chapter of part B can
// also show an ordinary app view without logging in a second time.
//
// The credentials are only sent to the instance, never printed.
//
// The state files are regenerated on every run and are deliberately not
// reusable: the backend rotates refresh tokens and blacklists the old one
// (SIMPLE_JWT: ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION), and the
// access token lives for 15 minutes.
import { expect, request as playwrightRequest, test as setup } from '@playwright/test'
import type { APIRequestContext, Browser, Cookie } from '@playwright/test'

import { credentialsFor, localApp, type Credentials, type Role } from './local-app'

/** Where the logged-in state of a role goes; see the header comment. */
const AUTH_STATE: Record<Role, string> = {
  user: 'auth-state.json',
  admin: 'admin-auth-state.json',
}

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

/**
 * Reachability is a property of the instance, not of the account - checking it
 * once for the first login is enough.
 */
let instanceChecked = false

async function checkInstanceReachable(request: APIRequestContext, appUrl: string) {
  if (instanceChecked) return

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

  instanceChecked = true
}

/**
 * Logs in to the Django administration on {$ADMIN_DOMAIN} and returns its
 * session cookies.
 *
 * Deliberately through the form under /admin/login/ and not through the API:
 * the administration authenticates by session, and the JWT of the API login is
 * not a substitute for it (see the header comment). The route via
 * APIRequestContext instead of a filled-in page keeps the setup independent of
 * how the login page looks.
 *
 * Both cookies carry Domain=.qonnectra.localhost (SESSION_COOKIE_DOMAIN /
 * CSRF_COOKIE_DOMAIN in the backend settings) and therefore also apply on the
 * app and API domains.
 */
async function djangoAdminSessionCookies(
  adminUrl: string,
  { username, password }: Credentials,
): Promise<Cookie[]> {
  const LOGIN_PATH = '/admin/login/'
  const loginUrl = `${adminUrl}${LOGIN_PATH}`

  const context = await playwrightRequest.newContext({
    baseURL: adminUrl,
    ignoreHTTPSErrors: true,
  })

  try {
    // 1. Fetch the form once - that is what sets the csrftoken cookie whose
    //    value the POST has to repeat.
    let form
    try {
      form = await context.get(LOGIN_PATH)
    } catch (error) {
      throw new Error(
        `The administration area is not reachable at ${loginUrl}.\n` +
          'It is its own domain (ADMIN_DOMAIN in local-app/deployment/.env),\n' +
          'routed by Caddy to the backend. Start the stack with:\n' +
          '  scripts/setup-local-qonnectra.sh\n' +
          `Cause: ${(error as Error).message}`,
      )
    }
    expect(
      form.status(),
      `${loginUrl} responds with HTTP ${form.status()} instead of the login form. ` +
        'Is ADMIN_DOMAIN routed to the backend? (Caddyfile.production.local)',
    ).toBe(200)

    const csrfToken = (await context.storageState()).cookies.find(
      (cookie) => cookie.name === 'csrftoken',
    )?.value
    expect(csrfToken, `${loginUrl} set no csrftoken cookie - unexpected response.`).toBeTruthy()

    // 2. Submit. Django checks the Referer of an HTTPS POST against
    //    CSRF_TRUSTED_ORIGINS; an APIRequestContext sends none by itself, and
    //    without it the login fails with 403 instead of setting a session.
    const login = await context.post(LOGIN_PATH, {
      form: { csrfmiddlewaretoken: csrfToken!, username, password, next: '/admin/' },
      headers: { Referer: loginUrl },
      maxRedirects: 0,
    })

    // Success is the redirect to `next`. A rejected password re-renders the
    // form with 200 - keep the two apart, otherwise a CSRF problem sends you
    // looking for a wrong password.
    if (login.status() !== 302) {
      const reason =
        login.status() === 200
          ? 'Credentials rejected, or the account is not allowed into the administration\n' +
            '(Django only lets is_staff accounts in). Are DJANGO_SUPERUSER_USERNAME/-PASSWORD\n' +
            'in local-app/deployment/.env correct? Rebuild with:\n' +
            '  scripts/setup-local-qonnectra.sh --reset'
          : login.status() === 403
            ? 'CSRF check failed. Is the admin domain listed in CSRF_TRUSTED_ORIGINS\n' +
              '(local-app/deployment/.env)?'
            : `Unexpected response HTTP ${login.status()}.`
      throw new Error(`Login to ${loginUrl} failed.\n${reason}`)
    }

    const cookies = (await context.storageState()).cookies
    const session = cookies.find((cookie) => cookie.name === 'sessionid')
    expect(
      session,
      'The administration set no sessionid cookie although the login redirected.',
    ).toBeDefined()

    // csrftoken comes along: Django rotates it on login, and without it no form
    // in the administration can be submitted.
    return cookies.filter((cookie) => cookie.name === 'sessionid' || cookie.name === 'csrftoken')
  } finally {
    await context.dispose()
  }
}

/**
 * Logs in as `loginRole` and writes the state to AUTH_STATE[loginRole].
 *
 * `loginRole` is the account to use, which for auth-state.json is the role of
 * the run (see role() in local-app.ts) and for admin-auth-state.json is always
 * the superuser.
 *
 * `withAdminSession` additionally logs in to the Django administration, so that
 * the state opens {$ADMIN_DOMAIN} as well - needed for the chapters 19-24.
 */
async function storeLoggedInState(
  browser: Browser,
  request: APIRequestContext,
  loginRole: Role,
  stateFile: string,
  withAdminSession = false,
) {
  const { appUrl, apiUrl, adminUrl } = localApp()
  const credentials = credentialsFor(loginRole)
  const { username, password } = credentials

  // 1. Check reachability first so that a stack that is not running does not
  //    show up as a login error.
  await checkInstanceReachable(request, appUrl)

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
          ? loginRole === 'admin'
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

  // 3. The administration on {$ADMIN_DOMAIN} needs a session of its own; the
  //    JWT above does not open it (see the header comment).
  const adminCookies = withAdminSession ? await djangoAdminSessionCookies(adminUrl, credentials) : []

  // 4. Carry the cookies over into a browser context and seed the view
  //    deterministically.
  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  await context.addCookies([
    ...cookies,
    ...adminCookies,
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

  // 5. Cross-check: does the app really show the test project?
  await page.goto(`${appUrl}/dashboard`, { waitUntil: 'domcontentloaded' })
  await expect(page, 'The test project was not opened after login.').toHaveURL(
    new RegExp(`/dashboard/${TEST_PROJECT_ID}(/|$)`),
  )

  // 6. And does the state really open the administration? Without the session
  //    Django answers with a redirect to /admin/login/ - a spec would then
  //    quietly capture the login page instead of the described view.
  if (withAdminSession) {
    await page.goto(`${adminUrl}/admin/`, { waitUntil: 'domcontentloaded' })
    await expect(page, 'The administration area sent us back to its login page.').toHaveURL(
      `${adminUrl}/admin/`,
    )
  }

  await context.storageState({ path: stateFile })
  await context.close()
}

setup('Anmelden und Zustand speichern', async ({ browser, request }) => {
  const { role } = localApp()

  // Only the role goes into the output, never the account name - the
  // credentials in .env hang off it.
  setup.info().annotations.push({
    type: 'Login',
    description:
      role === 'admin'
        ? 'Django superuser (QONNECTRA_LOGIN=admin)'
        : 'Account without administration rights (default)',
  })

  await storeLoggedInState(browser, request, role, AUTH_STATE.user)
})

setup('Als Administration anmelden und Zustand speichern', async ({ browser, request }) => {
  setup.info().annotations.push({
    type: 'Login',
    description: 'Django superuser for the chapters 19-24 (administration area)',
  })

  await storeLoggedInState(browser, request, 'admin', AUTH_STATE.admin, true)
})
