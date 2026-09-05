# CLAUDE.md

Guide for Claude Code in this repository.

**Language: everything is English** – identifiers, comments, script and console
output, CLI flags, commit messages and this file. German survives in exactly
three places, each for a reason:

1. **The manual itself** – `manual/` prose, alt texts, chapter file names
   (they are public URLs).
2. **Literals quoted from the German app** – Playwright selectors
   (`getByRole('tab', { name: 'Trasse' })`), UI labels cited in comments, demo
   data values (`"Testprojekt"`, `"Hausanschluss"`).
3. **Test titles** – they mirror the manual's chapter headings 1:1, so a failing
   capture points straight at the chapter to fix.

Everything else is English. When in doubt, English.

## Glossary

Derived from the already-English image names, so that code and `public/images/`
agree:

| German | English | German | English |
|---|---|---|---|
| Trasse | trench | Aufnahme | capture |
| Rohr | conduit | Ausschnitt | crop |
| Netzknoten | node | Schleier | scrim |
| Gebiet | area | Kontur | outline |
| Adresse | address | Zeiger | cursor |
| Gewährleistung | warranty | Frist | deadline |
| Anhang | attachment | Vorlauf | lead-in |
| Reiter | tab | Verzögerung | delay |
| Kapitel | chapter | übernommen | published |
| Legende | legend | übersprungen | skipped |
| Diagramm | chart | Balken | bar |

One word, two meanings: **Karte** is the map in `05-karte.spec.ts`
(`openMap()`), but a dashboard card in `04-dashboard.spec.ts` (`card()`). Never
translate it globally.

## What this repo is

VitePress site for **Qonnectra** (open-source network documentation for
municipal infrastructure, Geodock GmbH & plan[neo] GmbH, AGPL-3.0). Two content
strands:

- **Landing page**: `index.md`, `services/`, `contact/`, `imprint/`, `privacy/`
- **Manual**: `manual/` – the focus of ongoing work

The manual is split into three parts (target audiences see `manual/index.md`):

| Directory | Part | Chapters |
|---|---|---|
| `manual/index.md` | Introduction | 1 |
| `manual/teil-a-anwenderhandbuch/` | A – User manual (web application, no GIS knowledge) | 2–7, reserved 8–13 |
| `manual/teil-b-betrieb-admin-qgis/` | B – Operations, administration, QGIS | 14, reserved 15–16 |
| `manual/teil-c-entwickler-systemdokumentation/` | C – Developer and system documentation | 17 ff. |

The gaps in the numbering are deliberate – new chapters fill them instead of
shifting existing numbers. The chapter number in the H1 **and** in the file name
prefix have to match (`06-rohrverwaltung.md` → `# 6. Rohrverwaltung`); the
sidebar is generated from file name order + H1 (`vitepress-sidebar`).

## Commands

```bash
pnpm install
pnpm dev              # http://localhost:5173
pnpm build            # BASE_PATH="/Qonnectra-docs/" in CI
pnpm lint:spelling    # cspell (en, en-GB, de) – has to be green before every commit
pnpm test:e2e:setup   # write the login state to auth-state.json
pnpm test:e2e         # Playwright specs in tests/

scripts/setup-local-qonnectra.sh            # build/start the local Qonnectra instance
scripts/setup-local-qonnectra.sh --reset    # discard data + secrets, rebuild
scripts/install-local-ca.sh                 # import the dev CA once per machine
```

New German technical terms cspell does not know go into `.cspell.json` under
`words`, sorted alphabetically – not suppressed with an inline comment.

## Writing style of the manual

Binding, derived from the existing chapters. New chapters follow it exactly; when
in doubt read `manual/teil-a-anwenderhandbuch/05-karte.md` and
`07-rohrzuordnung.md` as templates. The manual is written in German, so the rules
below quote German.

**Form of address and tone**
- Consistently **Sie-Form**, instructions in the imperative: „Klicken Sie auf …“,
  „Geben Sie einen Suchbegriff ein.“
- Gender-neutral through participles/double naming: „Nutzende“, „Anwenderinnen
  und Anwender“, „Verwaltungsmitarbeitende“.
