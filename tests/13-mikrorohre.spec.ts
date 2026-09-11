import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  disableAnimations,
  moveCursorAway,
  shotPath,
  spotlight,
  type SpotlightEllipse,
} from '../playwright/manual-shots'

// Screenshots for chapter "13. Mikrorohre" in the manual
// (manual/teil-a-anwenderhandbuch/13-mikrorohre.md). Produces all images of the
// chapter:
//
//   microduct            plain overview shot, nothing selected (pattern 1)
//   microduct_drawer     info box with the conduits of a trench (pattern 2)
//   microduct_table      the microduct table in the widened info box (pattern 2)
//   microduct_highlight  the trenches of the opened conduit in the map (pattern 2)
//   microduct_assign     the buttons "Zuordnen" and "Aufheben" (pattern 2)
//
// The video of the chapter sits in tests/13-mikrorohre-video.spec.ts -
// test.use({ video: ... }) is only allowed at file level.
//
// None of the images changes data: they only open trench and conduit. The
// assignment itself is written by the video spec, which cleans up after itself.
//
// Publish to public/images/ with: pnpm screenshots:publish 13-mikrorohre
const CHAPTER = '13-mikrorohre'

/**
 * The trench the images are taken of, with the conduits that lie in it.
 *
 * Picked out of the demo data because it carries the distribution conduit
 * St-V02-04: eleven of its twelve microducts hang off a house connection, so the
 * table shows both the filled and the empty case at once - and number 12 is the
 * one the video of section 13.4 assigns.
 *
 * 160 m long, which makes it comfortable to hit with a click; the trenches of
 * St-V02-04 run along Westerstraße.
 */
const TRENCH = {
  id: 'TR-YJGWPQ2',
  /** Centroid in EPSG:3857 - the point the specs click at. */
  point: [1083718, 7308663],
  conduits: ['St-V02-04 (12x10/6)', 'St-VL-01 (7x16/12)'],
}

/** The conduit whose microducts the images show, with the number of its rows. */
const CONDUIT = { label: 'St-V02-04 (12x10/6)', microducts: 12 }

/**
 * Extent of the trenches St-V02-04 lies in, in EPSG:3857, measured from the demo
 * data. Serves as the spotlight target in microduct_highlight: the highlighting
 * is drawn into the canvas by the map, there is no element a locator could point
 * at.
 */
const CONDUIT_EXTENT = { minX: 1083577, minY: 7308651, maxX: 1083855, maxY: 7308667 }

/**
 * Map extents in EPSG:3857. The map has no auto-fit and reads centre and zoom
 * from localStorage, see playwright/auth.setup.ts.
 */
const VIEW = {
  /** Entire network of the test project, as on the page it is reached on. */
  overview: { center: [1083532, 7308590], zoom: 16.5 },

  /**
   * The trenches of CONDUIT. The centre is shifted east, because the info box
   * lies on top of the map: the map keeps its full width and its own centre
   * therefore sits behind the box. Only the part left of it is visible, and the
   * trenches have to land in there.
   */
  conduit: { center: [1083797, 7308659], zoom: 18.4 },
}

/** Width of the info box in pixels, seeded per image (`drawerWidth`). */
const DRAWER = {
  /** What the app starts with, and what leaves the map the most room. */
  default: 400,
  /**
   * Wide enough for the whole microduct table including both buttons. Below
   * this the columns run past the right-hand edge of the info box - which is
   * what section 13.2 warns about, and what makes an image of the table
   * unreadable.
   */
  wide: 880,
}

// ---------------------------------------------------------------------------
// Building blocks of the interface
// ---------------------------------------------------------------------------

/** The info box at the right-hand edge, from the heading downwards. */
function infoBox(page: Page): Locator {
  return page.locator('#drawer-title').locator('xpath=ancestor::div[contains(@class,"h-full")][1]')
}

/** The row of one conduit in the info box, the microduct table included. */
function conduitItem(page: Page, label: string): Locator {
  return page.locator('[data-part="item"]').filter({ hasText: label })
}

/** The clickable heading of one conduit. */
function conduitHeader(page: Page, label: string): Locator {
  return page.locator('[data-part="item-trigger"]').filter({ hasText: label })
}

interface OpenOptions {
  view?: { center: number[]; zoom: number }
  drawerWidth?: number
}

/**
 * Opens the microduct view of the test project and waits until the map is drawn.
 *
 * Map position and info box width are seeded through `addInitScript`, i.e.
 * before every load of the document; both live in localStorage (`persisted()` in
 * the app) and would otherwise be whatever the previous run left behind. The
 * width in particular travels: the app keeps one value for every view with an
 * info box (section 3.6 of the manual).
 *
 * The map view goes the same way and not via "load, set, reload": the app writes
 * `mapCenter`/`mapZoom` back on every `moveend`, and a write-back between
 * setting and reloading would drop the seed - the map then starts at the
 * overview and a click aimed at a particular trench hits nothing.
 */
