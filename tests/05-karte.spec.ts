import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  animationenAus,
  composite2x2,
  shotPath,
  spotlight,
  type SpotlightEllipse,
  zeigerWeg,
} from '../playwright/manual-shots'

// Screenshots für Kapitel „5. Karte" im Handbuch
// (manual/teil-a-anwenderhandbuch/05-karte.md). Erzeugt alle Bilder des
// Kapitels; die handgezeichnete Markierung (Muster 3) in
// map_address_detail_select bleibt Nachbearbeitung.
//
// Übernehmen nach public/images/ mit: pnpm screenshots:publish 05-karte
const KAPITEL = '05-karte'

/**
 * Kartenausschnitte in EPSG:3857. Die Karte hat kein Auto-Fit und liest Mitte
 * und Zoom aus dem localStorage, siehe playwright/auth.setup.ts.
 */
const ANSICHT = {
  /** Gesamtes Netz des Testprojekts. */
  uebersicht: { mitte: [1083532, 7308590], zoom: 16.5 },
  /**
   * Punkt auf einer Trasse, weit genug von Netzknoten und Adresspunkten
   * entfernt, dass ein Klick auf die Kartenmitte eine Trasse trifft und keinen
   * Punkt.
   */
  trasse: { mitte: [1083259.8664021306, 7308174.151234357], zoom: 17 },

  /**
   * Absichtlich weit weg vom Projektgebiet. Abschnitt 5.1 beschreibt den Fall
   * „Projekt gewechselt, Karte steht noch woanders“ – aus einer Ansicht, die
   * schon auf dem Netz liegt, würde „Auf Ausdehnung zoomen“ das Bild kaum
   * verändern und das Bildpaar nichts zeigen.
   */
  fern: { mitte: [1078000, 7304000], zoom: 13 },

  /**
   * Näher am Netz, damit Beschriftungen überhaupt gezeichnet werden: Adress-
   * und Netzknoten-Labels erscheinen erst unter Auflösung 1,0 (`styles.ts`),
   * also ab ca. Zoom 17,3. Bei der Übersicht (Zoom 16,5) bliebe die Kachel
   * „Beschriftungen anzeigen“ im Composite ohne sichtbaren Effekt.
   */
  nah: { mitte: [1083532, 7308590], zoom: 17.5 },
}

/**
 * Erkennt eine Trasse am Namen in der Info-Box. Unter der Kartenmitte von
 * ANSICHT.trasse laufen mehrere Trassen zusammen (beobachtet: TR-6AQ6RR6 und
 * TR-HUH5A6X); welche die Abfrage trifft, wechselt von Lauf zu Lauf. Für das
 * Bild ist das gleichwertig, deshalb wird auf „irgendeine Trasse" geprüft und
 * nicht auf einen festen Namen.
 */
const TRASSE_MUSTER = /^TR-[A-Z0-9]+$/

/** Liefert 46 Treffer und damit das Filterfeld (erscheint ab 10 Treffern). */
const SUCHBEGRIFF_VIELE = 'Nieharde'

/**
 * Öffnet die Karte des Testprojekts in der gewünschten Ansicht und wartet, bis
 * sie fertig gezeichnet ist.
 *
 * Die Ansicht wird über `addInitScript` gesetzt, also vor jedem Laden des
 * Dokuments. Der naheliegende Weg – laden, `localStorage` setzen, neu laden –
 * hat eine Race Condition: Die App schreibt `mapCenter`/`mapZoom` bei jedem
 * `moveend` zurück. Landet dieser Rückschreibvorgang zwischen dem Setzen und
 * dem Neuladen, ist der Seed wieder weg und die Karte startet in der
 * Übersicht statt auf der gewünschten Stelle. In Tests, die auf eine
 * bestimmte Stelle klicken, trifft der Klick dann nichts.
 */
async function karteOeffnen(page: Page, ansicht = ANSICHT.uebersicht) {
  await page.addInitScript((a) => {
    localStorage.setItem('mapCenter', JSON.stringify(a.mitte))
    localStorage.setItem('mapZoom', JSON.stringify(a.zoom))
  }, ansicht)

  await page.goto('/map')
  await expect(page).toHaveURL(/\/map\/2(\/|$)/)

  // Mit laufendem Tileserver (Vektorkacheln) legt OpenLayers ein zweites
  // Canvas an, ohne ihn (OSM-Rasterfallback) nur eines – deshalb .first().
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  // Die Kacheln kommen über einen Worker-Pool nach, den networkidle nicht sieht.
  await page.waitForTimeout(2500)

  await animationenAus(page)
  await zeigerWeg(page)
}

