// Pins the order of a dashboard chart that the backend leaves to chance.
//
// „Wohneinheiten nach Typ“ in the tab „Adressen“ comes from `units_by_type`
// in DashboardStatisticsView (local-app/backend/apps/api/views.py), which ends
// in `order_by("-count")` without a second sort key. In the demo data
// „krankenhaus“, „oeffentlich“ and „schule“ have one residential unit each, and
// Postgres returns such ties in whatever order the plan and the physical state
// of the table produce. Measured on 2026-10-08: four different orders - on a
// long-used instance, on a freshly reset one, in the committed image and in a
// single response fetched by hand - so not even a fresh import is stable.
// The legend order and the colours of the slices follow that order, and
// dashboard_address came out changed.
//
// As with stableSearchOrder(), that is a bug in the app: the fix belongs
// upstream (`order_by("-count", "residential_unit_type__residential_unit_type")`)
// and local-app/ is never patched from here. Until then the statistics are
// sorted on their way into the browser - by count, descending, and ties by
// type name, which is what the upstream fix would produce. Values are not
// touched.
//
// Since v1.8.0 the dashboard loads its figures through the remote function
// `getDashboardStatistics`, which the browser calls itself on every load
// (playwright/remote-functions.ts) - a plain `page.goto()` passes through here.
// The payload is flattened by `devalue`: the sort reorders the index array of
// `unitsByType` and resolves the indices only to compare.
import type { Page } from '@playwright/test'

import { type Flat, hydrate, rewriteRemote } from './remote-functions'

/**
 * Sorts the `unitsByType` array of the statistics in place and returns
 * whether it found one.
 */
function sortUnitsByType(flat: Flat, result: number): boolean {
  const stats = flat[result] as Record<string, unknown> | undefined
  const entries = typeof stats?.unitsByType === 'number' ? flat[stats.unitsByType] : undefined
  if (!Array.isArray(entries)) return false

  const key = (entryIndex: unknown) => {
    const entry = hydrate(flat, entryIndex) as { count?: unknown; type?: unknown } | undefined
    return { count: Number(entry?.count ?? 0), type: String(entry?.type ?? '') }
  }
  entries.sort((a, b) => {
    const ka = key(a)
    const kb = key(b)
    return kb.count - ka.count || ka.type.localeCompare(kb.type)
  })
  return true
}

/**
 * Sorts `unitsByType` in every dashboard statistics response the page loads.
 * Install it before the dashboard is opened. Returns a function telling how
 * many arrays were sorted so far - a spec asserts on it, so that statistics
 * that stop passing through the browser fail the capture instead of leaving
 * the order of chance in it.
 */
export async function stableUnitsByTypeOrder(page: Page): Promise<() => number> {
  let sorted = 0
  await rewriteRemote(page, 'getDashboardStatistics', (flat, result) => {
    if (sortUnitsByType(flat, result)) sorted += 1
  })
  return () => sorted
}
