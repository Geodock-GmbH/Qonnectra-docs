import { execFileSync } from 'node:child_process'

import { expect, request, test, type Locator, type Page } from '@playwright/test'

import { CHART_BLUE, countDarkPixels, measureBars } from '../playwright/dashboard-charts'
import { localApp } from '../playwright/local-app'
import {
  crop16by10,
  disableAnimations,
  moveCursorAway,
  shotPath,
  spotlight,
} from '../playwright/manual-shots'

// Screenshots for chapter "4. Dashboard" in the manual
// (manual/teil-a-anwenderhandbuch/04-dashboard.md). Produces all images of the
// chapter:
//
//   dashboard                  plain overview shot (pattern 1)
//   dashboard_project          project picker in the header (pattern 2)
//   dashboard_project_detail   opened project list, crop 16 : 10
//   dashboard_tabs             tab bar (pattern 2)
//   dashboard_overview         card grid in tab "Übersicht" (pattern 2)
//   dashboard_trench           charts in tab "Trasse" (pattern 2)
//   dashboard_trench_hover     tooltip on a bar, crop 16 : 10
//   dashboard_conduit          content area of tab "Rohre" (pattern 2)
//   dashboard_node             content area of tab "Netzknoten" (pattern 2)
//   dashboard_address          content area of tab "Adressen" (pattern 2)
//   dashboard_area             content area of tab "Gebiete" (pattern 2)
//   dashboard_warranty         card "Gewährleistung" with three deadlines (pattern 2)
//
// Publish to public/images/ with: pnpm screenshots:publish 04-dashboard
const CHAPTER = '04-dashboard'

// ---------------------------------------------------------------------------
// Building blocks of the interface
// ---------------------------------------------------------------------------

/**
 * Opens the dashboard of the test project and waits until the figures are in.
 *
 * `/dashboard` redirects to `/dashboard/2` - the 2 is the test project (cookie
 * `selected-project`, set in playwright/auth.setup.ts). That is checked
 * explicitly: without the cookie the app showed the project "Default" and every
 * number in the image would be a different one.
 */
async function openDashboard(page: Page) {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/dashboard\/2(\/|$)/)

  await expect(page.getByRole('heading', { name: 'Trassenstatistik' })).toBeVisible()
  await expect(page.getByText('km Gesamtlänge')).toBeVisible()
  await page.waitForLoadState('networkidle')

  await disableAnimations(page)
  await moveCursorAway(page)
}

/**
 * Switches to a tab and waits until its content is fully drawn. `firstChart` is
 * the heading of the first card of the tab - by it the test recognises that the
 * content has changed, because the tabs share the same content area.
 */
async function openTab(page: Page, tab: string, firstChart: string) {
  await page.getByRole('tab', { name: tab, exact: true }).click()
  await expect(page.getByRole('heading', { name: firstChart, exact: true })).toBeVisible()

  // The switch must not carry the scroll position over: the tabs use the same
  // scroll container (main), and a tab with long content would leave it in
  // place for the next one.
  await page.locator('main').evaluate((el) => {
    el.scrollTop = 0
  })

  await chartsSettled(page)
  await moveCursorAway(page)
}

/**
 * Waits until Chart.js has finished drawing.
 *
 * The charts are created in an `$effect` (Chart.svelte) and grow in animated
 * afterwards. `networkidle` says nothing about that - the data arrives with the
 * page request, the drawing happens after it. What is checked is therefore the
 * painted picture itself: a checksum over all canvases of the content area that
 * has to be equal twice in a row. Without it a screenshot shows half grown bars,
 * and by a different amount on every run.
 *
 * Tabs without a chart ("Übersicht") are skipped by this function.
 */
