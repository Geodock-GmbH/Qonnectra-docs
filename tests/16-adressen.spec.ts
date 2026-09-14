import { expect, test, type Locator, type Page } from '@playwright/test'

import { disableAnimations, moveCursorAway, shotPath, spotlight } from '../playwright/manual-shots'

// Screenshots for chapter "16. Adressen" in the manual
// (manual/teil-a-anwenderhandbuch/16-adressen.md). Produces all images of the
// chapter:
//
//   address             plain overview shot of the address list (pattern 1)
//   address_search      search field and the one remaining hit (pattern 2)
//   address_detail      plain shot of the detail page (pattern 1)
//   address_pdf         "PDF herunterladen" with the opened option (pattern 2)
//   address_units       section "Wohneinheiten" with "+ Hinzufügen" (pattern 2)
//   address_unit_modal  the filled window "Wohneinheit hinzufügen" (pattern 1)
//   address_unit        plain shot of a residential unit (pattern 1)
//
// The video of the chapter sits in tests/16-adressen-video.spec.ts -
// test.use({ video: ... }) is only allowed at file level.
//
// None of the images changes data. address_unit_modal fills the window but
// never saves it; the values are the placeholders from CLAUDE.md, so that an
// aborted run cannot leave anything person-like behind either.
//
// Publish to public/images/ with: pnpm screenshots:publish 16-adressen
const CHAPTER = '16-adressen'

/**
 * The address the detail images are taken of.
 *
 * Picked out of the demo data because it is the only one that shows all three
 * lower sections filled at once: a microduct connection, five residential units
 * - enough for the table without triggering its pagination at eleven - and a
 * geometry, so the small map in "Standort" is drawn.
 */
const ADDRESS = {
  uuid: '613504f0-d3a3-48e5-9a83-b886b51f8345',
  id: 'CDXLFYH',
  title: 'Toft 15',
  units: 5,
}

/**
 * The residential unit of ADDRESS the image of the detail page is taken of: the
 * one on the ground floor, and the first row of the table.
 */
const UNIT = { uuid: 'b82c1e87-ccc6-40fd-a93c-56fb12260e9e', id: 'NDFZTLYM' }

/**
 * Search term for address_search. Two tokens, and the section is about exactly
 * that: they are ANDed, so "Toft 15" leaves one hit instead of all Toft
 * addresses.
 */
const SEARCH = { term: 'Toft 15', hits: 1 }

/** Rows per page of the address table, see section 3.1 of the manual. */
const PAGE_SIZE = 50

/**
 * Values for the filled window "Wohneinheit hinzufügen".
 *
 * Recognisable placeholders, see CLAUDE.md: the window is never saved, but a
 * run aborted mid-way must not leave anything that could be read as real data.
 * "Wohneinheit-ID" stays empty on purpose - section 16.3 says that Qonnectra
 * fills it in itself then.
 */
const NEW_UNIT = { floor: '6', side: 'links', buildingSection: 'A', externalId: 'MUSTER-1' }

// ---------------------------------------------------------------------------
// Building blocks of the interface
// ---------------------------------------------------------------------------

/** Opens the address list of the test project. */
async function openAddressList(page: Page) {
  await page.goto('/address')
  await expect(page).toHaveURL(/\/address\/2(\?|$)/)

  // A full first page - ADDRESS itself is not on it: the list is sorted by
  // street, and its street sits on a later page.
  await expect(page.locator('table tbody tr')).toHaveCount(PAGE_SIZE)
  await disableAnimations(page)
  await moveCursorAway(page)
}

/** Opens the detail page of ADDRESS. */
async function openAddress(page: Page) {
  await page.goto(`/address/2/${ADDRESS.uuid}`)

  await expect(page.getByRole('heading', { name: ADDRESS.title, level: 1 })).toBeVisible()
  // The small map in "Standort" is built in onMount and only then replaces the
  // pulsing placeholder. Without the wait the image shows the placeholder.
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  await disableAnimations(page)
  await moveCursorAway(page)
}

/** The card of a section of the detail page, addressed through its heading. */
function section(page: Page, heading: string): Locator {
  return page
    .getByRole('heading', { name: heading, level: 2 })
    .locator('xpath=ancestor::div[contains(@class,"card")][1]')
}

