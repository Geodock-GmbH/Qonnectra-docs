import { expect, request, test, type APIRequestContext, type Locator, type Page } from '@playwright/test'

import { localApp } from '../playwright/local-app'
import { disableAnimations, moveCursorAway, shotPath, spotlight } from '../playwright/manual-shots'

// Screenshots for chapter "15. Faserweg" in the manual
// (manual/teil-a-anwenderhandbuch/15-faserweg.md). Produces all images of the
// chapter:
//
//   trace              start page with the five entry points (pattern 1)
//   trace_search       search results of an address (pattern 2)
//   trace_fiber_picker cable with its bundles and fibers (pattern 2)
//   trace_result       result of an address, whole page (pattern 1)
//   trace_tree         one fiber path with its opened details (pattern 2)
//   trace_paths_table  table "Faserwege" with filter and an opened row (pattern 2)
//   trace_signal       mode "Signalanalyse" with the map (pattern 1)
//   trace_geometry     options with "Geometrie einbeziehen" switched on (pattern 2)
//   trace_map          result with the map beside it (pattern 1)
//
// The video of the chapter sits in tests/15-faserweg-video.spec.ts -
// test.use({ video: ... }) is only allowed at file level.
//
// The view changes nothing: every trace is a GET, and none of the images opens
// a form. The chapter therefore needs no clean-up.
//
// Publish to public/images/ with: pnpm screenshots:publish 15-faserweg
const CHAPTER = '15-faserweg'

/**
 * The entry points the images are taken from. Resolved through the API at
 * runtime (see traceTargets()) instead of hard-coded UUIDs: the demo data is
 * re-imported with `scripts/setup-local-qonnectra.sh --reset` and hands out new
 * UUIDs in the process, while names and addresses stay.
 *
 * - ADDRESS: "Toft 1" has three residential units, each on its own fiber - the
 *   result fits into one viewport, table and all.
 * - CABLE/FIBER: the feeder cable of the test project. Its fiber 1 is the only
 *   entry whose path runs across a splice (PoP-St patch panel → sleeve St-S01 →
 *   St-V02), which is what section 15.2 describes.
 * - NODE: "St-S01" carries four cables with 720 fibers between them, so the
 *   result comes as the table of section 15.2 and not as a single tree.
 */
const ADDRESS = { street: 'Toft', housenumber: 1, result: 'Toft, 1, 24972 Sterup' }
const CABLE = { name: 'St-S01-288-Fs', type: 'LTMC288(12x24)', fibers: 288, bundles: 12 }
const NODE = 'St-S01'

/** Search term of the address image - short enough to leave several hits. */
const ADDRESS_SEARCH = 'Toft 1'

/** Filter the table image is narrowed down with, see section 15.2. */
const PATHS_FILTER = 'St-V02'

// ---------------------------------------------------------------------------
// Entry points from the API
// ---------------------------------------------------------------------------

interface TraceTargets {
  addressUuid: string
  cableUuid: string
  fiberUuid: string
  nodeUuid: string
}

let targets: TraceTargets

/** Logged-in API context of the capture account. The credentials are never printed. */
async function apiContext(): Promise<APIRequestContext> {
  const { apiUrl, username, password } = localApp()
  const api = await request.newContext({ baseURL: apiUrl, ignoreHTTPSErrors: true })
  const login = await api.post('/api/v1/auth/login/', { data: { username, password } })
  expect(
    login.ok(),
    'Login to the API failed - is the local instance running, and are the ' +
      'credentials in local-app/deployment/.env correct?',
  ).toBe(true)
  return api
}

/**
 * Looks the entry points up by name, through the same endpoint the search field
 * of the view uses (`trace-search`).
 */
async function traceTargets(): Promise<TraceTargets> {
  const api = await apiContext()
  try {
    const search = async (type: string, term: string) => {
      const response = await api.get(
        `/api/v1/trace-search/?type=${type}&project=2&search=${encodeURIComponent(term)}`,
      )
      expect(response.ok(), `The search for ${type} "${term}" failed.`).toBe(true)
      return (await response.json()).results as Record<string, unknown>[]
    }

    const addresses = await search('address', `${ADDRESS.street} ${ADDRESS.housenumber}`)
    const address = addresses.find(
      (entry) => entry.street === ADDRESS.street && entry.housenumber === ADDRESS.housenumber,
    )
    expect(
      address,
      `The address "${ADDRESS.street} ${ADDRESS.housenumber}" is missing from the ` +
        'test project. Import the demo data again with:\n' +
        '  scripts/setup-local-qonnectra.sh --reset',
    ).toBeDefined()

    const cables = await search('cable', CABLE.name)
    const cable = cables.find((entry) => entry.name === CABLE.name)
    expect(cable, `The cable "${CABLE.name}" is missing from the test project.`).toBeDefined()

    const nodes = await search('node', NODE)
    const node = nodes.find((entry) => entry.name === NODE)
    expect(node, `The node "${NODE}" is missing from the test project.`).toBeDefined()

    const fibersResponse = await api.get(`/api/v1/fiber/by-cable/${cable!.uuid}/`)
    expect(fibersResponse.ok(), `The fibers of "${CABLE.name}" could not be read.`).toBe(true)
    const fibers = (await fibersResponse.json()) as {
      uuid: string
      fiber_number_absolute: number
    }[]
    const fiber = fibers.find((entry) => entry.fiber_number_absolute === 1)
    expect(fiber, `The cable "${CABLE.name}" has no fiber 1.`).toBeDefined()

    return {
      addressUuid: address!.uuid as string,
      cableUuid: cable!.uuid as string,
      fiberUuid: fiber!.uuid,
      nodeUuid: node!.uuid as string,
    }
  } finally {
    await api.dispose()
  }
}

