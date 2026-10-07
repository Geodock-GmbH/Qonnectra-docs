// Tools for manual screenshots. Implements the visual language described in
// CLAUDE.md, as far as it can be automated reproducibly:
//
//   Pattern 1  plain overview shot            -> shoot()
//   Pattern 2  dim + spotlight                -> spotlight() + shoot()
//   Pattern 3  annotation in brand green      -> annotate() + shoot()
//   Pattern 4  composite grid 2 x 2           -> composite2x2()
//
// Output is always PNG to tests/screenshots/<chapter>/<name>.png. Converting to
// JPEG and copying into public/images/ is done by `pnpm screenshots:publish`
// (scripts/publish-screenshots.sh), not here.
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

import type { Locator, Page } from '@playwright/test'

import { waitForBaseMapSettled } from './stable-map'

/** Brand green, used among other things for the digits in the composite grid. */
export const BRAND_GREEN = '#11ba81'

const SHOT_ROOT = 'tests/screenshots'

/** Path for a chapter image, e.g. shotPath('05-karte', 'map') */
export function shotPath(chapter: string, name: string): string {
  const path = join(SHOT_ROOT, chapter, `${name}.png`)
  mkdirSync(dirname(path), { recursive: true })
  return path
}

export interface ShootOptions {
  /** Crop in CSS pixels of the viewport, as delivered by crop16by10(). */
  clip?: { x: number; y: number; width: number; height: number }
}

/**
 * Takes a chapter image. **The only way a spec is allowed to capture** -
 * `pnpm lint:captures` fails on a direct `page.screenshot()`.
 *
 * The reason is the `animations` option. `page.screenshot()` defaults to
 * `"allow"`, and that is not a theoretical gap: the frontend is Svelte 5, whose
 * transitions run through the **Web Animations API**, not through CSS
 * keyframes. `disableAnimations()` below injects `animation-duration: 0s`,
 * which a script-driven animation never reads - so the capture lands somewhere
 * in the middle of the movement. It cost us a `login_mobile_more.jpg` that
 * showed the menu "Weitere Seiten" at a different slide offset on every run,
 * 150 000 pixels apart, while the spec asserted the menu was visible and the
 * comment next to it claimed the animation was off.
 *
 * `animations: "disabled"` is handled by the browser, not by page CSS, and
 * covers CSS animations, CSS transitions **and** Web Animations: finite
 * animations are fast-forwarded to their end state, which is exactly the state
 * the manual wants to show.
 *
 * `caret` is not set here - `page.screenshot()` already hides it by default.
 *
 * Before the shot the canvases of the page have to come to rest
 * (`waitForBaseMapSettled()`). OpenLayers places the labels of the base map with
 * a declutter pass over whatever tiles it has at the moment of the render, and
 * a tile arriving late moves the street names by a few pixels. Settling once on
 * load is not enough: `spotlight()` lays an SVG over the page, and that reflow
 * makes OpenLayers render again. Doing it here rather than in a per-chapter
 * `shootMap()` is deliberate - eight of the ten specs that show a map had none,
 * and `compaction_address` and `error_map_empty` moved their labels from run to
 * run because of it. Without a canvas on the page the wait costs one poll.
 */
export async function shoot(
  page: Page,
  chapter: string,
  name: string,
  options: ShootOptions = {},
): Promise<void> {
  await waitForBaseMapSettled(page)

  const { clip, ...rest } = options
  const devicePixelRatio = clip ? await page.evaluate(() => window.devicePixelRatio) : 1
  await page.screenshot({
    path: shotPath(chapter, name),
    animations: 'disabled',
    ...rest,
    ...(clip ? { clip: wholePixels(clip, devicePixelRatio, page.viewportSize()) } : {}),
  })
}

/**
 * Snaps a crop to the pixel grid Chromium captures on, and keeps it inside the
 * viewport.
 *
 * Crops are derived from bounding boxes, and those are fractional. Chromium
 * places the origin of a clip on whole **device** pixels - half a CSS pixel at
 * the scale factor of 2 - and truncates its size to whole CSS pixels. Measured
 * on the published images: a crop snapped any other way comes out shifted by
 * one device pixel (`dashboard_project_detail`, `map_node_slots`,
 * `login_start_detail`) or two pixels larger (`Math.round` on the size made
 * `map_node_slots` 2074 wide instead of 2072). Snapping here, before the
 * capture, does the same thing explicitly, so a fraction that differs slightly
 * between two runs lands on the same pixel instead of a different one.
 *
 * The clamp is there because Playwright silently trims a clip that reaches
 * past the window, and a trimmed image has other dimensions.
 */
