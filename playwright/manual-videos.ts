// Tools for manual videos. Counterpart to playwright/manual-shots.ts: still
// images there, the short interaction recordings from public/videos/ here.
//
// A manual video is produced in three steps:
//
//   1. Playwright records the entire lifetime of the page
//      (test.use({ video: { mode: 'on', size: ... } })).
//   2. The spec performs the flow with a visible mouse cursor
//      (showCursor(), pointAt(), click(), typeText()).
//   3. postProcessVideo() cuts off the page load, crops the picture to the
//      described area and re-encodes.
//
// Why crop at all: the manual renders videos at the width of the text column
// (around 690 px). The full interface at 1792 CSS pixels wide would end up at
// 38 % - labels in the app would be less than 7 px high and no longer legible.
// A crop of around 1000 CSS pixels wide matches the size of the existing videos
// (map_attachment.webm: 1849 x 1277 pixels for a crop of about 924 x 638 CSS
// pixels) and stays legible. Only the **width** of the crop matters - the
// height does not change the scale in the manual.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

import type { Locator, Page } from '@playwright/test'

const VIDEO_ROOT = 'tests/videos'

/** Path for a chapter video, e.g. videoPath('05-karte', 'map_attachment') */
export function videoPath(chapter: string, name: string): string {
  const path = join(VIDEO_ROOT, chapter, `${name}.webm`)
  mkdirSync(dirname(path), { recursive: true })
  return path
}

// ---------------------------------------------------------------------------
// Mouse cursor
// ---------------------------------------------------------------------------

/**
 * Screenshots deliberately show no mouse cursor (see moveCursorAway() in
 * manual-shots.ts). In a video it is required though: without it the buttons of
 * a file row, which only appear on hover, show up for no visible reason. The
 * existing videos in the manual are screen recordings and therefore show a real
 * cursor.
 *
 * Playwright does not record the cursor, so it gets placed into the page: an
 * element that jumps to every mousemove. The shape follows the CSS `cursor`
 * property of the element underneath, so that the pointing hand (buttons) and
 * the resize arrow (handle of the info box) look like they do in the operating
 * system.
 */
const CURSOR_ID = 'qonnectra-docs-cursor'

export async function showCursor(page: Page): Promise<void> {
  await page.evaluate((id) => {
    document.getElementById(id)?.remove()

    // Paths in a 24 x 24 box, tip resp. centre at (0,0) resp. (12,12).
    const shapes: Record<string, { d: string; ax: number; ay: number }> = {
      default: { d: 'M1,1 L1,20 L6,15.5 L9,22.5 L12.5,21 L9.5,14 L16,14 Z', ax: 0, ay: 0 },
      pointer: {
        d:
          'M9,2.5 a1.6,1.6 0 0 1 3.2,0 v6.2 a1.4,1.4 0 0 1 2.6,0.7 v0.6 ' +
          'a1.4,1.4 0 0 1 2.6,0.7 v0.6 a1.4,1.4 0 0 1 2.4,1 v3.2 ' +
          'c0,3.4 -2.4,6.5 -6,6.5 h-2.6 c-2.2,0 -3.6,-1 -4.8,-2.6 ' +
          'L3,14.4 a1.5,1.5 0 0 1 2.2,-2 L7.6,14.4 V4 a1.4,1.4 0 0 1 1.4,-1.5 Z',
        ax: 8,
        ay: 1,
      },
      'col-resize': {
        d: 'M6,12 L11,7.5 v3 h6 v-3 L22,12 L17,16.5 v-3 h-6 v3 Z',
        ax: 14,
        ay: 12,
      },
    }

    const cursor = document.createElement('div')
    cursor.id = id
    // Deliberately via left/top instead of transform and without will-change:
    // both would push the cursor onto its own compositor layer. That layer keeps
    // being painted up to date even when rasterising the remaining content lags
    // behind - in the video the cursor would then run a good 180 px ahead of the
    // edge of the info box, even though the app follows the very same events.
    cursor.style.cssText =
      'position:fixed;top:-100px;left:-100px;width:24px;height:24px;' +
      'pointer-events:none;z-index:2147483647'
    cursor.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24">' +
      '<path id="' + id + '-path" fill="#fff" stroke="#111" stroke-width="1.4" ' +
      'stroke-linejoin="round" d="' + shapes.default.d + '"/></svg>'
    document.body.appendChild(cursor)

    const path = cursor.querySelector('path') as SVGPathElement
    let currentShape = 'default'
    let pressed = false

    const move = (x: number, y: number) => {
      // Pick the shape from the element underneath the cursor. The cursor itself
      // is pointer-events:none and does not show up there. While the button is
      // held down the shape stays put - that is what the operating system does
      // while dragging, too.
      if (!pressed) {
        const below = document.elementFromPoint(x, y)
        const css = below ? getComputedStyle(below).cursor : 'default'
        const shape = css in shapes ? css : 'default'
        if (shape !== currentShape) {
          path.setAttribute('d', shapes[shape].d)
          currentShape = shape
        }
      }
      const { ax, ay } = shapes[currentShape]
      cursor.style.left = `${x - ax}px`
      cursor.style.top = `${y - ay}px`
    }

    // Both mousemove and pointermove: the handle of the info box calls
    // preventDefault() in its pointerdown handler, and after that Chromium sends
    // no more mouse events for this pointer. Without pointermove the cursor
    // would stand still while dragging, with the info box moving underneath it.
    for (const eventType of ['mousemove', 'pointermove']) {
      window.addEventListener(eventType, (e) => move((e as MouseEvent).clientX, (e as MouseEvent).clientY), true)
    }
    // Squash briefly on click so that the click is visible in the video.
    window.addEventListener(
      'pointerdown',
      () => {
        pressed = true
        cursor.style.scale = '0.82'
      },
      true,
    )
    window.addEventListener(
      'pointerup',
      () => {
        pressed = false
        cursor.style.scale = '1'
      },
      true,
    )
  }, CURSOR_ID)
}