- Factual, no marketing tone, no emoji, no exclamation marks.
- Explain what does **not** work and where users get stuck as well
  („Andernfalls gehen die Änderungen ohne Warnung verloren.“, „Wenn der Button
  nicht sichtbar ist, scrollen Sie im Feld nach unten.“).

**Structure**
- No frontmatter in chapter files.
- Numbered headings: `# 6. Rohrverwaltung`, `## 6.1 Suchen und Filtern`,
  `### 6.3.1 Reiter „Eigenschaften“`. `####` stays unnumbered.
- Every chapter starts with a paragraph: purpose of the area + how to get there
  („Sie erreichen sie über die linke Navigation durch Klicken auf den Menüpunkt
  „Rohrverwaltung“.“), followed directly by an overview screenshot.
- Bullet lists for options/properties, **numbered** lists only for genuine
  step-by-step procedures.
- Notes as VitePress containers, closed with `:::`, in three escalating levels:
  `::: info` („Hinweis“, blue) for anything worth knowing, `::: warning`
  („Wichtig“, yellow) for limits and pitfalls, `::: danger` („Achtung“, red) for
  the cases where data is lost. The titles come from `markdown.container` in
  `.vitepress/config.ts` – write one out only where it deviates. The styling of
  the three sits in `.vitepress/theme/custom.css`, `::: details` on the landing
  page keeps the VitePress look.
- Cross-references as relative links: `siehe Kapitel [Karte](./05-karte.md)`.
- Placeholder for chapters still to be written:
  `_Die Dokumentation zu diesem Kapitel ist noch in Arbeit._`

**Markup**
- `**bold**` for technical terms and concepts on first appearance
  (**Rohrzuordnung**, **Transparenz**, **interaktive Legende**) and for states
  („Routing-Modus **eingeschaltet**“).
- UI labels in typographic quotation marks: „Speichern“, „+ Rohr hinzufügen“,
  Reiter „Anhänge“. Take labels verbatim from the app – the reference is
  `local-app/frontend/messages/de.json`.
- Abbreviations with a space: „z. B.“, „ggf.“.

## Screenshots and videos

**Technical target values**

| | Value |
|---|---|
| Viewport | 1792 × 1120, `deviceScaleFactor: 2` → image **3584 × 2240** |
| Image format | `.jpg`, quality ~85, target file size < 1.2 MB |
| Video format | `.webm` (VP8), crop of the interface, approx. 1000 × 700 |
| Mode | always light mode, language **DE** |
| Content | only the app viewport, no browser chrome; images without a mouse cursor, videos **with** one |
| Data | exclusively the demo project „Testprojekt“ – no real personal data |

> `playwright.config.ts` sets these values centrally. Do not spread a
> `devices[...]` preset into the project configuration – the presets bring their
> own `viewport` and `deviceScaleFactor` values and override the target values
> silently.

Videos are deliberately **not** a full shot of the interface. The manual renders
them at the width of the text column (around 690 px); at a recording width of
1792 CSS pixels, a 16 px label in the app would be left with less than 7 px. A
crop of around 1000 CSS pixels wide matches the existing videos
(`map_attachment.webm` showed an area of roughly 924 × 638 CSS pixels) and stays
legible. Only the **width** matters – the height does not change the scale in the
manual. Unlike screenshots, videos are also recorded in CSS pixels: Chromium's
screencast delivers no device pixels, so the `deviceScaleFactor` of 2 has no
effect there.

**Location and naming**
- Images: `public/images/manual/teil-a/<name>.jpg` (one folder per manual part)
- Videos: `public/videos/<name>.webm` (flat, no part subfolder)
- Name = English, `snake_case`, area first, detail second:
  `login_`, `dashboard_`, `map_`, `conduit_`, `conduit_connection_`
  → `dashboard_trench_hover.jpg`, `map_legend_actions.jpg`, `conduit_search_columns.jpg`
- Detail crops get the suffix `_detail`
  (`login_start_detail.jpg`, `map_address_detail.jpg`).

**Visual language – four patterns that recur consistently**

