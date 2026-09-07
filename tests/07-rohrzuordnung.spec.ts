import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  disableAnimations,
  moveCursorAway,
  shotPath,
  spotlight,
  type SpotlightEllipse,
} from '../playwright/manual-shots'

// Screenshots for chapter "7. Rohrzuordnung" in the manual
// (manual/teil-a-anwenderhandbuch/07-rohrzuordnung.md). Produces all images of
// the chapter:
//
//   conduit_connection                  plain overview shot (pattern 1)
//   conduit_connection_edit_area        work area on the right (pattern 2)
//   conduit_connection_routing          switch "Routing-Modus" (pattern 2)
//   conduit_connection_linked_trenches  switch + highlighted trenches (pattern 2)
//   conduit_connection_project_flag     project picker and flag (pattern 2)
//   conduit_connection_conduit          opened conduit list (pattern 2)
//   conduit_connection_list             list of assigned trenches (pattern 2)
//
// The videos of the chapter sit in tests/07-rohrzuordnung-video.spec.ts -
// test.use({ video: ... }) is only allowed at file level.
//
// Publish to public/images/ with: pnpm screenshots:publish 07-rohrzuordnung
const CHAPTER = '07-rohrzuordnung'

/**
 * Flag "Sterup" (id 2). Every conduit of the test project carries it, while the
 * store defaults to id 1 ("Default") - and for that one the conduit list stays
 * empty, because `/trench` loads the conduits filtered by flag
 * (`conduit/all/?project=…&flag=…` in +page.server.ts). Without seeding this,
 * every image would show an empty selection.
 */
const FLAG_ID = '2'

/**
 * The conduit the images of the work area are taken of. It holds eleven trench
 * segments and therefore fills the list past its page size of ten - only that
 * way do paging and the count below the list appear in the picture at all.
 *
 * The label is the one the combobox shows: name plus conduit type in brackets
 * (`+page.server.ts` builds it that way).
 */
const CONDUIT = { label: 'St-VL-02 (7x16/12)', trenchCount: 11 }

/**
 * Map extents in EPSG:3857. The map has no auto-fit and reads centre and zoom
 * from localStorage, see playwright/auth.setup.ts.
 */
const VIEW = {
  /** Entire network of the test project. */
  overview: { center: [1083532, 7308590], zoom: 16.5 },

  /**
   * The trenches of CONDUIT. They form one continuous run of about 700 m from
   * south to north; at zoom 17.2 it fits into the map with room to spare, so
   * the highlighting of section 7.2.2 is visible in one piece.
   */
  corridor: { center: [1083852, 7308499], zoom: 17.2 },
}

/**
 * Extent of the eleven trenches of CONDUIT in EPSG:3857, measured from the demo
 * data. Serves as the spotlight target in conduit_connection_linked_trenches:
 * the trenches are drawn into the canvas by the map, there is no element a
 * locator could point at.
 *
 * Deliberately not measured out of the painted picture like the selected object
 * in tests/05-karte.spec.ts - the highlighting colour (#06b6d4,
 * `createLinkedTrenchStyle`) is dashed, and the base map holds water surfaces
 * of a very similar cyan. The extent of the trenches is fixed demo data, so it
 * can simply be projected.
 */
const CORRIDOR_EXTENT = { minX: 1083829, minY: 7308151, maxX: 1083875, maxY: 7308847 }

// ---------------------------------------------------------------------------
// Building blocks of the interface
// ---------------------------------------------------------------------------

interface OpenOptions {
  view?: { center: number[]; zoom: number }
  /** Switch "Routing-Modus". Persisted per browser, so it is always seeded. */
  routing?: boolean
  /** Switch "Trassenverbindungen anzeigen". Persisted per browser as well. */
  linkedTrenches?: boolean
}

/**
 * Opens the conduit assignment of the test project and waits until the map is
 * drawn.
 *
 * Everything the images depend on is seeded through `addInitScript`, i.e.
 * before every load of the document: flag, the two switches and the map view.
 * All four live in localStorage (`persisted()` in the app) and would otherwise
 * be whatever the previous run left behind.
 *
 * The map view goes in the same way and not via "load, set, reload": the app
 * writes `mapCenter`/`mapZoom` back on every `moveend`, and a write-back
 * between setting and reloading would drop the seed - the map then starts at
 * the overview and a click aimed at a particular trench hits nothing.
 */
