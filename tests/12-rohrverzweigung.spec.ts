import { expect, test, type Locator, type Page } from '../playwright/test'

import {
  crop16by10,
  disableAnimations,
  moveCursorAway,
  shoot,
  spotlight,
} from '../playwright/manual-shots'
import { clearTrenchSelection } from '../playwright/pipe-branch-seeds'
import { projectPath, projectUrl } from '../playwright/project'

// Screenshots for chapter "12. Rohrverzweigung" in the manual
// (manual/teil-a-anwenderhandbuch/12-rohrverzweigung.md). Produces all images of
// the chapter:
//
//   pipe_branch                   plain overview shot, nothing selected (pattern 1)
//   pipe_branch_select            node picker with the opened list (pattern 2)
//   pipe_branch_trench_selection  window "Trassen auswählen" (pattern 2)
//   pipe_branch_canvas            five conduits on the canvas (pattern 1)
//   pipe_branch_canvas_detail     one conduit circle up close (detail crop)
//   pipe_branch_auto_connect      lasso selection of two conduits (pattern 2)
//   pipe_branch_controls          zoom and lock buttons (pattern 2)
//
// The videos of the chapter sit in tests/12-rohrverzweigung-video.spec.ts -
// test.use({ video: ... }) is only allowed at file level.
//
// No image here creates connections: the lasso selection of
// pipe_branch_auto_connect stops short of the button that would create them.
// What "Auf Canvas laden" does write since v1.8.0 is the trench selection of
// the node; it is cleared before and after every test
// (playwright/pipe-branch-seeds.ts), so each one starts from the canvas of the
// demo data.
//
// Publish to public/images/ with: pnpm screenshots:publish 12-rohrverzweigung
const CHAPTER = '12-rohrverzweigung'

/**
 * The only node of the test project whose type counts as a pipe branch
 * ("Rohrabzweig"). Which types are on offer comes from the PipeBranchSettings of
 * the project, seeded by scripts/qonnectra-demo-data/import_geodock_export.py -
 * without them the picker would hold all 117 nodes and the page would show the
 * hint of section 12.5 instead.
 */
const NODE = 'STER-RA-1'

/**
 * The trenches within five metres of NODE, with their conduits. The backend
 * fixes the radius at 5 m (`trenches-near-node`, default `distance`), so this
 * list follows from the demo data alone.
 *
 * St-VL-02 and St-VL-02a carry the three microduct connections of the demo data
 * (5 ↔ 5, 6 ↔ 6, 7 ↔ 7) and are therefore preselected and locked in the trench
 * window.
 */
const TRENCHES = [
  { id: 'TR-NZLQR5E', conduits: ['St-VL-01', 'St-VL-02'] },
  { id: 'TR-SREQZXH', conduits: ['St-VL-01', 'St-VL-02'] },
  { id: 'TR-WASGWM4', conduits: ['St-VL-02a'] },
]

/** Conduit circles on the canvas once every trench is loaded. */
const CANVAS_NODE_COUNT = TRENCHES.reduce((sum, trench) => sum + trench.conduits.length, 0)

/** Connections the demo data holds at NODE, drawn as edges on the canvas. */
const DEMO_CONNECTION_COUNT = 3

// ---------------------------------------------------------------------------
// Building blocks of the interface
// ---------------------------------------------------------------------------

/** The card "Eigenschaften" in the top left corner of the canvas. */
function propertiesCard(page: Page): Locator {
  return page.locator('div.card').filter({ has: page.getByRole('heading', { name: 'Eigenschaften' }) })
}

/** The window "Trassen auswählen", which replaces the card while it is open. */
function trenchWindow(page: Page): Locator {
  return page.locator('div.card').filter({ has: page.getByRole('heading', { name: 'Trassen auswählen' }) })
}

/** The four buttons of the canvas: zoom in, zoom out, fit view, lock. */
function canvasControls(page: Page): Locator {
  return page.locator('.svelte-flow__controls')
}

/** One conduit circle, addressed through the trench and conduit in its label. */
function canvasNode(page: Page, trenchId: string, conduit: string): Locator {
  return page
    .locator('.svelte-flow__node')
    .filter({ hasText: trenchId })
    .filter({ hasText: new RegExp(`${conduit}(?!a)`) })
}