async function chartsSettled(page: Page) {
  const checksum = () =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll('.tab-content canvas'))
        .map((element) => {
          const surface = element as HTMLCanvasElement
          const ctx = surface.getContext('2d')
          if (!ctx) return '-'
          const data = ctx.getImageData(0, 0, surface.width, surface.height).data
          let sum = 0
          // Every 16th pixel is enough; the bars are large and the animation
          // changes the picture across whole areas.
          for (let i = 0; i < data.length; i += 64) sum += data[i]
          return String(sum)
        })
        .join(','),
    )

  let previous = await checksum()
  if (previous === '') return

  for (let attempt = 0; attempt < 24; attempt++) {
    await page.waitForTimeout(250)
    const now = await checksum()
    // A pure zero value would be an empty canvas - that is not "finished" but
    // "nothing drawn yet".
    if (now === previous && !/^(0|-)(,(0|-))*$/.test(now)) return
    previous = now
  }

  throw new Error(
    'The charts did not settle within 6 s - is Chart.js still drawing, or is ' +
      'something else changing the canvas permanently?',
  )
}

/**
 * Content area of the active tab: the centred column with the cards
 * (`space-y-6 max-w-6xl mx-auto`). All six tabs use the same structure
 * (+page.svelte as well as TrenchStatistics, ConduitStatistics, NodeStatistics,
 * AddressStatistics, AreaStatistics).
 *
 * Deliberately not `.tab-content`: that spans the full width and would leave
 * nothing dimmed on the left and right.
 */
function contentArea(page: Page): Locator {
  return page.locator('.tab-content > div.space-y-6.max-w-6xl.mx-auto')
}

/** Tab bar above the content area (Skeleton tabs, Tabs.svelte). */
function tabBar(page: Page): Locator {
  return page.locator("[data-part='list']")
}

/**
 * Project picker in the header (ProjectCombobox.svelte): input field and expand
 * button.
 *
 * Grabbed through the placeholder of the input field. The header contains a
 * second Skeleton combobox - the language picker - and both have the same
 * `data-part` attributes; their ids (`combobox:c1`, `combobox:c2`) are generated
 * and therefore not a viable selector.
 */
function projectPicker(page: Page): Locator {
  return page.getByPlaceholder('Projekt', { exact: true }).locator('xpath=..')
}

/** Card of a chart or a figure, addressed through its heading. */
function card(page: Page, title: string): Locator {
  // Structure: <div class="card"><div><h2|h3><span>Title</span>...
  return page.getByRole('heading', { name: title, exact: true }).locator('xpath=../..')
}

// ---------------------------------------------------------------------------
// Seeding warranty deadlines (only for dashboard_warranty)
// ---------------------------------------------------------------------------
//
// In the test project no node has a warranty date
// (scripts/qonnectra-demo-data/testprojekt-export.json: `warranty` is empty on
// all 118 nodes). The card therefore only shows "Keine Garantien laufen bald
// ab" - but the chapter describes exactly the coloured highlighting. For this
// one image three deadlines are set through the API and reset to `null`
// afterwards.

/**
 * Remaining terms in days, one per colour level of
 * WarrantyExpirationCard.svelte: under 30 days red, under 90 yellow, from 90
 * green.
 */
const DEADLINES_IN_DAYS = [14, 60, 200]

/** Nodes whose deadline this run seeded - for the revert. */
let seededNodes: string[] = []

/**
 * Logged-in API context using the capture account.
 *
 * The superuser is not needed here (unlike for cleaning up attachments in
 * tests/05-karte-video.spec.ts): the group "Editor" may edit domain data, only
 * DELETE is forbidden. Seeding and reverting both happen via PATCH.
 */
