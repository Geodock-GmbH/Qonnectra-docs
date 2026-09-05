// Video for chapter "6. Rohrverwaltung" in the manual
// (manual/teil-a-anwenderhandbuch/06-rohrverwaltung.md), section 6.3
// "Rohr hinzufügen".
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in
// tests/06-rohrverwaltung.spec.ts.
//
// Publish to public/videos/ with: pnpm screenshots:publish 06-rohrverwaltung
import { expect, request, test, type APIRequestContext, type Locator } from '@playwright/test'

import { localApp, superuserCredentials } from '../playwright/local-app'
import {
  click,
  pointAt,
  postProcessVideo,
  showCursor,
  typeText,
  videoPath,
} from '../playwright/manual-videos'

const CHAPTER = '06-rohrverwaltung'

// ---------------------------------------------------------------------------
// Video for section 6.3 "Rohr hinzufügen"
// ---------------------------------------------------------------------------
//
// Shows the flow the section describes: open the dialog, fill in name, conduit
// type and flag, save, and close. Two things about it only become visible over
// time and are the reason this is a video and not a still image:
//
//   1. After "Speichern" the dialog stays open and keeps all its values - a
//      still image of that is indistinguishable from "nothing happened". The
//      success message at the bottom edge of the window is the only sign that
//      anything happened at all, which is why it is inside the crop.
//   2. Only after "Schließen" does the new conduit become visible at the top of
//      the list. It is already in the table while the dialog is open, but the
//      backdrop blurs it (`backdrop-blur-sm` in PipeModal.svelte) - unreadable
//      in the video.

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Larger than the viewport gains nothing: Chromium's screencast delivers
// CSS pixels, the deviceScaleFactor of 2 has no effect here (see
// PostProcessOptions.scale in playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/**
 * The conduit created in the video. Follows the naming of the test project and
 * is removed again through the API afterwards - the still images check the
 * number of conduits and would fail on a leftover.
 *
 * The conduit type is deliberately **not** the last entry of the list
 * ("7x16/12"). The opened list of a combobox is drawn below the fields that come
 * after it in the dialog: the class `z-9999` of the positioner
 * (GenericCombobox.svelte) does not exist in Tailwind, so the element ends up
 * with `z-index: auto` and the stacking order follows the DOM. In the dialog
 * that hits exactly the last of the six entries - it disappears behind the field
 * "Hersteller" (measured: `elementFromPoint` returns `combobox:c7:input` there).
 * A video in which the cursor clicks on a covered entry would show a click into
 * the void.
 */
const CONDUIT = 'St-V02-05'
const CONDUIT_TYPE = '12x10/6'
const FLAG = 'Sterup'

/**
 * Crop in CSS pixels of the window. Contains everything the flow touches:
 * the button "Rohr hinzufügen" (from x 325), the dialog (x 614 to 1178, y 260
 * to 860), the column "Name" of the list next to it and the success message at
 * the bottom edge of the window (centred, around y 1030 to 1110).
 *
 * The width is what counts: the manual renders videos at the width of the text
 * column (around 690 px), so 1060 CSS pixels end up at about 65 %. The height
 * does not change that scale - it only decides how much is visible. It reaches
 * to the bottom edge of the window here, because the message about the created
 * conduit sits there.
 */
