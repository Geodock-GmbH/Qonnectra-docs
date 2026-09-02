# CLAUDE.md

Leitfaden für Claude Code in diesem Repository.

**Sprache: Alles Nutzersichtbare ist Deutsch** – Handbuchtexte, Alt-Texte, UI-Zitate,
Skript-Ausgaben und Code-Kommentare. Commit-Messages sind Englisch.

## Was dieses Repo ist

VitePress-Site für **Qonnectra** (Open-Source-Netzdokumentation für kommunale
Infrastrukturen, Geodock GmbH & plan[neo] GmbH, AGPL-3.0). Zwei Inhaltsstränge:

- **Landing Page**: `index.md`, `services/`, `contact/`, `imprint/`, `privacy/`
- **Handbuch**: `manual/` – der Schwerpunkt der laufenden Arbeit

Das Handbuch ist in drei Teile gegliedert (Zielgruppen siehe `manual/index.md`):

| Verzeichnis | Teil | Kapitel |
|---|---|---|
| `manual/index.md` | Einführung | 1 |
| `manual/teil-a-anwenderhandbuch/` | A – Anwenderhandbuch (Webanwendung, keine GIS-Kenntnisse) | 2–7, reserviert 8–13 |
| `manual/teil-b-betrieb-admin-qgis/` | B – Betrieb, Administration, QGIS | 14, reserviert 15–16 |
| `manual/teil-c-entwickler-systemdokumentation/` | C – Entwickler- und Systemdokumentation | 17 ff. |

Die Nummernlücken sind bewusst – neue Kapitel füllen sie auf, statt bestehende
Nummern zu verschieben. Kapitelnummer im H1 **und** im Dateinamen-Präfix müssen
übereinstimmen (`06-rohrverwaltung.md` → `# 6. Rohrverwaltung`), die Sidebar wird
aus Dateinamen-Reihenfolge + H1 generiert (`vitepress-sidebar`).

## Befehle

```bash
pnpm install
pnpm dev              # http://localhost:5173
pnpm build            # BASE_PATH="/Qonnectra-docs/" in CI
pnpm lint:spelling    # cspell (de+en) – muss vor jedem Commit grün sein
pnpm test:e2e:setup   # Login-Zustand nach auth-state.json schreiben
pnpm test:e2e         # Playwright-Specs in tests/

scripts/setup-local-qonnectra.sh            # lokale Qonnectra-Instanz bauen/starten
scripts/setup-local-qonnectra.sh --reset    # Daten + Secrets verwerfen, neu aufbauen
scripts/install-local-ca.sh                 # Dev-CA einmal pro Rechner importieren
```

Neue deutsche Fachwörter, die cspell nicht kennt, alphabetisch in `.cspell.json`
unter `words` einsortieren – nicht per Inline-Kommentar unterdrücken.

## Schreibstil des Handbuchs

Verbindlich, abgeleitet aus den bestehenden Kapiteln. Neue Kapitel folgen dem
exakt; im Zweifel `manual/teil-a-anwenderhandbuch/05-karte.md` und
`07-rohrzuordnung.md` als Vorlage lesen.

**Ansprache und Ton**
- Konsequent **Sie-Form**, Handlungsanweisungen im Imperativ: „Klicken Sie auf …“,
  „Geben Sie einen Suchbegriff ein.“
- Geschlechtsneutral über Partizip/Doppelnennung: „Nutzende“, „Anwenderinnen und
  Anwender“, „Verwaltungsmitarbeitende“.
- Sachlich, kein Marketing-Ton, keine Emojis, keine Ausrufezeichen.
- Erklärt wird auch, was **nicht** geht und wo Nutzende hängenbleiben
  („Andernfalls gehen die Änderungen ohne Warnung verloren.“, „Wenn der Button
  nicht sichtbar ist, scrollen Sie im Feld nach unten.“).

**Struktur**
- Keine Frontmatter in Kapiteldateien.
- Überschriften nummeriert: `# 6. Rohrverwaltung`, `## 6.1 Suchen und Filtern`,
  `### 6.3.1 Reiter „Eigenschaften“`. `####` bleibt unnummeriert.
- Jedes Kapitel beginnt mit einem Absatz: Zweck des Bereichs + wie man hinkommt
  („Sie erreichen sie über die linke Navigation durch Klicken auf den Menüpunkt
  „Rohrverwaltung“.“), danach direkt ein Übersichts-Screenshot.
- Aufzählungen für Optionen/Eigenschaften, **nummerierte** Listen nur für echte
  Schritt-für-Schritt-Abläufe.
