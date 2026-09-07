// Tools for manual screenshots. Implements the visual language described in
// CLAUDE.md, as far as it can be automated reproducibly:
//
//   Pattern 1  plain overview shot            -> page.screenshot()
//   Pattern 2  dim + spotlight                -> spotlight()
//   Pattern 3  hand-drawn annotation          -> stays manual post-processing
//   Pattern 4  composite grid 2 x 2           -> composite2x2()
//
// Output is always PNG to tests/screenshots/<chapter>/<name>.png. Converting to
// JPEG and copying into public/images/ is done by `pnpm screenshots:publish`
// (scripts/publish-screenshots.sh), not here.
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

import type { Locator, Page } from '@playwright/test'

/** Brand green, used among other things for the digits in the composite grid. */
export const BRAND_GREEN = '#11ba81'

const SHOT_ROOT = 'tests/screenshots'

/** Path for a chapter image, e.g. shotPath('05-karte', 'map') */
export function shotPath(chapter: string, name: string): string {
  const path = join(SHOT_ROOT, chapter, `${name}.png`)
  mkdirSync(dirname(path), { recursive: true })
  return path
}

/**
 * Disables all CSS animations and transitions and stops the blinking text
 * caret. Without this a screenshot catches, depending on timing, a half
 * extended info box or a half opened menu.
 */
