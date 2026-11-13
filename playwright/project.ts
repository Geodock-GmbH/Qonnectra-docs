/**
 * The test project and the addresses of its views.
 *
 * Since Qonnectra v1.8.0 every project view carries the project in its path
 * (`/project/2/map`); the old paths (`/map`, `/conduit/2`) answer with a 404.
 * Leitungsauskunft, Faserweg, Einstellungen and Logs are global and keep
 * theirs. The app remembers the last project in the cookie `last-project`,
 * which only decides where `/` lands - a spec never relies on it and opens
 * `projectPath()` instead.
 */

/** Primary key of „Testprojekt“, pinned by the demo import (`PROJECT_ID`). */
export const TEST_PROJECT_ID = '2'

/**
 * The address of a project view of the test project.
 * @param view - The view path below the project, e.g. `/map` or
 *   `/address/<uuid>`.
 */
export function projectPath(view: string): string {
  return `/project/${TEST_PROJECT_ID}${view}`
}

/**
 * A pattern that matches the address of a project view, with or without a
 * trailing segment, query or hash (the map writes its view as `#map=z/x/y`).
 * @param view - The view path below the project, e.g. `/dashboard`.
 */
export function projectUrl(view: string): RegExp {
  const escaped = projectPath(view).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  return new RegExp(`${escaped}(/|\\?|#|$)`)
}

/**
 * The localStorage key under which the app keeps the map view of a project,
 * as `{ zoom, center }` in EPSG:3857 (`storedView.ts`). It replaced
 * `mapCenter`/`mapZoom` in v1.8.0. A `#map=` hash in the address wins over it.
 */
export const MAP_VIEW_KEY = `mapView:${TEST_PROJECT_ID}`
