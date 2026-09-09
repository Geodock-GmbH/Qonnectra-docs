import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  disableAnimations,
  moveCursorAway,
  shotPath,
  spotlight,
} from '../playwright/manual-shots'

// Screenshots for chapter "6. Störungsanalyse" in the manual
// (manual/teil-a-anwenderhandbuch/06-stoerungsanalyse.md). Produces all images
// of the chapter; the video sits in tests/06-stoerungsanalyse-video.spec.ts.
//
// The simulation is read-only - the backend only reads (`simulate_fault` in
// apps/api/services.py). No spec here has to clean up after itself.
//
// Publish to public/images/ with: pnpm screenshots:publish 06-stoerungsanalyse
const CHAPTER = '06-stoerungsanalyse'

/**
 * Map extents in EPSG:3857. The map has no auto-fit and reads centre and zoom
 * from localStorage, see playwright/auth.setup.ts.
 */
const VIEW = {
  /** Entire network of the test project, as in tests/05-karte.spec.ts. */
  overview: { center: [1083532, 7308590], zoom: 16.5 },

  /**
   * Centred on the middle of TR-BNCKM6A. That trench is 151 m long and at zoom
   * 17.4 therefore around 165 px in the picture - a click on the centre of the
   * map hits it and not one of its neighbours.
   *
   * It is also the most productive damage point of the demo data: one conduit
   * (St-V02-01) with eleven cables hangs off it, so the two lists of the report
   * are not empty.
   */
  damage: { center: [1083448, 7308494], zoom: 17.4 },
}

/** The trench a click on the centre of VIEW.damage has to hit. */
const TRENCH = 'TR-BNCKM6A'

/**
 * Opens the fault simulation in the requested view and waits until the map is
 * fully drawn.
 *
 * The view is set through `addInitScript`, i.e. before every load of the
 * document - the app writes `mapCenter`/`mapZoom` back on every `moveend`, and
 * the route "load, set localStorage, reload" loses the seed to that write-back.
 */
async function openFaultSimulation(page: Page, view = VIEW.overview) {
  await page.addInitScript((v) => {
    localStorage.setItem('mapCenter', JSON.stringify(v.center))
    localStorage.setItem('mapZoom', JSON.stringify(v.zoom))
  }, view)

  await page.goto('/fault-simulation')
  await expect(page).toHaveURL(/\/fault-simulation\/2(\/|$)/)

  // With a running tileserver (vector tiles) OpenLayers creates a second
  // canvas, without it (OSM raster fallback) only one - hence .first().
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForTimeout(2500)

  await disableAnimations(page)
  await moveCursorAway(page)
}

