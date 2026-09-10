import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  crop16by10,
  disableAnimations,
  moveCursorAway,
  shotPath,
  spotlight,
} from '../playwright/manual-shots'

// Screenshots for chapter "14. Netzschema" in the manual
// (manual/teil-a-anwenderhandbuch/14-netzschema.md). Produces all images of the
// chapter:
//
//   schema                      plain overview shot, nothing selected (pattern 1)
//   schema_panel                card "Eigenschaften" with the display options (pattern 2)
//   schema_search               search with its result list (pattern 2)
//   schema_lock                 the four buttons of the canvas (pattern 2)
//   schema_cable_type           opened list "Kabeltyp auswählen" (pattern 2)
//   schema_cable_properties     info box of a cable, tab "Eigenschaften" (pattern 2)
//   schema_cable_actions        tab "Aktionen" of a cable (pattern 2)
//   schema_edit_mode            right-click menu on a cable label (pattern 2)
//   schema_handles              tab "Fangpunkte" of a cable (pattern 2)
//   schema_micropipe_trenches   window "Kabel-Mikrorohr Verknüpfung", step 1 (crop 16 : 10)
//   schema_micropipe_microducts the same window, step 2 (crop 16 : 10)
//   schema_fiber_status         status of a single fiber, tab "Status" (pattern 2)
//   schema_slot_config          window "Netzknoten-Konfiguration" (crop 16 : 10)
//   schema_structure            window "Netzknotenstruktur" with all three columns (crop 16 : 10)
//   schema_ports                ports of a component with fiber A and B (crop 16 : 10)
//   schema_port_merge           port table in the selection mode for merging (crop 16 : 10)
//   schema_subnet               subnet of a node (pattern 1)
//
// The videos of the chapter sit in tests/14-netzschema-video.spec.ts -
// test.use({ video: ... }) is only allowed at file level.
//
// None of the images changes data: they open info boxes, windows and selection
// lists and stop short of every button that would write - the merge mode of
// schema_port_merge selects two ports but does not merge them. Only the video
// spec writes, and it cleans up after itself.
//
// Publish to public/images/ with: pnpm screenshots:publish 14-netzschema
const CHAPTER = '14-netzschema'

/**
 * Viewport of the diagram, in canvas coordinates (`networkSchemaViewport` in
 * localStorage).
 *
 * The schema has no auto-fit: `fitView` is only switched on for an empty
 * diagram, so the view starts wherever the store points - by default at
 * {0, 0, 1}, and node St-V01 (canvas y -360) then sits above the visible area.
 *
 * The values put the six nodes of the test project into the pane and leave the
 * card "Eigenschaften" (up to x 602 of the window) free: the canvas begins at
 * x 300, so an offset of 320 pushes the leftmost node (St-V02, canvas x 0) to
 * x 620.
 */
const VIEW = { x: 320, y: 445, zoom: 1 }

/**
 * Map extent of the window "Kabel-Mikrorohr Verknüpfung" in EPSG:3857. That
 * window brings a map of its own, and it reads `mapCenter`/`mapZoom` from
 * localStorage like every other map of the app.
 */
const MICROPIPE_VIEW = { center: [1083718, 7308663], zoom: 18 }

/**
 * The trench the microduct window is shown on, with the conduit of CABLE.
 * Its centroid is the point the spec clicks at.
 *
 * TR-YJGWPQ2 is 160 m long and therefore comfortable to hit; it carries
 * St-VL-01, the conduit whose microduct 1 the feeder cable lies in - so the
 * conduit list shows the linked case ("Verknüpft") straight away.
 */
const MICROPIPE_TRENCH = { id: 'TR-YJGWPQ2', point: [1083718, 7308663], conduit: 'St-VL-01' }

/**
 * The cable most images are taken of: the feeder of the test project, from the
 * POP to the sleeve St-S01. It is the only cable with 288 fibers and the only
 * one whose fibers are spliced through at both ends.
 */
const CABLE = { name: 'St-S01-288-Fs', type: 'LTMC288(12x24)', conduit: 'St-VL-01' }

/**
 * Nodes of the images.
 *
 * - POP carries a container ("Rack: RACK-A1") with the slot configuration
 *   "Shelf-A1", so the configuration window shows the nested case.
 * - SPLICE is the sleeve with the component KU(144), whose 24 ports carry a
 *   fiber on side A **and** B - that is what section 14.8 is about.
 * - SUBNET is the only node of the demo data with children: 23 house
 *   connections with their cables.
 */