1. **Overview image, unedited** – the whole app viewport, without annotation.
   Sits at the start of a chapter (`dashboard.jpg`, `map.jpg`, `conduit.jpg`).
2. **Dim + spotlight** – the entire interface is dimmed, only the described area
   stays at full brightness and gets a white, rounded outline. The standard
   device for "where do I find X?" (`dashboard_project.jpg`, `conduit_excel.jpg`,
   `map_selected_object.jpg`).
   The scrim is **`rgba(0, 0, 0, 0.5)`** – black at 50 %, not grey. Measured on
   the old images: every dimmed pixel has exactly half the value of the undimmed
   image (255 → 128, 220 → 110). A grey or weaker scrim looks clearly too light
   next to the existing images; `spotlight()` in `playwright/manual-shots.ts`
   sets this value.
   Several places may be exposed at once when they belong together –
   `map_selected_object.jpg` shows the selected map object and the info box with
   its values, everything in between stays dimmed. For map objects the cut-out is
   an ellipse aligned to the line, not a rectangle.
3. **Hand-drawn annotation in brand green** (`#11ba81`) – sweeping ellipses
   around elements, curved arrows and handwritten-looking labels. For orientation
   images with several labels at once (`login_navigation.jpg`).
4. **Composite grid** – 2 × 2 individual images with white gutters, each step
   numbered with a large green digit in the bottom right; the digits correspond
   to the steps of the numbered list in the text (`map_search_flow.jpg`,
   `map_legend_actions.jpg`).

Patterns 2 and 3 are combined (dim + ellipse + arrow). Videos are short,
uncut interaction recordings without sound, text or annotation – with a visible
mouse cursor, because states like "buttons appear on hover" would otherwise look
unmotivated (`showCursor()` in `playwright/manual-videos.ts` places a replica
cursor into the page; Playwright does not record the real one). Animations stay
on; `disableAnimations()` applies to still images only.

**Embedding in Markdown**
- The image goes **after** the explaining paragraph, never before it.
- The alt text is a German description naming the view, the highlight and the
  position:
  `![Screenshot Karte mit Hervorhebung der Legende oben rechts](/images/manual/teil-a/map_legend.jpg)`
- Image classes (see `.vitepress/theme/custom.css`): default 512 px with a green
  1 px border, `{.big}` = 800 px, `{.small}` = 300 px, `{.no-border}` without a
  border.
- Image pair (full shot + detail) side by side: two `![]()` lines directly below
  one another, then a line of its own with `{.img-row}`.
- Videos without alt text through `markdown-it-html5-media`:
  `![](/videos/conduit_connection_mapFind.webm)`
- Clicking an image opens a lightbox (`vitepress-plugin-lightbox`) – details may
  therefore be small in the 512 px rendering, but have to be legible in the
  original.

## Local Qonnectra instance for reproducible captures

Goal: screenshots and videos are produced as Playwright test cases against the
local instance, so that they can be regenerated when the app changes.

- `scripts/setup-local-qonnectra.sh` clones the app into `local-app/` and starts
  it through the **production** compose file. Idempotent, may be run any number
  of times.
- Reachable at `https://app.qonnectra.localhost` (admin:
  `https://admin.qonnectra.localhost/admin`, API: `https://api.qonnectra.localhost`).
- Two accounts, credentials in `local-app/deployment/.env`, generated randomly on
  the first run. **Never write them into docs, tests, scripts or commits** –
  always read them through `process.env` resp. the `.env` file.
  - `APP_USER_USERNAME` / `APP_USER_PASSWORD` – account **without**
    administration rights, group from `APP_USER_GROUP` (default `Editor`: all
    domain data editable, no access to `/admin/*`).
    **The default for all captures** – part A describes the view of ordinary
    users. The setup creates resp. updates it on every run.
  - `DJANGO_SUPERUSER_USERNAME` / `DJANGO_SUPERUSER_PASSWORD` – Django superuser
    for administration. Only use it for images of `/admin/*`: it bypasses every
    permission check and additionally sees the „Logs“ menu entry.
