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

The same trap in the other direction, and this one is the app's: **„Seitenleiste“**
is what it calls the navigation bar („Seitenleiste anpassen“,
`action_customize_sidebar`) *and* the detail panel on the right („Seitenleiste
schließen“, `tooltip_close_drawer`). The manual therefore never uses the word for
the panel – that is the **Info-Box** throughout, in body text, headings and alt
texts alike (section 3.6). Quote the two tooltips verbatim where the reader has to
find them, but say Info-Box around them. Not „Infobereich“, not „Detailanzeige“,
not a bare „Box“.

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
chapter, section), derived from the pinned app (`main` of 2026-09-11). It also holds the
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
pnpm lint:captures    # static rules for the specs and the embedded videos – see shoot() below
pnpm test:e2e:setup   # write the login states to auth-state.json + admin-auth-state.json
pnpm test:e2e         # images and videos of both parts whose specs are stale against tests/captures.lock
pnpm test:e2e --all   # every spec
pnpm test:e2e tests/05-karte.spec.ts   # named specs, stale or not

scripts/setup-local-qonnectra.sh            # build/start the local Qonnectra instance
scripts/setup-local-qonnectra.sh --reset    # discard data + secrets, rebuild
scripts/install-local-ca.sh                 # import the dev CA once per machine
scripts/build-map-tiles.sh <osm-pbf-url>    # build a new map tile set (only to move the pin)
scripts/qonnectra-demo-data/fetch_geodock_export.py --out scripts/qonnectra-demo-data/testprojekt-export.json
                                            # pull the demo data from app.geodock.de again
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
- Never point the reader at the demo project. „Testprojekt“ and its data exist
  for the captures, not for the manual: „Im Testprojekt sind das sechs von 118
  Netzknoten“ says nothing about the reader's own installation, and a count from
  it goes stale with the next import. Write what holds in general („meist nur
  den Begriff „Defekt““, „ein Netzknoten mit einigen hundert Fasern“) and leave
  the concrete example to the screenshot. The same goes for alt texts.
- Rule of thumb: a sentence that would be equally true of any other web
  application does not belong in the manual.
- Name what the reader sees, not what the app is built with. Parts A and B
  never mention the frameworks behind Qonnectra – no „Django-Berechtigungen“,
  but „das Feld „Berechtigungen“ im Gruppenformular“. Part C is the place
  for Django, SvelteKit and the like; chapter 28 names the services an
  operator runs (`nginx`, `caddy`, the containers), because that is what
  they type.

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
  („Sie erreichen sie über die linke Navigationsleiste durch Klicken auf den
  Menüpunkt „Rohrverwaltung“.“), followed directly by an overview screenshot.
  **Navigationsleiste**, not „linke Navigation“ – chapter 1.2.1 introduces the
  term and the chapters 4–17 all repeat this sentence.
  The chapters 25 and 26 are the exception and carry no screenshots at all: QGIS
  is a desktop application, no Playwright spec can capture it, and a hand-made
  image would be the only one in the manual nobody can regenerate. Both stay
  short, describe what is specific to Qonnectra and link to the official QGIS
  documentation for what QGIS itself documents. Chapter 27 is not affected –
  QGIS projects and external WMS sources are maintained in Qonnectra.
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
| Data | exclusively the demo project „Testprojekt“ – no personal data, see below |

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

**Personal data in images**

Every image and every video is checked for personal data **before publishing**,
and again whenever a spec starts filling fields itself. A published image goes
into a public repository and onto a public website; it cannot be recalled. The
places in the app that can show personal data:

| Where | What |
|---|---|
| Leitungsauskunft | „Organisation“, „Name“, „Telefon“, „Mobil“ |
| Wohneinheit | „Name des Bewohners“, „Erfassungsdatum Bewohner“ |
| Nachverdichtung | „Kommentar“ in the export dialog, and the PDF built from it |
| Anhänge | file names of uploaded documents and photos |
| `/settings` | „Benutzername“ and the e-mail address of the logged-in account (chapter 17) |
| `/admin/*` | the user accounts of the instance including e-mail (chapters 19–24, 27 and 28) |
| `/admin/auth/user/` | the two real accounts of the instance in every unfiltered user list – capture the list filtered to the placeholders (`?q=mustermann`) |
| `/admin/api/qgisproject/` | the account that uploaded the project (column headed „Erstellt am“ by a mistranslation) – in captures the local superuser, whose name is the fixed `admin` of the setup |
| `/admin/api/attributescompany/` | „Telefon“ and „E-Mail“ of the companies – the demo companies have not been checked, capture the add form with placeholder values instead of the list |
| `/admin/api/residentialunit/` | „Name des Bewohners“ – never captured |
| `/admin/logs` and `/admin/api/logentry/` | user names, request paths and IP addresses in the log entries – the spec seeds its own entries and filters the view to them |

