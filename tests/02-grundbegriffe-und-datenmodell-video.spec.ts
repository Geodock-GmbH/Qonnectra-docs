// Video for chapter "2. Grundbegriffe und Datenmodell" in the manual
// (manual/teil-a-anwenderhandbuch/02-grundbegriffe-und-datenmodell.md),
// section 2.3 "Netzknoten, Container, Slots, Komponenten und Ports":
//
//   model_node_component   slot grid -> ports of a component -> back
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in
// tests/02-grundbegriffe-und-datenmodell.spec.ts.
//
// This flow is movement, not state: the slot grid and the port table are two
// views of the **same** window, and the window title stays "Netzknotenstruktur"
// in both. A still image of either shows a table without showing that a click
// on the component swapped one for the other - and without showing that
// "Zurück" is the way back. The two still images of the chapter (the maximised
// port table) and of chapter 5 (the grid) each show one of the two ends.
//
// Publish to public/videos/ with:
//   pnpm screenshots:publish 02-grundbegriffe-und-datenmodell --videos
import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'

import { localApp, superuserCredentials } from '../playwright/local-app'
import { click, pointAt, postProcessVideo, showCursor, videoPath } from '../playwright/manual-videos'

const CHAPTER = '02-grundbegriffe-und-datenmodell'

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Larger than the viewport gains nothing: Chromium's screencast
// delivers CSS pixels, the deviceScaleFactor of 2 has no effect here (see
// PostProcessOptions.scale in playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

/** Padding around the window in the crop, in CSS pixels. */
const CROP_PADDING = 16

/**
 * Node, view and setup of the recording - the same as for the image
 * model_node_ports in tests/02-grundbegriffe-und-datenmodell.spec.ts.
 *
 * The demo project brings no slot configurations, structures or splices with it
 * (all three endpoints are empty), so the window would only show "Keine
 * Slot-Konfigurationen gefunden". They are therefore created through the API
 * before the recording and removed again afterwards.
 */
const NODE = 'St-V02'
const VIEW = { center: [1083576.9, 7308651.3], zoom: 19 }
const SLOT_CONFIG = { side: 'A', totalSlots: 12 }
const COMPONENT = { type: 'Spleisskassette', slotStart: 1, slotEnd: 1 }

/** Ports that get a splice; the rest stay free and visibly empty. */
const SPLICED_PORTS = 6

// ---------------------------------------------------------------------------
// Setup through the API
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

/** UUID of the node named NODE. The endpoint answers paginated and as GeoJSON. */
async function nodeUuid(api: APIRequestContext): Promise<string> {
  const body = await (await api.get(`/api/v1/node/?name=${encodeURIComponent(NODE)}`)).json()
  const features: Array<{ id: string; properties?: { name?: string } }> =
    body.results?.features ?? []

  const match = features.find((feature) => feature.properties?.name === NODE)
  expect(match, `The node "${NODE}" is missing in the test project.`).toBeTruthy()
  return match!.id
}

/** Removes all slot configurations of the node - and with them structures and splices. */
async function removeSlotConfigurations(api: APIRequestContext, uuid: string) {
  const body = await (await api.get('/api/v1/node-slot-configuration/?page_size=200')).json()
  const rows = Array.isArray(body) ? body : (body.results ?? [])

  for (const row of rows) {
    if ((row.uuid_node?.id ?? row.uuid_node) !== uuid) continue
    await api.delete(`/api/v1/node-slot-configuration/${row.uuid}/`)
  }
}

