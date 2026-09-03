// Video für Kapitel „5. Karte" im Handbuch
// (manual/teil-a-anwenderhandbuch/05-karte.md), Abschnitt 5.3.1
// „Anhänge von Kartenobjekten".
//
// Eigene Datei, weil `test.use({ video: … })` nur auf Dateiebene erlaubt ist –
// in einer test.describe-Gruppe lehnt Playwright es ab („forces a new
// worker"). Die Standbilder des Kapitels stehen in tests/05-karte.spec.ts.
//
// Übernehmen nach public/videos/ mit: pnpm screenshots:publish 05-karte
import { expect, request, test } from '@playwright/test'

import { localApp, superuserZugang } from '../playwright/local-app'
import {
  klicke,
  mauszeigerAn,
  tippe,
  videoNachbearbeiten,
  videoPfad,
  zeigeAuf,
  ziehe,
} from '../playwright/manual-videos'

const KAPITEL = '05-karte'

// ---------------------------------------------------------------------------
// Video zu Abschnitt 5.3.1 „Anhänge von Kartenobjekten"
// ---------------------------------------------------------------------------
//
// Zeigt den Ablauf, den der Abschnitt beschreibt: Objekt anklicken, Reiter
// „Anhänge" öffnen, Info-Box breiter ziehen, Datei hochladen, Ordner
// aufklappen, Schaltflächen der Dateizeile zeigen und die Datei umbenennen.
//
// Bewusst **ohne** den Schritt „löschen": Das Aufnahmekonto gehört zur Gruppe
// „Editor" und die hat auf alle Fachmodelle die Zugriffsstufe „edit" – DELETE
// beantwortet die API mit 403 und die App zeigt eine Fehlermeldung. Ein Video
// davon wäre irreführend. Aufgeräumt wird deshalb über die API mit dem
// Superuser (siehe anhaengeAufraeumen()).

// Aufnahmegröße = Viewport aus playwright.config.ts. Ohne Angabe verkleinert
// Playwright das Video, bis es in 800 × 800 passt, und der Ausschnitt wäre
// unscharf. Größer als der Viewport bringt nichts: Chromiums Screencast
// liefert CSS-Pixel, der deviceScaleFactor von 2 wirkt hier nicht (siehe
// NachbearbeitungOptions.skalierung in playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/** Adresse „Nieharde 12" des Testprojekts, EPSG:3857. */
const HAUS = [1083847.2737702988, 7308943.7974595595]
const HAUS_TITEL = 'Nieharde 12, 24972 Sterup'
/** Ordner der Adresse im Medienpfad – daran erkennt das Aufräumen die Anhänge. */
const HAUS_ORDNER = 'addresses/Nieharde 12, 24972 Sterup/'

const VIDEO_ZOOM = 19

/**
 * Wo das Haus im Fenster liegen soll. Links von der breitgezogenen Info-Box
 * (deren linke Kante bei 800 px Breite auf x ≈ 976 liegt), damit es im Video
 * sichtbar bleibt, und weit genug rechts, um im Ausschnitt zu liegen.
 */
const HAUS_X = 870
const HAUS_Y = 430

/** Breite, auf die die Info-Box gezogen wird. */
const INFOBOX_BREITE = 800

/**
 * Kartenstreifen links der Info-Box, der im Ausschnitt bleibt. Mehr Breite
 * verkleinert im Handbuch alles andere (siehe Kopf von manual-videos.ts).
 */
const KARTENSTREIFEN = 200

/**
 * Höhe des Ausschnitts. Reicht von der Oberkante der Info-Box bis unter die
 * Dateiliste. Die Höhe ändert den Maßstab im Handbuch nicht – sie bestimmt
 * nur, wie viel zu sehen ist.
 */
const AUSSCHNITT_HOEHE = 720

/** Sekunden Standbild vor dem ersten Schritt. */
const VORLAUF = 1.0

const DATEI = 'scan_0001.pdf'
const NEUER_NAME = 'Bestandsplan_2026'

/**
 * Kleinstmögliche gültige PDF-Datei. Sie wird nur hochgeladen, nie geöffnet;
 * die App wählt Symbol und Ordner allein anhand der Endung. Deshalb liegt
 * hier eine erzeugte Datei statt einer Beispieldatei im Repo.
 */
const PDF = Buffer.from(
  '%PDF-1.4\n' +
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\n' +
    'trailer<</Root 1 0 R>>\n%%EOF\n',
  'latin1',
)

/**
 * Entfernt alle Anhänge der Adresse über die API – mit dem Superuser, weil
 * das Aufnahmekonto nicht löschen darf. Läuft vor **und** nach der Aufnahme:
 * davor, damit das Video mit „Keine Dateien hochgeladen" beginnt, danach,
 * damit der nächste Lauf dasselbe vorfindet.
 */
