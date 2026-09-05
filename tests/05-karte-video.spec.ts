// Video for chapter "5. Karte" in the manual
// (manual/teil-a-anwenderhandbuch/05-karte.md), section 5.3.1
// "Anhänge von Kartenobjekten".
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in tests/05-karte.spec.ts.
//
// Publish to public/videos/ with: pnpm screenshots:publish 05-karte
import { expect, request, test } from '@playwright/test'

import { localApp, superuserCredentials } from '../playwright/local-app'
import {
  click,
  drag,
  pointAt,
  postProcessVideo,
  showCursor,
  typeText,
  videoPath,
} from '../playwright/manual-videos'

const CHAPTER = '05-karte'

// ---------------------------------------------------------------------------
// Video for section 5.3.1 "Anhänge von Kartenobjekten"
// ---------------------------------------------------------------------------
//
// Shows the flow the section describes: click the object, open the tab
// "Anhänge", drag the info box wider, upload a file, expand the folder, show the
// buttons of the file row and rename the file.
//
// Deliberately **without** the "delete" step: the capture account belongs to the
// group "Editor", which has access level "edit" on all domain models - the API
// answers DELETE with 403 and the app shows an error message. A video of that
// would be misleading. Cleaning up therefore happens through the API with the
// superuser (see cleanUpAttachments()).

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Larger than the viewport gains nothing: Chromium's screencast delivers
// CSS pixels, the deviceScaleFactor of 2 has no effect here (see
// PostProcessOptions.scale in playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/** Address "Nieharde 12" of the test project, EPSG:3857. */
const HOUSE = [1083847.2737702988, 7308943.7974595595]
const HOUSE_TITLE = 'Nieharde 12, 24972 Sterup'
/** Folder of the address in the media path - the clean-up finds attachments by it. */
const HOUSE_FOLDER = 'addresses/Nieharde 12, 24972 Sterup/'

const VIDEO_ZOOM = 19

/**
 * Where the house should sit in the window. To the left of the widened info box
 * (whose left edge sits at x ~ 976 at a width of 800 px) so that it stays
 * visible in the video, and far enough right to be inside the crop.
 */
const HOUSE_X = 870
const HOUSE_Y = 430

/** Width the info box is dragged to. */
const INFOBOX_WIDTH = 800

/**
 * Strip of map to the left of the info box that stays inside the crop. More
 * width shrinks everything else in the manual (see the head of manual-videos.ts).
 */
const MAP_STRIP = 200

/**
 * Height of the crop. Reaches from the top edge of the info box to below the
 * file list. The height does not change the scale in the manual - it only
 * determines how much is visible.
 */
const CROP_HEIGHT = 720

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

const FILE = 'scan_0001.pdf'
const NEW_NAME = 'Bestandsplan_2026'

/**
 * Smallest possible valid PDF file. It is only uploaded, never opened; the app
 * picks icon and folder from the extension alone. That is why a generated file
 * sits here instead of a sample file in the repo.
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
 * Removes all attachments of the address through the API - with the superuser,
 * because the capture account is not allowed to delete. Runs before **and**
 * after the capture: before, so that the video starts with "Keine Dateien
 * hochgeladen", afterwards so that the next run finds the same state.
 */
async function cleanUpAttachments() {
  const { apiUrl } = localApp()
  const { username, password } = superuserCredentials()

  const api = await request.newContext({ baseURL: apiUrl, ignoreHTTPSErrors: true })
  try {
    const login = await api.post('/api/v1/auth/login/', { data: { username, password } })
    expect(
      login.ok(),
      'Superuser login for the clean-up failed - check DJANGO_SUPERUSER_* in ' +
        'local-app/deployment/.env.',
    ).toBe(true)

    const response = await api.get('/api/v1/feature-files/?page_size=200')
    const body = await response.json()
    const files: Array<{ uuid: string; file_path: string }> = Array.isArray(body)
      ? body
      : (body.results ?? [])

    for (const file of files) {
      if (!decodeURIComponent(file.file_path).includes(HOUSE_FOLDER)) continue
      await api.delete(`/api/v1/feature-files/${file.uuid}/`)
    }
  } finally {
    await api.dispose()
  }
}

test.beforeEach(cleanUpAttachments)
test.afterEach(cleanUpAttachments)

