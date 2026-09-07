// Video for chapter "3. Wiederkehrende Bedienelemente" in the manual
// (manual/teil-a-anwenderhandbuch/03-wiederkehrende-bedienelemente.md),
// section 3.5 "Strecke und Fläche messen".
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker").
//
// Measuring is the one recurring element that a still image cannot show: the
// value at the drawing counts up while the line is being drawn, and the
// context menu, the crosshair and the closing double click are four states in a
// row. The chapter therefore gets a video and no screenshot.
//
// Publish to public/videos/ with:
//   pnpm screenshots:publish 03-wiederkehrende-bedienelemente --videos
import { expect, test } from '@playwright/test'

import { click, pointAt, postProcessVideo, showCursor, videoPath } from '../playwright/manual-videos'

const CHAPTER = '03-wiederkehrende-bedienelemente'

// Recording size = viewport from playwright.config.ts, see the comment in
// tests/05-karte-video.spec.ts.
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/**
 * Map centre in EPSG:3857 and zoom. Chosen so that the project area with its
 * trenches sits at the right edge of the crop, while the measurement itself
 * runs over the free base map to the left of it.
 *
 * That is not cosmetic: a click during a measurement does **not** only set a
 * point, it additionally selects the object underneath and opens the info box
 * (MapInteractionManager registers its click handler regardless of the Draw
 * interaction). Inside the project area every click would therefore hit the
 * area "Cluster 01", whose surface covers the entire network - the map would
 * turn completely yellow in the selection colour and the video would show
 * nothing of the measurement. Section 3.5 names this side effect in a warning.
 */
const VIEW = { center: [1083250, 7308850], zoom: 18 }

/**
 * Points of the two measurements in window coordinates. They lie inside the
 * crop (see CROP), outside the project area (see VIEW) and far enough away from
 * the legend on the right and the search on the top left that the context menu
 * does not open over a control.
 */
const DISTANCE_POINTS = [
  { x: 620, y: 380 },
  { x: 800, y: 470 },
  { x: 990, y: 400 },
]
const AREA_POINTS = [
  { x: 640, y: 620 },
  { x: 880, y: 600 },
  { x: 930, y: 780 },
  { x: 660, y: 790 },
]

/**
 * Crop in CSS pixels. Around 1000 px wide, like the existing videos - at the
 * width of the text column in the manual (about 690 px) the labels of the app
 * stay legible that way (see the head of playwright/manual-videos.ts).
 */
const CROP = { x: 430, y: 280, width: 1000, height: 640 }

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

/** Right click at the current cursor position, with a visible press phase. */
async function rightClick(page: import('@playwright/test').Page, target: { x: number; y: number }) {
  await pointAt(page, target, { duration: 600 })
  await page.waitForTimeout(180)
  await page.mouse.down({ button: 'right' })
  await page.waitForTimeout(110)
  await page.mouse.up({ button: 'right' })
}

/**
 * Sets a point of the measurement, with a pause afterwards: two clicks in quick
 * succession would be taken for a double click by OpenLayers and would end the
 * measurement early.
 */
async function measurePoint(
  page: import('@playwright/test').Page,
  target: { x: number; y: number },
) {
  await click(page, target, { duration: 550 })
  await page.waitForTimeout(500)
}

/**
 * Sets the last point and ends the measurement with a double click - the way
 * users do it.
 *
 * Deliberately **not** a single click on the point followed by a double click
 * on the same place. OpenLayers ends a drawing when the last vertex is clicked
 * again (`finishCondition`): the first click of the double click would then
 * close the shape and the second would start a new drawing straight away. The
 * measurement would end up at "0 m²" - measured, that is exactly how the first
 * take of this video came out.
 */
async function finishMeasurement(
  page: import('@playwright/test').Page,
  target: { x: number; y: number },
) {
  await pointAt(page, target, { duration: 550 })
  await page.waitForTimeout(300)
  await page.mouse.dblclick(target.x, target.y)
}

