import { fileURLToPath } from 'node:url'

import { expect, test } from '../playwright/test'

import { fieldset, openAdmin } from '../playwright/admin-pages'
import {
  QGIS_PROJECT,
  pinQgisProjectDates,
  removeQgisProjectAndWmsSource,
  seedWmsSource,
} from '../playwright/admin-seeds'
import { localApp } from '../playwright/local-app'
import { shoot, spotlight } from '../playwright/manual-shots'

// Screenshots for chapter "27. QGIS-Server und Kartendienste" in the manual
// (manual/teil-b-betrieb-admin-qgis/27-qgis-server-und-kartendienste.md).
// Produces all images of the chapter:
//
//   qgis_project_messages   messages after uploading a project (pattern 2)
//   qgis_projects           list of stored projects (pattern 1)
//   qgis_project_form       form with the access URLs (pattern 2)
//   qgis_wms_source         WMS source with its layers (pattern 2)
//
// Runs in "chromium-admin" as Django superuser (ADMIN_SPECS). The demo data
// has no QGIS project and no WMS source. The first test uploads
// playwright/fixtures/netzdokumentation.qgs through the admin form - the
// upload itself is part of what 27.1 describes, including the messages it
// produces - and the later tests build on it; the WMS source is the stack's
// own QGIS Server serving that project. Both are removed after the run, the
// project file with them.
//
// Publish to public/images/ with: pnpm screenshots:publish 27-qgis-server-und-kartendienste
const CHAPTER = '27-qgis-server-und-kartendienste'

const FIXTURE = fileURLToPath(new URL('../playwright/fixtures/netzdokumentation.qgs', import.meta.url))

/** QGIS domain of the stack, e.g. qgis.qonnectra.localhost. */
function qgisDomain(): string {
  return new URL(localApp().appUrl).hostname.replace(/^app\./, 'qgis.')
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(() => {
  removeQgisProjectAndWmsSource()
})

test.afterAll(() => {
  removeQgisProjectAndWmsSource()
})

test('27.1 QGIS-Projekt hochladen', async ({ page }) => {
  // The upload validates the project against QGIS Server, which takes a few
  // seconds.
  test.setTimeout(90_000)
  await openAdmin(page, '/admin/api/qgisproject/add/')

  await page.locator('#id_name').fill(QGIS_PROJECT)
  await page.locator('#id_display_name').fill('Netzdokumentation')
  await page.locator('#id_description').fill('Trassen, Netzknoten und Adressen für WMS und WFS')
  await page.locator('#id_project_file').setInputFiles(FIXTURE)
  await page.locator('input[name="_continue"]').click()

  const messages = page.locator('ul.messagelist')
  await expect(messages).toBeVisible({ timeout: 60_000 })
  await expect(messages).toContainText('QGIS Projekt erfolgreich gespeichert')

  // Django shows its messages once, so no reload: the dates of the project
  // sit in the collapsed fieldset „Metadaten“ and are not in this image.
  // They are pinned for the list and the form of the next tests.
  await page.waitForLoadState('networkidle')
  const off = await spotlight(page, messages)
  await shoot(page, CHAPTER, 'qgis_project_messages')
  await off()

  pinQgisProjectDates()
})

test('27.1 Liste der QGIS-Projekte', async ({ page }) => {
  await openAdmin(page, '/admin/api/qgisproject/')
  await expect(page.locator('#result_list tbody tr')).toHaveCount(1)

  await shoot(page, CHAPTER, 'qgis_projects')
})

test('27.2 Zugriffs-URLs eines QGIS-Projekts', async ({ page }) => {
  await openAdmin(page, '/admin/api/qgisproject/')
  await page.locator('#result_list tbody tr').first().locator('th a').click()

  const urls = fieldset(page, 'Zugriffs-URLs')
  await expect(urls).toContainText(`/projects/${QGIS_PROJECT}.qgs`)
  await urls.scrollIntoViewIfNeeded()

  const off = await spotlight(page, urls)
  await shoot(page, CHAPTER, 'qgis_project_form')
  await off()
})

test('27.4 Externe WMS-Quelle', async ({ page }) => {
  seedWmsSource(qgisDomain())
  await openAdmin(page, '/admin/api/wmssource/')
  await page.locator('#result_list tbody tr').first().locator('a').first().click()

  const layers = page.locator('#layers-group')
  await expect(layers.locator('tbody tr.has_original')).toHaveCount(4)

  const off = await spotlight(page, [page.locator('fieldset.module').first(), layers])
  await shoot(page, CHAPTER, 'qgis_wms_source')
  await off()
})
