import { expect, test, type Locator, type Page } from '../playwright/test'

import { disableAnimations, moveCursorAway, shoot, spotlight } from '../playwright/manual-shots'
import { stableSearchOrder } from '../playwright/stable-search'

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
  // The hits of "Toft 1" all score the same and come back in an order of
  // Postgres' choosing; see playwright/stable-search.ts.
  await stableSearchOrder(page)
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

/** The request the search field sends, 300 ms after the last keystroke. */
const SEARCH_REQUEST = /\/api\/v1\/trace-search\/\?/

/** Value of the `search` parameter of a request, or undefined for any other. */
function searchTermOf(url: string): string | undefined {
  if (!SEARCH_REQUEST.test(url)) return undefined
  return new URL(url).searchParams.get('search') ?? undefined
}

/** How often the term is typed before search() gives up. */
const SEARCH_ATTEMPTS = 3

/**
 * Types the search term the way users do and waits for the hit list.
 *
 * Deliberately not `fill()`: the app only searches around 300 ms after the last
 * keystroke, and a single `fill()` event is enough to trip that timer - but the
 * field then holds the whole term at once, which no `input` sequence of a real
 * keyboard produces. Typing keeps the state the image shows reachable by hand.
 *
 * The price of typing is that a keystroke held up for more than those 300 ms
 * sends a search for the prefix typed so far. "Toft" already lists Toft 1, so
 * waiting for the address ID passed on that intermediate list, and "Toft 1"
 * then replaced its rows. Same hits, same order - but Chromium snaps the rows,
 * which sit on fractional positions, differently in a list that existed before
 * its final hits arrived, and rows 3 to 5 of compaction_search came out a pixel
 * lower now and then. Hence the count: only a list built from a single search
 * for the full term is used, otherwise the field is emptied - the list goes
 * away with it - and the term is typed again.
 */
async function search(page: Page, term = SEARCH_TERM) {
  for (let attempt = 1; ; attempt++) {
    const searches: string[] = []
    const onRequest = (request: { url(): string }) => {
      const searched = searchTermOf(request.url())
      if (searched !== undefined) searches.push(searched)
    }
    page.on('request', onRequest)
    const finalSearch = page.waitForResponse((response) => searchTermOf(response.url()) === term, {
      timeout: 20_000,
    })

    await searchField(page).click()
    await searchField(page).pressSequentially(term, { delay: 30 })
    await finalSearch
    await expect(results(page).getByText(ADDRESS_ID, { exact: true })).toBeVisible({
      timeout: 20_000,
    })
    page.off('request', onRequest)

    if (searches.length === 1) break
    if (attempt === SEARCH_ATTEMPTS) {
      throw new Error(
        `Search: ${SEARCH_ATTEMPTS} attempts, each sent more than one search (last: ${searches.join(' | ')}).`,
      )
    }

    // An empty field makes the app drop its hits, and the list unmounts.
    await searchField(page).fill('')
    await expect(results(page)).toHaveCount(0)
  }
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
  await shoot(page, CHAPTER, 'compaction')
})

test('7.1 Adresse suchen', async ({ page }) => {
  await openPostCompaction(page)
  await search(page)

  const spotlightOff = await spotlight(page, [searchField(page), results(page)])
  await shoot(page, CHAPTER, 'compaction_search')
  await spotlightOff()
})

test('7.2 Angaben zur Adresse und Kartenausschnitt', async ({ page }) => {
  await openPostCompaction(page)
  await search(page)
  await selectAddress(page)

  const spotlightOff = await spotlight(page, [addressValues(page), mapExcerpt(page)])
  await shoot(page, CHAPTER, 'compaction_address')
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
  await shoot(page, CHAPTER, 'compaction_export')
})