The last two are the reason the images of the administration area need a second
look: the accounts they show belong to whoever set the instance up. For the
chapters 19–24, 27 and 28 `playwright/admin-users.ts` therefore creates three recognisable
placeholder accounts for the length of the run – „Erika Mustermann“ (group
`Admin`), „Max Mustermann“ (`Editor`), „Moritz Mustermann“ (`Viewer`), e-mail at
the reserved TLD `.example` – and removes them again afterwards. They are not
demo data; they exist so that a capture of the user list shows a group
membership at all.

- Never make up plausible data. An invented name with a real dialling code
  („M. Petersen“, „04631 123456“) is indistinguishable from a real contact in
  the image, and nothing in the manual tells readers otherwise. That it was
  invented is worth nothing to the person whose name it happens to be.
- Use recognisable placeholders: **„Max Mustermann“**, **„Erika Mustermann“**,
  **„Musterbau GmbH“**, **„Stadtwerke Musterstadt“**, and phone numbers of the
  form **`0123 456789`** – an ascending run of digits behind the unassigned
  prefix 0123. Anyone looking at the image can see at a glance that it is a
  placeholder.
- Leaving the field empty is the second-best option: it shows the layout but not
  what belongs in the field.
- Everything a spec creates for a capture uses these placeholders, in the seeded
  records as well as in forms filled in for an image – also where the crop does
  not show the field, because the record sits in the database for the length of
  the run.
- The demo data of „Testprojekt“ is the one exception and stays as it is:
  addresses and residential units come from the export and are checked once at
  the source (`scripts/qonnectra-demo-data/`). Whether the demo data itself is
  fit to be published is decided there, not per image.

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
3. **Annotation in brand green** (`#11ba81`) – outlines around regions or
   controls, curved arrows and labels on white chips, drawn by `annotate()` in
   `playwright/manual-shots.ts`. For orientation images with several labels at
   once (`login_navigation.jpg`). Boxes frame regions, ellipses circle
   controls; a label is the manual's own term for the thing it names.
4. **Composite grid** – 2 × 2 individual images with white gutters, each step
   numbered with a large green digit in the bottom right; the digits correspond
   to the steps of the numbered list in the text (`map_search_flow.jpg`,
   `map_legend_actions.jpg`).

Patterns 2 and 3 can be combined – both are overlays above the page. Videos are short,
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
- The app is **pinned to a commit**, `QONNECTRA_REF` at the top of the script,
  currently **`aa28575`** (the tip of `main` on 2026-09-11) – not the default
  branch. Every image of the manual has to show the same version; unpinned, a CI
  run and a laptop built two different apps and the images differed without
  anyone being able to see why. An existing `local-app/` is switched to the
  pinned commit on the next run; if it carries uncommitted changes the script
  stops instead (`--reset-checkout` throws the checkout away).
  A commit and not the tag `v1.7.0`, because part A was surveyed and written
  against that state and describes what it does: the edit mode of the cable
  labels (chapter 14.4, „Kabel bearbeiten“) came with app PR #88 **after** the
  v1.7.0 release, and against the tag the chapter describes an app that is not
  there. The app reports **1.7.0** in its header either way – that is the
  version of the last release, not of the checkout, so the number in a
  screenshot says nothing about which commit produced it.
  Raising the pin is its own piece of work, not a side effect: bump
  `QONNECTRA_REF`, regenerate the screenshots, go through what changed in the
  app, and update the commit in this file and in `OUTLINE.md`.
  `QONNECTRA_REF=… ` looks at another version – images from such a run are not
  committed.
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
  during setup. Select it in the top left after logging in. It always gets the
  primary key **2** – the Playwright setup pins `selected-project=2`, so a
  re-import must not hand out a new id (`PROJECT_ID` in
  `import_geodock_export.py`).
