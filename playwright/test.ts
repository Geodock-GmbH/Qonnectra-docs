// The `test` every spec imports - Playwright's own, plus two fixtures that run
// for every test without being asked for: the vendored web font of the base
// map (vendored-fonts.ts), and a login that is renewed before it runs out. A
// spec that imported `test` from '@playwright/test' directly would fetch the
// font from the internet again, or in the capture container not at all, and
// would land on the login page once a run takes longer than a quarter of an
// hour; `pnpm lint:captures` fails on such an import.
//
// Everything else is re-exported unchanged, so a spec needs no second import.
import { readFileSync, writeFileSync } from 'node:fs'

import { test as base, expect, request } from '@playwright/test'

import { credentialsFor, localApp, type Role } from './local-app'
import { serveVendoredFonts } from './vendored-fonts'

export { expect, request } from '@playwright/test'
export type { APIRequestContext, BrowserContext, Locator, Page } from '@playwright/test'

/**
 * Written by playwright/auth.setup.ts, used by the projects in
 * playwright.config.ts: "chromium" with the account without administration
 * rights, "chromium-admin" with the Django superuser.
 */
const AUTH_STATE: Record<string, Role> = {
  'auth-state.json': 'user',
  'admin-auth-state.json': 'admin',
}

/** The cookies the API login sets; everything else in the state stays as seeded. */
const AUTH_COOKIES = ['api-access-token', 'api-refresh-token']

/**
 * How much of the access token has to be left when a test starts. The longest
 * tests allow themselves 4 minutes (test.setTimeout(240_000) in the video
 * specs).
 */
const MIN_REMAINING_S = 5 * 60

/**
 * Logs in again when the access token in a saved state runs out within
 * MIN_REMAINING_S, and replaces the two auth cookies in the file.
 *
 * The token lives for 15 minutes, and a run of every spec takes 25. The saved
 * state cannot renew itself: the backend rotates refresh tokens and blacklists
 * the old one (ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION), so the
 * refresh token in the file is spent by the first context that uses it. Before
 * images and videos ran in one project this went unnoticed - each of the two
 * runs got a login of its own and stayed under a quarter of an hour.
 *
 * admin-auth-state.json needs the same: the admin specs run after part A, long
 * after the setup. Its Django session is left alone - it lives for two weeks
 * (Django's default SESSION_COOKIE_AGE) and only the JWT cookies expire.
 */
async function renewLogin(stateFile: string, role: Role): Promise<void> {
  const state = JSON.parse(readFileSync(stateFile, 'utf8')) as {
    cookies: { name: string; expires: number }[]
  }
  const access = state.cookies.find((cookie) => cookie.name === 'api-access-token')
  if (access && access.expires - Date.now() / 1000 > MIN_REMAINING_S) return

  const { apiUrl } = localApp()
  const { username, password } = credentialsFor(role)
  const api = await request.newContext({ baseURL: apiUrl, ignoreHTTPSErrors: true })
  try {
    const login = await api.post('/api/v1/auth/login/', { data: { username, password } })
    if (!login.ok()) {
      throw new Error(
        `Renewing the login failed with HTTP ${login.status()} - ` +
          'see playwright/auth.setup.ts for what that means.',
      )
    }
    const fresh = (await api.storageState()).cookies.filter((cookie) =>
      AUTH_COOKIES.includes(cookie.name),
    )
    state.cookies = [
      ...state.cookies.filter((cookie) => !AUTH_COOKIES.includes(cookie.name)),
      ...fresh,
    ]
    writeFileSync(stateFile, JSON.stringify(state, null, 2))
  } finally {
    await api.dispose()
  }
}

export const test = base.extend<{ vendoredFonts: void }>({
  // Only for the saved logins - chapter 1 passes an empty state for the login
  // page, and that has to stay logged out.
  storageState: async ({ storageState }, use) => {
    if (typeof storageState === 'string' && storageState in AUTH_STATE) {
      await renewLogin(storageState, AUTH_STATE[storageState])
    }
    await use(storageState)
  },

  vendoredFonts: [
    async ({ context }, use) => {
      const unknown = await serveVendoredFonts(context)
      await use()
      expect(
        unknown(),
        'The app requested a font file that is not vendored in ' +
          'playwright/fonts/noto-sans/. The browser fell back to the local font ' +
          'for it, so the image is not the one the manual shows. Has the map ' +
          'style or ol-mapbox-style changed? See the README in that folder.',
      ).toEqual([])
    },
    { auto: true },
  ],
})
