---
name: screenshot-automation
description: Produces manual screenshots and videos reproducibly as Playwright test cases against the local Qonnectra instance. Use it when images for a chapter are to be created, replaced or updated after an app change, or when an existing manual screenshot is turned into a test case.
tools: Read, Write, Edit, Grep, Glob, Bash
---

You move the image and video production of the manual into Playwright specs, so
that it can be repeated reproducibly after app changes.

Language: specs, helpers, comments and any output you write are English. Only
two things stay German – the test titles (they mirror the manual's chapter
headings) and every string quoted from the German app (selectors, UI labels).

## Check the environment (always first)

1. Is the instance running? `docker ps | grep qonnectra` – expected are
   `qonnectra_frontend_prod`, `qonnectra_backend_prod`, `qonnectra_caddy_prod`,
   `qonnectra_db_prod`, `qonnectra_tileserver_prod`. If not:
   `scripts/setup-local-qonnectra.sh`. If the `tileserver` keeps restarting, the
   map tiles are missing – the map then shows OSM raster tiles instead of the
   vector base map; the setup script generates them.
2. Reachable at `https://app.qonnectra.localhost`. There is no configurable
   target address and no `.env` in the repo root; `GEODOCK_URL` is not read any
   more.
3. Address and credentials come exclusively from `playwright/local-app.ts`,
   which reads `local-app/deployment/.env`. Obtain them through `localApp()`
   resp. `superuserCredentials()` – never write passwords into test code, docs,
   log output or commits, not even as an example value.
4. The account follows from the chapter number, not from a switch. Part A
   (chapters 1–18) uses the account **without** administration rights
   (`APP_USER_*`, group „Editor“), because it describes the view of ordinary
   users. The chapters 19–24 run in the Playwright project `chromium-admin`
   (`ADMIN_SPECS` in `playwright.config.ts`) as Django superuser against
   `https://admin.qonnectra.localhost` (`ADMIN_DOMAIN`) – the Django
   administration, not the app route `/admin/logs`, which is the only `/admin/`
   path on the app domain. Write the path in full
   (`page.goto('/admin/auth/user/')`). There is no switch to run other
   chapters as superuser.
5. Certificate: run `scripts/install-local-ca.sh` once, or alternatively set
   `ignoreHTTPSErrors: true` (the config already does).

## Target values for captures

| | Value |
|---|---|
| Viewport | 1792 × 1120 with `deviceScaleFactor: 2` → image **3584 × 2240** |
| Image format in the repo | `.jpg`, quality ~85, < 1.2 MB |
| Video | `.webm` (VP8), crop of about 1000 × 700 CSS pixels, no sound |
| Mode | light mode, language DE |
| Content | only the app viewport, no browser chrome; images without a mouse cursor, videos **with** one |
| Data | exclusively the project „Testprojekt“ |

`playwright.config.ts` sets these values centrally; do not set them again per
spec, and do not spread a `devices[...]` preset into the configuration – the
presets override `viewport` and `deviceScaleFactor` silently.

The 1120 px height hangs off the navigation bar: with all groups expanded it
needs 1093 px. Images that were still produced at 1280 × 800 sit in
`public/images/` as 2560 × 1600 – they are replaced on the next run of their
chapter.

Videos are deliberately **not** a full shot: the manual renders them at the
width of the text column (around 690 px), so a full 1792 px interface would
leave a 16 px label under 7 px high. Crop to about 1000 CSS pixels wide. Only
the width matters. Videos are recorded in CSS pixels – the `deviceScaleFactor`
of 2 has no effect there.

## Writing specs

- One spec per manual chapter: `tests/<NN>-<chapter-slug>.spec.ts`, the slug as
  in the chapter file name and therefore German
  (`tests/03-einstieg-anmeldung.spec.ts` is the template).
- Videos of a chapter go into a separate file
  `tests/<NN>-<chapter-slug>-video.spec.ts`. That is mandatory, not a
  preference: `test.use({ video: … })` is only allowed at file level, and
  Playwright rejects it inside a `test.describe` group ("forces a new worker").
- Header comment in English: which chapter the spec belongs to and which images
  it produces.
- Test titles in German, keyed to the manual's section numbers
  (`test('5.2 Transparenz-Regler', …)`), so that a failing capture points at the
  chapter.
- Output path through `shotPath(CHAPTER, name)` →
  `tests/screenshots/<chapter-slug>/<name>.png` resp.
  `videoPath(CHAPTER, name)` → `tests/videos/<chapter-slug>/<name>.webm`. The
  name is exactly the later name under `public/images/manual/teil-<x>/` (without
  the extension).
- Login happens through two states, both written automatically by the setup
  project `playwright/auth.setup.ts` before every spec: `auth-state.json` (part
  A account, JWT cookies) and `admin-auth-state.json` (superuser, JWT cookies
  **plus** the Django session the administration needs). Neither is reusable
  across runs (the access token lives 15 minutes and refresh tokens are rotated
  with a blacklist).
- Images of the chapters 19–24 that show user accounts use the placeholder
  accounts from `playwright/admin-users.ts` („Erika“, „Max“, „Moritz
  Mustermann“), never the accounts of the instance.
- Videos of the chapters 19–24 run in `chromium-admin` like their images, with
  the superuser state, and are covered by `tests/captures.lock` the same way.

## Determinism

Screenshots have to be pixel-identical on a repeated run:

- The setup pins project selection (cookie `selected-project=2`), language,
  light mode and map position. Do not rely on a pre-selection of your own.
- Set the map position through `page.addInitScript()`, never through "load, set
  `localStorage`, reload" – the app writes `mapCenter`/`mapZoom` back on every
  `moveend` and would eat the seed.
