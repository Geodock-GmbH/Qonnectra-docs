// Video for chapter "6. Störungsanalyse" in the manual
// (manual/teil-a-anwenderhandbuch/06-stoerungsanalyse.md):
//
//   fault_simulation  6.1  set the damage point and run the simulation
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in
// tests/06-stoerungsanalyse.spec.ts.
//
// The flow is movement, not state: the click on the trench, the window that
// opens above the damage point and, after "Simulation starten", the view that
// splits into map and report - three states that only make sense in sequence.
// A still of any single one would not show that the report grows out of the
// map click.
//
// The simulation is read-only (`simulate_fault` in apps/api/services.py), so
// this spec creates nothing it would have to remove again.
//
// Publish to public/videos/ with: pnpm screenshots:publish 06-stoerungsanalyse
import { expect, test, type Page } from '@playwright/test'

import { click, pointAt, postProcessVideo, showCursor, videoPath } from '../playwright/manual-videos'

const CHAPTER = '06-stoerungsanalyse'

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Larger than the viewport gains nothing: Chromium's screencast delivers
// CSS pixels, the deviceScaleFactor of 2 has no effect here (see
// PostProcessOptions.scale in playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/** Map extent and the trench the flow clicks, as in tests/06-stoerungsanalyse.spec.ts. */
const VIEW = { center: [1083448, 7308494], zoom: 17.4 }
const TRENCH = 'TR-BNCKM6A'

/**
 * Crop in CSS pixels of the window.
 *
 * The subject moves during the recording: before the simulation the damage
 * point sits in the centre of the full-height map (y around 593), afterwards
 * the map only takes half the height and the point moves up to around y 341,
 * while the report grows in below it. The crop has to hold both, which is what
 * fixes its height at 600 px starting at y 240.
 *
 * The width follows from the window above the damage point (256 px wide,
 * centred on it at x 1038) and from the report, whose headings start at the
 * left edge of the content area at x 313. 1120 px covers both and stays close
 * to the roughly 1000 px CLAUDE.md aims at: at the text column width of the
 * manual (around 690 px) the recording ends up at about 62 %.
 *
 * The lists of the report stay collapsed here on purpose - open, the cable
 * cards run to x 1541 and would force a noticeably wider crop for a detail the
 * still image fault_result.jpg already shows.
 */
const CROP = { x: 300, y: 240, width: 1120, height: 600 }

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

/**
 * Warm-up page. It fills the HTTP cache of the context, so that the actual
 * recording page is up within a fraction of a second - Playwright records a page
 * from its creation, and a long page load would end up in the video.
 */
async function warmUp(page: Page) {
  await page.goto('/fault-simulation')
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.close()
}

/** Opens the fault simulation in the seeded view and places the replica cursor. */
async function openFaultSimulation(page: Page) {
  await page.addInitScript((v) => {
    localStorage.setItem('mapCenter', JSON.stringify(v.center))
    localStorage.setItem('mapZoom', JSON.stringify(v.zoom))
  }, VIEW)

  await page.goto('/fault-simulation')
  await expect(page).toHaveURL(/\/fault-simulation\/2(\/|$)/)
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForTimeout(2500)

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

test('6.1 Schadenspunkt setzen und Simulation starten', async ({ page, context }) => {
  test.setTimeout(180_000)

  await warmUp(page)

  const capture = await context.newPage()
  const pageStart = Date.now()

  await openFaultSimulation(capture)

  const box = (await capture.locator('div.map').boundingBox())!
  const damagePoint = { x: box.x + box.width / 2, y: box.y + box.height / 2 }

  // Seeds the starting point of the cursor motion, so that the first step of the
  // demonstration does not begin with a jump.
  await pointAt(capture, { x: damagePoint.x - 120, y: damagePoint.y + 200 }, { duration: 400 })

  // From here the demonstration runs; everything before it is cut away.
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. Click the trench. The damage point snaps onto the line, and the window
  //    opens above it.
  await click(capture, damagePoint, { duration: 1000 })
  await expect(
    capture.locator('.fault-popup').getByText(TRENCH, { exact: true }),
    `The click on the centre of the map did not hit ${TRENCH} - has the demo ` +
      'data or VIEW changed?',
  ).toBeVisible({ timeout: 20_000 })
  await capture.waitForTimeout(1300)

  // 2. Start the simulation. The view splits: map above, report below.
  await click(capture, capture.getByRole('button', { name: 'Simulation starten' }), {
    duration: 800,
  })

  // Around two seconds on a warm stack; on a cold one the backend needs
  // noticeably longer for the fiber traces of eleven cables, hence the generous
  // timeout.
  await expect(capture.getByRole('button', { name: /^Betroffene Kabel \(\d+\)$/ })).toBeVisible({
    timeout: 60_000,
  })

  // Out of the way, so that the last frames show no hover state on the button
  // that has just been clicked.
  await pointAt(capture, { x: damagePoint.x - 200, y: 300 }, { duration: 700 })
  await capture.waitForTimeout(2400)

  await saveVideo(capture, 'fault_simulation', pageStart, demoStart)
})