/** Legenden-Panel „Layer" oben rechts. */
function legende(page: Page): Locator {
  return page
    .getByRole('button', { name: /^Layer-Liste (ein|aus)klappen$/ })
    .locator('xpath=../..')
}

/** Zeile eines Layers in der Legende, z. B. „Adresse". */
function legendenZeile(page: Page, name: string): Locator {
  return legende(page).getByText(name, { exact: true }).locator('xpath=..')
}

/**
 * Misst das ausgewählte Kartenobjekt im gezeichneten Bild und liefert die
 * Ellipse, die es umschließt – als Ziel für `spotlight()`.
 *
 * Trassen, Adressen und Netzknoten zeichnet die Karte ins Canvas; ein Element,
 * auf das ein Locator zeigen könnte, gibt es dafür nicht. Deshalb wird nach der
 * Auswahlfarbe der App gesucht (`DEFAULT_SELECTED_COLOR` = `#fff700` in
 * `local-app/frontend/src/lib/map/defaultColors.ts`); nichts anderes auf der
 * Karte ist so gelb.
 *
 * Gemessen statt festgeschrieben, weil unter der Kartenmitte mehrere Trassen
 * zusammenlaufen und von Lauf zu Lauf eine andere getroffen wird (siehe
 * TRASSE_MUSTER). Lage, Länge und Neigung der Linie wechseln damit mit.
 *
 * Die Ellipse wird an der Hauptachse der Fundpunkte ausgerichtet (Kovarianz wie
 * bei einer Hauptkomponentenanalyse). Ohne Drehung bräuchte eine schräg
 * liegende Trasse eine Ellipse, die vor allem leeren Kartenausschnitt
 * freistellt.
 */
async function ausgewaehltesKartenobjekt(page: Page): Promise<SpotlightEllipse> {
  /** Luft zwischen Objekt und weißer Kontur, in CSS-Pixeln. */
  const LUFT = 18
  /**
   * Eine Trassenlinie ist nur wenige Pixel breit. Ohne Mindestmaß quer zur
   * Achse fiele die Ellipse zu einem Strich zusammen.
   */
  const MINDEST_QUER = 34

  const mass = await page.evaluate(() => {
    const punkte: number[][] = []

    for (const canvas of Array.from(document.querySelectorAll('div.map canvas'))) {
      const flaeche = canvas as HTMLCanvasElement
      let daten
      try {
        const ctx = flaeche.getContext('2d')
        if (!ctx) continue
        daten = ctx.getImageData(0, 0, flaeche.width, flaeche.height).data
      } catch {
        // Ein Canvas mit Rasterkacheln fremder Herkunft ist für getImageData
        // gesperrt. Die Objekte der Karte liegen ohnehin in einem anderen.
        continue
      }

      // Das Canvas hat Gerätepunkte (deviceScaleFactor 2), die Ellipse braucht
      // CSS-Pixel des Viewports.
      const rect = flaeche.getBoundingClientRect()
      const skalaX = rect.width / flaeche.width
      const skalaY = rect.height / flaeche.height

      for (let py = 0; py < flaeche.height; py += 1) {
        const zeile = py * flaeche.width * 4
        for (let px = 0; px < flaeche.width; px += 1) {
          const i = zeile + px * 4
          // Toleranz gegen Kantenglättung, aber eng genug, dass die orangen
          // Adresspunkte und die gelblichen Straßen der Basiskarte draußen
          // bleiben.
          if (daten[i + 3] <= 200) continue
          if (daten[i] <= 225 || daten[i + 1] <= 215 || daten[i + 2] >= 110) continue
          punkte.push([rect.left + (px + 0.5) * skalaX, rect.top + (py + 0.5) * skalaY])
        }
      }
    }

    const anzahl = punkte.length
    if (anzahl === 0) return { anzahl, x: 0, y: 0, laengs: 0, quer: 0, drehung: 0 }

    let mx = 0
    let my = 0
    for (const [x, y] of punkte) {
      mx += x
      my += y
    }
    mx /= anzahl
    my /= anzahl

    let sxx = 0
    let syy = 0
    let sxy = 0
    for (const [x, y] of punkte) {
      const dx = x - mx
      const dy = y - my
      sxx += dx * dx
      syy += dy * dy
      sxy += dx * dy
    }

    // Richtung der Hauptachse der Punktwolke.
    const winkel = 0.5 * Math.atan2(2 * sxy, sxx - syy)
    const cos = Math.cos(winkel)
    const sin = Math.sin(winkel)

    let laengs = 0
    let quer = 0
    for (const [x, y] of punkte) {
      const dx = x - mx
      const dy = y - my
      laengs = Math.max(laengs, Math.abs(dx * cos + dy * sin))
      quer = Math.max(quer, Math.abs(dy * cos - dx * sin))
    }

    return { anzahl, x: mx, y: my, laengs, quer, drehung: (winkel * 180) / Math.PI }
  })

  expect(
    mass.anzahl,
    'Auf der Karte ist kein Objekt in der Auswahlfarbe #fff700 gezeichnet – ' +
      'ist die Auswahl wirklich gesetzt, und stimmt die Farbe noch mit ' +
      'DEFAULT_SELECTED_COLOR der App überein?',
  ).toBeGreaterThan(50)

  return {
    x: mass.x,
    y: mass.y,
    rx: mass.laengs + LUFT,
    ry: Math.max(mass.quer + LUFT, MINDEST_QUER),
    drehung: mass.drehung,
  }
}