- The export is pulled with `scripts/qonnectra-demo-data/fetch_geodock_export.py`
  against app.geodock.de; credentials go into `scripts/qonnectra-demo-data/.env`
  (gitignored, template `.env.example`). Four endpoints stay closed to that
  account (`wms-sources`, `node-slot-divider`, `node-slot-clip-number`,
  `node-trench-selection`) – what that costs is in the README next to the
  script. Attachments come in as metadata only; the files themselves stay on
  api.geodock.de.
- `local-app/` is gitignored (foreign checkout) – never commit it and only change
  it through the setup script.

**Playwright setup in the docs repo**

All runs go exclusively against the local instance. There is no configurable
target address and no `.env` in the repo root any more – `GEODOCK_URL` is no
longer read.

- **The specs run in a container, not on the machine you are sitting at.**
  `scripts/capture.sh` (and with it `pnpm test:e2e`) starts them in the image
  from `playwright/capture.Dockerfile`; the app stack stays on the host and is
  reached through `--network host`.
  The reason is one line in the app: `--font-family: system-ui` (`app.css`),
  with no webfont shipped. Every glyph in every screenshot therefore comes from
  the fonts of whoever runs the browser – a developer machine resolves
  `system-ui` to Noto Sans, a GitHub runner to something else, and the first CI
  run reported **all 50 images** as changed, text everywhere, differences up to
  236 of 255. Fonts are only half of it: freetype and harfbuzz decide the
  hinting and differ between distributions too, so installing the same font on
  the runner would not have been enough.
  The image pins Noto Sans (`playwright/capture-fonts.conf`) because that is
  what the published images already show; the Playwright base image on its own
  answers `system-ui` with WenQuanYi Zen Hei, a Chinese font for a German
  interface. Measured afterwards: the container produces images **byte-identical**
  to the ones the runner produces.
  `pnpm test:e2e:ui` is the exception and stays on the host – it is for finding
  selectors, and images from it must not be published.
- **The capture browser reaches nothing but the local instance**, and the one
  thing the app fetched from the internet is vendored. `ol-mapbox-style` loads
  the font of the base map labels as a web font from cdn.jsdelivr.net
  (`@fontsource/noto-sans`), about 800 ms into the page while the tiles are
  already rendering. A label measured before the font arrived used the Noto
  Sans of the capture image, one measured after it the web font, and the two
  differ in glyph widths – street names came out spaced differently from one
  run to the next („Bir ristoft“), depending on the latency of the CDN. The
  files now live in `playwright/fonts/noto-sans/` (version pinned in the README
  there) and `playwright/vendored-fonts.ts` answers the CDN URLs from disk and
  loads the faces at document start; `--host-resolver-rules` in
  `playwright.config.ts` makes every other external host fail at once, so the
  next hidden dependency becomes an error rather than a flaky image. This is
  why **every spec imports `test` from `playwright/test.ts`**, not from
  `@playwright/test`: the font route is an automatic fixture there, and
  `pnpm lint:captures` fails on a direct import. A request for a font file that
  is not vendored fails the test.
  The container needs the host's docker socket, which `capture.sh` mounts:
  `tests/04-dashboard.spec.ts` HUPs the gunicorn workers to drop the five-minute
  statistics cache (`clearDashboardCache()`), and without it exactly those two
  seeding tests fail while everything else passes.

- `playwright/local-app.ts` is the single source for address and credentials and
  reads `local-app/deployment/.env` (`APP_DOMAIN`, `API_DOMAIN`, `ADMIN_DOMAIN`,
  `APP_USER_*`, `DJANGO_SUPERUSER_*`). Only obtain credentials through
  `localApp()`, never write them into specs, output or commits.
- **Two different `/admin/`.** The app domain has exactly one route below it,
  `/admin/logs` (footer „Logs“, `RoutePermission`); everything else there
  answers with a 303 to `/login`. The administration area the chapters 19–24
  and 27 describe is the Django admin and sits on its own domain,
  `https://admin.qonnectra.localhost/admin/` (`ADMIN_DOMAIN`, routed by Caddy to
  the backend). The API domain blocks `/admin/*` with a 404 on purpose. Keep the
  two apart – a spec pointed at the wrong origin captures the login page without
  failing.
