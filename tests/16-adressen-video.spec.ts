// Video for chapter "16. Adressen" in the manual
// (manual/teil-a-anwenderhandbuch/16-adressen.md):
//
//   address_unit_add  16.3  add a residential unit to an address
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in tests/16-adressen.spec.ts.
//
// The flow is movement, not state: after "Speichern" the window stays open with
// the entries still in it, while the table behind it has already grown by a row.
// That is what section 16.3 warns about, and a still image cannot show it - it
// would look exactly like the window before saving.
//
// The recording creates a residential unit and removes it again, before and
// after every run. Its values are the placeholders from CLAUDE.md; the
// "Wohneinheit-ID" is left empty on purpose, because Qonnectra fills it in
// itself then - the second thing the section describes.
//
// Publish to public/videos/ with: pnpm screenshots:publish 16-adressen
import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'

import { localApp, superuserCredentials } from '../playwright/local-app'
import { click, pointAt, postProcessVideo, showCursor, typeText, videoPath } from '../playwright/manual-videos'

const CHAPTER = '16-adressen'

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Chromium's screencast delivers CSS pixels, so the deviceScaleFactor
// of 2 has no effect here (see PostProcessOptions.scale in
// playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/** The address of the recording, as in tests/16-adressen.spec.ts. */
const ADDRESS = { uuid: '613504f0-d3a3-48e5-9a83-b886b51f8345', title: 'Toft 15' }

/**
 * The residential units of ADDRESS in the demo data, by their ID. Everything a
 * run creates beyond these is deleted again, see restoreDemoUnits().
 */
const DEMO_UNITS = ['NDFZTLYM', '923TP2VC', 'JXKGXCG3', '9YH366TX', 'X7L26V3K']

/** What the recording types into the window - placeholders, see CLAUDE.md. */
const NEW_UNIT = { floor: '6', side: 'links' }

/**
 * Crop in CSS pixels of the window.
 *
 * Holds three things that belong together: the window in the middle of the
 * screen (x 640 to 1152), the table of residential units to the right of it
 * (x 1049 to 1613), which grows by a row, and the strip at the bottom edge
 * where the message appears. Without the table the point of the recording
 * would be missing.
 */
const CROP = { x: 600, y: 250, width: 1040, height: 860 }

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

// ---------------------------------------------------------------------------
// Demo state
// ---------------------------------------------------------------------------

/** Logged-in API context. The credentials are never printed. */
async function apiContext(credentials: {
  username: string
  password: string
}): Promise<APIRequestContext> {
  const { apiUrl } = localApp()
  const api = await request.newContext({ baseURL: apiUrl, ignoreHTTPSErrors: true })
  const login = await api.post('/api/v1/auth/login/', { data: credentials })
  expect(
    login.ok(),
    'Login to the API failed - is the local instance running, and are the ' +
      'credentials in local-app/deployment/.env correct?',
  ).toBe(true)
  return api
}

/**
 * Puts ADDRESS back to the state of the demo data - the residential unit the
 * recording creates is deleted again.
 *
 * Runs before **and** after every capture: before, so that an aborted attempt
 * does not start the next recording with a sixth row, afterwards so that the
 * test project is back in its demo state. The still images of the chapter count
 * the rows of this very table.
 *
 * Needs the superuser: the group "Editor" the captures are made with has access
 * level "edit" on all domain models and may not DELETE (`RoleBasedPermission`
 * in the backend) - the API answers with 403, which is what section 18.3 of the
 * manual describes.
 */
async function restoreDemoUnits() {
  const api = await apiContext(superuserCredentials())
  try {
    const units: Array<{ uuid: string; id_residential_unit: string | null }> = await (
      await api.get(`/api/v1/residential-unit/all/?uuid_address=${ADDRESS.uuid}`)
    ).json()

    for (const unit of units) {
      if (unit.id_residential_unit && DEMO_UNITS.includes(unit.id_residential_unit)) continue

      const removed = await api.delete(`/api/v1/residential-unit/${unit.uuid}/`)
      expect(
        removed.ok(),
        `The residential unit ${unit.id_residential_unit ?? unit.uuid} could not ` +
          `be deleted (HTTP ${removed.status()}). The images of the chapter show ` +
          `${DEMO_UNITS.length} rows and would fail on the leftover.`,
      ).toBe(true)
    }

    const left: Array<{ id_residential_unit: string | null }> = await (
      await api.get(`/api/v1/residential-unit/all/?uuid_address=${ADDRESS.uuid}`)
    ).json()
    expect(
      left.map((unit) => unit.id_residential_unit).sort(),
      `The residential units of "${ADDRESS.title}" in the demo data are ` +
        'incomplete. Import them again with:\n  scripts/setup-local-qonnectra.sh --reset',
    ).toEqual([...DEMO_UNITS].sort())
  } finally {
    await api.dispose()
  }
}

test.beforeEach(restoreDemoUnits)
test.afterEach(restoreDemoUnits)

// ---------------------------------------------------------------------------
// Building blocks of the recording
// ---------------------------------------------------------------------------

