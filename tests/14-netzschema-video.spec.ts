// Videos for chapter "14. Netzschema" in the manual
// (manual/teil-a-anwenderhandbuch/14-netzschema.md):
//
//   schema_cable_connect  14.2    a cable is created by dragging between two nodes
//   schema_cable_path     14.4.1  a vertex is added to a cable and dragged
//   schema_splice_drag    14.8    a fiber is dragged from the rail onto a port
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in tests/14-netzschema.spec.ts.
//
// All three flows are movement, not state: a still image would show the diagram
// before or after, but not that a cable comes from a drag between two handles,
// that a click on the line produces the vertex, or where a fiber comes from.
//
// Every recording writes, and every recording cleans up after itself through the
// API - before **and** after the run, so that an aborted attempt does not leave
// the next one with a leftover. The clean-up uses the superuser: the group
// "Editor" of the capture account has level "edit" on all domain models and may
// not DELETE (`RoleBasedPermission` answers with 403).
//
// Publish to public/videos/ with: pnpm screenshots:publish 14-netzschema
import { expect, request, test, type APIRequestContext, type Locator, type Page } from '@playwright/test'

import { localApp, superuserCredentials } from '../playwright/local-app'
import { click, drag, pointAt, postProcessVideo, showCursor, typeText, videoPath } from '../playwright/manual-videos'

const CHAPTER = '14-netzschema'

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Larger than the viewport gains nothing: Chromium's screencast delivers
// CSS pixels, the deviceScaleFactor of 2 has no effect here (see
// PostProcessOptions.scale in playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/** Viewport of the diagram, as in tests/14-netzschema.spec.ts. */
const VIEW = { x: 320, y: 445, zoom: 1 }

/** The five cables of the demo data. Everything beyond them is a leftover. */
const DEMO_CABLES = [
  'St-S01-288-Fs',
  'St-V01-144-Fs',
  'St-V02-144-Fs',
  'St-V03-144-Fs',
  'St-V04-144-Fs',
]

/**
 * The cable the recording of section 14.2 creates.
 *
 * PoP-St and St-V02 are the pair with no cable between them, and both sit in the
 * left half of the diagram, close enough to the card "Eigenschaften" for one
 * crop to hold the fields and the two nodes at once.
 *
 * Neither node has an address, so the automatic microduct linking finds no
 * candidate and the dialog "Mikrorohr auswählen" stays out of the picture.
 */
const NEW_CABLE = {
  name: 'St-V05-144-Fs',
  type: 'LTMC144(12x12)',
  /**
   * Bottom of St-V02 to the left of PoP-St, not the shortest pair of sides: the
   * new line then runs through the empty middle of the diagram. From the right
   * side of St-V02 it would lie exactly on top of the two existing cables, and
   * the video would show a label appearing out of nowhere.
   */
  from: { node: 'St-V02', side: 'bottom' as const },
  to: { node: 'PoP-St', side: 'left' as const },
}

/** The cable that gets a vertex in section 14.4.1 - the vertical one in the middle. */
const PATH_CABLE = 'St-S01-288-Fs'

/**
 * The node the splice of section 14.8 is set at.
 *
 * St-V01 carries two splice cassettes with twelve free ports each and exactly
 * one cable, so the rail holds a single entry and no port has to be scrolled to.
 */
const SPLICE = { node: 'St-V01', component: 'Spleisskassette', cable: 'St-V01-144-Fs' }

/**
 * Crops in CSS pixels of the window (see the head of playwright/manual-videos.ts).
 *
 * All three stay below the 1000 px CLAUDE.md aims at, so the labels of the app
 * remain legible at the width the manual renders a video at (around 690 px).
 * They are measured against the seeded viewport: node St-V02 sits at x 620-740,
 * St-S01 at 980-1100, PoP-St at 980-1100 / y 897-1017. The lower edge holds the
 * message, which Qonnectra places at the bottom centre of the window.
 */
const CROP = {
  cable: { x: 300, y: 92, width: 840, height: 1028 },
  path: { x: 620, y: 400, width: 840, height: 720 },
  splice: { x: 430, y: 245, width: 930, height: 855 },
}

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