/** Centre of the map area in CSS pixels of the viewport. */
async function mapCentre(page: Page): Promise<{ x: number; y: number }> {
  const box = (await page.locator('div.map').boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

/**
 * Sets the damage point on TR-BNCKM6A and returns the point it landed on.
 *
 * The app snaps the click to the closest point of the trench line, so the
 * returned position is the click position only to within a few pixels - close
 * enough for the spotlight ellipse, which is far larger than that.
 */
async function setDamagePoint(page: Page): Promise<{ x: number; y: number }> {
  const centre = await mapCentre(page)
  await page.mouse.click(centre.x, centre.y)

  await expect(
    page.locator('.fault-popup').getByText(TRENCH, { exact: true }),
    `The click on the centre of the map did not hit ${TRENCH}. Several trenches ` +
      'run through the test project - has the demo data or VIEW.damage changed?',
  ).toBeVisible({ timeout: 20_000 })

  await moveCursorAway(page)
  return centre
}

/** Runs the simulation and waits for the report below the map. */
async function runSimulation(page: Page) {
  await page.getByRole('button', { name: 'Simulation starten' }).click()

  // Tracing every fiber of eleven cables takes a few seconds on a cold stack.
  await expect(page.getByRole('button', { name: /^Betroffene Kabel \(\d+\)$/ })).toBeVisible({
    timeout: 60_000,
  })
  await expect(page.getByText(`Trasse:`)).toBeVisible()

  // The affected trenches, nodes and addresses arrive as GeoJSON and are drawn
  // into layers of their own; networkidle does not cover that repaint.
  await page.waitForTimeout(1500)
  await moveCursorAway(page)
}

/** Collapsible heading of a result list, e.g. "Betroffene Kabel (11)". */
function resultList(page: Page, label: string): Locator {
  return page.getByRole('button', { name: new RegExp(`^${label} \\(\\d+\\)$`) })
}

/**
 * 16 : 10 crop inside the map half, holding the damage point and the affected
 * trenches around it.
 *
 * The image sits next to the full shot in an `.img-row`, and that renders its
 * images in a 16-to-10 frame (`.vitepress/theme/custom.css`). The damage point
 * is deliberately placed left of centre: the affected trenches run to the
 * north-east from it, so a crop centred on the point would leave that half of
 * the network outside.
 *
 * The right edge stops in front of the legend. It is anchored to the right edge
 * of the map, and a crop reaching that far would show a torn-off piece of the
 * panel - in a detail whose subject is the map itself.
 */
async function mapHalfCrop(page: Page, point: { x: number; y: number }) {
  const box = (await page.locator('.map-wrapper').boundingBox())!
  const legend = (await page
    .getByRole('button', { name: /^Layer-Liste (ein|aus)klappen$/ })
    .locator('xpath=../..')
    .boundingBox())!

  const height = box.height
  const width = Math.min(height * 1.6, box.width)
  const x = Math.max(
    box.x,
    Math.min(point.x - width * 0.37, legend.x - 12 - width, box.x + box.width - width),
  )

  return { x, y: box.y, width, height }
}

test('6. Übersicht der Störungsanalyse', async ({ page }) => {
  await openFaultSimulation(page)
  await page.screenshot({ path: shotPath(CHAPTER, 'fault') })
})

test('6.1 Schadenspunkt in der Karte setzen', async ({ page }) => {
  await openFaultSimulation(page, VIEW.damage)
  const point = await setDamagePoint(page)

  // One cut-out for both, generously padded: the window sits 16 px above the
  // damage point, and two separate cut-outs would touch and fuse into a lumpy
  // outline. The point itself is drawn into the canvas and has no element - the
  // padding is what brings it inside.
  const spotlightOff = await spotlight(page, page.locator('.fault-popup'), {
    padding: 44,
    radius: 16,
  })
  await page.screenshot({ path: shotPath(CHAPTER, 'fault_damage_point') })
  await spotlightOff()
})

test('6.2 Betroffene Leerrohre, Kabel und Fasern', async ({ page }) => {
  await openFaultSimulation(page, VIEW.damage)
  const damagePoint = await setDamagePoint(page)
  await runSimulation(page)

  // Both lists open: the chapter describes their content, and closed they are
  // two lines of heading.
  for (const label of ['Betroffene Leerrohre', 'Betroffene Kabel']) {
    await resultList(page, label).click()
  }
  await expect(page.getByText('St-V02-01', { exact: true })).toBeVisible()
  await moveCursorAway(page)

  await page.screenshot({ path: shotPath(CHAPTER, 'fault_result') })

  // Detail of the map half: damage point, the trenches of the affected cables
  // and the nodes hanging off them.
  //
  // Not crop16by10(): that pads around the target and would take the white gap
  // above and below the map into the picture. Here the full height of the map
  // half is used and the width follows from it, so the crop lies entirely
  // inside the map.
  await page.screenshot({
    path: shotPath(CHAPTER, 'fault_result_detail'),
    clip: await mapHalfCrop(page, damagePoint),
  })
})

test('6.3 Betroffene Adressen und Wohneinheiten', async ({ page }) => {
  await openFaultSimulation(page, VIEW.damage)
  await setDamagePoint(page)
  await runSimulation(page)

  // Both lists stay collapsed - that is their default state, and it is what
  // lifts the address table into the visible part of the report. Expanded, the
  // eleven cable cards push it below the lower edge.
  const table = page.getByRole('table')
  await expect(
    table,
    'The report shows no address table. Since the demo data holds fiber ' +
      'splices, TR-BNCKM6A has to reach addresses - has the export been ' +
      'pulled again without them? See section 6.3 of the chapter.',
  ).toBeVisible()

  // The heading belongs in the cut-out: it carries the number of affected
  // addresses, and the section names it.
  const spotlightOff = await spotlight(page, [
    page.getByRole('heading', { name: /^Betroffene Adressen \(\d+\)$/ }),
    table,
  ])
  await page.screenshot({ path: shotPath(CHAPTER, 'fault_addresses') })
  await spotlightOff()
})

test('6.4 Ergebnis als CSV exportieren', async ({ page }) => {
  await openFaultSimulation(page, VIEW.damage)
  await setDamagePoint(page)
  await runSimulation(page)

  const spotlightOff = await spotlight(page, [
    page.getByRole('button', { name: 'CSV exportieren' }),
    page.getByRole('button', { name: 'Zurücksetzen' }),
  ])
  await page.screenshot({ path: shotPath(CHAPTER, 'fault_export') })
  await spotlightOff()
})
