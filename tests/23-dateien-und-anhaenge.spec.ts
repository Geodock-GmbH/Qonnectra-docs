import { expect, test } from '../playwright/test'

import { openAdmin } from '../playwright/admin-pages'
import { removeOrphanedFiles, seedOrphanedFiles } from '../playwright/admin-seeds'
import { shoot, spotlight } from '../playwright/manual-shots'

// Screenshots for chapter "23. Dateien und Anhänge verwalten" in the manual
// (manual/teil-b-betrieb-admin-qgis/23-dateien-und-anhaenge.md). Produces all
// images of the chapter:
//
//   admin_storage_preferences    the folder structure (pattern 1)
//   admin_file_type_categories   extensions and their categories (pattern 1)
//   admin_feature_files          orphaned attachments, filter and actions (pattern 2)
//   admin_move_files             the move form, not sent (pattern 1)
//
// Runs in "chromium-admin" as Django superuser (ADMIN_SPECS). The demo data has
// no orphaned attachment, so two are created for the run
// (playwright/admin-seeds.ts) and removed afterwards; the list is filtered to
// them, so none of the demo file names appears.
//
// Publish to public/images/ with: pnpm screenshots:publish 23-dateien-und-anhaenge
const CHAPTER = '23-dateien-und-anhaenge'

test.beforeAll(() => {
  seedOrphanedFiles()
})

test.afterAll(() => {
  removeOrphanedFiles()
})

test('23.1 Speicherpräferenzen', async ({ page }) => {
  await openAdmin(page, '/admin/api/storagepreferences/')
  await page.locator('#result_list tbody tr').first().locator('th a, td a').first().click()
  await expect(page.locator('.form-row.field-folder_structure')).toBeVisible()
  // The JSON editor is built by script after load.
  await expect(page.locator('.form-row.field-folder_structure .jsoneditor')).toBeVisible()

  await shoot(page, CHAPTER, 'admin_storage_preferences')
})

test('23.2 Dateitypkategorien', async ({ page }) => {
  await openAdmin(page, '/admin/api/filetypecategory/')
  await expect(page.locator('#result_list tbody tr').first()).toBeVisible()

  await shoot(page, CHAPTER, 'admin_file_type_categories')
})

test('23.5 Verwaiste Dateien', async ({ page }) => {
  await openAdmin(page, '/admin/api/featurefiles/?orphan_status=orphaned')
  await expect(page.locator('#result_list tbody tr')).toHaveCount(2)

  const filter = page.locator('#changelist-filter')
  const actions = page.locator('#changelist .actions')
  const off = await spotlight(page, [filter, actions])
  await shoot(page, CHAPTER, 'admin_feature_files')
  await off()
})

test('23.5 Verwaiste Dateien verschieben', async ({ page }) => {
  await openAdmin(page, '/admin/api/featurefiles/?orphan_status=orphaned')
  await page.locator('#action-toggle').check()
  await page.locator('#changelist .actions select[name="action"]').selectOption('move_to_feature')
  await page.locator('#changelist .actions button[name="index"], #changelist .actions .button').first().click()

  await expect(page).toHaveURL(/move-files/)
  await expect(page.locator('#content tbody tr')).toHaveCount(2)
  await page.locator('#id_target_feature_type').selectOption({ index: 0 })

  await shoot(page, CHAPTER, 'admin_move_files')
})
