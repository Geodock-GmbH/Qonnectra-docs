import { expect, test, type Page } from '../playwright/test'

import { formRow, openAdmin, unionBox } from '../playwright/admin-pages'
import {
  GEOPACKAGE_CONFIG,
  removeGeoPackageConfig,
  removeUserSettings,
  seedGeoPackageConfig,
  seedUserSettings,
} from '../playwright/admin-seeds'
import { removePlaceholderUsers, seedPlaceholderUsers } from '../playwright/admin-users'
import { shoot, spotlight } from '../playwright/manual-shots'

// Screenshots for chapter "22. Projektbezogene Konfiguration" in the manual
// (manual/teil-b-betrieb-admin-qgis/22-projektbezogene-konfiguration.md).
// Produces all images of the chapter:
//
//   admin_project_list           the three settings columns (pattern 2)
//   admin_schema_settings        both pickers of the schema settings (pattern 2)
//   admin_pipe_branch_settings   the picker of the pipe branch settings (pattern 2)
//   admin_cost_rates             cost rates of „Testprojekt“ (pattern 1)
//   admin_cost_rate_form         unit, house connection, node types (pattern 2)
//   admin_geopackage_config      layer picker of a configuration (pattern 2)
//   admin_user_settings          stored settings of a placeholder (pattern 1)
//
// Runs in "chromium-admin" as Django superuser (ADMIN_SPECS). The GeoPackage
// configuration and the stored settings do not exist in the demo data; both
// are created for the run (playwright/admin-seeds.ts) and removed afterwards.
// The settings belong to „Max Mustermann“ - every other row of that list would
// name a real account of the instance.
//
// Publish to public/images/ with: pnpm screenshots:publish 22-projektbezogene-konfiguration
const CHAPTER = '22-projektbezogene-konfiguration'

const SETTINGS_USER = 'm.mustermann'

test.beforeAll(() => {
  seedPlaceholderUsers()
  seedUserSettings(SETTINGS_USER)
  seedGeoPackageConfig()
})

test.afterAll(() => {
  removeGeoPackageConfig()
  removeUserSettings(SETTINGS_USER)
  removePlaceholderUsers()
})

/** The settings of „Testprojekt“ in one of the standalone lists. */
async function openProjectSettings(page: Page, listPath: string): Promise<void> {
  await openAdmin(page, listPath)
  await page.locator('#result_list a', { hasText: /^Testprojekt$/ }).first().click()
  await expect(page.locator('#content h2').first()).toBeVisible()
}

test('22. Projektliste mit den Spalten der Einstellungen', async ({ page }) => {
  await openAdmin(page, '/admin/api/projects/')
  await expect(page.locator('#result_list tbody tr')).toHaveCount(2)

  const columns = await unionBox(
    page.locator(
      ['excluded_types_display', 'child_view_types_display', 'allowed_pipe_branch_types_display']
        .flatMap((field) => [`#result_list th.column-${field}`, `#result_list td.field-${field}`])
        .join(', '),
    ),
  )
  const off = await spotlight(page, columns.box)
  await shoot(page, CHAPTER, 'admin_project_list')
  await off()
  await columns.remove()
})

test('22.1 Netzschema-Einstellungen', async ({ page }) => {
  await openProjectSettings(page, '/admin/api/networkschemasettings/')

  const pickers = await unionBox(
    page.locator('.form-row.field-excluded_node_types, .form-row.field-child_view_enabled_node_types'),
  )
  const off = await spotlight(page, pickers.box)
  await shoot(page, CHAPTER, 'admin_schema_settings')
  await off()
  await pickers.remove()
})

test('22.2 Rohrabzweig-Einstellungen', async ({ page }) => {
  await openProjectSettings(page, '/admin/api/pipebranchsettings/')

  const picker = formRow(page, 'allowed_node_types')
  await expect(picker.locator('.selector-chosen select option')).toHaveCount(1)
  const off = await spotlight(page, picker)
  await shoot(page, CHAPTER, 'admin_pipe_branch_settings')
  await off()
})

test('22.3 Kostensätze eines Projekts', async ({ page }) => {
  await openAdmin(page, '/admin/api/valuationcostrate/')
  await page.locator('#changelist-filter').getByRole('link', { name: 'Testprojekt', exact: true }).first().click()
  await expect(page.locator('#result_list tbody tr')).toHaveCount(6)

  await shoot(page, CHAPTER, 'admin_cost_rates')
})

test('22.3 Formular eines Kostensatzes', async ({ page }) => {
  await openAdmin(page, '/admin/api/valuationcostrate/?q=oberirdisch')
  await page.locator('#result_list tbody tr').first().locator('th a').click()
  await expect(formRow(page, 'unit')).toBeVisible()

  const fields = await unionBox(
    page.locator('.form-row.field-unit, .form-row.field-is_house_connection, .form-row.field-node_types'),
  )
  const off = await spotlight(page, fields.box)
  await shoot(page, CHAPTER, 'admin_cost_rate_form')
  await off()
  await fields.remove()
})

test('22.4 GeoPackage-Schema-Konfiguration', async ({ page }) => {
  await openAdmin(page, '/admin/api/geopackageschemaconfig/')
  await page.locator('#result_list a', { hasText: GEOPACKAGE_CONFIG }).click()

  const picker = formRow(page, 'selected_layers')
  await expect(picker.locator('.selector-chosen select option')).toHaveCount(4)
  const off = await spotlight(page, picker)
  await shoot(page, CHAPTER, 'admin_geopackage_config')
  await off()
})

test('22.5 Benutzereinstellungen', async ({ page }) => {
  await openAdmin(page, '/admin/api/usersettings/?q=mustermann')
  await expect(page.locator('#result_list tbody tr')).toHaveCount(1)

  await shoot(page, CHAPTER, 'admin_user_settings')
})