async function anhaengeAufraeumen() {
  const { apiUrl } = localApp()
  const { username, password } = superuserZugang()

  const api = await request.newContext({ baseURL: apiUrl, ignoreHTTPSErrors: true })
  try {
    const login = await api.post('/api/v1/auth/login/', { data: { username, password } })
    expect(
      login.ok(),
      'Anmeldung des Superusers zum Aufräumen fehlgeschlagen – ' +
        'DJANGO_SUPERUSER_* in local-app/deployment/.env prüfen.',
    ).toBe(true)

    const antwort = await api.get('/api/v1/feature-files/?page_size=200')
    const inhalt = await antwort.json()
    const dateien: Array<{ uuid: string; file_path: string }> = Array.isArray(inhalt)
      ? inhalt
      : (inhalt.results ?? [])

    for (const datei of dateien) {
      if (!decodeURIComponent(datei.file_path).includes(HAUS_ORDNER)) continue
      await api.delete(`/api/v1/feature-files/${datei.uuid}/`)
    }
  } finally {
    await api.dispose()
  }
}

test.beforeEach(anhaengeAufraeumen)
test.afterEach(anhaengeAufraeumen)

test('5.3.1 Anhänge hinzufügen und bearbeiten', async ({ page, context }) => {
  test.setTimeout(180_000)

  // 1. Aufwärmseite. Sie misst die Kartenfläche und füllt nebenbei den
  //    HTTP-Zwischenspeicher des Kontexts. Die eigentliche Aufnahmeseite
  //    steht dadurch nach Bruchteilen einer Sekunde – Playwright nimmt eine
  //    Seite ab ihrer Erzeugung auf, ein langer Seitenaufbau wäre im Video.
  await page.goto('/map')
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  const kartenFlaeche = (await page.locator('div.map').boundingBox())!
  await page.close()

  // 2. Kartenmitte so wählen, dass das Haus auf (HAUS_X, HAUS_Y) liegt.
  //    Auflösung der Kartenansicht in EPSG:3857 bei gegebenem Zoom.
  const aufloesung = 156543.03392804097 / 2 ** VIDEO_ZOOM
  const mitteX = kartenFlaeche.x + kartenFlaeche.width / 2
  const mitteY = kartenFlaeche.y + kartenFlaeche.height / 2
  const kartenMitte = [
    HAUS[0] - (HAUS_X - mitteX) * aufloesung,
    HAUS[1] + (HAUS_Y - mitteY) * aufloesung,
  ]

  const aufnahme = await context.newPage()
  const seitenStart = Date.now()

  await aufnahme.addInitScript(
    (a) => {
      localStorage.setItem('mapCenter', JSON.stringify(a.mitte))
      localStorage.setItem('mapZoom', JSON.stringify(a.zoom))
      // Die Info-Box beginnt in ihrer Voreinstellung; das Breiterziehen ist
      // Teil des Videos.
      localStorage.setItem('drawerWidth', '400')
    },
    { mitte: kartenMitte, zoom: VIDEO_ZOOM },
  )

  await aufnahme.goto('/map')
  await expect(aufnahme.locator('div.map canvas').first()).toBeVisible()
  await aufnahme.waitForLoadState('networkidle')
  // Die Kacheln kommen über einen Worker-Pool nach, den networkidle nicht sieht.
  await aufnahme.waitForTimeout(2500)
  await mauszeigerAn(aufnahme)

  const infobox = aufnahme.locator('[data-drawer]')

  // Ab hier läuft die Vorführung; alles davor schneidet
  // videoNachbearbeiten() weg.
  const vorfuehrungStart = Date.now()
  await aufnahme.waitForTimeout(VORLAUF * 1000)

  // 3. Objekt in der Karte auswählen.
  await klicke(aufnahme, { x: HAUS_X, y: HAUS_Y }, { dauer: 700 })
  await expect(aufnahme.locator('#drawer-title')).toHaveText(HAUS_TITEL)
  await aufnahme.waitForTimeout(1200)

  // 4. Reiter „Anhänge".
  await klicke(aufnahme, infobox.getByRole('tab', { name: 'Anhänge', exact: true }))
  await expect(infobox.getByText('Dateien hochladen')).toBeVisible()
  // Gegenprobe zum Aufräumen: Das Video soll mit einer leeren Liste beginnen.
  // Ohne das zeigt ein Lauf nach einem abgebrochenen Vorlauf „documents (2)".
  await expect(
    infobox.getByText('Keine Dateien hochgeladen'),
    'Die Adresse hat noch Anhänge – anhaengeAufraeumen() hat nicht gegriffen.',
  ).toBeVisible()
  await aufnahme.waitForTimeout(1400)

  // 5. Info-Box breiter ziehen. In der Voreinstellung von 400 px ist der
  //    Reiter zu schmal: Überschriften werden abgeschnitten und die
  //    Schaltflächen einer Dateizeile liegen außerhalb. Genau das beschreibt
  //    der Abschnitt („die Box am linken Rand breiter ziehen").
  const griff = aufnahme.getByRole('button', { name: 'Größe der Seitenleiste ändern' })
  await zeigeAuf(aufnahme, griff, { anteil: { y: 0.35 } })
  await aufnahme.waitForTimeout(400)
  const vorherBreite = (await infobox.boundingBox())!.width
  await ziehe(aufnahme, -(INFOBOX_BREITE - vorherBreite), 0, { dauer: 1400 })
  await aufnahme.waitForTimeout(1000)

  // 6. Datei hochladen. Der Klick auf „Dateien auswählen" öffnet den
  //    Dateidialog des Betriebssystems; Playwright fängt ihn ab, im Video
  //    erscheint die Datei direkt in der Auswahlliste.
  const dialog = aufnahme.waitForEvent('filechooser')
  await klicke(aufnahme, infobox.getByRole('button', { name: 'Dateien auswählen', exact: true }))
  await (await dialog).setFiles({ name: DATEI, mimeType: 'application/pdf', buffer: PDF })
  await aufnahme.waitForTimeout(1200)

  await klicke(aufnahme, infobox.getByRole('button', { name: /^Upload/ }))
  const ordner = infobox.getByText(/documents \(\d+\)/)
  await expect(ordner).toBeVisible({ timeout: 20_000 })
  await aufnahme.waitForTimeout(1200)

  // 7. Ordner aufklappen – erst dann werden die Dateien sichtbar.
  await klicke(aufnahme, ordner)
  const datei = infobox.getByText(DATEI, { exact: true })
  await expect(datei).toBeVisible()
  await aufnahme.waitForTimeout(1200)

  // 8. Auf die Zeile zeigen: erst dadurch erscheinen die drei
  //    Symbolschaltflächen.
  await zeigeAuf(aufnahme, datei)
  const herunterladen = infobox.getByLabel('Herunterladen', { exact: true })
  await expect(herunterladen).toBeVisible()
  await aufnahme.waitForTimeout(800)

  // 9. Auf die Schaltflächen zeigen, damit die Kurzhinweise erscheinen.
  await zeigeAuf(aufnahme, herunterladen, { dauer: 450 })
  await aufnahme.waitForTimeout(1400)

  const umbenennen = infobox.getByLabel('Umbenennen', { exact: true })
  await zeigeAuf(aufnahme, umbenennen, { dauer: 300 })
  await aufnahme.waitForTimeout(1200)

  // 10. Umbenennen.
  await klicke(aufnahme, umbenennen, { dauer: 120 })
  const eingabe = infobox.locator('input[type="text"]')
  await expect(eingabe).toBeVisible()
  await klicke(aufnahme, eingabe, { dauer: 300 })
  await aufnahme.keyboard.press('ControlOrMeta+a')
  await aufnahme.waitForTimeout(300)
  await tippe(aufnahme, NEUER_NAME)
  await aufnahme.waitForTimeout(600)

  await klicke(aufnahme, infobox.getByLabel('Speichern', { exact: true }), { dauer: 350 })

  // 11. Nach dem Umbenennen lädt die App die Dateiliste neu und baut den Baum
  //     dabei neu auf – der Ordner ist danach wieder zugeklappt. Also noch
  //     einmal aufklappen; das Video endet mit dem neuen Namen in der Liste.
  const umbenannt = infobox.getByText(`${NEUER_NAME}.pdf`, { exact: true })
  await expect(umbenannt).toBeAttached({ timeout: 20_000 })
  await expect(ordner).toBeVisible()
  await aufnahme.waitForTimeout(900)
  await klicke(aufnahme, ordner)
  await expect(umbenannt).toBeVisible()
  await aufnahme.waitForTimeout(1800)

  // 12. Ausschnitt aus der Lage der Info-Box ableiten und Video sichern.
  const box = (await infobox.boundingBox())!
  const ausschnitt = {
    x: Math.max(0, Math.round(box.x - KARTENSTREIFEN)),
    y: Math.max(0, Math.round(box.y - 2)),
    breite: 0,
    hoehe: AUSSCHNITT_HOEHE,
  }
  ausschnitt.breite = (aufnahme.viewportSize()?.width ?? 1792) - ausschnitt.x

  const video = aufnahme.video()
  expect(video, 'Playwright hat kein Video aufgezeichnet – test.use({ video }) prüfen.').toBeTruthy()
  await aufnahme.close()

  const roh = test.info().outputPath('map_attachment-roh.webm')
  await video!.saveAs(roh)

  videoNachbearbeiten({
    quelle: roh,
    ziel: videoPfad(KAPITEL, 'map_attachment'),
    ausschnitt,
    ab: Math.max(0, (vorfuehrungStart - seitenStart) / 1000 - VORLAUF),
  })
})