const POP = 'PoP-St'
const SPLICE = { node: 'St-S01', side: 'Muffe', component: 'KU(144)', ports: 144 }
const SUBNET = { node: 'St-V02', children: 23 }

/** Node types the network schema shows; the rest is excluded, see section 14.1. */
const SCHEMA_NODES = ['PoP-St', 'St-S01', 'St-V01', 'St-V02', 'St-V03', 'St-V04']

/** Width the info box is opened at, in CSS pixels; see section 3.6. */
const DRAWER_WIDTH = 620

/** Search term of schema_search - matches four of the six nodes. */
const SEARCH = 'St-V'

// ---------------------------------------------------------------------------
// Building blocks of the interface
// ---------------------------------------------------------------------------

/** The card "Eigenschaften" in the top left corner of the canvas. */
function propertiesCard(page: Page): Locator {
  return page
    .locator('div.card')
    .filter({ has: page.getByRole('heading', { name: 'Eigenschaften', exact: true }) })
}

/** The four buttons of the canvas: zoom in, zoom out, fit view, lock. */
function canvasControls(page: Page): Locator {
  return page.locator('.svelte-flow__controls')
}

/** The info box on the right-hand side of the canvas. */
function drawer(page: Page): Locator {
  return page.locator('[data-drawer]')
}

/** A node of the diagram, addressed through its name. */
function schemaNode(page: Page, name: string): Locator {
  return page.locator('.svelte-flow__node').filter({ hasText: name })
}

/** The label of a cable - the box on the line, and the only handle it has. */
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
 * Opens the network schema of the test project and waits until nodes and cables
 * are drawn.
 *
 * The viewport is seeded through `addInitScript`, i.e. before the document
 * loads. The obvious route - load, set `localStorage`, reload - has a race
 * condition: `ViewportPersistence.svelte` writes the viewport back 300 ms after
 * every change, and a write landing between setting and reloading takes the seed
 * with it.
 */
async function openSchema(page: Page, drawerWidth = DRAWER_WIDTH) {
  await page.addInitScript(
    (state) => {
      localStorage.setItem('networkSchemaViewport', JSON.stringify(state.view))
      localStorage.setItem('drawerWidth', JSON.stringify(state.drawerWidth))
      localStorage.setItem('mapCenter', JSON.stringify(state.map.center))
      localStorage.setItem('mapZoom', JSON.stringify(state.map.zoom))
    },
    { view: VIEW, drawerWidth, map: MICROPIPE_VIEW },
  )

  await page.goto('/network-schema')

  // `/network-schema` redirects to `/network-schema/<project>` - the 2 is the
  // test project (cookie `selected-project`, set in playwright/auth.setup.ts).
  await expect(page).toHaveURL(/\/network-schema\/2(\/|$)/)
  await expect(
    page.locator('.svelte-flow__node'),
    'The network schema shows a different number of nodes than the demo data ' +
      'holds. Import it again with: scripts/setup-local-qonnectra.sh --reset',
  ).toHaveCount(SCHEMA_NODES.length)
  await expect(cableLabel(page, CABLE.name)).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1200)

  await disableAnimations(page)
  await moveCursorAway(page)
}

/** Opens the info box of a cable and switches to `tab`. */
async function openCable(page: Page, tab: string) {
  await cableLabel(page, CABLE.name).click()
  await expect(page.locator('#drawer-title')).toHaveText(CABLE.name)
  await drawer(page).getByRole('tab', { name: tab, exact: true }).click()
  await page.waitForTimeout(800)
  await moveCursorAway(page)
}

/** Opens the info box of a node and switches to `tab`. */
async function openNode(page: Page, name: string, tab: string) {
  await schemaNode(page, name).click()
  await expect(page.locator('#drawer-title')).toHaveText(name)
  await drawer(page).getByRole('tab', { name: tab, exact: true }).click()
  await page.waitForTimeout(600)
  await moveCursorAway(page)
}

/**
 * Projects a point in EPSG:3857 onto the map of the microduct window, in CSS
 * pixels of the viewport.
 *
 * OpenLayers keeps its view resolution in projection units per CSS pixel, and
 * for EPSG:3857 it follows from the zoom alone. Since the extent is seeded, the
 * position of every object of the demo data can be calculated instead of
 * searched for in the painted picture.
 */
