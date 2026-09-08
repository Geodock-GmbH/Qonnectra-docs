import {
  expect,
  request,
  test,
  type APIRequestContext,
  type Locator,
  type Page,
} from '@playwright/test'

import { localApp, superuserCredentials } from '../playwright/local-app'
import {
  crop16by10,
  disableAnimations,
  moveCursorAway,
  shotPath,
  spotlight,
} from '../playwright/manual-shots'

// Screenshots for chapter "2. Grundbegriffe und Datenmodell" in the manual
// (manual/teil-a-anwenderhandbuch/02-grundbegriffe-und-datenmodell.md).
//
// The chapter explains the objects Qonnectra keeps and how they nest inside one
// another. Its images therefore do not show one menu item but the places where
// a nesting is visible in a single frame - which is why they come from five
// different views:
//
//   model_objects             map with trenches, nodes, addresses and areas (pattern 1)
//   model_conduit_microducts  microducts of a conduit, "Mikrorohre" (crop 16 : 10)
//   model_cable_fibers        bundles and fibers of a cable, network schema (crop 16 : 10)
//   model_node_ports          ports of a component with fiber A and B (crop 16 : 10)
//   model_address_units       residential units and microduct of an address (pattern 2)
//   model_area                areas and their types in the legend (pattern 2)
//   model_flag                column "Kennzeichen" of the conduit table (pattern 2)
//   model_master_data         opened selection list "Status" (pattern 2)
//
// The video of the chapter (model_conduit_trenches.webm) sits in
// tests/02-grundbegriffe-und-datenmodell-video.spec.ts - test.use({ video: ... })
// is only allowed at file level.
//
// Publish to public/images/ with:
//   pnpm screenshots:publish 02-grundbegriffe-und-datenmodell
const CHAPTER = '02-grundbegriffe-und-datenmodell'

/**
 * Width the info box is opened at, in CSS pixels. Every table this chapter
 * shows inside it - the microducts of a conduit, the fibers of a bundle - loses
 * its last columns at the default of 400 px. Widening the box is what section
 * 3.6 describes anyway; the value is seeded through `localStorage` so that no
 * drag has to be faked.
 */
const DRAWER_WIDTH = 760

/**
 * Width for the microduct table of section 2.1. It carries two more columns
 * than the fiber table ("Adresse" and "Kabel") plus the buttons "Zuordnen" and
 * "Aufheben"; at 760 px the last button sits outside the box.
 */
const MICRODUCT_DRAWER_WIDTH = 940

/** Map extents in EPSG:3857. The map has no auto-fit, see playwright/auth.setup.ts. */
const VIEW = {
  /**
   * Streets "Toft" and "Westerstraße" with their house connections: at this
   * zoom trenches, nodes and addresses are three visibly different symbols, and
   * the edge of the project area runs through the picture.
   */
  objects: { center: [1083600, 7308650], zoom: 18 },
  /**
   * Whole network. Both areas of the test project cover a part of it - at a
   * closer zoom the picture would show a green surface without an edge.
   */
  areas: { center: [1083532, 7308590], zoom: 15.5 },
  /** Node St-V02, the node with by far the most cables (24). */
  node: { center: [1083576.9, 7308651.3], zoom: 19 },
  /** Trench TR-W55WVN3 - carries three conduits of type 12x10/6. */
  trench: { center: [1083567.4, 7308614.4], zoom: 19 },
}

/** Trench the microduct table is shown for, and one of its three conduits. */
const TRENCH = 'TR-W55WVN3'
const TRENCH_CONDUIT = 'St-V02-01 (12x10/6)'

/** Cable of type LTMC288(12x24) - 12 bundles of 24 fibers each. */
const CABLE = 'St-S01-288-Fs'

/** Address of the test project with three residential units and one microduct. */
const ADDRESS = { uuid: 'a4480fd3-72c4-4582-8e37-1af6f67e22e5', title: 'Toft 1' }

/** Conduit whose info box shows the selection list "Status". */
const CONDUIT = 'St-V02-01'

/** Node the component with its ports is created at (see the describe block). */
const NODE = 'St-V02'

// ---------------------------------------------------------------------------
// Building blocks of the interface
// ---------------------------------------------------------------------------

/**
 * Opens a view with a map of the test project and waits until it is fully
 * drawn.
 *
 * The view is set through `addInitScript`, i.e. before every load of the
 * document. The obvious route - load, set `localStorage`, reload - has a race
 * condition: the app writes `mapCenter`/`mapZoom` back on every `moveend`, and
 * if that write-back lands between setting and reloading the seed is gone
 * again and the map starts at the overview.
 */
