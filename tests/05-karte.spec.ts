import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  composite2x2,
  disableAnimations,
  moveCursorAway,
  shotPath,
  spotlight,
  type SpotlightEllipse,
} from '../playwright/manual-shots'

// Screenshots for chapter "5. Karte" in the manual
// (manual/teil-a-anwenderhandbuch/05-karte.md). Produces all images of the
// chapter; the hand-drawn annotation (pattern 3) in map_address_detail_select
// stays post-processing.
//
// Publish to public/images/ with: pnpm screenshots:publish 05-karte
const CHAPTER = '05-karte'

/**
 * Map extents in EPSG:3857. The map has no auto-fit and reads centre and zoom
 * from localStorage, see playwright/auth.setup.ts.
 */
const VIEW = {
  /** Entire network of the test project. */
  overview: { center: [1083532, 7308590], zoom: 16.5 },
  /**
   * Point on a trench, far enough away from nodes and address points that a
   * click on the map centre hits a trench and not a point.
   */
  trench: { center: [1083259.8664021306, 7308174.151234357], zoom: 17 },

  /**
   * Deliberately far away from the project area. Section 5.1 describes the case
   * "project switched, map still somewhere else" - from a view already sitting
   * on the network, "Auf Ausdehnung zoomen" would barely change the picture and
   * the image pair would show nothing.
   */
  far: { center: [1078000, 7304000], zoom: 13 },

  /**
   * Closer to the network so that labels are drawn at all: address and node
   * labels only appear below resolution 1.0 (`styles.ts`), i.e. from about zoom
   * 17.3. At the overview (zoom 16.5) the tile "Beschriftungen anzeigen" in the
   * composite would have no visible effect.
   */
  near: { center: [1083532, 7308590], zoom: 17.5 },
}

/**
 * Recognises a trench by its name in the info box. Several trenches converge
 * below the map centre of VIEW.trench (observed: TR-6AQ6RR6 and TR-HUH5A6X);
 * which one the query hits changes from run to run. For the image these are
 * equivalent, which is why the check is for "any trench" and not for a fixed
 * name.
 */
const TRENCH_PATTERN = /^TR-[A-Z0-9]+$/

/** Yields 46 results and therefore the filter field (appears from 10 results). */
const SEARCH_TERM_MANY = 'Nieharde'

/**
 * Opens the map of the test project in the requested view and waits until it is
 * fully drawn.
 *
 * The view is set through `addInitScript`, i.e. before every load of the
 * document. The obvious route - load, set `localStorage`, reload - has a race
 * condition: the app writes `mapCenter`/`mapZoom` back on every `moveend`. If
 * that write-back lands between setting and reloading, the seed is gone again
 * and the map starts at the overview instead of the requested spot. In tests
 * that click on a particular spot, the click then hits nothing.
 */
async function openMap(page: Page, view = VIEW.overview) {
  await page.addInitScript((v) => {
    localStorage.setItem('mapCenter', JSON.stringify(v.center))
    localStorage.setItem('mapZoom', JSON.stringify(v.zoom))
  }, view)

  await page.goto('/map')
  await expect(page).toHaveURL(/\/map\/2(\/|$)/)

  // With a running tileserver (vector tiles) OpenLayers creates a second
  // canvas, without it (OSM raster fallback) only one - hence .first().
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForTimeout(2500)

  await disableAnimations(page)
  await moveCursorAway(page)
}

/** Legend panel "Layer" in the top right. */
function legend(page: Page): Locator {
  return page
    .getByRole('button', { name: /^Layer-Liste (ein|aus)klappen$/ })
    .locator('xpath=../..')
}

/** Row of a layer in the legend, e.g. "Adresse". */
function legendRow(page: Page, name: string): Locator {
  return legend(page).getByText(name, { exact: true }).locator('xpath=..')
}

/**
 * Measures the selected map object in the painted picture and returns the
 * ellipse enclosing it - as a target for `spotlight()`.
 *
 * Trenches, addresses and nodes are drawn into the canvas by the map; there is
 * no element a locator could point at. That is why the selection colour of the
 * app is searched for (`DEFAULT_SELECTED_COLOR` = `#fff700` in
 * `local-app/frontend/src/lib/map/defaultColors.ts`); nothing else on the map is
 * that yellow.
 *
 * Measured instead of hard-coded, because several trenches converge below the
 * map centre and a different one is hit from run to run (see TRENCH_PATTERN).
 * Position, length and inclination of the line change along with it.
 *
 * The ellipse is aligned to the main axis of the found points (covariance, as in
 * a principal component analysis). Without rotation, a trench lying at an angle
 * would need an ellipse that mostly exposes empty map.
 */
