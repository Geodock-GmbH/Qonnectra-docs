// Videos for chapter "7. Rohrzuordnung" in the manual
// (manual/teil-a-anwenderhandbuch/07-rohrzuordnung.md):
//
//   conduit_connection_routing        7.2.1  routing mode, start and end point
//   conduit_connection_map_selection  7.3.2  assign a segment by clicking the map
//   conduit_connection_map_find       7.3.3  find a segment through the list
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in
// tests/07-rohrzuordnung.spec.ts.
//
// All three flows are movement, not state: the two clicks of the routing mode
// only make sense in sequence, a click on the map is followed by a message that
// fades again, and the jump to a segment is an animation. A still image of any
// of them would be indistinguishable from "nothing happened".
//
// Publish to public/videos/ with: pnpm screenshots:publish 07-rohrzuordnung
import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'

import { localApp, superuserCredentials } from '../playwright/local-app'
import {
  click,
  pointAt,
  postProcessVideo,
  showCursor,
  videoPath,
} from '../playwright/manual-videos'

const CHAPTER = '07-rohrzuordnung'

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Larger than the viewport gains nothing: Chromium's screencast delivers
// CSS pixels, the deviceScaleFactor of 2 has no effect here (see
// PostProcessOptions.scale in playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/** Flag "Sterup" - every conduit of the test project carries it. */
const FLAG_ID = '2'

/**
 * Crop in CSS pixels of the window, shared by all three videos.
 *
 * Contains the right-hand half of the map - where the flows click - together
 * with the whole work area (from x 1287) and the messages at the bottom edge of
 * the window (centred, around x 700 to 1090). It starts at x 600 so that the
 * overlay "Route wird berechnet..." is inside as well; that one sits in the
 * middle of the map, at around x 624 to 944.
 *
 * The width is what counts: the manual renders videos at the width of the text
 * column (around 690 px), so 1190 CSS pixels end up at about 58 %. The height
 * does not change that scale - it only decides how much is visible.
 *
 * That is wider than the roughly 1000 px CLAUDE.md aims at, and it is the layout
 * of this page that forces it: all three flows run between the map and the work
 * area, and those two sit 1190 px apart. "7.3.3 Zugeordnetes Trassensegment
 * finden" pins the left edge in particular - `zoomToFeature` centres the segment
 * in the map, at x 784, so a crop starting much further right would push the
 * jumped-to segment against its own edge. Narrowing the crop would therefore cut
 * away either the clicked segment or the list the click lands in.
 */
const CROP = { x: 600, y: 90, width: 1190, height: 1028 }

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

/**
 * Trench segments the demo data assigns to the conduits used here. Everything a
 * run adds beyond this is removed again, see restoreDemoConnections().
 *
 * The still images of the chapter check the number of segments of St-VL-02 and
 * would fail on a leftover; the two conduits below are the ones the videos
 * write to.
 */
const DEMO_CONNECTIONS: Record<string, string[]> = {
  'St-V02-02': ['TR-6AQ6RR6', 'TR-W55WVN3'],
  'St-V02-04': ['TR-B43XLWF', 'TR-YJGWPQ2'],
}

/**
 * Map extents in EPSG:3857 and the points the flows click at. The map has no
 * auto-fit and reads centre and zoom from localStorage, see
 * playwright/auth.setup.ts.
 *
 * The centres are picked so that the clicked segments land in the right-hand
 * half of the map, i.e. inside CROP and close to the work area they change.
 */
const VIEW = {
  /**
   * Two segments a good 200 m apart, with one more between them - the route of
   * section 7.2.1 therefore covers three segments.
   */
  route: {
    center: [1083235, 7308600],
    zoom: 17.4,
    start: { label: 'TR-VXZHFBR', coordinate: [1083340.7, 7308573.9] },
    end: { label: 'TR-W55WVN3', coordinate: [1083564.7, 7308605.8] },
  },

  /**
   * A single segment, 151 m long and therefore comfortably hit. It belongs to
   * other conduits of the demo data, but not yet to St-V02-02.
   */
  selection: {
    center: [1083278, 7308494],
    zoom: 17.6,
    trench: { label: 'TR-BNCKM6A', coordinate: [1083448.2, 7308493.7] },
  },

  /** The eleven segments of St-VL-02, as in tests/07-rohrzuordnung.spec.ts. */
  corridor: { center: [1083852, 7308499], zoom: 17.2 },
}

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