async function openMapView(
  page: Page,
  path: string,
  view: { center: number[]; zoom: number },
  drawerWidth = DRAWER_WIDTH,
) {
  await page.addInitScript(
    (a) => {
      localStorage.setItem('mapCenter', JSON.stringify(a.view.center))
      localStorage.setItem('mapZoom', JSON.stringify(a.view.zoom))
      localStorage.setItem('drawerWidth', String(a.width))
    },
    { view, width: drawerWidth },
  )

  await page.goto(path)
  // With a running tileserver (vector tiles) OpenLayers creates a second
  // canvas, without it (OSM raster fallback) only one - hence .first().
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForTimeout(2500)

  await disableAnimations(page)
  await moveCursorAway(page)
}

/** Opens the conduit management of the test project and waits for the table. */
async function openConduits(page: Page, drawerWidth = DRAWER_WIDTH) {
  await page.addInitScript((width) => {
    localStorage.setItem('drawerWidth', String(width))
  }, drawerWidth)

  await page.goto('/conduit')
  await expect(page).toHaveURL(/\/conduit\/2(\/|$)/)
  await expect(page.locator('table tbody tr').first()).toBeVisible()
  await page.waitForLoadState('networkidle')

  await disableAnimations(page)
  await moveCursorAway(page)
}

/** Legend panel "Layer" in the top right. */
function legend(page: Page): Locator {
  return page
    .getByRole('button', { name: /^Layer-Liste (ein|aus)klappen$/ })
    .locator('xpath=../..')
}

/** Row of a layer in the legend, e.g. "Gebiet". */
function legendRow(page: Page, name: string): Locator {
  return legend(page).getByText(name, { exact: true }).locator('xpath=..')
}

/**
 * Selects the object at the map centre and waits for its info box.
 *
 * The layer "Gebiet" is hidden beforehand: its surface covers the entire
 * network, and without that a near miss selects the area instead of the object.
 * A small cross around the centre is tried, because a trench line is only a few
 * pixels wide.
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
 * Crop around the info box, anchored at the right window edge: from the top of
 * the box down to the bottom of the window, widened to 16 : 10.
 *
 * The height is deliberately maxed out. The tables of this chapter are the
 * point of the images - twelve microducts, twenty-four fibers - and a crop
 * expanded to 16 : 10 from the box alone would show three rows. Reaching down
 * to the window edge makes the crop as wide as possible, so a strip of the view
 * to the left of the box comes along; that is what tells the reader which view
 * the box belongs to.
 *
 * On the left the crop stops at the navigation bar. Without that limit it
 * reaches into the bar and cuts its labels in half, and the reader is left
 * looking at word fragments that do not exist in the app.
 */
async function drawerClip(page: Page, drawer: Locator) {
  const box = (await drawer.boundingBox())!
  const viewport = page.viewportSize()!

  // Scroll container of the navigation bar (SideBar.svelte); its right edge is
  // where the content area starts.
  const sidebar = (await page
    .locator('div[class*="grid-rows-[auto_1fr_auto]"]')
    .first()
    .boundingBox())!
  const left = Math.round(sidebar.x + sidebar.width)

  const y = Math.round(box.y)
  const height = Math.min(viewport.height - y, Math.round(((viewport.width - left) * 10) / 16))
  const width = Math.round((height * 16) / 10)

  return { x: viewport.width - width, y, width, height }
}

/** The floating window with the given title (FloatingPanel.svelte). */
function floatingPanel(page: Page, title: string): Locator {
  return page
    .locator('[data-scope="floating-panel"][data-part="content"]')
    .filter({ hasText: title })
}

/** The card of a section of the address details, addressed through its heading. */
function addressCard(page: Page, heading: string): Locator {
  return page
    .getByRole('heading', { name: heading, exact: true })
    .locator('xpath=ancestor::div[contains(concat(" ", @class, " "), " card ")][1]')
}

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

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

test('2. Objektarten in der Karte', async ({ page }) => {
  await openMapView(page, '/map', VIEW.objects)
  await page.screenshot({ path: shotPath(CHAPTER, 'model_objects') })
})