test('3.5 Strecke und Fläche messen', async ({ page, context }) => {
  test.setTimeout(180_000)

  // Warm-up page: fills the HTTP cache of the context, so that the recorded
  // page is up within a fraction of a second. Playwright records a page from
  // its creation onwards, and a long page load would end up in the video.
  await page.goto('/map')
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.close()

  const capture = await context.newPage()
  const pageStart = Date.now()

  await capture.addInitScript((v) => {
    localStorage.setItem('mapCenter', JSON.stringify(v.center))
    localStorage.setItem('mapZoom', JSON.stringify(v.zoom))
  }, VIEW)

  await capture.goto('/map')
  await expect(capture.locator('div.map canvas').first()).toBeVisible()
  await capture.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await capture.waitForTimeout(2500)
  await showCursor(capture)

  const menuItem = (name: string) => capture.getByRole('menuitem', { name, exact: true })

  // Warm-up for the context menu, still before the recorded part. The **first**
  // context menu of a page opens in the top left corner at (9, 9) instead of at
  // the pointer (measured, reproducible; from the second one on the position is
  // correct). Without this warm-up the video would open with a menu that has
  // nothing to do with the place clicked.
  await capture.mouse.move(600, 600)
  await capture.mouse.down({ button: 'right' })
  await capture.mouse.up({ button: 'right' })
  await expect(menuItem('Strecke messen')).toBeVisible()
  await capture.keyboard.press('Escape')
  await expect(menuItem('Strecke messen')).toBeHidden()
  await capture.waitForTimeout(400)

  // From here the demonstration runs; everything before it is cut away by
  // postProcessVideo().
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  const drawerTitle = capture.locator('#drawer-title')

  // 1. Open the context menu. It offers both kinds of measurement.
  await rightClick(capture, DISTANCE_POINTS[0])
  await expect(menuItem('Strecke messen')).toBeVisible()
  await capture.waitForTimeout(1200)

  // 2. Measure distance: set points, the value at the drawing counts along.
  await click(capture, menuItem('Strecke messen'), { duration: 450 })
  await capture.waitForTimeout(700)

  for (const point of DISTANCE_POINTS.slice(0, -1)) {
    await measurePoint(capture, point)
  }

  // Cross-check: no click may have selected an object on the side. If the info
  // box is open, the points have slipped into the project area and the map is
  // yellow all over - see VIEW.
  await expect(
    drawerTitle,
    'A measuring click has selected a map object - do the points still lie ' +
      'outside the project area?',
  ).toBeHidden()

  // 3. A double click sets the last point and closes the line; the value stays.
  await finishMeasurement(capture, DISTANCE_POINTS.at(-1)!)
  await capture.waitForTimeout(1800)

  // 4. Measure area. Starting a new measurement removes the previous one -
  //    exactly the behaviour the info note in section 3.5 describes.
  await rightClick(capture, AREA_POINTS[0])
  await expect(menuItem('Fläche messen')).toBeVisible()
  await capture.waitForTimeout(900)

  await click(capture, menuItem('Fläche messen'), { duration: 450 })
  await capture.waitForTimeout(700)

  for (const point of AREA_POINTS.slice(0, -1)) {
    await measurePoint(capture, point)
  }

  await finishMeasurement(capture, AREA_POINTS.at(-1)!)
  await expect(drawerTitle).toBeHidden()
  await capture.waitForTimeout(1800)

  // Cross-check: exactly one finished measurement, and not the "0 m²" of a
  // drawing that has restarted (see finishMeasurement()).
  const labels = capture.locator('.ol-measure-tooltip')
  await expect(labels).toHaveCount(1)
  await expect(labels).not.toHaveText('0 m²')

  // 5. End measuring. Only now does the context menu carry the extra entry;
  //    it removes the drawing and switches back to normal operation.
  await rightClick(capture, { x: AREA_POINTS[1].x, y: AREA_POINTS[1].y - 40 })
  await expect(menuItem('Messung beenden')).toBeVisible()
  await capture.waitForTimeout(1000)

  await click(capture, menuItem('Messung beenden'), { duration: 450 })
  await capture.waitForTimeout(1600)

  const video = capture.video()
  expect(video, 'Playwright recorded no video - check test.use({ video }).').toBeTruthy()
  await capture.close()

  const raw = test.info().outputPath('map_measure-raw.webm')
  await video!.saveAs(raw)

  postProcessVideo({
    source: raw,
    target: videoPath(CHAPTER, 'map_measure'),
    crop: CROP,
    startAt: Math.max(0, (demoStart - pageStart) / 1000 - LEAD_IN),
  })
})