async function micropipeMapPoint(
  page: Page,
  coordinate: number[],
): Promise<{ x: number; y: number }> {
  const viewport = page.locator('.ol-viewport').first()
  const box = (await viewport.boundingBox())!
  const resolution = 156543.03392804097 / 2 ** MICROPIPE_VIEW.zoom

  return {
    x: box.x + box.width / 2 + (coordinate[0] - MICROPIPE_VIEW.center[0]) / resolution,
    y: box.y + box.height / 2 - (coordinate[1] - MICROPIPE_VIEW.center[1]) / resolution,
  }
}

/**
 * Opens the window "Kabel-Mikrorohr Verknüpfung" of CABLE and selects
 * MICROPIPE_TRENCH in its map, so that step 1 holds the conduits of that trench.
 */
async function openMicropipeWindow(page: Page) {
  await openSchema(page)
  await openCable(page, 'Aktionen')
  await page.getByRole('button', { name: 'Mit Mikrorohr verbinden' }).click()

  const panel = floatingPanel(page, 'Kabel-Mikrorohr Verknüpfung')
  await expect(panel).toBeVisible()
  await expect(panel.getByText('Wählen Sie Gräben auf der Karte aus')).toBeVisible()
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForTimeout(3500)

  const point = await micropipeMapPoint(page, MICROPIPE_TRENCH.point)
  await page.mouse.click(point.x, point.y)

  await expect(
    panel.getByText(`${MICROPIPE_TRENCH.conduit}`, { exact: false }).first(),
    `The click did not hit the trench ${MICROPIPE_TRENCH.id}. Has the map extent moved?`,
  ).toBeVisible({ timeout: 30_000 })
  await moveCursorAway(page)
  await page.waitForTimeout(600)

  return panel
}

// ---------------------------------------------------------------------------
// 14.1 Structure of the diagram
// ---------------------------------------------------------------------------

test('14. Übersicht des Netzschemas', async ({ page }) => {
  await openSchema(page)

  // Deliberately without a selection: that is the state the view is reached in.
  await page.screenshot({ path: shotPath(CHAPTER, 'schema') })
})

test('14.1 Bereich „Eigenschaften"', async ({ page }) => {
  await openSchema(page)

  const spotlightOff = await spotlight(page, propertiesCard(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'schema_panel') })
  await spotlightOff()
})

test('14.1 Suche im Schema', async ({ page }) => {
  await openSchema(page)

  await page.getByPlaceholder('Suchen', { exact: true }).fill(SEARCH)

  // The result list hangs below the card and reaches past its lower edge, so it
  // is exposed as a target of its own - inside the card alone it would end up in
  // the dimmed part of the image.
  const results = page
    .locator('div.absolute')
    .filter({ has: page.getByRole('button').filter({ hasText: 'St-V01-144-Fs' }) })
  await expect(results).toBeVisible()
  await moveCursorAway(page)
  await page.waitForTimeout(400)

  const spotlightOff = await spotlight(page, [propertiesCard(page), results])
  await page.screenshot({ path: shotPath(CHAPTER, 'schema_search') })
  await spotlightOff()
})

// ---------------------------------------------------------------------------
// 14.2 Moving, connecting and deleting nodes
// ---------------------------------------------------------------------------

test('14.2 Schaltflächen der Zeichenfläche', async ({ page }) => {
  await openSchema(page)

  const spotlightOff = await spotlight(page, canvasControls(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'schema_lock') })
  await spotlightOff()
})

test('14.2 Kabeltyp für ein neues Kabel', async ({ page }) => {
  await openSchema(page)

  // The chevron, not the input: `GenericCombobox.svelte` opens its list from
  // `Combobox.Trigger`, a click into the field only focuses it.
  await propertiesCard(page).locator('[data-scope="combobox"][data-part="trigger"]').click()

  // The list renders through a portal and therefore does not hang below the
  // field but at the end of the document.
  const options = page.getByRole('option', { name: CABLE.type, exact: true }).locator('xpath=..')
  await expect(options).toBeVisible()
  await moveCursorAway(page)

  const spotlightOff = await spotlight(page, [propertiesCard(page), options])
  await page.screenshot({ path: shotPath(CHAPTER, 'schema_cable_type') })
  await spotlightOff()
})

// ---------------------------------------------------------------------------
// 14.3 Cable properties
// ---------------------------------------------------------------------------

test('14.3 Eigenschaften eines Kabels', async ({ page }) => {
  await openSchema(page)
  await openCable(page, 'Eigenschaften')

  await expect(drawer(page).getByText('Verbundene Leerrohre')).toBeVisible()
  const spotlightOff = await spotlight(page, drawer(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'schema_cable_properties') })
  await spotlightOff()
})

