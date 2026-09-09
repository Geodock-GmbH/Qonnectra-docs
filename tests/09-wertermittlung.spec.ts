import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  disableAnimations,
  moveCursorAway,
  shotPath,
  spotlight,
  type SpotlightEllipse,
} from '../playwright/manual-shots'

// Screenshots for chapter "9. Wertermittlung" in the manual
// (manual/teil-a-anwenderhandbuch/09-wertermittlung.md). Produces all images
// of the chapter; the video sits in tests/09-wertermittlung-video.spec.ts.
//
// Nothing here writes to the database: "Berechnen" posts to
// /valuation/calculate/, but the endpoint only computes and stores nothing
// (calculate_valuation() in the backend). Which is also why the chapter has no
// clean-up.
//
// Publish to public/images/ with: pnpm screenshots:publish 09-wertermittlung
const CHAPTER = '09-wertermittlung'

/**
 * Area of the demo data the images calculate with.
 *
 * "Cluster 01" is the northern of the two project areas of "Testprojekt" and
 * the more productive one for this view: it holds the POP as well as house
 * connections and distributors, so no cost category comes out at zero. It also
 * shows what section 9.4 explains - the trench length is clipped at the area
 * boundary (3.267,5 m instead of 4.428,81 m for the whole project).
 */
const AREA = 'Cluster 01'