interface CableRecord {
  uuid: string
  name: string
  diagram_path: unknown | null
}

/** All cables of the test project. */
async function cables(api: APIRequestContext): Promise<CableRecord[]> {
  const response = await api.get('/api/v1/cable/all/?project=2')
  expect(response.ok(), 'The cables of the test project could not be read.').toBe(true)
  return (await response.json()) as CableRecord[]
}

/**
 * Puts the test project back into the state of the demo data: cables created by
 * a recording are deleted, and the diagram path of PATH_CABLE is cleared.
 *
 * Runs before **and** after every capture. The still images of the chapter show
 * five cables and straight lines and would otherwise fail on the leftover.
 */
async function restoreDemoState() {
  const api = await apiContext(superuserCredentials())
  try {
    for (const cable of await cables(api)) {
      if (!DEMO_CABLES.includes(cable.name)) {
        const deleted = await api.delete(`/api/v1/cable/${cable.uuid}/`)
        expect(
          deleted.ok(),
          `The leftover cable "${cable.name}" could not be deleted (HTTP ${deleted.status()}).`,
        ).toBe(true)
        continue
      }

      if (cable.diagram_path) {
        const reset = await api.patch(`/api/v1/cable/${cable.uuid}/`, {
          data: { diagram_path: null },
        })
        expect(
          reset.ok(),
          `The diagram path of "${cable.name}" could not be reset (HTTP ${reset.status()}).`,
        ).toBe(true)
      }
    }

    const left = await cables(api)
    expect(
      left.map((cable) => cable.name).sort(),
      'The cables of the test project differ from the demo data. Import it ' +
        'again with: scripts/setup-local-qonnectra.sh --reset',
    ).toEqual([...DEMO_CABLES].sort())

    await removeSplices(api)
  } finally {
    await api.dispose()
  }
}

/**
 * Removes every splice of the splice cassettes at SPLICE.node.
 *
 * The demo data has none there (its splices sit at PoP-St and St-S01), so
 * everything found is from a recording.
 */
async function removeSplices(api: APIRequestContext) {
  const node = (await (await api.get(`/api/v1/node/all/?project=2&name=${SPLICE.node}`)).json()) as {
    features?: { id: string; properties: { name: string } }[]
  }
  const feature = (node.features ?? []).find((entry) => entry.properties.name === SPLICE.node)
  expect(feature, `The node "${SPLICE.node}" is missing from the test project.`).toBeDefined()

  const tree = (await (await api.get(`/api/v1/container/tree/${feature!.id}/`)).json()) as {
    root_slot_configurations?: { uuid: string }[]
  }
  for (const config of tree.root_slot_configurations ?? []) {
    const structures = (await (
      await api.get(`/api/v1/node-structure/?slot_configuration=${config.uuid}`)
    ).json()) as { uuid: string }[]

    for (const structure of structures) {
      const splices = (await (
        await api.get(`/api/v1/fiber-splice/?node_structure=${structure.uuid}`)
      ).json()) as { uuid: string }[]

      for (const splice of splices) {
        const deleted = await api.delete(`/api/v1/fiber-splice/${splice.uuid}/`)
        expect(
          deleted.ok(),
          `A leftover splice at "${SPLICE.node}" could not be deleted (HTTP ${deleted.status()}).`,
        ).toBe(true)
      }
    }
  }
}

test.beforeEach(restoreDemoState)
test.afterEach(restoreDemoState)

// ---------------------------------------------------------------------------
// Building blocks of the interface
// ---------------------------------------------------------------------------

/** The card "Eigenschaften" in the top left corner of the canvas. */
function propertiesCard(page: Page): Locator {
  return page
    .locator('div.card')
    .filter({ has: page.getByRole('heading', { name: 'Eigenschaften', exact: true }) })
}

/** A node of the diagram, addressed through its name. */
function schemaNode(page: Page, name: string): Locator {
  return page.locator('.svelte-flow__node').filter({ hasText: name })
}