- Which account a spec uses follows from its chapter number, not from an
  environment variable. Two projects in `playwright.config.ts` split the run
  (plus `setup`): `chromium` takes images and videos with the account
  **without** administration rights against `APP_DOMAIN` and is the right one
  for the whole of part A, and `chromium-admin` matches the chapters 19 to 24,
  27 and 28 (`ADMIN_SPECS`), uses the Django superuser and has `ADMIN_DOMAIN`
  as its `baseURL`, because those chapters show the Django administration.
  Apart from login and origin the two are the same: both take images and
  videos, and `pnpm test:e2e` selects the specs of both against
  `tests/captures.lock`.
  The admin specs write the path in full (`page.goto('/admin/auth/user/')`) –
  Playwright resolves an absolute path against the origin alone, so a `baseURL`
  ending in `/admin` would be dropped. `pnpm test:e2e` runs `chromium` and
  `chromium-admin` and so covers the stale specs of both parts in one run.
  There is no switch to run part A as superuser: its images would show an
  interface that does not exist for its audience (extra menu entry „Logs“,
  every permission check bypassed). An app view that only the superuser can
  open belongs to a spec matched by `ADMIN_SPECS`.
- `playwright/auth.setup.ts` runs as a setup project automatically before every
  spec: it checks reachability (with a pointer to
  `scripts/setup-local-qonnectra.sh` if the stack is down), logs in and writes
  both states – `auth-state.json` with the account without administration rights and
  `admin-auth-state.json` always with the superuser. `pnpm test:e2e:setup` runs
  only this step.
- **Two logins, because the instance has two authentication mechanisms.**
  Frontend and REST API work with the JWT cookies `api-access-token` /
  `api-refresh-token` from `POST /api/v1/auth/login/`; the Django administration
  works with a session and needs `sessionid` (plus `csrftoken` for forms) from
  the form under `/admin/login/`. The JWT does reach the admin domain – all
  these cookies carry `Domain=.qonnectra.localhost` (`SESSION_COOKIE_DOMAIN` /
  `CSRF_COOKIE_DOMAIN`, set by `USE_COOKIE_DOMAIN_MIDDLEWARE`) – but Django does
  not evaluate it there, and `/admin/` answers with a 302 to `/admin/login/`.
  `admin-auth-state.json` therefore carries both, so that a chapter of part B
  can also show an ordinary app view. The form POST needs a `Referer` header:
  Django checks it on HTTPS against `CSRF_TRUSTED_ORIGINS`, and an
  `APIRequestContext` sends none by itself (symptom: 403 instead of a session).
- **Dates in the Django administration cannot be frozen**, and CI compares
  every published image with a fresh capture. `freezeDates()` rewrites API
  responses on their way into the page; the Django admin renders on the server,
  so nothing passes through a route. Run-dependent values sit in the „Neueste
  Aktionen“ box of the index page (filled by `admin-users.ts` among others), in
  „Letzte Anmeldung“ / „Mitglied seit“ of the user form, in date columns and
  filters of list views and in the IDs of records the run created. Avoid or crop
  them, check every image of the chapters 19–24, 27 and 28 for dates, times and
  IDs and run its spec twice before publishing. An image that still carries
  such a value is reported to the user as a warning, not published silently.
  What cannot be avoided is **set** instead: `runInBackend()` in
  `playwright/backend-shell.ts` runs a snippet through `manage.py shell` in the
  backend container, and a spec pins the stamped value to `CAPTURE_DATE` from
  there – `date_joined` of the placeholder accounts (`admin-users.ts`),
  `created_at` of the demo attachments, `created_at` and `created_by` of an
  uploaded QGIS project, `updated_at` of a seeded user-settings row, the
  timestamps of seeded log entries, `history_date` of the history a spec shows.
  `auto_now`/`auto_now_add` ignore a value passed to `save()`, so these go
  through `QuerySet.update()`, which bypasses them. The „Neueste Aktionen“ box
  is cleared the same way at the start of the spec that shows the index page
  (`django.contrib.admin.models.LogEntry`) – it lists whatever the superuser
  last did by hand on this machine, and nothing in it is worth keeping.
- Neither state file is reusable; both are regenerated per run: the access
  token lives for 15 minutes, and the backend rotates refresh tokens with a
  blacklist (`ROTATE_REFRESH_TOKENS` + `BLACKLIST_AFTER_ROTATION`). A run of
  every spec takes around 25 minutes, so `test` from `playwright/test.ts` logs
  in again before a test when less than 5 minutes of the token are left and
  swaps the two auth cookies in the file – in both state files, each with its
  own account; the Django session in `admin-auth-state.json` lives for two
  weeks and is left alone. Without it everything after the first quarter of an
  hour lands on the login page.
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
- The file name suffix `-video` is how a spec says it records. `pnpm
  lint:captures` holds every `-video` spec to the recording size of the
  viewport and to `postProcessVideo()`, and no other spec may record at all.
