# 33. Frontend

Dieses Kapitel beschreibt die Weboberfläche von innen: wie sie aufgebaut ist, wie sie Daten holt und hält, wie Karte und Diagramme entstehen und wie Sprache, Gestaltung und Einstellungen funktionieren. Wie Sie das Frontend lokal starten, beschreibt Abschnitt [Frontend starten](./30-entwicklungsumgebung.md#_30-3-frontend-starten). Alle Pfade sind relativ zu `frontend/`.

## 33.1 SvelteKit-Struktur und Routen

Das Frontend ist eine SvelteKit-Anwendung mit Svelte 5 und TypeScript. Es läuft mit `@sveltejs/adapter-node` als eigener Node-Prozess und rendert jede Seite beim ersten Aufruf auf dem Server vor. Zwei experimentelle Schalter sind eingeschaltet (`svelte.config.js`): `kit.experimental.remoteFunctions` für die Remote Functions, siehe Abschnitt [Zustandsverwaltung](#_33-2-zustandsverwaltung-kontexte-und-remote-functions), und `compilerOptions.experimental.async` für `await` in Komponenten.

Unter `src/routes/` liegt je Menüpunkt eine Route. Die Ansichten, die zu einem Projekt gehören, liegen unter `project/[projectId=integer]/`, die übrigen daneben:

| Route | Ansicht |
|---|---|
| `project/[projectId=integer]/dashboard/[[flagId]]` | Dashboard |
| `project/[projectId=integer]/map` | Karte |
| `project/[projectId=integer]/fault-simulation`, `…/post-compaction`, `…/valuation` | Störungsanalyse, Nachverdichtung, Wertermittlung |
| `project/[projectId=integer]/conduit`, `…/trench/[[flagId]]`, `…/pipe-branch`, `…/house-connections` | Rohrverwaltung, Rohrzuordnung, Rohrverzweigung, Mikrorohre |
| `project/[projectId=integer]/network-schema` | Netzschema, mit `node/[nodeId]` für das Unternetz eines Netzknotens |
| `project/[projectId=integer]/address` | Adressen, mit `[uuid]` und `[uuid]/unit/[unitUuid]` |
| `pipeline-records`, `trace/[entryType=traceEntryType]/[uuid]` | Leitungsauskunft, Faserweg |
| `settings`, `admin/logs` | Einstellungen, Logs |
| `login`, `no-access` | Anmeldung, Hinweis für Konten ohne erlaubte Seite |

Zwei **Parameterprüfungen** in `src/params/` lassen nur passende Pfade zu: `integer` nur Ziffern als Projektnummer, `traceEntryType` nur die Einstiegspunkte des Faserwegs (`fiber`, `cable`, `node`, `address`, `residential-unit`). Ein anderer Wert ergibt 404, ebenso ein Pfad ohne Projekt wie `/map`. `project/[projectId=integer]/+layout.ts` prüft die Nummer gegen die Projekte des Kontos und antwortet mit 404, wenn das Konto das Projekt nicht sieht; `/project/<Nummer>` allein leitet auf dessen Karte weiter. Die Route-IDs, mit denen der übrige Code arbeitet, sammelt `src/lib/config/routes.ts`. Neben den Ansichten gibt es einen einzigen eigenen Server-Endpunkt, `conduit/download/+server.ts`, der die Excel-Vorlage des Rohrimports vom Backend durchreicht.

**Die Adresse als Zustand.** Welche Seite offen ist und was sie gerade zeigt, steht in der Adresse, nicht in einem Store:

- **Pfad** – das Projekt und die Detailseiten (`/project/2/address/<uuid>`).
- **Abfrageparameter** – das in der Info-Box geöffnete Objekt (`feature=trench:<uuid>`), der Reiter (`tab`), Suchbegriff und Seite (`search`, `page`, `page_size`). Die Namen sind reserviert, keine Ansicht verwendet sie für etwas anderes; die Hilfsfunktionen dazu stehen in `src/lib/utils/urlState.ts` (`setQuery`, `openFeature`, `closeFeature`).
- **Fragment** – der Kartenausschnitt als `#map=<Zoom>/<x>/<y>` in EPSG:3857, siehe Abschnitt [Benutzereinstellungen und deren Speicherung](#_33-7-benutzereinstellungen-und-deren-speicherung).

Das Öffnen eines Objekts legt einen Eintrag im Verlauf des Browsers an; Reiter, Filter, Seiten und Bewegungen der Karte ersetzen den aktuellen. „Zurück“ schließt deshalb die Info-Box in einem Schritt, statt jeden Reiterwechsel einzeln zurückzunehmen. Das Projekt einer Seite liefert `routeProjectId()` aus `src/lib/context/project.ts`; Komponenten, die je Projekt eigenen Zustand halten, etwa eine OpenLayers-Karte, reagieren mit `onProjectChange()` auf einen Wechsel.

**Daten.** Die Ansichten holen und speichern ihre Daten über Remote Functions, siehe Abschnitt [Zustandsverwaltung](#_33-2-zustandsverwaltung-kontexte-und-remote-functions). Lade-Funktionen gibt es nur noch an wenigen Stellen: Die Wurzel `+layout.server.ts` lädt für jede Seite die Projekte, die Kennzeichen, die Konfiguration vom Endpunkt `config/` des Backends (Koordinatenbezugssystem und seine Definition für proj4), die Version der Anwendung und das zuletzt besuchte Projekt; dazu kommen die Seiten des Netzschemas und `admin/logs`. Die Wurzel liest nichts aus der Adresse und läuft deshalb beim Navigieren nicht erneut, sondern nur, wenn `app:reference-data` ungültig wird.

**Wie das Frontend das Backend aufruft.** Es gibt keinen generierten Client; der Code ruft `fetch` direkt auf, auf den beiden Wegen aus Abschnitt [Komponenten und Weg einer Anfrage](./29-architekturueberblick.md#_29-1-komponenten-und-weg-einer-anfrage). Auf dem Server reicht `getAuthHeaders()` (`src/lib/utils/getAuthHeaders.ts`) das Zugangstoken `api-access-token` aus der Anfrage des Browsers als `Cookie`-Header weiter; im Browser schickt `credentials: 'include'` die Anmelde-Cookies mit.

Die Typen der Antworten kommen aus `src/lib/types/api.d.ts`, die openapi-typescript aus dem Schema des Backends erzeugt, siehe Abschnitt [OpenAPI-Schema und Typgenerierung](./32-rest-api.md#_32-7-openapi-schema-und-typgenerierung). `src/lib/types/index.ts` gibt ihnen kürzere Namen. Die Typen prüfen nur zur Entwicklungszeit; eine Prüfung der Antworten zur Laufzeit findet nicht statt.

Unbehandelte Fehler im Browser schickt `src/hooks.client.ts` an `logs/frontend/` des Backends; sie erscheinen in den Protokollen mit der Quelle „Frontend“, siehe Abschnitt [Protokolle auswerten](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-5-protokolle-auswerten).

`src/service-worker.ts` und `static/manifest.webmanifest` machen die Anwendung im Browser installierbar. Der Service Worker speichert nichts zwischen; ohne Verbindung zum Server funktioniert die Anwendung nicht.

## 33.2 Zustandsverwaltung, Kontexte und Remote Functions

Die Komponenten nutzen durchgehend die **Runes** von Svelte 5 (`$state`, `$derived`, `$effect`, `$props`); die Schreibweise von Svelte 4 (`export let`, `$:`) kommt nicht mehr vor. Für Zustand, der über eine Komponente hinausgeht, gibt es drei Mittel nebeneinander:

- **Zustandsklassen** – Klassen mit `$state`-Feldern, die den Zustand und die Logik einer Ansicht bündeln. Was mehrere Ansichten nutzen, liegt in `src/lib/classes/*.svelte.ts`: `MapState` und die `Map…Manager` der Karte, `NetworkSchemaState` mit seinen Managern, `NodeStructureManager`, `FiberSpliceManager`, `DragDropManager` für die Netzknotenstruktur, `AddressState` und andere. Klassen einer einzelnen Ansicht liegen neben ihrer Route, etwa `TrenchAssignmentState`, `PipeBranchState`, `FaultSimulationState` oder `ValuationState`.
- **Kontexte** – eine Ansicht erzeugt ihre Zustandsklassen einmal und reicht sie an ihre Komponenten weiter, meist über typisierte Kontexte aus `createContext` von Svelte (`src/lib/context/networkSchemaContext.ts`, `src/lib/context/project.ts` und die Klassen der Ansichten). Zeichenketten als Schlüssel nutzen noch die Karte (`'mapManagers'`) und die Auswahllisten (`'attributeOptions'`).
- **Stores** in `src/lib/stores/` – die Stores von Svelte nur noch für persönliche Vorlieben und Meldungen: die Einstellungen in `store.ts` und `sidebarPreferences.ts`, siehe Abschnitt [Benutzereinstellungen und deren Speicherung](#_33-7-benutzereinstellungen-und-deren-speicherung), und `toaster.ts`. Projekt, geöffnetes Objekt und Reiter stehen in der Adresse, siehe Abschnitt [SvelteKit-Struktur und Routen](#_33-1-sveltekit-struktur-und-routen); das angemeldete Konto mit seinen Rechten liefert die Wurzel-Lade-Funktion in `page.data.user`.

**Remote Functions** von SvelteKit sind der Weg, auf dem alle Ansichten ihre Fachdaten lesen und schreiben. Sie liegen in `src/lib/remote/<Bereich>/` – `address`, `conduit`, `map`, `network-schema`, `trace` usw.:

- `*.remote.ts` enthält die Funktionen selbst: `query` zum Lesen, `command` zum Schreiben, `form` für Anmeldung, Abmeldung und den Excel-Import der Rohre. Ihre Eingaben prüft valibot.
- Gleichnamige Dateien ohne `.remote` enthalten reine Hilfsfunktionen, etwa die Umformung der Antworten, mit eigenen Tests.
- `shared/` enthält, was alle brauchen: `djangoHeaders()` in `remote-auth.ts`, das die Anmeldung über `getRequestEvent()` aus der laufenden Anfrage holt, und `failFromResponse()` in `backend-error.ts`, das eine Fehlerantwort des Backends in einen Fehler mit Status und Meldung umsetzt.

Die Funktionen laufen auf dem Server und rufen das Backend über `API_URL` auf. Komponenten rufen eine `query` direkt auf und stellen sie in `QueryBoundary.svelte` dar, das bis zur Antwort einen Platzhalter und bei einem Fehler die Meldung mit der Schaltfläche „Erneut versuchen“ zeigt.

::: warning
Zwei Regeln gelten für jede neue Remote Function. `djangoHeaders()` muss vor dem ersten `await` stehen, weil `getRequestEvent()` danach keine Anfrage mehr kennt. Und Fehler müssen als `HttpError` von SvelteKit geworfen werden (`error()` oder `failFromResponse()`): Ein gewöhnliches `Error` erreicht den Browser nur als „Internal Error“, und die Meldung des Backends geht verloren.
:::

::: warning
Remote Functions sind in SvelteKit zum Stand des Handbuchs experimentell. Ihre Schnittstelle kann sich mit einer neuen Version von SvelteKit ändern, und weil die ganze Oberfläche auf ihnen aufbaut, betrifft eine solche Änderung jede Ansicht. Prüfen Sie nach einer Aktualisierung von `@sveltejs/kit` die Ansichten durchgehend, nicht nur stichprobenhaft.
:::

## 33.3 Kartenintegration mit OpenLayers

Die Karte ist OpenLayers 10, aufgebaut in `src/lib/components/Map.svelte`; die Logik für Auswahl, Info-Box, Messen und Hervorheben liegt in den Klassen `MapState`, `MapInteractionManager`, `MapSelectionManager`, `MapPopupManager` und `MapMeasureManager`. Der Faserweg hat eine eigene Karte (`src/routes/trace/components/TraceMap.svelte`). Was in der Karte zu sehen ist, stammt aus drei Quellen, siehe Abschnitt [Komponenten und Weg einer Anfrage](./29-architekturueberblick.md#_29-1-komponenten-und-weg-einer-anfrage).

**Hintergrundkarte.** `ol-mapbox-style` wendet den Stil `${PUBLIC_TILE_SERVER_URL}/styles/light/style.json` bzw. `…/dark/…` auf die Karte an. Ist der Kachelserver nicht erreichbar oder die Variable leer, fällt die Karte auf Rasterkacheln von OpenStreetMap zurück und hält das im Store `tileServerAvailable` fest, siehe auch Abschnitt [Kartenkacheln bereitstellen und erneuern](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-6-kartenkacheln-bereitstellen-und-erneuern).

**Netzobjekte.** Trassen, Netzknoten, Adressen und Gebiete kommen als Vektorkacheln vom Backend (`src/lib/map/tileSources.ts`), siehe Abschnitt [Vektor-Tile-Endpunkte](./32-rest-api.md#_32-6-vektor-tile-endpunkte). Ihre Verarbeitung ist auf Geschwindigkeit ausgelegt:

- Eine Kachel wird nicht im Hauptthread entpackt, sondern in einem Pool von Web Workern (`workerPool.ts`, `mvtParserWorker.ts`), mit so vielen Workern, wie der Rechner Kerne hat, höchstens vier. `featureReconstructor.ts` baut aus dem Ergebnis die Objekte für OpenLayers.
- Wechselt jemand die Seite, bricht `navigationCancellation.ts` alle laufenden Kachelanfragen ab; `tileLoadingManager.ts` hält dafür die `AbortController` der Anfragen.
- Antwortet das Backend auf eine Kachel mit 401, erneuert die Kachel die Anmeldung über `ensureFreshSession()` und wiederholt die Anfrage einmal; viele Kacheln zugleich lösen dabei nur eine Erneuerung aus, siehe Abschnitt [Anmeldung, Token-Erneuerung und Routenschutz im Frontend](#_33-8-anmeldung-token-erneuerung-und-routenschutz-im-frontend).

GeoJSON nutzt die Karte nur für Ebenen, die eine Ansicht selbst erzeugt: Suchtreffer, Faserweg, Störungsanalyse, Nachverdichtung, Auskunftsbereiche, Wertermittlung.

**WMS-Ebenen.** `TileWMS` in `src/lib/map/layers.ts` lädt die Bilder über den WMS-Proxy des Backends in Kacheln von 512 Pixeln in EPSG:3857. Quellen und Layer liest `src/lib/utils/wmsApi.ts` aus der Schnittstelle; den kurzlebigen Token für die Kachelanfragen hält `wmsTokenHeartbeat.svelte.ts` frisch.

**Projektion.** Die Karte zeigt Web Mercator. Geometrien, die das Backend im Koordinatenbezugssystem der Installation liefert – Suchtreffer, Auskunftsbereiche der Leitungsauskunft, Wertermittlung –, rechnet sie mit proj4 um; `src/lib/map/projectionUtils.ts` registriert dafür die Definition vom Endpunkt `config/`.

**Stile.** Wie die Objekte aussehen, legt `src/lib/map/styles.ts` fest, mit den Vorgabefarben aus `defaultColors.ts`; die Einstellungen der Nutzenden aus Kapitel [Einstellungen](../teil-a-anwenderhandbuch/17-einstellungen.md) überschreiben sie.

## 33.4 Diagramm- und Canvas-Ansichten

Drei Ansichten zeichnen Knoten und Kanten mit **Svelte Flow** (`@xyflow/svelte`):

- das **Netzschema** (`src/routes/project/[projectId=integer]/network-schema`) mit eigenen Knoten und Kanten für Netzknoten und Kabel (`CableDiagramNode`, `CableDiagramEdge`, `DynamicEdgeLabel`) und das Unternetz eines Netzknotens (`…/node/[nodeId]`),
- die **Rohrverzweigung** (`src/routes/project/[projectId=integer]/pipe-branch`) mit eigenen Knoten und Kanten für Rohre und Mikrorohre und einer Lasso-Auswahl, die auf ein eigenes Canvas zeichnet (`PipeBranchLasso.svelte`),
- das **Grabenprofil** einer Trasse in der Karte (`…/map/components/trench-profile/`).

Die Lage der Knoten im Netzschema speichert das Backend (`canvas_x`, `canvas_y` am Netzknoten, `diagram_path` am Kabel, siehe Abschnitt [Kabel, Faser, Spleiß](./31-datenmodell-des-backends.md#_31-4-kabel-faser-spleiß)). Die erste Lage eines neuen Netzknotens setzt ein Trigger der Datenbank, siehe Abschnitt [Netzknotenstruktur](./31-datenmodell-des-backends.md#_31-5-netzknotenstruktur-container-slots-und-komponenten); das Frontend rechnet keine Lagen aus. Der Ausschnitt, den jemand gerade betrachtet, steht im Browser (`networkSchemaViewport`).

Die **Netzknotenstruktur** – Steckplätze, Komponenten, Ports, Spleiße – ist dagegen kein Svelte-Flow-Diagramm, sondern gewöhnliches HTML; das Ziehen und Ablegen übernimmt `DragDropManager`.

Die **Diagramme** des Dashboards zeichnet Chart.js, gekapselt in `src/lib/components/Chart.svelte`, `DonutChart.svelte` und `StackedBarChart.svelte`. Die PDF-Dokumente der Nachverdichtung und der Adressen entstehen mit jsPDF im Browser.

## 33.5 Internationalisierung mit Paraglide

Die Texte der Oberfläche übersetzt Paraglide 2. Die Einstellungen stehen in `project.inlang/settings.json`: Ausgangssprache Deutsch (`baseLocale: "de"`), Sprachen `de` und `en`, die Texte in `messages/de.json` und `messages/en.json`. Das Vite-Plugin übersetzt sie beim Bauen in Funktionen in `src/lib/paraglide/`, die nicht im Repository liegen; im Code steht ein Text als Aufruf, etwa `m.nav_dashboard()`.

Die Sprache bestimmt Paraglide über die Strategie `['localStorage', 'baseLocale']` (`vite.config.ts` und das Skript `paraglide` in `package.json`): zuerst den Schlüssel `PARAGLIDE_LOCALE` im `localStorage` des Browsers, sonst Deutsch. Daraus folgt:

- Der Server kennt `localStorage` nicht und rendert jede Seite **auf Deutsch**. Wer Englisch gewählt hat, sieht beim Laden kurz die deutsche Fassung, bis der Browser übernimmt.
- Texte, die eine Lade- oder Remote Function auf dem Server mit Paraglide erzeugt, bleiben deutsch. Die meisten Fehlermeldungen der Server-Seite stehen ohnehin fest auf Englisch im Code oder kommen vom Backend.
- Die Sprache ist eine Einstellung des Browsers, nicht des Kontos, siehe Abschnitt [Benutzereinstellungen und deren Speicherung](#_33-7-benutzereinstellungen-und-deren-speicherung).

Das Backend übersetzt seine eigenen Texte – den Administrationsbereich, Meldungen der Schnittstelle – unabhängig davon mit gettext von Django, siehe Abschnitt [Eine weitere Sprache ergänzen](./36-erweitern-und-mitwirken.md#_36-3-eine-weitere-sprache-erganzen).

::: info
Der Kommentar in `src/lib/utils/userSettingsSync.ts`, die Sprache liege in einem eigenen Cookie, stimmt zum Stand des Handbuchs nicht; sie liegt im `localStorage`.
:::

## 33.6 Designsystem, Theming und Komponenten

Gestaltet ist die Oberfläche mit **Tailwind CSS 4** und **Skeleton 5** (`@skeletonlabs/skeleton`, `@skeletonlabs/skeleton-svelte`). Es gibt keine `tailwind.config`; Tailwind, das Formular-Plugin, Skeleton und dessen Theme `legacy` werden in `src/app.css` eingebunden, wo auch die Anpassungen für Svelte Flow und die Meldungen stehen. Die Symbole kommen aus `@tabler/icons-svelte`.

- **Theme** – `+layout.svelte` schreibt das Theme aus dem Store `theme` in das Attribut `data-theme` von `<html>`.
- **Hell und dunkel** – die Tailwind-Variante `dark` gilt unter `[data-mode="dark"]` (`@custom-variant dark` in `app.css`). `src/lib/components/LightSwitch.svelte` setzt das Attribut, speichert den Modus im Schlüssel `mode` des `localStorage` und setzt außerdem den Store `lightSwitchMode`. Gelesen wird nur `mode`. `lightSwitchMode` abonniert keine Komponente, und ein `persisted()`-Store schreibt erst in den `localStorage`, sobald er abonniert ist – der Schlüssel `lightSwitchMode` entsteht deshalb nie. Die Hintergrundkarte hat ihren eigenen Hell-Dunkel-Schalter (`basemapTheme`).

Gemeinsame Komponenten liegen flach in `src/lib/components/`: Karte, Info-Box (`Drawer`), Navigationsleiste (`SideBar`, unterhalb von 768 Pixeln `MobileNav`), Kopfzeile (`AppBar`), Auswahllisten, Diagramme, Suchfelder. Was nur eine Ansicht braucht, liegt neben ihrer Route. Von Skeleton kommen vor allem die Bausteine für Dialoge, Reiter, Akkordeons, Menüs, Auswahllisten, Schalter, Schieberegler, Seitenwechsel, Datei-Uploads und Meldungen.

## 33.7 Benutzereinstellungen und deren Speicherung

Die Einstellungen der Oberfläche liegen im `localStorage` des Browsers. `persisted()` in `src/lib/stores/persisted.ts` ist ein Store von Svelte, der seinen Wert beim ersten Abonnieren aus dem `localStorage` liest und jede Änderung dorthin zurückschreibt, als JSON unter einem festen Schlüssel. So sind in `src/lib/stores/store.ts` rund 35 Einstellungen angelegt: Sichtbarkeit und Transparenz der Layer, Trassenfarben und Stile der Netzknotentypen, Adressen und Gebiete, Routing-Toleranz, Breite der Info-Box, Anzeigeoptionen des Netzschemas, Lage und Größe verschiebbarer Fenster (`floatingPanelRects`) und mehr. `sidebarPreferences.ts` hält die ausgeblendeten Menüpunkte und eingeklappten Gruppen der Navigationsleiste. Zwei Ansichtszustände – das gewählte Rohr (`selectedConduit`) und ob die Legende der Karte aufgeklappt ist (`layerTreeExpanded`) – legt `session()` aus `session.ts` stattdessen im `sessionStorage` ab; sie gelten nur, solange der Tab offen ist.

Der `localStorage` gehört zur Adresse der Weboberfläche im Browser, nicht zum Konto. Melden sich zwei Personen nacheinander im selben Browser an, teilen sie die Einstellungen.

**Kartenausschnitt.** Den Ausschnitt einer Karte speichert kein Store. Die Karten der Ansichten Karte, Rohrzuordnung, Mikrorohre, Störungsanalyse und Wertermittlung schreiben ihn nach jeder Bewegung in das Fragment der Adresse (`#map=<Zoom>/<x>/<y>`, `src/lib/map/viewHash.ts`) und zusätzlich je Projekt in den `localStorage` unter `mapView:<Projektnummer>` (`src/lib/map/storedView.ts`). Beim Öffnen gilt das Fragment, dann der gespeicherte Ausschnitt des Projekts, dann die Ausdehnung seiner Trassen; ein leeres Projekt öffnet mit der Voreinstellung. Weil das Fragment nie zum Server geht, rendert dieser die Karte ohne Ausschnitt; erst der Browser setzt ihn.

**Zuletzt besuchtes Projekt.** Das Cookie `last-project` (`src/lib/utils/rememberedProject.ts`) merkt sich das Projekt, das zuletzt in der Adresse stand. Es wählt nur, wohin die Anmeldung und `/` führen und welches Projekt projektübergreifende Seiten wie die Leitungsauskunft vorschlagen; was eine Projektadresse zeigt, entscheidet allein ihr Pfad. Es überdauert die Abmeldung, und jeder Zugriff prüft es gegen die Projekte des Kontos.

**Im Konto speichern.** `src/lib/utils/userSettingsSync.ts` überträgt die Einstellungen auf Wunsch ins Backend, siehe Abschnitt [Einstellungen im Konto speichern und wieder laden](../teil-a-anwenderhandbuch/17-einstellungen.md#_17-2-einstellungen-im-konto-speichern-und-wieder-laden):

- `saveUserSettings()` liest die Schlüssel aus der Liste `SYNCED_SETTINGS_KEYS` aus dem `localStorage` und übergibt sie der Remote Function `saveSettings`, die sie mit `PUT user-settings/` an das Backend schickt; es legt sie als JSON in `user_settings` ab.
- `loadUserSettings()` holt sie über `getSavedSettings` mit `GET user-settings/` und schreibt sie zurück in den `localStorage`.

Übertragen wird nur, was in `SYNCED_SETTINGS_KEYS` steht. Kartenausschnitte, Sprache, der Schlüssel `mode` und die Lage der Fenster, die vom Bildschirm abhängt, gehören nicht dazu. Die Liste enthält zwar `lightSwitchMode`, aber weil die Oberfläche den Modus aus `mode` liest, folgt der Hell- oder Dunkelmodus dem Konto nicht. Eine neue Einstellung, die sich im Konto speichern lassen soll, braucht deshalb zwei Einträge: den `persisted()`-Store und den Schlüssel in der Liste. Das Speichern und Laden geschieht nur auf Knopfdruck; ein automatischer Abgleich zwischen Geräten findet nicht statt. Nach dem Laden lädt die Einstellungsseite die ganze Seite neu (`location.reload()`), weil die bereits abonnierten Stores den geänderten `localStorage` nicht von selbst lesen.

## 33.8 Anmeldung, Token-Erneuerung und Routenschutz im Frontend

Die Anmeldung der Weboberfläche läuft über den Server des Frontends. Die Remote Function `login` (`src/lib/remote/auth/login.remote.ts`, ein `form`) schickt Benutzername und Passwort an `auth/login/` des Backends, übernimmt die Cookies aus dessen Antwort und setzt sie für die eigene Antwort an den Browser. Danach leitet sie auf `redirectTo` weiter, sofern das ein Pfad derselben Anwendung ist, sonst auf die **Startseite** des Kontos. `logout` meldet beim Backend ab und löscht die Cookies auch dann, wenn das Backend nicht antwortet.

Die Startseite bestimmt `src/lib/server/landing.ts`: die Karte des zuletzt besuchten Projekts (Cookie `last-project`), sonst des ersten Projekts des Kontos, ohne Projekt die Einstellungen. Verbieten die Routenrechte diese Seite, ist es die erste erlaubte in der Reihenfolge der Navigationsleiste, und ist keine erlaubt, `/no-access` mit dem Hinweis, sich an die Administration zu wenden. Eine feste Projektnummer gibt es dabei nicht.

Bei jeder Anfrage an den Server des Frontends laufen zwei Hooks nacheinander (`src/hooks.server.ts`): Paraglide und `handleAuth`. `handleAuth` ist die einzige Prüfung der Anmeldung; Lade-Funktionen prüfen nicht noch einmal. Der Hook

1. ermittelt Konto und Rechte über `resolveSession()` (`src/lib/server/session.ts`): `auth/user/` und `auth/permissions/` beim Backend, beide gleichzeitig; bei 401 oder 403 erneuert er die Tokens einmal über `auth/token/refresh/` und fragt erneut,
2. lässt Aufrufe von Remote Functions durch, denn sie melden sich mit dem Token selbst beim Backend an,
3. leitet ohne gültige Anmeldung auf `/login?redirectTo=…` weiter und löscht dabei die Cookies,
4. leitet `/`, `/login` und Seiten, die die Routenrechte nicht erlauben, auf die Startseite um.

Das Ergebnis von Schritt 1 hält jeder Prozess des Frontends 30 Sekunden je Zugangstoken vor. Mehrere Aufrufe kurz hintereinander, wie sie eine Seite mit vielen Remote Functions auslöst, kosten das Backend deshalb nur die erste Abfrage. Eine geänderte Rolle wirkt im Frontend dadurch bis zu 30 Sekunden später, zusätzlich zum Zwischenspeicher des Backends, siehe Abschnitt [Berechtigungsprüfung in der Schnittstelle](./32-rest-api.md#_32-3-berechtigungsprufung-in-der-schnittstelle).

**Erneuerung ohne Seitenwechsel.** Der Zugangstoken gilt 15 Minuten. Bleibt jemand länger auf einer Seite, liefe er ab, ohne dass ein Hook zum Zug käme. Solange jemand angemeldet ist, erneuert `src/lib/utils/sessionKeepAlive.ts` ihn deshalb im Hintergrund über die Remote Function `refreshSession` (`src/lib/remote/auth/session.remote.ts`), nach der Hälfte der Gültigkeit, die das Backend meldet, also etwa alle siebeneinhalb Minuten. Die Seite lädt dabei nichts neu. Weil Browser die Zeitgeber von Tabs im Hintergrund drosseln, erneuert die Seite den Token außerdem, sobald ein Tab nach längerer Zeit wieder sichtbar wird.

Antwortet das Backend trotzdem mit 401, erneuern Kacheln, WMS-Anfragen und die Schaltfläche „Erneut versuchen“ in `QueryBoundary.svelte` die Anmeldung über `ensureFreshSession()` und wiederholen die Anfrage. Gleichzeitige Anfragen teilen sich eine Erneuerung, und innerhalb von 30 Sekunden nach einer erfolgreichen gilt die Anmeldung als frisch. Scheitert die Erneuerung, ist die Sitzung abgelaufen: Die Oberfläche meldet das und führt auf die Anmeldung, mit der aktuellen Adresse als `redirectTo`. Nach der Anmeldung öffnet sich dieselbe Ansicht mit demselben Objekt; den Kartenausschnitt stellt der gespeicherte Ausschnitt des Projekts wieder her.

**Routenschutz.** Geprüft wird nicht der Pfad, sondern ein **Rechteschlüssel**: die Route-ID ohne den Präfix des Projekts und ohne Parameter, gebildet von `permissionKeyFor()` in `src/lib/config/routes.ts`. `/project/2/valuation` hat den Schlüssel `/valuation`, `/project/2/address/<uuid>/unit/<uuid>` den Schlüssel `/address/unit`. `canAccessRoute()` in `src/lib/utils/permissions.ts` prüft ihn gegen die Routenrechte aus `auth/permissions/`: Ein Muster, das genau dem Schlüssel entspricht, entscheidet; sonst das genaueste Muster, das ihn abdeckt, wobei `/address/*` und `/address` gleichermaßen alles unterhalb von `/address/` abdecken. Bei gleich genauen Mustern gewinnt die Erlaubnis. Was kein Muster erfasst, ist erlaubt. Server-Hook, Startseite und Navigationsleiste nutzen dieselbe Funktion. `permissions.ts` enthält außerdem `canView`, `canEdit` und `canDelete`, mit denen die Ansichten Schaltflächen nach den Modellrechten ein- und ausblenden.

::: info
Schlagen die Rechte beim Backend fehl, etwa weil `auth/permissions/` kurz nicht antwortet, erlaubt `canAccessRoute()` jede Seite, damit ein Aussetzer des Backends nicht alle aussperrt. Die Daten bleiben trotzdem geschützt, weil das Backend die Modellrechte bei jeder Anfrage selbst prüft. Ein Konto ohne Gruppe bekommt dagegen ausdrücklich keine Seite (`/*` verboten) und landet auf `/no-access`.
:::

Routenrechte prüft nur das Frontend; was eine Anfrage an die Schnittstelle darf, entscheidet das Backend, siehe Abschnitt [Berechtigungsprüfung in der Schnittstelle](./32-rest-api.md#_32-3-berechtigungsprufung-in-der-schnittstelle). Wie eine neue Route mit Menüpunkt und Recht entsteht, beschreibt Abschnitt [Eine neue Route samt Berechtigung ergänzen](./36-erweitern-und-mitwirken.md#_36-2-eine-neue-route-samt-berechtigung-erganzen).