test.beforeAll(async () => {
  targets = await traceTargets()
})

// ---------------------------------------------------------------------------
// Building blocks of the interface
// ---------------------------------------------------------------------------

/** The card of the options, above the search field. */
function optionsCard(page: Page): Locator {
  return page.locator('div.rounded-xl').filter({ hasText: 'Alle Projekte durchsuchen' })
}

/**
 * The card of the search, below the options.
 *
 * Addressed through the search field it holds and not through the hint
 * "Mindestens 2 Zeichen": that hint disappears as soon as the first hits are in,
 * and the result list is exactly what the images show.
 */
function searchCard(page: Page): Locator {
  return page
    .locator('div.rounded-xl')
    .filter({ has: page.locator('input[type="text"]') })
    .last()
}

/** A section of the result page, addressed through its heading. */
function resultSection(page: Page, heading: string): Locator {
  return page
    .getByRole('heading', { name: heading, exact: true })
    .locator('xpath=ancestor::section[1]')
}

/** Opens the start page of the fiber trace. */
async function openTrace(page: Page) {
  await page.goto('/trace')
  await expect(page.getByRole('heading', { name: 'Faserweg' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await disableAnimations(page)
  await moveCursorAway(page)
}

/**
 * Opens a result page and waits until it is fully built.
 *
 * The trace runs on the server (`+page.server.ts`), so the page arrives
 * complete - only the map of section 15.6 loads its tiles afterwards.
 */
async function openResult(page: Page, path: string, heading = 'Statistiken') {
  await page.goto(path)
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible({
    timeout: 60_000,
  })
  await page.waitForLoadState('networkidle')
  await disableAnimations(page)
  await moveCursorAway(page)
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

test('15. Übersicht des Faserwegs', async ({ page }) => {
  await openTrace(page)

  // Deliberately with the tab "Adresse" and an empty search field: that is the
  // state the view is reached in.
  await expect(page.getByText('Mindestens 2 Zeichen eingeben zum Suchen')).toBeVisible()
  await page.screenshot({ path: shotPath(CHAPTER, 'trace') })
})

test('15.1 Suchergebnisse einer Adresse', async ({ page }) => {
  await openTrace(page)

  await page.getByPlaceholder('Nach Straße, Stadt oder Adress-ID suchen...').fill(ADDRESS_SEARCH)

  // The search is debounced by 300 ms and answers with a trigram search, so
  // "Toft 1" also brings in Toft 10 to Toft 19 - the point of the image is the
  // result list, not one hit.
  const results = page.getByRole('button').filter({ hasText: ADDRESS.result })
  await expect(results.first()).toBeVisible({ timeout: 30_000 })
  await moveCursorAway(page)

  const spotlightOff = await spotlight(page, searchCard(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'trace_search') })
  await spotlightOff()
})

test('15.1 Faser eines Kabels auswählen', async ({ page }) => {
  await openTrace(page)

  await page.getByRole('button', { name: 'Faser', exact: true }).click()
  await expect(page.getByText('Wählen Sie ein Kabel, um dessen Fasern anzuzeigen')).toBeVisible()

  await page.getByPlaceholder('Nach Kabelname suchen...').fill(CABLE.name)
  await page.getByRole('button').filter({ hasText: CABLE.type }).first().click()

  // The header of the chosen cable, then the bundles. Bundle 1 is opened
  // because the section describes the fiber rows inside it - collapsed, the
  // card shows twelve identical lines and nothing of what is picked.
  await expect(page.getByText(`${CABLE.fibers} Fasern`)).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Bündel 1', { exact: true })).toBeVisible()
  await page.getByText('Bündel 1', { exact: true }).click()
  await expect(page.getByRole('button', { name: 'Folgen' }).first()).toBeVisible()
  await moveCursorAway(page)

  const spotlightOff = await spotlight(page, searchCardOfFiberTab(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'trace_fiber_picker') })
  await spotlightOff()
})

test('15.2 Ergebnis einer Adresse', async ({ page }) => {
  await openResult(page, `/trace/address/${targets.addressUuid}`)

  // Three residential units, one fiber each - the whole result including the
  // table of fiber paths fits into the viewport. The count is read below the
  // table; the statistics card above carries the same words.
  await expect(resultSection(page, 'Faserwege').getByText('3 Fasern')).toBeVisible()
  await page.screenshot({ path: shotPath(CHAPTER, 'trace_result') })
})

test('15.2 Faserweg mit geöffneten Details', async ({ page }) => {
  await openResult(page, `/trace/fiber/${targets.fiberUuid}`)

  // Both waypoints of the path: the fiber in the feeder cable at PoP-St and the
  // fiber it continues into at the sleeve St-S01. Opened, they show what the
  // section is about - splice, port, component and container path.
  const details = page.getByRole('button', { name: 'Details' })
  await expect(details).toHaveCount(2)
  for (let index = 0; index < 2; index++) await details.nth(index).click()
  await expect(page.getByText('Endpunkt (keine Verbindung)')).toBeVisible()
  await expect(page.getByText('Containerpfad:')).toBeVisible()

  const tree = resultSection(page, 'Faserwege')
  await tree.scrollIntoViewIfNeeded()
  await moveCursorAway(page)
  await page.waitForTimeout(500)

  const spotlightOff = await spotlight(page, tree)
  await page.screenshot({ path: shotPath(CHAPTER, 'trace_tree') })
  await spotlightOff()
})

test('15.2 Tabelle der Faserwege', async ({ page }) => {
  // A node instead of a fiber: its 720 fibers come as the virtual table, not as
  // a tree.
  await openResult(page, `/trace/node/${targets.nodeUuid}`)

  const paths = resultSection(page, 'Faserwege')
  await paths.scrollIntoViewIfNeeded()

  // Filtered, because that is what makes the table usable at this size - and
  // unfiltered the visible rows all read the same.
  await page.getByPlaceholder('Nach Fasernummer, Kabel oder Ziel filtern...').fill(PATHS_FILTER)
  await page.waitForTimeout(600)

  // One row opened: below it the tree of that fiber path unfolds, the same one
  // the previous image shows on its own.
  await tableRow(paths, PATHS_FILTER).locator('button').last().click()
  await expect(page.getByRole('button', { name: 'Details' }).first()).toBeVisible()
  await paths.scrollIntoViewIfNeeded()
  await moveCursorAway(page)
  await page.waitForTimeout(500)

  const spotlightOff = await spotlight(page, paths)
  await page.screenshot({ path: shotPath(CHAPTER, 'trace_paths_table') })
  await spotlightOff()
})

test('15.4 Modus „Signalanalyse"', async ({ page }) => {
  // The signal analysis has no section "Statistiken" - it opens with the signal
  // source instead.
  await openResult(page, `/trace/fiber/${targets.fiberUuid}?mode=signal`, 'Signalquelle')

  // The signal analysis always fetches the geometry, so the map is beside it
  // without the option being switched on (see section 15.6).
  await expect(page.getByText('Keine Unterbrechungen erkannt')).toBeVisible()
  await expect(page.getByText('Signalreichweite')).toBeVisible()
  await expect(page.locator('canvas').first()).toBeVisible()
  await page.waitForTimeout(3000)
  await moveCursorAway(page)

  await page.screenshot({ path: shotPath(CHAPTER, 'trace_signal') })
})

test('15.6 Geometrieoptionen', async ({ page }) => {
  await openTrace(page)

  await page.getByText('Geometrie einbeziehen').click()
  await expect(page.getByText('Nach Kabelrichtung ausrichten')).toBeVisible()
  await moveCursorAway(page)
  await page.waitForTimeout(400)

  const spotlightOff = await spotlight(page, optionsCard(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'trace_geometry') })
  await spotlightOff()
})

test('15.6 Ergebnis mit Karte', async ({ page }) => {
  await openResult(
    page,
    `/trace/fiber/${targets.fiberUuid}?include_geometry=true&geometry_mode=segments`,
  )

  await expect(page.getByRole('button', { name: 'GeoJSON herunterladen' })).toBeVisible()
  await expect(page.locator('canvas').first()).toBeVisible()
  // The base map arrives through a worker pool that networkidle does not see.
  await page.waitForTimeout(3500)
  await moveCursorAway(page)

  await page.screenshot({ path: shotPath(CHAPTER, 'trace_map') })
})

// ---------------------------------------------------------------------------
// Helpers that depend on the state of the page
// ---------------------------------------------------------------------------

/**
 * The chevron of the first row of the table, which unfolds the fiber path.
 *
 * Scoped to the desktop grid: `FiberPathsTable.svelte` renders every row twice -
 * once as a mobile card (`sm:hidden`) and once as the grid (`hidden … sm:grid`).
 * At the capture viewport only the second one is visible, and a click on the
 * first (invisible) one never lands. Picked by its text, because the header of
 * the table is built from the same grid and carries no button.
 */
function tableRow(paths: Locator, text: string): Locator {
  return paths.locator('div[class*="sm:grid"]').filter({ hasText: text }).first()
}

/**
 * The search card in the tab "Faser" once a cable has been chosen.
 *
 * A locator of its own, because the hint "Mindestens 2 Zeichen" is gone by then
 * - the card holds the chosen cable and its bundles instead.
 */
function searchCardOfFiberTab(page: Page): Locator {
  return page.locator('div.rounded-xl').filter({ hasText: 'Bündel 1' }).last()
}