test.beforeEach(() => clearTrenchSelection(NODE))
test.afterEach(() => clearTrenchSelection(NODE))

/** Conduit circles of the demo data's saved canvas: the two with connections. */
const CONNECTED_CONDUIT_COUNT = 2

/** Opens the pipe branch of the test project. */
async function openPipeBranch(page: Page) {
  await page.goto(projectPath('/pipe-branch'))

  // The project is part of the path (playwright/project.ts); the check catches
  // a redirect to the landing page.
  await expect(page).toHaveURL(projectUrl('/pipe-branch'))
  await expect(propertiesCard(page)).toBeVisible()
  await page.waitForLoadState('networkidle')

  await disableAnimations(page)
  await moveCursorAway(page)
}

/**
 * Picks NODE, opens the trench window and waits until it holds the trenches of
 * the demo data.
 *
 * Since v1.8.0 the node lands in the path (`/pipe-branch/node/<uuid>`), and its
 * canvas opens on what was saved for it: the saved trenches plus every conduit
 * that carries a connection. The window only opens by itself for a node where
 * that is nothing. NODE has the three connections of the demo data, so it
 * opens on the canvas with their two conduits, and the window is opened
 * through „Grabenauswahl bearbeiten“.
 */
async function selectNode(page: Page) {
  await page.getByPlaceholder('Rohrverzweigung auswählen', { exact: true }).click()
  await page.getByRole('option', { name: NODE, exact: true }).click()

  await expect(page).toHaveURL(projectUrl('/pipe-branch/node'))
  await expect(page.locator('.svelte-flow__node')).toHaveCount(CONNECTED_CONDUIT_COUNT)
  await page.getByRole('button', { name: 'Grabenauswahl bearbeiten', exact: true }).click()

  await expect(
    page.getByText(`${TRENCHES.length} Trassen in der Nähe gefunden`),
    `The node "${NODE}" does not return the expected trenches. Is the demo data ` +
      'complete? Reimport it with: scripts/setup-local-qonnectra.sh --reset',
  ).toBeVisible()
  await moveCursorAway(page)
}

/**
 * Loads the trenches onto the canvas and waits until the conduits and the
 * connections of the demo data are drawn.
 *
 * @param all - Whether to add every conduit ("Alle auswählen") or to keep the
 *   preselection, which holds only the conduits that already have connections.
 */
async function loadCanvas(page: Page, { all = true }: { all?: boolean } = {}) {
  if (all) await page.getByRole('button', { name: 'Alle auswählen' }).click()
  await page.getByRole('button', { name: 'Auf Canvas laden' }).click()

  await expect(page.locator('.svelte-flow__node')).toHaveCount(
    all ? CANVAS_NODE_COUNT : CONNECTED_CONDUIT_COUNT,
  )
  await expect(
    page.locator('.svelte-flow__edge'),
    'The connections of the demo data are missing from the canvas. Has a video ' +
      'run been aborted? tests/12-rohrverzweigung-video.spec.ts restores them ' +
      'through the API.',
  ).toHaveCount(DEMO_CONNECTION_COUNT)

  // The canvas fits its view only when it mounts (`fitView` on SvelteFlow in
  // PipeBranchCanvas.svelte). Since v1.8.0 it mounts on the two conduits with
  // connections, and the five loaded afterwards spill over its edges - a lasso
  // clamped to the pane then misses a circle's centre. "Fit View" does what
  // the mount did in v1.7; it runs as an animation.
  await page.getByRole('button', { name: 'Fit View', exact: true }).click()
  await page.waitForTimeout(1200)
  await moveCursorAway(page)
}

/**
 * Draws a lasso around the given circles, in the freehand way the tool expects.
 *
 * The lasso is a canvas of its own on top of the flow (`PipeBranchLasso.svelte`)
 * and takes a stroke, not a rectangle: it collects the pointer positions and
 * selects every node whose **centre** lies inside the closed path. A single
 * `mouse.down()`/`up()` pair with two positions would leave a line without an
 * interior and select nothing, hence the loop of intermediate moves.
 */
