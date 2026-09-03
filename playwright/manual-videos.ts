// Werkzeuge für Handbuch-Videos. Gegenstück zu playwright/manual-shots.ts:
// dort die Standbilder, hier die kurzen Interaktionsaufnahmen aus
// public/videos/.
//
// Ein Handbuch-Video entsteht in drei Schritten:
//
//   1. Playwright nimmt die ganze Lebenszeit der Seite auf
//      (test.use({ video: { mode: 'on', size: … } })).
//   2. Die Spec führt den Ablauf mit sichtbarem Mauszeiger vor
//      (mauszeigerAn(), zeigeAuf(), klicke(), tippe()).
//   3. videoNachbearbeiten() schneidet den Seitenaufbau ab, beschneidet das
//      Bild auf den beschriebenen Bereich und kodiert neu.
//
// Warum überhaupt beschneiden: Das Handbuch rendert Videos mit der Breite des
// Textbereichs (rund 690 px). Die volle Oberfläche mit 1792 CSS-Pixeln Breite
// landet damit bei 38 % – Beschriftungen der App wären keine 7 px hoch und
// nicht mehr lesbar. Ein Ausschnitt von rund 1000 CSS-Pixeln Breite trifft die
// Größe der bestehenden Videos (map_attachment.webm: 1849 × 1277 Bildpunkte
// für einen Ausschnitt von etwa 924 × 638 CSS-Pixeln) und bleibt lesbar.
// Maßgeblich ist allein die **Breite** des Ausschnitts – die Höhe ändert den
// Maßstab im Handbuch nicht.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

import type { Locator, Page } from '@playwright/test'

const VIDEO_ROOT = 'tests/videos'

/** Pfad für ein Kapitelvideo, z. B. videoPfad('05-karte', 'map_attachment') */
export function videoPfad(kapitel: string, name: string): string {
  const pfad = join(VIDEO_ROOT, kapitel, `${name}.webm`)
  mkdirSync(dirname(pfad), { recursive: true })
  return pfad
}

// ---------------------------------------------------------------------------
// Mauszeiger
// ---------------------------------------------------------------------------

/**
 * Screenshots zeigen bewusst keinen Mauszeiger (siehe zeigerWeg() in
 * manual-shots.ts). In einem Video ist er dagegen nötig: Ohne ihn erscheinen
 * die Schaltflächen einer Dateizeile, die erst beim Zeigen sichtbar werden,
 * ohne erkennbaren Grund. Die bestehenden Videos des Handbuchs sind
 * Bildschirmaufnahmen und zeigen deshalb einen echten Zeiger.
 *
 * Playwright zeichnet den Zeiger nicht mit, also wird er in die Seite gelegt:
 * ein Element, das auf jedes mousemove springt. Die Form richtet sich nach der
 * CSS-Eigenschaft `cursor` des Elements unter dem Zeiger, damit Zeigefinger
 * (Schaltflächen) und Breitenpfeil (Griff der Info-Box) so aussehen wie im
 * Betriebssystem.
 */
const ZEIGER_ID = 'qonnectra-doku-zeiger'