function wholePixels(
  clip: { x: number; y: number; width: number; height: number },
  devicePixelRatio: number,
  viewport: { width: number; height: number } | null,
): { x: number; y: number; width: number; height: number } {
  const width = Math.floor(clip.width)
  const height = Math.floor(clip.height)
  let x = Math.round(clip.x * devicePixelRatio) / devicePixelRatio
  let y = Math.round(clip.y * devicePixelRatio) / devicePixelRatio
  if (viewport) {
    x = Math.max(0, Math.min(x, viewport.width - width))
    y = Math.max(0, Math.min(y, viewport.height - height))
  }
  return { x, y, width, height }
}

/**
 * A single tile for `composite2x2()`, as a PNG buffer rather than a file.
 *
 * Same reasoning as `shoot()`: an element screenshot defaults to
 * `animations: "allow"` just like a page screenshot does, and the tiles of a
 * grid are captured in the middle of a flow - exactly where a transition is
 * most likely to be running. And the canvases settle first, as in `shoot()`.
 */
export async function shootTile(target: Locator): Promise<Buffer> {
  await waitForBaseMapSettled(target.page())
  return target.screenshot({ animations: 'disabled' })
}

/**
 * Waits until no finite animation is running anywhere on the page.
 *
 * `disableAnimations()` cannot reach the transitions of Svelte 5, which run
 * through the Web Animations API, and `shoot()` only fast-forwards them at the
 * moment of the shot. Everything that **measures** the page before the shot
 * sees them halfway: `spotlight()` read the hit list of the Nachverdichtung
 * while its 200 ms `slide` was still running, and the cut-out ended after two
 * of five hits while the shot showed all five. An assertion before the
 * measurement is no help - `toBeVisible()` passes at the first frame of a
 * transition.
 *
 * Infinite animations (spinners) are left alone: they never finish, and
 * `shoot()` cancels them anyway. Best effort - after `timeout` the measurement
 * goes ahead, and a still running animation shows up as a difference in the
 * image, which is the thing being watched.
 */
