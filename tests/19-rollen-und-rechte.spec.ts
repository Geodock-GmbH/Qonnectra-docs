import { expect, test } from '../playwright/test'

import { formRow, openAdmin, unionBox } from '../playwright/admin-pages'
import { removePlaceholderUsers, seedPlaceholderUsers } from '../playwright/admin-users'
import { shoot, spotlight } from '../playwright/manual-shots'

// Screenshots for chapter "19. Rollen und Rechte" in the manual
// (manual/teil-b-betrieb-admin-qgis/19-rollen-und-rechte.md). Produces all
// images of the chapter:
//
//   permission_users        user list filtered to the placeholders (pattern 1)
//   permission_user_form    groups and the three status boxes (pattern 2)
//   permission_group_form   the empty Django permissions of "Admin" (pattern 2)
//   permission_model_list   model rights of "Editor" (pattern 2)
//   permission_route_list   the three shipped route rights (pattern 1)
//   permission_model_add    a new row for wmssource, unsaved (pattern 2)
//
// Runs in the Playwright project "chromium-admin" as Django superuser against
// {$ADMIN_DOMAIN} (ADMIN_SPECS in playwright.config.ts).
//
// Personal data: every user list of the instance also shows the two real
// accounts of whoever set it up. The list is therefore captured filtered to
// the placeholder accounts of playwright/admin-users.ts, and the user form is
// the one of „Max Mustermann“. The accounts carry a pinned „Mitglied seit“ and
// a fixed password hash, so the form comes out the same on every run.
//
// Nothing is saved: the add form of 19.6 is filled in and captured, never
// submitted.
//
// Publish to public/images/ with: pnpm screenshots:publish 19-rollen-und-rechte
const CHAPTER = '19-rollen-und-rechte'

test.beforeAll(() => {
  seedPlaceholderUsers()
})

test.afterAll(() => {
  removePlaceholderUsers()
})

test('19. Benutzerliste', async ({ page }) => {
  await openAdmin(page, '/admin/auth/user/?q=mustermann')

  const rows = page.locator('#result_list tbody tr')
  await expect(rows).toHaveCount(3)
  await expect(page.locator('#result_list')).toContainText('Erika')

  await shoot(page, CHAPTER, 'permission_users')
})

test('19.1 Benutzerformular mit Gruppen und Status', async ({ page }) => {
  await openAdmin(page, '/admin/auth/user/?q=m.mustermann')
  await page.locator('#result_list tbody tr').first().locator('th a').click()
  await expect(page.locator('#content h2, #content h1').first()).toBeVisible()

  const groups = formRow(page, 'groups')
  await expect(groups).toBeVisible()
  // The filter_horizontal widget is built by script after load.
  await expect(groups.locator('.selector-chosen select option')).toHaveText('Editor')

  // One area over the three status boxes and the groups, not four: separate
  // cut-outs leave thin seams of scrim between rows that touch each other.
  const rows = await unionBox(page.locator('.form-row.field-is_active, .form-row.field-is_staff, .form-row.field-is_superuser, .form-row.field-groups'))
  // The fieldset "Berechtigungen" starts below the first window height; bring
  // it up so the status boxes and the whole group widget are in frame.
  await page.evaluate(() => {
    const top = document.querySelector('.form-row.field-is_active')!.getBoundingClientRect().top
    window.scrollBy(0, top - 140)
  })

  const spotlightOff = await spotlight(page, rows.box)
  await shoot(page, CHAPTER, 'permission_user_form')
  await spotlightOff()
  await rows.remove()
})

test('19.4 Gruppe mit leerem Feld „Berechtigungen"', async ({ page }) => {
  await openAdmin(page, '/admin/auth/group/')
  await page.locator('#result_list a', { hasText: /^Admin$/ }).click()

  const permissions = formRow(page, 'permissions')
  await expect(permissions).toBeVisible()
  await expect(permissions.locator('.selector-chosen select option')).toHaveCount(0)

  const spotlightOff = await spotlight(page, permissions)
  await shoot(page, CHAPTER, 'permission_group_form')
  await spotlightOff()
})

test('19.2 Modellrechte der Gruppe „Editor"', async ({ page }) => {
  await openAdmin(page, '/admin/api/modelpermission/')

  const filter = page.locator('#changelist-filter')
  await filter.getByRole('link', { name: 'Editor', exact: true }).click()
  await expect(page.locator('#result_list tbody tr')).toHaveCount(29)

  // The column that can be edited in place, header included. The submit
  // button below the list is out of frame at 29 rows; the text names it.
  const levelColumn = await unionBox(
    page.locator('#result_list').locator('th.column-access_level, td.field-access_level'),
  )
  const spotlightOff = await spotlight(page, [filter, levelColumn.box])
  await spotlightOff() // PROBE
  await shoot(page, CHAPTER, 'permission_model_list')
  await spotlightOff()
  await levelColumn.remove()
})

test('19.3 Routenrechte', async ({ page }) => {
  await openAdmin(page, '/admin/api/routepermission/')
  await expect(page.locator('#result_list tbody tr')).toHaveCount(3)

  await shoot(page, CHAPTER, 'permission_route_list')
})

test('19.6 Modellrecht hinzufügen', async ({ page }) => {
  await openAdmin(page, '/admin/api/modelpermission/add/')

  await page.locator('#id_group').selectOption({ label: 'Viewer' })
  await page.locator('#id_model_name').fill('wmssource')
  await page.locator('#id_access_level').selectOption({ label: 'Nur Ansehen' })
  await page.locator('#id_model_name').blur()

  const form = page.locator('#content-main form fieldset').first()
  const spotlightOff = await spotlight(page, form)
  await shoot(page, CHAPTER, 'permission_model_add')
  await spotlightOff()
})
