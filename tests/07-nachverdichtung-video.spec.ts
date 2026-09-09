// Video for chapter "7. Nachverdichtung" in the manual
// (manual/teil-a-anwenderhandbuch/07-nachverdichtung.md):
//
//   compaction_search  7.1  type a search term, pick an address from the hits
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in
// tests/07-nachverdichtung.spec.ts.
//
// The flow is movement, not state: the hit list appears on its own a moment
// after the last keystroke, it shrinks with every further character, and the
// click on a hit replaces the whole view - search field gone, values and map
// in its place. Two stills would show the before and the after and leave out
// precisely the connection between them.
//
// Nothing is written: the view only writes when "Exportieren" is pressed, and
// this spec stops before the export dialog.
//
// Publish to public/videos/ with: pnpm screenshots:publish 07-nachverdichtung
import { expect, test, type Page } from '@playwright/test'

import {
  click,
  pointAt,
  postProcessVideo,
  showCursor,
  typeText,
  videoPath,
} from '../playwright/manual-videos'

const CHAPTER = '07-nachverdichtung'

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Larger than the viewport gains nothing: Chromium's screencast delivers
// CSS pixels, the deviceScaleFactor of 2 has no effect here (see
// PostProcessOptions.scale in playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/** Search term and address, as in tests/07-nachverdichtung.spec.ts. */
const SEARCH_TERM = 'Toft 1'
// The address ID comes from the export and no longer from the local database:
// the importer takes id_address over from production, because a trigger would
// otherwise generate a new one on every re-import (see PROJECT_ID and
// id_address in scripts/qonnectra-demo-data/import_geodock_export.py).
const ADDRESS_ID = '6XCTUWG'

/**
 * Crop in CSS pixels of the window.
 *
 * The whole view is one card of `max-w-4xl` centred in the content area, so it
 * sits between x 612 and 1463. 900 px starting at x 590 frames it with a small
 * margin and matches the roughly 1000 px CLAUDE.md aims at.
 *
 * The height runs from the heading down past the "Start" button (y 762 in the
 * detail view), which is the last thing the flow produces.
 */
const CROP = { x: 590, y: 95, width: 900, height: 720 }

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

/**
 * Warm-up page. It fills the HTTP cache of the context, so that the actual
 * recording page is up within a fraction of a second - Playwright records a page
 * from its creation, and a long page load would end up in the video.
 */
async function warmUp(page: Page) {
  await page.goto('/post-compaction')
  await expect(page.getByRole('heading', { name: 'Nachverdichtung' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.close()
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

test('7.1 Adresse suchen und auswählen', async ({ page, context }) => {
  test.setTimeout(180_000)

  await warmUp(page)

  const capture = await context.newPage()
  const pageStart = Date.now()

  await capture.goto('/post-compaction')
  await expect(capture.getByRole('heading', { name: 'Nachverdichtung' })).toBeVisible()
  await capture.waitForLoadState('networkidle')

  await showCursor(capture)

  const field = capture.getByPlaceholder('Adresse suchen...')
  const list = capture.locator('div.max-h-80')

  // Seeds the starting point of the cursor motion, so that the first step of the
  // demonstration does not begin with a jump.
  const start = (await field.boundingBox())!
  await pointAt(capture, { x: start.x + 120, y: start.y + 260 }, { duration: 400 })

  // From here the demonstration runs; everything before it is cut away.
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. Put the cursor into the search field and type. The app searches by
  //    itself around 300 ms after the last keystroke.
  await click(capture, field, { duration: 900, fraction: { x: 0.08 } })
  await capture.waitForTimeout(400)
  await typeText(capture, SEARCH_TERM)

  // 2. The hit list appears - five addresses of the street Toft whose house
  //    number contains a 1.
  const hit = list.getByRole('button').filter({ hasText: ADDRESS_ID })
  await expect(hit).toBeVisible({ timeout: 20_000 })
  await capture.waitForTimeout(1400)

  // 3. Pick Toft 1. Search field and list give way to the values and the map.
  await click(capture, hit, { duration: 1100, fraction: { x: 0.2 } })

  await expect(capture.locator('.map-container-compact canvas').first()).toBeVisible({
    timeout: 30_000,
  })
  await expect(capture.getByRole('button', { name: 'Start', exact: true })).toBeVisible()
  // The map excerpt draws its tiles through a worker pool; the video should end
  // on the finished picture, not on a grey frame.
  await capture.waitForTimeout(2800)

  // Out of the way, so that the last frames show no hover state.
  await pointAt(capture, { x: start.x + 700, y: start.y + 560 }, { duration: 600 })
  await capture.waitForTimeout(1200)

  await saveVideo(capture, 'compaction_search', pageStart, demoStart)
})