async function openMicroducts(page: Page, options: OpenOptions = {}) {
  const { view = VIEW.overview, drawerWidth = DRAWER.default } = options

  await page.addInitScript(
    (state) => {
      localStorage.setItem('mapCenter', JSON.stringify(state.view.center))
      localStorage.setItem('mapZoom', JSON.stringify(state.view.zoom))
      localStorage.setItem('drawerWidth', JSON.stringify(state.drawerWidth))
    },
    { view, drawerWidth },
  )

  await page.goto('/house-connections')

  // `/house-connections` redirects to `/house-connections/<project>` - the 2 is
  // the test project (cookie `selected-project`, set in
  // playwright/auth.setup.ts).
  await expect(page).toHaveURL(/\/house-connections\/2(\/|$)/)

  // With a running tileserver (vector tiles) OpenLayers creates a second canvas,
  // without it (OSM raster fallback) only one - hence .first().
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForTimeout(2500)

  await disableAnimations(page)
  await moveCursorAway(page)
}

/**
 * Projects a point in EPSG:3857 onto the viewport, in CSS pixels.
 *
 * OpenLayers keeps its view resolution in projection units per CSS pixel, and
 * for EPSG:3857 it follows from the zoom alone. Since the view is seeded
 * (openMicroducts), the position of every object of the demo data can be
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
  margin = 24,
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

/**
 * Clicks TRENCH in the map and waits for the info box.
 *
 * The trench is checked by name, not just "some info box opened": several
 * trenches meet at the branch node, and a shifted map view would silently put a
 * different one - with different conduits - into the image.
 */
async function openTrench(page: Page, view: { center: number[]; zoom: number }) {
  const point = await mapPoint(page, view, TRENCH.point)
  await page.mouse.click(point.x, point.y)

  await expect(
    page.locator('#drawer-title'),
    `The click did not hit the trench ${TRENCH.id}. Has the map view moved, or ` +
      'has the demo data changed?',
  ).toHaveText(TRENCH.id)

  for (const conduit of TRENCH.conduits) {
    await expect(conduitHeader(page, conduit)).toBeVisible()
  }
  await moveCursorAway(page)
}

/** Opens CONDUIT and waits until its microducts are in the table. */
async function openConduit(page: Page) {
  await conduitHeader(page, CONDUIT.label).click()

  await expect(
    conduitItem(page, CONDUIT.label).locator('table tbody tr'),
    `The conduit "${CONDUIT.label}" does not hold the expected number of ` +
      'microducts. Is the demo data complete?',
  ).toHaveCount(CONDUIT.microducts)

  // The highlighting of the trenches is drawn by a layer of its own, which only
  // gets them once `fetchTrenchUuidsForConduit` has answered.
  await page.waitForTimeout(1200)
  await moveCursorAway(page)
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

test('13. Übersicht der Mikrorohre', async ({ page }) => {
  // Deliberately without a trench: that is the state the page is reached in, and
  // the hint at the bottom edge of the map is part of what section 13.1
  // describes.
  await openMicroducts(page)

  await expect(page.getByText('Klicken Sie auf einen Graben um die Sidebar zu öffnen.')).toBeVisible()
  await page.screenshot({ path: shotPath(CHAPTER, 'microduct') })
})

test('13.1 Info-Box mit den Rohren der Trasse', async ({ page }) => {
  await openMicroducts(page, { view: VIEW.conduit })
  await openTrench(page, VIEW.conduit)

  const spotlightOff = await spotlight(page, infoBox(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'microduct_drawer') })
  await spotlightOff()
})

test('13.2 Tabelle der Mikrorohre', async ({ page }) => {
  await openMicroducts(page, { view: VIEW.conduit, drawerWidth: DRAWER.wide })
  await openTrench(page, VIEW.conduit)
  await openConduit(page)

  const spotlightOff = await spotlight(page, infoBox(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'microduct_table') })
  await spotlightOff()
})

test('13.3 Hervorgehobene Trassen des Rohrs', async ({ page }) => {
  // Deliberately at the default width: the section is about the map, and the
  // widened info box would leave it too little room for the 278 m the conduit
  // covers.
  await openMicroducts(page, { view: VIEW.conduit })
  await openTrench(page, VIEW.conduit)
  await openConduit(page)

  // Two places at once: the opened conduit and what opening it does to the map.
  // Exposing the row alone would leave the section without a picture of its
  // effect.
  const trenches = await mapEllipse(page, VIEW.conduit, CONDUIT_EXTENT)
  const spotlightOff = await spotlight(page, [conduitHeader(page, CONDUIT.label), trenches])
  await page.screenshot({ path: shotPath(CHAPTER, 'microduct_highlight') })
  await spotlightOff()
})

test('13.4 Schaltflächen „Zuordnen" und „Aufheben"', async ({ page }) => {
  await openMicroducts(page, { view: VIEW.conduit, drawerWidth: DRAWER.wide })
  await openTrench(page, VIEW.conduit)
  await openConduit(page)

  const rows = conduitItem(page, CONDUIT.label).locator('table tbody tr')

  // The first row carries an address and therefore both buttons, the last one is
  // free and only offers "Zuordnen" - together they show the difference the
  // section describes.
  const spotlightOff = await spotlight(page, [
    rows.first().locator('td').last(),
    rows.last().locator('td').last(),
  ])
  await page.screenshot({ path: shotPath(CHAPTER, 'microduct_assign') })
  await spotlightOff()
})