const CROP = { x: 300, y: 96, width: 1060, height: 1022 }

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

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
 * Removes the conduit created in the video - with the superuser, because the
 * capture account (group "Editor") has access level "edit" and the API answers
 * DELETE with 403.
 *
 * Runs before **and** after the capture: before, so that the name is free again
 * after an aborted attempt (a second one would fail with "Rohr mit diesem Namen
 * existiert bereits"), afterwards so that the test project is back in its
 * demo state.
 */
async function removeConduit() {
  const api = await apiContext(superuserCredentials())
  try {
    const response = await api.get('/api/v1/conduit/all/?project=2&page_size=200')
    const body = await response.json()
    const conduits: Array<{ uuid: string; name: string }> = body.results ?? body
    for (const conduit of conduits.filter((entry) => entry.name === CONDUIT)) {
      const deleted = await api.delete(`/api/v1/conduit/${conduit.uuid}/`)
      expect(
        deleted.ok(),
        `The conduit "${CONDUIT}" could not be removed (HTTP ${deleted.status()}). ` +
          'The still images of the chapter check the number of conduits and ' +
          'would fail on the leftover.',
      ).toBe(true)
    }
  } finally {
    await api.dispose()
  }
}

test.beforeEach(removeConduit)
test.afterEach(removeConduit)

test('6.3 Rohr hinzufügen', async ({ page, context }) => {
  test.setTimeout(180_000)

  // 1. Warm-up page. It fills the HTTP cache of the context, so that the actual
  //    recording page is up within a fraction of a second - Playwright records a
  //    page from its creation, and a long page load would end up in the video.
  await page.goto('/conduit')
  await expect(page.locator('table tbody tr').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.close()

  const capture = await context.newPage()
  const pageStart = Date.now()

  await capture.addInitScript(() => {
    // The dialog pre-fills itself from the last conduit created in this browser
    // (ConduitState). The video should show the empty form being filled in.
    localStorage.removeItem('conduit-form-defaults')
  })

  await capture.goto('/conduit')
  // `/conduit` redirects to `/conduit/2` - the 2 is the test project (cookie
  // `selected-project`, set in playwright/auth.setup.ts). Without it the app
  // shows the project "Default", which holds no conduits at all.
  await expect(capture).toHaveURL(/\/conduit\/2(\/|$)/)
  await expect(capture.locator('table tbody tr').first()).toBeVisible()
  await capture.waitForLoadState('networkidle')
  await showCursor(capture)

  // The table is filled by the client (ConduitState) after hydration; until then
  // it says "Keine Ergebnisse gefunden" although the count below already reads
  // "7 Ergebnisse". Without this wait, that half-built state is the first frame
  // of the video.
  await expect(capture.locator('table tbody tr').first()).toContainText('St-')
  await capture.waitForTimeout(800)

  const dialog = capture.getByRole('dialog')
  /** Form field of the dialog by its label. */
  const field = (label: string): Locator => dialog.locator('label').filter({ hasText: label })

  // From here the demonstration runs; everything before it is cut away by
  // postProcessVideo().
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 2. Open the dialog.
  await click(capture, capture.getByTestId('add-conduit-button'), { duration: 700 })
  await expect(dialog.getByRole('heading', { name: 'Rohr hinzufügen' })).toBeVisible()
  await capture.waitForTimeout(800)

  // 3. Name - the only field that is typed rather than picked.
  await click(capture, dialog.locator('#pipe-name'), { duration: 500 })
  await typeText(capture, CONDUIT)
  await capture.waitForTimeout(600)

  // 4. Conduit type and flag. Both are required; without them the dialog cannot
  //    be saved, which is why the video does not skip them.
  //
  //    "Toggle suggestions" is the label the combobox of the design system gives
  //    its arrow button (GenericCombobox.svelte -> Combobox.Trigger).
  for (const [label, option] of [
    ['Rohrtyp', CONDUIT_TYPE],
    ['Kennzeichen', FLAG],
  ]) {
    await click(capture, field(label).getByRole('button', { name: 'Toggle suggestions' }), {
      duration: 500,
    })
    const entry = capture.getByRole('option', { name: option, exact: true })
    await expect(entry).toBeVisible()
    await capture.waitForTimeout(500)

    await click(capture, entry, { duration: 400 })
    await expect(field(label).locator('input')).toHaveValue(option)
    await capture.waitForTimeout(700)
  }

  // 5. Save. The dialog stays open and keeps its values - that is the point of
  //    the video, so the cursor pauses here instead of closing right away.
  await click(capture, dialog.getByRole('button', { name: 'Speichern', exact: true }), {
    duration: 600,
  })
  await expect(capture.getByText('Rohr erfolgreich erstellt')).toBeVisible({ timeout: 20_000 })

  // The list behind the dialog is checked without a role: while the modal is
  // open, the design system marks everything behind it as `aria-hidden`, and
  // `getByRole('cell')` finds nothing there.
  await expect(capture.locator('table tbody tr').first()).toContainText(CONDUIT)
  await capture.waitForTimeout(2500)

  // 6. Close the dialog; the video ends on the new conduit at the top of the
  //    list.
  await click(capture, dialog.getByRole('button', { name: 'Schließen', exact: true }), {
    duration: 500,
  })
  await expect(dialog).toBeHidden()
  await expect(capture.locator('table tbody tr').first()).toContainText(CONDUIT)

  // Out of the way, so that the last frame shows no hover state on the button.
  await pointAt(capture, { x: 700, y: 700 }, { duration: 500 })
  await capture.waitForTimeout(1800)

  // 7. Save the video.
  const video = capture.video()
  expect(video, 'Playwright recorded no video - check test.use({ video }).').toBeTruthy()
  await capture.close()

  const raw = test.info().outputPath('conduit_add-raw.webm')
  await video!.saveAs(raw)

  postProcessVideo({
    source: raw,
    target: videoPath(CHAPTER, 'conduit_add'),
    crop: CROP,
    // Cut exactly at demoStart, not a lead-in earlier: before it the page is
    // still building itself. LEAD_IN is the still second **after** demoStart and
    // is therefore already part of the finished video.
    startAt: Math.max(0, (demoStart - pageStart) / 1000),
  })
})