/**
 * Opens the address and scrolls to the section "Wohneinheiten".
 *
 * Everything up to and including the scrolled page is cut away by
 * postProcessVideo() later - the video starts at the moment section 16.3
 * describes, not at the page load.
 */
async function openUnits(page: Page) {
  await page.goto(`/address/2/${ADDRESS.uuid}`)
  await expect(page.getByRole('heading', { name: ADDRESS.title, level: 1 })).toBeVisible()
  await page.waitForLoadState('networkidle')
  // The small map in "Standort" is built in onMount; while it is still coming
  // up, the page grows and the scroll position below would shift.
  await page.waitForTimeout(2000)

  // To the end of the page: the section "Wohneinheiten" sits at its foot, and
  // the table has to stay fully in frame even with the row the recording adds.
  await page.locator('main').evaluate((main) => main.scrollTo(0, main.scrollHeight))
  await page.waitForTimeout(800)

  await showCursor(page)
}

/** Saves the recording of `page` and cuts off everything before `demoStart`. */
async function saveVideo(page: Page, name: string, pageStart: number, demoStart: number) {
  const video = page.video()
  expect(video, 'Playwright recorded no video - check test.use({ video }).').toBeTruthy()
  await page.close()

  const raw = test.info().outputPath(`${name}-raw.webm`)
  await video!.saveAs(raw)

  postProcessVideo({
    source: raw,
    target: videoPath(CHAPTER, name),
    crop: CROP,
    // Cut exactly at demoStart, not a lead-in earlier: before it the page is
    // still building itself. LEAD_IN is the still second **after** demoStart and
    // is therefore already part of the finished video.
    startAt: Math.max(0, (demoStart - pageStart) / 1000),
  })
}

// ---------------------------------------------------------------------------
// 16.3 Add a residential unit
// ---------------------------------------------------------------------------

test('16.3 Wohneinheit hinzufügen', async ({ page, context }) => {
  test.setTimeout(180_000)

  // Warm-up page. It fills the HTTP cache of the context, so that the actual
  // recording page is up within a fraction of a second - Playwright records a
  // page from its creation, and a long page load would end up in the video.
  await page.goto(`/address/2/${ADDRESS.uuid}`)
  await expect(page.getByRole('heading', { name: ADDRESS.title, level: 1 })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.close()

  const capture = await context.newPage()
  const pageStart = Date.now()

  await openUnits(capture)

  // Deliberately not getByRole: while the window is open, the page behind it
  // is aria-hidden, and a role query would no longer find the table whose new
  // row is the point of the recording.
  const units = capture
    .locator('h2', { hasText: 'Wohneinheiten' })
    .locator('xpath=ancestor::div[contains(@class,"card")][1]')
  const rows = units.locator('table tbody tr')
  await expect(rows).toHaveCount(DEMO_UNITS.length)

  const add = units.getByRole('button', { name: 'Hinzufügen' })

  // Seeds the starting point of the cursor motion, so that the first step of
  // the demonstration does not begin with a jump.
  await pointAt(capture, { x: 1400, y: 1000 }, { duration: 400 })

  // From here the demonstration runs; everything before it is cut away.
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. Open the window.
  await click(capture, add, { duration: 900 })
  const dialog = capture.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Wohneinheit hinzufügen' })).toBeVisible()
  await capture.waitForTimeout(600)

  // 2. Fill in the fields. "Wohneinheit-ID" stays empty on purpose.
  await click(capture, capture.locator('#modal-floor'), { duration: 700 })
  await typeText(capture, NEW_UNIT.floor)
  await click(capture, capture.locator('#modal-side'), { duration: 500 })
  await typeText(capture, NEW_UNIT.side)
  await capture.waitForTimeout(500)

  // 3. Save. The row appears in the table behind, Qonnectra confirms - and the
  //    window stays open with the entries still in it.
  await click(capture, dialog.getByRole('button', { name: 'Speichern' }), { duration: 800 })
  await expect(capture.getByText('Wohneinheit erfolgreich erstellt')).toBeVisible({
    timeout: 20_000,
  })
  await expect(rows).toHaveCount(DEMO_UNITS.length + 1)
  await expect(
    capture.locator('#modal-floor'),
    'The window closed after saving. If the app was changed here, section 16.3 ' +
      'of the manual and this recording need to be redone.',
  ).toHaveValue(NEW_UNIT.floor)

  // The new row makes the page longer, and the table would end below the lower
  // edge. Scrolling after it happens behind the backdrop of the window, which
  // blurs everything there anyway - the picture only clears again when the
  // window closes, and then the row is in frame.
  await capture.locator('main').evaluate((main) => main.scrollTo(0, main.scrollHeight))
  await capture.waitForTimeout(1500)

  // 4. Close the window - the step the section asks for so that no second
  //    residential unit is created.
  await click(capture, dialog.getByRole('button', { name: 'Schließen' }), { duration: 800 })
  await expect(dialog).toBeHidden()

  // Out of the way, so that the last frames show no hover state on a row, and
  // long enough to end on the state that stays: the new row in the table.
  await pointAt(capture, { x: 700, y: 1000 }, { duration: 600 })
  await capture.waitForTimeout(1500)

  await saveVideo(capture, 'address_unit_add', pageStart, demoStart)
})