async function selectedMapFeature(page: Page): Promise<SpotlightEllipse> {
  /** Gap between object and white outline, in CSS pixels. */
  const MARGIN = 18
  /**
   * A trench line is only a few pixels wide. Without a minimum size across the
   * axis the ellipse would collapse into a stroke.
   */
  const MIN_ACROSS = 34

  const measure = await page.evaluate(() => {
    const points: number[][] = []

    for (const canvas of Array.from(document.querySelectorAll('div.map canvas'))) {
      const surface = canvas as HTMLCanvasElement
      let data
      try {
        const ctx = surface.getContext('2d')
        if (!ctx) continue
        data = ctx.getImageData(0, 0, surface.width, surface.height).data
      } catch {
        // A canvas holding raster tiles of foreign origin is locked for
        // getImageData. The objects of the map live in a different one anyway.
        continue
      }

      // The canvas holds device pixels (deviceScaleFactor 2), the ellipse needs
      // CSS pixels of the viewport.
      const rect = surface.getBoundingClientRect()
      const scaleX = rect.width / surface.width
      const scaleY = rect.height / surface.height

      for (let py = 0; py < surface.height; py += 1) {
        const row = py * surface.width * 4
        for (let px = 0; px < surface.width; px += 1) {
          const i = row + px * 4
          // Tolerance against anti-aliasing, but tight enough that the orange
          // address points and the yellowish streets of the base map stay out.
          if (data[i + 3] <= 200) continue
          if (data[i] <= 225 || data[i + 1] <= 215 || data[i + 2] >= 110) continue
          points.push([rect.left + (px + 0.5) * scaleX, rect.top + (py + 0.5) * scaleY])
        }
      }
    }

    const count = points.length
    if (count === 0) return { count, x: 0, y: 0, along: 0, across: 0, rotation: 0 }

    let mx = 0
    let my = 0
    for (const [x, y] of points) {
      mx += x
      my += y
    }
    mx /= count
    my /= count

    let sxx = 0
    let syy = 0
    let sxy = 0
    for (const [x, y] of points) {
      const dx = x - mx
      const dy = y - my
      sxx += dx * dx
      syy += dy * dy
      sxy += dx * dy
    }

    // Direction of the main axis of the point cloud.
    const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    let along = 0
    let across = 0
    for (const [x, y] of points) {
      const dx = x - mx
      const dy = y - my
      along = Math.max(along, Math.abs(dx * cos + dy * sin))
      across = Math.max(across, Math.abs(dy * cos - dx * sin))
    }

    return { count, x: mx, y: my, along, across, rotation: (angle * 180) / Math.PI }
  })

  expect(
    measure.count,
    'No object in the selection colour #fff700 is drawn on the map - is the ' +
      'selection really set, and does the colour still match ' +
      "the app's DEFAULT_SELECTED_COLOR?",
  ).toBeGreaterThan(50)

  return {
    x: measure.x,
    y: measure.y,
    rx: measure.along + MARGIN,
    ry: Math.max(measure.across + MARGIN, MIN_ACROSS),
    rotation: measure.rotation,
  }
}

/**
 * Types a search term the way users do: click the field, select the existing
 * content, type character by character.
 *
 * Deliberately not `fill()`. With that, on a **second** search the result list
 * stays open after clicking a result even though the app closes it - measured:
 * with `fill()` the list is still visible after 4 s, with real typing it is gone
 * after about 600 ms. The image would otherwise show a state that does not exist
 * in the app.
 */
async function typeSearchTerm(page: Page, field: Locator, term: string) {
  await field.click()
  await page.keyboard.press('ControlOrMeta+a')
  await field.pressSequentially(term, { delay: 30 })
}

/** Screenshot of the map area, for the tiles of the composite grids. */
function mapShot(page: Page): Promise<Buffer> {
  return page.locator('.map-wrapper').screenshot()
}