async function openAssignment(page: Page, options: OpenOptions = {}) {
  const { view = VIEW.overview, routing = false, linkedTrenches = false } = options

  await page.addInitScript(
    (state) => {
      localStorage.setItem('selectedFlag', JSON.stringify([state.flagId]))
      localStorage.setItem('routingMode', JSON.stringify(state.routing))
      localStorage.setItem('showLinkedTrenches', JSON.stringify(state.linkedTrenches))
      localStorage.setItem('mapCenter', JSON.stringify(state.view.center))
      localStorage.setItem('mapZoom', JSON.stringify(state.view.zoom))
    },
    { flagId: FLAG_ID, routing, linkedTrenches, view },
  )

  await page.goto('/trench')

  // `/trench` redirects to `/trench/<project>/<flag>` - the 2 is the test
  // project (cookie `selected-project`, set in playwright/auth.setup.ts). Both
  // are checked: without the cookie the app shows the project "Default", which
  // holds no conduits at all.
  await expect(page).toHaveURL(new RegExp(`/trench/2/${FLAG_ID}(/|$)`))

  // With a running tileserver (vector tiles) OpenLayers creates a second
  // canvas, without it (OSM raster fallback) only one - hence .first().
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForTimeout(2500)

  await disableAnimations(page)
  await moveCursorAway(page)
}

/** Work area to the right of the map (the `order-2` column of +page.svelte). */
function workArea(page: Page): Locator {
  return page
    .locator('input[name="routing-mode"]')
    .locator('xpath=ancestor::div[contains(@class,"order-2")][1]')
}

/**
 * Row of one of the two switches. The whole `label` is the target, not the
 * switch alone: the switch is 1 px small in the DOM (the visible control is
 * drawn by the design system around it), and a cut-out of that would expose
 * nothing.
 */
function switchRow(page: Page, label: string): Locator {
  return page.locator('label').filter({ hasText: label })
}

/**
 * Block of one of the two comboboxes of the work area, caption included.
 *
 * Scoped to the work area, because "Rohr" is also the name of a layer in the
 * legend of the map and would otherwise match twice.
 */
function comboboxBlock(page: Page, caption: string): Locator {
  return workArea(page).locator(`div:has(> span:text-is("${caption}"))`)
}

/**
 * Project picker in the header (ProjectCombobox.svelte): input field and expand
 * button. Same access as in tests/04-dashboard.spec.ts.
 */
function projectPicker(page: Page): Locator {
  return page.getByPlaceholder('Projekt', { exact: true }).locator('xpath=..')
}

/** Root of the trench list: caption, search field, table, count and paging. */
function trenchList(page: Page): Locator {
  return page
    .getByRole('heading', { name: 'Trassen-ID', exact: true })
    .locator('xpath=ancestor::div[contains(@class,"flex-col")][1]')
}

/**
 * Picks a conduit and waits until its trench segments are in the list.
 *
 * The number of rows is checked, not just "the list is filled": the images show
 * the count and the paging, and a run of the video specs left over halfway
 * would otherwise put an extra segment into the picture unnoticed.
 */
async function selectConduit(page: Page, conduit = CONDUIT) {
  const field = page.getByPlaceholder('Rohr auswählen', { exact: true })
  await field.click()
  await page.getByRole('option', { name: conduit.label, exact: true }).click()
  await expect(field).toHaveValue(conduit.label)

  await expect(
    page.getByText(`${conduit.trenchCount} Einträge`),
    `The conduit "${conduit.label}" does not hold the expected number of trench ` +
      'segments. Has a video run been aborted? tests/07-rohrzuordnung-video.spec.ts ' +
      'restores the demo state through the API.',
  ).toBeVisible()

  await moveCursorAway(page)
}

/**
 * Projects a point in EPSG:3857 onto the viewport, in CSS pixels.
 *
 * OpenLayers keeps its view resolution in projection units per CSS pixel, and
 * for EPSG:3857 it follows from the zoom alone. Since the view is seeded
 * (openAssignment), the position of every object of the demo data can be
 * calculated instead of searched for in the painted picture.
 */
async function mapPoint(
  page: Page,
  view: { center: number[]; zoom: number },
  coordinate: number[],
): Promise<{ x: number; y: number }> {
  const box = (await page.locator('div.map').boundingBox())!
  const resolution = 156543.03392804097 / 2 ** view.zoom

  return {
    x: box.x + box.width / 2 + (coordinate[0] - view.center[0]) / resolution,
    y: box.y + box.height / 2 - (coordinate[1] - view.center[1]) / resolution,
  }
}