- `PUBLIC_DOCUMENTATION_URL` in `.env` is the help link the app shows in the
  header and the navigation bar; the setup sets it to `https://qonnectra.de/` on
  every run (overridable via `QONNECTRA_DOCUMENTATION_URL`). If the variable is
  empty, the app hides the link and it is missing from the image.
- HTTPS runs through a local dev CA; run `scripts/install-local-ca.sh` once, or
  alternatively set `ignoreHTTPSErrors: true` in Playwright.
- Demo data: project **„Testprojekt“** from
  `scripts/qonnectra-demo-data/testprojekt-export.json`, imported automatically
  during setup. Select it in the top left after logging in.
- `local-app/` is gitignored (foreign checkout) – never commit it and only change
  it through the setup script.

**Playwright setup in the docs repo**

All runs go exclusively against the local instance. There is no configurable
target address and no `.env` in the repo root any more – `GEODOCK_URL` is no
longer read.

- `playwright/local-app.ts` is the single source for address and credentials and
  reads `local-app/deployment/.env` (`APP_DOMAIN`, `API_DOMAIN`, `APP_USER_*`,
  `DJANGO_SUPERUSER_*`). Only obtain credentials through `localApp()`, never
  write them into specs, output or commits.
- Login uses the account **without** administration rights by default.
  `QONNECTRA_LOGIN=admin pnpm test:e2e` switches to the superuser – only for
  areas that stay hidden from ordinary users. Images from an admin run otherwise
  show an interface that does not exist for the audience of part A.
- `playwright/auth.setup.ts` runs as a setup project automatically before every
  spec: it checks reachability (with a pointer to
  `scripts/setup-local-qonnectra.sh` if the stack is down), logs in through
  `POST /api/v1/auth/login/` and writes `auth-state.json`. `pnpm test:e2e:setup`
  runs only this step.
- `auth-state.json` is **not** reusable and is regenerated per run: the access
  token lives for 15 minutes, and the backend rotates refresh tokens with a
  blacklist (`ROTATE_REFRESH_TOKENS` + `BLACKLIST_AFTER_ROTATION`).
- The setup pins the state the images depend on: cookie `selected-project=2`
  („Testprojekt“; a UI login would write `1` = „Default“) as well as
  `PARAGLIDE_LOCALE=de`, `mode=light`, `basemapTheme`, `mapCenter` and `mapZoom`
  in `localStorage`. The map has no auto-fit – without `mapCenter`/`mapZoom`
  (EPSG:3857) it starts at zoom 2 in the Atlantic.
- One spec per manual chapter: `tests/<NN>-<chapter-slug>.spec.ts` with a comment
  naming the chapter it belongs to (see `tests/05-karte.spec.ts`). The chapter
  slug stays German because it mirrors the manual's file name. Videos of a
  chapter sit next to it in `tests/<NN>-<chapter-slug>-video.spec.ts`; a separate
  file is mandatory, because `test.use({ video: … })` is only allowed at file
  level ("forces a new worker" inside a `test.describe` group).
- Output goes to `tests/screenshots/<chapter-slug>/<name>.png` through
  `shotPath()` resp. `tests/videos/<chapter-slug>/<name>.webm` through
  `videoPath()`. `tests/screenshots/`, `tests/videos/`, `test-results/`,
  `playwright-report/` and `auth-state.json` are gitignored – those are raw
  captures, not the files of the manual.
- `pnpm screenshots:publish` (`scripts/publish-screenshots.sh`) publishes them to
  `public/images/manual/…` resp. `public/videos/…` and converts images to JPEG in
  the process (quality 85, lowered until the file is under 1.2 MB); videos are
  only copied, cropping and encoding are done by the spec. The target comes from
  the manual itself: the script looks for the reference
  `/images/manual/<part>/<name>.jpg` resp. `/videos/<name>.webm` in `manual/`.
  Captures without a reference are skipped, so that nothing ends up in the wrong
  folder. `--dry-run` shows beforehand what would be created and what replaced,
  `--videos` and `--images` restrict the run to one kind.
- Only patterns 1 and 2 go through fully automatically. Images with hand-drawn
  annotations (pattern 3) are post-processed after publishing – look at
  `--dry-run` first, otherwise the run overwrites the handwork with a raw
  capture. To renew only a video, use `--videos`.