export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `,
  })
}

/**
 * Keeps the mouse cursor out of the shot. Playwright does not draw the cursor
 * itself, but hover states (highlighted buttons, tooltips) would otherwise end
 * up in the screenshot unintentionally.
 */
export async function moveCursorAway(page: Page): Promise<void> {
  const size = page.viewportSize()
  await page.mouse.move(size ? size.width - 1 : 1791, size ? size.height - 1 : 1119)
}

export interface SpotlightOptions {
  /** Opacity of the scrim covering the rest of the interface. */
  dim?: number
  /** Corner radius of the cut-out in px. Applies to element targets only. */
  radius?: number
  /** Gap between target element and outline in px. Applies to element targets only. */
  padding?: number
  /** Stroke width of the white outline in px. */
  outlineWidth?: number
}

/**
 * Free-form ellipse as a spotlight target, in CSS pixels of the viewport.
 *
 * For everything that has no element of its own: trenches, addresses and nodes
 * are drawn into the canvas by the map, there is no locator for them. `padding`
 * and `radius` from the options have no effect here - position and size are
 * already part of the ellipse.
 */
export interface SpotlightEllipse {
  /** Centre point in the viewport. */
  x: number
  y: number
  /** Semi-axis along and across the axis of rotation. */
  rx: number
  ry: number
  /** Rotation around the centre in degrees, for objects lying at an angle. */
  rotation?: number
}

/** A spotlight can expose several places at once. */
export type SpotlightTarget = Locator | SpotlightEllipse

/** Marks the inserted overlay so that it can be removed again. */
const SPOTLIGHT_ID = 'qonnectra-docs-spotlight'

function isEllipse(target: SpotlightTarget): target is SpotlightEllipse {
  return 'rx' in target
}

/** Rounded rectangle around an element, as an SVG path. */
function rectPath(
  rect: { x: number; y: number; width: number; height: number },
  padding: number,
  radius: number,
): string {
  const x = rect.x - padding
  const y = rect.y - padding
  const w = rect.width + padding * 2
  const h = rect.height + padding * 2
  const r = Math.min(radius, w / 2, h / 2)

  return (
    `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} ` +
    `V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} ` +
    `H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} ` +
    `V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`
  )
}

/**
 * Ellipse as an SVG path built from two half arcs. The rotation lives in the
 * `x-axis-rotation` of the arcs and not in a `transform` - only that way can
 * the path be combined with the rectangles in a shared `d`, and exactly that is
 * what makes the cut-out via `fill-rule: evenodd` possible.
 */
function ellipsePath({ x, y, rx, ry, rotation = 0 }: SpotlightEllipse): string {
  const radians = (rotation * Math.PI) / 180
  const dx = rx * Math.cos(radians)
  const dy = rx * Math.sin(radians)

  return (
    `M${x - dx},${y - dy} A${rx},${ry} ${rotation} 0 1 ${x + dx},${y + dy} ` +
    `A${rx},${ry} ${rotation} 0 1 ${x - dx},${y - dy} Z`
  )
}

/**
 * Pattern 2: dims the entire interface and leaves only `target` at full
 * brightness with a white, rounded outline.
 *
 * `target` may be an element, an ellipse or a list of both. Several targets at
 * once are needed e.g. for the selected map object: the object itself sits in
 * the canvas, its values are shown in the info box on the right - both places
 * belong in the picture, everything in between does not.
 *
 * Implemented as a separate SVG above the page, with one cut-out per target
 * (`fill-rule: evenodd`). Deliberately **nothing** is changed on the target
 * elements or their ancestors. The obvious route via
 * `box-shadow: 0 0 0 9999px` on the target element does not work here:
 *
 * - The shadow ends at the nearest ancestor with `overflow != visible`. For the
 *   opacity slider that left only the white outline, the scrim was cut away
 *   completely.
 * - Making the ancestors transparent to work around this makes the map view
 *   (OpenLayers) lose its canvas content on reflow, and the map ends up empty
 *   in the screenshot.
 *
 * The return value removes the overlay again:
 *
 *   const off = await spotlight(page, legend)
 *   await page.screenshot({ path: shotPath('05-karte', 'map_legend') })
 *   await off()
 */
export async function spotlight(
  page: Page,
  target: SpotlightTarget | SpotlightTarget[],
  options: SpotlightOptions = {},
): Promise<() => Promise<void>> {
  const { dim = 0.5, radius = 8, padding = 6, outlineWidth = 3 } = options

  const paths: string[] = []
  for (const singleTarget of Array.isArray(target) ? target : [target]) {
    if (isEllipse(singleTarget)) {
      paths.push(ellipsePath(singleTarget))
      continue
    }

    await singleTarget.waitFor({ state: 'visible' })
    const rect = await singleTarget.boundingBox()
    if (!rect) {
      throw new Error('Spotlight: target is visible but has no extent in the viewport.')
    }
    paths.push(rectPath(rect, padding, radius))
  }

  await page.evaluate(
    ({ paths, dim, outlineWidth, overlayId }) => {
      document.getElementById(overlayId)?.remove()

      const width = window.innerWidth
      const height = window.innerHeight
      const holes = paths.join(' ')

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.id = overlayId
      svg.setAttribute('width', String(width))
      svg.setAttribute('height', String(height))
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
      svg.style.cssText =
        'position:fixed;top:0;left:0;pointer-events:none;z-index:2147483647'

      // The targets are further sub-paths inside the full-area rectangle; with
      // evenodd they become the cut-outs in the scrim.
      const scrim = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      scrim.setAttribute('d', `M0,0 H${width} V${height} H0 Z ${holes}`)
      scrim.setAttribute('fill', `rgba(0, 0, 0, ${dim})`)
      scrim.setAttribute('fill-rule', 'evenodd')
      svg.appendChild(scrim)

      const outline = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      outline.setAttribute('d', holes)
      outline.setAttribute('fill', 'none')
      outline.setAttribute('stroke', '#fff')
      outline.setAttribute('stroke-width', String(outlineWidth))
      svg.appendChild(outline)

      document.body.appendChild(svg)
    },
    { paths, dim, outlineWidth, overlayId: SPOTLIGHT_ID },
  )

  return async () => {
    await page.evaluate((id) => document.getElementById(id)?.remove(), SPOTLIGHT_ID)
  }
}

/** Padding around detail crops, in CSS pixels. */
const CROP_PADDING = 24

export interface Crop16by10Options {
  /** Padding around the target in CSS pixels. Default: 24. */
  padding?: number
}

/**
 * Crop around `target`, expanded to 16 : 10 and pushed inside the window -
 * to be used as `clip` for `page.screenshot()`.
 *
 * The aspect ratio is not cosmetic: image pairs (full shot + detail) sit in an
 * `.img-row` in the manual, and that renders its images in a 16-to-10 frame
 * with `object-fit: contain` (`.vitepress/theme/custom.css`). A detail image
 * cropped portrait would stay small in there, with empty space left and right.
 *
 * `target` may be a list; then the common hull of all targets is framed. Needed
 * for subjects that consist of two parts - the opened project picker for
 * instance sits in the header, while its list renders through a portal far
 * below it in the DOM (`ProjectCombobox.svelte`).
 */
export async function crop16by10(
  page: Page,
  target: Locator | Locator[],
  options: Crop16by10Options = {},
): Promise<{ x: number; y: number; width: number; height: number }> {
  const { padding = CROP_PADDING } = options

  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity

  for (const singleTarget of Array.isArray(target) ? target : [target]) {
    await singleTarget.waitFor({ state: 'visible' })
    const box = await singleTarget.boundingBox()
    if (!box) {
      throw new Error('Crop: target is visible but has no extent in the viewport.')
    }
    left = Math.min(left, box.x)
    top = Math.min(top, box.y)
    right = Math.max(right, box.x + box.width)
    bottom = Math.max(bottom, box.y + box.height)
  }

  const viewport = page.viewportSize()!

  let height = Math.min(bottom - top + padding * 2, viewport.height)
  let width = (height * 16) / 10
  if (width > viewport.width) {
    width = viewport.width
    height = (width * 10) / 16
  }

  // Centre on the target, but not past the window edge - there is no image out
  // there, and Playwright would silently trim the crop.
  const centred = (centre: number, length: number, limit: number) =>
    Math.min(Math.max(centre - length / 2, 0), limit - length)

  return {
    x: centred((left + right) / 2, width, viewport.width),
    y: centred((top + bottom) / 2, height, viewport.height),
    width,
    height,
  }
}

export interface Composite2x2Options {
  /**
   * Label per tile, in the original hand-written looking green digits. `null`
   * leaves a tile unlabelled. One entry may also cover several steps at once
   * ("1, 2, 3") when a tile covers several steps of the numbered list in the
   * text.
   *
   * Default: "1" to "4". For a grid without any digits use
   * `labels: [null, null, null, null]`.
   */
  labels?: (string | null)[]
}

/**
 * Pattern 4: assembles four screenshots into a 2 x 2 grid with white gutters
 * and labels them in the bottom right corner in brand green.
 *
 * The assembly happens in the browser (a blank page with a CSS grid) so that
 * the repo gets by without an additional image library.
 */
export async function composite2x2(
  page: Page,
  images: Buffer[],
  targetPath: string,
  options: Composite2x2Options = {},
): Promise<void> {
  if (images.length !== 4) {
    throw new Error(`Composite grid expects exactly 4 images, got: ${images.length}`)
  }

  const { labels = ['1', '2', '3', '4'] } = options

  const tiles = images
    .map((image, index) => {
      const source = `data:image/png;base64,${image.toString('base64')}`
      const label = labels[index]
      const digit = label ? `<span class="digit">${label}</span>` : ''
      return `<figure class="tile"><img src="${source}" alt="">${digit}</figure>`
    })
    .join('\n')

  const assembly = await page.context().newPage()
  try {
    await assembly.setContent(
      `<!doctype html>
      <html lang="de">
      <head><meta charset="utf-8"><style>
        html, body { margin: 0; background: #fff; }
        #grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          padding: 16px;
          background: #fff;
          width: max-content;
        }
        .tile { position: relative; margin: 0; line-height: 0; }
        .tile img { display: block; width: 640px; height: auto; }
        .digit {
          position: absolute;
          right: 16px;
          bottom: 12px;
          font: 700 56px/1 "DejaVu Sans", system-ui, sans-serif;
          white-space: nowrap;
          color: ${BRAND_GREEN};
          -webkit-text-stroke: 3px #fff;
          paint-order: stroke fill;
        }
      </style></head>
      <body><div id="grid">${tiles}</div></body>
      </html>`,
      { waitUntil: 'load' },
    )

    // Only shoot once all four images are actually decoded.
    await assembly.evaluate(() =>
      Promise.all(
        Array.from(document.images).map((img) => (img.complete ? undefined : img.decode())),
      ),
    )

    await assembly.locator('#grid').screenshot({ path: targetPath })
  } finally {
    await assembly.close()
  }
}
