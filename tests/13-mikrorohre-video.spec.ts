// Video for chapter "13. Mikrorohre" in the manual
// (manual/teil-a-anwenderhandbuch/13-mikrorohre.md):
//
//   microduct_assign  13.4  document a house connection on a microduct
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in tests/13-mikrorohre.spec.ts.
//
// The flow is movement, not state: between the two clicks the view is in a mode
// of its own, in which only nodes can be clicked and every button of the table is
// greyed out. A still image would show either the table before or the table
// after - not that the second click happens in the map.
//
// Publish to public/videos/ with: pnpm screenshots:publish 13-mikrorohre
import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'

import { localApp, superuserCredentials } from '../playwright/local-app'
import { click, pointAt, postProcessVideo, showCursor, videoPath } from '../playwright/manual-videos'

const CHAPTER = '13-mikrorohre'

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Larger than the viewport gains nothing: Chromium's screencast delivers
// CSS pixels, the deviceScaleFactor of 2 has no effect here (see
// PostProcessOptions.scale in playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/** The trench of the recording, as in tests/13-mikrorohre.spec.ts. */
const TRENCH = { id: 'TR-YJGWPQ2', point: [1083718, 7308663] }

/** The conduit whose microducts the table shows. */
const CONDUIT = { name: 'St-V02-04', label: 'St-V02-04 (12x10/6)', microducts: 12 }

/**
 * The microduct the video assigns a house connection to: the only free one of
 * CONDUIT in the demo data.
 */
const FREE_MICRODUCT = 12

/**
 * Microduct numbers of CONDUIT that carry a house connection in the demo data.
 * Everything a run assigns beyond this is released again, see
 * restoreDemoAssignments().
 */
const DEMO_ASSIGNED = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

/**
 * The node the video clicks in the map: a house connection of the demo data that
 * hangs off no microduct yet, 15 m from TRENCH.
 *
 * Its address comes from the demo export and is checked at the source
 * (scripts/qonnectra-demo-data/), so it may appear in a published video.
 */
const NODE = { address: 'Nieharde 20', point: [1083841.68, 7308682.16] }

/**
 * Map extent in EPSG:3857. The centre is shifted east, because the info box lies
 * on top of the map: the map keeps its full width, so its own centre sits behind
 * the box. NODE has to land in the strip that is left of it - and inside CROP.
 */
const VIEW = { center: [1084019, 7308682], zoom: 18 }

/** Width of the info box, wide enough for the whole table including buttons. */
const DRAWER_WIDTH = 880

/**
 * Crop in CSS pixels of the window.
 *
 * Holds the whole info box (from x 912) together with the strip of map left of
 * it, where the second click of the flow lands. Both are needed: the flow starts
 * in the table and ends in the map, and the table is what shows the result.
 *
 * That is wider than the roughly 1000 px CLAUDE.md aims at, and the layout
 * forces it: the table only fits into an info box of 880 px (section 13.2), and
 * a click in the map cannot be shown without the map.
 */
const CROP = { x: 600, y: 90, width: 1192, height: 1028 }

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

// ---------------------------------------------------------------------------
// Demo state
// ---------------------------------------------------------------------------

/** Logged-in API context. The credentials are never printed. */
async function apiContext(credentials: {
  username: string
  password: string
}): Promise<APIRequestContext> {
  const { apiUrl } = localApp()
  const api = await request.newContext({ baseURL: apiUrl, ignoreHTTPSErrors: true })
  const login = await api.post('/api/v1/auth/login/', { data: credentials })
  expect(
    login.ok(),
    'Login to the API failed - is the local instance running, and are the ' +
      'credentials in local-app/deployment/.env correct?',
  ).toBe(true)
  return api
}

interface Microduct {
  uuid: string
  number: number
  uuid_node?: unknown | null
}

/**
 * Puts the house connections of CONDUIT back to the state of the demo data - the
 * assignment the video creates is released again.
 *
 * Runs before **and** after every capture: before, so that an aborted attempt
 * does not start the next recording with a filled row, afterwards so that the
 * test project is back in its demo state. The still images of the chapter show
 * the free microduct 12 and would otherwise carry an address that no demo data
 * has.
 *
 * Uses the superuser, in line with the other video specs of the repo; releasing
 * is a PATCH and would work with the capture account as well.
 */
async function restoreDemoAssignments() {
  const api = await apiContext(superuserCredentials())
  try {
    const conduits = await (await api.get('/api/v1/conduit/all/?project=2&page_size=200')).json()
    const list: Array<{ uuid: string; name: string }> = conduits.results ?? conduits
    const conduit = list.find((entry) => entry.name === CONDUIT.name)
    expect(conduit, `The conduit "${CONDUIT.name}" does not exist in the test project.`).toBeDefined()

    const microducts: Microduct[] = await (
      await api.get(`/api/v1/microduct/all/?uuid_conduit=${conduit!.uuid}`)
    ).json()

    for (const microduct of microducts) {
      if (!microduct.uuid_node) continue
      if (DEMO_ASSIGNED.includes(microduct.number)) continue

      const released = await api.patch(`/api/v1/microduct/${microduct.uuid}/`, {
        data: { uuid_node_id: null },
      })
      expect(
        released.ok(),
        `The house connection on microduct ${microduct.number} could not be ` +
          `released (HTTP ${released.status()}). The images of the chapter show ` +
          'this microduct as free and would fail on the leftover.',
      ).toBe(true)
    }

    const left: Microduct[] = await (
      await api.get(`/api/v1/microduct/all/?uuid_conduit=${conduit!.uuid}`)
    ).json()
    expect(
      left.filter((microduct) => microduct.uuid_node).map((microduct) => microduct.number).sort(
        (a, b) => a - b,
      ),
      `The house connections of "${CONDUIT.name}" in the demo data are ` +
        'incomplete. Import them again with:\n  scripts/setup-local-qonnectra.sh --reset',
    ).toEqual(DEMO_ASSIGNED)
  } finally {
    await api.dispose()
  }
}

