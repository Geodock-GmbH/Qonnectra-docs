// Video for chapter "17. Einstellungen" in the manual
// (manual/teil-a-anwenderhandbuch/17-einstellungen.md):
//
//   settings_style_reset  17.5  reset a single tile of the node type styles
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in tests/17-einstellungen.spec.ts.
//
// The subject only exists while the cursor is somewhere: the button
// "Zurücksetzen" of a tile is transparent and only fades in on hover. A still
// image of the tile would show no button at all - which is exactly why readers
// do not find it.
//
// Nothing of the test project is touched: the styles live in the localStorage
// of the browser, and the context is built fresh from auth-state.json for
// every run.
//
// Publish to public/videos/ with: pnpm screenshots:publish 17-einstellungen
import { expect, test, type Page } from '@playwright/test'

import { click, pointAt, postProcessVideo, showCursor, videoPath } from '../playwright/manual-videos'

const CHAPTER = '17-einstellungen'

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Chromium's screencast delivers CSS pixels, so the deviceScaleFactor
// of 2 has no effect here (see PostProcessOptions.scale in
// playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/**
 * The tile the recording resets, and the changed style it starts from.
 *
 * Seeded instead of produced with "Zufällig": that button hands out random
 * colours and sizes, and the video would look different on every run. The
 * seeded values are deliberately far from the default (orange square, size 6)
 * so that the reset is unmistakable.
 */
const TILE = {
  nodeType: 'Hausanschluss',
  changed: { color: '#7c3aed', size: 20, visible: true, shape: 'circle' },
  defaultColor: '#ff6b35',
  defaultSize: '6',
}

/**
 * Distance from the upper window edge at which the heading of the section
 * comes to rest. Fixed, because CROP is measured against it.
 */
const HEADING_OFFSET = 120

/**
 * Crop in CSS pixels of the window.
 *
 * The first two rows of tiles below the heading: the tile of TILE (x 429 to
 * 824, y 455 to 754) together with its neighbours, so that the change is
 * visible against tiles that stay as they are. The third column starts at
 * x 1249 and stays outside.
 */
const CROP = { x: 400, y: 160, width: 840, height: 610 }

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

// ---------------------------------------------------------------------------
// Building blocks of the recording
// ---------------------------------------------------------------------------

/**
 * Opens the settings with the changed tile and scrolls to the node type
 * styles.
 *
 * Everything up to and including the scrolled page is cut away by
 * postProcessVideo() later - the video starts at the moment section 17.5
 * describes, not at the page load.
 */
async function openNodeTypeStyles(page: Page) {
  await page.addInitScript((tile) => {
    // Only this one type: the page fills every other one with its default in
    // an effect of its own.
    localStorage.setItem('nodeTypeStyles', JSON.stringify({ [tile.nodeType]: tile.changed }))
  }, TILE)

  await page.goto('/settings')
  await expect(page.locator('h2', { hasText: /^Netzknotentyp-Stile$/ })).toBeVisible()
  await page.waitForLoadState('networkidle')

  const section = page
    .locator('h2', { hasText: /^Netzknotentyp-Stile$/ })
    .locator('xpath=../..')
  const box = (await section.boundingBox())!
  await page
    .locator('main')
    .first()
    .evaluate((main, delta) => main.scrollBy(0, delta), box.y - HEADING_OFFSET)
  await page.waitForTimeout(600)

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
// 17.5 Reset a single tile
// ---------------------------------------------------------------------------

test('17.5 Kachel einzeln zurücksetzen', async ({ page, context }) => {
  test.setTimeout(120_000)

  // Warm-up page. It fills the HTTP cache of the context, so that the actual
  // recording page is up within a fraction of a second - Playwright records a
  // page from its creation, and a long page load would end up in the video.
  await page.goto('/settings')
  await expect(page.locator('h2', { hasText: /^Benutzer$/ })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.close()

  const capture = await context.newPage()
  const pageStart = Date.now()

  await openNodeTypeStyles(capture)

  const tile = capture
    .locator('h3', { hasText: new RegExp(`^${TILE.nodeType}$`) })
    .locator('xpath=ancestor::div[contains(@class,"card")][1]')
  await expect(tile).toContainText(TILE.changed.color)

  // Seeds the starting point of the cursor motion, below the tile, so that the
  // first step does not begin with a jump - and outside it, so that the button
  // is not revealed before the demonstration starts.
  await pointAt(capture, { x: 620, y: 900 }, { duration: 400 })

  // From here the demonstration runs; everything before it is cut away.
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. Onto the tile - only now does "Zurücksetzen" appear in its top right.
  await pointAt(capture, tile, { duration: 900 })
  await capture.waitForTimeout(1000)

  // 2. Click it. Colour, size and shape jump back to the default.
  const reset = tile.getByRole('button', { name: 'Zurücksetzen' })
  await click(capture, reset, { duration: 700 })
  await expect(tile).toContainText(TILE.defaultColor)
  await capture.waitForTimeout(1400)

  // 3. Off the tile again - the button disappears with the cursor. That is the
  //    point of the recording, so it belongs in the picture.
  await pointAt(capture, { x: 620, y: 900 }, { duration: 800 })
  await capture.waitForTimeout(1500)

  await saveVideo(capture, 'settings_style_reset', pageStart, demoStart)
})