async function apiContext() {
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

/** Date in `days` days, in the format of the API (YYYY-MM-DD, local time). */
function inDays(days: number): string {
  const day = new Date()
  day.setDate(day.getDate() + days)
  const twoDigits = (value: number) => String(value).padStart(2, '0')
  return `${day.getFullYear()}-${twoDigits(day.getMonth() + 1)}-${twoDigits(day.getDate())}`
}

/**
 * Sets the three deadlines. The first three nodes of the test project by name
 * are picked - that way every run hits the same nodes and the image always
 * shows the same labels.
 */
async function seedDeadlines() {
  const api = await apiContext()
  try {
    const response = await api.get('/api/v1/node/?project=2&ordering=name')
    expect(response.ok(), 'The nodes of the test project cannot be fetched.').toBe(true)
    // The API returns paginated GeoJSON: { count, next, previous, results: { features } }.
    const nodes: { id: string }[] = (await response.json()).results?.features ?? []
    expect(
      nodes.length,
      'The test project has fewer than three nodes - were the demo data ' +
        'imported? (scripts/setup-local-qonnectra.sh)',
    ).toBeGreaterThanOrEqual(DEADLINES_IN_DAYS.length)

    for (const [index, days] of DEADLINES_IN_DAYS.entries()) {
      const uuid = nodes[index].id
      const patch = await api.patch(`/api/v1/node/${uuid}/`, { data: { warranty: inDays(days) } })
      expect(patch.ok(), `The deadline could not be set (HTTP ${patch.status()}).`).toBe(true)
      seededNodes.push(uuid)
    }
  } finally {
    await api.dispose()
  }

  clearDashboardCache()
}

/** Reverts the seeded deadlines and checks that none is left over. */
async function revertDeadlines() {
  const api = await apiContext()
  try {
    for (const uuid of seededNodes) {
      const patch = await api.patch(`/api/v1/node/${uuid}/`, { data: { warranty: null } })
      expect(
        patch.ok(),
        `The seeded deadline of ${uuid} could not be reverted (HTTP ${patch.status()}). ` +
          'Please check by hand - otherwise every following run carries it along.',
      ).toBe(true)
    }
    seededNodes = []

    // Cross-check at the source: /api/v1/node/expiring_warranties/ reads
    // straight from the database and does not go through the cache of the
    // dashboard statistics.
    const remaining = await api.get('/api/v1/node/expiring_warranties/?project=2')
    expect(
      (await remaining.json()).count,
      'The test project still has warranty deadlines stored. The demo data ' +
        'have none - a capture was not cleaned up here.',
    ).toBe(0)
  } finally {
    await api.dispose()
  }

  clearDashboardCache()
}

/** Name of the backend container of the local instance (see CLAUDE.md). */
const BACKEND_CONTAINER = 'qonnectra_backend_prod'

/**
 * Discards the cache of the dashboard statistics by restarting the worker
 * processes of the backend.
 *
 * The pitfall behind it: `DashboardStatisticsView` stores the complete figures
 * for five minutes under `dashboard_stats_<project>_all` (`CACHE_TIMEOUT = 300`
 * in backend/apps/api/views.py) and the app has no way around it - the page
 * always queries the same key. Nothing is invalidated on write: a deadline just
 * set therefore only shows up in the dashboard once the entry expires by itself.
 *
 * What makes it worse is that the instance configures no `CACHES`. Django then
 * uses `LocMemCache`, and that exists **per worker process** - gunicorn runs
 * with four of them (deployment/docker-compose.yml). A simple "reload once"
 * therefore does not help: nginx spreads the requests, and three out of four
 * processes keep answering from their old state.
 *
 * `kill -HUP` to the gunicorn master process restarts the workers in an orderly
 * fashion; their cache is empty afterwards. The container itself keeps running -
 * which matters, because a `docker restart` of the backend would leave nginx
 * with a stale container IP (response 502, see CLAUDE.md).
 *
 * The master process is recognised by its parent process 1: `setproctitle` is
 * not installed in the image, so master and workers share the same command line.
 * `ps` does not exist in the image, so /proc is read directly.
 */
function clearDashboardCache() {
  const script = [
    'for d in /proc/[0-9]*; do',
    '  [ -r "$d/cmdline" ] || continue',
    '  tr "\\0" " " < "$d/cmdline" | grep -q gunicorn || continue',
    `  [ "$(awk '{print $4}' "$d/stat")" = "1" ] || continue`,
    '  kill -HUP "${d#/proc/}" && echo restarted',
    'done',
  ].join('\n')

  let output: string
  try {
    output = execFileSync('docker', ['exec', BACKEND_CONTAINER, 'sh', '-c', script], {
      encoding: 'utf8',
    })
  } catch (error) {
    throw new Error(
      `The cache of the backend could not be discarded: docker exec ${BACKEND_CONTAINER} ` +
        'failed. Is the local instance running (docker ps)?\n' +
        `Cause: ${(error as Error).message}`,
    )
  }

  expect(
    output,
    `No gunicorn master process was found in ${BACKEND_CONTAINER}. Without a ` +
      'restart of the worker processes the dashboard shows the old figures for ' +
      'up to five minutes.',
  ).toContain('restarted')
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

test('4. Übersicht des Dashboards', async ({ page }) => {
  await openDashboard(page)
  await page.screenshot({ path: shotPath(CHAPTER, 'dashboard'), animations: 'disabled' })
})

test('4.1 Projektauswahl in der Kopfzeile', async ({ page }) => {
  await openDashboard(page)

  // Cross-check: the image should show the test project, not "Default".
  await expect(page.getByPlaceholder('Projekt', { exact: true })).toHaveValue('Testprojekt')

  const spotlightOff = await spotlight(page, projectPicker(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'dashboard_project'), animations: 'disabled' })
  await spotlightOff()
})

test('4.1 Geöffnete Projektliste', async ({ page }) => {
  await openDashboard(page)

  const picker = projectPicker(page)
  await picker.locator('[data-part="trigger"]').click()

  // The list renders through a portal and therefore does not hang below the
  // header but at the end of the document (ProjectCombobox.svelte). It is
  // therefore grabbed through one of its entries; the language picker of the
  // header brings a second, hidden portal along.
  const list = page.getByRole('option', { name: 'Testprojekt' }).locator('xpath=..')
  await expect(list).toBeVisible()
  await expect(page.getByRole('option')).toHaveCount(2)

  // After the click the cursor rests on the button and would highlight it in
  // the image. The coloured background of the selected entry stays - it comes
  // from the selection, not from hovering.
  await moveCursorAway(page)

  await page.screenshot({
    path: shotPath(CHAPTER, 'dashboard_project_detail'),
    // A bit more padding than usual: input field and list together are only
    // about 250 x 150 px, and without surroundings the image would not show
    // that the picker sits in the header.
    clip: await crop16by10(page, [picker, list], { padding: 56 }),
    animations: 'disabled',
  })
})

test('4.2 Reiterleiste', async ({ page }) => {
  await openDashboard(page)

  await expect(page.getByRole('tab')).toHaveCount(6)
  const spotlightOff = await spotlight(page, tabBar(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'dashboard_tabs'), animations: 'disabled' })
  await spotlightOff()
})

