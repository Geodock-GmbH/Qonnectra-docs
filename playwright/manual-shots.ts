// Werkzeuge für Handbuch-Screenshots. Setzt die in CLAUDE.md beschriebene
// Bildsprache um, soweit sie sich reproduzierbar automatisieren lässt:
//
//   Muster 1  Übersichtsbild, unbearbeitet   -> page.screenshot()
//   Muster 2  Dim + Spotlight                -> spotlight()
//   Muster 3  handgezeichnete Markierung     -> bleibt Nachbearbeitung
//   Muster 4  Composite-Raster 2 × 2         -> composite2x2()
//
// Ausgabe immer als PNG nach tests/screenshots/<kapitel>/<name>.png. Die
// Umwandlung nach JPEG und das Kopieren nach public/images/ passiert bewusst
// von Hand (siehe CLAUDE.md).
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

import type { Locator, Page } from '@playwright/test'

/** Marken-Grün, u. a. für die Ziffern im Composite-Raster. */
export const MARKENGRUEN = '#11ba81'

const SHOT_ROOT = 'tests/screenshots'

/** Pfad für ein Kapitelbild, z. B. shotPath('05-karte', 'map') */
export function shotPath(kapitel: string, name: string): string {
  const path = join(SHOT_ROOT, kapitel, `${name}.png`)
  mkdirSync(dirname(path), { recursive: true })
  return path
}

/**
 * Blendet alle CSS-Animationen und -Übergänge aus und stoppt den blinkenden
 * Text-Cursor. Ohne das erwischt ein Screenshot je nach Timing eine halb
 * ausgefahrene Info-Box oder ein halb geöffnetes Menü.
 */
