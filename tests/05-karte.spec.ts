import { expect, request, test, type APIRequestContext, type Locator, type Page } from '@playwright/test'

import { localApp, superuserCredentials } from '../playwright/local-app'
import {
  composite2x2,
  crop16by10,
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

test('3.3 Transparenz-Regler', async ({ page }) => {
  await openMap(page)

  const slider = page.getByLabel('Ändert die Transparenz der OpenStreetMap-Hintergrundkarte.')
  const spotlightOff = await spotlight(page, slider)
  await page.screenshot({ path: shotPath(CHAPTER, 'map_opacity') })
  await spotlightOff()
})

test('3.3 Legende', async ({ page }) => {
  await openMap(page)

  const spotlightOff = await spotlight(page, legend(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'map_legend') })
  await spotlightOff()
})

test('3.3 Aktionen in der Legende (Composite)', async ({ page }) => {
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

test('3.4 Suchfeld', async ({ page }) => {
  await openMap(page)

  const spotlightOff = await spotlight(page, page.locator('.search-panel'))
  await page.screenshot({ path: shotPath(CHAPTER, 'map_search') })
  await spotlightOff()
})

test('3.4 Suchablauf (Composite)', async ({ page }) => {
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

// ---------------------------------------------------------------------------
// Sections 5.5 and 5.6: the floating panels of a trench and a node
// ---------------------------------------------------------------------------
//
// Both are opened from the tab "Aktionen" of the info box and lie as their own
// window over the map. They are read-only from the map (`readonly={true}` in
// MapDrawerTabs.svelte); creating and changing happens in the network schema.

/**
 * Trench with three conduits - the trench profile of section 5.5 should show
 * more than a single circle. Centre in EPSG:3857 is the middle of its longest
 * segment, so that a click on the map centre hits the line.
 */
const TRENCH_PROFILE = {
  name: 'TR-W55WVN3',
  view: { center: [1083567.4, 7308614.4], zoom: 19 },
}

/**
 * Node with by far the most cables of the test project (24) - the cable list on
 * the right-hand edge of the structure panel is thereby not empty. Centre in
 * EPSG:3857 is the node itself.
 */
const NODE = {
  name: 'St-V02',
  view: { center: [1083576.9, 7308651.3], zoom: 19 },
}

/**
 * Slot configuration the images of section 5.6 are made with.
 *
 * The demo project brings **no** slot configurations, containers or structures
 * with it (checked against the API: all three endpoints are empty) - the panels
 * would only show "Keine Slot-Konfigurationen gefunden". The configuration is
 * therefore created through the API before the capture and removed again
 * afterwards, the same way tests/05-karte-video.spec.ts handles the attachment.
 *
 * Component types are looked up by name and not by id: they come from the
 * attribute tables of the instance, whose ids change with a re-import.
 */
const SLOT_CONFIGS = [
  { side: 'A', totalSlots: 24 },
  { side: 'B', totalSlots: 12 },
]
const SLOT_COMPONENTS = [
  { componentType: 'Spleisskassette', slotStart: 1, slotEnd: 1 },
  { componentType: 'Spleisskassette', slotStart: 2, slotEnd: 2 },
  { componentType: 'Spleisskassette', slotStart: 3, slotEnd: 3 },
  { componentType: 'Splitter 1:8', slotStart: 5, slotEnd: 6 },
  { componentType: '4HE (12xLC-APC)', slotStart: 9, slotEnd: 12 },
]

/**
 * API context of the Django superuser. Needed for the clean-up: the capture
 * account belongs to the group "Editor", which may create but not delete
 * (`RoleBasedPermission`, answers DELETE with 403).
 */
async function superuserApi() {
  const { apiUrl } = localApp()
  const { username, password } = superuserCredentials()

  const api = await request.newContext({ baseURL: apiUrl, ignoreHTTPSErrors: true })
  const login = await api.post('/api/v1/auth/login/', { data: { username, password } })
  expect(
    login.ok(),
    'Superuser login failed - check DJANGO_SUPERUSER_* in local-app/deployment/.env.',
  ).toBe(true)
  return api
}

/**
 * UUID of the node named NODE.name.
 *
 * Filtered by `?name=`, not read from the full list: the endpoint caps
 * `page_size` at 100 and the test project has 118 nodes. It answers paginated
 * **and** as GeoJSON - the features sit in `results.features`, the UUID in
 * `id` of the feature.
 */
async function nodeUuid(api: APIRequestContext): Promise<string> {
  const response = await api.get(`/api/v1/node/?name=${encodeURIComponent(NODE.name)}`)
  const body = await response.json()
  const features: Array<{ id: string; properties?: { name?: string } }> =
    body.results?.features ?? []

  const match = features.find((feature) => feature.properties?.name === NODE.name)
  expect(match, `The node "${NODE.name}" is missing in the test project.`).toBeTruthy()
  return match!.id
}

/** Removes all slot configurations of the node (and with them their structures). */
async function removeSlotConfigurations(api: APIRequestContext, uuid: string) {
  const response = await api.get('/api/v1/node-slot-configuration/?page_size=200')
  const body = await response.json()
  const rows = Array.isArray(body) ? body : (body.results ?? [])

  for (const row of rows) {
    if ((row.uuid_node?.id ?? row.uuid_node) !== uuid) continue
    await api.delete(`/api/v1/node-slot-configuration/${row.uuid}/`)
  }
}

/** Creates the configuration of SLOT_CONFIGS / SLOT_COMPONENTS at the node. */
async function createSlotConfiguration(api: APIRequestContext, uuid: string) {
  const typesResponse = await api.get('/api/v1/attributes_component_type/')
  const typesBody = await typesResponse.json()
  const types: Array<{ id: number; component_type: string }> = Array.isArray(typesBody)
    ? typesBody
    : (typesBody.results ?? [])

  const created: Record<string, string> = {}
  for (const config of SLOT_CONFIGS) {
    const response = await api.post('/api/v1/node-slot-configuration/', {
      data: { uuid_node_id: uuid, side: config.side, total_slots: config.totalSlots },
    })
    expect(response.ok(), `Slot configuration "${config.side}" could not be created.`).toBe(true)
    created[config.side] = (await response.json()).uuid
  }

  for (const component of SLOT_COMPONENTS) {
    const type = types.find((entry) => entry.component_type === component.componentType)
    expect(
      type,
      `The component type "${component.componentType}" is missing in the instance - has the ` +
        'attribute table changed?',
    ).toBeTruthy()

    const response = await api.post('/api/v1/node-structure/', {
      data: {
        uuid_node_id: uuid,
        slot_configuration_id: created[SLOT_CONFIGS[0].side],
        component_type_id: type!.id,
        slot_start: component.slotStart,
        slot_end: component.slotEnd,
      },
    })
    expect(response.ok(), `The component "${component.componentType}" could not be placed.`).toBe(
      true,
    )
  }
}

/**
 * Selects an object at the map centre and waits for its info box.
 *
 * The layer "Gebiet" is hidden beforehand: its surface covers the entire
 * network, and without that a near miss selects the area instead of the object
 * (see the test for section 5.3). A small cross around the centre is tried,
 * because a trench line is only a few pixels wide.
 */
async function selectAtCentre(page: Page, expected: string) {
  await legendRow(page, 'Gebiet').getByRole('button', { name: 'Layer ausblenden' }).click()
  await moveCursorAway(page)
  await page.waitForTimeout(1000)

  const map = page.locator('div.map')
  const box = (await map.boundingBox())!
  const title = page.locator('#drawer-title')

  for (const [dx, dy] of [
    [0, 0],
    [0, -4],
    [0, 4],
    [-4, 0],
    [4, 0],
    [0, -8],
    [0, 8],
  ]) {
    await map.click({ position: { x: box.width / 2 + dx, y: box.height / 2 + dy } })
    if ((await title.isVisible()) && (await title.textContent()) === expected) break
  }

  await expect(
    title,
    `"${expected}" was not hit at the map centre - does the view still sit on the object?`,
  ).toHaveText(expected)

  await moveCursorAway(page)
  await page.waitForTimeout(500)
}

/**
 * The floating window with the given title (FloatingPanel.svelte).
 *
 * Deliberately the part `content` and not an ancestor of the title: Zag puts
 * `data-scope="floating-panel"` on almost every part of the window, and the
 * nearest ancestor of the title is the 57 px high header - a crop to that
 * would show the title bar and nothing else.
 */
function floatingPanel(page: Page, title: string): Locator {
  return page
    .locator('[data-scope="floating-panel"][data-part="content"]')
    .filter({ hasText: title })
}

test('5.5 Grabenprofil einer Trasse', async ({ page }) => {
  test.setTimeout(90_000)
  await openMap(page, TRENCH_PROFILE.view)
  await selectAtCentre(page, TRENCH_PROFILE.name)

  const infobox = page.locator('[data-drawer]')
  await infobox.getByRole('tab', { name: 'Aktionen', exact: true }).click()
  await infobox.getByRole('button', { name: 'Grabenprofil anzeigen' }).click()

  const panel = floatingPanel(page, 'Grabenprofil')
  await expect(panel).toBeVisible()
  // The drawing is built from the conduits of the trench; without them the
  // window would only show "Keine Leerrohre in diesem Graben gefunden".
  await expect(panel.locator('.trench-profile-node')).toHaveCount(3)

  // Align the drawing to its content. The panel does that itself 300 ms after
  // mounting (TrenchProfileFitView.svelte) - but the conduits are loaded
  // asynchronously, and if they arrive later the automatic fit runs on an empty
  // drawing: the view then stays at the smallest zoom level and the window looks
  // empty (that is how the first take of this image came out). The button does
  // exactly what section 5.5 describes.
  await panel.getByRole('button', { name: 'Fit View' }).click()
  await moveCursorAway(page)
  await page.waitForTimeout(1500)

  // Cropped to the window: at 900 x 600 in a window of 1792 x 1120 the labels
  // would be barely readable in the 512 px rendering of the manual.
  await page.screenshot({
    path: shotPath(CHAPTER, 'map_trench_profile'),
    clip: await crop16by10(page, panel),
  })
})

test.describe('Netzknoten mit Slot-Konfiguration', () => {
  let api: APIRequestContext
  let uuid: string

  test.beforeAll(async () => {
    api = await superuserApi()
    uuid = await nodeUuid(api)
    // Also runs before creating: an aborted run would otherwise leave the
    // configuration behind and the next one would create it a second time.
    await removeSlotConfigurations(api, uuid)
    await createSlotConfiguration(api, uuid)
  })

  test.afterAll(async () => {
    await removeSlotConfigurations(api, uuid)
    await api.dispose()
  })

  test('5.6 Slot-Konfiguration eines Netzknotens', async ({ page }) => {
    test.setTimeout(90_000)
    await openMap(page, NODE.view)
    await selectAtCentre(page, NODE.name)

    const infobox = page.locator('[data-drawer]')
    await infobox.getByRole('tab', { name: 'Aktionen', exact: true }).click()
    await infobox.getByRole('button', { name: 'Slot-Konfiguration anzeigen' }).click()

    const panel = floatingPanel(page, 'Netzknoten-Konfiguration')
    await expect(panel).toBeVisible()
    await expect(panel.getByText('Gesamtslots: 24')).toBeVisible()
    await moveCursorAway(page)
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: shotPath(CHAPTER, 'map_node_slots'),
      clip: await crop16by10(page, panel),
    })
  })

  test('5.6 Struktur eines Netzknotens', async ({ page }) => {
    test.setTimeout(90_000)
    await openMap(page, NODE.view)
    await selectAtCentre(page, NODE.name)

    const infobox = page.locator('[data-drawer]')
    await infobox.getByRole('tab', { name: 'Aktionen', exact: true }).click()
    await infobox.getByRole('button', { name: 'Struktur anzeigen' }).click()

    const panel = floatingPanel(page, 'Netzknotenstruktur')
    await expect(panel).toBeVisible()
    // The grid only fills once a side has been chosen and its structures are in.
    await expect(panel.getByText('Spleisskassette').first()).toBeVisible()
    await moveCursorAway(page)
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: shotPath(CHAPTER, 'map_node_structure'),
      clip: await crop16by10(page, panel),
    })
  })
})

