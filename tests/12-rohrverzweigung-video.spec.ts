// Videos for chapter "12. Rohrverzweigung" in the manual
// (manual/teil-a-anwenderhandbuch/12-rohrverzweigung.md):
//
//   pipe_branch_connect       12.3.1  connect two microducts by dragging
//   pipe_branch_auto_connect  12.3.2  lasso two conduits and connect them at once
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in
// tests/12-rohrverzweigung.spec.ts.
//
// Both flows are movement, not state. Dragging from one microduct to another is
// the whole of section 12.3.1, and a still image of the finished line would not
// show where it came from. The lasso exists only while the mouse button is down:
// the stroke is painted onto an overlay canvas and cleared again on release
// (PipeBranchLasso.svelte), so it cannot be photographed at all.
//
// Publish to public/videos/ with: pnpm screenshots:publish 12-rohrverzweigung
import { expect, request, test, type APIRequestContext, type Locator, type Page } from '@playwright/test'

import { localApp, superuserCredentials } from '../playwright/local-app'
import { click, pointAt, postProcessVideo, showCursor, videoPath } from '../playwright/manual-videos'

const CHAPTER = '12-rohrverzweigung'

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Larger than the viewport gains nothing: Chromium's screencast delivers
// CSS pixels, the deviceScaleFactor of 2 has no effect here (see
// PostProcessOptions.scale in playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

const NODE = 'STER-RA-1'

/**
 * Crop in CSS pixels of the window, shared by both videos.
 *
 * Starts at the card "Eigenschaften" (x 313) and reaches to the right-hand half
 * of the canvas, where the circles of the two videos sit. It has to hold three
 * things at once: the card, because the auto connection happens in it; the two
 * circles that are being connected; and the messages at the bottom edge of the
 * window (centred, around x 700 to 1090), which confirm the new connections.
 *
 * That is wider than the roughly 1000 px CLAUDE.md aims at, and the layout of
 * the page forces it: `fitView` spreads the five circles over a ring across the
 * whole canvas, and the card sits in the opposite corner from the two that are
 * being connected.
 */
const CROP = { x: 300, y: 90, width: 1200, height: 1028 }

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

/**
 * The microduct connections of the demo data at NODE, as
 * `<conduit>/<number>` pairs. Everything a run adds beyond this is removed
 * again, see restoreDemoConnections().
 *
 * The still images of the chapter check the number of edges on the canvas and
 * would fail on a leftover.
 */
const DEMO_CONNECTIONS = [
  'St-VL-02/5 - St-VL-02a/5',
  'St-VL-02/6 - St-VL-02a/6',
  'St-VL-02/7 - St-VL-02a/7',
]

/** The two conduits of trench TR-NZLQR5E, which both videos work on. */
const PAIR = [
  { trench: 'TR-NZLQR5E', conduit: 'St-VL-01' },
  { trench: 'TR-NZLQR5E', conduit: 'St-VL-02' },
]

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

interface Connection {
  uuid: string
  uuid_microduct_from?: { number?: number; uuid_conduit?: { name?: string } }
  uuid_microduct_to?: { number?: number; uuid_conduit?: { name?: string } }
}

/** `<conduit>/<number> - <conduit>/<number>`, the way DEMO_CONNECTIONS reads. */
function label(connection: Connection): string {
  const from = connection.uuid_microduct_from
  const to = connection.uuid_microduct_to
  return (
    `${from?.uuid_conduit?.name}/${from?.number} - ` +
    `${to?.uuid_conduit?.name}/${to?.number}`
  )
}

/**
 * Puts the microduct connections back to the state of the demo data - with the
 * superuser, because the capture account (group "Editor") has access level
 * "edit" and the API answers DELETE with 403. That is not a quirk of the local
 * instance: of the three roles the app ships, only "Admin" has full access (see
 * section 12.3.3 of the chapter).
 *
 * Runs before **and** after every capture: before, so that an aborted attempt
 * does not put extra lines into the next video, afterwards so that the test
 * project is back in its demo state.
 *
 * Deliberately removes everything that is not part of the demo data instead of a
 * fixed list of what the video creates - only that way does the state also come
 * back after a run that was interrupted halfway through.
 */