- Chapter 3 is the only one that also needs the logged-out state: the images of
  the login page sit in a `test.describe` block with
  `test.use({ storageState: { cookies: [], origins: [] } })`, the images of the
  interface next to it in the normal logged-in state. The app redirects
  logged-in calls of `/login` to `/map`.
- `workers: 1` and `fullyParallel: false` are deliberate: all specs share one
  instance including project selection and map position.
- Determinism helpers in `playwright/manual-shots.ts`: `disableAnimations()`
  (transitions and text caret off), `moveCursorAway()` (no hover states in the
  image), `spotlight()` for pattern 2 and `composite2x2()` for pattern 4. The
  grid is assembled in the browser, so the repo needs no image library. Pattern 3
  (hand-drawn ellipses/arrows) stays post-processing.
  `spotlight()` takes one target or a list of targets and exposes each of them; a
  target is either a locator or a `SpotlightEllipse` in CSS pixels of the
  viewport. The ellipse is meant for everything that has no element: trenches,
  addresses and nodes are drawn into the canvas by the map. Where it sits is
  measured, not hard-coded – `selectedMapFeature()` in `tests/05-karte.spec.ts`
  searches the canvas for the selection colour of the app
  (`DEFAULT_SELECTED_COLOR` = `#fff700`) and aligns the ellipse to the main axis
  of the found points. That is necessary because several trenches converge below
  the map centre and a different one is hit on each run; the inclination and
  length of the line change with it. If a canvas is locked for `getImageData` by
  foreign raster tiles, it is skipped – the objects live in a different one
  anyway.
  `spotlight()` places an SVG with a cut-out over the page and does not change the
  target element. The obvious route via `box-shadow: 0 0 0 9999px` on the element
  itself fails here twice over: the scrim is clipped at the nearest ancestor with
  `overflow: hidden`, and making the ancestors transparent makes the map
  (OpenLayers) lose its canvas content on reflow.
- Video helpers in `playwright/manual-videos.ts`: `showCursor()` places a replica
  mouse cursor into the page, `pointAt()`, `click()`, `drag()` and `typeText()`
  move it at hand speed, `postProcessVideo()` cuts off the page load and the
  frame edges. Pitfalls that are already solved there and reappear immediately
  when rebuilding this:
  - The cursor must **not** get its own compositor layer (so `left`/`top` instead
    of `transform`, no `will-change`). Otherwise Chromium keeps painting it up to
    date while rasterising the remaining content lags behind – while dragging the
    info box wider, the cursor ran a good 180 px ahead of the edge.
  - The cursor has to listen to `pointermove` **and** `mousemove`: the handle of
    the info box calls `preventDefault()` in its `pointerdown`, after which
    Chromium sends no more `mouse` events for that pointer.
  - Leave around 90 ms per step while dragging. The map hangs off the width of
    the info box, and OpenLayers repaints on every change (measured ~70 ms);
    denser events visibly pile up.
  - Cutting is done with the ffmpeg that `playwright install` ships anyway
    (`ffmpegPath()`) – no extra tool on the machine. `-ss` has to come **after**
    `-i`; before it, ffmpeg only seeks to the last keyframe, and those sit far
    apart in Playwright's recording.
  - If a capture creates data (e.g. an attachment), the spec removes it again
    through the API – and with `superuserCredentials()`. The group „Editor“ of
    the capture account only has level "edit" on all domain models and may not
    DELETE (`RoleBasedPermission`); the API answers with 403.
- Composite grids are assembled and therefore **not** 3584 × 2240, but 2656 px
  wide at a height that follows from the map extent of the tiles (most recently
  2656 × 1854). The aspect ratio of the assembly cannot be brought to both target
  dimensions at once; in the manual the images are rendered at 512 px anyway.