- Hinweise als normaler Absatz mit Präfix `Hinweis:`, `Wichtig:` oder
  `Wichtiger Hinweis:` – **keine** VitePress-Container (`::: tip`).
- Querverweise als relative Links: `siehe Kapitel [Karte](./05-karte.md)`.
- Platzhalter für noch offene Kapitel:
  `_Die Dokumentation zu diesem Kapitel ist noch in Arbeit._`

**Auszeichnung**
- `**fett**` für Fachbegriffe und Konzepte beim ersten Auftreten
  (**Rohrzuordnung**, **Transparenz**, **interaktive Legende**) und für Zustände
  („Routing-Modus **eingeschaltet**“).
- UI-Beschriftungen in typografischen Anführungszeichen: „Speichern“, „+ Rohr
  hinzufügen“, Reiter „Anhänge“. Beschriftungen wörtlich aus der App übernehmen –
  Referenz ist `local-app/frontend/messages/de.json`.
- Abkürzungen mit Leerzeichen: „z. B.“, „ggf.“.

## Screenshots und Videos

**Technische Zielwerte**

| | Wert |
|---|---|
| Viewport | 1280 × 800, `deviceScaleFactor: 2` → Bild **2560 × 1600** |
| Bildformat | `.jpg`, Qualität ~85, Zieldateigröße < 1,2 MB |
| Videoformat | `.webm`, ca. 1280 × 800 |
| Modus | immer Hellmodus, Sprache **DE** |
| Inhalt | nur der App-Viewport, kein Browser-Chrome, kein Mauszeiger |
| Daten | ausschließlich das Demoprojekt „Testprojekt“ – keine echten personenbezogenen Daten |

> Abweichung: `playwright.config.ts` nutzt derzeit 1920 × 1080 @1x. Wer die
> Screenshot-Automatisierung ausbaut, gleicht das auf 1280 × 800 @2x an,
> sonst passen neue Bilder optisch nicht zu den bestehenden.

**Ablage und Benennung**
- Bilder: `public/images/manual/teil-a/<name>.jpg` (je Handbuchteil ein Ordner)
- Videos: `public/videos/<name>.webm` (flach, ohne Teil-Unterordner)
- Name = englisch, `snake_case`, Bereich zuerst, Detail danach:
  `login_`, `dashboard_`, `map_`, `conduit_`, `conduit_connection_`
  → `dashboard_trasse_hover.jpg`, `map_legend_actions.jpg`, `conduit_search_columns.jpg`
- Ausschnittvergrößerungen bekommen das Suffix `_detail`
  (`login_start_detail.jpg`, `map_adress_detail.jpg`).

**Bildsprache – vier Muster, die konsistent wiederkehren**

1. **Übersichtsbild, unbearbeitet** – der ganze App-Viewport, ohne Markierung.
   Steht am Kapitelanfang (`dashboard.jpg`, `map.jpg`, `conduit.jpg`).
2. **Dim + Spotlight** – die gesamte Oberfläche wird mit einem halbtransparenten
   grauen Schleier abgedunkelt, nur der beschriebene Bereich bleibt in voller
   Helligkeit und bekommt eine weiße, abgerundete Kontur. Das Standardmittel für
   „Wo finde ich X?“ (`dashboard_project.jpg`, `conduit_excel.jpg`,
   `map_selected_object.jpg`).
3. **Handgezeichnete Markierung in Marken-Grün** (`#11ba81`) – geschwungene
   Ellipsen um Elemente, gebogene Pfeile und handschriftlich wirkende Labels.
   Für Orientierungsbilder mit mehreren Beschriftungen gleichzeitig
   (`login_navigation.jpg`) und zum Hervorheben eines Kartenobjekts.
4. **Composite-Raster** – 2 × 2 Einzelbilder mit weißen Fugen, jeder Schritt unten
   rechts mit einer großen grünen Ziffer nummeriert; die Ziffern entsprechen den
   Schritten der nummerierten Liste im Text (`map_search_flow.jpg`,
   `map_legend_actions.jpg`).

Muster 2 und 3 werden kombiniert (abdunkeln + Ellipse + Pfeil). Videos sind
kurze, ungeschnittene Interaktionsaufnahmen ohne Ton, Text oder Markierung.

**Einbindung in Markdown**
- Bild steht **nach** dem erklärenden Absatz, nie davor.
- Alt-Text ist eine deutsche Beschreibung, die Ansicht, Hervorhebung und Position
  nennt:
  `![Screenshot Karte mit Hervorhebung der Legende oben rechts](/images/manual/teil-a/map_legend.jpg)`