/** The label of a cable - the box on its line. */
function cableLabel(page: Page, name: string): Locator {
  return page.locator('foreignObject div[role="button"]').filter({ hasText: name })
}

/** One of the windows of a node, addressed through its title. */
function floatingPanel(page: Page, title: string): Locator {
  return page
    .locator('[data-scope="floating-panel"][data-part="content"]')
    .filter({ hasText: title })
}

/**
 * A point on one side of a node, in window coordinates - the fangpunkt a cable
 * docks onto.
 *
 * Measured from the node's own extent instead of addressed as a locator: each
 * side carries two handles on top of each other (source and target), and which
 * of them a locator picks decides nothing here - the connection starts at the
 * point.
 */
async function handlePoint(
  page: Page,
  name: string,
  side: 'top' | 'right' | 'bottom' | 'left',
): Promise<{ x: number; y: number }> {
  const box = (await schemaNode(page, name).boundingBox())!
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  switch (side) {
    case 'top':
      return { x: centre.x, y: box.y }
    case 'bottom':
      return { x: centre.x, y: box.y + box.height }
    case 'left':
      return { x: box.x, y: centre.y }
    case 'right':
      return { x: box.x + box.width, y: centre.y }
  }
}

/**
 * Opens the network schema on a freshly created page and unlocks the canvas.
 *
 * Everything up to here is cut away by postProcessVideo() later - the videos
 * start at the moment their section describes, not at the page load. Only the
 * returned page carries the replica cursor.
 */
async function openSchema(page: Page, { unlock = true }: { unlock?: boolean } = {}) {
  await page.goto('/network-schema')
  await expect(page).toHaveURL(/\/network-schema\/2(\/|$)/)
  await expect(page.locator('.svelte-flow__node')).toHaveCount(6)
  await expect(cableLabel(page, PATH_CABLE)).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  if (unlock) {
    // A precondition of the sections, not part of what they show: the button is
    // its own image in the chapter (schema_lock.jpg).
    await page.locator('.svelte-flow__controls').getByRole('button', {
      name: 'Zeichenfläche entsperren',
    }).click()
  }

  await showCursor(page)
}

/** Saves the recording of `page` and cuts off everything before `demoStart`. */
async function saveVideo(
  page: Page,
  name: string,
  crop: { x: number; y: number; width: number; height: number },
  pageStart: number,
  demoStart: number,
) {
  const video = page.video()
  expect(video, 'Playwright recorded no video - check test.use({ video }).').toBeTruthy()
  await page.close()

  const raw = test.info().outputPath(`${name}-raw.webm`)
  await video!.saveAs(raw)

  postProcessVideo({
    source: raw,
    target: videoPath(CHAPTER, name),
    crop,
    // Cut exactly at demoStart, not a lead-in earlier: before it the page is
    // still building itself. LEAD_IN is the still second **after** demoStart and
    // is therefore already part of the finished video.
    startAt: Math.max(0, (demoStart - pageStart) / 1000),
  })
}

/**
 * Fills the HTTP cache of the context, so that the actual recording page is up
 * within a fraction of a second - Playwright records a page from its creation,
 * and a long page load would end up in the video.
 */