test('14.3 Reiter „Aktionen" eines Kabels', async ({ page }) => {
  await openSchema(page)
  await openCable(page, 'Aktionen')

  await expect(page.getByRole('button', { name: 'Kabellänge neu berechnen' })).toBeVisible()
  const spotlightOff = await spotlight(page, drawer(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'schema_cable_actions') })
  await spotlightOff()
})

// ---------------------------------------------------------------------------
// 14.4 Edit mode
// ---------------------------------------------------------------------------

test('14.4 Kontextmenü einer Kabelbeschriftung', async ({ page }) => {
  await openSchema(page)

  // Unlocked, because the menu entry only does something in that state - and
  // the section describes the way into the edit mode.
  await canvasControls(page).getByRole('button', { name: 'Zeichenfläche entsperren' }).click()
  await moveCursorAway(page)

  const label = cableLabel(page, CABLE.name)

  // Right-click into the bottom right corner of the label: the menu opens at
  // the pointer and unfolds to the right and downwards, so from the middle of
  // the label it would cover the very label the section talks about.
  const box = (await label.boundingBox())!
  await label.click({ button: 'right', position: { x: box.width - 4, y: box.height - 4 } })

  const menu = page.locator('[role="menu"]')
  await expect(menu.getByText('Kabel bearbeiten')).toBeVisible()

  // The menu sits at the pointer, so the cursor has to stay where it is; a
  // moveCursorAway() would leave the menu without its anchor in the image.
  const spotlightOff = await spotlight(page, [label, menu])
  await page.screenshot({ path: shotPath(CHAPTER, 'schema_edit_mode') })
  await spotlightOff()
})

test('14.4 Reiter „Fangpunkte" eines Kabels', async ({ page }) => {
  await openSchema(page)
  await openCable(page, 'Fangpunkte')

  await expect(drawer(page).getByText('Fangpunkt Position').first()).toBeVisible()
  const spotlightOff = await spotlight(page, drawer(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'schema_handles') })
  await spotlightOff()
})

// ---------------------------------------------------------------------------
// 14.5 Linking a cable to microducts
// ---------------------------------------------------------------------------

test('14.5 Gräben und Leerrohre auswählen', async ({ page }) => {
  test.setTimeout(120_000)
  const panel = await openMicropipeWindow(page)

  await page.screenshot({
    path: shotPath(CHAPTER, 'schema_micropipe_trenches'),
    clip: await crop16by10(page, panel),
  })
})

test('14.5 Mikrorohr auswählen', async ({ page }) => {
  test.setTimeout(120_000)
  const panel = await openMicropipeWindow(page)

  // Pick the conduit of the cable, then step 2 - the microduct table.
  await panel.getByRole('button').filter({ hasText: MICROPIPE_TRENCH.conduit }).first().click()
  await panel.getByRole('button', { name: 'Weiter' }).click()

  await expect(panel.getByRole('columnheader', { name: 'Verfügbar' })).toBeVisible({
    timeout: 30_000,
  })
  await moveCursorAway(page)
  await page.waitForTimeout(600)

  await page.screenshot({
    path: shotPath(CHAPTER, 'schema_micropipe_microducts'),
    clip: await crop16by10(page, panel),
  })
})

// ---------------------------------------------------------------------------
// 14.6 Fibers and bundles
// ---------------------------------------------------------------------------

test('14.6 Status einer Faser', async ({ page }) => {
  await openSchema(page)
  await openCable(page, 'Status')

  const box = drawer(page)
  await expect(box.getByText('Bündel 1', { exact: true })).toBeVisible()
  await box.getByText('Bündel 1', { exact: true }).click()
  await expect(box.getByRole('columnheader', { name: 'Status' })).toBeVisible()

  // The status list of the first fiber, opened: that is the only place in the
  // app where a fiber status is set. `renderInPlace` puts this list into the
  // table cell instead of a portal, so it stays inside the info box.
  await box.locator('[data-scope="combobox"][data-part="trigger"]').first().click()
  const options = page.getByRole('option', { name: 'Intakt', exact: true }).locator('xpath=..')
  await expect(options).toBeVisible()
  await moveCursorAway(page)

  const spotlightOff = await spotlight(page, [box, options])
  await page.screenshot({ path: shotPath(CHAPTER, 'schema_fiber_status') })
  await spotlightOff()
})

// ---------------------------------------------------------------------------
// 14.7 Slot configuration, structure, containers
// ---------------------------------------------------------------------------