- Bildklassen (siehe `.vitepress/theme/custom.css`): Standard 512 px mit grünem
  1-px-Rahmen, `{.big}` = 800 px, `{.small}` = 300 px, `{.no-border}` ohne Rahmen.
- Bildpaar (Vollbild + Detail) nebeneinander: zwei `![]()`-Zeilen direkt
  untereinander, danach eine eigene Zeile mit `{.img-row}`.
- Videos ohne Alt-Text über `markdown-it-html5-media`:
  `![](/videos/conduit_connection_mapFind.webm)`
- Klick auf Bilder öffnet eine Lightbox (`vitepress-plugin-lightbox`) – Details
  dürfen deshalb im 512-px-Rendering klein sein, müssen im Original aber lesbar sein.

## Lokale Qonnectra-Instanz für reproduzierbare Aufnahmen

Ziel: Screenshots und Videos entstehen künftig als Playwright-Testfälle gegen die
lokale Instanz, damit sie bei Änderungen der App neu erzeugt werden können.

- `scripts/setup-local-qonnectra.sh` klont die App nach `local-app/` und startet
  sie über die **Produktions**-Compose. Idempotent, beliebig oft ausführbar.
- Erreichbar unter `https://app.qonnectra.localhost` (Admin:
  `https://admin.qonnectra.localhost/admin`, API: `https://api.qonnectra.localhost`).
- Zugangsdaten stehen in `local-app/deployment/.env`
  (`DJANGO_SUPERUSER_USERNAME` / `DJANGO_SUPERUSER_PASSWORD`) und werden beim
  ersten Lauf zufällig erzeugt. **Nie in Doku, Tests, Skripte oder Commits
  schreiben** – immer über `process.env` bzw. die `.env`-Datei einlesen.
- HTTPS läuft über eine lokale Dev-CA; einmalig `scripts/install-local-ca.sh`
  ausführen, alternativ in Playwright `ignoreHTTPSErrors: true` setzen.
- Demodaten: Projekt **„Testprojekt“** aus
  `scripts/qonnectra-demo-data/testprojekt-export.json`, wird beim Setup
  automatisch importiert. Nach dem Login oben links auswählen.
- `local-app/` ist gitignored (Fremd-Checkout) – nie committen und nur über das
  Setup-Skript verändern.

**Playwright-Setup im Doku-Repo**
- `playwright.config.ts` liest `.env` im Repo-Root (gitignored). Benötigt wird
  `GEODOCK_URL=https://app.qonnectra.localhost`.
- `pnpm test:e2e:setup` (`playwright/auth-setup.ts`) öffnet einen Browser zum
  manuellen Login und legt `auth-state.json` an. Ein programmatischer Login mit
  den Credentials aus `local-app/deployment/.env` ist die bessere Zielvariante.
- Ein Spec pro Handbuchkapitel: `tests/<NN>-<kapitel-slug>.spec.ts` mit Kommentar,
  auf welches Kapitel es sich bezieht (siehe `tests/03-einstieg-anmeldung.spec.ts`).
- Ausgabe nach `tests/screenshots/<kapitel-slug>/<bildname>.png`.
  `tests/screenshots/`, `test-results/`, `playwright-report/` und `auth-state.json`
  sind gitignored – fertige Bilder werden bewusst nach `public/images/…` kopiert,
  in JPEG konvertiert und committet.
- Determinismus: Projekt explizit auswählen, feste Kartenposition/Zoom ansteuern,
  `networkidle` bzw. konkrete Elemente abwarten, Animationen ausklingen lassen,
  Mauszeiger aus dem Bild halten.
- Muster 2 (Dim + Spotlight) lässt sich reproduzierbar per injiziertem CSS
  erzeugen (`box-shadow: 0 0 0 9999px rgba(…)` auf dem Zielelement). Muster 3
  (handgezeichnete Ellipsen/Pfeile) bleibt Nachbearbeitung.

**Die App (Kontext für Selektoren und Routen)**

SvelteKit + Skeleton, Routen: `/login`, `/dashboard`, `/map`, `/conduit`
(Rohrverwaltung), `/trench` (Rohrzuordnung), `/pipe-branch` (Rohrverzweigung),
`/network-schema` (Netzschema), `/house-connections`, `/trace`, `/settings`.
Navigationsdefinition: `local-app/frontend/src/lib/config/navLinks.ts`,
UI-Texte: `local-app/frontend/messages/de.json`.

## Subagents

- `handbuch-autor` – neue oder erweiterte Handbuchkapitel im obigen Stil
- `screenshot-automat` – Playwright-Specs für Screenshots/Videos schreiben und ausführen
- `handbuch-review` – Stil-, Konsistenz- und Rechtschreibprüfung vor dem Commit