- **`pnpm test:e2e` runs only stale specs.** `scripts/capture-fingerprint.sh`
  hashes, per spec, everything its captures depend on: the environment every
  capture is made in (`playwright.config.ts`, the capture image and its fonts,
  `scripts/capture.sh`, the setup script with app pin, tile pin and patches,
  the demo data, the auth setup, the installed Playwright version), the spec
  and every file it imports – traced through the import statements, so a
  video spec does not depend on the screenshot helper – and, for image specs,
  the JPEG settings of the publish script. `tests/captures.lock` holds the
  hash each spec was last published under. A spec whose hash matches is
  skipped; `--all` runs everything, named spec files always run. Precise on
  purpose: with the strict lock in CI a stale spec costs a run and a stale
  video spec a decision about re-recording, so a changed helper stales only
  the specs that import it, and a comment in the publish script none.
  After a run, `scripts/capture.sh` stamps every spec whose tests all passed in
  `tests/.capture-stamps` (gitignored) with the hash it ran under; a run
  filtered below the spec level (`--grep`, `file:line`) stamps nothing.
  `pnpm screenshots:publish` moves the stamps into the lock – **commit the lock
  together with the images and videos.** CI never writes it (`--no-lock`) and
  fails outright on a stale spec – only a local run and publish can bring the
  lock forward. A pull request then runs what it touched since its base
  (`scripts/capture-fingerprint.sh --touched`): a changed spec, a changed
  published image or video, a changed lock line – the claim to have
  republished that spec – or every spec for a change to a shared input.
  `main` runs everything.
- **Videos follow a different rule from the images, deliberately.** An image is
  judged by its content – the same view has to come out the same, and CI checks
  it. A recording cannot: it is a screencast of a real interaction, and its
  length follows render and network latency (measured across two runs: all 13
  videos differed, 1 to 19 frames apart, while only 8 of 137 images did). They
  are therefore judged by their provenance – a video is renewed when its spec
  or the app version changed, not because a run happened. `screenshots:publish`
  therefore only replaces a video whose spec passed in the last run under a hash
  other than the one in `tests/captures.lock`; a full run renews nothing that
  has not changed. The fingerprint cannot tell a change that alters a recording
  from one that cannot, so for the second kind – a comment in the setup script,
  an option in the config with no bearing on a recording – publish with
  `--keep-videos`: it stamps every video spec that passed without touching the
  recordings. The run is still owed; only the re-recording is waived. Hence also `screenshots:publish --images` in CI, and no
  tolerance gate for `public/videos/`. What there is instead is
  `tests/videos.lock`: the sha256 of every published video, written by
  `screenshots:publish` and checked by `pnpm lint:captures` – the one check
  that reads the committed file, so a video that was republished but not
  committed, a merge that kept the wrong side and a corrupt file all fail.
  What does **not** follow from that: a video may show whatever it likes. It
  sits in the same manual as the images, so the same data rules apply –
  placeholders instead of personal data, and `freezeDates()` wherever the app
  shows a date the backend stamped. `map_attachment.webm` ended on the day it
  was recorded while `conduit_attachment.jpg` showed `CAPTURE_DATE`; that is a
  contradiction in the manual, not a capture detail.
  Nor does it follow that a recording goes unchecked. The specs assert their
  way through every step, so a moved button fails long before anyone notices it
  in the manual, and `postProcessVideo()` checks its own result
  (`verifyVideo()`): VP8, width 900 to 1400 px, 3 to 120 s, at least 20 KB,
  and a frame from the middle that is not empty. The last one is the point: the
  crop runs after the recording and knows nothing about the layout, so it can
  end up pointing past the interface while every assertion still passes.
  `pnpm lint:captures` covers what needs no run – every image and every video
  the manual embeds exists in `public/` and has a spec that captures it, and no
  committed spec focuses or skips a test (`forbidOnly` in `playwright.config.ts`
  fails a `test.only` in CI as well). What CI never does is compare a recording
  with the published one.