test('14.7 Fenster „Netzknoten-Konfiguration"', async ({ page }) => {
  await openSchema(page)
  await openNode(page, POP, 'Aktionen')

  await page.getByRole('button', { name: 'Slots konfigurieren' }).click()
  const panel = floatingPanel(page, 'Netzknoten-Konfiguration')
  await expect(panel.getByText('Gesamtslots:')).toBeVisible({ timeout: 30_000 })
  await moveCursorAway(page)
  await page.waitForTimeout(600)

  await page.screenshot({
    path: shotPath(CHAPTER, 'schema_slot_config'),
    clip: await crop16by10(page, panel),
  })
})

test('14.7 Fenster „Netzknotenstruktur"', async ({ page }) => {
  await openSchema(page)
  await openNode(page, POP, 'Aktionen')

  await page.getByRole('button', { name: 'Struktur konfigurieren' }).click()
  const panel = floatingPanel(page, 'Netzknotenstruktur')
  await expect(panel.getByText('Komponententypen')).toBeVisible({ timeout: 30_000 })
  await expect(panel.getByText('Gesamtslots:')).toBeVisible()
  await moveCursorAway(page)
  await page.waitForTimeout(800)

  await page.screenshot({
    path: shotPath(CHAPTER, 'schema_structure'),
    clip: await crop16by10(page, panel),
  })
})

// ---------------------------------------------------------------------------
// 14.8 Splices and ports
// ---------------------------------------------------------------------------

/**
 * Opens the maximised structure window of SPLICE and clicks its component, so
 * that the port table is on screen.
 *
 * Maximised, because at the default size of 900 x 600 the table shows five rows
 * and the sidebars squeeze the fiber names to a few characters.
 */
async function openPortTable(page: Page): Promise<Locator> {
  await openSchema(page)
  await openNode(page, SPLICE.node, 'Aktionen')

  await page.getByRole('button', { name: 'Struktur konfigurieren' }).click()
  const panel = floatingPanel(page, 'Netzknotenstruktur')
  await expect(panel.getByText('Komponententypen')).toBeVisible({ timeout: 30_000 })

  // Addressed through `data-stage` and not through its name: the window controls
  // are icon buttons whose `aria-label` comes from Skeleton and stays English
  // even with the interface on German ("Maximize window").
  await panel.locator('[data-part="stage-trigger"][data-stage="maximized"]').click()
  await page.waitForTimeout(600)

  await expect(panel.getByText(SPLICE.component).first()).toBeVisible()
  await panel.locator('.structure-block').first().click()
  await expect(panel.getByText(`${SPLICE.ports} Ports`)).toBeVisible({ timeout: 30_000 })
  await moveCursorAway(page)
  await page.waitForTimeout(800)

  return panel
}

test('14.8 Ports einer Komponente', async ({ page }) => {
  test.setTimeout(120_000)
  const panel = await openPortTable(page)

  await page.screenshot({
    path: shotPath(CHAPTER, 'schema_ports'),
    clip: await crop16by10(page, panel),
  })
})

test('14.8 Ports zusammenführen', async ({ page }) => {
  test.setTimeout(120_000)
  const panel = await openPortTable(page)

  // The merge icon in the header of "Faser A" switches the table into the
  // selection mode; the two check boxes below it are what the section describes.
  // Stops there on purpose: the button that follows would merge the ports.
  await panel.getByRole('button', { name: 'Ports zusammenführen' }).first().click()
  await expect(panel.locator('input[type="checkbox"]').first()).toBeVisible()
  await moveCursorAway(page)
  await page.waitForTimeout(600)

  await page.screenshot({
    path: shotPath(CHAPTER, 'schema_port_merge'),
    clip: await crop16by10(page, panel),
  })
})

// ---------------------------------------------------------------------------
// 14.9 Subnet
// ---------------------------------------------------------------------------

test('14.9 Subnetz eines Netzknotens', async ({ page }) => {
  test.setTimeout(120_000)
  await openSchema(page)
  await openNode(page, SUBNET.node, 'Aktionen')

  await page.getByRole('button', { name: 'Subnetz öffnen' }).click()
  await expect(page).toHaveURL(/\/network-schema\/2\/node\//)

  // Parent node plus its children; the child view fits the diagram itself.
  await expect(page.locator('.svelte-flow__node')).toHaveCount(SUBNET.children + 1, {
    timeout: 30_000,
  })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2500)
  await disableAnimations(page)
  await moveCursorAway(page)

  await page.screenshot({ path: shotPath(CHAPTER, 'schema_subnet') })
})