export async function mauszeigerAn(page: Page): Promise<void> {
  await page.evaluate((id) => {
    document.getElementById(id)?.remove()

    // Pfade in einem 24 × 24-Feld, Spitze bzw. Mittelpunkt bei (0,0) bzw. (12,12).
    const formen: Record<string, { d: string; ax: number; ay: number }> = {
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

    const zeiger = document.createElement('div')
    zeiger.id = id
    // Bewusst über left/top statt transform und ohne will-change: Beides
    // schöbe den Zeiger auf eine eigene Compositor-Ebene. Die wird auch dann
    // noch aktuell gezeichnet, wenn das Rastern des übrigen Inhalts hinterher
    // hinkt – im Video zöge der Zeiger der Kante der Info-Box dann um gut
    // 180 px voraus, obwohl die App denselben Ereignissen folgt.
    zeiger.style.cssText =
      'position:fixed;top:-100px;left:-100px;width:24px;height:24px;' +
      'pointer-events:none;z-index:2147483647'
    zeiger.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24">' +
      '<path id="' + id + '-pfad" fill="#fff" stroke="#111" stroke-width="1.4" ' +
      'stroke-linejoin="round" d="' + formen.default.d + '"/></svg>'
    document.body.appendChild(zeiger)

    const pfad = zeiger.querySelector('path') as SVGPathElement
    let aktuelleForm = 'default'
    let gedrueckt = false

    const bewege = (x: number, y: number) => {
      // Form nach dem Element unter dem Zeiger wählen. Der Zeiger selbst ist
      // pointer-events:none und taucht dabei nicht auf. Während die Taste
      // gedrückt ist, bleibt die Form stehen – so hält es das Betriebssystem
      // beim Ziehen auch.
      if (!gedrueckt) {
        const unten = document.elementFromPoint(x, y)
        const css = unten ? getComputedStyle(unten).cursor : 'default'
        const form = css in formen ? css : 'default'
        if (form !== aktuelleForm) {
          pfad.setAttribute('d', formen[form].d)
          aktuelleForm = form
        }
      }
      const { ax, ay } = formen[aktuelleForm]
      zeiger.style.left = `${x - ax}px`
      zeiger.style.top = `${y - ay}px`
    }

    // Sowohl mousemove als auch pointermove: Der Griff der Info-Box ruft in
    // seinem pointerdown-Handler preventDefault() auf, und danach liefert
    // Chromium für diesen Zeiger keine mouse-Ereignisse mehr. Ohne
    // pointermove bliebe der Zeiger beim Breiterziehen stehen, während sich
    // die Info-Box unter ihm bewegt.
    for (const art of ['mousemove', 'pointermove']) {
      window.addEventListener(art, (e) => bewege((e as MouseEvent).clientX, (e as MouseEvent).clientY), true)
    }
    // Beim Klicken kurz einstauchen, damit der Klick im Video zu sehen ist.
    window.addEventListener(
      'pointerdown',
      () => {
        gedrueckt = true
        zeiger.style.scale = '0.82'
      },
      true,
    )
    window.addEventListener(
      'pointerup',
      () => {
        gedrueckt = false
        zeiger.style.scale = '1'
      },
      true,
    )
  }, ZEIGER_ID)
}

/** Zuletzt angefahrene Position je Seite – Ausgangspunkt der nächsten Fahrt. */
const zeigerPosition = new WeakMap<Page, { x: number; y: number }>()

export interface FahrtOptions {
  /** Dauer der Zeigerfahrt in Millisekunden. */
  dauer?: number
  /** Punkt innerhalb des Ziels, 0–1 je Achse. Vorgabe: Mitte. */
  anteil?: { x?: number; y?: number }
}

/** Zielpunkt in Fensterkoordinaten auflösen. */
async function zielPunkt(
  ziel: Locator | { x: number; y: number },
  anteil: { x?: number; y?: number } = {},
): Promise<{ x: number; y: number }> {
  if ('x' in ziel && typeof ziel.x === 'number') return ziel as { x: number; y: number }

  const locator = ziel as Locator
  await locator.waitFor({ state: 'visible' })
  const box = await locator.boundingBox()
  if (!box) throw new Error('Ziel hat keine Ausdehnung – ist es sichtbar?')
  return {
    x: box.x + box.width * (anteil.x ?? 0.5),
    y: box.y + box.height * (anteil.y ?? 0.5),
  }
}

/**
 * Fährt den Zeiger weich auf ein Ziel. Bewusst nicht page.mouse.move() mit
 * `steps`: das verschickt alle Zwischenschritte ohne Pause, im Video springt
 * der Zeiger dann. Hier liegt zwischen den Schritten echte Zeit, und die
 * Geschwindigkeit folgt einer Sinuskurve (langsam an, langsam ab).
 */
export async function zeigeAuf(
  page: Page,
  ziel: Locator | { x: number; y: number },
  options: FahrtOptions = {},
): Promise<{ x: number; y: number }> {
  const { dauer = 600, anteil } = options
  const bis = await zielPunkt(ziel, anteil)
  const von = zeigerPosition.get(page) ?? { x: bis.x, y: bis.y + 240 }

  const schritte = Math.max(4, Math.round(dauer / 20))
  for (let i = 1; i <= schritte; i++) {
    const t = i / schritte
    const weich = 0.5 - Math.cos(Math.PI * t) / 2
    await page.mouse.move(von.x + (bis.x - von.x) * weich, von.y + (bis.y - von.y) * weich)
    await page.waitForTimeout(dauer / schritte)
  }

  zeigerPosition.set(page, bis)
  return bis
}

/** Fährt auf das Ziel und klickt es – mit sichtbarer Druckphase. */
export async function klicke(
  page: Page,
  ziel: Locator | { x: number; y: number },
  options: FahrtOptions = {},
): Promise<void> {
  await zeigeAuf(page, ziel, options)
  await page.waitForTimeout(180)
  await page.mouse.down()
  await page.waitForTimeout(110)
  await page.mouse.up()
}

/**
 * Zieht mit gedrückter Maustaste von der aktuellen Zeigerposition um `dx`/`dy`.
 * Für den Griff der Info-Box; der Ablauf ist derselbe wie beim Fahren, nur
 * mit gedrückter Taste.
 */
export async function ziehe(
  page: Page,
  dx: number,
  dy = 0,
  options: { dauer?: number } = {},
): Promise<void> {
  const { dauer = 1200 } = options
  const von = zeigerPosition.get(page)
  if (!von) throw new Error('ziehe() braucht eine Zeigerposition – vorher zeigeAuf() aufrufen.')

  await page.mouse.down()
  await page.waitForTimeout(200)

  // Deutlich größere Schrittweite als beim reinen Fahren (90 statt 20 ms).
  // Am Griff der Info-Box hängt die Breite der Karte: OpenLayers zeichnet bei
  // jeder Änderung neu, gemessen rund 70 ms je Schritt. Kommen die Ereignisse
  // dichter, staut sich die Darstellung auf und die Info-Box läuft dem Zeiger
  // im Video sichtbar hinterher (bei 20 ms waren es über 500 ms Rückstand).
  const schritte = Math.max(6, Math.round(dauer / 90))
  for (let i = 1; i <= schritte; i++) {
    const t = i / schritte
    const weich = 0.5 - Math.cos(Math.PI * t) / 2
    await page.mouse.move(von.x + dx * weich, von.y + dy * weich)
    await page.waitForTimeout(dauer / schritte)
  }

  await page.waitForTimeout(150)
  await page.mouse.up()
  zeigerPosition.set(page, { x: von.x + dx, y: von.y + dy })
}

/** Tippt in Handgeschwindigkeit, damit der Text im Video mitlesbar ist. */
export async function tippe(page: Page, text: string, verzoegerung = 55): Promise<void> {
  await page.keyboard.type(text, { delay: verzoegerung })
}

// ---------------------------------------------------------------------------
// Nachbearbeitung
// ---------------------------------------------------------------------------

/**
 * ffmpeg, das Playwright ohnehin mitbringt (`playwright install` lädt es neben
 * den Browsern). Damit braucht das Repo kein zusätzliches Werkzeug auf dem
 * Rechner. Der Build kann nur, was Playwright dafür braucht – Matroska lesen,
 * VP8 dekodieren und kodieren, WebM schreiben, crop/scale/pad. Genau das wird
 * hier gebraucht.
 */
export function ffmpegPfad(): string {
  const basis =
    process.env.PLAYWRIGHT_BROWSERS_PATH || join(homedir(), '.cache', 'ms-playwright')
  const datei =
    process.platform === 'win32'
      ? 'ffmpeg-win64.exe'
      : process.platform === 'darwin'
        ? 'ffmpeg-mac'
        : 'ffmpeg-linux'

  const ordner = existsSync(basis)
    ? readdirSync(basis)
        .filter((name) => name.startsWith('ffmpeg-'))
        .sort((a, b) => Number(b.slice(7)) - Number(a.slice(7)))
    : []

  for (const name of ordner) {
    const pfad = join(basis, name, datei)
    if (existsSync(pfad)) return pfad
  }

  throw new Error(
    `Das von Playwright mitgelieferte ffmpeg fehlt (gesucht in ${basis}/ffmpeg-*/${datei}).\n` +
      'Nachinstallieren mit:\n  pnpm exec playwright install',
  )
}

export interface Ausschnitt {
  /** Linke obere Ecke in CSS-Pixeln des Fensters. */
  x: number
  y: number
  /** Größe in CSS-Pixeln. */
  breite: number
  hoehe: number
}

export interface NachbearbeitungOptions {
  /** Rohaufnahme aus Playwright. */
  quelle: string
  /** Fertiges Video. */
  ziel: string
  /** Ausschnitt in CSS-Pixeln (siehe Kopf dieser Datei). */
  ausschnitt: Ausschnitt
  /**
   * Verhältnis von Bildpunkten der Aufnahme zu CSS-Pixeln.
   *
   * Vorgabe 1 – und dabei bleibt es: Chromiums Screencast, aus dem Playwright
   * das Video baut, liefert Bilder in CSS-Pixeln, nicht in Gerätepunkten. Der
   * deviceScaleFactor von 2 aus playwright.config.ts wirkt sich auf die
   * Aufnahme also **nicht** aus. Eine größere Aufnahmegröße hilft nicht:
   * Playwright verkleinert nur, wenn nötig, und füllt den Rest grau auf
   * (nachgemessen mit size: 3584 × 2240 – das Bild lag im linken oberen
   * Viertel). Deshalb entspricht die Aufnahmegröße dem Viewport.
   */
  skalierung?: number
  /** Sekunden, die am Anfang wegfallen (Seitenaufbau). */
  ab?: number
  /** Qualität von libvpx (0–63, kleiner = besser). */
  qualitaet?: number
}

/**
 * Schneidet den Seitenaufbau ab, beschneidet auf den Ausschnitt und kodiert
 * neu. Ohne Skalierung: der Ausschnitt behält die Bildpunkte der Aufnahme,
 * damit nichts unnötig weichgerechnet wird.
 */
export function videoNachbearbeiten(options: NachbearbeitungOptions): void {
  const { quelle, ziel, ausschnitt, skalierung = 1, ab = 0, qualitaet = 32 } = options

  // libvpx verlangt gerade Kantenlängen.
  const gerade = (wert: number) => Math.round(wert / 2) * 2
  const w = gerade(ausschnitt.breite * skalierung)
  const h = gerade(ausschnitt.hoehe * skalierung)
  const x = gerade(ausschnitt.x * skalierung)
  const y = gerade(ausschnitt.y * skalierung)

  mkdirSync(dirname(ziel), { recursive: true })

  execFileSync(
    ffmpegPfad(),
    [
      '-y',
      '-loglevel', 'error',
      '-i', quelle,
      // -ss bewusst **nach** -i: davor spult ffmpeg nur bis zum letzten
      // Schlüsselbild, und Playwrights VP8-Aufnahme setzt Schlüsselbilder in
      // großem Abstand – der Seitenaufbau bliebe dann sichtbar. Hinter -i wird
      // dekodiert und bildgenau verworfen; bei Videos dieser Länge egal.
      ...(ab > 0 ? ['-ss', ab.toFixed(3)] : []),
      '-vf', `crop=${w}:${h}:${x}:${y}`,
      '-c:v', 'libvpx',
      '-crf', String(qualitaet),
      // Bei libvpx ist -crf nur zusammen mit -b:v 0 eine reine Qualitätsvorgabe.
      '-b:v', '0',
      '-an',
      ziel,
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  )
}