- The map tiles are generated once by `scripts/setup-local-qonnectra.sh` through
  Planetiler (region `schleswig-holstein`, where the test project lies) and
  stored under `~/.local/share/qonnectra-local-tiles/` – outside `local-app/`, so
  that `--reset` does not throw them away. The `tileserver` gets them as a hard
  link at `local-app/deployment/tiles/germany.mbtiles` (a bind mount for the file
  alone fails, because Docker cannot create the mount point inside the read-only
  mounted `/data`).
  Map images therefore show the real vector base map in light mode. If the
  `.mbtiles` is missing (run with `--skip-tiles`, no Java), the `tileserver` runs
  in a restart loop and the map falls back to OSM raster tiles.

- If the API answers with **502** although the backend container is running:
  after a restart of the backend, `nginx` has cached its old container IP
  (nginx log: "Host is unreachable") and does not resolve it again. Fixed by
  `docker restart qonnectra_nginx_prod`. The setup project waits a minute on 5xx
  responses, because a cold-started stack answers with 502 for a while.
- The number of canvas elements in the map depends on the tileserver: with vector
  tiles OpenLayers creates two, in the OSM raster fallback one. So use
  `page.locator('div.map canvas').first()`.
- Always set the map position through `page.addInitScript()`, not through
  "load, set `localStorage`, reload". The app writes `mapCenter` and `mapZoom`
  back on every `moveend`; if that lands between setting and reloading, the seed
  is gone and the map starts at the overview. Tests that click on a particular
  spot then hit nothing and the info box does not open (symptom: `#drawer-title`
  not found).
- The base map layer is independent of object selection: `getClickedFeatures`
  filters via `layerFilter` down to trench, address, node and area
  (`MapInteractionManager.svelte.ts`). Whether the tileserver runs therefore has
  no influence on clicks.
- Selecting a map object by clicking is not reproducible without help: a trench
  line is only a few pixels wide, and below it lies the project area whose
  surface covers the entire network. The same spot yields different trenches or
  the area depending on the run. Clicking repeatedly does not help (it is not a
  tile race) – for a deterministic hit, hide the layer „Gebiet“ before the click.
  Switching it back on afterwards is not possible, because the opened info box
  covers the legend.
- The window height of 1120 px is measured against the navigation bar: with all
  groups expanded it needs 1093 px of content (measured); at the earlier 800 px
  the group „System“ sat below the visible area and had to be scrolled into view
  first. If the bar grows past 1120 px, raise the viewport in
  `playwright.config.ts` and do **not** collapse groups; that would be a state
  users have to produce themselves first. The scroll container of the bar is its
  grid, reachable through `div[class*="grid-rows-[auto_1fr_auto]"]`
  (`SideBar.svelte`).

**The app (context for selectors and routes)**

SvelteKit + Skeleton. The navigation bar is sorted into groups; the labels are
short and only unambiguous together with their group (group „Rohr“ →
„Verwaltung“ = Rohrverwaltung). Routes and labels:

| Group | Route → Label |
|---|---|
| „Info“ | `/dashboard` „Dashboard“, `/map` „Karte“ |
| „Funktionen“ | `/fault-simulation` „Störungsanalyse“, `/post-compaction` „Nachverdichtung“, `/pipeline-records` „Leitungsauskunft“, `/valuation` „Wertermittlung“ |
| „Rohr“ | `/conduit` „Verwaltung“, `/trench` „Zuordnung“, `/pipe-branch` „Verzweigung“, `/house-connections` „Mikrorohre“ |
| „Kabel“ | `/network-schema` „Netzschema“, `/trace` „Faserweg“ |
| „Gebäude“ | `/address` „Adressen“ |
| „System“ | `/admin/logs` „Logs“, `/settings` „Einstellungen“ |

Plus `/login` without a navigation bar. Which entries appear depends on the
permissions (`canAccessRoute`); as superuser all are visible. With the default
capture account (group „Editor“) the entry „Logs“ is missing from the group
„System“ – the group consists only of „Einstellungen“ there. `/admin/*` is the
only blocked path; everything without its own `RoutePermission` entry counts as
allowed.
Navigation definition: `local-app/frontend/src/lib/config/navLinks.ts`,
UI texts: `local-app/frontend/messages/de.json`.

## Subagents

- `manual-author` – new or extended manual chapters in the style above
- `screenshot-automation` – write and run Playwright specs for screenshots/videos
- `manual-review` – style, consistency and spelling check before committing
