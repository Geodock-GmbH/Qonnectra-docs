// Waiting for the map to stop being redrawn.
//
// OpenLayers places the labels of the vector base map with a declutter pass over
// the features it happens to have loaded at the moment of the render. A tile
// arriving late therefore moves the street names by a few pixels - invisible to
// a reader, but it changes the file, and it was the whole difference between two
// runs of map_search (10 745 pixels; the amplified diff showed nothing but
// street names), of map_address_detail and of conduit_connection_routing.
//
// Every spec that captures a map needs this, not just the map chapter itself.
// And it is needed twice over: once after the view has been opened, and again
// immediately before the capture, because `spotlight()` lays an SVG over the
// page and that reflow makes OpenLayers render anew.
import type { Page } from '@playwright/test'

/**
 * One checksum per canvas of the map.
 *
 * Sampled the same way as `chartsSettled()` in the dashboard spec: every 64th
 * byte is plenty to notice that the picture changed, and cheap enough to poll.
 * A canvas locked for `getImageData` by raster tiles of foreign origin counts as
 * "unchanged" - its content cannot be read, and the objects of the map live in
 * another one anyway.
 */
async function mapChecksums(page: Page): Promise<string> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('div.map canvas'))
      .map((canvas) => {
        const surface = canvas as HTMLCanvasElement
        try {
          const ctx = surface.getContext('2d')
          if (!ctx) return '-'
          const data = ctx.getImageData(0, 0, surface.width, surface.height).data
          let sum = 0
          for (let i = 0; i < data.length; i += 64) sum += data[i]
          return String(sum)
        } catch {
          return '-'
        }
      })
      .join(','),
  )
}

/**
 * Waits until two consecutive readings of the map are the same.
 *
 * Deliberately over **all** canvases. An earlier version left out whichever
 * canvas currently painted the selection colour, to keep the blinking highlight
 * of a jumped-to object from holding it up - but with an object selected that
 * skipped every canvas, the check then had nothing left to compare and ran into
 * its timeout without ever having looked. conduit_connection_routing kept moving
 * its street names because of it. Where a blink really has to be waited out, the
 * spec waits it out first (settledMapShot() in tests/05-karte.spec.ts).
 *
 * Best effort: if the map never comes to rest, the capture still happens rather
 * than the test failing. A map that keeps redrawing shows up as a difference in
 * the image, which is the thing being watched anyway.
 */
export async function waitForBaseMapSettled(page: Page, timeout = 6000): Promise<void> {
  const deadline = Date.now() + timeout
  let previous = await mapChecksums(page)

  while (Date.now() < deadline) {
    await page.waitForTimeout(120)
    const now = await mapChecksums(page)
    if (now === previous) return
    previous = now
  }
}
