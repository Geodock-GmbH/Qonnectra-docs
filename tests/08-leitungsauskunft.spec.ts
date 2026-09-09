import { expect, request as playwrightRequest, test, type Locator, type Page } from '@playwright/test'

import { localApp, superuserCredentials } from '../playwright/local-app'
import { disableAnimations, moveCursorAway, shotPath, spotlight } from '../playwright/manual-shots'

// Screenshots for chapter "8. Leitungsauskunft" in the manual
// (manual/teil-a-anwenderhandbuch/08-leitungsauskunft.md). Produces all images
// of the chapter; the video sits in tests/08-leitungsauskunft-video.spec.ts.
//
// This spec WRITES to the database and cleans up after itself, see seedRecords()
// below. Everything it creates is a pipeline record - the demo data brings
// exactly one, and a chapter about a table cannot be illustrated with a single
// row.
//
// Publish to public/images/ with: pnpm screenshots:publish 08-leitungsauskunft
const CHAPTER = '08-leitungsauskunft'

/**
 * The pipeline record of the demo data
 * (scripts/qonnectra-demo-data/testprojekt-export.json). It is the only one
 * with an inquiry area ("Area 1"), so the images of the sections 8.3 and 8.4
 * hang off it - "Auskunft bearbeiten" and "Exportieren" only exist for a record
 * that has one.
 */
const DEMO_RECORD_UUID = '4ca3dfd5-c42d-4a84-a2b2-68e2d2d36a14'

/** "Testprojekt" of the demo data, pinned by playwright/auth.setup.ts. */
const TEST_PROJECT_ID = 2
/** Project "Default", created by the setup of every instance. */
const DEFAULT_PROJECT_ID = 1

/**
 * Records created for the captures.
 *
 * The contact fields of a pipeline record are personal data, and this chapter
 * is the only one in part A whose images show any. They therefore use
 * placeholder values that are recognisable as such at a glance - "Mustermann",
 * "Musterstadt" and phone numbers made of an ascending run of digits behind the
 * unassigned prefix 0123. A plausible-looking name with a real dialling code
 * reads like a real contact even when it is invented, and nothing in the image
 * tells a reader otherwise (see "Personal data in images" in CLAUDE.md).
 *
 * One record sits in the project "Default" and not in "Testprojekt": the table
 * is the only view in Qonnectra that is not restricted to the selected project
 * (`get_queryset` of `PipelineRecordViewSet` filters nothing), and section 8.1
 * warns about exactly that. Without a second project in the column "Projekt"
 * the image would show the opposite of what the text says.
 */
const SEED_RECORDS = [
  {
    project: TEST_PROJECT_ID,
    organisation: 'Musterbau GmbH',
    name: 'Max Mustermann',
    tel: '0123 456789',
    mobile: '',
  },
  {
    project: TEST_PROJECT_ID,
    organisation: 'Stadtwerke Musterstadt',
    name: 'Erika Mustermann',
    tel: '0123 456780',
    mobile: '',
  },
  {
    project: DEFAULT_PROJECT_ID,
    organisation: 'Ingenieurbüro Muster',
    name: 'Erika Mustermann',
    tel: '',
    mobile: '0123 456781',
  },
]

/** Values the create form of section 8.2 is filled with - placeholders, see above. */
const NEW_RECORD = {
  organisation: 'Musterbau GmbH',
  name: 'Max Mustermann',
  tel: '0123 456789',
  mobile: '0123 456788',
}

const uuidsToRemove: string[] = []

/**
 * Creates the additional records through the API and registers them for
 * removal.
 *
 * Creating goes through the capture account (group "Editor" may POST),
 * removing through the superuser: "Editor" has access level "edit" and is not
 * allowed to DELETE (`RoleBasedPermission`), so the account that creates the
 * records cannot get rid of them again.
 */
async function seedRecords() {
  const { apiUrl, username, password } = localApp()
  const api = await playwrightRequest.newContext({ baseURL: apiUrl, ignoreHTTPSErrors: true })
  await api.post('/api/v1/auth/login/', { data: { username, password } })

  for (const record of SEED_RECORDS) {
    const response = await api.post('/api/v1/pipeline-records/', {
      data: { ...record, type_of_work_value: 1, request_reason_value: 1 },
    })
    expect(response.ok(), `Creating the record failed: HTTP ${response.status()}`).toBeTruthy()
    uuidsToRemove.push((await response.json()).uuid)
  }

  await api.dispose()
}