async function restoreDemoConnections() {
  const api = await apiContext(superuserCredentials())
  try {
    const response = await api.get('/api/v1/microduct_connection/')
    const body = await response.json()
    const connections: Connection[] = body.results ?? body

    for (const connection of connections) {
      if (DEMO_CONNECTIONS.includes(label(connection))) continue

      const deleted = await api.delete(`/api/v1/microduct_connection/${connection.uuid}/`)
      expect(
        deleted.ok(),
        `The connection ${label(connection)} could not be removed ` +
          `(HTTP ${deleted.status()}). The images of the chapter check the number ` +
          'of connections and would fail on the leftover.',
      ).toBe(true)
    }

    const left = (await (await api.get('/api/v1/microduct_connection/')).json()) as
      | Connection[]
      | { results: Connection[] }
    const labels = (Array.isArray(left) ? left : left.results).map(label)
    expect(
      labels.sort(),
      'The microduct connections of the demo data are incomplete. Import them ' +
        'again with:\n  scripts/setup-local-qonnectra.sh --reset',
    ).toEqual([...DEMO_CONNECTIONS].sort())
  } finally {
    await api.dispose()
  }
}

test.beforeEach(restoreDemoConnections)
test.afterEach(restoreDemoConnections)

// ---------------------------------------------------------------------------
// Building blocks of the recording
// ---------------------------------------------------------------------------

/**
 * The switch "Auto-Verbindung". Its caption sits in a `span` beside it, so the
 * switch is addressed through the data attributes of the design system - it is
 * the only one on the page.
 */
function autoConnectSwitch(page: Page): Locator {
  return page.locator('[data-scope="switch"][data-part="root"]')
}

/** One conduit circle, addressed through the trench and conduit in its label. */
function canvasNode(page: Page, trenchId: string, conduit: string): Locator {
  return page
    .locator('.svelte-flow__node')
    .filter({ hasText: trenchId })
    .filter({ hasText: new RegExp(`${conduit}(?!a)`) })
}

/**
 * The dot of one microduct on a circle.
 *
 * Source and target handle of a microduct lie exactly on top of each other
 * (`PipeBranchNode.svelte` places both at the same coordinates), so the point is
 * the same for both ends of a drag.
 */
function microductDot(node: Locator, number: number): Locator {
  return node.locator(`.svelte-flow__handle[data-handleid$="-microduct-${number}-source"]`)
}

/**
 * Opens the pipe branch on a freshly created page, picks the node and loads all
 * trenches onto the canvas.
 *
 * Everything up to and including the canvas is cut away by postProcessVideo()
 * later - the videos start at the moment the section describes, not at the page
 * load. Only the returned page carries the replica cursor.
 */