/**
 * Tippt einen Suchbegriff so ein, wie es Nutzende tun: Feld anklicken,
 * vorhandenen Inhalt markieren, Zeichen für Zeichen tippen.
 *
 * Bewusst nicht `fill()`. Damit bleibt bei einer **zweiten** Suche die
 * Trefferliste nach dem Klick auf einen Treffer offen stehen, obwohl die App
 * sie schließt – nachgemessen: mit `fill()` ist die Liste auch nach 4 s noch
 * sichtbar, mit echtem Tippen ist sie nach ca. 600 ms verschwunden. Das Bild
 * würde sonst einen Zustand zeigen, den es in der App nicht gibt.
 */
async function suchbegriffTippen(page: Page, feld: Locator, begriff: string) {
  await feld.click()
  await page.keyboard.press('ControlOrMeta+a')
  await feld.pressSequentially(begriff, { delay: 30 })
}

/** Screenshot des Kartenbereichs, für die Kacheln der Composite-Raster. */
function kartenAusschnitt(page: Page): Promise<Buffer> {
  return page.locator('.map-wrapper').screenshot()
}

test('5. Übersicht der Karte', async ({ page }) => {
  await karteOeffnen(page)
  await page.screenshot({ path: shotPath(KAPITEL, 'map') })
})

test('5.1 Legendeneintrag „Adresse" und Zoom auf den Layer', async ({ page }) => {
  await karteOeffnen(page, ANSICHT.fern)

  // Vollbild mit hervorgehobener Zeile „Adresse".
  const spotAus = await spotlight(page, legendenZeile(page, 'Adresse'))
  await page.screenshot({ path: shotPath(KAPITEL, 'map_address_detail') })
  await spotAus()

  // Nach dem Zoom auf die Ausdehnung des Layers.
  await legendenZeile(page, 'Adresse')
    .getByRole('button', { name: 'Auf Ausdehnung zoomen' })
    .click()
  await zeigerWeg(page)
  // view.fit läuft 800 ms, danach laden Kacheln nach.
  await page.waitForTimeout(3000)
  await page.screenshot({ path: shotPath(KAPITEL, 'map_address_detail_select') })
})

test('5.2 Transparenz-Regler', async ({ page }) => {
  await karteOeffnen(page)

  const regler = page.getByLabel('Ändert die Transparenz der OpenStreetMap-Hintergrundkarte.')
  const spotAus = await spotlight(page, regler)
  await page.screenshot({ path: shotPath(KAPITEL, 'map_opacity') })
  await spotAus()
})

test('5.2 Legende', async ({ page }) => {
  await karteOeffnen(page)

  const spotAus = await spotlight(page, legende(page))
  await page.screenshot({ path: shotPath(KAPITEL, 'map_legend') })
  await spotAus()
})