/** Last position approached per page - starting point of the next motion. */
const cursorPosition = new WeakMap<Page, { x: number; y: number }>()

export interface MotionOptions {
  /** Duration of the cursor motion in milliseconds. */
  duration?: number
  /** Point inside the target, 0-1 per axis. Default: centre. */
  fraction?: { x?: number; y?: number }
}

/** Resolve the target point into window coordinates. */
async function targetPoint(
  target: Locator | { x: number; y: number },
  fraction: { x?: number; y?: number } = {},
): Promise<{ x: number; y: number }> {
  if ('x' in target && typeof target.x === 'number') return target as { x: number; y: number }

  const locator = target as Locator
  await locator.waitFor({ state: 'visible' })
  const box = await locator.boundingBox()
  if (!box) throw new Error('Target has no extent - is it visible?')
  return {
    x: box.x + box.width * (fraction.x ?? 0.5),
    y: box.y + box.height * (fraction.y ?? 0.5),
  }
}

/**
 * Moves the cursor smoothly onto a target. Deliberately not page.mouse.move()
 * with `steps`: that sends all intermediate steps without a pause, and the
 * cursor jumps in the video. Here there is real time between the steps, and the
 * speed follows a sine curve (slow in, slow out).
 */
export async function pointAt(
  page: Page,
  target: Locator | { x: number; y: number },
  options: MotionOptions = {},
): Promise<{ x: number; y: number }> {
  const { duration = 600, fraction } = options
  const to = await targetPoint(target, fraction)
  const from = cursorPosition.get(page) ?? { x: to.x, y: to.y + 240 }

  const steps = Math.max(4, Math.round(duration / 20))
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const eased = 0.5 - Math.cos(Math.PI * t) / 2
    await page.mouse.move(from.x + (to.x - from.x) * eased, from.y + (to.y - from.y) * eased)
    await page.waitForTimeout(duration / steps)
  }

  cursorPosition.set(page, to)
  return to
}

/** Moves onto the target and clicks it - with a visible press phase. */
export async function click(
  page: Page,
  target: Locator | { x: number; y: number },
  options: MotionOptions = {},
): Promise<void> {
  await pointAt(page, target, options)
  await page.waitForTimeout(180)
  await page.mouse.down()
  await page.waitForTimeout(110)
  await page.mouse.up()
}

/**
 * Drags with the mouse button held down from the current cursor position by
 * `dx`/`dy`. For the handle of the info box; the flow is the same as moving,
 * just with the button pressed.
 */
export async function drag(
  page: Page,
  dx: number,
  dy = 0,
  options: { duration?: number } = {},
): Promise<void> {
  const { duration = 1200 } = options
  const from = cursorPosition.get(page)
  if (!from) throw new Error('drag() needs a cursor position - call pointAt() first.')

  await page.mouse.down()
  await page.waitForTimeout(200)

  // Noticeably larger step size than for plain motion (90 instead of 20 ms).
  // The width of the map hangs off the handle of the info box: OpenLayers
  // repaints on every change, measured at around 70 ms per step. If the events
  // come in closer than that, the rendering piles up and the info box visibly
  // lags behind the cursor in the video (at 20 ms it was over 500 ms behind).
  const steps = Math.max(6, Math.round(duration / 90))
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const eased = 0.5 - Math.cos(Math.PI * t) / 2
    await page.mouse.move(from.x + dx * eased, from.y + dy * eased)
    await page.waitForTimeout(duration / steps)
  }

  await page.waitForTimeout(150)
  await page.mouse.up()
  cursorPosition.set(page, { x: from.x + dx, y: from.y + dy })
}

