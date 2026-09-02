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

> `playwright.config.ts` setzt diese Werte zentral. Kein `devices[...]`-Preset in
> die Projekt-Konfiguration spreaden – die Presets bringen eigene `viewport`- und
> `deviceScaleFactor`-Werte mit und überschreiben die Zielwerte still.

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
2. **Dim + Spotlight** – die gesamte Oberfläche wird abgedunkelt, nur der
   beschriebene Bereich bleibt in voller Helligkeit und bekommt eine weiße,
   abgerundete Kontur. Das Standardmittel für „Wo finde ich X?“
   (`dashboard_project.jpg`, `conduit_excel.jpg`, `map_selected_object.jpg`).
   Der Schleier ist **`rgba(0, 0, 0, 0.5)`** – schwarz bei 50 %, nicht grau.
   An den Altbildern nachgemessen: jeder abgedunkelte Bildpunkt hat exakt den
   halben Wert des unabgedunkelten Bildes (255 → 128, 220 → 110). Ein grauer
   oder schwächerer Schleier wirkt neben den bestehenden Bildern deutlich zu
   hell; `spotlight()` in `playwright/manual-shots.ts` setzt diesen Wert.
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
- Zwei Konten, Zugangsdaten in `local-app/deployment/.env`, beim ersten Lauf
  zufällig erzeugt. **Nie in Doku, Tests, Skripte oder Commits schreiben** –
  immer über `process.env` bzw. die `.env`-Datei einlesen.
  - `APP_USER_USERNAME` / `APP_USER_PASSWORD` – Konto **ohne**
    Administrationsrechte, Gruppe aus `APP_USER_GROUP` (Voreinstellung
    `Editor`: alle Fachdaten bearbeitbar, kein Zugriff auf `/admin/*`).
    **Der Standard für alle Aufnahmen** – Teil A beschreibt die Sicht normaler
    Nutzender. Das Setup legt es bei jedem Lauf neu an bzw. aktualisiert es.
  - `DJANGO_SUPERUSER_USERNAME` / `DJANGO_SUPERUSER_PASSWORD` – Django-Superuser
    für die Administration. Nur für Bilder von `/admin/*` benutzen: er umgeht
    jede Rechteprüfung und sieht zusätzlich den Menüpunkt „Logs“.
- `PUBLIC_DOCUMENTATION_URL` in `.env` ist der Hilfe-Link, den die App in
  Kopfzeile und Navigationsleiste zeigt; das Setup setzt ihn bei jedem Lauf auf
  `https://qonnectra.de/` (überschreibbar via `QONNECTRA_DOCUMENTATION_URL`).
  Ist die Variable leer, blendet die App den Link aus und er fehlt im Bild.
- HTTPS läuft über eine lokale Dev-CA; einmalig `scripts/install-local-ca.sh`
  ausführen, alternativ in Playwright `ignoreHTTPSErrors: true` setzen.
- Demodaten: Projekt **„Testprojekt“** aus
  `scripts/qonnectra-demo-data/testprojekt-export.json`, wird beim Setup
  automatisch importiert. Nach dem Login oben links auswählen.
- `local-app/` ist gitignored (Fremd-Checkout) – nie committen und nur über das
  Setup-Skript verändern.

**Playwright-Setup im Doku-Repo**

Alle Läufe gehen ausschließlich gegen die lokale Instanz. Es gibt keine
konfigurierbare Zieladresse und kein `.env` im Repo-Root mehr – `GEODOCK_URL`
wird nicht mehr gelesen.

- `playwright/local-app.ts` ist die einzige Quelle für Adresse und Zugangsdaten
  und liest `local-app/deployment/.env` (`APP_DOMAIN`, `API_DOMAIN`,
  `APP_USER_*`, `DJANGO_SUPERUSER_*`). Zugangsdaten nur über `localApp()`
  beziehen, nie in Specs, Ausgaben oder Commits schreiben.
- Angemeldet wird sich standardmäßig mit dem Konto **ohne**
  Administrationsrechte. `QONNECTRA_LOGIN=admin pnpm test:e2e` schaltet auf den
  Superuser um – nur für Bereiche, die normalen Nutzenden verborgen bleiben.
  Bilder aus einem Admin-Lauf zeigen sonst eine Oberfläche, die es für die
  Zielgruppe von Teil A nicht gibt.
- `playwright/auth.setup.ts` läuft als Setup-Projekt automatisch vor jedem Spec:
  prüft die Erreichbarkeit (mit Hinweis auf `scripts/setup-local-qonnectra.sh`,
  falls der Stack steht), meldet sich per `POST /api/v1/auth/login/` an und
  schreibt `auth-state.json`. `pnpm test:e2e:setup` führt nur diesen Schritt aus.
- `auth-state.json` ist **nicht** wiederverwendbar und wird pro Lauf neu erzeugt:
  das Access-Token lebt 15 Minuten, und das Backend rotiert Refresh-Tokens mit
  Blacklist (`ROTATE_REFRESH_TOKENS` + `BLACKLIST_AFTER_ROTATION`).
