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
  disableAnimations,
  moveCursorAway,
  shotPath,
  spotlight,
} from '../playwright/manual-shots'

// Screenshots for chapter "6. Rohrverwaltung" in the manual
// (manual/teil-a-anwenderhandbuch/06-rohrverwaltung.md). Produces all images of
// the chapter:
//
//   conduit                  plain overview shot (pattern 1)
//   conduit_table            column headings and paging (pattern 2)
//   conduit_search           search field above the table (pattern 2)
//   conduit_search_columns   search fields below the headings (pattern 2)
//   conduit_add              dialog "Rohr hinzufügen" (pattern 1)
//   conduit_properties       info box, tab "Eigenschaften" (pattern 2)
//   conduit_status           info box, tab "Status" (pattern 2)
//   conduit_attachment       info box, tab "Anhänge" (pattern 2)
//   conduit_excel            the two Excel buttons (pattern 2)
//
// The video of the chapter (conduit_add.webm) sits in
// tests/06-rohrverwaltung-video.spec.ts - test.use({ video: ... }) is only
// allowed at file level.
//
// Publish to public/images/ with: pnpm screenshots:publish 06-rohrverwaltung
const CHAPTER = '06-rohrverwaltung'

/**
 * Number of conduits in the test project. Checked on every load, because the
 * images show it ("7 Ergebnisse") and because a leftover from an aborted video
 * run would otherwise silently end up in the picture.
 */
const CONDUIT_COUNT = 7

/**
 * The conduit the images of the info box are taken of. Deliberately by name and
 * not by row position: as soon as the list is sorted or filtered, position 1 is
 * a different conduit.
 */
const CONDUIT = 'St-V02-01'

/**
 * Width the info box is opened at, in CSS pixels. At its default of 400 px the
 * tabs "Status" and "Anhänge" are cut off - the microduct table loses the
 * columns "Kabel" and "Status", the upload area breaks its labels mid-word.
 * That is exactly the case section 6.4 describes ("drag the box wider"), so the
 * images show the widened state.
 */
const DRAWER_WIDTH = 760

/** Yields three of the seven conduits and therefore a visibly shorter table. */
const SEARCH_TERM = 'VL'

/** Conduit type of the four St-V02 conduits - filters the table down to four rows. */
const COLUMN_FILTER = { column: 'Rohrtyp', term: '12x10' }

/** Attachment for the image of the tab "Anhänge"; removed again afterwards. */
const FILE = 'Bestandsplan.pdf'

/**
 * Smallest possible valid PDF file. It is only uploaded, never opened; the app
 * derives icon and folder from the extension alone. That is why a generated
 * file sits here instead of a sample file in the repo.
 */
const PDF = Buffer.from(
  '%PDF-1.4\n' +
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\n' +
    'trailer<</Root 1 0 R>>\n%%EOF\n',
  'latin1',
)

// ---------------------------------------------------------------------------
// Building blocks of the interface
// ---------------------------------------------------------------------------

/**
 * Opens the conduit management of the test project and waits until the table is
 * there.
 *
 * `/conduit` redirects to `/conduit/2` - the 2 is the test project (cookie
 * `selected-project`, set in playwright/auth.setup.ts). That is checked
 * explicitly: without the cookie the app shows the project "Default", which has
 * no conduits at all, and every image would be of an empty table.
 *
 * `drawerWidth` seeds the width of the info box. It is persisted per browser
 * (`drawerWidth` in localStorage) and shared with the map, so without seeding
 * the width of the previous run would decide how the image looks.
 */
async function openConduits(page: Page, drawerWidth = 400) {
  await page.addInitScript((width) => {
    localStorage.setItem('drawerWidth', String(width))
    // The dialog "Rohr hinzufügen" pre-fills itself from the last conduit
    // created in this browser (ConduitState). For the image it should show the
    // empty form.
    localStorage.removeItem('conduit-form-defaults')
  }, drawerWidth)

  await page.goto('/conduit')
  await expect(page).toHaveURL(/\/conduit\/2(\/|$)/)

  await expect(page.locator('table tbody tr').first()).toBeVisible()
  await expect(
    page.locator('table tbody tr'),
    'The test project does not hold the expected number of conduits. Has a ' +
      'run been aborted and left one behind? tests/06-rohrverwaltung-video.spec.ts ' +
      'removes its conduit again through the API.',
  ).toHaveCount(CONDUIT_COUNT)
  await page.waitForLoadState('networkidle')

  await disableAnimations(page)
  await moveCursorAway(page)
}

/** Row of the table by conduit name. */
function conduitRow(page: Page, name: string): Locator {
  return page
    .locator('table tbody tr')
    .filter({ has: page.getByRole('cell', { name, exact: true }) })
}