/** Opens the valuation with the state it starts in: "Gesamt", no result. */
async function openValuation(page: Page) {
  await page.goto('/valuation')
  await expect(page.getByRole('button', { name: 'Berechnen' })).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('div.map canvas').first()).toBeVisible({ timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForTimeout(4000)

  await disableAnimations(page)
  await moveCursorAway(page)
}

/**
 * Ticks AREA in the list. That takes the tick off "Gesamt (ganzes Projekt)" by
 * itself and outlines the area in the map.
 */
async function selectArea(page: Page) {
  await areaCheckbox(page).check()
  await expect(gesamtCheckbox(page)).not.toBeChecked()
  // The outline is drawn into the map, not into the DOM.
  await page.waitForTimeout(1200)
  await moveCursorAway(page)
}

/** Runs the calculation and waits for the result table. */
async function calculate(page: Page) {
  await page.getByRole('button', { name: 'Berechnen' }).click()
  await expect(page.getByRole('cell', { name: 'Gesamtinvestition' })).toBeVisible({
    timeout: 60_000,
  })
  await moveCursorAway(page)
}

function gesamtCheckbox(page: Page): Locator {
  return page.getByRole('checkbox').first()
}

function areaCheckbox(page: Page): Locator {
  return page.locator('label').filter({ hasText: AREA }).getByRole('checkbox')
}

/** Block "Gebiet auswählen" at the top of the control panel. */
function areaSelection(page: Page): Locator {
  return page.locator('div.p-3').filter({ hasText: 'Gebiet auswählen' }).first()
}

/** Block "Zukunftsabhängige Wertermittlung" with the two input fields. */
function projectionInputs(page: Page): Locator {
  return page.locator('div.p-3').filter({ hasText: 'Jahr Bauabschluss' }).first()
}

/** The map window on the left, including its frame. */
function mapWindow(page: Page): Locator {
  return page.locator('div.order-1').first()
}

/** The control panel on the right - its own scroll area. */
function controlPanel(page: Page): Locator {
  return page.locator('div.order-2').first()
}

/**
 * Measures where the selected area lies in the map and returns it as a
 * spotlight ellipse in CSS pixels of the viewport.
 *
 * An ellipse and not a locator, because the outline is drawn into the canvas by
 * OpenLayers and has no element of its own. Measured and not hard-coded,
 * because the outline of "Cluster 01" reaches beyond the visible map on two
 * sides - a guessed ellipse either cuts off half the area or exposes the whole
 * map.
 *
 * The search runs for the highlight colour of the view (`highlightStyle` in
 * valuation/[[projectId]]/+page.svelte: `#f59e0b` at a stroke width of 3). The
 * outline is the only thing in the map drawn in it; the base map, the trenches
 * and the project areas are all a different colour.
 */
async function selectedArea(page: Page): Promise<SpotlightEllipse> {
  /** Gap between outline and white cut-out, in CSS pixels. */
  const MARGIN = 12

  const box = await page.evaluate(() => {
    let left = Infinity
    let top = Infinity
    let right = -Infinity
    let bottom = -Infinity
    let count = 0

    for (const canvas of Array.from(document.querySelectorAll('div.map canvas'))) {
      const surface = canvas as HTMLCanvasElement
      let data
      try {
        const context = surface.getContext('2d')
        if (!context) continue
        data = context.getImageData(0, 0, surface.width, surface.height).data
      } catch {
        // A canvas holding raster tiles of foreign origin is locked for
        // getImageData. The highlight lives in a different one anyway.
        continue
      }

      // The canvas holds device pixels (deviceScaleFactor 2), the ellipse needs
      // CSS pixels of the viewport.
      const rect = surface.getBoundingClientRect()
      const scaleX = rect.width / surface.width
      const scaleY = rect.height / surface.height

      for (let py = 0; py < surface.height; py += 1) {
        const row = py * surface.width * 4
        for (let px = 0; px < surface.width; px += 1) {
          const i = row + px * 4
          if (data[i + 3] <= 200) continue
          // #f59e0b with a tolerance against anti-aliasing.
          if (Math.abs(data[i] - 245) > 20) continue
          if (Math.abs(data[i + 1] - 158) > 20) continue
          if (Math.abs(data[i + 2] - 11) > 30) continue

          const x = rect.left + (px + 0.5) * scaleX
          const y = rect.top + (py + 0.5) * scaleY
          left = Math.min(left, x)
          top = Math.min(top, y)
          right = Math.max(right, x)
          bottom = Math.max(bottom, y)
          count += 1
        }
      }
    }

    return { left, top, right, bottom, count }
  })

  expect(
    box.count,
    'No pixel of the highlight colour found - is the area really ticked?',
  ).toBeGreaterThan(200)

  const map = await mapWindow(page).boundingBox()
  if (!map) throw new Error('The map is visible but has no extent in the viewport.')

  const centreX = (box.left + box.right) / 2
  const centreY = (box.top + box.bottom) / 2

  // "Cluster 01" reaches beyond the visible map, so its bounding box does too.
  // The ellipse is therefore held inside the map: outside it there is no area
  // to expose, and a cut-out running over the navigation bar and the control
  // panel would undo the point of the dimming.
  return {
    x: centreX,
    y: centreY,
    rx: Math.min((box.right - box.left) / 2 + MARGIN, centreX - map.x, map.x + map.width - centreX),
    ry: Math.min(
      (box.bottom - box.top) / 2 + MARGIN,
      centreY - map.y,
      map.y + map.height - centreY,
    ),
  }
}

test('9. Übersicht der Wertermittlung', async ({ page }) => {
  await openValuation(page)
  await page.screenshot({ path: shotPath(CHAPTER, 'valuation') })
})

test('9.1 Gebiet oder Gesamtprojekt wählen', async ({ page }) => {
  await openValuation(page)
  await selectArea(page)

  const spotlightOff = await spotlight(page, [areaSelection(page), await selectedArea(page)])
  await page.screenshot({ path: shotPath(CHAPTER, 'valuation_area') })
  await spotlightOff()
})

test('9.2 Jahr des Bauabschlusses und jährlicher Korrekturwert', async ({ page }) => {
  await openValuation(page)

  const spotlightOff = await spotlight(page, projectionInputs(page))
  await page.screenshot({ path: shotPath(CHAPTER, 'valuation_year') })
  await spotlightOff()
})

test('9.4 Ergebnis lesen', async ({ page }) => {
  await openValuation(page)
  await selectArea(page)
  await calculate(page)

  await page.screenshot({ path: shotPath(CHAPTER, 'valuation_result') })
})

test('9.5 Kennzahlen', async ({ page }) => {
  await openValuation(page)
  await selectArea(page)
  await calculate(page)

  // The two KPI cards sit in a grid of their own directly below the table.
  const kpis = page.locator('div.grid-cols-2').filter({ hasText: 'Kosten pro Hausanschluss' })
  const spotlightOff = await spotlight(page, kpis)
  await page.screenshot({ path: shotPath(CHAPTER, 'valuation_kpi') })
  await spotlightOff()
})

test('9.6 Zukunftsabhängige Wertermittlung', async ({ page }) => {
  await openValuation(page)
  await selectArea(page)
  await calculate(page)

  // The projection sits at the bottom of the control panel and is out of sight
  // until the panel is scrolled - which is what section 9.6 points out.
  await controlPanel(page).evaluate((panel) => panel.scrollTo(0, panel.scrollHeight))
  await page.waitForTimeout(600)

  const projection = page
    .locator('div.overflow-x-auto')
    .filter({ has: page.getByRole('columnheader', { name: 'Netzwert' }) })
  await expect(projection).toBeVisible()

  const spotlightOff = await spotlight(page, projection)
  await page.screenshot({ path: shotPath(CHAPTER, 'valuation_projection') })
  await spotlightOff()
})