- **Captures go exclusively through `shoot()` resp. `shootTile()`**, never
  through `page.screenshot()` or `locator.screenshot()`. `pnpm lint:captures`
  fails on a direct call. Reason: both default to `animations: "allow"`, and
  the frontend is Svelte 5, whose transitions run through the Web Animations
  API. `disableAnimations()` only injects CSS and cannot reach them, so the
  capture lands somewhere in the middle of the movement – that is how
  `login_mobile_more.jpg` came out with the menu at a different slide offset on
  every run. `shoot()` passes `animations: "disabled"`, which the browser
  applies to CSS animations, CSS transitions **and** Web Animations.
  Both also wait until the canvases of the page have stopped changing
  (`waitForBaseMapSettled()`, see „Labels of the base map“ below), and `shoot()`
  snaps a `clip` to the grid Chromium captures on: origin on whole device
  pixels, size truncated to whole CSS pixels. A crop at an arbitrary fraction
  is resampled, and `fault_result_detail` differed in 272 000 pixels between
  two runs without any pixel being off by more than 19 of 255. Snapped any
  other way the image shifts by a device pixel or grows by two – measured on
  the published images, see `wholePixels()`.
- Output goes to `tests/screenshots/<chapter-slug>/<name>.png` through
  `shotPath()` resp. `tests/videos/<chapter-slug>/<name>.webm` through
  `videoPath()`. `tests/screenshots/`, `tests/videos/`, `test-results/`,
  `playwright-report/`, `auth-state.json` and `admin-auth-state.json` are
  gitignored – those are raw captures, not the files of the manual.
- `pnpm screenshots:publish` (`scripts/publish-screenshots.sh`) publishes them to
  `public/images/manual/…` resp. `public/videos/…` and converts images to JPEG in
  the process (quality 85, lowered until the file is under 1.2 MB); videos are
  only copied, cropping and encoding are done by the spec. The target comes from
  the manual itself: the script looks for the reference
  `/images/manual/<part>/<name>.jpg` resp. `/videos/<name>.webm` in `manual/`.
  Captures without a reference are skipped, so that nothing ends up in the wrong
  folder. `--dry-run` converts and compares like the real run and reports every
  image as new, changed or unchanged without writing anything, `--videos` and
  `--images` restrict the run to one kind. Videos are gated by the lock, see
  above; `--force` publishes them regardless.
- An image whose picture matches the **committed** one is **not** written; the
  run reports it as „unchanged“. Without that gate every run rewrote nearly
  every file – one commit rewrote 99 of 137 images, 72 of them without any
  visible difference. The tolerance is **zero** (`DIFF_FUZZ`, `MAX_DIFF_PIXELS`
  in the script): the captures are reproducible, 127 of 137 images of a run
  came out pixel-identical to the committed JPEG, and every one of the rest had
  a cause in a spec. The 10 % fuzz the gate had before hid a genuine change –
  „2.5“ became „2,5“ with the German locale, 10 to 19 pixels at that tolerance,
  and five images stayed stale. An image that differs on every run is a spec to
  fix, not a reason to raise the tolerance; the known causes are listed below.
  The comparison runs against HEAD, not against the working tree: a transient
  caught in one run and gone in the next otherwise leaves a chain of rewrites
  behind. A working tree file that differs from HEAD while the capture matches
  HEAD is restored from it („restored“). `--force` writes anyway.
- Two capture folders with the same file name make the script abort. The chapter
  renumbering left `tests/screenshots/03-einstieg-anmeldung/` next to
  `01-erste-schritte/`, and because „03“ sorts after „01“ six `login_*` images
  were published from weeks-old captures on every run – silently, over the fresh
  ones. When a chapter is renumbered, its capture folder is renamed with it.
- Every pattern goes through automatically, and nothing in `public/` is edited
  by hand after publishing: a file that is not what its spec produced fails CI.
  To renew only a video, use `--videos`.
- Chapter 1 („Erste Schritte“) is the only one that also needs the logged-out
  state: the images of the login page sit in a `test.describe` block with
  `test.use({ storageState: { cookies: [], origins: [] } })`, the images of the
  interface next to it in the normal logged-in state. The app redirects
  logged-in calls of `/login` to `/map`.
- `workers: 1` and `fullyParallel: false` are deliberate: all specs share one
  instance including project selection and map position.