test('5.2 Aktionen in der Legende (Composite)', async ({ page }) => {
  await karteOeffnen(page, ANSICHT.nah)

  // 1. Ausgangszustand.
  const kachel1 = await kartenAusschnitt(page)

  // 2. Layer „Netzknoten" ausgeblendet.
  await legendenZeile(page, 'Netzknoten')
    .getByRole('button', { name: 'Layer ausblenden' })
    .click()
  await zeigerWeg(page)
  await page.waitForTimeout(800)
  const kachel2 = await kartenAusschnitt(page)

  await legendenZeile(page, 'Netzknoten')
    .getByRole('button', { name: 'Layer anzeigen' })
    .click()
  await zeigerWeg(page)

  // 3. Beschriftungen des Layers „Adresse" eingeschaltet.
  await legendenZeile(page, 'Adresse')
    .getByRole('button', { name: 'Beschriftungen anzeigen' })
    .click()
  await zeigerWeg(page)
  await page.waitForTimeout(1200)
  const kachel3 = await kartenAusschnitt(page)

  await legendenZeile(page, 'Adresse')
    .getByRole('button', { name: 'Beschriftungen ausblenden' })
    .click()
  await zeigerWeg(page)

  // 4. Layergruppe „Netzknoten" aufgeklappt.
  await legendenZeile(page, 'Netzknoten').getByRole('button', { name: 'Ausklappen' }).click()
  await zeigerWeg(page)
  await page.waitForTimeout(800)
  const kachel4 = await kartenAusschnitt(page)

  // Das Vorbild im Handbuch zeigt die vier Zustände ohne Ziffern.
  await composite2x2(page, [kachel1, kachel2, kachel3, kachel4], shotPath(KAPITEL, 'map_legend_actions'), {
    labels: [null, null, null, null],
  })
})

test('5.3 Ausgewähltes Objekt mit Info-Box', async ({ page }) => {
  // Der Klick wird ggf. mehrfach versucht, siehe unten.
  test.setTimeout(90_000)
  await karteOeffnen(page, ANSICHT.trasse)

  // Am Klickpunkt liegen zwei Objekte übereinander: die Trasse und das
  // Projektgebiet „Cluster 01", dessen Fläche das gesamte Netz überdeckt. Eine
  // Trassenlinie ist nur wenige Pixel breit; schon eine minimale Verschiebung
  // der Kartendarstellung entscheidet, ob die Kartenmitte auf der Linie liegt
  // oder daneben – und dann wird das Gebiet ausgewählt statt der Trasse.
  // Beobachtet: dieselbe Stelle liefert je nach Lauf TR-6AQ6RR6, TR-HUH5A6X
  // oder „Cluster 01". Wiederholtes Klicken hilft nicht, weil die Ursache nicht
  // das Nachladen der Kacheln ist.
  //
  // Deshalb wird der Layer „Gebiet" für dieses Bild ausgeblendet. Die Auswahl
  // trifft damit zuverlässig eine Trasse, und das Bild zeigt weiterhin genau
  // das, was Abschnitt 5.3 beschreibt: ein ausgewähltes Objekt mit Info-Box.
  // Wieder einschalten lässt sich der Layer nicht, weil die geöffnete Info-Box
  // die Legende verdeckt.
  await legendenZeile(page, 'Gebiet').getByRole('button', { name: 'Layer ausblenden' }).click()
  await zeigerWeg(page)
  await page.waitForTimeout(1000)

  // Die Info-Box öffnet ausschließlich der Klick auf die Karte; die Suche
  // öffnet sie nicht.
  //
  // Mit ausgeblendetem Gebiet liegt unter der Trassenlinie nichts mehr, das
  // einen Beinahe-Treffer abfangen würde: Trifft der Klick die wenige Pixel
  // breite Linie nicht, wird gar nichts ausgewählt und es gibt keine Info-Box.
  // Deshalb wird die Kartenmitte und ein kleines Kreuz darum herum probiert,
  // bis eine Trasse in der Info-Box steht.
  const karte = page.locator('div.map')
  const box = (await karte.boundingBox())!
  const titel = page.locator('#drawer-title')

  const versatz = [
    [0, 0],
    [0, -4],
    [0, 4],
    [-4, 0],
    [4, 0],
    [0, -8],
    [0, 8],
  ]

  let getroffen = false
  for (const [dx, dy] of versatz) {
    await karte.click({ position: { x: box.width / 2 + dx, y: box.height / 2 + dy } })
    if (await titel.isVisible()) {
      getroffen = true
      break
    }
  }
  expect(
    getroffen,
    'An der Kartenmitte wurde kein Objekt getroffen – liegt die Ansicht ' +
      '(ANSICHT.trasse) noch auf einer Trasse? Ohne Treffer öffnet die ' +
      'Info-Box nicht und es gibt kein #drawer-title.',
  ).toBe(true)
  await expect(titel).toHaveText(TRASSE_MUSTER)

  await zeigerWeg(page)
  await page.waitForTimeout(500)

  // Freigestellt wird beides: das ausgewählte Objekt in der Karte und die
  // Info-Box mit seinen Werten. Nur die Info-Box hervorzuheben lässt offen,
  // welches Objekt überhaupt ausgewählt ist – die dünne gelbe Trassenlinie
  // geht im abgedunkelten Kartenbild unter.
  const objekt = await ausgewaehltesKartenobjekt(page)
  const spotAus = await spotlight(page, [objekt, page.locator('[data-drawer]')])
  await page.screenshot({ path: shotPath(KAPITEL, 'map_selected_object') })
  await spotAus()
})

