// Video for chapter "9. Wertermittlung" in the manual
// (manual/teil-a-anwenderhandbuch/09-wertermittlung.md):
//
//   valuation_area_select  9.1  pick areas by clicking them in the map
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in
// tests/09-wertermittlung.spec.ts.
//
// The flow is the one thing about this view a still image cannot show: that the
// map and the list are two views of the same selection. A click into the map
// ticks the area in the list, takes the tick off "Gesamt (ganzes Projekt)" and
// draws the outline - three places changing at once, in a view where every
// other map in the app would open the info box instead.
//
// Nothing is written: the view only calculates, and this spec stops before
// "Berechnen".
//
// Publish to public/videos/ with: pnpm screenshots:publish 09-wertermittlung
import { expect, test, type Page } from '@playwright/test'

import { click, pointAt, postProcessVideo, showCursor, videoPath } from '../playwright/manual-videos'

const CHAPTER = '09-wertermittlung'

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Larger than the viewport gains nothing: Chromium's screencast
// delivers CSS pixels, the deviceScaleFactor of 2 has no effect here (see
// PostProcessOptions.scale in playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/**
 * Points inside the two project areas of the demo data, in CSS pixels of the
 * viewport.
 *
 * Hard-coded and not measured: the map position is seeded by
 * playwright/auth.setup.ts (mapCenter/mapZoom), so the same pixel always hits
 * the same area. Which of the two an unchecked point belongs to is not obvious
 * from the map - the spec therefore checks after every click that the intended
 * area is the one that got ticked.
 */
const AREA_POINTS = [
  { name: 'Cluster 01', x: 806, y: 672 },
  { name: 'Cluster 02', x: 900, y: 500 },
]

/**
 * Crop in CSS pixels of the window.
 *
 * The map runs from x 314 to 1104, the control panel from 1120 to 1760
 * (measured). Both together are 1446 px wide - too wide for the around 690 px
 * the manual renders a video at. 1100 px starting at the left edge of the map
 * hold the whole map plus the area list of the panel, which is what the flow is
 * about. The button "Berechnen" and the result table stay outside; they are the
 * subject of the still images of the sections 9.4 to 9.6.
 */
const CROP = { x: 314, y: 106, width: 1100, height: 800 }

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

/** Opens the valuation and waits for the map tiles. */
async function openValuation(page: Page) {
  await page.goto('/valuation')
  await expect(page.getByRole('button', { name: 'Berechnen' })).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('div.map canvas').first()).toBeVisible({ timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForTimeout(4000)
}

/**
 * Warm-up page. It fills the HTTP cache of the context, so that the actual
 * recording page is up within a fraction of a second - Playwright records a
 * page from its creation, and a long page load would end up in the video.
 */
async function warmUp(page: Page) {
  await openValuation(page)
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

test('9.1 Gebiet in der Karte auswählen', async ({ page, context }) => {
  test.setTimeout(240_000)

  await warmUp(page)

  const capture = await context.newPage()
  const pageStart = Date.now()

  await openValuation(capture)
  await showCursor(capture)

  const gesamt = capture.getByRole('checkbox').first()
  await expect(gesamt).toBeChecked()

  // Seeds the starting point of the cursor motion, so that the first step of
  // the demonstration does not begin with a jump.
  await pointAt(capture, { x: 520, y: 860 }, { duration: 400 })

  // From here the demonstration runs; everything before it is cut away.
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  for (const [index, point] of AREA_POINTS.entries()) {
    // 1. Click into the area. The tick appears in the list, "Gesamt" loses its
    //    own, and the outline is drawn in the map.
    // 2. The same again with the second area - several areas add up.
    await click(capture, { x: point.x, y: point.y }, { duration: index === 0 ? 1100 : 900 })

    const checkbox = capture
      .locator('label')
      .filter({ hasText: point.name })
      .getByRole('checkbox')
    await expect(
      checkbox,
      `The click at (${point.x}, ${point.y}) did not tick "${point.name}" - has the map position changed?`,
    ).toBeChecked()
    await expect(gesamt).not.toBeChecked()

    // The outline is drawn into the canvas, not into the DOM.
    await capture.waitForTimeout(index === 0 ? 1800 : 2400)
  }

  // Out of the areas, so that the last frames show no hover state over the map.
  await pointAt(capture, { x: 420, y: 1000 }, { duration: 700 })
  await capture.waitForTimeout(1200)

  await saveVideo(capture, 'valuation_area_select', pageStart, demoStart)
})