/**
 * Search field below a column heading.
 *
 * Every column is filterable (`columnConfig` in PipeTable.svelte), so the n-th
 * input of the filter row belongs to the n-th heading. If that ever changes,
 * the lookup has to go through the column key instead of the position.
 */
async function columnFilter(page: Page, column: string): Promise<Locator> {
  const headings = await page.locator('table thead tr').first().locator('th').allInnerTexts()
  const index = headings.findIndex((text) => text.trim() === column)
  expect(
    index,
    `There is no column "${column}" - have the headings in PipeTable.svelte changed?`,
  ).toBeGreaterThanOrEqual(0)

  return page.locator('table thead tr').nth(1).locator('input').nth(index)
}

/**
 * Opens the info box of a conduit and waits until it has fully slid in.
 *
 * The box arrives with a Svelte transition (`transition:fly`, 300 ms). That is
 * driven by JavaScript and not by CSS, so `disableAnimations()` does not stop
 * it - a screenshot taken right away catches the box halfway across the table.
 */
async function openDrawer(page: Page, name: string): Promise<Locator> {
  await conduitRow(page, name).click()

  const drawer = page.locator('[data-drawer]')
  await expect(page.locator('#drawer-title')).toHaveText(name)
  await expect(drawer).toBeVisible()
  await page.waitForTimeout(600)
  await moveCursorAway(page)

  return drawer
}

/**
 * Switches to a tab of the info box and waits for a piece of its content, so
 * that the screenshot does not catch the previous tab.
 */
async function openTab(page: Page, drawer: Locator, tab: string, content: Locator) {
  await drawer.getByRole('tab', { name: tab, exact: true }).click()
  await expect(content).toBeVisible()
  await moveCursorAway(page)
}

// ---------------------------------------------------------------------------
// Attachment for the image of the tab "Anhänge"
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

/** UUID of a conduit of the test project - the attachments hang off it. */
async function conduitUuid(name: string): Promise<string> {
  const { username, password } = localApp()
  const api = await apiContext({ username, password })
  try {
    const response = await api.get(`/api/v1/conduit/all/?project=2&page_size=200`)
    const body = await response.json()
    const conduits: Array<{ uuid: string; name: string }> = body.results ?? body
    const conduit = conduits.find((entry) => entry.name === name)
    expect(conduit, `The conduit "${name}" does not exist in the test project.`).toBeDefined()
    return conduit!.uuid
  } finally {
    await api.dispose()
  }
}

/**
 * Removes all attachments of the conduit - with the superuser, because the
 * capture account (group "Editor") has access level "edit" and the API answers
 * DELETE with 403.
 *
 * Runs before **and** after the capture: before, so that the folder in the image
 * holds exactly one file, afterwards so that the next run finds the same state.
 */