/**
 * Scrolls `target` into view and waits until it has come to rest.
 *
 * The detail page is longer than the window; the lower sections are only in
 * frame after scrolling. `disableAnimations()` switches off transitions but not
 * the smooth scrolling of the browser, hence the wait.
 */
async function scrollTo(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  await moveCursorAway(page)
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

test('16. Übersicht der Adressliste', async ({ page }) => {
  await openAddressList(page)

  await page.screenshot({ path: shotPath(CHAPTER, 'address') })
})

test('16.1 Suche in der Adressliste', async ({ page }) => {
  await openAddressList(page)

  const search = page.getByTestId('search-input')
  await search.fill(SEARCH.term)
  await search.press('Enter')

  await expect(
    page.locator('table tbody tr'),
    `The search for "${SEARCH.term}" does not leave ${SEARCH.hits} hit. Has the ` +
      'demo data changed?',
  ).toHaveCount(SEARCH.hits)
  await moveCursorAway(page)

  // Two places at once: the search field with the term and the row that is left
  // of the table. Exposing the field alone would not show what the search did.
  const spotlightOff = await spotlight(page, [
    search.locator('xpath=..'),
    page.locator('table tbody tr').first(),
  ])
  await page.screenshot({ path: shotPath(CHAPTER, 'address_search') })
  await spotlightOff()
})

test('16.2 Adressdetails', async ({ page }) => {
  await openAddress(page)

  await page.screenshot({ path: shotPath(CHAPTER, 'address_detail') })
})

test('16.2 PDF herunterladen mit Wohneinheiten', async ({ page }) => {
  await openAddress(page)

  // The chevron next to the button opens the menu with the single option. It
  // carries no caption, only the button next to it - hence the position.
  const pdf = page.getByRole('button', { name: 'PDF herunterladen' })
  await pdf.locator('xpath=following-sibling::button[1]').click()

  const option = page.getByText('mit Wohneinheiten')
  await expect(option).toBeVisible()
  await moveCursorAway(page)

  const spotlightOff = await spotlight(page, [
    pdf.locator('xpath=..'),
    option.locator('xpath=ancestor::*[@data-part="content"][1]'),
  ])
  await page.screenshot({ path: shotPath(CHAPTER, 'address_pdf') })
  await spotlightOff()
})

test('16.3 Abschnitt „Wohneinheiten"', async ({ page }) => {
  await openAddress(page)

  const units = section(page, 'Wohneinheiten')
  await scrollTo(page, units)

  await expect(
    units.locator('table tbody tr'),
    `The address ${ADDRESS.id} does not carry ${ADDRESS.units} residential ` +
      'units. Has the demo data changed?',
  ).toHaveCount(ADDRESS.units)

  const spotlightOff = await spotlight(page, units)
  await page.screenshot({ path: shotPath(CHAPTER, 'address_units') })
  await spotlightOff()
})

test('16.3 Fenster „Wohneinheit hinzufügen"', async ({ page }) => {
  await openAddress(page)

  await scrollTo(page, section(page, 'Wohneinheiten'))
  await page.getByRole('button', { name: 'Hinzufügen' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Wohneinheit hinzufügen' })).toBeVisible()

  await page.locator('#modal-floor').fill(NEW_UNIT.floor)
  await page.locator('#modal-side').fill(NEW_UNIT.side)
  await page.locator('#modal-building-section').fill(NEW_UNIT.buildingSection)
  await page.locator('#modal-external-id-1').fill(NEW_UNIT.externalId)
  await moveCursorAway(page)

  // Deliberately no spotlight: the window already lifts itself off the page
  // with its own backdrop. Deliberately not saved either - the image needs the
  // filled form, not a new record in the demo data.
  await page.screenshot({ path: shotPath(CHAPTER, 'address_unit_modal') })
})

test('16.3 Wohneinheit im Detail', async ({ page }) => {
  await page.goto(`/address/2/${ADDRESS.uuid}/unit/${UNIT.uuid}`)

  await expect(page.getByRole('heading', { name: UNIT.id, level: 1 })).toBeVisible()
  await page.waitForLoadState('networkidle')

  await disableAnimations(page)
  await moveCursorAway(page)

  await page.screenshot({ path: shotPath(CHAPTER, 'address_unit') })
})
