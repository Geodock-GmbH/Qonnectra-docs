# CLAUDE.md

Guide for Claude Code in this repository.

**Language: everything is English** – identifiers, comments, script and console
output, CLI flags, commit messages and this file. German survives in exactly
three places, each for a reason:

1. **The manual itself** – `manual/` prose, alt texts, chapter file names
   (they are public URLs) and the chapter and section titles in `OUTLINE.md`,
   which go into the manual verbatim. Everything around them in `OUTLINE.md` is
   English like the rest.
2. **Literals quoted from the German app** – Playwright selectors
   (`getByRole('tab', { name: 'Trasse' })`), UI labels cited in comments, demo
   data values (`"Testprojekt"`, `"Hausanschluss"`).
3. **Test titles** – they mirror the manual's chapter headings 1:1, so a failing
   capture points straight at the chapter to fix.

Everything else is English. When in doubt, English.

## Glossary

Derived from the image names and the identifiers of the app, so that code,
`public/images/` and `local-app/` agree:

| German | English | German | English |
|---|---|---|---|
| Trasse | trench | Aufnahme | capture |
| Rohr | conduit | Ausschnitt | crop |
| Mikrorohr | microduct | Schleier | scrim |
| Netzknoten | node | Kontur | outline |
| Gebiet | area | Zeiger | cursor |
| Adresse | address | Vorlauf | lead-in |
| Wohneinheit | residential unit | Verzögerung | delay |
| Kabel | cable | übernommen | published |
| Faser | fiber | übersprungen | skipped |
| Bündel | bundle | Balken | bar |
| Spleiß | splice | Legende | legend |
| Kennzeichen | flag | Diagramm | chart |
| Gewährleistung | warranty | Frist | deadline |
| Anhang | attachment | Reiter | tab |
| Kapitel | chapter | Grabenprofil | trench profile |
| Störungsanalyse | fault simulation | Verzweigung | pipe branch |
| Nachverdichtung | post compaction | Netzschema | network schema |
| Leitungsauskunft | pipeline record | Faserweg | fiber trace |
| Auskunftsbereich | inquiry area | Einstellungen | settings |
| Wertermittlung | valuation | Rohrzuordnung | conduit connection |

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
| `manual/index.md` | Start page „Über dieses Handbuch“ – no chapter number | – |
| `manual/teil-a-anwenderhandbuch/` | A – User manual (web application, no GIS knowledge) | 1–18 |
| `manual/teil-b-betrieb-admin-qgis/` | B – Operations, administration, QGIS | 19–28 |
| `manual/teil-c-entwicklungs-systemdokumentation/` | C – Development and system documentation | 29–36 |

## The chapter structure

`OUTLINE.md` in the repo root is the binding outline: three levels (part,
chapter, section), derived from the app of version 1.7.0. It also holds the
mapping from the old numbering to the new one and is excluded from the VitePress
build (`srcExclude`). **Which sections a chapter has is decided there, not while
writing** – a chapter that needs a section the outline does not have gets the
outline updated in the same commit.

| Part | Chapters |
|---|---|
| A | 1 Erste Schritte · 2 Grundbegriffe und Datenmodell · 3 Wiederkehrende Bedienelemente · 4 Dashboard · 5 Karte · 6 Störungsanalyse · 7 Nachverdichtung · 8 Leitungsauskunft · 9 Wertermittlung · 10 Rohrverwaltung · 11 Rohrzuordnung · 12 Rohrverzweigung · 13 Mikrorohre · 14 Netzschema · 15 Faserweg · 16 Adressen · 17 Einstellungen · 18 Wenn etwas nicht funktioniert |
| B | 19 Rollen und Rechte · 20 Der Administrationsbereich · 21 Projekte und Stammdaten pflegen · 22 Projektbezogene Konfiguration · 23 Dateien und Anhänge verwalten · 24 Daten importieren und exportieren · 25 QGIS-Arbeitsplatz einrichten · 26 Netzdaten in QGIS bearbeiten · 27 QGIS-Server und Kartendienste · 28 Betrieb der Instanz |
| C | 29 Architekturüberblick · 30 Entwicklungsumgebung · 31 Datenmodell des Backends · 32 REST-API · 33 Frontend · 34 Qualitätssicherung · 35 Bereitstellung und Infrastruktur · 36 Erweitern und mitwirken |

Chapters 4–17 follow the left navigation bar of the app from top to bottom
(groups „Info“, „Funktionen“, „Rohr“, „Kabel“, „Gebäude“, footer „System“), so
that manual and interface can be read side by side. Chapters 1–3 come first
because the rest builds on them: table handling, the layer tree, the info box
with its tabs, attachments and the export formats are explained once in chapter
3 and only linked afterwards. Chapter 18 collects the error cases that would
otherwise be repeated in every chapter.