/** Types at hand speed so that the text can be read along in the video. */
export async function typeText(page: Page, text: string, delay = 55): Promise<void> {
  await page.keyboard.type(text, { delay })
}

// ---------------------------------------------------------------------------
// Post-processing
// ---------------------------------------------------------------------------

/**
 * The ffmpeg that Playwright ships anyway (`playwright install` downloads it
 * next to the browsers). That way the repo needs no additional tool on the
 * machine. The build can only do what Playwright needs it for - read Matroska,
 * decode and encode VP8, write WebM, crop/scale/pad. Which is exactly what is
 * needed here.
 */
export function ffmpegPath(): string {
  const base =
    process.env.PLAYWRIGHT_BROWSERS_PATH || join(homedir(), '.cache', 'ms-playwright')
  const file =
    process.platform === 'win32'
      ? 'ffmpeg-win64.exe'
      : process.platform === 'darwin'
        ? 'ffmpeg-mac'
        : 'ffmpeg-linux'

  const folders = existsSync(base)
    ? readdirSync(base)
        .filter((name) => name.startsWith('ffmpeg-'))
        .sort((a, b) => Number(b.slice(7)) - Number(a.slice(7)))
    : []

  for (const name of folders) {
    const path = join(base, name, file)
    if (existsSync(path)) return path
  }

  throw new Error(
    `The ffmpeg shipped with Playwright is missing (looked in ${base}/ffmpeg-*/${file}).\n` +
      'Install it with:\n  pnpm exec playwright install',
  )
}

export interface Crop {
  /** Top left corner in CSS pixels of the window. */
  x: number
  y: number
  /** Size in CSS pixels. */
  width: number
  height: number
}

export interface PostProcessOptions {
  /** Raw recording from Playwright. */
  source: string
  /** Finished video. */
  target: string
  /** Crop in CSS pixels (see the head of this file). */
  crop: Crop
  /**
   * Ratio of recorded pixels to CSS pixels.
   *
   * Default 1 - and it stays that way: Chromium's screencast, from which
   * Playwright builds the video, delivers frames in CSS pixels, not in device
   * pixels. The deviceScaleFactor of 2 from playwright.config.ts therefore does
   * **not** affect the recording. A larger recording size does not help:
   * Playwright only scales down when necessary and pads the rest with grey
   * (measured with size: 3584 x 2240 - the picture sat in the top left quarter).
   * That is why the recording size matches the viewport.
   */
  scale?: number
  /** Seconds dropped at the start (page load). */
  startAt?: number
  /** Quality of libvpx (0-63, smaller = better). */
  quality?: number
}

/**
 * Cuts off the page load, crops to the given region and re-encodes. Without
 * scaling: the crop keeps the pixels of the recording so that nothing is
 * needlessly blurred.
 */
export function postProcessVideo(options: PostProcessOptions): void {
  const { source, target, crop, scale = 1, startAt = 0, quality = 32 } = options

  // libvpx requires even edge lengths.
  const even = (value: number) => Math.round(value / 2) * 2
  const w = even(crop.width * scale)
  const h = even(crop.height * scale)
  const x = even(crop.x * scale)
  const y = even(crop.y * scale)

  mkdirSync(dirname(target), { recursive: true })

  execFileSync(
    ffmpegPath(),
    [
      '-y',
      '-loglevel', 'error',
      '-i', source,
      // -ss deliberately **after** -i: before it, ffmpeg only seeks to the last
      // keyframe, and Playwright's VP8 recording places keyframes far apart -
      // the page load would then stay visible. After -i the stream is decoded
      // and discarded frame-accurately; irrelevant for videos of this length.
      ...(startAt > 0 ? ['-ss', startAt.toFixed(3)] : []),
      '-vf', `crop=${w}:${h}:${x}:${y}`,
      '-c:v', 'libvpx',
      '-crf', String(quality),
      // With libvpx, -crf is only a pure quality target together with -b:v 0.
      '-b:v', '0',
      '-an',
      target,
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  )
}