test('5.4 Suchfeld', async ({ page }) => {
  await karteOeffnen(page)

  const spotAus = await spotlight(page, page.locator('.search-panel'))
  await page.screenshot({ path: shotPath(KAPITEL, 'map_search') })
  await spotAus()
})

test('5.4 Suchablauf (Composite)', async ({ page }) => {
  await karteOeffnen(page)

  const suchfeld = page.getByTestId('search-input')
  const treffer = page.locator('.results-container')

  // 1. Suchbegriff eingetippt, noch nicht gesucht.
  await suchbegriffTippen(page, suchfeld, SUCHBEGRIFF_VIELE)
  await zeigerWeg(page)
  const kachel1 = await kartenAusschnitt(page)

  // 2. Trefferliste mit Anzahl und Filterfeld.
  await suchfeld.press('Enter')
  await expect(treffer).toBeVisible()
  await zeigerWeg(page)
  await page.waitForTimeout(500)
  const kachel2 = await kartenAusschnitt(page)

  // 3. Auswahl über das Filterfeld verfeinert.
  const filterfeld = treffer.locator('input.filter-input')
  await filterfeld.click()
  await filterfeld.pressSequentially('12', { delay: 30 })
  await zeigerWeg(page)
  await page.waitForTimeout(500)
  const kachel3 = await kartenAusschnitt(page)

  // 4. Objekt ausgewählt, Karte ist an die Stelle gesprungen.
  //
  // Bewusst derselbe Suchvorgang wie in den Schritten 1 bis 3: Die vier
  // Kacheln sollen einen zusammenhängenden Ablauf zeigen. Angeklickt wird
  // deshalb der gefilterte Treffer „Nieharde 12" – die Karte springt an das
  // zugehörige Haus. Eine zweite Suche nach einem anderen Begriff wäre ein
  // Bruch in der Erzählung und hat außerdem die Trefferliste stehen lassen.
  const ersterTreffer = treffer.locator('li.result-item').first()
  await expect(ersterTreffer).toContainText('Nieharde 12')
  await ersterTreffer.locator('button.result-button').click()
  await zeigerWeg(page)

  // Das Objekt soll im Bild hervorgehoben sein. `zoomToFeature` fährt 1000 ms
  // lang die Ansicht und startet erst im Callback das Blinken: Umschaltung
  // alle 300 ms, sichtbar in den Fenstern 300–600, 900–1200 und 1500–1800 ms
  // nach dem Ende der Fahrt (searchUtils.ts). 1400 ms nach dem Klick liegt
  // also mitten im ersten sichtbaren Fenster. Nach 1800 ms wird die
  // Hervorhebung endgültig entfernt – wer hier länger wartet, bekommt eine
  // Kachel ohne erkennbares Objekt.
  await page.waitForTimeout(1400)
  const kachel4 = await kartenAusschnitt(page)

  // Gegenprobe nach der Aufnahme: Die App schließt die Trefferliste, sobald ein
  // Treffer angeklickt wurde. Bleibt sie stehen, zeigt die Kachel einen
  // Zustand, den es in der App nicht gibt – das soll auffallen und nicht still
  // in ein Handbuchbild wandern.
  await expect(
    treffer,
    'Die Trefferliste steht nach dem Klick noch offen – Kachel 4 zeigt einen ' +
      'Zustand, den Nutzende nicht erleben.',
  ).toBeHidden()

  await composite2x2(page, [kachel1, kachel2, kachel3, kachel4], shotPath(KAPITEL, 'map_search_flow'), {
    labels: ['1, 2', '3, 4', '5', '6'],
  })
})