Numbering runs contiguously inside a part; the free numbers sit at the part
boundaries. A chapter inserted in the middle of a part therefore renumbers the
following ones – file name prefix, H1, spec name, screenshot folder and cross
references, `OUTLINE.md` first. The chapter number in the H1 **and** in the
file name prefix have to match (`10-rohrverwaltung.md` →
`# 10. Rohrverwaltung`); the sidebar is generated from file name order + H1
(`vitepress-sidebar`).

Two chapters of part A depend on administration work and link into part B: the
„Wertermittlung“ needs cost rates, the „Rohrverzweigung“ needs configured
`PipeBranchSettings` – without them the app only shows a hint. Both are set in
chapter 22.

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
`11-rohrzuordnung.md` as templates. The manual is written in German, so the rules
below quote German.

**Precision over completeness** – the manual is written for people who have the
app in front of them.
- Explain what users cannot work out for themselves. Leave out what the
  interface already tells them: the eye symbol in the password field, that a
  click on a tab switches the view, that a long list can be scrolled.
- Do not describe how a value is typeset when the screenshot right next to it
  shows it („mit angehängtem „x““, „in fetter Schrift“). Name what a view
  contains, not how it looks.
- List chart and card titles instead of giving each one a sentence that merely
  repeats the title („„Trasse“ – Auswertungen zu den Trassen“).
- Explain a mechanism once, in the section it belongs to – not again in every
  section it also occurs in.
- Rule of thumb: a sentence that would be equally true of any other web
  application does not belong in the manual.

What does **not** fall under this: pitfalls, limits and behaviour that
contradicts expectation (see the next block). A cache that delays values, a
chart capped at ten entries, changes lost without a warning – those are the
sentences the chapter exists for.

**Form of address and tone**
- Consistently **Sie-Form**, instructions in the imperative: „Klicken Sie auf …“,
  „Geben Sie einen Suchbegriff ein.“
- Gender-neutral through a genuinely neutral form wherever one exists –
  participles and neutral nouns: „Nutzende“, „Verwaltungsmitarbeitende“,
  „Anwendende“, „die Projektleitung“. Where none does, use the Gendersternchen,
  asterisk plus **upper-case** ending, **always written with a backslash**:
  „Anwender\*Innen“, „Administrator\*Innen“, „Sachbearbeiter\*In“. Double naming
  („Anwenderinnen und Anwender“) does not count as a neutral form – use the
  asterisk there. Never leave a term in the generic masculine.
  The backslash is not optional: Markdown reads a bare `*` inside a word as
  emphasis, so two Gendersternchen in one paragraph italicise everything between
  them, and a single one pairs with the next `**` that comes along. Escape every
  one of them – body text, headings and image alt texts alike – not only where it
  currently breaks, because the next edited sentence moves that boundary.
  `pnpm lint:gender` checks it.
- Factual, no marketing tone, no emoji, no exclamation marks.
- Explain what does **not** work and where users get stuck as well
  („Andernfalls gehen die Änderungen ohne Warnung verloren.“, „Wenn der Button
  nicht sichtbar ist, scrollen Sie im Feld nach unten.“).

**Structure**
- No frontmatter in chapter files.
- Numbered headings: `# 10. Rohrverwaltung`, `## 10.1 Suchen und Filtern`,
  `### 10.3.1 Reiter „Eigenschaften“`. `####` stays unnumbered. `#` and `##` come
  from `OUTLINE.md`; `###` and deeper are the chapter's own business.
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
  `_Die Dokumentation zu diesem Kapitel ist noch in Arbeit._`, for a single
  section of a chapter that is otherwise written: `_Die Dokumentation zu diesem
  Abschnitt ist noch in Arbeit._`
- A heading that is linked to from somewhere gets no typographic quotation
  marks. VitePress carries the „ into the anchor
  (`_3-6-…-reitern-„eigenschaften-…`), so the cross reference becomes
  unreadable and is easy to get wrong. Headings that quote a UI label and that
  nothing links to – „4.1 Reiter „Übersicht““ – stay as they are.

**Markup**
- `**bold**` for technical terms and concepts on first appearance
  (**Rohrzuordnung**, **Transparenz**, **interaktive Legende**) and for states
  („Routing-Modus **eingeschaltet**“).
- `\*` for the Gendersternchen – never a bare `*` inside a word, see the gender
  rule above.
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

The one exception to the viewport is section 1.6 („Bedienung auf Tablet und
Smartphone“): its images have to show the state below the `md` breakpoint of
768 px and are therefore taken at **390 × 844** (`test.use({ viewport })` in the
describe block „Mobil“ of `tests/01-erste-schritte.spec.ts`). They are portrait
and are embedded with `{.small}`, never as an `.img-row` – that renders its
images in a 16-to-10 frame, in which a portrait screenshot shrinks to a stripe
in the middle.

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
- Name = English, `snake_case`, area first, detail second
  → `dashboard_trench_hover.jpg`, `map_legend_actions.jpg`, `conduit_search_columns.jpg`