// ---------------------------------------------------------------------------
// Section 5.4: the tabs "Rohrübersicht" and "Kabelübersicht" of a trench
// ---------------------------------------------------------------------------

/**
 * Width the info box is opened at for the images of section 5.4, in CSS pixels.
 *
 * At its default of 400 px the microduct table ("#", "Farbe", "Adresse",
 * "Kabel", "Status") is squeezed into five unreadable columns. Widening it is
 * the step section 3.6 describes anyway; the value is seeded through
 * `localStorage`, so that the images show the widened state from the first
 * frame and no drag has to be faked.
 */
const TRENCH_TABS_DRAWER_WIDTH = 760

/**
 * Crop around the info box: a strip of map to its left, the rest to the right
 * edge, expanded to 16 : 10.
 *
 * A screenshot of the info box alone would be portrait and would end up as a
 * stripe in the middle of the 16-to-10 frame of the manual; the full window
 * would render the box at 42 % of the image width and make the tables
 * unreadable at 512 px.
 */
async function drawerClip(page: Page) {
  /** Strip of map to the left of the info box that stays in the picture. */
  const MAP_STRIP = 200

  const box = (await page.locator('[data-drawer]').boundingBox())!
  const x = Math.max(0, Math.round(box.x - MAP_STRIP))
  const width = (page.viewportSize()?.width ?? 1792) - x
  const height = Math.round(width / 1.6)

  return { x, y: Math.round(box.y), width, height }
}

