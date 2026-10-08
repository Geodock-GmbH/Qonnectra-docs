import { expect, test, type Page } from '../playwright/test'

import { blankExtraInlineUuids, formRow, openAdmin, unionBox } from '../playwright/admin-pages'
import { shoot, spotlight } from '../playwright/manual-shots'

// Screenshots for chapter "21. Projekte und Stammdaten pflegen" in the manual
// (manual/teil-b-betrieb-admin-qgis/21-projekte-und-stammdaten.md). Produces
// all images of the chapter:
//
//   admin_project_form          form of „Testprojekt“ (pattern 1)
//   admin_surface               surfaces with the column „Versiegelung“ (pattern 2)
//   admin_conduit_type          colour mappings of a conduit type (pattern 2)
//   admin_microduct_colors      list of microduct colours (pattern 1)
//   admin_cable_type            bundle fields and colour mappings (pattern 2)
//   admin_component_structures  filter and „Ports in Bulk erstellen“ (pattern 2)
//   admin_bulk_ports            the bulk form, filled in, not sent (pattern 1)
//   admin_container_types       the columns editable in the list (pattern 2)
//   admin_company_form          a new company with placeholders, not saved (pattern 1)
//
// Runs in "chromium-admin" as Django superuser (ADMIN_SPECS). Nothing is
// saved: the two forms that are filled in are captured and left.
//
// Personal data: the list of companies is not captured. Its rows carry phone
// numbers and e-mail addresses of the demo export that nobody has checked for
// publication; the image of 21.8 is the add form with the placeholders of
// CLAUDE.md instead.
//
// Publish to public/images/ with: pnpm screenshots:publish 21-projekte-und-stammdaten
const CHAPTER = '21-projekte-und-stammdaten'

/** Opens the change form of the row of `listPath` whose link reads `name`. */
async function openRow(page: Page, listPath: string, name: string): Promise<void> {
  await openAdmin(page, listPath)
  // Some lists link the id column, others the name - find the row by a cell
  // that reads `name` and follow the row's link.
  const cell = page.locator('#result_list tbody').locator('th, td').filter({ hasText: new RegExp(`^\\s*${escape(name)}\\s*$`) })
  await cell.first().locator('xpath=ancestor::tr').locator('a').first().click()
  await expect(page.locator('#content h2', { hasText: name })).toBeVisible()
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Scrolls `y` CSS pixels above `selector` to the top of the window. */
async function scrollAbove(page: Page, selector: string, y = 120): Promise<void> {
  await page.evaluate(
    ({ selector, y }) => {
      const top = document.querySelector(selector)!.getBoundingClientRect().top
      window.scrollBy(0, top - y)
    },
    { selector, y },
  )
}

test('21.1 Formular eines Projekts', async ({ page }) => {
  await openRow(page, '/admin/api/projects/', 'Testprojekt')
  await expect(formRow(page, 'active')).toBeVisible()

  await shoot(page, CHAPTER, 'admin_project_form')
})

test('21.3 Oberflächen mit Versiegelung', async ({ page }) => {
  await openAdmin(page, '/admin/api/attributessurface/')
  await expect(page.locator('#result_list tbody tr')).toHaveCount(6)

  const sealing = await unionBox(page.locator('#result_list th.column-sealing, #result_list td.field-sealing'))
  const off = await spotlight(page, sealing.box)
  await shoot(page, CHAPTER, 'admin_surface')
  await off()
  await sealing.remove()
})

test('21.4 Farbzuordnungen eines Rohrtyps', async ({ page }) => {
  await openRow(page, '/admin/api/attributesconduittype/', '12x10/6')

  const mappings = page.locator('#color_mappings-group')
  await expect(mappings.locator('tbody tr.has_original')).toHaveCount(12)
  await scrollAbove(page, '#color_mappings-group', 140)
  await blankExtraInlineUuids(page)

  const off = await spotlight(page, mappings)
  await shoot(page, CHAPTER, 'admin_conduit_type')
  await off()
})

test('21.4 Mikrorohrfarben', async ({ page }) => {
  await openAdmin(page, '/admin/api/attributesmicroductcolor/')
  await expect(page.locator('#result_list')).toContainText('rot-weiss')

  await shoot(page, CHAPTER, 'admin_microduct_colors')
})

test('21.5 Bündel und Farbzuordnungen eines Kabeltyps', async ({ page }) => {
  await openRow(page, '/admin/api/attributescabletype/', 'LTMC144(12x12)')

  const counts = await unionBox(
    page.locator('.form-row.field-fiber_count, .form-row.field-bundle_count, .form-row.field-bundle_fiber_count'),
  )
  const mappings = page.locator('#color_mappings-group')
  await expect(mappings).toBeVisible()
  await blankExtraInlineUuids(page)
  await scrollAbove(page, '.form-row.field-fiber_count', 140)

  const off = await spotlight(page, [counts.box, mappings])
  await shoot(page, CHAPTER, 'admin_cable_type')
  await off()
  await counts.remove()
})

test('21.6 Komponentenstrukturen', async ({ page }) => {
  await openAdmin(page, '/admin/api/attributescomponentstructure/')

  const filter = page.locator('#changelist-filter')
  await filter.getByRole('link', { name: 'Spleisskassette', exact: true }).click()
  await expect(page.locator('#result_list tbody tr').first()).toContainText('Spleisskassette')

  const bulk = page.locator('.object-tools a', { hasText: 'Ports in Bulk erstellen' })
  await expect(bulk).toBeVisible()

  const off = await spotlight(page, [filter, bulk])
  await shoot(page, CHAPTER, 'admin_component_structures')
  await off()
})

test('21.6 Ports in Bulk erstellen', async ({ page }) => {
  await openAdmin(page, '/admin/api/attributescomponentstructure/bulk-create-ports/')

  await page.locator('#id_component_type').selectOption({ label: 'Spleisskassette' })
  await page.locator('#id_number_of_ports').fill('12')
  await page.locator('#id_number_of_ports').blur()

  await shoot(page, CHAPTER, 'admin_bulk_ports')
})

test('21.7 Container-Typen mit direkt änderbaren Spalten', async ({ page }) => {
  await openAdmin(page, '/admin/api/containertype/')
  await expect(page.locator('#result_list tbody tr')).toHaveCount(3)

  const editable = await unionBox(
    page.locator(
      '#result_list th.column-display_order, #result_list td.field-display_order, ' +
        '#result_list th.column-is_active, #result_list td.field-is_active',
    ),
  )
  const save = page.locator('#changelist-form .submit-row, #changelist-form input[name="_save"]').first()
  const off = await spotlight(page, [editable.box, save])
  await shoot(page, CHAPTER, 'admin_container_types')
  await off()
  await editable.remove()
})

test('21.8 Firma hinzufügen', async ({ page }) => {
  await openAdmin(page, '/admin/api/attributescompany/add/')

  // Placeholders of CLAUDE.md, recognisable at a glance - never sent.
  await page.locator('#id_company').fill('Musterbau GmbH')
  await page.locator('#id_city').fill('Musterstadt')
  await page.locator('#id_postal_code').fill('12345')
  await page.locator('#id_street').fill('Musterstraße')
  await page.locator('#id_housenumber').fill('1')
  await page.locator('#id_phone').fill('0123 456789')
  await page.locator('#id_email').fill('info@musterbau.example')
  await page.locator('#id_email').blur()
  // Filling the last field scrolled the form; the name belongs in the image.
  await page.evaluate(() => window.scrollTo(0, 0))

  await shoot(page, CHAPTER, 'admin_company_form')
})
