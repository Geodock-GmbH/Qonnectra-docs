// Video for chapter "8. Leitungsauskunft" in the manual
// (manual/teil-a-anwenderhandbuch/08-leitungsauskunft.md):
//
//   records_inquiry_draw  8.3  switch on the drawing tool, click the corners of
//                              an inquiry area, close it with a double-click
//
// A file of its own, because `test.use({ video: ... })` is only allowed at file
// level - inside a test.describe group Playwright rejects it ("forces a new
// worker"). The still images of the chapter live in
// tests/08-leitungsauskunft.spec.ts.
//
// The flow is movement, not state: the polygon grows with every click, the
// rubber band follows the cursor between two corners, and the double-click
// turns the drawing into a saved area whose objects light up at once. Two
// stills would show an empty map and a finished area and leave out exactly the
// part users get wrong - how a polygon is closed.
//
// This spec WRITES: it draws into a record of its own and removes it again,
// see createRecord()/removeRecord(). Drawing in the demo record instead would
// pile up areas with every run.
//
// Publish to public/videos/ with: pnpm screenshots:publish 08-leitungsauskunft
import { expect, request as playwrightRequest, test, type Page } from '@playwright/test'

import { localApp, superuserCredentials } from '../playwright/local-app'
import {
  click,
  pointAt,
  postProcessVideo,
  showCursor,
  videoPath,
} from '../playwright/manual-videos'

const CHAPTER = '08-leitungsauskunft'

// Recording size = viewport from playwright.config.ts. Without it Playwright
// scales the video down until it fits into 800 x 800, and the crop would be
// blurry. Larger than the viewport gains nothing: Chromium's screencast
// delivers CSS pixels, the deviceScaleFactor of 2 has no effect here (see
// PostProcessOptions.scale in playwright/manual-videos.ts).
test.use({ video: { mode: 'on', size: { width: 1792, height: 1120 } } })

/** "Testprojekt" of the demo data, pinned by playwright/auth.setup.ts. */
const TEST_PROJECT_ID = 2

/**
 * Corners of the drawn area, in CSS pixels of the viewport - the same ones the
 * still images use (AREA_CORNERS in tests/08-leitungsauskunft.spec.ts). The map
 * position is seeded by playwright/auth.setup.ts, so the same pixel always hits
 * the same place.
 */
const AREA_CORNERS = [
  { x: 860, y: 520 },
  { x: 1130, y: 505 },
  { x: 1150, y: 725 },
  { x: 880, y: 740 },
]

/**
 * Crop in CSS pixels of the window.
 *
 * The map runs from x 300 to 1774 (measured), which is far too wide: at the
 * around 690 px the manual renders a video at, an address marker would be a few
 * pixels across. 1000 px starting at the left edge of the map hold both the
 * tools (x 316 to 352) and all four corners of the area (up to x 1150) and match
 * the roughly 1000 px CLAUDE.md aims at.
 *
 * The height runs past the lowest corner (y 740); the panel
 * "Auskunftsbereiche" at x 1660 stays outside deliberately - it is the subject
 * of the still image, not of the flow.
 */
const CROP = { x: 300, y: 140, width: 1000, height: 760 }

/** Seconds of still image before the first step. */
const LEAD_IN = 1.0

let recordUuid = ''

/**
 * Creates the record the video draws into.
 *
 * Creating goes through the capture account (group "Editor" may POST), removing
 * through the superuser: "Editor" has access level "edit" and is not allowed to
 * DELETE (`RoleBasedPermission`).
 */
async function createRecord() {
  const { apiUrl, username, password } = localApp()
  const api = await playwrightRequest.newContext({ baseURL: apiUrl, ignoreHTTPSErrors: true })
  await api.post('/api/v1/auth/login/', { data: { username, password } })

  const response = await api.post('/api/v1/pipeline-records/', {
    data: {
      project: TEST_PROJECT_ID,
      type_of_work_value: 1,
      request_reason_value: 1,
      // Placeholder contact data, as in tests/08-leitungsauskunft.spec.ts - the
      // crop does not show these fields, but the record exists in the database
      // for the length of the run (see "Personal data in images" in CLAUDE.md).
      organisation: 'Musterbau GmbH',
      name: 'Max Mustermann',
    },
  })
  expect(response.ok(), `Creating the record failed: HTTP ${response.status()}`).toBeTruthy()
  recordUuid = (await response.json()).uuid

  await api.dispose()
}