/** Removes everything seedRecords() created. */
async function removeSeededRecords() {
  if (uuidsToRemove.length === 0) return

  const { apiUrl } = localApp()
  const api = await playwrightRequest.newContext({ baseURL: apiUrl, ignoreHTTPSErrors: true })
  await api.post('/api/v1/auth/login/', { data: superuserCredentials() })

  for (const uuid of uuidsToRemove.splice(0)) {
    const response = await api.delete(`/api/v1/pipeline-records/${uuid}/`)
    expect(
      response.status(),
      `The record ${uuid} was left behind - the next run would start from a different state.`,
    ).toBe(204)
  }

  await api.dispose()
}

test.beforeAll(seedRecords)
test.afterAll(removeSeededRecords)

/** Opens the table of the pipeline records. */
async function openRecords(page: Page) {
  await page.goto('/pipeline-records')
  await expect(page.getByRole('button', { name: 'Erstellen', exact: true })).toBeVisible()
  // The seeded records have to be in the table, otherwise the image shows the
  // state before the seeding.
  await expect(page.getByRole('cell', { name: 'Musterbau GmbH' })).toBeVisible({
    timeout: 20_000,
  })
  await page.waitForLoadState('networkidle')

  await disableAnimations(page)
  await moveCursorAway(page)
}

/** Opens the detail view of the demo record, which has an inquiry area. */
async function openDemoRecord(page: Page) {
  await page.goto(`/pipeline-records/${DEMO_RECORD_UUID}`)
  await expect(page.getByRole('button', { name: 'Auskunft bearbeiten' })).toBeVisible({
    timeout: 20_000,
  })
  await page.waitForLoadState('networkidle')

  await disableAnimations(page)
  await moveCursorAway(page)
}

/**
 * Opens the detail view of the first seeded record.
 *
 * Section 8.5 works with it and not with the demo record: that one carries no
 * contact data, so its detail view would show three cards of empty fields. The
 * seeded record has them filled and shows in addition what the section warns
 * about - "Art der Arbeit" and "Grund der Anfrage" stay at "-" although the
 * record has both.
 */
async function openSeededRecord(page: Page) {
  await page.goto(`/pipeline-records/${uuidsToRemove[0]}`)
  await expect(page.locator('input[name="organisation"]')).toHaveValue(
    SEED_RECORDS[0].organisation,
    { timeout: 20_000 },
  )
  await page.waitForLoadState('networkidle')

  await disableAnimations(page)
  await moveCursorAway(page)
}

/**
 * Corners of the area drawn for the images, in CSS pixels of the viewport.
 *
 * Hard-coded and not measured: the map position is seeded by
 * playwright/auth.setup.ts (mapCenter/mapZoom), so the same pixel always hits
 * the same place. The four points frame the western cluster of addresses of the
 * demo data - small enough that objects stay outside the area, which is what
 * makes the highlighting readable in the first place.
 */
const AREA_CORNERS = [
  { x: 860, y: 520 },
  { x: 1130, y: 505 },
  { x: 1150, y: 725 },
  { x: 880, y: 740 },
]

/** Name the drawn area gets - Sterup is the place the demo project lies in. */
const AREA_NAME = 'Sterup Nord'

/**
 * Opens the inquiry map of a record and waits for it to be ready to draw.
 *
 * The tiles arrive through a worker pool that networkidle does not see, and the
 * highlighting of the objects inside an area follows on the next render of the
 * tile layers - neither shows up as a DOM change, which is why the wait is a
 * timed one.
 */