/** Ellipse around an extent in EPSG:3857, as a spotlight target. */
async function mapEllipse(
  page: Page,
  view: { center: number[]; zoom: number },
  extent: { minX: number; minY: number; maxX: number; maxY: number },
  margin = 20,
): Promise<SpotlightEllipse> {
  const min = await mapPoint(page, view, [extent.minX, extent.minY])
  const max = await mapPoint(page, view, [extent.maxX, extent.maxY])

  return {
    x: (min.x + max.x) / 2,
    y: (min.y + max.y) / 2,
    rx: Math.abs(max.x - min.x) / 2 + margin,
    // min and max are swapped on this axis: y grows upwards in the projection,
    // downwards in the viewport.
    ry: Math.abs(min.y - max.y) / 2 + margin,
  }
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

test('7. Übersicht der Rohrzuordnung', async ({ page }) => {
  // Deliberately without a conduit: that is the state the page is reached in,
  // and the hint at the bottom edge of the map ("Wählen Sie ein Rohr rechts aus
  // dem Drop-Down.") is part of what section 7.1 describes.
  await openAssignment(page)

  await expect(page.getByText('Wählen Sie ein Rohr rechts aus dem Drop-Down.')).toBeVisible()
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit_connection') })
})

test('7.2 Arbeitsbereich rechts neben der Karte', async ({ page }) => {
  await openAssignment(page, { view: VIEW.corridor })
  await selectConduit(page)

  const spotlightOff = await spotlight(page, workArea(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit_connection_edit_area') })
  await spotlightOff()
})

test('7.2.1 Umschalter „Routing-Modus"', async ({ page }) => {
  await openAssignment(page, { view: VIEW.corridor })
  await selectConduit(page)

  const spotlightOff = await spotlight(page, switchRow(page, 'Routing-Modus'))
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit_connection_routing') })
  await spotlightOff()
})

test('7.2.2 Umschalter „Trassenverbindungen anzeigen"', async ({ page }) => {
  await openAssignment(page, { view: VIEW.corridor, linkedTrenches: true })
  await selectConduit(page)

  // The highlighting is drawn by the layer `linkedTrenchesLayer`, which only
  // gets its trenches once the list has loaded them (`onTrenchesChange`).
  await page.waitForTimeout(1200)

  // Two places at once: the switch and what it does. Exposing the switch alone
  // would leave the section without a picture of its effect, and the dashed
  // cyan line disappears in the dimmed map.
  const corridor = await mapEllipse(page, VIEW.corridor, CORRIDOR_EXTENT)
  const spotlightOff = await spotlight(page, [
    switchRow(page, 'Trassenverbindungen anzeigen'),
    corridor,
  ])
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit_connection_linked_trenches') })
  await spotlightOff()
})

test('7.3.1 Projekt und Kennzeichen', async ({ page }) => {
  await openAssignment(page, { view: VIEW.corridor })
  await selectConduit(page)

  // Both places belong together: which conduits are on offer follows from the
  // project in the header and the flag in the work area.
  const spotlightOff = await spotlight(page, [
    projectPicker(page),
    comboboxBlock(page, 'Kennzeichen'),
  ])
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit_connection_project_flag') })
  await spotlightOff()
})

test('7.3.1 Geöffnete Rohrauswahl', async ({ page }) => {
  await openAssignment(page, { view: VIEW.corridor })

  const field = page.getByPlaceholder('Rohr auswählen', { exact: true })
  await field.click()

  // The list is picked by its content, not by its id: VirtualCombobox.svelte
  // generates that anew on every render, and the page holds several list boxes
  // (project, language, flag, conduit).
  const options = page
    .locator('[role="listbox"]')
    .filter({ has: page.getByRole('option', { name: CONDUIT.label, exact: true }) })
  await expect(options).toBeVisible()
  await expect(page.getByRole('option')).toHaveCount(7)

  // Away from the list, otherwise the entry below the cursor is highlighted -
  // and a screenshot shows no cursor to explain it.
  await moveCursorAway(page)

  const spotlightOff = await spotlight(page, [comboboxBlock(page, 'Rohr'), options])
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit_connection_conduit') })
  await spotlightOff()
})

test('7.3.3 Liste der zugeordneten Trassensegmente', async ({ page }) => {
  await openAssignment(page, { view: VIEW.corridor })
  await selectConduit(page)

  // Page 2 exists at eleven entries; it is what the section points at ("turn
  // the page at the bottom"), so the paging has to be in the picture.
  //
  // Addressed through the data attributes of the design system, not through the
  // label: the pagination of Skeleton labels its pages in English
  // ("last page, page 2") even in the German interface.
  await expect(page.locator('[data-scope="pagination"] [data-part="item"]')).toHaveCount(2)

  const spotlightOff = await spotlight(page, trenchList(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit_connection_list') })
  await spotlightOff()
})