async function openCanvas(page: Page) {
  await page.goto('/pipe-branch')
  await expect(page).toHaveURL(/\/pipe-branch\/2(\/|$)/)
  await page.waitForLoadState('networkidle')

  await showCursor(page)

  // Picked without the replica cursor moving to it on purpose: node and trench
  // selection are a precondition of both sections, not part of what they show.
  await page.getByPlaceholder('Rohrverzweigung auswählen', { exact: true }).click()
  await page.getByRole('option', { name: NODE, exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Trassen auswählen' })).toBeVisible()

  await page.getByRole('button', { name: 'Alle auswählen' }).click()
  await page.getByRole('button', { name: 'Auf Canvas laden' }).click()

  await expect(page.locator('.svelte-flow__node')).toHaveCount(5)
  await expect(page.locator('.svelte-flow__edge')).toHaveCount(DEMO_CONNECTIONS.length)

  // `fitView` runs as an animation after the nodes are in the DOM.
  await page.waitForTimeout(1500)
}

/**
 * Drags the mouse along a series of points with the button held down, at hand
 * speed - the lasso of section 12.3.2 needs a path, not the straight line
 * drag() from playwright/manual-videos.ts draws.
 *
 * The lasso collects the pointer positions and selects every circle whose centre
 * lies inside the closed stroke (`PipeBranchLasso.svelte`). Two positions would
 * leave a line without an interior and select nothing, hence the intermediate
 * steps between the waypoints.
 */
async function dragAlong(page: Page, waypoints: Array<{ x: number; y: number }>) {
  await page.mouse.down()
  await page.waitForTimeout(200)

  for (let i = 1; i < waypoints.length; i++) {
    const from = waypoints[i - 1]
    const to = waypoints[i]
    const steps = 10
    for (let step = 1; step <= steps; step++) {
      const t = step / steps
      await page.mouse.move(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t)
      await page.waitForTimeout(45)
    }
  }

  await page.waitForTimeout(150)
  await page.mouse.up()
}

/**
 * Warm-up page. It fills the HTTP cache of the context, so that the actual
 * recording page is up within a fraction of a second - Playwright records a page
 * from its creation, and a long page load would end up in the video.
 */
async function warmUp(page: Page) {
  await page.goto('/pipe-branch')
  await expect(page.getByPlaceholder('Rohrverzweigung auswählen', { exact: true })).toBeVisible()
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
// 12.3.1 Connect two microducts by dragging
// ---------------------------------------------------------------------------

test('12.3.1 Einzelne Mikrorohre verbinden', async ({ page, context }) => {
  test.setTimeout(180_000)

  await warmUp(page)

  const capture = await context.newPage()
  const pageStart = Date.now()

  await openCanvas(capture)

  const from = microductDot(canvasNode(capture, PAIR[0].trench, PAIR[0].conduit), 1)
  const to = microductDot(canvasNode(capture, PAIR[1].trench, PAIR[1].conduit), 1)

  // Seeds the starting point of the cursor motion, so that the first step of the
  // demonstration does not begin with a jump.
  const start = (await from.boundingBox())!
  await pointAt(capture, { x: start.x + start.width / 2, y: start.y + 200 }, { duration: 400 })

  // From here the demonstration runs; everything before it is cut away.
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. Onto the dot of microduct 1 of the first conduit.
  await pointAt(capture, from, { duration: 900 })
  await capture.waitForTimeout(500)

  // 2. Drag onto the dot of the same number on the second conduit. Deliberately
  //    not drag() from manual-videos.ts: that takes an offset, and the second
  //    dot is measured, not calculated.
  const target = (await to.boundingBox())!
  await dragAlong(capture, [
    { x: start.x + start.width / 2, y: start.y + start.height / 2 },
    { x: target.x + target.width / 2, y: target.y + target.height / 2 },
  ])

  // 3. The connection is saved with the release; the line carries the two
  //    numbers from that moment on.
  await expect(capture.getByText('Verbindung erfolgreich erstellt')).toBeVisible({
    timeout: 20_000,
  })
  await expect(capture.locator('.svelte-flow__edge')).toHaveCount(DEMO_CONNECTIONS.length + 1)

  // Out of the way, so that the last frames show no hover state, and long enough
  // for the message to have faded - the video ends on the state that stays.
  await pointAt(capture, { x: 500, y: 950 }, { duration: 600 })
  await expect(capture.getByText('Verbindung erfolgreich erstellt')).toBeHidden({
    timeout: 20_000,
  })
  await capture.waitForTimeout(1200)

  await saveVideo(capture, 'pipe_branch_connect', pageStart, demoStart)
})

// ---------------------------------------------------------------------------
// 12.3.2 Lasso two conduits and connect them at once
// ---------------------------------------------------------------------------

test('12.3.2 Auto-Verbindung', async ({ page, context }) => {
  test.setTimeout(180_000)

  await warmUp(page)

  const capture = await context.newPage()
  const pageStart = Date.now()

  await openCanvas(capture)

  const circles = await Promise.all(
    PAIR.map(async (entry) => (await canvasNode(capture, entry.trench, entry.conduit).boundingBox())!),
  )

  // The loop around both circles. It has to stay clear of the card
  // "Eigenschaften": the lasso starts with a `pointerdown`, and one that lands on
  // the card never reaches the overlay canvas.
  const margin = 50
  const left = Math.min(...circles.map((box) => box.x)) - margin
  const right = Math.max(...circles.map((box) => box.x + box.width)) + margin
  const top = Math.min(...circles.map((box) => box.y)) - margin
  const bottom = Math.min(Math.max(...circles.map((box) => box.y + box.height)) + margin, 1100)
  const loop = [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
    { x: left, y: top },
  ]

  await pointAt(capture, { x: left, y: top + 200 }, { duration: 400 })

  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. Switch the auto connection on. Addressed through the data attributes of
  //    the design system: the caption "Auto-Verbindung:" is a `span` next to the
  //    switch, not a label around it, so a filter by text finds nothing.
  await click(capture, autoConnectSwitch(capture), { duration: 800 })
  await expect(capture.locator('canvas.tool-overlay')).toBeVisible()
  await capture.waitForTimeout(700)

  // 2. Draw the lasso around the two conduits.
  await pointAt(capture, loop[0], { duration: 800 })
  await dragAlong(capture, loop)
  await expect(capture.getByText('Ausgewählt: 2')).toBeVisible()
  await capture.waitForTimeout(900)

  // 3. Connect everything of the same number in one go.
  await click(capture, capture.getByRole('button', { name: 'Ausgewählte Netzknoten verbinden' }), {
    duration: 900,
  })

  await expect(capture.getByText('Verbindungen erfolgreich erstellt')).toBeVisible({
    timeout: 30_000,
  })
  await expect(capture.locator('.svelte-flow__edge')).toHaveCount(DEMO_CONNECTIONS.length + 7)

  await pointAt(capture, { x: 500, y: 950 }, { duration: 600 })
  await capture.waitForTimeout(2500)

  await saveVideo(capture, 'pipe_branch_auto_connect', pageStart, demoStart)
})
