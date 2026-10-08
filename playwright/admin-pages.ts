// Opening a page of the Django administration for a capture.
//
// The administration is rendered on the server and has no map, so most of
// what playwright/manual-shots.ts guards against does not happen here. What
// does: the admin keeps its own UI state in localStorage - the theme toggle
// in the header ("Design wechseln") and whether the navigation sidebar on the
// left is open - and a value left over from a manual session would change
// every image. Both are pinned before the first script of the page runs, the
// same way playwright/auth.setup.ts seeds the app (never by writing into a
// loaded page).
//
// The pages are reached on {$ADMIN_DOMAIN}; specs of the project
// "chromium-admin" have it as their baseURL and pass the full path
// (`/admin/auth/user/`), see playwright.config.ts.
import { expect, type Locator, type Page } from '@playwright/test'

import { disableAnimations, moveCursorAway } from './manual-shots'

/** Pins the admin's own UI state; call once per page, before the first goto. */
export async function pinAdminUiState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Light mode, as everywhere in the manual. "auto" would follow the
    // colorScheme of the context, which is light too - pinned anyway, so a
    // manual switch on this machine cannot leak into an image.
    localStorage.setItem('theme', 'light')
    // The navigation sidebar open: it is the admin's table of contents and
    // the reason section 20.1 can point at it.
    localStorage.setItem('django.admin.navSidebarIsOpen', 'true')
  })
}

/**
 * Opens `path` of the administration and waits until the page is ready for a
 * capture. Fails if Django sent the browser to its login page instead - the
 * symptom of a spec running in the wrong Playwright project.
 */
export async function openAdmin(page: Page, path: string): Promise<void> {
  await pinAdminUiState(page)
  await page.goto(path)
  await expect(
    page,
    'The administration answered with its login page - is this spec matched by ADMIN_SPECS?',
  ).not.toHaveURL(/\/admin\/login\//)
  await expect(page.locator('#content')).toBeVisible()
  await page.waitForLoadState('networkidle')
  await disableAnimations(page)
  await moveCursorAway(page)
}

/**
 * A row of a Django admin form, addressed through the model field name
 * (`<div class="form-row field-is_staff">`).
 */
export function formRow(page: Page, field: string) {
  return page.locator(`.form-row.field-${field}`).first()
}

/** A fieldset of a Django admin form, addressed through its heading. */
export function fieldset(page: Page, heading: string) {
  return page.locator('fieldset.module').filter({
    has: page.locator('h2', { hasText: new RegExp(`^\\s*${heading}\\s*$`) }),
  })
}

/**
 * An invisible box over the union of every element `cells` matches - a
 * column of a change list, say - for `spotlight()`, which measures one
 * element per target. Returns the box and a function that removes it again.
 *
 * Positioned in document coordinates, so it scrolls with the page like the
 * cells it covers.
 */
export async function unionBox(
  cells: Locator,
): Promise<{ box: Locator; remove: () => Promise<void> }> {
  const page = cells.page()
  const id = `union-box-${Math.random().toString(36).slice(2)}`
  const count = await cells.count()
  if (count === 0) throw new Error('unionBox(): the locator matches nothing.')

  await cells.evaluateAll((elements, boxId) => {
    const rects = elements.map((element) => element.getBoundingClientRect())
    const left = Math.min(...rects.map((rect) => rect.left)) + window.scrollX
    const top = Math.min(...rects.map((rect) => rect.top)) + window.scrollY
    const right = Math.max(...rects.map((rect) => rect.right)) + window.scrollX
    const bottom = Math.max(...rects.map((rect) => rect.bottom)) + window.scrollY
    const box = document.createElement('div')
    box.id = boxId
    Object.assign(box.style, {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${right - left}px`,
      height: `${bottom - top}px`,
      pointerEvents: 'none',
    })
    document.body.appendChild(box)
  }, id)

  return {
    box: page.locator(`#${id}`),
    remove: async () => {
      await page.evaluate((boxId) => document.getElementById(boxId)?.remove(), id)
    },
  }
}