async function openInquiry(page: Page, uuid: string) {
  await page.goto(`/pipeline-records/${uuid}/inquiry`)
  await expect(page.locator('div.map canvas').first()).toBeVisible({ timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(4000)

  await disableAnimations(page)
  await moveCursorAway(page)
}

/**
 * Draws AREA_CORNERS into the open map, names the area and switches the tool
 * off again.
 *
 * Drawing goes through the mouse and not through the API, because only that way
 * do the images show what the app itself produces from the interaction - the
 * polygon in its saved style, the objects inside it highlighted, and the entry
 * in the list "Auskunftsbereiche".
 *
 * The tool is switched off at the end: the images show the default state, and a
 * switched-on tool (yellow button) is a state users have to produce themselves
 * first.
 */
async function drawArea(page: Page) {
  await page.getByRole('button', { name: 'Polygon zeichnen' }).click()

  const last = AREA_CORNERS.length - 1
  for (const [index, corner] of AREA_CORNERS.entries()) {
    if (index === last) {
      // A double-click sets the last corner and closes the polygon; OpenLayers
      // has no separate way of finishing it.
      await page.mouse.dblclick(corner.x, corner.y)
    } else {
      await page.mouse.click(corner.x, corner.y)
    }
    await page.waitForTimeout(120)
  }

  // The panel exists only while there is at least one area, so its heading is
  // the signal that the polygon has arrived in the backend.
  await expect(page.getByRole('heading', { name: 'Auskunftsbereiche' })).toBeVisible({
    timeout: 20_000,
  })

  const nameField = page.getByLabel('Bereichsname')
  await nameField.fill(AREA_NAME)
  await nameField.press('Enter')

  await page.getByRole('button', { name: 'Zeichnen beenden' }).click()
  await expect(page.getByRole('button', { name: 'Polygon zeichnen' })).toBeVisible()

  // Highlighting and the label at the polygon follow on the next render of the
  // tile layers.
  await page.waitForTimeout(2500)
  await moveCursorAway(page)
}

/**
 * Search field above the table, without the button "+ Erstellen" next to it -
 * both sit in the same `nav.btn-group`, whose bounding box would take the
 * button along (SearchInput.svelte).
 */
function tableSearch(page: Page): Locator {
  return page.locator('div.search-container')
}

/** Row of filter fields below the column headings. */
function columnFilters(page: Page): Locator {
  return page.locator('thead tr').nth(1)
}

/** The two map tools of the inquiry view, top left below the search. */
function inquiryTools(page: Page): Locator {
  return page.locator('div.absolute.top-16.left-4')
}

/** Panel "Auskunftsbereiche" on the right of the inquiry view. */
function inquiryAreaList(page: Page): Locator {
  return page.locator('div.order-2').first()
}

test('8. Übersicht der Leitungsauskunft', async ({ page }) => {
  await openRecords(page)
  await page.screenshot({ path: shotPath(CHAPTER, 'records') })
})

test('8.1 Auskünfte suchen und filtern', async ({ page }) => {
  await openRecords(page)

  const spotlightOff = await spotlight(page, [tableSearch(page), columnFilters(page)])
  await page.screenshot({ path: shotPath(CHAPTER, 'records_search') })
  await spotlightOff()
})

test('8.2 Neue Auskunft anlegen', async ({ page }) => {
  await page.goto('/pipeline-records/new')
  await expect(page.getByRole('button', { name: 'Erstellen', exact: true })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await disableAnimations(page)

  // Only fills the form; "Erstellen" is deliberately not pressed. The image
  // shows the state right before saving, and nothing has to be cleaned up.
  await page.locator('input[name="organisation"]').fill(NEW_RECORD.organisation)
  await page.locator('input[name="name"]').fill(NEW_RECORD.name)
  await page.locator('input[name="tel"]').fill(NEW_RECORD.tel)
  await page.locator('input[name="mobile"]').fill(NEW_RECORD.mobile)

  // The two comboboxes take their value from a click on the list, not from
  // typing (see section 3.2). The list opens through the arrow at the right
  // edge; a click into the input field alone leaves it closed.
  for (const label of ['Art der Arbeit', 'Grund der Anfrage']) {
    const field = page.locator('label').filter({ hasText: label })
    await field.locator('[data-scope="combobox"][data-part="trigger"]').click()
    await page.getByRole('option').first().click()
  }

  // The last combobox keeps the focus ring after the click; it would sit in the
  // image as a green frame around a field that is not the subject.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())

  await moveCursorAway(page)
  await page.screenshot({ path: shotPath(CHAPTER, 'records_new') })
})

test('8.3 Auskunftsbereiche zeichnen, umbenennen und löschen', async ({ page }) => {
  // The second seeded record and not the demo one: that one carries an area
  // spanning the whole network ("Area 1"), whose outline runs outside the map
  // and whose highlighting covers everything - an image in which no object is
  // left un-highlighted shows nothing about the highlighting.
  await openInquiry(page, uuidsToRemove[1])
  await drawArea(page)

  await page.screenshot({ path: shotPath(CHAPTER, 'records_inquiry') })

  const spotlightOff = await spotlight(page, [inquiryTools(page), inquiryAreaList(page)])
  await page.screenshot({ path: shotPath(CHAPTER, 'records_inquiry_tools') })
  await spotlightOff()
})

test('8.4 Auskunft exportieren', async ({ page }) => {
  await openDemoRecord(page)

  // Only the button, not the export itself: the download opens a save dialog
  // of the browser (showSaveFilePicker in $lib/utils/saveFile.ts), which is not
  // part of the app and would not be in the image anyway.
  const exportButton = page.getByRole('button', { name: 'Exportieren' }).first()
  const spotlightOff = await spotlight(page, exportButton)
  await page.screenshot({ path: shotPath(CHAPTER, 'records_export') })
  await spotlightOff()
})

test('8.5 Auskunft ändern und löschen', async ({ page }) => {
  await openSeededRecord(page)

  const buttons = page.locator('div.hidden.sm\\:flex').first()
  const spotlightOff = await spotlight(page, [
    buttons.getByRole('button', { name: 'Löschen' }),
    buttons.getByRole('button', { name: 'Speichern' }),
  ])
  await page.screenshot({ path: shotPath(CHAPTER, 'records_detail') })
  await spotlightOff()
})