test('4.2.1 Karten im Reiter „Übersicht"', async ({ page }) => {
  await openDashboard(page)

  const spotlightOff = await spotlight(page, contentArea(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'dashboard_overview'), animations: 'disabled' })
  await spotlightOff()
})

test('4.2.2 Diagramme im Reiter „Trasse"', async ({ page }) => {
  await openDashboard(page)
  await openTab(page, 'Trasse', 'Gesamtlänge pro Oberfläche')

  const spotlightOff = await spotlight(page, contentArea(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'dashboard_trench'), animations: 'disabled' })
  await spotlightOff()
})

test('4.2.2 Kurzhinweis auf einem Balken', async ({ page }) => {
  await openDashboard(page)
  await openTab(page, 'Trasse', 'Gesamtlänge pro Oberfläche')

  const chart = card(page, 'Gesamtlänge pro Oberfläche')
  const canvas = chart.locator('canvas')

  const bars = await measureBars(canvas, CHART_BLUE)
  expect(
    bars.length,
    'No bar in #0ea5e9 was found in the chart "Gesamtlänge pro Oberfläche" - ' +
      'is the colour in TrenchStatistics.svelte still the same?',
  ).toBeGreaterThan(0)

  const withoutTooltip = await countDarkPixels(canvas)

  // Explicitly **no** moveCursorAway() here: the tooltip is the subject and
  // depends on hovering. Hovered is the longest bar (Chart.js sorts the
  // surfaces descending, so the first one is the longest).
  await page.mouse.move(bars[0].x, bars[0].y)
  // The tooltip fades in; waiting happens through the painted picture.
  await chartsSettled(page)

  expect(
    await countDarkPixels(canvas),
    'No tooltip is visible in the chart. Chart.js draws it into the canvas and ' +
      'only shows it while the cursor rests on the bar.',
  ).toBeGreaterThan(withoutTooltip * 2)

  await page.screenshot({
    path: shotPath(CHAPTER, 'dashboard_trench_hover'),
    clip: await crop16by10(page, chart),
    animations: 'disabled',
  })
})