export async function animationenAus(page: Page): Promise<void> {
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
 * Hält den Mauszeiger aus dem Bild. Playwright zeichnet den Zeiger selbst
 * nicht mit, aber Hover-Zustände (hervorgehobene Buttons, Tooltips) landen
 * sonst ungewollt im Screenshot.
 */
export async function zeigerWeg(page: Page): Promise<void> {
  const size = page.viewportSize()
  await page.mouse.move(size ? size.width - 1 : 1791, size ? size.height - 1 : 1119)
}

export interface SpotlightOptions {
  /** Deckkraft des grauen Schleiers über dem Rest der Oberfläche. */
  dim?: number
  /** Eckenradius der Aussparung in px. Gilt nur für Element-Ziele. */
  radius?: number
  /** Abstand zwischen Zielelement und Kontur in px. Gilt nur für Element-Ziele. */
  padding?: number
  /** Strichstärke der weißen Kontur in px. */
  konturStaerke?: number
}

/**
 * Freie Ellipse als Spotlight-Ziel, in CSS-Pixeln des Viewports.
 *
 * Für alles, was kein eigenes Element hat: Trassen, Adressen und Netzknoten
 * zeichnet die Karte ins Canvas, einen Locator gibt es dafür nicht. `padding`
 * und `radius` aus den Optionen greifen hier nicht – Lage und Größe stehen
 * schon in der Ellipse.
 */
export interface SpotlightEllipse {
  /** Mittelpunkt im Viewport. */
  x: number
  y: number
  /** Halbachse längs bzw. quer zur Drehachse. */
  rx: number
  ry: number
  /** Drehung um den Mittelpunkt in Grad, für schräg liegende Objekte. */
  drehung?: number
}

/** Ein Spotlight kann mehrere Stellen gleichzeitig freistellen. */
export type SpotlightZiel = Locator | SpotlightEllipse

/** Kennzeichnet die eingefügte Überlagerung, damit sie wieder entfernbar ist. */
const SPOTLIGHT_ID = 'qonnectra-doku-spotlight'

function istEllipse(ziel: SpotlightZiel): ziel is SpotlightEllipse {
  return 'rx' in ziel
}

/** Abgerundetes Rechteck um ein Element, als SVG-Pfad. */
function rechteckPfad(
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
 * Ellipse als SVG-Pfad aus zwei Halbbögen. Die Drehung steckt in der
 * `x-axis-rotation` der Bögen und nicht in einem `transform` – nur so lässt
 * sich der Pfad mit den Rechtecken in einem gemeinsamen `d` kombinieren, und
 * genau das macht die Aussparung per `fill-rule: evenodd` möglich.
 */
function ellipsenPfad({ x, y, rx, ry, drehung = 0 }: SpotlightEllipse): string {
  const bogenmass = (drehung * Math.PI) / 180
  const dx = rx * Math.cos(bogenmass)
  const dy = rx * Math.sin(bogenmass)

  return (
    `M${x - dx},${y - dy} A${rx},${ry} ${drehung} 0 1 ${x + dx},${y + dy} ` +
    `A${rx},${ry} ${drehung} 0 1 ${x - dx},${y - dy} Z`
  )
}

/**
 * Muster 2: dunkelt die gesamte Oberfläche ab und lässt nur `ziel` in voller
 * Helligkeit mit weißer, abgerundeter Kontur stehen.
 *
 * `ziel` darf ein Element, eine Ellipse oder eine Liste aus beidem sein.
 * Mehrere Ziele gleichzeitig braucht z. B. das ausgewählte Kartenobjekt: das
 * Objekt selbst liegt im Canvas, seine Werte stehen in der Info-Box am rechten
 * Rand – beide Stellen gehören ins Bild, alles dazwischen nicht.
 *
 * Umgesetzt als eigenes SVG über der Seite, mit einer Aussparung je Ziel
 * (`fill-rule: evenodd`). An den Zielelementen und an ihren Vorfahren wird
 * bewusst **nichts** verändert. Der naheliegende Weg über
 * `box-shadow: 0 0 0 9999px` am Zielelement funktioniert hier nicht:
 *
 * - Der Schatten endet am nächsten Vorfahren mit `overflow != visible`. Beim
 *   Transparenz-Regler blieb dadurch nur die weiße Kontur übrig, der Schleier
 *   war komplett weggeschnitten.
 * - Macht man die Vorfahren durchlässig, um das zu umgehen, verliert die
 *   Kartenansicht (OpenLayers) beim Reflow ihren Canvas-Inhalt und die Karte
 *   ist im Screenshot leer.
 *
 * Rückgabewert entfernt die Überlagerung wieder:
 *
 *   const aus = await spotlight(page, legende)
 *   await page.screenshot({ path: shotPath('05-karte', 'map_legend') })
 *   await aus()
 */
export async function spotlight(
  page: Page,
  ziel: SpotlightZiel | SpotlightZiel[],
  options: SpotlightOptions = {},
): Promise<() => Promise<void>> {
  const { dim = 0.5, radius = 8, padding = 6, konturStaerke = 3 } = options

  const pfade: string[] = []
  for (const einzelziel of Array.isArray(ziel) ? ziel : [ziel]) {
    if (istEllipse(einzelziel)) {
      pfade.push(ellipsenPfad(einzelziel))
      continue
    }

    await einzelziel.waitFor({ state: 'visible' })
    const rect = await einzelziel.boundingBox()
    if (!rect) {
      throw new Error('Spotlight: Ziel ist sichtbar, hat aber keine Ausdehnung im Viewport.')
    }
    pfade.push(rechteckPfad(rect, padding, radius))
  }

  await page.evaluate(
    ({ pfade, dim, konturStaerke, overlayId }) => {
      document.getElementById(overlayId)?.remove()

      const breite = window.innerWidth
      const hoehe = window.innerHeight
      const loecher = pfade.join(' ')

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.id = overlayId
      svg.setAttribute('width', String(breite))
      svg.setAttribute('height', String(hoehe))
      svg.setAttribute('viewBox', `0 0 ${breite} ${hoehe}`)
      svg.style.cssText =
        'position:fixed;top:0;left:0;pointer-events:none;z-index:2147483647'

      // Die Ziele sind weitere Teilpfade im vollflächigen Rechteck; mit evenodd
      // werden daraus die Aussparungen im Schleier.
      const schleier = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      schleier.setAttribute('d', `M0,0 H${breite} V${hoehe} H0 Z ${loecher}`)
      schleier.setAttribute('fill', `rgba(0, 0, 0, ${dim})`)
      schleier.setAttribute('fill-rule', 'evenodd')
      svg.appendChild(schleier)

      const kontur = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      kontur.setAttribute('d', loecher)
      kontur.setAttribute('fill', 'none')
      kontur.setAttribute('stroke', '#fff')
      kontur.setAttribute('stroke-width', String(konturStaerke))
      svg.appendChild(kontur)

      document.body.appendChild(svg)
    },
    { pfade, dim, konturStaerke, overlayId: SPOTLIGHT_ID },
  )

  return async () => {
    await page.evaluate((id) => document.getElementById(id)?.remove(), SPOTLIGHT_ID)
  }
}

export interface Composite2x2Options {
  /**
   * Beschriftung je Kachel, im Original handschriftlich wirkende grüne
   * Ziffern. `null` lässt eine Kachel unbeschriftet. Ein Eintrag darf auch
   * mehrere Schritte zusammenfassen („1, 2, 3“), wenn eine Kachel mehrere
   * Schritte der nummerierten Liste im Text abdeckt.
   *
   * Default: „1“ bis „4“. Für ein Raster ganz ohne Ziffern
   * `labels: [null, null, null, null]`.
   */
  labels?: (string | null)[]
}

/**
 * Muster 4: setzt vier Screenshots zu einem 2 × 2-Raster mit weißen Fugen
 * zusammen und beschriftet sie unten rechts in Marken-Grün.
 *
 * Die Montage passiert im Browser (eine leere Seite mit CSS-Grid), damit das
 * Repo ohne zusätzliche Bildbibliothek auskommt.
 */
export async function composite2x2(
  page: Page,
  bilder: Buffer[],
  zielPfad: string,
  options: Composite2x2Options = {},
): Promise<void> {
  if (bilder.length !== 4) {
    throw new Error(`Composite-Raster erwartet genau 4 Bilder, bekommen: ${bilder.length}`)
  }

  const { labels = ['1', '2', '3', '4'] } = options

  const kacheln = bilder
    .map((bild, index) => {
      const quelle = `data:image/png;base64,${bild.toString('base64')}`
      const label = labels[index]
      const ziffer = label ? `<span class="ziffer">${label}</span>` : ''
      return `<figure class="kachel"><img src="${quelle}" alt="">${ziffer}</figure>`
    })
    .join('\n')

  const montage = await page.context().newPage()
  try {
    await montage.setContent(
      `<!doctype html>
      <html lang="de">
      <head><meta charset="utf-8"><style>
        html, body { margin: 0; background: #fff; }
        #raster {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          padding: 16px;
          background: #fff;
          width: max-content;
        }
        .kachel { position: relative; margin: 0; line-height: 0; }
        .kachel img { display: block; width: 640px; height: auto; }
        .ziffer {
          position: absolute;
          right: 16px;
          bottom: 12px;
          font: 700 56px/1 "DejaVu Sans", system-ui, sans-serif;
          white-space: nowrap;
          color: ${MARKENGRUEN};
          -webkit-text-stroke: 3px #fff;
          paint-order: stroke fill;
        }
      </style></head>
      <body><div id="raster">${kacheln}</div></body>
      </html>`,
      { waitUntil: 'load' },
    )

    // Erst schießen, wenn alle vier Bilder tatsächlich dekodiert sind.
    await montage.evaluate(() =>
      Promise.all(
        Array.from(document.images).map((img) => (img.complete ? undefined : img.decode())),
      ),
    )

    await montage.locator('#raster').screenshot({ path: zielPfad })
  } finally {
    await montage.close()
  }
}
