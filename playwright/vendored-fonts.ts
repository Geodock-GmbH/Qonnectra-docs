// Serves the web font of the base map from the repo instead of the internet.
//
// ol-mapbox-style loads the fonts of the map style as web fonts: it injects a
// stylesheet from cdn.jsdelivr.net (`@fontsource/noto-sans/400.css`), and the
// browser fetches the woff2 files it names. Measured over every route of the
// app, these are the only requests that leave the local instance at all.
//
// Fetched live they are a race. The stylesheet arrives about 800 ms into the
// page, while the base map tiles are already being rendered. A label measured
// before the font is there is laid out with the Noto Sans pinned in the
// capture image, a label measured after it with the web font - and the two
// differ in glyph widths, so street names came out spaced differently from one
// run to the next ("Bir ristoft" in one run, "Birristoft" in the next),
// depending on nothing but the latency of the CDN. The published map images
// show the web font; on a fast connection it always won.
//
// So the files are vendored (playwright/fonts/noto-sans/, version in the README
// there) and served to the same URLs from disk, and they are loaded at document
// start, long before the map exists. The capture browser cannot reach anything
// but the local instance anyway (`--host-resolver-rules` in
// playwright.config.ts); a route is answered before any DNS lookup, so these
// requests succeed while every other external one fails at once.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { BrowserContext } from '@playwright/test'

/** The URL prefix the app requests; everything below it is answered from DIR. */
const CDN = 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans/'
const DIR = join('playwright', 'fonts', 'noto-sans')

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
}

interface FontFaceSource {
  url: string
  weight: string
  unicodeRange: string
}

/**
 * The woff2 file, weight and unicode range of every `@font-face` in the
 * vendored stylesheets - what the browser is told to load, so that it can be
 * told early.
 */
function fontFaces(): FontFaceSource[] {
  const faces: FontFaceSource[] = []
  for (const stylesheet of readdirSync(DIR).filter((name) => name.endsWith('.css'))) {
    const css = readFileSync(join(DIR, stylesheet), 'utf8')
    for (const block of css.split('@font-face').slice(1)) {
      const file = /url\(\.\/files\/([^)]+\.woff2)\)/.exec(block)?.[1]
      const weight = /font-weight:\s*(\d+);/.exec(block)?.[1]
      const unicodeRange = /unicode-range:\s*([^;]+);/.exec(block)?.[1]
      if (file && weight && unicodeRange) {
        faces.push({ url: `${CDN}files/${file}`, weight, unicodeRange: unicodeRange.trim() })
      }
    }
  }
  if (faces.length === 0) {
    throw new Error(`No @font-face with a woff2 file found below ${DIR}.`)
  }
  return faces
}

/**
 * Answers the font requests of the context from the vendored files and starts
 * loading the faces at document start.
 *
 * Returns the URLs below CDN that had no vendored file. The caller checks that
 * list after the test: such a request was aborted, the browser fell back to
 * the local font for whatever needed it, and the image is not the one the
 * manual shows - a stylesheet change in the app that has to be looked at,
 * not a difference to wave through.
 */
export async function serveVendoredFonts(context: BrowserContext): Promise<() => string[]> {
  const unknown: string[] = []

  await context.route(`${CDN}**`, async (route) => {
    const url = route.request().url()
    const relative = new URL(url).pathname.replace('/npm/@fontsource/noto-sans/', '')
    const file = join(DIR, relative)
    const extension = relative.slice(relative.lastIndexOf('.'))

    if (relative.includes('..') || !(extension in CONTENT_TYPES) || !existsSync(file)) {
      unknown.push(url)
      await route.abort()
      return
    }

    // The CDN answers with CORS headers, and a font loaded cross-origin
    // without them is refused by the browser - silently, with the fallback.
    await route.fulfill({
      path: file,
      contentType: CONTENT_TYPES[extension],
      headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' },
    })
  })

  // The same faces the stylesheet declares, requested at document start. By
  // the time ol-mapbox-style injects the stylesheet, they are loaded, and its
  // declarations resolve to files already in hand.
  await context.addInitScript((faces: FontFaceSource[]) => {
    for (const face of faces) {
      const fontFace = new FontFace('Noto Sans', `url(${face.url}) format('woff2')`, {
        weight: face.weight,
        style: 'normal',
        display: 'swap',
        unicodeRange: face.unicodeRange,
      })
      document.fonts.add(fontFace)
      fontFace.load().catch(() => {
        // Reported through the route: a file that is not vendored is aborted
        // there and ends up in `unknown`.
      })
    }
  }, fontFaces())

  return () => unknown
}
