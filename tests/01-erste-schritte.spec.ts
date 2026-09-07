import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  crop16by10,
  disableAnimations,
  moveCursorAway,
  shotPath,
  spotlight,
} from '../playwright/manual-shots'

// Screenshots for chapter "1. Erste Schritte" in the manual
// (manual/teil-a-anwenderhandbuch/01-erste-schritte.md). Produces all
// images of the chapter.
//
// Important: login_navigation is a pattern 3 image (hand-drawn labels in brand
// green). The test case only delivers the raw capture; the labels are added by
// hand after publishing. So look at the dry run before publishing, otherwise
// the raw capture overwrites the handwork:
//
//   pnpm screenshots:publish 01-erste-schritte --dry-run
//   pnpm screenshots:publish 01-erste-schritte
const CHAPTER = '01-erste-schritte'

test.describe('Abgemeldet', () => {
  // Only this chapter needs the *logged-out* state: the app redirects
  // logged-in calls of /login straight to /map.
  test.use({ storageState: { cookies: [], origins: [] } })

  /** The card with the heading "Anmelden", the form and the footer. */
  function loginCard(page: Page): Locator {
    return page.locator('form').locator('xpath=..')
  }

  test('1.1 Login-Seite', async ({ page }) => {
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

  test('1.2 Übersicht der Oberfläche', async ({ page }) => {
    await openDashboard(page)
    // Raw capture for the labelled orientation image (pattern 3), see the
    // comment at the top of this file.
    await page.screenshot({ path: shotPath(CHAPTER, 'login_navigation') })
  })

  test('1.2.1 Navigationsleiste', async ({ page }) => {
    await openDashboard(page)

    const spotlightOff = await spotlight(page, sidebar(page))
    await page.screenshot({ path: shotPath(CHAPTER, 'login_sidebar') })
    await spotlightOff()
  })

  test('1.2.2 Kopfzeile', async ({ page }) => {
    await openDashboard(page)

    const spotlightOff = await spotlight(page, header(page))
    await page.screenshot({ path: shotPath(CHAPTER, 'login_header') })
    await spotlightOff()
  })

  test('1.2.1 Fußbereich der Navigationsleiste', async ({ page }) => {
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

test.describe('Mobil', () => {
  // Section 1.6 describes the state below the md breakpoint (768 px): the
  // navigation bar on the left is replaced by a bar at the bottom edge
  // (MobileNav.svelte), and the header drops everything below sm (640 px).
  //
  // The only place in the manual where the target values of CLAUDE.md
  // (1792 x 1120) deliberately do not apply - a phone screen cannot be
  // photographed in a desktop window. 390 x 844 is a common phone size and lies
  // below both breakpoints. deviceScaleFactor stays at 2, so the image is
  // 780 x 1688 and legible.
  //
  // The images are portrait and are therefore embedded with {.small}, not as an
  // .img-row: that renders its images in a 16-to-10 frame, in which a portrait
  // screenshot would shrink to a stripe in the middle.
  test.use({ viewport: { width: 390, height: 844 } })

  /** Bar at the bottom edge with "Dashboard", "Karte" and "Mehr". */
  function mobileBar(page: Page): Locator {
    return page.getByRole('button', { name: 'Weitere Seiten' }).locator('xpath=../..')
  }

  /** Opens the dashboard and waits until the cards are in. */
  async function openMobileDashboard(page: Page) {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard\/2(\/|$)/)
    await expect(page.getByRole('heading', { name: 'Trassenstatistik' })).toBeVisible()
    await page.waitForLoadState('networkidle')

    await disableAnimations(page)
    await moveCursorAway(page)
  }

  test('1.6 Leiste am unteren Bildschirmrand', async ({ page }) => {
    await openMobileDashboard(page)

    // Cross-check that the window is really below the breakpoint: the desktop
    // navigation bar carries `hidden md:block`, so it must not be in the shot.
    await expect(
      page.locator('div[class*="grid-rows-[auto_1fr_auto]"]'),
      'The navigation bar on the left is still visible - is the viewport really ' +
        'below the md breakpoint of 768 px?',
    ).toBeHidden()

    const spotlightOff = await spotlight(page, mobileBar(page))
    await page.screenshot({ path: shotPath(CHAPTER, 'login_mobile_bar') })
    await spotlightOff()
  })

  test('1.6 Menü „Mehr“', async ({ page }) => {
    await openMobileDashboard(page)

    await page.getByRole('button', { name: 'Weitere Seiten' }).click()
    await expect(page.getByRole('heading', { name: 'Weitere Seiten' })).toBeVisible()
    // The menu slides in over 200 ms; disableAnimations() has already switched
    // that off, but the group headings only render once the permissions are in.
    await expect(page.getByRole('heading', { name: 'System' })).toBeVisible()
    await moveCursorAway(page)

    // No spotlight: the menu brings its own backdrop (bg-black/50), a second
    // scrim on top would dim the page twice.
    await page.screenshot({ path: shotPath(CHAPTER, 'login_mobile_more') })
  })
})