test('2.1 Mikrorohre eines Rohrs', async ({ page }) => {
  test.setTimeout(120_000)
  await openMapView(page, '/house-connections', VIEW.trench, MICRODUCT_DRAWER_WIDTH)
  await selectAtCentre(page, TRENCH)

  const drawer = page.locator('[data-drawer]')

  // The conduits of the trench are collapsed; only expanding one loads its
  // microducts. Without that the image would show three closed rows.
  await drawer.getByText(TRENCH_CONDUIT, { exact: true }).click()
  await expect(drawer.getByRole('columnheader', { name: 'Farbe' })).toBeVisible()

  await moveCursorAway(page)
  await page.waitForTimeout(1000)

  await page.screenshot({
    path: shotPath(CHAPTER, 'model_conduit_microducts'),
    clip: await drawerClip(page, drawer),
  })
})

test('2.2 Bündel und Fasern eines Kabels', async ({ page }) => {
  test.setTimeout(120_000)
  await page.addInitScript((width) => {
    localStorage.setItem('drawerWidth', String(width))
  }, DRAWER_WIDTH)

  await page.goto('/network-schema')
  await expect(page).toHaveURL(/\/network-schema\/2(\/|$)/)
  // The cable is an edge of the diagram; its label is what is clicked.
  await expect(page.getByText(CABLE, { exact: true })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  await disableAnimations(page)

  await page.getByText(CABLE, { exact: true }).click()
  await expect(page.locator('#drawer-title')).toHaveText(CABLE)

  const drawer = page.locator('[data-drawer]')
  await drawer.getByRole('tab', { name: 'Status', exact: true }).click()
  await expect(drawer.getByText('Bündel 1', { exact: true })).toBeVisible()

  // Expanding the first bundle is the point of the image: only then are the
  // fibers with their number, colour and status visible below the bundle.
  await drawer.getByText('Bündel 1', { exact: true }).click()
  await expect(drawer.getByRole('columnheader', { name: 'Farbe' })).toBeVisible()

  await moveCursorAway(page)
  await page.waitForTimeout(1000)

  await page.screenshot({
    path: shotPath(CHAPTER, 'model_cable_fibers'),
    clip: await drawerClip(page, drawer),
  })
})

test('2.4 Wohneinheiten einer Adresse', async ({ page }) => {
  await page.goto(`/address/2/${ADDRESS.uuid}`)
  await expect(page.getByRole('heading', { name: ADDRESS.title })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
  await disableAnimations(page)

  const units = addressCard(page, 'Wohneinheiten')
  const microducts = addressCard(page, 'Mikrorohrverbindungen')
  await units.scrollIntoViewIfNeeded()
  await moveCursorAway(page)
  await page.waitForTimeout(500)

  // Both places belong together: the address is the hinge between the building
  // side (its residential units) and the network side (the microduct it hangs
  // off).
  const spotlightOff = await spotlight(page, [microducts, units])
  await page.screenshot({ path: shotPath(CHAPTER, 'model_address_units') })
  await spotlightOff()
})

test('2.5 Gebiete und Gebietstypen', async ({ page }) => {
  await openMapView(page, '/map', VIEW.areas)

  // Expanding the entry is what the image is about: the sub-entries are the
  // area types the instance knows.
  await legendRow(page, 'Gebiet').getByRole('button', { name: 'Ausklappen' }).click()
  await moveCursorAway(page)
  await page.waitForTimeout(1000)

  const spotlightOff = await spotlight(page, legend(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'model_area') })
  await spotlightOff()
})

test('2.6 Kennzeichen an den Objekten', async ({ page }) => {
  await openConduits(page, 400)

  // Heading and search field of the column "Kennzeichen". Every column is
  // filterable (`columnConfig` in PipeTable.svelte), so the n-th input of the
  // filter row belongs to the n-th heading.
  const headings = await page.locator('table thead tr').first().locator('th').allInnerTexts()
  const index = headings.findIndex((text) => text.trim() === 'Kennzeichen')
  expect(
    index,
    'There is no column "Kennzeichen" - have the headings in PipeTable.svelte changed?',
  ).toBeGreaterThanOrEqual(0)

  const heading = page.locator('table thead tr').first().locator('th').nth(index)
  const filter = page.locator('table thead tr').nth(1).locator('input').nth(index)

  const spotlightOff = await spotlight(page, [heading, filter])
  await page.screenshot({ path: shotPath(CHAPTER, 'model_flag') })
  await spotlightOff()
})

test('2.7 Stammdaten in einer Auswahlliste', async ({ page }) => {
  await openConduits(page)

  await page
    .locator('table tbody tr')
    .filter({ has: page.getByRole('cell', { name: CONDUIT, exact: true }) })
    .click()
  await expect(page.locator('#drawer-title')).toHaveText(CONDUIT)

  const drawer = page.locator('[data-drawer]')
  // The box arrives with a Svelte transition (`transition:fly`, 300 ms), which
  // is driven by JavaScript and therefore not stopped by disableAnimations().
  await page.waitForTimeout(600)

  // Field "Status" of the form: `<label class="label"><span>Status</span>
  // <GenericCombobox/></label>` (ConduitAttributeCard.svelte). Addressed
  // through the label, because the tabs of the info box carry
  // `data-part="trigger"` as well.
  const field = drawer
    .locator('label.label')
    .filter({ has: page.getByText('Status', { exact: true }) })
  await field.locator('[data-scope="combobox"][data-part="trigger"]').click()

  // The list renders through a portal and therefore does not hang below the
  // field but at the end of the document (GenericCombobox.svelte).
  const list = page.getByRole('option', { name: 'dokumentiert' }).locator('xpath=..')
  await expect(list).toBeVisible()

  // After the click the cursor rests on the button and would highlight it.
  await moveCursorAway(page)
  await page.waitForTimeout(500)

  const spotlightOff = await spotlight(page, [field, list])
  await page.screenshot({ path: shotPath(CHAPTER, 'model_master_data') })
  await spotlightOff()
})

// ---------------------------------------------------------------------------
// Section 2.3: component with its ports at a node
// ---------------------------------------------------------------------------
//
// The demo project brings **no** slot configurations, structures or splices
// with it (checked against the API: all three endpoints are empty) - the
// structure window would only show "Keine Slot-Konfigurationen gefunden". The
// setup is therefore created through the API before the capture and removed
// again afterwards, the same way tests/05-karte.spec.ts handles the slot
// configuration of section 5.6.
//
// Containers are missing from the picture on purpose: `container-type` is
// global master data of the instance and answers POST with 405 - it can only be
// created in the Django administration. Section 2.3 therefore describes the
// container in words.

/** Side and size of the configuration the component is placed in. */
const SLOT_CONFIG = { side: 'A', totalSlots: 12 }

/**
 * Component the ports are shown of. A splice cassette occupies one slot and
 * brings 12 in and 12 out ports along (`attributes_component_structure`).
 */
const COMPONENT = { type: 'Spleisskassette', slotStart: 1, slotEnd: 1 }

/**
 * Number of ports that get a splice. Fewer than the twelve of the cassette on
 * purpose: the image should show occupied **and** free ports side by side.
 */
const SPLICED_PORTS = 6

interface ApiCable {
  uuid: string
  name: string
  uuid_node_start: string | null
  uuid_node_end: string | null
}

interface ApiFiber {
  uuid: string
  uuid_cable: string
  fiber_number_absolute: number
}

/** UUID of the node named NODE. */
async function nodeUuid(api: APIRequestContext): Promise<string> {
  // Filtered by `?name=`, not read from the full list: the endpoint caps
  // `page_size` at 100 and the test project has 118 nodes. It answers
  // paginated **and** as GeoJSON - the features sit in `results.features`, the
  // UUID in `id` of the feature.
  const response = await api.get(`/api/v1/node/?name=${encodeURIComponent(NODE)}`)
  const body = await response.json()
  const features: Array<{ id: string; properties?: { name?: string } }> =
    body.results?.features ?? []

  const match = features.find((feature) => feature.properties?.name === NODE)
  expect(match, `The node "${NODE}" is missing in the test project.`).toBeTruthy()
  return match!.id
}

/** Removes all slot configurations of the node - and with them structures and splices. */
async function removeSlotConfigurations(api: APIRequestContext, uuid: string) {
  const response = await api.get('/api/v1/node-slot-configuration/?page_size=200')
  const body = await response.json()
  const rows = Array.isArray(body) ? body : (body.results ?? [])

  for (const row of rows) {
    if ((row.uuid_node?.id ?? row.uuid_node) !== uuid) continue
    await api.delete(`/api/v1/node-slot-configuration/${row.uuid}/`)
  }
}

/** Cables that start or end at the node, sorted by name. */
async function cablesAtNode(api: APIRequestContext, uuid: string): Promise<ApiCable[]> {
  const body = await (await api.get('/api/v1/cable/?page_size=200')).json()
  const cables: ApiCable[] = Array.isArray(body) ? body : (body.results ?? [])

  return cables
    .filter((cable) => cable.uuid_node_start === uuid || cable.uuid_node_end === uuid)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

/** Fibers of a cable, sorted by their running number. */
async function fibersOfCable(api: APIRequestContext, uuid: string): Promise<ApiFiber[]> {
  const body = await (await api.get(`/api/v1/fiber/?uuid_cable=${uuid}&page_size=500`)).json()
  const fibers: ApiFiber[] = Array.isArray(body) ? body : (body.results ?? [])

  // The endpoint ignores an unknown filter and would then answer with every
  // fiber of the project (1002 of them), so filter once more here.
  return fibers
    .filter((fiber) => fiber.uuid_cable === uuid)
    .sort((a, b) => a.fiber_number_absolute - b.fiber_number_absolute)
}

/**
 * Creates the configuration, the component and its splices at the node.
 *
 * Splices are what the image is about: without them the ports table stands
 * there with empty columns "Faser A" and "Faser B". Fiber n of the first cable
 * is joined to fiber 1 of the n-th following cable - the case a splice cassette
 * exists for, and in the picture the two columns then carry different cable
 * names.
 */
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

  const configResponse = await api.post('/api/v1/node-slot-configuration/', {
    data: { uuid_node_id: uuid, side: SLOT_CONFIG.side, total_slots: SLOT_CONFIG.totalSlots },
  })
  expect(
    configResponse.ok(),
    `Slot configuration "${SLOT_CONFIG.side}" could not be created.`,
  ).toBe(true)
  const configUuid = (await configResponse.json()).uuid

  const structureResponse = await api.post('/api/v1/node-structure/', {
    data: {
      uuid_node_id: uuid,
      slot_configuration_id: configUuid,
      component_type_id: type!.id,
      slot_start: COMPONENT.slotStart,
      slot_end: COMPONENT.slotEnd,
    },
  })
  expect(
    structureResponse.ok(),
    `The component "${COMPONENT.type}" could not be placed.`,
  ).toBe(true)
  const structureUuid = (await structureResponse.json()).uuid

  const cables = await cablesAtNode(api, uuid)
  expect(
    cables.length,
    `The node "${NODE}" needs at least ${SPLICED_PORTS + 1} cables for the splices.`,
  ).toBeGreaterThan(SPLICED_PORTS)

  const feeder = cables[0]
  const feederFibers = await fibersOfCable(api, feeder.uuid)
  expect(
    feederFibers.length,
    `The cable "${feeder.name}" has fewer than ${SPLICED_PORTS} fibers.`,
  ).toBeGreaterThanOrEqual(SPLICED_PORTS)

  for (let port = 1; port <= SPLICED_PORTS; port++) {
    const other = cables[port]
    const otherFibers = await fibersOfCable(api, other.uuid)
    if (otherFibers.length === 0) continue

    const response = await api.post('/api/v1/fiber-splice/', {
      data: {
        node_structure: structureUuid,
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

  test('2.3 Ports einer Komponente', async ({ page }) => {
    test.setTimeout(120_000)
    await openMapView(page, '/map', VIEW.node)
    await selectAtCentre(page, NODE)

    const drawer = page.locator('[data-drawer]')
    await drawer.getByRole('tab', { name: 'Aktionen', exact: true }).click()
    await drawer.getByRole('button', { name: 'Struktur anzeigen' }).click()

    const panel = floatingPanel(page, 'Netzknotenstruktur')
    await expect(panel).toBeVisible()

    // The grid only fills once the side has been chosen and its structures are
    // in. A click on the component then swaps the grid for its ports.
    const component = panel.getByText(COMPONENT.type, { exact: true })
    await expect(component).toBeVisible()
    await component.click()
    await expect(panel.getByText('Faser A', { exact: true })).toBeVisible()

    // Maximise the window. In its default size the port list scrolls after five
    // rows, and the image would show occupied ports only - the free ones from
    // SPLICED_PORTS on are exactly what makes the difference visible.
    //
    // Addressed through `data-stage` and not through its name: the window
    // controls are icon buttons whose `aria-label` comes from Skeleton and is
    // English even with the interface on German ("Maximize window").
    await panel.locator('[data-part="stage-trigger"][data-stage="maximized"]').click()
    await moveCursorAway(page)
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: shotPath(CHAPTER, 'model_node_ports'),
      clip: await crop16by10(page, panel),
    })
  })
})
