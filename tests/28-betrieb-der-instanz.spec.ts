import { expect, test } from '../playwright/test'

import { openAdmin } from '../playwright/admin-pages'
import { removeLogEntries, seedLogEntries } from '../playwright/admin-seeds'
import { removePlaceholderUsers, seedPlaceholderUsers } from '../playwright/admin-users'
import { localApp } from '../playwright/local-app'
import { disableAnimations, moveCursorAway, shoot, spotlight } from '../playwright/manual-shots'
import { CAPTURE_DATE } from '../playwright/stable-dates'

// Screenshots for chapter "28. Betrieb der Instanz" in the manual
// (manual/teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md). Produces all
// images of the chapter:
//
//   ops_logs         the page „Logs“ of the web application (pattern 1)
//   ops_logs_admin   „Log-Einträge“ in the administration, filters and actions (pattern 2)
//
// Runs in "chromium-admin" (ADMIN_SPECS): the Logs open only for an account
// with staff status whose group may open /admin/*, and the superuser is both.
// The page of the web application is opened by absolute URL on the app
// domain; admin-auth-state.json carries the app login as well.
//
// Every log of the instance shows what happened on it - accounts, paths,
// addresses. The images therefore show only four entries seeded for the run
// (playwright/admin-seeds.ts) on CAPTURE_DATE, a day with no real entry, and
// both views are filtered to that day.
//
// Publish to public/images/ with: pnpm screenshots:publish 28-betrieb-der-instanz
const CHAPTER = '28-betrieb-der-instanz'

/** The capture day, as the date filters take it. */
const DAY = CAPTURE_DATE.slice(0, 10)

test.beforeAll(() => {
  seedPlaceholderUsers()
  seedLogEntries()
})

test.afterAll(() => {
  removeLogEntries()
  removePlaceholderUsers()
})

test('28.5 Logs in der Weboberfläche', async ({ page }) => {
  const url = new URL('/admin/logs', localApp().appUrl)
  url.searchParams.set('date_from', `${DAY}T00:00`)
  url.searchParams.set('date_to', `${DAY}T23:59`)
  await page.goto(url.toString())

  await expect(page.getByRole('heading', { name: 'Logs' })).toBeVisible()
  await expect(page.locator('table tbody tr')).toHaveCount(4)
  await page.waitForLoadState('networkidle')
  await disableAnimations(page)
  await moveCursorAway(page)

  await shoot(page, CHAPTER, 'ops_logs')
})

test('28.5 Log-Einträge im Administrationsbereich', async ({ page }) => {
  const [year, month, day] = DAY.split('-').map(Number)
  await openAdmin(
    page,
    `/admin/api/logentry/?timestamp__year=${year}&timestamp__month=${month}&timestamp__day=${day}`,
  )
  await expect(page.locator('#result_list tbody tr')).toHaveCount(4)

  // The filter „Nach Logger-Name“ lists the logger names of every entry in
  // the table - whatever the instance logged before the run, which a freshly
  // set-up instance in CI does not share. The image ends above it.
  const loggerFilter = page.locator('#changelist-filter').locator('summary, h3').filter({ hasText: 'Logger-Name' }).first()
  const cut = await loggerFilter.boundingBox()
  if (!cut) throw new Error('The filter „Nach Logger-Name“ is not on the page.')

  const off = await spotlight(page, [page.locator('#changelist-filter'), page.locator('#changelist .actions')])
  await shoot(page, CHAPTER, 'ops_logs_admin', {
    clip: { x: 0, y: 0, width: page.viewportSize()!.width, height: cut.y - 12 },
  })
  await off()
})
