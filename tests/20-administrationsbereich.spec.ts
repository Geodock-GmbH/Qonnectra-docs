import { expect, test, type Page } from '../playwright/test'

import { openAdmin, unionBox } from '../playwright/admin-pages'
import { expectOutput, pyLiteral, runInBackend } from '../playwright/backend-shell'
import { annotate, shoot, spotlight } from '../playwright/manual-shots'
import { CAPTURE_DATE } from '../playwright/stable-dates'

// Screenshots for chapter "20. Der Administrationsbereich" in the manual
// (manual/teil-b-betrieb-admin-qgis/20-administrationsbereich.md). Produces all
// images of the chapter:
//
//   admin_index                 start page, unedited (pattern 1)
//   admin_index_annotated       header, navigation, list, language (pattern 3)
//   admin_changelist            conduit list with its controls named (pattern 3)
//   admin_history               change history of a conduit (pattern 2)
//   admin_delete_confirmation   what deleting a conduit takes along (pattern 1)
//
// Runs in "chromium-admin" as Django superuser (ADMIN_SPECS).
//
// Run-dependent state, and what the spec does about it:
//
// - „Neueste Aktionen“ on the start page lists what this superuser last did in
//   the administration - by hand on this machine, or by an earlier run. The
//   spec empties it first (django.contrib.admin.models.LogEntry, the admin's
//   own action log, not Qonnectra's LogEntry of chapter 28), so the box reads
//   „Keine vorhanden“ everywhere.
// - The demo data has no change history: the importer writes around
//   django-simple-history. The history image needs two versions, so the spec
//   saves the conduit twice through the ORM as „admin“, pins both history
//   dates and afterwards restores the field and deletes exactly the history
//   rows it made.
// - The delete confirmation is opened, never confirmed. Its rows name the
//   objects by the UUIDs of the demo export, which are stable.
//
// Publish to public/images/ with: pnpm screenshots:publish 20-administrationsbereich
const CHAPTER = '20-administrationsbereich'

/** Conduit of the demo project the history and delete images show. */
const CONDUIT = 'St-V02-01'

/** Dates of the two versions in the history image, see seedHistory(). */
const HISTORY_DATES = [CAPTURE_DATE, '2026-03-12T14:05:00+01:00']

/** Empties the admin's own action log, see the header comment. */
function clearAdminActionLog(): void {
  const output = runInBackend(
    [
      'from django.contrib.admin.models import LogEntry',
      'LogEntry.objects.all().delete()',
      'print("cleared")',
    ].join('\n'),
    'Clearing „Neueste Aktionen“',
  )
  expectOutput(output, 'cleared', 'Clearing „Neueste Aktionen“')
}

/**
 * Two saves of the conduit as the superuser - first the date, then the status - so the history lists two versions with a user. Both are undone in
 * removeHistory(); the original values travel through a JSON file in the
 * container's /tmp, so a run that died in between can still be cleaned up by
 * the next one.
 */
function seedHistory(): void {
  const output = runInBackend(
    [
      'import json, os',
      'from django.contrib.auth import get_user_model',
      'from django.utils.dateparse import parse_datetime',
      'from apps.api.models import Conduit, AttributesStatus',
      `name = ${pyLiteral(CONDUIT)}`,
      `dates = ${pyLiteral(HISTORY_DATES)}`,
      'state = "/tmp/qonnectra-docs-history.json"',
      'c = Conduit.objects.get(name=name, project_id=2)',
      'if not os.path.exists(state):',
      '    json.dump({"date": c.date.isoformat() if c.date else None, "status": c.status_id, "after": c.history.order_by("-history_id").values_list("history_id", flat=True).first() or 0}, open(state, "w"))',
      'admin = get_user_model().objects.get(username="admin")',
      'c._history_user = admin',
      'c.date = parse_datetime(dates[1]).date()',
      'c.save()',
      'c.status = AttributesStatus.objects.order_by("id").exclude(id=c.status_id).first()',
      'c._history_user = admin',
      'c.save()',
      'after = json.load(open(state))["after"]',
      'rows = list(c.history.filter(history_id__gt=after).order_by("history_id"))',
      'for row, when in zip(rows, reversed(dates)):',
      '    type(row).objects.filter(pk=row.pk).update(history_date=parse_datetime(when))',
      'print("history", len(rows))',
    ].join('\n'),
    'Seeding the change history',
  )
  expectOutput(output, 'history 2', 'Seeding the change history')
}

