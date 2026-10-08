import { expect, test } from '../playwright/test'

import { openAdmin } from '../playwright/admin-pages'
import {
  GEOPACKAGE_CONFIG,
  removeGeoPackageConfig,
  seedGeoPackageConfig,
} from '../playwright/admin-seeds'
import { shoot, spotlight } from '../playwright/manual-shots'

// Screenshots for chapter "24. Daten importieren und exportieren" in the
// manual (manual/teil-b-betrieb-admin-qgis/24-daten-import-und-export.md).
// Produces the one image of the chapter:
//
//   admin_geopackage_download   configuration ticked, download action chosen (pattern 2)
//
// Runs in "chromium-admin" as Django superuser (ADMIN_SPECS). The
// configuration is the one chapter 22 shows, created for the run
// (playwright/admin-seeds.ts) and removed afterwards. The action is chosen
// but not run - the image shows the step before the download.
//
// Publish to public/images/ with: pnpm screenshots:publish 24-daten-import-und-export
const CHAPTER = '24-daten-import-und-export'

test.beforeAll(() => {
  seedGeoPackageConfig()
})

test.afterAll(() => {
  removeGeoPackageConfig()
})

test('24.2 GeoPackage-Schema herunterladen', async ({ page }) => {
  await openAdmin(page, '/admin/api/geopackageschemaconfig/')

  const row = page.locator('#result_list tbody tr', { hasText: GEOPACKAGE_CONFIG })
  await expect(row).toHaveCount(1)
  await row.locator('input.action-select').check()
  await page
    .locator('#changelist .actions select[name="action"]')
    .selectOption('download_geopackage_schema')

  const actions = page.locator('#changelist .actions')
  const convert = page.locator('.object-tools a', { hasText: 'QGIS-Projekt konvertieren' })
  await expect(convert).toBeVisible()

  const off = await spotlight(page, [actions, row, convert])
  await shoot(page, CHAPTER, 'admin_geopackage_download')
  await off()
})