export async function waitForAnimations(page: Page, timeout = 5000): Promise<void> {
  await page.evaluate(async (timeout) => {
    const running = () =>
      document.getAnimations().filter((animation) => {
        if (animation.playState !== 'running') return false
        const end = animation.effect?.getComputedTiming().endTime
        return typeof end === 'number' && Number.isFinite(end)
      })
    const deadline = performance.now() + timeout
    while (running().length > 0 && performance.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }, timeout)
}

/**
 * Disables CSS animations and transitions and stops the blinking text caret.
 *
 * Still worth calling before a capture - it settles CSS-driven movement early,
 * instead of leaving it to be fast-forwarded at the moment of the shot. But it
 * is **not** sufficient on its own: it cannot touch animations of the Web
 * Animations API, which is what Svelte 5 uses for its transitions. Only
 * `shoot()` closes that gap; see the note there.
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
 * The targets are measured only once every transition on the page has finished
 * (`waitForAnimations()`), otherwise the cut-out is sized to a half-open
 * element while the shot shows the finished one.
 *
 * The return value removes the overlay again:
 *
 *   const off = await spotlight(page, legend)
 *   await shoot(page, '05-karte', 'map_legend')
 *   await off()
 */
export async function spotlight(
  page: Page,
  target: SpotlightTarget | SpotlightTarget[],
  options: SpotlightOptions = {},
): Promise<() => Promise<void>> {
  const { dim = 0.5, radius = 8, padding = 6, outlineWidth = 3 } = options

  await waitForAnimations(page)

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
 *
 * Measured only once every transition has finished, see `spotlight()`.
 */
export async function crop16by10(
  page: Page,
  target: Locator | Locator[],
  options: Crop16by10Options = {},
): Promise<{ x: number; y: number; width: number; height: number }> {
  const { padding = CROP_PADDING } = options

  await waitForAnimations(page)

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

// ---------------------------------------------------------------------------
// Pattern 3: annotation
// ---------------------------------------------------------------------------

export interface AnnotationRect {
  x: number
  y: number
  width: number
  height: number
}

export interface Annotation {
  /** The element to mark, or a rectangle in CSS pixels of the viewport. */
  target: Locator | AnnotationRect
  /** The label, in the words of the manual - it is what the reader sees. */
  label: string
  /**
   * Centre of the label in CSS pixels of the viewport. Chosen per image: where
   * there is room for a word depends on the picture, and the arrow finds its
   * own way from there to the outline. A label placed inside its own outline
   * gets no arrow.
   */
  labelAt: { x: number; y: number }
  /**
   * `box` frames a region, `ellipse` circles a control. An ellipse that
   * enclosed a region as wide as the content area would reach past the window;
   * a box never does. Default: `ellipse`.
   */
  shape?: 'box' | 'ellipse'
  /**
   * Gap between target and outline in px. Negative values draw the outline
   * inside the target - for a region flush with the window edge, where there is
   * no room outside. Default: 10.
   */
  padding?: number
  /**
   * Sideways bend of the arrow as a fraction of its length, the sign picks the
   * side; 0 is a straight arrow. Default: 0.2.
   */
  bend?: number
}

export interface AnnotateOptions {
  /** Stroke width of outlines and arrows in px. Default: 6. */
  strokeWidth?: number
  /** Font size of the labels in px. Default: 34. */
  fontSize?: number
}

/** Marks the inserted overlay so that it can be removed again. */
const ANNOTATION_ID = 'qonnectra-docs-annotation'

/**
 * Pattern 3: outlines, arrows and labels in brand green, for orientation images
 * that name several parts of the interface at once (`login_navigation.jpg`).
 *
 * Drawn into an SVG above the page, like `spotlight()`, and for the same
 * reasons: nothing on the page is changed, and the capture stays what `shoot()`
 * makes of it. This used to be handwork in an image editor after publishing,
 * and the pipeline cannot keep that: the gate compares every published image
 * with the raw capture at zero tolerance, so an annotated file is always
 * "changed", and the first full run replaced the hand-drawn labels of
 * `login_navigation` with the raw capture. Everything in an image is drawn by
 * its spec now.
 *
 * The labels render in `system-ui`, which the capture image resolves to Noto
 * Sans - the font of the app itself, so the capture needs no font of its own.
 *
 * The targets are measured only once every transition on the page has finished
 * (`waitForAnimations()`), see `spotlight()`. The return value removes the
 * overlay again:
 *
 *   const off = await annotate(page, [{ target: bar, label: 'Navigationsleiste', labelAt: { x: 500, y: 980 } }])
 *   await shoot(page, '01-erste-schritte', 'login_navigation')
 *   await off()
 */
export async function annotate(
  page: Page,
  annotations: Annotation[],
  options: AnnotateOptions = {},
): Promise<() => Promise<void>> {
  const { strokeWidth = 6, fontSize = 34 } = options

  await waitForAnimations(page)

  const items: {
    rect: AnnotationRect
    label: string
    labelAt: { x: number; y: number }
    shape: 'box' | 'ellipse'
    padding: number
    bend: number
  }[] = []
  for (const annotation of annotations) {
    const { target, label, labelAt, shape = 'ellipse', padding = 10, bend = 0.2 } = annotation
    let rect: AnnotationRect
    if ('width' in target) {
      rect = target
    } else {
      await target.waitFor({ state: 'visible' })
      const box = await target.boundingBox()
      if (!box) {
        throw new Error(`Annotation "${label}": target is visible but has no extent in the viewport.`)
      }
      rect = box
    }
    items.push({ rect, label, labelAt, shape, padding, bend })
  }

  await page.evaluate(
    ({ items, strokeWidth, fontSize, color, overlayId }) => {
      document.getElementById(overlayId)?.remove()

      const NS = 'http://www.w3.org/2000/svg'
      const element = (tag: string, attributes: Record<string, string | number>): SVGElement => {
        const node = document.createElementNS(NS, tag)
        for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value))
        return node
      }

      const width = window.innerWidth
      const height = window.innerHeight
      const svg = element('svg', { id: overlayId, width, height, viewBox: `0 0 ${width} ${height}` })
      svg.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:2147483647'
      document.body.appendChild(svg)

      // The arrowhead, sized relative to the stroke. Its own stroke is off -
      // it would otherwise inherit the line's and come out fat.
      const defs = element('defs', {})
      const head = element('marker', {
        id: `${overlayId}-head`,
        viewBox: '0 0 10 10',
        refX: 7,
        refY: 5,
        markerWidth: 3.2,
        markerHeight: 3.2,
        orient: 'auto',
      })
      head.appendChild(element('path', { d: 'M0,0 L10,5 L0,10 Z', fill: color, stroke: 'none' }))
      defs.appendChild(head)
      svg.appendChild(defs)

      const line = {
        fill: 'none',
        stroke: color,
        'stroke-width': strokeWidth,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }
      const outlines = element('g', line)
      const arrows = element('g', { ...line, 'marker-end': `url(#${overlayId}-head)` })
      const labels = element('g', {})
      svg.append(outlines, arrows, labels)

      for (const item of items) {
        const { rect, padding } = item
        const cx = rect.x + rect.width / 2
        const cy = rect.y + rect.height / 2

        // Where a ray from the centre in direction (dx, dy) leaves the outline,
        // whether a point lies inside it, and the point of the outline an
        // arrow from (x, y) should aim at.
        let edge: (dx: number, dy: number) => { x: number; y: number }
        let contains: (x: number, y: number) => boolean
        let aim: (x: number, y: number) => { x: number; y: number }
        if (item.shape === 'ellipse') {
          // Half sizes times the square root of two would pass exactly through
          // the corners of the box; a little less keeps a flat control from
          // getting a loose ring around it.
          const rx = (rect.width / 2) * 1.25 + padding
          const ry = (rect.height / 2) * 1.25 + padding
          outlines.appendChild(element('ellipse', { cx, cy, rx, ry }))
          edge = (dx, dy) => {
            const t = 1 / Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry))
            return { x: cx + dx * t, y: cy + dy * t }
          }
          contains = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1
          // A control is small and its label close by: aiming at the centre
          // is as good as the nearest point and far simpler for an ellipse.
          aim = (x, y) => {
            const length = Math.hypot(cx - x, cy - y)
            return edge((x - cx) / length, (y - cy) / length)
          }
        } else {
          const x = rect.x - padding
          const y = rect.y - padding
          const w = rect.width + padding * 2
          const h = rect.height + padding * 2
          outlines.appendChild(element('rect', { x, y, width: w, height: h, rx: 14 }))
          edge = (dx, dy) => {
            const t = Math.min(dx ? w / 2 / Math.abs(dx) : Infinity, dy ? h / 2 / Math.abs(dy) : Infinity)
            return { x: cx + dx * t, y: cy + dy * t }
          }
          contains = (px, py) => px >= x && px <= x + w && py >= y && py <= y + h
          // The nearest point of the frame. Aiming at the centre of a region
          // as tall as the navigation bar sends the arrow diagonally across
          // whatever lies between; the nearest point keeps it short and
          // straight.
          aim = (px, py) => ({ x: Math.min(Math.max(px, x), x + w), y: Math.min(Math.max(py, y), y + h) })
        }

        // The label sits on a white chip, so it reads wherever there is room.
        const text = element('text', {
          x: item.labelAt.x,
          y: item.labelAt.y,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          fill: color,
          style: `font: 700 ${fontSize}px system-ui, sans-serif`,
        }) as SVGTextElement
        text.textContent = item.label
        labels.appendChild(text)
        const box = text.getBBox()
        const pad = fontSize * 0.35
        const chip = {
          x: box.x - pad,
          y: box.y - pad * 0.6,
          width: box.width + pad * 2,
          height: box.height + pad * 1.2,
        }
        labels.insertBefore(
          element('rect', { ...chip, rx: 10, fill: '#fff', 'fill-opacity': 0.92 }),
          text,
        )

        // The arrow leaves the chip on the side facing the point it aims at
        // and ends just short of the outline there.
        const lx = chip.x + chip.width / 2
        const ly = chip.y + chip.height / 2
        if (contains(lx, ly)) continue
        const hit = aim(lx, ly)
        const towardsX = hit.x - lx
        const towardsY = hit.y - ly
        const start =
          Math.abs(towardsY) * chip.width >= Math.abs(towardsX) * chip.height
            ? { x: lx, y: towardsY > 0 ? chip.y + chip.height + 4 : chip.y - 4 }
            : { x: towardsX > 0 ? chip.x + chip.width + 4 : chip.x - 4, y: ly }
        const length = Math.hypot(hit.x - start.x, hit.y - start.y)
        const ux = (hit.x - start.x) / length
        const uy = (hit.y - start.y) / length
        const gap = strokeWidth * 1.5
        const tip = { x: hit.x - ux * gap, y: hit.y - uy * gap }
        const span = Math.hypot(tip.x - start.x, tip.y - start.y)
        const control = {
          x: (start.x + tip.x) / 2 - uy * item.bend * span,
          y: (start.y + tip.y) / 2 + ux * item.bend * span,
        }
        arrows.appendChild(
          element('path', { d: `M${start.x},${start.y} Q${control.x},${control.y} ${tip.x},${tip.y}` }),
        )
      }
    },
    { items, strokeWidth, fontSize, color: BRAND_GREEN, overlayId: ANNOTATION_ID },
  )

  return async () => {
    await page.evaluate((id) => document.getElementById(id)?.remove(), ANNOTATION_ID)
  }
}