- Das Setup legt den Zustand fest, an dem die Bilder hängen: Cookie
  `selected-project=2` („Testprojekt“; ein UI-Login würde `1` = „Default“
  schreiben) sowie im `localStorage` `PARAGLIDE_LOCALE=de`, `mode=light`,
  `basemapTheme`, `mapCenter` und `mapZoom`. Die Karte hat kein Auto-Fit – ohne
  gesetzte `mapCenter`/`mapZoom` (EPSG:3857) startet sie bei Zoom 2 im Atlantik.
- Ein Spec pro Handbuchkapitel: `tests/<NN>-<kapitel-slug>.spec.ts` mit Kommentar,
  auf welches Kapitel es sich bezieht (siehe `tests/05-karte.spec.ts`).
- Ausgabe nach `tests/screenshots/<kapitel-slug>/<bildname>.png` über
  `shotPath()`. `tests/screenshots/`, `test-results/`, `playwright-report/` und
  `auth-state.json` sind gitignored – das sind Rohaufnahmen, nicht die Bilder
  des Handbuchs.
- `pnpm screenshots:publish` (`scripts/publish-screenshots.sh`) übernimmt sie
  nach `public/images/manual/…` und wandelt sie dabei in JPEG (Qualität 85,
  Qualität wird gesenkt, bis die Datei unter 1,2 MB liegt). Das Zielverzeichnis
  kommt aus dem Handbuch selbst: das Skript sucht in `manual/` die Einbindung
  `/images/manual/<teil>/<name>.jpg`. Bilder ohne Einbindung werden
  übersprungen, damit nichts im falschen Teil-Ordner landet.
  `--dry-run` zeigt vorher, was neu angelegt und was ersetzt würde.
- Nur Muster 1 und 2 gehen komplett automatisch durch. Bilder mit
  handgezeichneten Markierungen (Muster 3) werden nach dem Übernehmen
  nachbearbeitet – `--dry-run` vorher ansehen, sonst überschreibt der Lauf die
  Handarbeit mit einer Rohaufnahme.
- Kapitel 3 braucht als einziges auch den abgemeldeten Zustand: die Bilder der
  Anmeldeseite stehen in einem `test.describe`-Block mit
  `test.use({ storageState: { cookies: [], origins: [] } })`, die Bilder der
  Oberfläche daneben im normalen angemeldeten Zustand. Angemeldete Aufrufe von
  `/login` leitet die App auf `/map` um.
- `workers: 1` und `fullyParallel: false` sind Absicht: alle Specs teilen sich
  eine Instanz samt Projektauswahl und Kartenposition.
- Determinismus-Helfer in `playwright/manual-shots.ts`: `animationenAus()`
  (Übergänge und Text-Cursor aus), `zeigerWeg()` (keine Hover-Zustände im Bild),
  `spotlight()` für Muster 2 und `composite2x2()` für Muster 4. Das Raster wird
  im Browser montiert, das Repo braucht dafür keine Bildbibliothek. Muster 3
  (handgezeichnete Ellipsen/Pfeile) bleibt Nachbearbeitung.
  `spotlight()` legt ein SVG mit Aussparung über die Seite und verändert das
  Zielelement nicht. Der naheliegende Weg über `box-shadow: 0 0 0 9999px` am
  Element selbst scheitert hier zweifach: der Schleier wird am nächsten
  Vorfahren mit `overflow: hidden` abgeschnitten, und macht man die Vorfahren
  durchlässig, verliert die Karte (OpenLayers) beim Reflow ihren Canvas-Inhalt.
- Composite-Raster sind montiert und deshalb **nicht** 2560 × 1600, sondern
  2656 × 1936 (zwei Kacheln plus Fugen). Das Seitenverhältnis der Montage
  ergibt sich aus dem Kartenausschnitt und lässt sich nicht auf beide Zielmaße
  gleichzeitig bringen; im Handbuch werden die Bilder ohnehin auf 512 px
  gerendert.
- Die Kartenkacheln erzeugt `scripts/setup-local-qonnectra.sh` einmalig per
  Planetiler (Region `schleswig-holstein`, dort liegt das Testprojekt) und legt
  sie unter `~/.local/share/qonnectra-local-tiles/` ab – außerhalb von
  `local-app/`, damit `--reset` sie nicht wegwirft. Der `tileserver` bekommt sie
  als harte Verknüpfung unter `local-app/deployment/tiles/germany.mbtiles`
  (ein Bind-Mount nur für die Datei scheitert, weil Docker den Mountpoint im
  read-only gemounteten `/data` nicht anlegen kann).
  Kartenbilder zeigen damit die echte Vektor-Basiskarte im Hellmodus. Fehlt die
  `.mbtiles` (Lauf mit `--skip-tiles`, kein Java), läuft der `tileserver` in
  einer Restart-Schleife und die Karte fällt auf OSM-Rasterkacheln zurück.

