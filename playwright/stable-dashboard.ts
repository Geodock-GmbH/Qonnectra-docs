// Pins the order of a dashboard chart that the backend leaves to chance.
//
// „Wohneinheiten nach Typ“ in the tab „Adressen“ comes from `units_by_type`
// in DashboardStatisticsView (local-app/backend/apps/api/views.py), which ends
// in `order_by("-count")` without a second sort key. In the demo data
// „krankenhaus“, „oeffentlich“ and „schule“ have one residential unit each, and
// Postgres returns such ties in whatever order the plan and the physical state
// of the table produce. Measured on 2026-10-08: four different orders - on a
// long-used instance, on a freshly reset one, in the committed image and in a
// single `__data.json` fetched by hand - so not even a fresh import is stable.
// The legend order and the colours of the slices follow that order, and
// dashboard_address came out changed.
//
// As with stableSearchOrder(), that is a bug in the app: the fix belongs
// upstream (`order_by("-count", "residential_unit_type__residential_unit_type")`)
// and local-app/ is never patched from here. Until then the page data is sorted
// on its way into the browser - by count, descending, and ties by type name,
// which is what the upstream fix would produce. Values are not touched.
//
// The page data only passes through the browser when the dashboard is reached
// from inside the app: `page.goto('/dashboard')` renders it on the server. A
// spec therefore opens it through the navigation bar (openDashboardFromNavigation()
// in tests/04-dashboard.spec.ts); SvelteKit then fetches `__data.json`. That
// payload is flattened by `devalue`: one array of values, objects and arrays in
// it holding indices into the same array. The sort reorders the index array of
// `unitsByType` and resolves the indices only to compare.
import type { Page } from '@playwright/test'

type Flat = unknown[]

interface DataNode {
  type?: string
  data?: Flat
}

/** Resolves a devalue index to its value; negative indices are special values. */
function at(flat: Flat, index: unknown): unknown {
  return typeof index === 'number' && index >= 0 ? flat[index] : undefined
}

/**
 * Sorts every `unitsByType` array of one flattened data node in place and
 * returns how many it found.
 */
function sortUnitsByType(flat: Flat): number {
  let found = 0
  for (const value of flat) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue
    const indexOfArray = (value as Record<string, unknown>).unitsByType
    const entries = at(flat, indexOfArray)
    if (!Array.isArray(entries)) continue

    const key = (entryIndex: unknown) => {
      const entry = at(flat, entryIndex) as Record<string, unknown> | undefined
      return {
        count: Number(at(flat, entry?.count) ?? 0),
        type: String(at(flat, entry?.type) ?? ''),
      }
    }
    entries.sort((a, b) => {
      const ka = key(a)
      const kb = key(b)
      return kb.count - ka.count || ka.type.localeCompare(kb.type)
    })
    found += 1
  }
  return found
}

/**
 * Sorts `unitsByType` in every `__data.json` the page loads. Install it before
 * the dashboard is opened. Returns a function telling how many arrays were
 * sorted so far - a spec asserts on it, so that a dashboard reached without
 * passing through the browser fails instead of capturing the order of chance.
 */
export async function stableUnitsByTypeOrder(page: Page): Promise<() => number> {
  let sorted = 0
  await page.route('**/__data.json*', async (route) => {
    const response = await route.fetch()

    let body: { type?: string; nodes?: (DataNode | null)[] }
    try {
      body = await response.json()
    } catch {
      await route.fulfill({ response })
      return
    }

    for (const node of body.nodes ?? []) {
      if (node?.type === 'data' && Array.isArray(node.data)) sorted += sortUnitsByType(node.data)
    }

    await route.fulfill({ response, json: body })
  })
  return () => sorted
}
