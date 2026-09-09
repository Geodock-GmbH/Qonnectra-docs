import { expect, test, type Locator, type Page } from '@playwright/test'

import { disableAnimations, moveCursorAway, shotPath, spotlight } from '../playwright/manual-shots'

// Screenshots for chapter "7. Nachverdichtung" in the manual
// (manual/teil-a-anwenderhandbuch/07-nachverdichtung.md). Produces all images
// of the chapter; the video sits in tests/07-nachverdichtung-video.spec.ts.
//
// Nothing here writes to the database: the only action of the view that does -
// changing the "Ausbaustatus" - is triggered by "Exportieren", and no spec
// presses that button. The export dialog is only opened, never confirmed.
//
// Publish to public/images/ with: pnpm screenshots:publish 07-nachverdichtung
const CHAPTER = '07-nachverdichtung'

/**
 * Search term and the address the images work with.
 *
 * "Toft 1" is deliberately not unique: the token "1" is matched as a substring
 * of the house number, so the hit list also holds Toft 10, 17, 19 and 21. That
 * is exactly what section 7.1 explains, and a term with a single hit would show
 * none of it.
 *
 * Toft 1 itself is the most productive address of the demo data for this view:
 * it has an "Ausbaustatus", three residential units and a microduct at its
 * node, so the export dialog and the PDF are not empty.
 */
const SEARCH_TERM = 'Toft 1'
// The address ID comes from the export and no longer from the local database:
// the importer takes id_address over from production, because a trigger would
// otherwise generate a new one on every re-import (see PROJECT_ID and
// id_address in scripts/qonnectra-demo-data/import_geodock_export.py).
const ADDRESS_ID = '6XCTUWG'

/** Opens the post compaction view with an empty search. */
async function openPostCompaction(page: Page) {
  await page.goto('/post-compaction')
  await expect(page.getByRole('heading', { name: 'Nachverdichtung' })).toBeVisible()
  await page.waitForLoadState('networkidle')

  await disableAnimations(page)
  await moveCursorAway(page)
}

function searchField(page: Page): Locator {
  return page.getByPlaceholder('Adresse suchen...')
}

/** Result list below the search field. */
function results(page: Page): Locator {
  return page.locator('div.max-h-80')
}

/**
 * Types the search term the way users do and waits for the hit list.
 *
 * Deliberately not `fill()`: the app only searches around 300 ms after the last
 * keystroke, and a single `fill()` event is enough to trip that timer - but the
 * field then holds the whole term at once, which no `input` sequence of a real
 * keyboard produces. Typing keeps the state the image shows reachable by hand.
 */
async function search(page: Page, term = SEARCH_TERM) {
  await searchField(page).click()
  await searchField(page).pressSequentially(term, { delay: 30 })

  await expect(results(page).getByText(ADDRESS_ID, { exact: true })).toBeVisible({
    timeout: 20_000,
  })
  await moveCursorAway(page)
}

/** Picks Toft 1 from the hit list and waits for the map of the detail view. */
async function selectAddress(page: Page) {
  await results(page).getByRole('button').filter({ hasText: ADDRESS_ID }).click()

  await expect(page.getByText(ADDRESS_ID, { exact: true })).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('.map-container-compact canvas').first()).toBeVisible({
    timeout: 30_000,
  })
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2500)

  await disableAnimations(page)
  await moveCursorAway(page)
}

/** Block with the address values, found through one of its labels. */
function addressValues(page: Page): Locator {
  return page.locator('div.grid').filter({ hasText: 'Adress-ID' }).first()
}

/** Map excerpt of the detail view, including its frame. */
function mapExcerpt(page: Page): Locator {
  return page.locator('div.max-w-md').first()
}

test('7. Übersicht der Nachverdichtung', async ({ page }) => {
  await openPostCompaction(page)
  await page.screenshot({ path: shotPath(CHAPTER, 'compaction') })
})

test('7.1 Adresse suchen', async ({ page }) => {
  await openPostCompaction(page)
  await search(page)

  const spotlightOff = await spotlight(page, [searchField(page), results(page)])
  await page.screenshot({ path: shotPath(CHAPTER, 'compaction_search') })
  await spotlightOff()
})

test('7.2 Angaben zur Adresse und Kartenausschnitt', async ({ page }) => {
  await openPostCompaction(page)
  await search(page)
  await selectAddress(page)

  const spotlightOff = await spotlight(page, [addressValues(page), mapExcerpt(page)])
  await page.screenshot({ path: shotPath(CHAPTER, 'compaction_address') })
  await spotlightOff()
})

test('7.3 Ausbaustatus ändern und Bemerkung erfassen', async ({ page }) => {
  await openPostCompaction(page)
  await search(page)
  await selectAddress(page)

  await page.getByRole('button', { name: 'Start', exact: true }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Ausbaustatus', { exact: true })).toBeVisible()
  await expect(dialog.getByText('Kommentar', { exact: true })).toBeVisible()
  await moveCursorAway(page)

  // No spotlight: the dialog dims and blurs the page behind it by itself, and a
  // scrim on top of that would dim the subject twice over.
  await page.screenshot({ path: shotPath(CHAPTER, 'compaction_export') })
})