- The prefix follows the area of the app the image shows, which for the chapters
  4–17 is the chapter's own area. Part A, chapters 1–18: `login_`, `model_`,
  `ui_`, `dashboard_`, `map_`, `fault_`, `compaction_`, `records_`, `valuation_`,
  `conduit_`, `conduit_connection_`, `pipe_branch_`, `microduct_`, `schema_`,
  `trace_`, `address_`, `settings_`, `error_`. Part B: `permission_`, `admin_`,
  `qgis_`, `ops_`. Part C: `dev_`.
- The cross-cutting chapters 1–3 and 18 illustrate mechanisms, not menu items.
  An image made for them uses their own prefix (`model_`, `ui_`, `error_`); an
  image they borrow from a concrete view keeps that view's prefix – chapter 3
  shows the layer tree with `map_legend.jpg` and the conduit table with
  `conduit_table.jpg`. `screenshots:publish` looks for the reference anywhere in
  `manual/`, so it does not care which chapter it sits in.
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

A video only earns its place where the movement itself carries the information:
a drag, a multi-step flow, a state that only exists while the cursor is
somewhere. Where a still image already shows the result – a tooltip, an
opened menu – the chapter gets no video of it in addition.

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
  `![](/videos/conduit_connection_map_find.webm)`
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
- Login uses the account **without** administration rights by default – that is
  the right one for the whole of part A. `QONNECTRA_LOGIN=admin pnpm test:e2e`
  switches to the superuser and is needed for the chapters 19–24 of part B,
  which show `/admin/*`. Images from an admin run otherwise show an interface
  that does not exist for the audience of part A (extra menu entry „Logs“, every
  permission check bypassed).
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
- Chapter 1 („Erste Schritte“) is the only one that also needs the logged-out
  state: the images of the login page sit in a `test.describe` block with
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

SvelteKit + Skeleton, currently version **1.7.0** (the app shows it in the
header). The navigation bar is sorted into groups; the labels are short and only
unambiguous together with their group (group „Rohr“ → „Verwaltung“ =
Rohrverwaltung). This order is the order of the chapters 4–17. Routes and
labels:

| Group (`id`) | Route → Label | Chapter |
|---|---|---|
| „Info“ (`main`) | `/dashboard` „Dashboard“, `/map` „Karte“ | 4, 5 |
| „Funktionen“ (`procedure`) | `/fault-simulation` „Störungsanalyse“, `/post-compaction` „Nachverdichtung“, `/pipeline-records` „Leitungsauskunft“, `/valuation` „Wertermittlung“ | 6–9 |
| „Rohr“ (`infrastructure`) | `/conduit` „Verwaltung“, `/trench` „Zuordnung“, `/pipe-branch` „Verzweigung“, `/house-connections` „Mikrorohre“ | 10–13 |
| „Kabel“ (`cable`) | `/network-schema` „Netzschema“, `/trace` „Faserweg“ | 14, 15 |
| „Gebäude“ (`address`) | `/address` „Adressen“ | 16 |

Below them sits a footer under the heading „System“ – not a group of its own but
`footerLinks`: `/admin/logs` „Logs“, `/settings` „Einstellungen“ and the
external link „Dokumentation“ from `PUBLIC_DOCUMENTATION_URL`. The footer is
never hidden by the customize controls. Plus `/login` without a navigation bar.

Which entries appear depends on the permissions (`canAccessRoute`); as superuser
all are visible. With the default capture account (group „Editor“) „Logs“ is
missing from the footer, which then consists of „Einstellungen“ and
„Dokumentation“. `/admin/*` is the only blocked path; everything without its own
`RoutePermission` entry counts as allowed.

Nutzende can customize the bar themselves: the icon next to the logo („Seitenleiste
anpassen“) switches on per-entry hide toggles, groups can be collapsed, and both
are persisted per `id` in `sidebarPreferences`. Captures show the default state –
everything visible, all groups expanded. Below 768 px the bar is replaced by
`MobileNav`, where the group „Info“ (`pinnedToBar`) sits in the bottom bar and
the rest in a „Mehr“ menu; that is the state chapter 1.6 describes.

Navigation definition: `local-app/frontend/src/lib/config/navLinks.ts`,
UI texts: `local-app/frontend/messages/de.json`.

## Subagents

- `manual-author` – new or extended manual chapters in the style above
- `screenshot-automation` – write and run Playwright specs for screenshots/videos
- `manual-review` – style, consistency and spelling check before committing