/** Removes the record again - its areas go with it (CASCADE). */
async function removeRecord() {
  if (!recordUuid) return

  const { apiUrl } = localApp()
  const api = await playwrightRequest.newContext({ baseURL: apiUrl, ignoreHTTPSErrors: true })
  await api.post('/api/v1/auth/login/', { data: superuserCredentials() })

  const response = await api.delete(`/api/v1/pipeline-records/${recordUuid}/`)
  expect(
    response.status(),
    `The record ${recordUuid} was left behind - the next run would start from a different state.`,
  ).toBe(204)
  recordUuid = ''

  await api.dispose()
}

test.beforeAll(createRecord)
test.afterAll(removeRecord)

/** Opens the inquiry map and waits for the tiles. */
async function openInquiry(page: Page) {
  await page.goto(`/pipeline-records/${recordUuid}/inquiry`)
  await expect(page.locator('div.map canvas').first()).toBeVisible({ timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  // The tiles arrive through a worker pool that networkidle does not see.
  await page.waitForTimeout(4000)
}

/**
 * Warm-up page. It fills the HTTP cache of the context, so that the actual
 * recording page is up within a fraction of a second - Playwright records a
 * page from its creation, and a long page load would end up in the video.
 */
async function warmUp(page: Page) {
  await openInquiry(page)
  await page.close()
}

/** Saves the recording of `page` and cuts off everything before `demoStart`. */
async function saveVideo(page: Page, name: string, pageStart: number, demoStart: number) {
  const video = page.video()
  expect(video, 'Playwright recorded no video - check test.use({ video }).').toBeTruthy()
  await page.close()

  const raw = test.info().outputPath(`${name}-raw.webm`)
  await video!.saveAs(raw)

  postProcessVideo({
    source: raw,
    target: videoPath(CHAPTER, name),
    crop: CROP,
    // Cut exactly at demoStart, not a lead-in earlier: before it the page is
    // still building itself. LEAD_IN is the still second **after** demoStart and
    // is therefore already part of the finished video.
    startAt: Math.max(0, (demoStart - pageStart) / 1000),
  })
}

test('8.3 Auskunftsbereich zeichnen', async ({ page, context }) => {
  test.setTimeout(240_000)

  await warmUp(page)

  const capture = await context.newPage()
  const pageStart = Date.now()

  await openInquiry(capture)
  await showCursor(capture)

  // Seeds the starting point of the cursor motion, so that the first step of
  // the demonstration does not begin with a jump.
  await pointAt(capture, { x: 620, y: 640 }, { duration: 400 })

  // From here the demonstration runs; everything before it is cut away.
  const demoStart = Date.now()
  await capture.waitForTimeout(LEAD_IN * 1000)

  // 1. Switch the drawing tool on. The button turns yellow.
  await click(capture, capture.getByRole('button', { name: 'Polygon zeichnen' }), {
    duration: 900,
  })
  await expect(capture.getByRole('button', { name: 'Zeichnen beenden' })).toBeVisible()
  await capture.waitForTimeout(600)

  // 2. Click the corners one after another. Between two of them the rubber band
  //    follows the cursor - that is what the slow motion is there for.
  const last = AREA_CORNERS.length - 1
  for (const [index, corner] of AREA_CORNERS.entries()) {
    if (index === last) {
      // 3. The double-click sets the last corner and closes the polygon.
      await pointAt(capture, corner, { duration: 800 })
      await capture.waitForTimeout(300)
      await capture.mouse.dblclick(corner.x, corner.y)
    } else {
      await click(capture, corner, { duration: index === 0 ? 900 : 700 })
      await capture.waitForTimeout(250)
    }
  }

  // The panel exists only while there is at least one area, so its heading is
  // the signal that the polygon has arrived in the backend.
  await expect(capture.getByRole('heading', { name: 'Auskunftsbereiche' })).toBeVisible({
    timeout: 20_000,
  })

  // Out of the drawn area, so that the last frames show the highlighting and
  // not the cursor on top of it. The highlighting itself follows on the next
  // render of the tile layers.
  await pointAt(capture, { x: 560, y: 860 }, { duration: 700 })
  await capture.waitForTimeout(2600)

  await saveVideo(capture, 'records_inquiry_draw', pageStart, demoStart)
})