test('5. Übersicht der Karte', async ({ page }) => {
  await openMap(page)
  await page.screenshot({ path: shotPath(CHAPTER, 'map') })
})

test('5.1 Legendeneintrag „Adresse" und Zoom auf den Layer', async ({ page }) => {
  await openMap(page, VIEW.far)

  // Full shot with the row "Adresse" highlighted.
  const spotlightOff = await spotlight(page, legendRow(page, 'Adresse'))
  await page.screenshot({ path: shotPath(CHAPTER, 'map_address_detail') })
  await spotlightOff()

  // After zooming to the extent of the layer.
  await legendRow(page, 'Adresse')
    .getByRole('button', { name: 'Auf Ausdehnung zoomen' })
    .click()
  await moveCursorAway(page)
  // view.fit runs for 800 ms, after which tiles load in.
  await page.waitForTimeout(3000)
  await page.screenshot({ path: shotPath(CHAPTER, 'map_address_detail_select') })
})

test('5.2 Transparenz-Regler', async ({ page }) => {
  await openMap(page)

  const slider = page.getByLabel('Ändert die Transparenz der OpenStreetMap-Hintergrundkarte.')
  const spotlightOff = await spotlight(page, slider)
  await page.screenshot({ path: shotPath(CHAPTER, 'map_opacity') })
  await spotlightOff()
})

test('5.2 Legende', async ({ page }) => {
  await openMap(page)

  const spotlightOff = await spotlight(page, legend(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'map_legend') })
  await spotlightOff()
})

test('5.2 Aktionen in der Legende (Composite)', async ({ page }) => {
  await openMap(page, VIEW.near)

  // 1. Initial state.
  const tile1 = await mapShot(page)

  // 2. Layer "Netzknoten" hidden.
  await legendRow(page, 'Netzknoten')
    .getByRole('button', { name: 'Layer ausblenden' })
    .click()
  await moveCursorAway(page)
  await page.waitForTimeout(800)
  const tile2 = await mapShot(page)

  await legendRow(page, 'Netzknoten')
    .getByRole('button', { name: 'Layer anzeigen' })
    .click()
  await moveCursorAway(page)

  // 3. Labels of the layer "Adresse" switched on.
  await legendRow(page, 'Adresse')
    .getByRole('button', { name: 'Beschriftungen anzeigen' })
    .click()
  await moveCursorAway(page)
  await page.waitForTimeout(1200)
  const tile3 = await mapShot(page)

  await legendRow(page, 'Adresse')
    .getByRole('button', { name: 'Beschriftungen ausblenden' })
    .click()
  await moveCursorAway(page)

  // 4. Layer group "Netzknoten" expanded.
  await legendRow(page, 'Netzknoten').getByRole('button', { name: 'Ausklappen' }).click()
  await moveCursorAway(page)
  await page.waitForTimeout(800)
  const tile4 = await mapShot(page)

  // The original in the manual shows the four states without digits.
  await composite2x2(page, [tile1, tile2, tile3, tile4], shotPath(CHAPTER, 'map_legend_actions'), {
    labels: [null, null, null, null],
  })
})

