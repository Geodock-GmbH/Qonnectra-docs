import { expect, test, type Locator, type Page } from '@playwright/test'

import { CHART_BLUE, countDarkPixels, measureBars } from '../playwright/dashboard-charts'
import {
  click,
  pointAt,
  postProcessVideo,
  showCursor,
  videoPath,
} from '../playwright/manual-videos'

// Videos for chapter "4. Dashboard" in the manual
// (manual/teil-a-anwenderhandbuch/04-dashboard.md):
//
//   dashboard_tabs         section 4.2, switching through the tabs
//   dashboard_chart_hover  section 4.2.2, tooltips in the chart
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in tests/04-dashboard.spec.ts.
//
// Publish to public/videos/ with: pnpm screenshots:publish 04-dashboard --videos
const CHAPTER = '04-dashboard'

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Larger than the viewport gains nothing: Chromium's screencast delivers
// CSS pixels, the deviceScaleFactor of 2 has no effect here (see
// PostProcessOptions.scale in playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

/**
 * The six tabs of the dashboard with the heading of their first card. By it the
 * capture recognises that the content has changed - all tabs share the same
 * content area (Tabs.svelte).
 */
const TABS = [
  { name: 'Übersicht', firstCard: 'Trassenstatistik' },
  { name: 'Trasse', firstCard: 'Gesamtlänge pro Oberfläche' },
  { name: 'Rohre', firstCard: 'Top 5 längste Rohre' },
  { name: 'Netzknoten', firstCard: 'Netzknoten nach Ort' },
  { name: 'Adressen', firstCard: 'Adressen nach Ort' },
  { name: 'Gebiete', firstCard: 'Gebiete nach Typ' },
]

/**
 * Width of the crop for the tab video in CSS pixels.
 *
 * Around 1000 px is the target from CLAUDE.md: the manual renders videos at the
 * width of the text column (around 690 px), and at the full interface of
 * 1792 px labels in the app would be less than 7 px high.
 *
 * That means **not** all six tabs fit into the picture: the bar is 1478 px wide
 * and each tab takes around 240 px. The video therefore shows the way across the
 * first four tabs and back again; the two on the right work exactly the same,
 * and a cursor running out of frame while the content seemingly changes by
 * itself would be harder to follow than a shorter route.
 */
const TAB_CROP_WIDTH = 1000

/** Height of the tab crop: the bar and the upper part of the content. */
const TAB_CROP_HEIGHT = 700

/**
 * Width of the crop for the chart video. A chart card is 564 px wide; 720 px
 * leave it some air and stay above the render width of the manual (690 px), so
 * that the video does not have to be scaled up there.
 */
const CHART_CROP_WIDTH = 720

/**
 * Opens the dashboard of the test project.
 *
 * Deliberately without disableAnimations() and moveCursorAway(): transitions and
 * cursor belong in the video, they are what explains why something changes.
 */
async function openDashboard(page: Page) {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/dashboard\/2(\/|$)/)
  await expect(page.getByRole('heading', { name: 'Trassenstatistik' })).toBeVisible()
  await page.waitForLoadState('networkidle')
}

/**
 * Waits until Chart.js has finished drawing.
 *
 * By default Chart.js grows the bars in over 1000 ms; that is a clearly bounded
 * animation and explicitly wanted in the video. The wait only exists because the
 * bar positions are measured afterwards.
 */
async function chartsBuilt(page: Page) {
  await expect(page.locator('.tab-content canvas').first()).toBeVisible()
  await page.waitForTimeout(1600)
}

/** Card of a chart, addressed through its heading. */
function card(page: Page, title: string): Locator {
  return page.getByRole('heading', { name: title, exact: true }).locator('xpath=../..')
}

// ---------------------------------------------------------------------------
// Video for section 4.2 "Reiter im Dashboard"
// ---------------------------------------------------------------------------

