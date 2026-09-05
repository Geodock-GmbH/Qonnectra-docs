import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  crop16by10,
  disableAnimations,
  moveCursorAway,
  shotPath,
  spotlight,
} from '../playwright/manual-shots'

// Screenshots for chapter "3. Einstieg und Anmeldung" in the manual
// (manual/teil-a-anwenderhandbuch/03-einstieg-und-anmeldung.md). Produces all
// images of the chapter.
//
// Important: login_navigation is a pattern 3 image (hand-drawn labels in brand
// green). The test case only delivers the raw capture; the labels are added by
// hand after publishing. So look at the dry run before publishing, otherwise
// the raw capture overwrites the handwork:
//
//   pnpm screenshots:publish 03-einstieg-anmeldung --dry-run
//   pnpm screenshots:publish 03-einstieg-anmeldung
const CHAPTER = '03-einstieg-anmeldung'

test.describe('Abgemeldet', () => {
  // Only this chapter needs the *logged-out* state: the app redirects
  // logged-in calls of /login straight to /map.
  test.use({ storageState: { cookies: [], origins: [] } })

  /** The card with the heading "Anmelden", the form and the footer. */
  function loginCard(page: Page): Locator {
    return page.locator('form').locator('xpath=..')
  }

  test('3.1 Login-Seite', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('heading', { name: 'Anmelden' }).waitFor()
    await disableAnimations(page)
    await moveCursorAway(page)

    await page.screenshot({ path: shotPath(CHAPTER, 'login_start') })

    // Detail crop of the form as the second image of the image pair. The fields
    // stay empty - no credentials are typed on purpose; the placeholder texts of
    // the app explain the fields anyway.
    await page.screenshot({
      path: shotPath(CHAPTER, 'login_start_detail'),
      clip: await crop16by10(page, loginCard(page)),
    })
  })
})

test.describe('Angemeldet', () => {
  /**
   * Navigation bar on the left. The element carries neither a role nor a name -
   * the only thing to grab is the grid that arranges header, content and footer
   * of the bar (SideBar.svelte). Addressed through the class as an attribute so
   * that the square brackets of the Tailwind name need no escaping.
   */
  function sidebar(page: Page): Locator {
    return page.locator('div[class*="grid-rows-[auto_1fr_auto]"]')
  }

  /** Header with the project picker on the left and the options on the right. */
  function header(page: Page): Locator {
    // The sidebar also has a <header>, but without a bottom border.
    return page.locator('header[class*="border-b"]')
  }

  /** Group "System" at the foot of the navigation bar ("Logs", "Einstellungen"). */
  function systemGroup(page: Page): Locator {
    return page.locator('a[href="/settings"]').locator('xpath=../..')
  }

  /** Opens the dashboard of the test project and waits until the numbers are in. */
  async function openDashboard(page: Page) {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard\/2(\/|$)/)

    await expect(page.getByRole('heading', { name: 'Trassenstatistik' })).toBeVisible()
    await expect(page.getByText('km Gesamtlänge')).toBeVisible()
    await page.waitForLoadState('networkidle')

    await disableAnimations(page)
    await moveCursorAway(page)
  }

  test('3.2 Übersicht der Oberfläche', async ({ page }) => {
    await openDashboard(page)
    // Raw capture for the labelled orientation image (pattern 3), see the
    // comment at the top of this file.
    await page.screenshot({ path: shotPath(CHAPTER, 'login_navigation') })
  })

  test('3.2.1 Navigationsleiste', async ({ page }) => {
    await openDashboard(page)

    const spotlightOff = await spotlight(page, sidebar(page))
    await page.screenshot({ path: shotPath(CHAPTER, 'login_sidebar') })
    await spotlightOff()
  })

  test('3.2.2 Kopfzeile', async ({ page }) => {
    await openDashboard(page)

    const spotlightOff = await spotlight(page, header(page))
    await page.screenshot({ path: shotPath(CHAPTER, 'login_header') })
    await spotlightOff()
  })

  test('3.2.4 Einstellungen am Fuß der Navigationsleiste', async ({ page }) => {
    await openDashboard(page)

    // With all groups expanded the navigation bar needs 1093 px (measured) and
    // therefore fits completely into the 1120 px window height: the group
    // "System" is visible without scrolling. The check stays in place anyway -
    // if the bar grows past the window through further entries, the run should
    // fail instead of silently delivering a cropped image. In that case raise
    // the viewport in playwright.config.ts and do not collapse groups; the
    // latter would be a state users have to produce themselves first.
    await expect(page.getByRole('link', { name: 'Einstellungen' })).toBeInViewport()

    const spotlightOff = await spotlight(page, systemGroup(page))
    await page.screenshot({ path: shotPath(CHAPTER, 'login_settings') })
    await spotlightOff()
  })
})