test('5.3 Ausgewähltes Objekt mit Info-Box', async ({ page }) => {
  // The click may be retried several times, see below.
  test.setTimeout(90_000)
  await openMap(page, VIEW.trench)

  // Two objects lie on top of each other at the click point: the trench and the
  // project area "Cluster 01", whose surface covers the entire network. A trench
  // line is only a few pixels wide; even a minimal shift of the map rendering
  // decides whether the map centre sits on the line or next to it - and then the
  // area is selected instead of the trench. Observed: the same spot yields
  // TR-6AQ6RR6, TR-HUH5A6X or "Cluster 01" depending on the run. Clicking
  // repeatedly does not help, because the cause is not tile loading.
  //
  // That is why the layer "Gebiet" is hidden for this image. The selection then
  // reliably hits a trench, and the image still shows exactly what section 5.3
  // describes: a selected object with an info box. Switching the layer back on
  // is not possible, because the opened info box covers the legend.
  await legendRow(page, 'Gebiet').getByRole('button', { name: 'Layer ausblenden' }).click()
  await moveCursorAway(page)
  await page.waitForTimeout(1000)

  // Only a click on the map opens the info box; the search does not open it.
  //
  // With the area hidden there is nothing left below the trench line that would
  // catch a near miss: if the click misses the few pixels wide line, nothing at
  // all is selected and there is no info box. That is why the map centre and a
  // small cross around it are tried until a trench appears in the info box.
  const map = page.locator('div.map')
  const box = (await map.boundingBox())!
  const title = page.locator('#drawer-title')

  const offsets = [
    [0, 0],
    [0, -4],
    [0, 4],
    [-4, 0],
    [4, 0],
    [0, -8],
    [0, 8],
  ]

  let hit = false
  for (const [dx, dy] of offsets) {
    await map.click({ position: { x: box.width / 2 + dx, y: box.height / 2 + dy } })
    if (await title.isVisible()) {
      hit = true
      break
    }
  }
  expect(
    hit,
    'No object was hit at the map centre - is the view (VIEW.trench) still on ' +
      'a trench? Without a hit the info box does not open and there is no ' +
      '#drawer-title.',
  ).toBe(true)
  await expect(title).toHaveText(TRENCH_PATTERN)

  await moveCursorAway(page)
  await page.waitForTimeout(500)

  // Both are exposed: the selected object on the map and the info box with its
  // values. Highlighting only the info box leaves open which object is selected
  // at all - the thin yellow trench line disappears in the dimmed map picture.
  const feature = await selectedMapFeature(page)
  const spotlightOff = await spotlight(page, [feature, page.locator('[data-drawer]')])
  await page.screenshot({ path: shotPath(CHAPTER, 'map_selected_object') })
  await spotlightOff()
})

test('5.4 Suchfeld', async ({ page }) => {
  await openMap(page)

  const spotlightOff = await spotlight(page, page.locator('.search-panel'))
  await page.screenshot({ path: shotPath(CHAPTER, 'map_search') })
  await spotlightOff()
})

test('5.4 Suchablauf (Composite)', async ({ page }) => {
  await openMap(page)

  const searchField = page.getByTestId('search-input')
  const results = page.locator('.results-container')

  // 1. Search term typed in, not searched yet.
  await typeSearchTerm(page, searchField, SEARCH_TERM_MANY)
  await moveCursorAway(page)
  const tile1 = await mapShot(page)

  // 2. Result list with count and filter field.
  await searchField.press('Enter')
  await expect(results).toBeVisible()
  await moveCursorAway(page)
  await page.waitForTimeout(500)
  const tile2 = await mapShot(page)

  // 3. Selection refined through the filter field.
  const filterField = results.locator('input.filter-input')
  await filterField.click()
  await filterField.pressSequentially('12', { delay: 30 })
  await moveCursorAway(page)
  await page.waitForTimeout(500)
  const tile3 = await mapShot(page)

  // 4. Object selected, map has jumped to the spot.
  //
  // Deliberately the same search as in steps 1 to 3: the four tiles should show
  // one coherent flow. What gets clicked is therefore the filtered result
  // "Nieharde 12" - the map jumps to the corresponding house. A second search
  // for a different term would be a break in the narrative and additionally left
  // the result list standing.
  const firstResult = results.locator('li.result-item').first()
  await expect(firstResult).toContainText('Nieharde 12')
  await firstResult.locator('button.result-button').click()
  await moveCursorAway(page)

  // The object should be highlighted in the picture. `zoomToFeature` animates
  // the view for 1000 ms and only starts the blinking in the callback: toggling
  // every 300 ms, visible in the windows 300-600, 900-1200 and 1500-1800 ms
  // after the end of the animation (searchUtils.ts). 1400 ms after the click is
  // therefore in the middle of the first visible window. After 1800 ms the
  // highlight is removed for good - waiting longer here yields a tile without a
  // recognisable object.
  await page.waitForTimeout(1400)
  const tile4 = await mapShot(page)

  // Cross-check after the capture: the app closes the result list as soon as a
  // result has been clicked. If it stays open, the tile shows a state that does
  // not exist in the app - that should be noticed and not silently end up in a
  // manual image.
  await expect(
    results,
    'The result list is still open after the click - tile 4 shows a state ' +
      'users never experience.',
  ).toBeHidden()

  await composite2x2(page, [tile1, tile2, tile3, tile4], shotPath(CHAPTER, 'map_search_flow'), {
    labels: ['1, 2', '3, 4', '5', '6'],
  })
})
