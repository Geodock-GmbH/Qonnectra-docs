// Tools for the Chart.js charts of the dashboard.
//
// The still images of chapter "4. Dashboard" need them: tests/04-dashboard.spec.ts
// puts the tooltip above the longest bar.
//
// Why measure in the picture at all: Chart.js draws bars **and** tooltip into
// the canvas (Chart.svelte). There is neither an element a locator could point
// at nor an instance on `window`: where a bar sits and what the cursor does
// there can only be read off the painted picture.
import type { Locator } from '@playwright/test'

/**
 * Colour of the bars in the chart "Gesamtlänge pro Oberfläche" (`#0ea5e9`, see
 * TrenchStatistics.svelte). Every chart of the dashboard has its own colour;
 * the canvas is searched for exactly this one.
 */
export const CHART_BLUE: [number, number, number] = [14, 165, 233]

export interface Bar {
  /** Point in the window where the bar is hit reliably (CSS pixels). */
  x: number
  y: number
}

/**
 * Returns one point per bar that can be pointed at - measured in the painted
 * picture.
 *
 * Necessary because the Chart.js instance is not attached to `window` and the
 * bars are therefore reachable neither as an element nor through an API.
 * Measured instead of hard-coded: the number and length of the bars depend on
 * the data of the test project, and a bar for a small value ends well before
 * the middle of the chart. The point therefore sits in the first third of the
 * respective bar.
 */
export async function measureBars(
  canvas: Locator,
  colour: [number, number, number],
): Promise<Bar[]> {
  return canvas.evaluate((element, c) => {
    const surface = element as HTMLCanvasElement
    const ctx = surface.getContext('2d')
    if (!ctx) return []
    const data = ctx.getImageData(0, 0, surface.width, surface.height).data

    // The canvas holds device pixels (deviceScaleFactor 2), pointing happens in
    // CSS pixels of the window.
    const rect = surface.getBoundingClientRect()
    const scaleX = rect.width / surface.width
    const scaleY = rect.height / surface.height

    const rows: { y: number; from: number; to: number }[] = []
    for (let y = 0; y < surface.height; y++) {
      let from = -1
      let to = -1
      for (let x = 0; x < surface.width; x++) {
        const i = (y * surface.width + x) * 4
        if (
          Math.abs(data[i] - c[0]) < 24 &&
          Math.abs(data[i + 1] - c[1]) < 24 &&
          Math.abs(data[i + 2] - c[2]) < 24
        ) {
          if (from < 0) from = x
          to = x
        }
      }
      // Short hits would be the colour swatches of the legend or anti-aliasing.
      if (from >= 0 && to - from > 8) rows.push({ y, from, to })
    }

    // Contiguous rows form one bar.
    const groups: { y: number; from: number; to: number }[][] = []
    for (const row of rows) {
      const last = groups[groups.length - 1]
      if (last && row.y - last[last.length - 1].y <= 2) last.push(row)
      else groups.push([row])
    }

    return groups.map((group) => {
      const from = Math.min(...group.map((r) => r.from))
      const to = Math.max(...group.map((r) => r.to))
      const centreY = (group[0].y + group[group.length - 1].y) / 2
      return {
        x: rect.left + (from + (to - from) / 3) * scaleX,
        y: rect.top + centreY * scaleY,
      }
    })
  }, colour)
}

/**
 * Counts the very dark pixels of a canvas.
 *
 * The Chart.js tooltip is not a DOM element - it is drawn into the canvas with
 * `rgba(0, 0, 0, 0.8)` and can therefore only be detected in the picture.
 * Without a tooltip the dark pixels sit in the axis labels and the axis line
 * alone (measured around 4,900), with a tooltip more than three times that
 * (around 16,500).
 */
export async function countDarkPixels(canvas: Locator): Promise<number> {
  return canvas.evaluate((element) => {
    const surface = element as HTMLCanvasElement
    const ctx = surface.getContext('2d')
    if (!ctx) return 0
    const data = ctx.getImageData(0, 0, surface.width, surface.height).data
    let dark = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 90 && data[i + 1] < 90 && data[i + 2] < 90 && data[i + 3] > 200) dark++
    }
    return dark
  })
}