test('5.3.1 Anhänge hinzufügen und bearbeiten', async ({ page, context }) => {
  test.setTimeout(180_000)

  // 1. Warm-up page. It measures the map area and fills the HTTP cache of the
  //    context along the way. The actual recording page is therefore up within
  //    a fraction of a second - Playwright records a page from its creation, and
  //    a long page load would end up in the video.
  await page.goto('/map')
  await expect(page.locator('div.map canvas').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  const mapArea = (await page.locator('div.map').boundingBox())!
  await page.close()

  // 2. Choose the map centre so that the house sits at (HOUSE_X, HOUSE_Y).
  //    Resolution of the map view in EPSG:3857 at the given zoom.
  const resolution = 156543.03392804097 / 2 ** VIDEO_ZOOM
  const centreX = mapArea.x + mapArea.width / 2
  const centreY = mapArea.y + mapArea.height / 2
  const mapCentre = [
    HOUSE[0] - (HOUSE_X - centreX) * resolution,
    HOUSE[1] + (HOUSE_Y - centreY) * resolution,
  ]

  const capture = await context.newPage()
  const pageStart = Date.now()

  await capture.addInitScript(
    (a) => {
      localStorage.setItem('mapCenter', JSON.stringify(a.centre))
      localStorage.setItem('mapZoom', JSON.stringify(a.zoom))
      // The info box starts at its default; widening it is part of the video.
      localStorage.setItem('drawerWidth', '400')
    },
    { centre: mapCentre, zoom: VIDEO_ZOOM },
  )

  await capture.goto('/map')
  await expect(capture.locator('div.map canvas').first()).toBeVisible()
  await capture.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await capture.waitForTimeout(2500)
  await showCursor(capture)

  const infobox = capture.locator('[data-drawer]')

  // From here the demonstration runs; everything before it is cut away by
  // postProcessVideo().
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 3. Select the object on the map.
  await click(capture, { x: HOUSE_X, y: HOUSE_Y }, { duration: 700 })
  await expect(capture.locator('#drawer-title')).toHaveText(HOUSE_TITLE)
  await capture.waitForTimeout(1200)

  // 4. Tab "Anhänge".
  await click(capture, infobox.getByRole('tab', { name: 'Anhänge', exact: true }))
  await expect(infobox.getByText('Dateien hochladen')).toBeVisible()
  // Cross-check for the clean-up: the video should start with an empty list.
  // Without it a run after an aborted attempt shows "documents (2)".
  await expect(
    infobox.getByText('Keine Dateien hochgeladen'),
    'The address still has attachments - cleanUpAttachments() did not take effect.',
  ).toBeVisible()
  await capture.waitForTimeout(1400)

  // 5. Drag the info box wider. At the default of 400 px the tab is too narrow:
  //    headings get cut off and the buttons of a file row sit outside. That is
  //    exactly what the section describes ("drag the box wider at its left
  //    edge").
  const handle = capture.getByRole('button', { name: 'Größe der Seitenleiste ändern' })
  await pointAt(capture, handle, { fraction: { y: 0.35 } })
  await capture.waitForTimeout(400)
  const widthBefore = (await infobox.boundingBox())!.width
  await drag(capture, -(INFOBOX_WIDTH - widthBefore), 0, { duration: 1400 })
  await capture.waitForTimeout(1000)

  // 6. Upload a file. The click on "Dateien auswählen" opens the file dialog of
  //    the operating system; Playwright intercepts it, and in the video the file
  //    appears directly in the selection list.
  const dialog = capture.waitForEvent('filechooser')
  await click(capture, infobox.getByRole('button', { name: 'Dateien auswählen', exact: true }))
  await (await dialog).setFiles({ name: FILE, mimeType: 'application/pdf', buffer: PDF })
  await capture.waitForTimeout(1200)

  await click(capture, infobox.getByRole('button', { name: /^Upload/ }))
  const folder = infobox.getByText(/documents \(\d+\)/)
  await expect(folder).toBeVisible({ timeout: 20_000 })
  await capture.waitForTimeout(1200)

  // 7. Expand the folder - only then do the files become visible.
  await click(capture, folder)
  const file = infobox.getByText(FILE, { exact: true })
  await expect(file).toBeVisible()
  await capture.waitForTimeout(1200)

  // 8. Point at the row: only that makes the three icon buttons appear.
  await pointAt(capture, file)
  const download = infobox.getByLabel('Herunterladen', { exact: true })
  await expect(download).toBeVisible()
  await capture.waitForTimeout(800)

  // 9. Point at the buttons so that the tooltips appear.
  await pointAt(capture, download, { duration: 450 })
  await capture.waitForTimeout(1400)

  const rename = infobox.getByLabel('Umbenennen', { exact: true })
  await pointAt(capture, rename, { duration: 300 })
  await capture.waitForTimeout(1200)

  // 10. Rename.
  await click(capture, rename, { duration: 120 })
  const input = infobox.locator('input[type="text"]')
  await expect(input).toBeVisible()
  await click(capture, input, { duration: 300 })
  await capture.keyboard.press('ControlOrMeta+a')
  await capture.waitForTimeout(300)
  await typeText(capture, NEW_NAME)
  await capture.waitForTimeout(600)

  await click(capture, infobox.getByLabel('Speichern', { exact: true }), { duration: 350 })

  // 11. After renaming, the app reloads the file list and rebuilds the tree in
  //     the process - the folder is collapsed again afterwards. So expand it
  //     once more; the video ends with the new name in the list.
  const renamed = infobox.getByText(`${NEW_NAME}.pdf`, { exact: true })
  await expect(renamed).toBeAttached({ timeout: 20_000 })
  await expect(folder).toBeVisible()
  await capture.waitForTimeout(900)
  await click(capture, folder)
  await expect(renamed).toBeVisible()
  await capture.waitForTimeout(1800)

  // 12. Derive the crop from the position of the info box and save the video.
  const box = (await infobox.boundingBox())!
  const crop = {
    x: Math.max(0, Math.round(box.x - MAP_STRIP)),
    y: Math.max(0, Math.round(box.y - 2)),
    width: 0,
    height: CROP_HEIGHT,
  }
  crop.width = (capture.viewportSize()?.width ?? 1792) - crop.x

  const video = capture.video()
  expect(video, 'Playwright recorded no video - check test.use({ video }).').toBeTruthy()
  await capture.close()

  const raw = test.info().outputPath('map_attachment-raw.webm')
  await video!.saveAs(raw)

  postProcessVideo({
    source: raw,
    target: videoPath(CHAPTER, 'map_attachment'),
    crop,
    startAt: Math.max(0, (demoStart - pageStart) / 1000 - LEAD_IN),
  })
})