- **Test inputs that are not code** sit in `playwright/fixtures/` – currently
  `netzdokumentation.qgs`, a hand-written minimal QGIS project with three
  PostGIS layers (trench, node, address) over the service connection of the
  stack, which chapter 27 uploads and serves as its WMS source. A helper names
  such a file as `new URL('./fixtures/x', import.meta.url)`; that is what
  `scripts/capture-fingerprint.sh` follows to make the file an input of every
  spec that reaches it, the same as an import. Only files git tracks count –
  `local-app.ts` names `local-app/deployment/.env` the same way, and its
  per-machine secrets must not stale every spec. One trap in the `.qgs`: QGIS
  Server 3.44 leaves a layer with the id `node_layer` out of GetCapabilities
  without a message and still renders it.
- Determinism helpers in `playwright/manual-shots.ts`: `shoot()` (the one way to
  capture, see above) and `shootTile()` for the tiles of a composite,
  `disableAnimations()` (CSS transitions and text caret off – not enough on its
  own), `waitForAnimations()` (waits until every finite Web Animation has
  finished – `spotlight()` and `crop16by10()` call it before they measure,
  because `toBeVisible()` passes at the first frame of a 200 ms slide and the
  cut-out of `compaction_search` ended after two of five hits that way),
  `moveCursorAway()` (no hover states in the
  image), `spotlight()` for pattern 2 and `composite2x2()` for pattern 4. The
  grid is assembled in the browser, so the repo needs no image library.
  `annotate()` draws pattern 3 the same way as `spotlight()`: an SVG above the
  page with outlines, arrows and labels, measured after `waitForAnimations()`.
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
- The map tiles are **downloaded**, not generated: `scripts/setup-local-qonnectra.sh`
  fetches a finished `.mbtiles` (region `schleswig-holstein`, where the test
  project lies) from a release of this repo (tag `tiles-<TILE_ID>`) and stores
  it under `~/.local/share/qonnectra-local-tiles/` – outside `local-app/`, so
  that `--reset` does not throw it away. The `tileserver` gets it as a hard
  link at `local-app/deployment/tiles/germany.mbtiles` (a bind mount for the file
  alone fails, because Docker cannot create the mount point inside the read-only
  mounted `/data`).
  Map images therefore show the real vector base map in light mode. If the
  `.mbtiles` is missing (run with `--skip-tiles`, download failed), the
  `tileserver` runs in a restart loop and the map falls back to OSM raster tiles.
- The tile set is **pinned by name and checksum** (`TILE_ID`, `TILE_SHA256` at
  the top of the setup script). A local file that does not match the checksum is
  replaced by the release asset, and a downloaded one that does not match stops
  the run – every map image depends on these exact bytes.
  They used to be built per machine with Planetiler from a dated Geofabrik
  snapshot. OSM changes daily, so the snapshot had to be pinned, and Geofabrik
  keeps the dated extracts for a few months only – once
  `schleswig-holstein-260915` was gone, nobody could build the tiles the
  published images were made with any more. A release asset stays.
- Moving the tiles on is a deliberate step, like raising `QONNECTRA_REF`:
  `scripts/build-map-tiles.sh <dated extract URL>` builds a new set with
  Planetiler (Java 21+, version pinned in `PLANETILER_VERSION`, currently
  `v0.10.2`) and prints the `gh release create` command to publish it; then bump
  `TILE_ID` and `TILE_SHA256` **and regenerate the map images with it**. Use a
  dated extract, not `-latest` – the name of the tile set and its release says
  which state of OSM the images show.

**What the pipeline cannot make deterministic**

These sit in the app, not in the specs. An image that keeps changing on every
run without anyone touching it is most likely one of them – check here before
looking for a race in the spec.

- **Result order of the search.** `trigram_address_search()` ends in
  `order_by("-similarity")` without a second sort key
  (`local-app/backend/apps/api/search.py`). Addresses of the same street tie on
  the score, and Postgres then returns them in whatever order it likes; the
  images of the search fields reorder their rows from run to run. That is a bug
  in the app, not in the capture: paginating through tied results skips and
  repeats rows for users too. The fix belongs upstream (`order_by("-similarity",
  "id")`) – `local-app/` is a foreign, gitignored checkout and is never patched
  from here. Until then `stableSearchOrder()` in `playwright/stable-search.ts`
  sorts the hits by `id_address` on their way into the page, the same device as
  `freezeDates()` – install it before the view loads. The response carries no
  score, so that is only right for terms whose hits all tie; „Toft 1“ and
  „Nieharde“ do (every hit scores 1.0, the house number is a short token and
  only filters), another term is checked in the Django shell of the backend
  container first – the command is in the file.