async function warmUp(page: Page) {
  await page.goto('/network-schema')
  await expect(page.locator('.svelte-flow__node').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.close()
}

/** Seeds the state the recordings depend on, before the document loads. */
async function seed(page: Page, drawerWidth = 400) {
  await page.addInitScript(
    (state) => {
      localStorage.setItem('networkSchemaViewport', JSON.stringify(state.view))
      localStorage.setItem('drawerWidth', JSON.stringify(state.drawerWidth))
    },
    { view: VIEW, drawerWidth },
  )
}

// ---------------------------------------------------------------------------
// 14.2 Create a cable
// ---------------------------------------------------------------------------

test('14.2 Kabel anlegen', async ({ page, context }) => {
  test.setTimeout(240_000)
  await seed(page)
  await warmUp(page)

  const capture = await context.newPage()
  await seed(capture)
  const pageStart = Date.now()
  await openSchema(capture)

  const from = await handlePoint(capture, NEW_CABLE.from.node, NEW_CABLE.from.side)
  const to = await handlePoint(capture, NEW_CABLE.to.node, NEW_CABLE.to.side)
  const nameField = propertiesCard(capture).getByPlaceholder('Name', { exact: true })

  // Seeds the starting point of the cursor motion, so that the first step of the
  // demonstration does not begin with a jump.
  await pointAt(capture, { x: from.x, y: from.y + 240 }, { duration: 400 })

  // From here the demonstration runs; everything before it is cut away.
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. Name and cable type.
  await click(capture, nameField, { duration: 900 })
  await typeText(capture, NEW_CABLE.name)
  await capture.waitForTimeout(400)

  await click(
    capture,
    propertiesCard(capture).locator('[data-scope="combobox"][data-part="trigger"]'),
    { duration: 700 },
  )
  const option = capture.getByRole('option', { name: NEW_CABLE.type, exact: true })
  await expect(option).toBeVisible()
  await click(capture, option, { duration: 700 })
  await capture.waitForTimeout(600)

  // 2. Drag from the fangpunkt of one node to the fangpunkt of the other.
  await pointAt(capture, from, { duration: 900 })
  await drag(capture, to.x - from.x, to.y - from.y, { duration: 1400 })

  // 3. The cable is there, Qonnectra confirms.
  await expect(capture.getByText('Kabel erfolgreich erstellt')).toBeVisible({ timeout: 20_000 })
  await expect(cableLabel(capture, NEW_CABLE.name)).toBeVisible()

  // Out of the way, so that the last frames show no hover state, and long enough
  // for the message to have faded - the video ends on the state that stays: the
  // new line with its label.
  await pointAt(capture, { x: from.x - 120, y: from.y + 300 }, { duration: 700 })
  await expect(capture.getByText('Kabel erfolgreich erstellt')).toBeHidden({ timeout: 20_000 })
  await capture.waitForTimeout(1000)

  await saveVideo(capture, 'schema_cable_connect', CROP.cable, pageStart, demoStart)
})

// ---------------------------------------------------------------------------
// 14.4.1 Change the course of a cable
// ---------------------------------------------------------------------------

test('14.4.1 Scheitelpunkt setzen und ziehen', async ({ page, context }) => {
  test.setTimeout(240_000)
  await seed(page)
  await warmUp(page)

  const capture = await context.newPage()
  await seed(capture)
  const pageStart = Date.now()
  await openSchema(capture)

  const label = cableLabel(capture, PATH_CABLE)
  const labelBox = (await label.boundingBox())!

  // A point on the line, clear of the label: the line runs vertically between
  // St-S01 and PoP-St, the label sits in its middle.
  const onLine = { x: labelBox.x + labelBox.width / 2, y: labelBox.y - 70 }

  await pointAt(capture, { x: labelBox.x + labelBox.width, y: labelBox.y + 200 }, { duration: 400 })

  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. Right-click on the label opens the menu, "Kabel bearbeiten" switches the
  //    edit mode on. Aimed at the bottom right corner of the label so that the
  //    menu unfolds beside it instead of over it.
  await pointAt(capture, label, { duration: 900, fraction: { x: 0.9, y: 0.8 } })
  await capture.mouse.down({ button: 'right' })
  await capture.waitForTimeout(120)
  await capture.mouse.up({ button: 'right' })

  const menuEntry = capture.locator('[role="menu"]').getByText('Kabel bearbeiten')
  await expect(menuEntry).toBeVisible()
  await click(capture, menuEntry, { duration: 800 })
  await expect(capture.getByText(`Bearbeite: ${PATH_CABLE}`)).toBeVisible()
  await capture.waitForTimeout(700)

  // 2. A click on the line sets a vertex there.
  await click(capture, onLine, { duration: 900 })
  await capture.waitForTimeout(600)

  // 3. Dragging it moves the course of the cable; the drag saves it.
  await drag(capture, 150, 0, { duration: 1300 })
  await expect(capture.getByText('Kabelgeometrie erfolgreich aktualisiert')).toBeVisible({
    timeout: 20_000,
  })

  await pointAt(capture, { x: onLine.x - 260, y: onLine.y + 220 }, { duration: 700 })
  await expect(capture.getByText('Kabelgeometrie erfolgreich aktualisiert')).toBeHidden({
    timeout: 20_000,
  })
  await capture.waitForTimeout(1000)

  await saveVideo(capture, 'schema_cable_path', CROP.path, pageStart, demoStart)
})

// ---------------------------------------------------------------------------
// 14.8 Place a fiber on a port
// ---------------------------------------------------------------------------

test('14.8 Faser auf einen Port legen', async ({ page, context }) => {
  test.setTimeout(240_000)
  await seed(page)
  await warmUp(page)

  const capture = await context.newPage()
  await seed(capture)
  const pageStart = Date.now()

  // The canvas stays locked: this section works entirely inside the window, and
  // the lock has no influence there.
  await openSchema(capture, { unlock: false })

  await schemaNode(capture, SPLICE.node).click()
  await expect(capture.locator('#drawer-title')).toHaveText(SPLICE.node)
  await capture
    .locator('[data-drawer]')
    .getByRole('tab', { name: 'Aktionen', exact: true })
    .click()
  await capture.getByRole('button', { name: 'Struktur konfigurieren' }).click()

  const panel = floatingPanel(capture, 'Netzknotenstruktur')
  await expect(panel.getByText('Komponententypen')).toBeVisible({ timeout: 30_000 })

  // The left rail is collapsed and the ports opened before the recording starts:
  // both are preconditions of the section, and at 900 px window width the rail
  // would squeeze the table the flow happens in.
  await panel.getByRole('button', { name: 'Einklappen' }).first().click()
  await expect(panel.locator('.structure-block').first()).toBeVisible()
  await panel.locator('.structure-block').first().click()
  await expect(panel.getByText('12 Ports')).toBeVisible({ timeout: 30_000 })
  await capture.waitForTimeout(800)

  // The rows of the rail are the draggable divs: the cable, its bundles and its
  // fibers all sit in one. Their chevron is the first button inside the row -
  // clicking the name only picks the row up for a drag.
  const cableRow = panel.locator('div[draggable="true"]').filter({ hasText: SPLICE.cable }).first()
  await expect(cableRow).toBeVisible()

  await pointAt(capture, { x: 900, y: 1000 }, { duration: 400 })

  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. Open the cable in the rail, then its first bundle.
  await click(capture, cableRow.locator('button').first(), { duration: 900 })
  const bundleRow = panel.locator('div[draggable="true"]').filter({ hasText: 'Bündel 1' }).first()
  await expect(bundleRow).toBeVisible()
  await click(capture, bundleRow.locator('button').first(), { duration: 700 })
  await capture.waitForTimeout(500)

  // 2. Drag fiber 1 onto the cell "Faser A" of port 1. HTML5 drag and drop:
  //    Chromium turns the pressed move into a drag, and the replica cursor
  //    follows the `drag`/`dragover` events (see showCursor()).
  const fiber = panel.locator('div[role="listitem"][draggable="true"]').first()
  const target = panel.getByText('Faser hier ablegen').first()
  await pointAt(capture, fiber, { duration: 900 })
  const fiberBox = (await fiber.boundingBox())!
  const targetBox = (await target.boundingBox())!
  await drag(
    capture,
    targetBox.x + targetBox.width / 2 - (fiberBox.x + fiberBox.width / 2),
    targetBox.y + targetBox.height / 2 - (fiberBox.y + fiberBox.height / 2),
    { duration: 1500 },
  )

  // 3. The splice is set, Qonnectra confirms.
  await expect(capture.getByText('Faser erfolgreich verbunden')).toBeVisible({ timeout: 20_000 })
  await pointAt(capture, { x: 700, y: 1000 }, { duration: 700 })
  await expect(capture.getByText('Faser erfolgreich verbunden')).toBeHidden({ timeout: 20_000 })
  await capture.waitForTimeout(1200)

  await saveVideo(capture, 'schema_splice_drag', CROP.splice, pageStart, demoStart)
})