function removeHistory(): void {
  const output = runInBackend(
    [
      'import json, os',
      'from apps.api.models import Conduit',
      `name = ${pyLiteral(CONDUIT)}`,
      'state = "/tmp/qonnectra-docs-history.json"',
      'if os.path.exists(state):',
      '    saved = json.load(open(state))',
      '    qs = Conduit.objects.filter(name=name, project_id=2)',
      '    qs.update(date=saved["date"], status_id=saved["status"])',
      '    Conduit.history.filter(name=name, history_id__gt=saved["after"]).delete()',
      '    os.remove(state)',
      'print("restored")',
    ].join('\n'),
    'Restoring the conduit and its history',
  )
  expectOutput(output, 'restored', 'Restoring the conduit and its history')
}

async function openConduit(page: Page): Promise<void> {
  await openAdmin(page, `/admin/api/conduit/?q=${CONDUIT}`)
  await page.locator('#result_list th a', { hasText: new RegExp(`^${CONDUIT}$`) }).click()
  await expect(page.locator('#content h2', { hasText: CONDUIT })).toBeVisible()
}

test.beforeAll(() => {
  removeHistory()
  clearAdminActionLog()
})

test.afterAll(() => {
  removeHistory()
})

test('20. Startseite des Administrationsbereichs', async ({ page }) => {
  await openAdmin(page, '/admin/')
  await expect(page.locator('#recent-actions-module')).toContainText('Keine vorhanden')

  await shoot(page, CHAPTER, 'admin_index')
})

test('20.1 Aufbau der Startseite', async ({ page }) => {
  await openAdmin(page, '/admin/')

  const off = await annotate(page, [
    { target: page.locator('#header'), label: 'Kopfzeile', labelAt: { x: 1250, y: 170 }, shape: 'box', padding: -4 },
    { target: page.locator('.language-selector'), label: 'Sprachauswahl', labelAt: { x: 1560, y: 330 } },
    { target: page.locator('#content-related'), label: 'Neueste Aktionen', labelAt: { x: 1250, y: 520 }, shape: 'box' },
    { target: page.locator('#content-main'), label: 'Bereiche', labelAt: { x: 1000, y: 800 }, shape: 'box', bend: -0.1 },
  ])
  await shoot(page, CHAPTER, 'admin_index_annotated')
  await off()
})

test('20.2 Liste mit Suche, Filter und Aktionen', async ({ page }) => {
  await openAdmin(page, '/admin/api/conduit/?q=St')
  await expect(page.locator('#result_list tbody tr')).toHaveCount(7)

  const selection = await unionBox(
    page.locator('#result_list th.action-checkbox-column, #result_list td.action-checkbox'),
  )
  const off = await annotate(page, [
    { target: page.locator('#nav-sidebar'), label: 'Navigationsleiste', labelAt: { x: 640, y: 960 }, shape: 'box', padding: -2 },
    { target: page.locator('#changelist-search'), label: 'Suchfeld', labelAt: { x: 1150, y: 700 }, shape: 'box', padding: 4 },
    { target: page.locator('#changelist .actions'), label: 'Aktion', labelAt: { x: 900, y: 800 }, shape: 'box', padding: 4 },
    { target: selection.box, label: 'Auswahl', labelAt: { x: 600, y: 700 }, shape: 'box', padding: 4 },
    { target: page.locator('#changelist-filter'), label: 'Filter', labelAt: { x: 1560, y: 900 }, shape: 'box' },
  ])
  await shoot(page, CHAPTER, 'admin_changelist')
  await off()
  await selection.remove()
})

test('20.3 Änderungsgeschichte eines Rohrs', async ({ page }) => {
  seedHistory()
  await openConduit(page)
  await page.locator('.object-tools a.historylink').click()
  await expect(page.locator('#content h1')).toContainText(CONDUIT)

  const versions = page.locator('#change-history, #content-main table').first()
  await expect(versions.locator('tbody tr')).toHaveCount(2)

  const off = await spotlight(page, versions)
  await shoot(page, CHAPTER, 'admin_history')
  await off()
})

test('20.4 Bestätigung beim Löschen', async ({ page }) => {
  await openConduit(page)
  await page.locator('.submit-row a.deletelink').click()
  await expect(page.locator('#content h2, #content h1').first()).toBeVisible()
  await expect(page.getByText('Mikrorohre: 12')).toBeVisible()

  await shoot(page, CHAPTER, 'admin_delete_confirmation')
})