/** Creates the configuration, the component and its splices at the node. */
async function createComponentWithPorts(api: APIRequestContext, uuid: string) {
  const typesBody = await (await api.get('/api/v1/attributes_component_type/')).json()
  const types: Array<{ id: number; component_type: string }> = Array.isArray(typesBody)
    ? typesBody
    : (typesBody.results ?? [])
  const type = types.find((entry) => entry.component_type === COMPONENT.type)
  expect(
    type,
    `The component type "${COMPONENT.type}" is missing in the instance - has the ` +
      'attribute table changed?',
  ).toBeTruthy()

  const config = await (
    await api.post('/api/v1/node-slot-configuration/', {
      data: { uuid_node_id: uuid, side: SLOT_CONFIG.side, total_slots: SLOT_CONFIG.totalSlots },
    })
  ).json()
  const structure = await (
    await api.post('/api/v1/node-structure/', {
      data: {
        uuid_node_id: uuid,
        slot_configuration_id: config.uuid,
        component_type_id: type!.id,
        slot_start: COMPONENT.slotStart,
        slot_end: COMPONENT.slotEnd,
      },
    })
  ).json()

  const cablesBody = await (await api.get('/api/v1/cable/?page_size=200')).json()
  const cables: Array<{
    uuid: string
    name: string
    uuid_node_start: string | null
    uuid_node_end: string | null
  }> = Array.isArray(cablesBody) ? cablesBody : (cablesBody.results ?? [])
  const atNode = cables
    .filter((cable) => cable.uuid_node_start === uuid || cable.uuid_node_end === uuid)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
  expect(
    atNode.length,
    `The node "${NODE}" needs at least ${SPLICED_PORTS + 1} cables for the splices.`,
  ).toBeGreaterThan(SPLICED_PORTS)

  const fibersOf = async (cable: string) => {
    const body = await (await api.get(`/api/v1/fiber/?uuid_cable=${cable}&page_size=500`)).json()
    const fibers: Array<{ uuid: string; uuid_cable: string; fiber_number_absolute: number }> =
      Array.isArray(body) ? body : (body.results ?? [])
    // The endpoint ignores an unknown filter and would then answer with every
    // fiber of the project, so filter once more here.
    return fibers
      .filter((fiber) => fiber.uuid_cable === cable)
      .sort((a, b) => a.fiber_number_absolute - b.fiber_number_absolute)
  }

  const feeder = atNode[0]
  const feederFibers = await fibersOf(feeder.uuid)

  for (let port = 1; port <= SPLICED_PORTS; port++) {
    const other = atNode[port]
    const otherFibers = await fibersOf(other.uuid)
    if (otherFibers.length === 0) continue

    const response = await api.post('/api/v1/fiber-splice/', {
      data: {
        node_structure: structure.uuid,
        port_number: port,
        fiber_a: feederFibers[port - 1].uuid,
        cable_a: feeder.uuid,
        fiber_b: otherFibers[0].uuid,
        cable_b: other.uuid,
      },
    })
    expect(response.ok(), `The splice at port ${port} could not be created.`).toBe(true)
  }
}

// ---------------------------------------------------------------------------
// Building blocks of the recording
// ---------------------------------------------------------------------------

/**
 * Warm-up page. It fills the HTTP cache of the context, so that the actual
 * recording page is up within a fraction of a second - Playwright records a
 * page from its creation, and a long page load would end up in the video.
 */
async function warmUp(page: Page) {
  await page.goto('/map')
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.close()
}

/**
 * Opens the structure window of the node on a freshly created page.
 *
 * Everything up to and including the open window is cut away by
 * postProcessVideo() later - the video starts at the moment section 2.3
 * describes, not at the page load. The clicks needed for it therefore run
 * without the replica cursor.
 *
 * The layer "Gebiet" is hidden before the click on the map: its surface covers
 * the entire network, and without that a near miss selects the area instead of
 * the node.
 */
async function openStructure(page: Page) {
  await page.addInitScript((view) => {
    localStorage.setItem('mapCenter', JSON.stringify(view.center))
    localStorage.setItem('mapZoom', JSON.stringify(view.zoom))
    localStorage.setItem('drawerWidth', '400')
  }, VIEW)

  await page.goto('/map')
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForTimeout(2500)

  const legend = page
    .getByRole('button', { name: /^Layer-Liste (ein|aus)klappen$/ })
    .locator('xpath=../..')
  await legend
    .getByText('Gebiet', { exact: true })
    .locator('xpath=..')
    .getByRole('button', { name: 'Layer ausblenden' })
    .click()
  await page.waitForTimeout(800)

  const map = page.locator('div.map')
  const box = (await map.boundingBox())!
  const title = page.locator('#drawer-title')
  for (const [dx, dy] of [
    [0, 0],
    [0, -4],
    [0, 4],
    [-4, 0],
    [4, 0],
  ]) {
    await map.click({ position: { x: box.width / 2 + dx, y: box.height / 2 + dy } })
    if ((await title.isVisible()) && (await title.textContent()) === NODE) break
  }
  await expect(
    title,
    `"${NODE}" was not hit at the map centre - does the view still sit on the node?`,
  ).toHaveText(NODE)

  const drawer = page.locator('[data-drawer]')
  await drawer.getByRole('tab', { name: 'Aktionen', exact: true }).click()
  await drawer.getByRole('button', { name: 'Struktur anzeigen' }).click()

  const panel = page
    .locator('[data-scope="floating-panel"][data-part="content"]')
    .filter({ hasText: 'Netzknotenstruktur' })
  await expect(panel).toBeVisible()
  // The grid only fills once the side has been chosen and its structures are in.
  await expect(panel.getByText(COMPONENT.type, { exact: true })).toBeVisible()
  await page.waitForTimeout(1200)

  await showCursor(page)
  return panel
}

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------