async function lasso(page: Page, targets: Locator[]) {
  const boxes = await Promise.all(
    targets.map(async (target) => {
      const box = await target.boundingBox()
      if (!box) throw new Error('Lasso: the circle has no extent in the viewport.')
      return box
    }),
  )

  // The loop has to stay on the lasso overlay: it starts with a `pointerdown`,
  // and one that lands on the card "Eigenschaften" or outside the canvas never
  // reaches the overlay - the lasso then does not start at all.
  const pane = (await page.locator('.svelte-flow__pane').boundingBox())!
  const card = (await propertiesCard(page).boundingBox())!
  const margin = 40
  const inset = 12

  const left = Math.max(Math.min(...boxes.map((box) => box.x)) - margin, pane.x + inset)
  const right = Math.min(
    Math.max(...boxes.map((box) => box.x + box.width)) + margin,
    pane.x + pane.width - inset,
  )
  const top = Math.max(Math.min(...boxes.map((box) => box.y)) - margin, pane.y + inset)
  const bottom = Math.min(
    Math.max(...boxes.map((box) => box.y + box.height)) + margin,
    pane.y + pane.height - inset,
  )

  const overlapsCard =
    left < card.x + card.width && right > card.x && top < card.y + card.height && bottom > card.y
  expect(
    overlapsCard,
    'The lasso would start on the card "Eigenschaften" - pick circles further ' +
      'away from the top left corner of the canvas.',
  ).toBe(false)

  const corners = [
    [left, top],
    [right, top],
    [right, bottom],
    [left, bottom],
    [left, top],
  ]

  await page.mouse.move(corners[0][0], corners[0][1])
  await page.mouse.down()
  for (let i = 1; i < corners.length; i++) {
    const [fromX, fromY] = corners[i - 1]
    const [toX, toY] = corners[i]
    for (let step = 1; step <= 8; step++) {
      await page.mouse.move(
        fromX + ((toX - fromX) * step) / 8,
        fromY + ((toY - fromY) * step) / 8,
      )
    }
  }
  await page.mouse.up()
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

test('12. Übersicht der Rohrverzweigung', async ({ page }) => {
  // Deliberately without a node: that is the state the page is reached in, and
  // the empty canvas is what the introduction of the chapter describes.
  await openPipeBranch(page)

  await expect(page.getByPlaceholder('Rohrverzweigung auswählen', { exact: true })).toBeVisible()
  await shoot(page, CHAPTER, 'pipe_branch')
})

test('12.1 Auswahl der Rohrverzweigung', async ({ page }) => {
  await openPipeBranch(page)

  const field = page.getByPlaceholder('Rohrverzweigung auswählen', { exact: true })
  await field.click()

  // The list is picked by its content, not by its id: VirtualCombobox.svelte
  // generates that anew on every render, and the page holds several list boxes
  // (project, language, node).
  const options = page
    .locator('[role="listbox"]')
    .filter({ has: page.getByRole('option', { name: NODE, exact: true }) })
  await expect(options).toBeVisible()

  // Away from the list, otherwise the entry below the cursor is highlighted -
  // and a screenshot shows no cursor to explain it.
  await moveCursorAway(page)

  const spotlightOff = await spotlight(page, [propertiesCard(page), options])
  await shoot(page, CHAPTER, 'pipe_branch_select')
  await spotlightOff()
})

test('12.2 Fenster „Trassen auswählen"', async ({ page }) => {
  await openPipeBranch(page)
  await selectNode(page)

  // Expanded, because the section describes the conduits inside the trenches -
  // collapsed, the window shows three lines and nothing of what is selected.
  for (const trench of TRENCHES) {
    await page.locator('[data-part="item-trigger"]').filter({ hasText: trench.id }).click()
  }
  await expect(page.getByText('Hat Verbindungen')).toHaveCount(2)
  await moveCursorAway(page)

  const spotlightOff = await spotlight(page, trenchWindow(page))
  await shoot(page, CHAPTER, 'pipe_branch_trench_selection')
  await spotlightOff()
})

test('12.3 Rohre auf der Arbeitsfläche', async ({ page }) => {
  await openPipeBranch(page)
  await selectNode(page)
  await loadCanvas(page)

  await shoot(page, CHAPTER, 'pipe_branch_canvas')
})

test('12.3 Ein Rohr aus der Nähe', async ({ page }) => {
  await openPipeBranch(page)
  await selectNode(page)
  await loadCanvas(page)

  // Twice into the canvas, so that the microduct dots and their circle carry
  // enough pixels for the detail crop. `fitView` puts the whole ring of five
  // circles into the viewport, and at that scale a circle is 151 CSS pixels
  // wide - the crop around it would come out at 636 x 398 device pixels and
  // would be enlarged in the manual, which renders it at 512 px.
  await page.getByRole('button', { name: 'Zoom In' }).click()
  await page.getByRole('button', { name: 'Zoom In' }).click()
  await page.waitForTimeout(800)
  await moveCursorAway(page)

  // Zooming works from the centre of the canvas, so the circles move outwards;
  // the one closest to the centre is the one that stays fully visible. Which
  // that is follows from the demo data and is the same on every run.
  const target = await closestNodeToCanvasCentre(page)

  // The label box sits `absolute` above the circle and is translated out of it
  // (PipeBranchNode.svelte), so it does not widen the node's own extent - passed
  // separately, the crop would cut it in half.
  await shoot(page, CHAPTER, 'pipe_branch_canvas_detail', {
    clip: await crop16by10(page, [target, target.locator('> div').first()], { padding: 32 }),
  })
})

test('12.3.2 Auto-Verbindung mit zwei ausgewählten Rohren', async ({ page }) => {
  await openPipeBranch(page)
  await selectNode(page)
  await loadCanvas(page)

  // The switch is addressed through the data attributes of the design system:
  // its caption "Auto-Verbindung:" sits in a `span` beside it, not in a label
  // around it, so a filter by text finds nothing.
  await page.locator('[data-scope="switch"][data-part="root"]').click()
  await expect(page.locator('canvas.tool-overlay')).toBeVisible()

  // The two circles of trench TR-NZLQR5E: they sit next to each other on the
  // ring, so a lasso around them takes in no third one, and they lie in the
  // right-hand half of the canvas - far enough from the card "Eigenschaften",
  // which would otherwise swallow the first `pointerdown`.
  const selected = [
    canvasNode(page, 'TR-NZLQR5E', 'St-VL-01'),
    canvasNode(page, 'TR-NZLQR5E', 'St-VL-02'),
  ]
  await lasso(page, selected)

  // Deliberately stops here: the button below would create the connections, and
  // a still image spec must not change data.
  await expect(page.getByText('Ausgewählt: 2')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ausgewählte Netzknoten verbinden' })).toBeVisible()
  await moveCursorAway(page)

  // Three places at once: the card with the new buttons and the two circles the
  // lasso caught. Exposing the card alone would leave the selection - the point
  // of the section - in the dimmed part of the image.
  const spotlightOff = await spotlight(page, [propertiesCard(page), ...selected])
  await shoot(page, CHAPTER, 'pipe_branch_auto_connect')
  await spotlightOff()
})

test('12.4 Schaltflächen der Arbeitsfläche', async ({ page }) => {
  await openPipeBranch(page)
  await selectNode(page)
  await loadCanvas(page)

  const spotlightOff = await spotlight(page, canvasControls(page))
  await shoot(page, CHAPTER, 'pipe_branch_controls')
  await spotlightOff()
})

// ---------------------------------------------------------------------------
// Helpers that need the rendered canvas
// ---------------------------------------------------------------------------

/**
 * The conduit circle whose centre lies closest to the centre of the canvas.
 *
 * Measured instead of hard-coded: the circles are laid out on a ring around the
 * canvas centre (`+page.svelte`), and which of them ends up where depends on the
 * order the backend returns the trenches in.
 */
async function closestNodeToCanvasCentre(page: Page): Promise<Locator> {
  const canvas = (await page.locator('.svelte-flow').boundingBox())!
  const centre = { x: canvas.x + canvas.width / 2, y: canvas.y + canvas.height / 2 }

  const nodes = page.locator('.svelte-flow__node')
  const count = await nodes.count()
  let best: { index: number; distance: number } | undefined

  for (let index = 0; index < count; index++) {
    const box = await nodes.nth(index).boundingBox()
    if (!box) continue
    const distance = Math.hypot(box.x + box.width / 2 - centre.x, box.y + box.height / 2 - centre.y)
    if (!best || distance < best.distance) best = { index, distance }
  }

  expect(best, 'No conduit circle is drawn on the canvas.').toBeDefined()
  return nodes.nth(best!.index)
}
