import { expect, test, type Locator, type Page } from '@playwright/test'

import { animationenAus, shotPath, spotlight, zeigerWeg } from '../playwright/manual-shots'

// Screenshots für Kapitel „3. Einstieg und Anmeldung" im Handbuch
// (manual/teil-a-anwenderhandbuch/03-einstieg-und-anmeldung.md). Erzeugt alle
// Bilder des Kapitels.
//
// Wichtig: login_navigation ist ein Bild nach Muster 3 (handgezeichnete
// Beschriftungen in Marken-Grün). Der Testfall liefert nur die Rohaufnahme;
// die Beschriftungen kommen nach dem Übernehmen von Hand dazu. Vor dem
// Übernehmen deshalb erst den Probelauf ansehen, sonst überschreibt die
// Rohaufnahme die Handarbeit:
//
//   pnpm screenshots:publish 03-einstieg-anmeldung --dry-run
//   pnpm screenshots:publish 03-einstieg-anmeldung
const KAPITEL = '03-einstieg-anmeldung'

/** Rand um Ausschnittvergrößerungen, in CSS-Pixeln. */
const RAND = 24

/**
 * Ausschnitt um `ziel` herum, auf 16 : 10 aufgezogen und ins Fenster geschoben.
 *
 * Das Seitenverhältnis ist nicht kosmetisch: Bildpaare (Vollbild + Detail)
 * stehen im Handbuch in einer `.img-row`, und die rendert ihre Bilder in einem
 * 16-:-10-Rahmen mit `object-fit: contain`
 * (`.vitepress/theme/custom.css`). Ein hochkant beschnittenes Detailbild
 * bliebe darin klein, mit Leerraum links und rechts.
 */
async function ausschnitt16zu10(page: Page, ziel: Locator) {
  const box = (await ziel.boundingBox())!
  const fenster = page.viewportSize()!

  let hoehe = Math.min(box.height + RAND * 2, fenster.height)
  let breite = (hoehe * 16) / 10
  if (breite > fenster.width) {
    breite = fenster.width
    hoehe = (breite * 10) / 16
  }

  // Um das Ziel zentrieren, aber nicht über den Fensterrand hinaus – dort gibt
  // es kein Bild, und Playwright würde den Ausschnitt still beschneiden.
  const mittig = (mitte: number, laenge: number, grenze: number) =>
    Math.min(Math.max(mitte - laenge / 2, 0), grenze - laenge)

  return {
    x: mittig(box.x + box.width / 2, breite, fenster.width),
    y: mittig(box.y + box.height / 2, hoehe, fenster.height),
    width: breite,
    height: hoehe,
  }
}

test.describe('Abgemeldet', () => {
  // Nur dieses Kapitel braucht den *abgemeldeten* Zustand: angemeldete Aufrufe
  // von /login leitet die App direkt auf /map um.
  test.use({ storageState: { cookies: [], origins: [] } })

  /** Die Karte mit Überschrift „Anmelden", Formular und Fußzeile. */
  function anmeldeKarte(page: Page): Locator {
    return page.locator('form').locator('xpath=..')
  }

  test('3.1 Login-Seite', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('heading', { name: 'Anmelden' }).waitFor()
    await animationenAus(page)
    await zeigerWeg(page)

    await page.screenshot({ path: shotPath(KAPITEL, 'login_start') })

    // Ausschnittvergrößerung des Formulars als zweites Bild des Bildpaars.
    // Die Felder bleiben leer – es werden bewusst keine Zugangsdaten getippt;
    // die Platzhaltertexte der App erklären die Felder ohnehin.
    await page.screenshot({
      path: shotPath(KAPITEL, 'login_start_detail'),
      clip: await ausschnitt16zu10(page, anmeldeKarte(page)),
    })
  })
})

test.describe('Angemeldet', () => {
  /**
   * Navigationsleiste links. Das Element trägt keine Rolle und keinen Namen –
   * greifbar ist nur das Raster, das Kopf, Inhalt und Fußzeile der Leiste
   * anordnet (SideBar.svelte). Über die Klasse als Attribut, damit die
   * eckigen Klammern des Tailwind-Namens nicht escaped werden müssen.
   */
  function seitenleiste(page: Page): Locator {
    return page.locator('div[class*="grid-rows-[auto_1fr_auto]"]')
  }

  /** Kopfzeile mit Projektauswahl links und den Optionen rechts. */
  function kopfzeile(page: Page): Locator {
    // Die Seitenleiste hat ebenfalls ein <header>, aber ohne untere Linie.
    return page.locator('header[class*="border-b"]')
  }

  /** Gruppe „System" am Fuß der Navigationsleiste („Logs", „Einstellungen"). */
  function systemGruppe(page: Page): Locator {
    return page.locator('a[href="/settings"]').locator('xpath=../..')
  }

  /** Öffnet das Dashboard des Testprojekts und wartet, bis die Zahlen stehen. */
  async function dashboardOeffnen(page: Page) {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard\/2(\/|$)/)

    await expect(page.getByRole('heading', { name: 'Trassenstatistik' })).toBeVisible()
    await expect(page.getByText('km Gesamtlänge')).toBeVisible()
    await page.waitForLoadState('networkidle')

    await animationenAus(page)
    await zeigerWeg(page)
  }

  test('3.2 Übersicht der Oberfläche', async ({ page }) => {
    await dashboardOeffnen(page)
    // Rohaufnahme für das beschriftete Orientierungsbild (Muster 3), siehe
    // Kommentar am Dateianfang.
    await page.screenshot({ path: shotPath(KAPITEL, 'login_navigation') })
  })

  test('3.2.1 Navigationsleiste', async ({ page }) => {
    await dashboardOeffnen(page)

    const spotAus = await spotlight(page, seitenleiste(page))
    await page.screenshot({ path: shotPath(KAPITEL, 'login_sidebar') })
    await spotAus()
  })

  test('3.2.2 Kopfzeile', async ({ page }) => {
    await dashboardOeffnen(page)

    const spotAus = await spotlight(page, kopfzeile(page))
    await page.screenshot({ path: shotPath(KAPITEL, 'login_header') })
    await spotAus()
  })

  test('3.2.4 Einstellungen am Fuß der Navigationsleiste', async ({ page }) => {
    await dashboardOeffnen(page)

    // Die Navigationsleiste braucht mit allen aufgeklappten Gruppen 1093 px
    // (gemessen) und passt damit vollständig in die 1120 px Fensterhöhe: die
    // Gruppe „System" ist ohne Scrollen sichtbar. Die Prüfung bleibt trotzdem
    // stehen – wächst die Leiste durch weitere Einträge über das Fenster
    // hinaus, soll der Lauf scheitern statt still ein angeschnittenes Bild zu
    // liefern. Dann den Viewport in playwright.config.ts erhöhen und nicht
    // Gruppen einklappen; letzteres wäre ein Zustand, den Nutzende erst selbst
    // herstellen müssen.
    await expect(page.getByRole('link', { name: 'Einstellungen' })).toBeInViewport()

    const spotAus = await spotlight(page, systemGruppe(page))
    await page.screenshot({ path: shotPath(KAPITEL, 'login_settings') })
    await spotAus()
  })
})