test.describe('Komponente mit Ports', () => {
  let api: APIRequestContext
  let uuid: string

  test.beforeAll(async () => {
    // Superuser, because the clean-up deletes: the capture account belongs to
    // the group "Editor", which may create but not delete
    // (`RoleBasedPermission` answers DELETE with 403).
    api = await apiContext(superuserCredentials())
    uuid = await nodeUuid(api)
    // Also runs before creating: an aborted run would otherwise leave the
    // configuration behind and the next one would create it a second time.
    await removeSlotConfigurations(api, uuid)
    await createComponentWithPorts(api, uuid)
  })

  test.afterAll(async () => {
    await removeSlotConfigurations(api, uuid)
    await api.dispose()
  })

  test('2.3 Von den Slots in die Ports einer Komponente', async ({ page, context }) => {
    test.setTimeout(240_000)

    await warmUp(page)

    const capture = await context.newPage()
    const pageStart = Date.now()
    const panel = await openStructure(capture)

    // From here the demonstration runs; everything before it is cut away.
    const demoStart = Date.now()
    await capture.waitForTimeout(LEAD_IN * 1000)

    // 1. The component in the slot grid. Pointing at it first: the row only
    //    looks clickable while the cursor is on it.
    const component = panel.getByText(COMPONENT.type, { exact: true })
    await pointAt(capture, component, { duration: 700 })
    await capture.waitForTimeout(900)

    // 2. The click swaps the grid for the ports of the component.
    await click(capture, component, { duration: 200 })
    await expect(panel.getByText('Faser A', { exact: true })).toBeVisible()
    await capture.waitForTimeout(1600)

    // 3. Along the port list: the occupied ports carry a fiber on both sides,
    //    the ones from SPLICED_PORTS on are empty.
    await pointAt(capture, panel.getByText('Faser B', { exact: true }), { duration: 600 })
    await capture.waitForTimeout(1800)

    // 4. "Zurück" is the way back to the grid - the window keeps its title in
    //    both views, so without this step the reader is left in the port table.
    await click(capture, panel.getByRole('button', { name: 'Zurück' }), { duration: 700 })
    // The slot grid is built from divs, not from a table - hence the plain text
    // and not getByRole('columnheader').
    await expect(panel.getByText('Komponente', { exact: true })).toBeVisible()
    await capture.waitForTimeout(1800)

    // 5. Crop to the window, with a little air around it.
    const box = (await panel.boundingBox())!
    const viewport = capture.viewportSize()!
    const crop = {
      x: Math.max(0, Math.round(box.x - CROP_PADDING)),
      y: Math.max(0, Math.round(box.y - CROP_PADDING)),
      width: 0,
      height: 0,
    }
    crop.width = Math.min(viewport.width - crop.x, Math.round(box.width + CROP_PADDING * 2))
    crop.height = Math.min(viewport.height - crop.y, Math.round(box.height + CROP_PADDING * 2))

    const video = capture.video()
    expect(video, 'Playwright recorded no video - check test.use({ video }).').toBeTruthy()
    await capture.close()

    const raw = test.info().outputPath('model_node_component-raw.webm')
    await video!.saveAs(raw)

    postProcessVideo({
      source: raw,
      target: videoPath(CHAPTER, 'model_node_component'),
      crop,
      startAt: Math.max(0, (demoStart - pageStart) / 1000 - LEAD_IN),
    })
  })
})