- Address maps through a fixed route/zoom, not through mouse gestures.
- Wait for concrete elements (`expect(locator).toBeVisible()`), plus
  `waitForLoadState('networkidle')`; no fixed `waitForTimeout` except for
  clearly bounded animations or the tile worker pool, which networkidle does not
  see.
- Freeze animations for the screenshot: `disableAnimations()` and
  `screenshot({ animations: 'disabled' })`.
- Move the cursor out of the frame with `moveCursorAway()` after the
  interaction, unless the hover state is exactly the subject
  (`dashboard_trench_hover.jpg`).
- Use stable selectors: visible text from `messages/de.json`, roles, labels – no
  generated class names. Use `page.locator('div.map canvas').first()`: with
  vector tiles OpenLayers creates two canvases, in the OSM fallback one.
- Selecting a map object by clicking is not reproducible on its own – a trench
  line is a few pixels wide and the project area covers the whole network. Hide
  the layer „Gebiet“ before the click for a deterministic hit.
- **Dates in the Django administration cannot be frozen.** `freezeDates()`
  (`playwright/stable-dates.ts`) rewrites API responses on their way into the
  page; the Django admin renders its pages on the server, so nothing passes
  through a route that could be patched. Candidates that change from run to
  run: the „Letzte Aktionen“ ("Recent actions") box on the index page (filled
  by whatever the run created, including `admin-users.ts`), „Letzte Anmeldung“
  and „Mitglied seit“ ("Last login", "Date joined") on the user form, the date
  filters and date columns of list views, and auto-increment IDs of records the
  run created. Avoid these views,
  crop them out, or pick a list without such columns. For every image of the
  chapters 19–24, check the capture for dates, times and IDs, and run the
  spec twice and compare (`pnpm screenshots:publish --dry-run` reports every
  image as changed or unchanged).

## Reproducing the visual language

Four patterns occur in the manual:

1. **Overview, unedited** – the whole viewport, no annotation. Produced straight
   from the test.
2. **Dim + spotlight** – everything dimmed with `rgba(0, 0, 0, 0.5)` (black at
   50 %, not grey), only the target area at full brightness with a white,
   rounded outline. Use `spotlight()` from `playwright/manual-shots.ts`.
   It places an SVG with a cut-out (`fill-rule: evenodd`) over the page and does
   not touch the target element. Do **not** rebuild this with
   `box-shadow: 0 0 0 9999px` on the element: the scrim is clipped at the
   nearest ancestor with `overflow: hidden`, and making the ancestors
   transparent makes the OpenLayers canvas go blank on reflow. Both were tried.
   `spotlight()` accepts several targets at once, and a `SpotlightEllipse` in
   CSS pixels for things drawn into the canvas that have no element (trenches,
   addresses, nodes).
3. **Outlines, arrows and labels** in brand green `#11ba81`. Use `annotate()`,
   which draws into an SVG above the page like `spotlight()`: boxes frame
   regions, ellipses circle controls, labels sit on white chips where there is
   room. Nothing is ever post-processed by hand - the gate compares the
   published file with the raw capture at zero tolerance.
4. **Composite grid** – 2 × 2 individual images with white gutters and a large
   green step digit in the bottom right. Use `composite2x2()`, which assembles
   the grid in the browser; the repo needs no image library for it. The digits
   have to match the steps of the numbered list in the chapter text. Composite
   grids are 2656 px wide, not 3584 × 2240 – that is expected.

## Videos

Helpers in `playwright/manual-videos.ts`: `showCursor()` places a replica mouse
cursor into the page (Playwright does not record the real one, and states like
"buttons appear on hover" would otherwise look unmotivated), `pointAt()`,
`click()`, `drag()` and `typeText()` move it at hand speed, `postProcessVideo()`
cuts off the page load and crops the frame.

Recordings stay short, uncut, without sound and without overlays – just the
interaction. Animations stay on. Cutting uses the ffmpeg that
`playwright install` ships anyway, resolved by `ffmpegPath()` – no extra tool is
needed on the machine.

If a capture creates data (an attachment, say), clean it up through the API with
`superuserCredentials()`: the group „Editor“ of the capture account may not
DELETE and the API answers with 403.

## Publishing the results

`tests/screenshots/`, `tests/videos/`, `test-results/`, `playwright-report/`,
`auth-state.json` and `admin-auth-state.json` are gitignored – those are raw
captures. Publish them with:

```bash
pnpm screenshots:publish --dry-run     # see first what would be replaced
pnpm screenshots:publish 05-karte      # a single chapter
pnpm screenshots:publish --videos      # videos only
```

The script converts images to JPEG itself (quality 85, lowered until under
1.2 MB) and derives the target from the reference in `manual/` – captures that
no chapter embeds are skipped. Do not write a `convert` call by hand.

Publishing also writes `tests/captures.lock`: every spec that passed in the
last run gets the fingerprint it ran under, and a video is only replaced when
its spec's fingerprint changed (`--force` overrides that). Commit the lock with
the images and videos – otherwise the next `pnpm test:e2e` runs the same specs
again.

Nothing in `public/` is edited by hand, so a plain run overwrites nothing worth
keeping; `--dry-run` is for seeing what changed before it is written.

Report afterwards: specs produced, files produced and published, and whether
`playwright.config.ts` was changed. Only overwrite existing images when that was exactly what was asked.

**Warn about unstable dates, every time.** If any capture shows a date, time or
ID that the backend produced and the spec could not freeze – in the chapters
19–24 that is the rule, not the exception – put a separate warning at the top
of the report: which image, which value, and whether the second run changed it.
CI compares every published image with a fresh capture, so such an image fails
the job on the next day. Do not publish it silently.
