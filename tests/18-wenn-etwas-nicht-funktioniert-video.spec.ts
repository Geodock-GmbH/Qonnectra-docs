// Video for chapter "18. Wenn etwas nicht funktioniert" in the manual
// (manual/teil-a-anwenderhandbuch/18-wenn-etwas-nicht-funktioniert.md):
//
//   error_permission  18.3  an action that fails on a missing right
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in
// tests/18-wenn-etwas-nicht-funktioniert.spec.ts.
//
// The flow is movement, not state: the button is there, the confirmation comes,
// and only after confirming does the refusal appear - and disappear again a few
// seconds later. A still image shows either the confirmation or the message,
// and neither of the two explains why the row is still in the table afterwards.
//
// Nothing is deleted: the capture account (group "Editor") has access level
// "edit" on all domain models and may not DELETE (`RoleBasedPermission` in the
// backend), so the API answers with 403. A run with QONNECTRA_LOGIN=admin would
// actually delete the residential unit, which is why the spec refuses to run as
// superuser.
//
// Publish to public/videos/ with: pnpm screenshots:publish 18-wenn-etwas-nicht-funktioniert
import { expect, test, type Page } from '@playwright/test'

import { click, pointAt, postProcessVideo, showCursor, videoPath } from '../playwright/manual-videos'

const CHAPTER = '18-wenn-etwas-nicht-funktioniert'

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Chromium's screencast delivers CSS pixels, so the deviceScaleFactor
// of 2 has no effect here (see PostProcessOptions.scale in
// playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/** The address of the recording, as in tests/16-adressen.spec.ts. */
const ADDRESS = { uuid: '613504f0-d3a3-48e5-9a83-b886b51f8345', title: 'Toft 15', units: 5 }

/**
 * Crop in CSS pixels of the window.
 *
 * Holds the three places the flow runs through, all measured: the bin in the
 * first row of the table of residential units (x 1510 to 1547, y 722), the
 * confirmation (x 576 to 1216, y 484 to 636) and the message at the bottom
 * edge (x 704 to 1088, y 1011 to 1104). The confirmation is not centred in the
 * window, so the crop has to reach further left than its middle suggests.
 */
const CROP = { x: 520, y: 440, width: 1100, height: 680 }

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

// ---------------------------------------------------------------------------
// Building blocks of the recording
// ---------------------------------------------------------------------------

/**
 * Opens the address and scrolls to the section "Wohneinheiten".
 *
 * Everything up to and including the scrolled page is cut away by
 * postProcessVideo() later - the video starts at the moment section 18.3
 * describes, not at the page load.
 */
async function openUnits(page: Page) {
  await page.goto(`/address/2/${ADDRESS.uuid}`)
  await expect(page.getByRole('heading', { name: ADDRESS.title, level: 1 })).toBeVisible()
  await page.waitForLoadState('networkidle')
  // The small map in "Standort" is built in onMount; while it is still coming
  // up, the page grows and the scroll position below would shift.
  await page.waitForTimeout(2000)

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
    // still building itself. LEAD_IN is the still second **after** demoStart
    // and is therefore already part of the finished video.
    startAt: Math.max(0, (demoStart - pageStart) / 1000),
  })
}

// ---------------------------------------------------------------------------
// 18.3 An action without the right for it
// ---------------------------------------------------------------------------

test('18.3 Aktion ohne Recht', async ({ page, context }) => {
  test.setTimeout(120_000)

  // As superuser the deletion would go through and the demo data would lose a
  // residential unit. The recording needs the refusal, not the deletion.
  expect(
    process.env.QONNECTRA_LOGIN?.trim().toLowerCase() ?? 'user',
    'This recording has to be made with the capture account without ' +
      'administration rights. Run without QONNECTRA_LOGIN=admin.',
  ).toBe('user')

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

  // Deliberately not getByRole: while the confirmation is open, the page
  // behind it is aria-hidden, and a role query would no longer find the table
  // whose unchanged row is the point of the recording.
  const units = capture
    .locator('h2', { hasText: 'Wohneinheiten' })
    .locator('xpath=ancestor::div[contains(@class,"card")][1]')
  const rows = units.locator('table tbody tr')
  await expect(rows).toHaveCount(ADDRESS.units)

  // Seeds the starting point of the cursor motion, so that the first step of
  // the demonstration does not begin with a jump. Left of the table and left
  // of where the message will appear: on a row the cursor would leave a hover
  // highlight in the picture, on the message it would stop it from fading.
  await pointAt(capture, { x: 620, y: 1075 }, { duration: 400 })

  // From here the demonstration runs; everything before it is cut away.
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. The bin in the first row - the button is there, nothing suggests that
  //    it will not work.
  await click(capture, rows.first().getByRole('button', { name: 'Löschen' }), { duration: 900 })
  // Through the role: the page carries a second, closed confirmation - the one
  // for the address itself - with the same heading, and getByText would find
  // both.
  await expect(capture.getByRole('heading', { name: 'Löschen bestätigen' })).toBeVisible()
  await capture.waitForTimeout(900)

  // 2. Confirm.
  await click(capture, capture.getByRole('button', { name: 'Löschen', exact: true }).last(), {
    duration: 800,
  })

  // 3. The refusal - and the row stays where it was.
  await expect(
    capture.getByText('Sie sind nicht berechtigt, diese Aktion durchzuführen.'),
  ).toBeVisible({ timeout: 20_000 })
  await expect(rows).toHaveCount(ADDRESS.units)

  // Out of the way, so that the last frames show no hover state on a row, and
  // long enough for the message to have faded - that it goes by itself is the
  // second thing the chapter says about it.
  await pointAt(capture, { x: 620, y: 1075 }, { duration: 600 })
  await expect(
    capture.getByText('Sie sind nicht berechtigt, diese Aktion durchzuführen.'),
  ).toBeHidden({ timeout: 20_000 })
  await capture.waitForTimeout(1200)

  await saveVideo(capture, 'error_permission', pageStart, demoStart)
})
