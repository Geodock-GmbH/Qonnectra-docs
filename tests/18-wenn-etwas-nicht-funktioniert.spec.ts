import { expect, test, type Locator, type Page } from '@playwright/test'

import { disableAnimations, moveCursorAway, shotPath, spotlight } from '../playwright/manual-shots'

// Screenshots for chapter "18. Wenn etwas nicht funktioniert" in the manual
// (manual/teil-a-anwenderhandbuch/18-wenn-etwas-nicht-funktioniert.md).
// Produces all images of the chapter:
//
//   error_toast         the message "Erfolg" at the bottom edge (pattern 2)
//   error_not_found     the error page with status 404 (pattern 1)
//   error_permission    the message about the missing right (pattern 2)
//   error_map_empty     empty map with project picker and legend (pattern 2)
//   error_support_info  version and project in the header (pattern 2)
//
// The video of the chapter sits in
// tests/18-wenn-etwas-nicht-funktioniert-video.spec.ts - test.use({ video: ... })
// is only allowed at file level.
//
// Two images trigger an action deliberately, and neither changes the demo data:
// error_toast saves an address without having changed a field, error_permission
// runs into the 403 of the capture account (group "Editor" may not DELETE) and
// therefore deletes nothing. A run with QONNECTRA_LOGIN=admin would actually
// delete the residential unit - which is why the spec refuses to run as
// superuser.
//
// Publish to public/images/ with: pnpm screenshots:publish 18-wenn-etwas-nicht-funktioniert
const CHAPTER = '18-wenn-etwas-nicht-funktioniert'

/** The address the two message images are taken of, as in tests/16-adressen.spec.ts. */
const ADDRESS = { uuid: '613504f0-d3a3-48e5-9a83-b886b51f8345', title: 'Toft 15', units: 5 }

/** Path that exists in no route of the app and therefore ends on the error page. */
const UNKNOWN_PATH = '/gibt-es-nicht'

/**
 * Map extent in EPSG:3857, deliberately far away from the project area.
 *
 * Section 18.4 is about the case "map still somewhere else". At zoom 13 about
 * 28 km of width fit into the window, so the centre has to sit more than 14 km
 * away from the network (x around 1083500) - otherwise the project is still in
 * the picture as a small cluster and the image would contradict the section.
 */
const VIEW_FAR = { center: [1058000, 7300000], zoom: 13 }

// ---------------------------------------------------------------------------
// Building blocks of the interface
// ---------------------------------------------------------------------------

/** Message at the bottom edge (Skeleton toaster, placement "bottom"). */
function toast(page: Page): Locator {
  return page.locator('[data-scope="toast"][data-part="root"]').first()
}

/**
 * Project picker in the header (ProjectCombobox.svelte).
 *
 * Grabbed through the placeholder of the input field: the header holds a
 * second Skeleton combobox - the language picker - with the same `data-part`
 * attributes, and their ids are generated.
 */
function projectPicker(page: Page): Locator {
  return page.getByPlaceholder('Projekt', { exact: true }).locator('xpath=..')
}

/** Version display in the header, e.g. "v1.7.0". */
function version(page: Page): Locator {
  return page.locator('[aria-label="Version"]')
}

/** Opens the detail page of ADDRESS. */
async function openAddress(page: Page) {
  await page.goto(`/address/2/${ADDRESS.uuid}`)

  await expect(page.getByRole('heading', { name: ADDRESS.title, level: 1 })).toBeVisible()
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  await disableAnimations(page)
  await moveCursorAway(page)
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

test('18.1 Meldung „Erfolg" am unteren Bildschirmrand', async ({ page }) => {
  await openAddress(page)

  // Saves without a changed field: the PATCH writes the values that are
  // already in the database, and the demo data stays as it is.
  await page.getByRole('button', { name: 'Speichern' }).first().click()

  await expect(page.getByText('Adresse erfolgreich aktualisiert')).toBeVisible()
  await moveCursorAway(page)

  // Quickly: the message fades by itself after a few seconds - which is what
  // the section is about.
  const spotlightOff = await spotlight(page, toast(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'error_toast') })
  await spotlightOff()
})

test('18.1 Fehlerseite 404', async ({ page }) => {
  await page.goto(UNKNOWN_PATH)

  await expect(page.getByText('Not Found')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Zurück zur Startseite' })).toBeVisible()

  await disableAnimations(page)
  await moveCursorAway(page)

  await page.screenshot({ path: shotPath(CHAPTER, 'error_not_found') })
})

test('18.3 Meldung über das fehlende Recht', async ({ page }) => {
  // As superuser the deletion would go through and the demo data would lose a
  // residential unit. The image needs the refusal, not the deletion.
  expect(
    process.env.QONNECTRA_LOGIN?.trim().toLowerCase() ?? 'user',
    'This image has to be taken with the capture account without administration ' +
      'rights. Run without QONNECTRA_LOGIN=admin.',
  ).toBe('user')

  await openAddress(page)

  const units = page
    .locator('h2', { hasText: /^Wohneinheiten$/ })
    .locator('xpath=ancestor::div[contains(@class,"card")][1]')
  await units.scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)

  const rows = units.locator('table tbody tr')
  await expect(rows).toHaveCount(ADDRESS.units)

  await rows.first().getByRole('button', { name: 'Löschen' }).click()
  await page.getByRole('button', { name: 'Löschen', exact: true }).last().click()

  await expect(
    page.getByText('Sie sind nicht berechtigt, diese Aktion durchzuführen.'),
  ).toBeVisible()
  // Nothing was deleted - that is the statement of the section.
  await expect(rows).toHaveCount(ADDRESS.units)
  await moveCursorAway(page)

  const spotlightOff = await spotlight(page, toast(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'error_permission') })
  await spotlightOff()
})

test('18.4 Leere Karte mit Projektauswahl und Legende', async ({ page }) => {
  // The view goes in through addInitScript, i.e. before every load of the
  // document: the app writes mapCenter/mapZoom back on every `moveend`, and a
  // write-back between setting and reloading would drop the seed.
  await page.addInitScript((view) => {
    localStorage.setItem('mapCenter', JSON.stringify(view.center))
    localStorage.setItem('mapZoom', JSON.stringify(view.zoom))
  }, VIEW_FAR)

  await page.goto('/map')
  await expect(page).toHaveURL(/\/map\/2(\/|$)/)
  // With a running tileserver (vector tiles) OpenLayers creates a second
  // canvas, without it (OSM raster fallback) only one - hence .first().
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForTimeout(2500)

  await disableAnimations(page)
  await moveCursorAway(page)

  const legend = page
    .getByRole('button', { name: /^Layer-Liste (ein|aus)klappen$/ })
    .locator('xpath=../..')
  const addressRow = legend.getByText('Adresse', { exact: true }).locator('xpath=..')

  // Both places the section sends the reader to: the project in the header and
  // the layer entry with "Auf Ausdehnung zoomen".
  const spotlightOff = await spotlight(page, [projectPicker(page), addressRow])
  await page.screenshot({ path: shotPath(CHAPTER, 'error_map_empty') })
  await spotlightOff()
})

test('18.5 Version und Projekt in der Kopfzeile', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/dashboard\/2(\/|$)/)
  await page.waitForLoadState('networkidle')

  await disableAnimations(page)
  await moveCursorAway(page)

  await expect(version(page)).toHaveText(/^v\d+\.\d+\.\d+$/)

  const spotlightOff = await spotlight(page, [projectPicker(page), version(page)])
  await page.screenshot({ path: shotPath(CHAPTER, 'error_support_info') })
  await spotlightOff()
})