/** Opens the trench of TRENCH_PROFILE with a widened info box. */
async function openTrenchTabs(page: Page) {
  await page.addInitScript((width) => {
    localStorage.setItem('drawerWidth', String(width))
  }, TRENCH_TABS_DRAWER_WIDTH)

  await openMap(page, TRENCH_PROFILE.view)
  await selectAtCentre(page, TRENCH_PROFILE.name)
  return page.locator('[data-drawer]')
}

test('5.4 Reiter „Rohrübersicht“', async ({ page }) => {
  test.setTimeout(90_000)
  const infobox = await openTrenchTabs(page)

  await infobox.getByRole('tab', { name: 'Rohrübersicht', exact: true }).click()

  // One conduit per row; the microducts are only loaded when the row is
  // expanded. Without expanding, the image would show three closed rows and
  // nothing of what the section describes.
  const firstConduit = infobox.getByRole('button', { name: /^St-V02-01/ })
  await expect(firstConduit).toBeVisible()
  await firstConduit.click()
  await expect(infobox.getByRole('table').first()).toBeVisible()

  await moveCursorAway(page)
  await page.waitForTimeout(800)

  await page.screenshot({
    path: shotPath(CHAPTER, 'map_trench_conduits'),
    clip: await drawerClip(page),
  })
})

test('5.4 Reiter „Kabelübersicht“', async ({ page }) => {
  test.setTimeout(90_000)
  const infobox = await openTrenchTabs(page)

  await infobox.getByRole('tab', { name: 'Kabelübersicht', exact: true }).click()

  // Two levels: the cable holds the bundles, the bundle holds the fibers. Both
  // are expanded, because the section describes exactly this nesting.
  //
  // Not anchored with `/Fasern$/`: the buttons "Folgen" and "Trassen auf Karte
  // hervorheben" sit **inside** the accordion trigger, so their labels end up
  // in its accessible name ("... 6 Fasern Folgen Trassen auf Karte
  // hervorheben").
  const firstCable = infobox.getByRole('button', { name: /Fasern/ }).first()
  await expect(firstCable).toBeVisible()
  await firstCable.click()

  const firstBundle = infobox.getByRole('button', { name: /^Bündel/ }).first()
  await expect(firstBundle).toBeVisible()
  await firstBundle.click()
  await expect(infobox.getByRole('table').first()).toBeVisible()

  await moveCursorAway(page)
  await page.waitForTimeout(800)

  await page.screenshot({
    path: shotPath(CHAPTER, 'map_trench_cables'),
    clip: await drawerClip(page),
  })
})