- Antwortet die API mit **502**, obwohl der Backend-Container läuft: nach einem
  Neustart des Backends hat `nginx` dessen alte Container-IP zwischengespeichert
  (nginx-Log: „Host is unreachable“) und löst sie nicht neu auf. Behebt sich mit
  `docker restart qonnectra_nginx_prod`. Das Setup-Projekt wartet eine Minute auf
  5xx-Antworten, weil ein kalt gestarteter Stack kurz mit 502 antwortet.
- Die Zahl der Canvas-Elemente in der Karte hängt vom Tileserver ab: mit
  Vektorkacheln legt OpenLayers zwei an, im OSM-Rasterfallback eines. Deshalb
  `page.locator('div.map canvas').first()` verwenden.
- Kartenposition immer per `page.addInitScript()` setzen, nicht per
  „laden, `localStorage` setzen, neu laden“. Die App schreibt `mapCenter` und
  `mapZoom` bei jedem `moveend` zurück; landet das zwischen Setzen und Neuladen,
  ist der Seed weg und die Karte startet in der Übersicht. Tests, die auf eine
  bestimmte Stelle klicken, treffen dann nichts und die Info-Box öffnet nicht
  (Symptom: `#drawer-title` nicht gefunden).
- Der Basiskarten-Layer ist von der Objektauswahl unabhängig: `getClickedFeatures`
  filtert per `layerFilter` auf Trasse, Adresse, Netzknoten und Gebiet
  (`MapInteractionManager.svelte.ts`). Ob der Tileserver läuft, hat auf Klicks
  also keinen Einfluss.
- Ein Kartenobjekt per Klick auszuwählen ist nicht ohne Weiteres reproduzierbar:
  Eine Trassenlinie ist nur wenige Pixel breit, und darunter liegt das
  Projektgebiet, dessen Fläche das ganze Netz überdeckt. Dieselbe Stelle liefert
  je nach Lauf verschiedene Trassen oder das Gebiet. Wiederholtes Klicken hilft
  nicht (es ist kein Kachel-Rennen) – für einen deterministischen Treffer den
  Layer „Gebiet" vor dem Klick ausblenden. Wieder einschalten geht danach nicht,
  weil die geöffnete Info-Box die Legende verdeckt.
- Die Navigationsleiste ist bei 1280 × 800 höher als das Fenster (gemessen:
  1093 px Inhalt): mit allen aufgeklappten Gruppen liegt die Gruppe „System"
  („Logs", „Einstellungen") unter dem sichtbaren Bereich. Scroll-Container ist
  das Raster der Leiste, greifbar über
  `div[class*="grid-rows-[auto_1fr_auto]"]` (`SideBar.svelte`) – für Bilder des
  Leistenfußes dort `scrollTop = scrollHeight` setzen und **nicht** Gruppen
  einklappen; das wäre ein Zustand, den Nutzende erst selbst herstellen müssen.

**Die App (Kontext für Selektoren und Routen)**

SvelteKit + Skeleton. Die Navigationsleiste ist nach Gruppen sortiert; die
Beschriftungen sind kurz und erst mit der Gruppe eindeutig (Gruppe „Rohr“ →
„Verwaltung“ = Rohrverwaltung). Routen und Beschriftungen:

| Gruppe | Route → Beschriftung |
|---|---|
| „Info“ | `/dashboard` „Dashboard“, `/map` „Karte“ |
| „Funktionen“ | `/fault-simulation` „Störungsanalyse“, `/post-compaction` „Nachverdichtung“, `/pipeline-records` „Leitungsauskunft“, `/valuation` „Wertermittlung“ |
| „Rohr“ | `/conduit` „Verwaltung“, `/trench` „Zuordnung“, `/pipe-branch` „Verzweigung“, `/house-connections` „Mikrorohre“ |
| „Kabel“ | `/network-schema` „Netzschema“, `/trace` „Faserweg“ |
| „Gebäude“ | `/address` „Adressen“ |
| „System“ | `/admin/logs` „Logs“, `/settings` „Einstellungen“ |

Dazu `/login` ohne Navigationsleiste. Welche Einträge erscheinen, hängt an den
Rechten (`canAccessRoute`); als Superuser sind alle sichtbar. Mit dem
Standardkonto der Aufnahmen (Gruppe „Editor“) fehlt in der Gruppe „System“ der
Eintrag „Logs“ – die Gruppe besteht dort nur aus „Einstellungen“. `/admin/*`
ist der einzige gesperrte Pfad; alles ohne eigenen `RoutePermission`-Eintrag
gilt als erlaubt.
Navigationsdefinition: `local-app/frontend/src/lib/config/navLinks.ts`,
UI-Texte: `local-app/frontend/messages/de.json`.

## Subagents

- `handbuch-autor` – neue oder erweiterte Handbuchkapitel im obigen Stil
- `screenshot-automat` – Playwright-Specs für Screenshots/Videos schreiben und ausführen
- `handbuch-review` – Stil-, Konsistenz- und Rechtschreibprüfung vor dem Commit