test('4.2.3 Auswertungen im Reiter „Rohre"', async ({ page }) => {
  await openDashboard(page)
  await openTab(page, 'Rohre', 'Top 5 längste Rohre')

  const spotlightOff = await spotlight(page, contentArea(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'dashboard_conduit'), animations: 'disabled' })
  await spotlightOff()
})

test('4.2.4 Diagramme im Reiter „Netzknoten"', async ({ page }) => {
  await openDashboard(page)
  await openTab(page, 'Netzknoten', 'Netzknoten nach Ort')

  const spotlightOff = await spotlight(page, contentArea(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'dashboard_node'), animations: 'disabled' })
  await spotlightOff()
})

test('4.2.5 Diagramme im Reiter „Adressen"', async ({ page }) => {
  await openDashboard(page)
  await openTab(page, 'Adressen', 'Adressen nach Ort')

  const spotlightOff = await spotlight(page, contentArea(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'dashboard_address'), animations: 'disabled' })
  await spotlightOff()
})

test('4.2.6 Karten und Diagramme im Reiter „Gebiete"', async ({ page }) => {
  await openDashboard(page)
  await openTab(page, 'Gebiete', 'Gebiete nach Typ')

  const spotlightOff = await spotlight(page, contentArea(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'dashboard_area'), animations: 'disabled' })
  await spotlightOff()
})

// Deliberately the last block of the file: seeding changes the data of the test
// project, and the figures then sit in the cache of the backend for up to five
// minutes (see clearDashboardCache()). All images above are therefore taken
// beforehand - they show the card "Gewährleistung" in its empty state, the way
// the demo data leave it.
test.describe('Gewährleistung', () => {
  test.beforeAll(seedDeadlines)
  // Runs even when the test case fails. Without it every following run - and
  // every other chapter - would carry the seeded deadlines along.
  test.afterAll(revertDeadlines)

  test('4.2.1 Karte „Gewährleistung" mit ablaufenden Fristen', async ({ page }) => {
    // The page is loaded several times if necessary, see below.
    test.setTimeout(120_000)

    const warrantyCard = () => card(page, 'Gewährleistung')
    const entries = () =>
      warrantyCard().locator(
        '[class*="border-error-500"], [class*="border-warning-500"], [class*="border-success-500"]',
      )

    // gunicorn only stops the old worker processes once they have finished
    // their current request. Right after the restart an old process can
    // therefore still answer and the card stay empty - hence several attempts
    // instead of a single load.
    for (let attempt = 1; attempt <= 8; attempt++) {
      await openDashboard(page)
      if ((await entries().count()) === DEADLINES_IN_DAYS.length) break
      await page.waitForTimeout(1500)
    }

    await expect(
      entries(),
      'The card "Gewährleistung" does not show the seeded deadlines. Is the ' +
        'backend still answering from its cache?',
    ).toHaveCount(DEADLINES_IN_DAYS.length)

    // All three colour levels have to be in the image - that is the point of it.
    for (const [level, colour] of [
      ['under 30 days (red)', 'error'],
      ['under 90 days (yellow)', 'warning'],
      ['from 90 days (green)', 'success'],
    ]) {
      await expect(
        warrantyCard().locator(`[class*="border-${colour}-500"]`),
        `The colour level ${level} is missing from the image.`,
      ).toHaveCount(1)
    }

    // The card sits in the last row of the grid and is partly below the window
    // edge on load. The content area is scrolled to the end: there the card
    // finishes with the padding of main and lies fully inside the image.
    // `scrollIntoViewIfNeeded()` put its bottom edge exactly on the window edge
    // and clipped the border.
    await page.locator('main').evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    await moveCursorAway(page)
    await expect(warrantyCard()).toBeInViewport({ ratio: 1 })

    const spotlightOff = await spotlight(page, warrantyCard())
    await page.screenshot({ path: shotPath(CHAPTER, 'dashboard_warranty'), animations: 'disabled' })
    await spotlightOff()
  })
})