/** Trench labels currently assigned to a conduit, with the UUID of each link. */
async function connections(
  api: APIRequestContext,
  conduitUuid: string,
): Promise<Array<{ uuid: string; label: string }>> {
  const response = await api.get(
    `/api/v1/trench_conduit_connection/all/?uuid_conduit=${conduitUuid}`,
  )
  const body: Array<{ uuid: string; trench: { properties: { id_trench: string } } }> =
    await response.json()
  return body.map((entry) => ({ uuid: entry.uuid, label: entry.trench.properties.id_trench }))
}

/**
 * Puts the assignments of the conduits used here back to the state of the demo
 * data - with the superuser, because the capture account (group "Editor") has
 * access level "edit" and the API answers DELETE with 403. That is not a quirk
 * of the local instance: of the three roles the app ships, only "Admin" has
 * full access (see section 7.3.4 of the chapter).
 *
 * Runs before **and** after every capture: before, so that an aborted attempt
 * does not put an extra segment into the next video, afterwards so that the
 * test project is back in its demo state.
 *
 * Deliberately removes everything that is not part of the demo data instead of
 * a fixed list of what the video creates - only that way does the state also
 * come back after a run that was interrupted halfway through the routing.
 */
async function restoreDemoConnections() {
  const api = await apiContext(superuserCredentials())
  try {
    const response = await api.get('/api/v1/conduit/all/?project=2&page_size=200')
    const body = await response.json()
    const conduits: Array<{ uuid: string; name: string }> = body.results ?? body

    for (const [name, expected] of Object.entries(DEMO_CONNECTIONS)) {
      const conduit = conduits.find((entry) => entry.name === name)
      expect(conduit, `The conduit "${name}" does not exist in the test project.`).toBeDefined()

      for (const link of await connections(api, conduit!.uuid)) {
        if (expected.includes(link.label)) continue

        const deleted = await api.delete(`/api/v1/trench_conduit_connection/${link.uuid}/`)
        expect(
          deleted.ok(),
          `The assignment ${name} - ${link.label} could not be removed ` +
            `(HTTP ${deleted.status()}). The images of the chapter check the number ` +
            'of segments and would fail on the leftover.',
        ).toBe(true)
      }

      const left = (await connections(api, conduit!.uuid)).map((link) => link.label)
      expect(
        left.sort(),
        `The demo data of the conduit "${name}" is incomplete. Import it again with:\n` +
          '  scripts/setup-local-qonnectra.sh --reset',
      ).toEqual([...expected].sort())
    }
  } finally {
    await api.dispose()
  }
}

test.beforeEach(restoreDemoConnections)
test.afterEach(restoreDemoConnections)

// ---------------------------------------------------------------------------
// Building blocks of the recording
// ---------------------------------------------------------------------------

interface OpenOptions {
  view: { center: number[]; zoom: number }
  conduit: string
  routing?: boolean
  linkedTrenches?: boolean
}

/**
 * Opens the conduit assignment on a freshly created page and picks the conduit.
 *
 * Everything up to and including the conduit is cut away by postProcessVideo()
 * later - the videos start at the moment the section describes, not at the page
 * load. Only the returned page carries the replica cursor.
 */
async function openAssignment(page: Page, options: OpenOptions) {
  const { view, conduit, routing = false, linkedTrenches = false } = options

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
  await expect(page).toHaveURL(new RegExp(`/trench/2/${FLAG_ID}(/|$)`))
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForTimeout(2500)

  await showCursor(page)

  // Picked without the replica cursor moving to it on purpose: the selection is
  // a precondition of all three sections, not part of what they show.
  //
  // The trailing space of the pattern carries weight: the entries read
  // "<name> (<conduit type>)", and without it "St-VL-02" would also match
  // "St-VL-02a".
  const field = page.getByPlaceholder('Rohr auswählen', { exact: true })
  await field.click()
  await page.getByRole('option', { name: new RegExp(`^${conduit} `) }).click()
  await expect(field).toHaveValue(new RegExp(`^${conduit} `))
  await expect(page.locator('table tbody tr').first()).toBeVisible()
  await page.waitForTimeout(1000)
}