test('4.2 Wechsel durch die Reiter', async ({ page, context }) => {
  test.setTimeout(180_000)

  // 1. Warm-up page. It fills the HTTP cache of the context and measures the tab
  //    bar. The actual recording page is therefore up within a fraction of a
  //    second - Playwright records a page from its creation, and a long page
  //    load would end up in the video.
  await openDashboard(page)
  const bar = (await page.locator("[data-part='list']").boundingBox())!
  const tabBoxes: Record<string, { x: number; width: number }> = {}
  for (const { name } of TABS) {
    const box = (await page.getByRole('tab', { name, exact: true }).boundingBox())!
    tabBoxes[name] = { x: box.x, width: box.width }
  }
  await page.close()

  // 2. Derive the crop from the position of the bar instead of hard-coding it.
  const crop = {
    x: Math.max(0, Math.round(bar.x - 8)),
    y: Math.max(0, Math.round(bar.y - 12)),
    width: TAB_CROP_WIDTH,
    height: TAB_CROP_HEIGHT,
  }

  // Only show the tabs that lie completely inside the crop.
  const inFrame = TABS.filter(({ name }) => {
    const box = tabBoxes[name]
    return box.x >= crop.x && box.x + box.width <= crop.x + crop.width
  })
  expect(
    inFrame.length,
    `Only ${inFrame.length} tabs lie within the ${TAB_CROP_WIDTH} px of the ` +
      'crop. The video no longer shows a switch that way - check the width of ' +
      'the tabs in Tabs.svelte.',
  ).toBeGreaterThanOrEqual(4)

  const capture = await context.newPage()
  const pageStart = Date.now()
  await openDashboard(capture)
  await showCursor(capture)

  // From here the demonstration runs; everything before it is cut away by
  // postProcessVideo().
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 3. Click the tabs one after another. The first one is already active on
  //    load and is therefore skipped.
  for (const { name, firstCard } of inFrame.slice(1)) {
    await click(capture, capture.getByRole('tab', { name, exact: true }))
    await expect(capture.getByRole('heading', { name: firstCard, exact: true })).toBeVisible()
    // Stay long enough for the new content to be read; the charts grow in
    // during that time.
    await capture.waitForTimeout(2200)
  }

  // 4. Back to "Übersicht": the video ends where it started.
  const back = inFrame[0]
  await click(capture, capture.getByRole('tab', { name: back.name, exact: true }))
  await expect(
    capture.getByRole('heading', { name: back.firstCard, exact: true }),
  ).toBeVisible()
  await capture.waitForTimeout(1800)

  const video = capture.video()
  expect(video, 'Playwright recorded no video - check test.use({ video }).').toBeTruthy()
  await capture.close()

  const raw = test.info().outputPath('dashboard_tabs-raw.webm')
  await video!.saveAs(raw)

  postProcessVideo({
    source: raw,
    target: videoPath(CHAPTER, 'dashboard_tabs'),
    crop,
    startAt: Math.max(0, (demoStart - pageStart) / 1000 - LEAD_IN),
  })
})

// ---------------------------------------------------------------------------
// Video for section 4.2.2 "Trasse"
// ---------------------------------------------------------------------------
//
// Shows what the section describes: cursor on a bar, tooltip with value and
// unit; and that for several bars in a row.

test('4.2.2 Kurzhinweise im Diagramm', async ({ page, context }) => {
  test.setTimeout(180_000)

  // 1. Warm-up page, see above.
  await openDashboard(page)
  await page.close()

  const capture = await context.newPage()
  const pageStart = Date.now()
  await openDashboard(capture)

  // 2. Switch the tab before the demonstration begins: the subject is hovering
  //    in the chart, not the tab switch (that is what dashboard_tabs shows). The
  //    switch is therefore done without a cursor and cut away.
  await capture.getByRole('tab', { name: 'Trasse', exact: true }).click()
  const chart = card(capture, 'Gesamtlänge pro Oberfläche')
  await expect(chart).toBeVisible()
  await chartsBuilt(capture)

  const canvas = chart.locator('canvas')
  const bars = await measureBars(canvas, CHART_BLUE)
  expect(
    bars.length,
    'No bars in #0ea5e9 were found in the chart "Gesamtlänge pro Oberfläche" - ' +
      'is the colour in TrenchStatistics.svelte still the same?',
  ).toBeGreaterThanOrEqual(3)

  const withoutTooltip = await countDarkPixels(canvas)

  await showCursor(capture)
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 3. Approach bar by bar, from top to bottom. After every stop it is checked
  //    that the tooltip really appears - it is part of the canvas and would
  //    otherwise silently be missing from the recording.
  for (const [index, target] of bars.entries()) {
    await pointAt(capture, target, { duration: index === 0 ? 700 : 500 })
    await capture.waitForTimeout(900)
    expect(
      await countDarkPixels(canvas),
      `No tooltip appears above bar ${index + 1}. Chart.js only shows it while ` +
        'the cursor rests on the bar.',
    ).toBeGreaterThan(withoutTooltip * 2)
    await capture.waitForTimeout(500)
  }

  // 4. Move the cursor away from the bars: the tooltip disappears and the video
  //    ends with the unchanged chart.
  const box = (await chart.boundingBox())!
  await pointAt(capture, { x: box.x + box.width - 40, y: box.y + 40 }, { duration: 700 })
  await capture.waitForTimeout(1200)

  const video = capture.video()
  expect(video, 'Playwright recorded no video - check test.use({ video }).').toBeTruthy()

  // 5. Derive the crop from the position of the chart card.
  const crop = {
    x: Math.max(0, Math.round(box.x - (CHART_CROP_WIDTH - box.width) / 2)),
    y: Math.max(0, Math.round(box.y - 24)),
    width: CHART_CROP_WIDTH,
    height: Math.round(box.height + 48),
  }
  await capture.close()

  const raw = test.info().outputPath('dashboard_chart_hover-raw.webm')
  await video!.saveAs(raw)

  postProcessVideo({
    source: raw,
    target: videoPath(CHAPTER, 'dashboard_chart_hover'),
    crop,
    startAt: Math.max(0, (demoStart - pageStart) / 1000 - LEAD_IN),
  })
})
