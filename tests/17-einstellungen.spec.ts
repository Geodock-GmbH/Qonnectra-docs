import { expect, test, type Locator, type Page } from '@playwright/test'

import { disableAnimations, moveCursorAway, shotPath, spotlight } from '../playwright/manual-shots'

// Screenshots for chapter "17. Einstellungen" in the manual
// (manual/teil-a-anwenderhandbuch/17-einstellungen.md). Produces all images of
// the chapter:
//
//   settings               plain overview shot, "Benutzer" and "UI" (pattern 1)
//   settings_sync          the two buttons of the account sync (pattern 2)
//   settings_sidebar       the switch "Sidebar" with the collapsed bar (pattern 2)
//   settings_trench_style  "Nach Oberfläche" and the styles it reveals (pattern 2)
//   settings_node_types    the tiles of the node type styles (pattern 2)
//   settings_cable_routing "Kabelfarbe" and "Rohrzuordnung" (pattern 2)
//
// The video of the chapter sits in tests/17-einstellungen-video.spec.ts -
// test.use({ video: ... }) is only allowed at file level.
//
// None of the images touches the data of the test project: everything on this
// page lives in the localStorage of the browser, and every test gets a fresh
// context from auth-state.json. What one image switches over is therefore gone
// again in the next.
//
// Publish to public/images/ with: pnpm screenshots:publish 17-einstellungen
const CHAPTER = '17-einstellungen'

/**
 * Distance from the upper window edge at which a scrolled-to heading comes to
 * rest. Leaves room for the header of the app, so that the heading does not
 * end up right under it.
 */
const HEADING_OFFSET = 150

// ---------------------------------------------------------------------------
// Building blocks of the interface
// ---------------------------------------------------------------------------

/** Opens the settings page. */
async function openSettings(page: Page) {
  await page.goto('/settings')

  await expect(page.locator('h2', { hasText: /^Benutzer$/ })).toBeVisible()
  await page.waitForLoadState('networkidle')

  await disableAnimations(page)
  await moveCursorAway(page)
}

/**
 * A row of the settings, addressed through its label - `<div class="py-6">`
 * with `<dt>` and `<dd>` next to one another.
 */
function row(page: Page, label: string): Locator {
  return page.locator('div.py-6').filter({ hasText: label }).first()
}

/**
 * A block with an `<h2>` of its own.
 *
 * Two shapes exist: "Benutzer", "UI", "Karte", "Kabelfarbe" and
 * "Rohrzuordnung" carry the heading directly in the block, the style sections
 * put it in a flex row together with "Zufällig" and "Alle zurücksetzen" and
 * therefore sit one level deeper.
 */
function block(page: Page, heading: string, depth: 1 | 2 = 1): Locator {
  return page
    .locator('h2', { hasText: new RegExp(`^${heading}$`) })
    .locator(depth === 1 ? 'xpath=..' : 'xpath=../..')
}

/**
 * Scrolls `target` up to HEADING_OFFSET below the upper edge.
 *
 * The settings page is several window heights long; the lower sections are
 * only in frame after scrolling. `scrollIntoViewIfNeeded()` would place them
 * right at the edge, half under the header of the app.
 */
async function scrollTo(page: Page, target: Locator, offset = HEADING_OFFSET) {
  const scroller = page.locator('main').first()
  const box = await target.boundingBox()
  if (!box) throw new Error('Scroll target is not visible.')

  await scroller.evaluate((main, delta) => main.scrollBy(0, delta), box.y - offset)
  await page.waitForTimeout(500)
  await moveCursorAway(page)
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

test('17. Übersicht der Einstellungen', async ({ page }) => {
  await openSettings(page)

  await page.screenshot({ path: shotPath(CHAPTER, 'settings') })
})

test('17.2 Einstellungen synchronisieren', async ({ page }) => {
  await openSettings(page)

  const sync = row(page, 'Einstellungen synchronisieren')
  await expect(sync.getByRole('button', { name: 'In Konto speichern' })).toBeVisible()
  await expect(sync.getByRole('button', { name: 'Aus Konto laden' })).toBeVisible()

  const spotlightOff = await spotlight(page, sync)
  await page.screenshot({ path: shotPath(CHAPTER, 'settings_sync') })
  await spotlightOff()
})

test('17.3 Schalter „Sidebar" mit eingeklappter Navigationsleiste', async ({ page }) => {
  await openSettings(page)

  const sidebar = row(page, 'Sidebar')
  await expect(sidebar).toContainText('Erweitert')

  // force: true - the switch itself is the hidden input of the Skeleton
  // component, the visible control sits above it.
  await sidebar.locator('input[name="sidebar-expanded"]').click({ force: true })
  await expect(sidebar).toContainText('Eingeklappt')
  await page.waitForTimeout(500)
  await moveCursorAway(page)

  // Two places at once: the switch and what it does to the navigation bar at
  // the left edge. Exposing the switch alone would leave the section without a
  // picture of its effect.
  // The navigation bar has no id of its own; its scroll container is the grid
  // of SideBar.svelte (see CLAUDE.md).
  const navigationBar = page.locator('div[class*="grid-rows-[auto_1fr_auto]"]')
  const spotlightOff = await spotlight(page, [sidebar, navigationBar])
  await page.screenshot({ path: shotPath(CHAPTER, 'settings_sidebar') })
  await spotlightOff()
})

test('17.4 Trassen-Darstellung „Nach Oberfläche"', async ({ page }) => {
  await openSettings(page)

  const mode = row(page, 'Trassen-Darstellung')
  await scrollTo(page, mode)
  await mode.getByText('Nach Oberfläche', { exact: true }).click()

  const surfaces = block(page, 'Oberflächen-Stile', 2)
  await expect(surfaces).toBeVisible()
  await page.waitForTimeout(500)
  await moveCursorAway(page)

  // Both at once: the chosen mode and the section it makes appear - that is
  // the connection section 17.4 describes.
  const spotlightOff = await spotlight(page, [mode, surfaces])
  await page.screenshot({ path: shotPath(CHAPTER, 'settings_trench_style') })
  await spotlightOff()
})

test('17.5 Netzknotentyp-Stile', async ({ page }) => {
  await openSettings(page)

  const nodeTypes = block(page, 'Netzknotentyp-Stile', 2)
  await scrollTo(page, nodeTypes)

  const spotlightOff = await spotlight(page, nodeTypes)
  await page.screenshot({ path: shotPath(CHAPTER, 'settings_node_types') })
  await spotlightOff()
})

test('17.6 Kabelfarbe und Routing-Toleranz', async ({ page }) => {
  await openSettings(page)

  const cableColor = block(page, 'Kabelfarbe')
  const conduitConnection = block(page, 'Rohrzuordnung')
  await scrollTo(page, cableColor)

  // The last two sections of the page; together they fit into one window, and
  // the sections 17.6 and 17.7 share the image.
  const spotlightOff = await spotlight(page, [cableColor, conduitConnection])
  await page.screenshot({ path: shotPath(CHAPTER, 'settings_cable_routing') })
  await spotlightOff()
})