/**
 * Projects a point in EPSG:3857 onto the viewport, in CSS pixels.
 *
 * OpenLayers keeps its view resolution in projection units per CSS pixel, and
 * for EPSG:3857 it follows from the zoom alone. Since the view is seeded, the
 * position of every segment of the demo data can be calculated instead of
 * searched for in the painted picture.
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

/**
 * Warm-up page. It fills the HTTP cache of the context, so that the actual
 * recording page is up within a fraction of a second - Playwright records a page
 * from its creation, and a long page load would end up in the video.
 */
async function warmUp(page: Page) {
  await page.goto('/trench')
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.close()
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
// 7.2.1 Routing mode
// ---------------------------------------------------------------------------
//
// Shows the flow of the section: switch the routing mode on, set the start
// point, set the end point - and only then, in one go, do the segments in
// between land in the list. Three things about it exist only over time:
//
//   1. After the first click a single segment is selected and nothing happens
//      yet. That waiting state is what the second click resolves.
//   2. While the route is being calculated the map is covered by an overlay
//      ("Route wird berechnet...").
//   3. The list grows by three entries at once - the difference to the single
//      click of section 7.3.2 that the whole section is about.

test('7.2.1 Routing-Modus', async ({ page, context }) => {
  test.setTimeout(180_000)

  await warmUp(page)

  const capture = await context.newPage()
  const pageStart = Date.now()

  // The switch is deliberately off at the start: flipping it is the first step
  // of the video.
  await openAssignment(capture, {
    view: VIEW.route,
    conduit: 'St-V02-04',
    routing: false,
  })

  const rows = capture.locator('table tbody tr')
  await expect(rows).toHaveCount(DEMO_CONNECTIONS['St-V02-04'].length)

  const start = await mapPoint(capture, VIEW.route, VIEW.route.start.coordinate)
  const end = await mapPoint(capture, VIEW.route, VIEW.route.end.coordinate)

  // Seeds the starting point of the cursor motion, so that the first step of the
  // demonstration does not begin with a jump.
  await pointAt(capture, { x: start.x, y: start.y + 220 }, { duration: 400 })

  // From here the demonstration runs; everything before it is cut away.
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. Switch the routing mode on.
  await click(capture, capture.locator('label').filter({ hasText: 'Routing-Modus' }), {
    duration: 800,
    fraction: { x: 0.06 },
  })
  await expect(capture.locator('input[name="routing-mode"]')).toBeChecked()
  await capture.waitForTimeout(900)

  // 2. Start point. Nothing is assigned yet - the pause afterwards is what makes
  //    that visible.
  await click(capture, start, { duration: 900 })
  await capture.waitForTimeout(1400)
  await expect(
    rows,
    'The first click already changed the list - is the routing mode really on?',
  ).toHaveCount(DEMO_CONNECTIONS['St-V02-04'].length)

  // 3. End point. The route is calculated and all segments along it are assigned.
  await click(capture, end, { duration: 900 })

  await expect(rows).toHaveCount(DEMO_CONNECTIONS['St-V02-04'].length + 3, { timeout: 30_000 })
  for (const label of ['TR-VXZHFBR', 'TR-6AQ6RR6', 'TR-W55WVN3']) {
    await expect(
      capture.locator('table tbody tr').filter({ hasText: label }),
      `The segment ${label} is missing from the list - did the route come out ` +
        'differently? Start and end point have to stay connected in the network.',
    ).toBeVisible()
  }

  // Out of the way, so that the last frames show no hover state on a row.
  await pointAt(capture, { x: 900, y: 950 }, { duration: 600 })
  await capture.waitForTimeout(2200)

  await saveVideo(capture, 'conduit_connection_routing', pageStart, demoStart)
})

// ---------------------------------------------------------------------------
// 7.3.2 Assign a segment by clicking the map
// ---------------------------------------------------------------------------
//
// The counterpart to the routing mode: one click, one segment. Recorded with
// "Trassenverbindungen anzeigen" switched on, so that the video answers the
// question the section leaves open otherwise - where the assigned segments now
// run. The two segments the demo data already holds are highlighted from the
// first frame, the clicked one joins them.
//
// The confirmation message at the bottom edge of the window fades again after a
// few seconds, which is the second reason this is not a still image.

test('7.3.2 Rohr einem Trassensegment zuordnen', async ({ page, context }) => {
  test.setTimeout(180_000)

  await warmUp(page)

  const capture = await context.newPage()
  const pageStart = Date.now()

  await openAssignment(capture, {
    view: VIEW.selection,
    conduit: 'St-V02-02',
    linkedTrenches: true,
  })

  const rows = capture.locator('table tbody tr')
  await expect(rows).toHaveCount(DEMO_CONNECTIONS['St-V02-02'].length)

  // The highlighting is drawn by a layer of its own, which only gets its
  // segments once the list has loaded them (`onTrenchesChange`).
  await capture.waitForTimeout(1200)

  const trench = await mapPoint(capture, VIEW.selection, VIEW.selection.trench.coordinate)
  await pointAt(capture, { x: trench.x, y: trench.y + 220 }, { duration: 400 })

  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. Click the segment on the map.
  await click(capture, trench, { duration: 1000 })

  // 2. Confirmation and new entry in the list.
  await expect(capture.getByText('Trassenverbindung gespeichert')).toBeVisible({
    timeout: 20_000,
  })
  await expect(rows).toHaveCount(DEMO_CONNECTIONS['St-V02-02'].length + 1)
  await expect(rows.filter({ hasText: VIEW.selection.trench.label })).toBeVisible()

  // Long enough for the message to have faded again - the video ends on the
  // state that stays: the segment highlighted, the entry in the list.
  await pointAt(capture, { x: 900, y: 950 }, { duration: 600 })
  await expect(capture.getByText('Trassenverbindung gespeichert')).toBeHidden({
    timeout: 20_000,
  })
  await capture.waitForTimeout(1200)

  await saveVideo(capture, 'conduit_connection_map_selection', pageStart, demoStart)
})

// ---------------------------------------------------------------------------
// 7.3.3 Find a segment through the list
// ---------------------------------------------------------------------------
//
// The other direction: from the list into the map. The jump is an animation of
// its own (zoomToFeature, 1000 ms), and the segment is then highlighted three
// times for 300 ms each before the highlight disappears for good. Both only
// exist while they run.

test('7.3.3 Zugeordnetes Trassensegment finden', async ({ page, context }) => {
  test.setTimeout(180_000)

  await warmUp(page)

  const capture = await context.newPage()
  const pageStart = Date.now()

  await openAssignment(capture, {
    view: VIEW.corridor,
    conduit: 'St-VL-02',
    linkedTrenches: true,
  })

  // A segment in the middle of the list and 90 m long, so that it still fills
  // the picture after the jump.
  const row = capture.locator('table tbody tr').filter({ hasText: 'TR-MYZRN4Z' })
  await expect(row).toBeVisible()
  await capture.waitForTimeout(1200)

  await pointAt(capture, { x: 1200, y: 950 }, { duration: 400 })

  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. Click the entry.
  await click(capture, row, { duration: 900, fraction: { x: 0.25 } })

  // 2. The map jumps to the segment and reports it.
  await expect(capture.getByText('Trasse gefunden!')).toBeVisible({ timeout: 20_000 })

  // The blinking runs for around 1.8 s after the end of the 1 s animation
  // (searchUtils.ts); the video keeps running past it so that the last frame
  // shows the segment at rest.
  await capture.waitForTimeout(4500)

  await pointAt(capture, { x: 900, y: 950 }, { duration: 600 })
  await capture.waitForTimeout(1500)

  await saveVideo(capture, 'conduit_connection_map_find', pageStart, demoStart)
})