async function cleanUpAttachments(uuid: string) {
  const api = await apiContext(superuserCredentials())
  try {
    const response = await api.get(`/api/v1/feature-files/?object_id=${uuid}&page_size=200`)
    const body = await response.json()
    const files: Array<{ uuid: string }> = body.results ?? body
    for (const file of files) {
      await api.delete(`/api/v1/feature-files/${file.uuid}/`)
    }
  } finally {
    await api.dispose()
  }
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

test('6. Übersicht der Rohrverwaltung', async ({ page }) => {
  await openConduits(page)
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit') })
})

test('6.1 Aufbau der Tabelle', async ({ page }) => {
  await openConduits(page)

  // Both places belong together: the headings are what you sort by, and the
  // paging below decides which conduits the sorting reaches at all.
  const headings = page.locator('table thead tr').first()
  const paging = page.getByTestId('pagination-count').locator('xpath=..')

  const spotlightOff = await spotlight(page, [headings, paging])
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit_table') })
  await spotlightOff()
})

test('6.2 Suchfeld oben', async ({ page }) => {
  await openConduits(page)

  // The search is carried out, not just shown: only then does the image show
  // what it does - a shorter table and a different count below it.
  const field = page.getByTestId('search-input')
  await field.fill(SEARCH_TERM)
  await field.press('Enter')
  await expect(page).toHaveURL(new RegExp(`search=${SEARCH_TERM}`))
  await expect(page.locator('table tbody tr')).toHaveCount(3)
  await moveCursorAway(page)

  const spotlightOff = await spotlight(page, page.locator('.search-container'))
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit_search') })
  await spotlightOff()
})

test('6.2 Suchfelder unter den Spaltenüberschriften', async ({ page }) => {
  await openConduits(page)

  // Typed character by character, because the fields filter while typing. With
  // fill() the same state comes out, but the image would not prove that no
  // Enter is needed.
  const filter = await columnFilter(page, COLUMN_FILTER.column)
  await filter.click()
  await filter.pressSequentially(COLUMN_FILTER.term, { delay: 40 })
  await expect(page.locator('table tbody tr')).toHaveCount(4)
  await moveCursorAway(page)

  const spotlightOff = await spotlight(page, page.locator('table thead tr').nth(1))
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit_search_columns') })
  await spotlightOff()
})

test('6.3 Rohr hinzufügen', async ({ page }) => {
  await openConduits(page)

  await page.getByTestId('add-conduit-button').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Rohr hinzufügen' })).toBeVisible()

  // No spotlight: the dialog dims and blurs the interface behind it itself.
  await expect(dialog.locator('#pipe-name')).toHaveValue('')
  await page.waitForTimeout(400)
  await moveCursorAway(page)
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit_add') })
})

test('6.4.1 Reiter „Eigenschaften"', async ({ page }) => {
  await openConduits(page, DRAWER_WIDTH)
  const drawer = await openDrawer(page, CONDUIT)

  await expect(drawer.getByRole('button', { name: 'Rohr löschen', exact: true })).toBeVisible()

  const spotlightOff = await spotlight(page, drawer)
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit_properties') })
  await spotlightOff()
})

test('6.4.2 Reiter „Status"', async ({ page }) => {
  await openConduits(page, DRAWER_WIDTH)
  const drawer = await openDrawer(page, CONDUIT)

  await openTab(page, drawer, 'Status', drawer.getByRole('cell', { name: 'rot' }))

  // The status fields are comboboxes and show a pulsing placeholder while they
  // are still loading their options. Waiting for the value of the first field
  // is therefore not a detail check but the signal that the table is drawn.
  const firstStatus = drawer.locator('table tbody tr').first().locator('input')
  await expect(
    firstStatus,
    'The status of the first microduct is not "Intakt" - does the test project ' +
      'still hold an entered fault?',
  ).toHaveValue('Intakt')
  await expect(drawer.locator('.placeholder.animate-pulse')).toHaveCount(0)

  const spotlightOff = await spotlight(page, drawer)
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit_status') })
  await spotlightOff()
})

test('6.4.3 Reiter „Anhänge"', async ({ page }) => {
  test.setTimeout(120_000)

  const uuid = await conduitUuid(CONDUIT)
  await cleanUpAttachments(uuid)

  try {
    await openConduits(page, DRAWER_WIDTH)
    const drawer = await openDrawer(page, CONDUIT)

    await openTab(page, drawer, 'Anhänge', drawer.getByText('Dateien hochladen'))

    // The section is about the list of existing files - an image of the empty
    // upload area would show nothing of it. So one file is uploaded and removed
    // again afterwards.
    const dialog = page.waitForEvent('filechooser')
    await drawer.getByRole('button', { name: 'Dateien auswählen', exact: true }).click()
    await (await dialog).setFiles({ name: FILE, mimeType: 'application/pdf', buffer: PDF })
    await drawer.getByRole('button', { name: /^Upload/ }).click()

    // Files are sorted into folders by their kind; a PDF lands in "documents".
    const folder = drawer.getByText('documents (1)')
    await expect(folder).toBeVisible({ timeout: 20_000 })

    // Only an expanded folder shows its files.
    await folder.click()
    const file = drawer.getByText(FILE, { exact: true })
    await expect(file).toBeVisible()

    // Away from the file row: its buttons ("Herunterladen", "Umbenennen",
    // "Datei löschen") only appear on hover, and a screenshot shows no mouse
    // cursor - they would look unmotivated in the image.
    await moveCursorAway(page)

    // The upload leaves a success message at the bottom edge of the window. It
    // belongs to the capture, not to the state the section describes, so the
    // shot waits until it has faded out on its own.
    await expect(page.getByText('Dateien erfolgreich hochgeladen')).toBeHidden({
      timeout: 20_000,
    })

    const spotlightOff = await spotlight(page, drawer)
    await page.screenshot({ path: shotPath(CHAPTER, 'conduit_attachment') })
    await spotlightOff()
  } finally {
    await cleanUpAttachments(uuid)
  }
})

test('6.5 Excel-Vorlage und Datenimport', async ({ page }) => {
  await openConduits(page)

  // Both buttons sit in one nav; a cut-out per button would put two outlines
  // right next to each other.
  const buttons = page
    .getByRole('button', { name: 'Vorlage', exact: true })
    .locator('xpath=ancestor::nav[1]')

  const spotlightOff = await spotlight(page, buttons)
  await page.screenshot({ path: shotPath(CHAPTER, 'conduit_excel') })
  await spotlightOff()
})