test.beforeEach(restoreDemoAssignments)
test.afterEach(restoreDemoAssignments)

// ---------------------------------------------------------------------------
// Building blocks of the recording
// ---------------------------------------------------------------------------

/**
 * Projects a point in EPSG:3857 onto the viewport, in CSS pixels.
 *
 * OpenLayers keeps its view resolution in projection units per CSS pixel, and
 * for EPSG:3857 it follows from the zoom alone. Since the view is seeded, the
 * position of every object of the demo data can be calculated instead of
 * searched for in the painted picture.
 */
async function mapPoint(page: Page, coordinate: number[]): Promise<{ x: number; y: number }> {
  const box = (await page.locator('div.map').boundingBox())!
  const resolution = 156543.03392804097 / 2 ** VIEW.zoom

  return {
    x: box.x + box.width / 2 + (coordinate[0] - VIEW.center[0]) / resolution,
    y: box.y + box.height / 2 - (coordinate[1] - VIEW.center[1]) / resolution,
  }
}

/**
 * Opens the microduct view on a freshly created page, selects the trench and
 * opens the conduit.
 *
 * Everything up to and including the opened table is cut away by
 * postProcessVideo() later - the video starts at the moment section 13.4
 * describes, not at the page load. Only the returned page carries the replica
 * cursor.
 */
async function openTable(page: Page) {
  await page.goto('/house-connections')
  await expect(page).toHaveURL(/\/house-connections\/2(\/|$)/)
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForTimeout(2500)

  await showCursor(page)

  // Trench and conduit are picked without the replica cursor moving to them on
  // purpose: both are a precondition of the section, not part of what it shows.
  const trench = await mapPoint(page, TRENCH.point)
  await page.mouse.click(trench.x, trench.y)
  await expect(
    page.locator('#drawer-title'),
    `The click did not hit the trench ${TRENCH.id}. Has the map view moved?`,
  ).toHaveText(TRENCH.id)

  await page.locator('[data-part="item-trigger"]').filter({ hasText: CONDUIT.label }).click()
  await expect(page.locator('table tbody tr')).toHaveCount(CONDUIT.microducts)
  await page.waitForTimeout(1200)
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

// ---------------------------------------------------------------------------
// 13.4 Document a house connection
// ---------------------------------------------------------------------------

test('13.4 Hausanschluss zuordnen', async ({ page, context }) => {
  test.setTimeout(180_000)

  // Warm-up page. It fills the HTTP cache of the context, so that the actual
  // recording page is up within a fraction of a second - Playwright records a
  // page from its creation, and a long page load would end up in the video.
  await page.goto('/house-connections')
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.close()

  const capture = await context.newPage()
  const pageStart = Date.now()

  await capture.addInitScript(
    (state) => {
      localStorage.setItem('mapCenter', JSON.stringify(state.view.center))
      localStorage.setItem('mapZoom', JSON.stringify(state.view.zoom))
      localStorage.setItem('drawerWidth', JSON.stringify(state.drawerWidth))
    },
    { view: VIEW, drawerWidth: DRAWER_WIDTH },
  )

  await openTable(capture)

  const row = capture.locator('table tbody tr').nth(FREE_MICRODUCT - 1)
  await expect(row).toContainText(String(FREE_MICRODUCT))

  // The button carries the tooltip as its accessible name, not its caption
  // ("Zuordnen") - `aria-label` wins over the text of the button.
  const assign = row.getByRole('button', { name: 'Netzknoten zu Mikrorohr zuweisen' })
  const node = await mapPoint(capture, NODE.point)

  // Seeds the starting point of the cursor motion, so that the first step of the
  // demonstration does not begin with a jump.
  await pointAt(capture, { x: node.x, y: node.y + 240 }, { duration: 400 })

  // From here the demonstration runs; everything before it is cut away.
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. "Zuordnen" in the row of the free microduct. From here on every button of
  //    the table is greyed out - that is the whole visible sign of the mode.
  await click(capture, assign, { duration: 1100 })
  await expect(assign).toBeDisabled()
  await capture.waitForTimeout(900)

  // 2. The node of the house connection in the map.
  await click(capture, node, { duration: 1400 })

  // 3. The address lands in the row, and Qonnectra confirms.
  await expect(capture.getByText('Hausanschluss erfolgreich zugeordnet')).toBeVisible({
    timeout: 20_000,
  })
  await expect(row).toContainText(NODE.address)

  // Out of the way, so that the last frames show no hover state on a row, and
  // long enough for the message to have faded - the video ends on the state that
  // stays: the address in the table.
  await pointAt(capture, { x: 750, y: 1000 }, { duration: 600 })
  await expect(capture.getByText('Hausanschluss erfolgreich zugeordnet')).toBeHidden({
    timeout: 20_000,
  })
  await capture.waitForTimeout(1200)

  await saveVideo(capture, 'microduct_assign', pageStart, demoStart)
})