- **Charts over equal values.** „Neueste Netzknoten“ is `order_by("-date")[:5]`
  without a second sort key (`views.py`), and 47 of the 118 nodes of the demo
  data carry the same date while 71 have none – which five come back is up to
  Postgres and changes as soon as anything writes to the table. On top of that
  `NodeStatistics.svelte` sorts with `(a, b) => b.value - a.value` over a
  hard-coded `value: 1`, so the comparison returns 0 throughout. Not
  interceptable either, the dashboard is loaded by `+page.server.ts`. The spec
  therefore gives five nodes a date of its own and reverts it afterwards, the
  same device the warranty card uses (`tests/04-dashboard.spec.ts`).
- **Ties in the residential-unit chart.** „Wohneinheiten nach Typ“ on the
  dashboard is `order_by("-count")` alone (`units_by_type` in `views.py`), and
  in the demo data „krankenhaus“, „oeffentlich“ and „schule“ have one unit
  each. Postgres returns the tie in an order of chance – four different orders
  were measured on 2026-10-08, including two on freshly reset instances, so a
  reset does not make it reproducible. `stableUnitsByTypeOrder()` in
  `playwright/stable-dashboard.ts` sorts `unitsByType` by count and then by
  name on its way into the page, the same device as `stableSearchOrder()`. The
  page data only passes through the browser when the dashboard is reached from
  inside the app, so test 4.5 opens it through the navigation bar
  (`openDashboardFromNavigation()`) and fails if nothing was sorted. The fix
  belongs upstream (`order_by("-count",
  "residential_unit_type__residential_unit_type")`).
- **Timestamps the backend sets.** `created_at`/`modified_at` are `auto_now_add`
  resp. `auto_now` on the models, so the backend discards any supplied value and
  `page.clock` (browser only) changes nothing. `freezeDates()` in
  `playwright/stable-dates.ts` rewrites them on the way into the page and keeps
  every capture at `CAPTURE_DATE`; the tab „Anhänge“ showed the day of the run
  next to every file name before that. Works only where the browser fetches the
  data itself – whatever a `+page.server.ts` loads runs inside the container and
  never passes Playwright.
- **Anything transient in the app.** A capture is not fast enough to hit a state
  that only exists for a moment. After a jump to a search hit the map blinks the
  object six times at 300 ms (`zoomToFeature` in `searchUtils.ts`) and a toast
  fades out on its own – an element screenshot takes longer than one blink
  phase, so even a capture bracketed by „is it on“ checks fell into the gap
  (three of four runs). Capture the settled state instead, and check that the
  transient is over rather than waiting a fixed time.
- **Labels of the base map.** Two causes, both fixed. OpenLayers places them
  with a declutter pass over the features it happens to have at the moment of
  the render, so a tile arriving late moves the street names by a few pixels –
  the answer is to wait until the painted picture stops changing,
  `waitForBaseMapSettled()` in `playwright/stable-map.ts`, which `shoot()` and
  `shootTile()` do immediately before every capture (once on load is **not**
  enough, `spotlight()` puts an SVG over the page and the reflow makes
  OpenLayers render again). And the font the labels are measured with came
  from the internet at a moment that depended on the CDN, so a settled picture
  could still differ from the last one – see the vendored font above. A
  per-chapter `shootMap()` was the previous answer to the first cause, and
  eight of the ten specs that show a map did not have one.

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
  not found). The same holds for `playwright/auth.setup.ts`: it seeded a loaded
  page once, `/` redirects to the map, and in one run of ten the first `moveend`
  won – `auth-state.json` carried `[0, 0]` at zoom 2.5 and chapters 8 and 9,
  which rely on that seed, opened their map in the Atlantic. It seeds through
  `context.addInitScript()` now and checks the login on the dashboard.
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

SvelteKit + Skeleton, `main` as of 2026-09-11 (commit `aa28575`) – the state the
setup pins the checkout to, see `QONNECTRA_REF` above. The header shows
**v1.7.0**, the last release before it. The
navigation bar is sorted into groups; the labels are short and only
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
