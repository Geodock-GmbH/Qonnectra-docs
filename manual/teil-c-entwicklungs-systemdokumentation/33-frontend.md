# 33. Frontend

Dieses Kapitel beschreibt die Weboberfläche von innen: wie sie aufgebaut ist, wie sie Daten holt und hält, wie Karte und Diagramme entstehen und wie Sprache, Gestaltung und Einstellungen funktionieren. Wie Sie das Frontend lokal starten, beschreibt Abschnitt [Frontend starten](./30-entwicklungsumgebung.md#_30-3-frontend-starten). Alle Pfade sind relativ zu `frontend/`.

## 33.1 SvelteKit-Struktur und Routen

Das Frontend ist eine SvelteKit-Anwendung mit Svelte 5 und TypeScript. Es läuft mit `@sveltejs/adapter-node` als eigener Node-Prozess und rendert jede Seite beim ersten Aufruf auf dem Server vor. Zwei experimentelle Schalter sind eingeschaltet (`svelte.config.js`): `kit.experimental.remoteFunctions` für die Remote Functions, siehe Abschnitt [Zustandsverwaltung](#_33-2-zustandsverwaltung-kontexte-und-remote-functions), und `compilerOptions.experimental.async` für `await` in Komponenten.

Unter `src/routes/` liegt je Menüpunkt eine Route, mit dem Pfad aus der Navigationsleiste:

| Route | Ansicht |
|---|---|
| `dashboard/[[projectId]]/[[flagId]]` | Dashboard |
| `map/[[projectId]]` | Karte |
| `fault-simulation/[[projectId]]`, `post-compaction`, `pipeline-records`, `valuation/[[projectId]]` | Störungsanalyse, Nachverdichtung, Leitungsauskunft, Wertermittlung |
| `conduit/[[projectId]]`, `trench/[[projectId]]/[[flagId]]`, `pipe-branch/[[projectId]]`, `house-connections/[[projectId]]` | Rohrverwaltung, Rohrzuordnung, Rohrverzweigung, Mikrorohre |
| `network-schema/[[projectId]]`, `trace/…` | Netzschema, Faserweg |
| `address/[projectId]/…` | Adressen |
| `settings`, `admin/logs` | Einstellungen, Logs |
| `login`, `logout` | Anmeldung und Abmeldung |

Die Projektnummer steht als optionaler Parameter (`[[projectId]]`) im Pfad, bei den Adressen als Pflichtparameter (`[projectId]`). Ruft jemand eine Ansicht ohne sie auf, ergänzt der Server-Hook `handleProjectRedirect` sie aus dem Cookie `selected-project`; `/` leitet auf `/map` weiter. `src/routes/api/` enthält zwei eigene Server-Endpunkte für die Faserverbindungen einer Adresse bzw. Wohneinheit, keinen allgemeinen Durchgang zum Backend.

Fast jede Seite hat eine `+page.server.ts`, die ihre Daten auf dem Server lädt; Formularaktionen (`actions`) speichern dort, wo eine Seite ein klassisches Formular hat. Die Wurzel `+layout.server.ts` lädt für jede Seite die Projekte, die Kennzeichen, die Konfiguration vom Endpunkt `config/` des Backends (Koordinatenbezugssystem und seine Definition für proj4) und die Version der Anwendung.

**Wie das Frontend das Backend aufruft.** Es gibt keinen generierten Client; der Code ruft `fetch` direkt auf, auf den beiden Wegen aus Abschnitt [Komponenten und Weg einer Anfrage](./29-architekturueberblick.md#_29-1-komponenten-und-weg-einer-anfrage). Auf dem Server reicht `getAuthHeaders()` (`src/lib/utils/getAuthHeaders.ts`) die Anmelde-Cookies aus der Anfrage des Browsers als `Cookie`-Header weiter; im Browser schickt `credentials: 'include'` sie mit.

Die Typen der Antworten kommen aus `src/lib/types/api.d.ts`, die openapi-typescript aus dem Schema des Backends erzeugt, siehe Abschnitt [OpenAPI-Schema und Typgenerierung](./32-rest-api.md#_32-7-openapi-schema-und-typgenerierung). `src/lib/types/index.ts` gibt ihnen kürzere Namen. Die Typen prüfen nur zur Entwicklungszeit; eine Prüfung der Antworten zur Laufzeit findet nicht statt.

Unbehandelte Fehler im Browser schickt `src/hooks.client.ts` an `logs/frontend/` des Backends; sie erscheinen in den Protokollen mit der Quelle „Frontend“, siehe Abschnitt [Protokolle auswerten](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-5-protokolle-auswerten).

`src/service-worker.ts` und `static/manifest.webmanifest` machen die Anwendung im Browser installierbar. Der Service Worker speichert nichts zwischen; ohne Verbindung zum Server funktioniert die Anwendung nicht.

## 33.2 Zustandsverwaltung, Kontexte und Remote Functions

Die Komponenten nutzen durchgehend die **Runes** von Svelte 5 (`$state`, `$derived`, `$effect`, `$props`); die Schreibweise von Svelte 4 (`export let`, `$:`) kommt nicht mehr vor. Für Zustand, der über eine Komponente hinausgeht, gibt es drei Mittel nebeneinander:

- **Zustandsklassen** in `src/lib/classes/*.svelte.ts` – Klassen mit `$state`-Feldern, die den Zustand und die Logik einer Ansicht bündeln: `MapState` und die `Map…Manager` der Karte, `NetworkSchemaState` mit seinen Managern, `NodeStructureManager`, `FiberSpliceManager`, `DragDropManager` für die Netzknotenstruktur, `ConduitState`, `AddressState`, `TrenchProfileState` und andere. Logik, die mehr als eine Komponente braucht, liegt in diesen Klassen.
- **Kontexte** – eine Ansicht erzeugt ihre Zustandsklassen einmal und reicht sie mit `setContext` an ihre Komponenten weiter. Das Netzschema nutzt dafür typisierte Kontexte aus `src/lib/context/networkSchemaContext.ts`, die übrigen Ansichten Zeichenketten als Schlüssel (`'mapManagers'`, `'conduitState'` …). Einige Routen bringen eigene Kontextmodule mit, etwa `src/routes/trace/traceMapContext.svelte.ts`.
- **Stores** in `src/lib/stores/` – die Stores von Svelte für alles, was über Ansichten hinweg gilt: das ausgewählte Projekt, die Info-Box (`drawer.ts`), Meldungen (`toaster.ts`), das angemeldete Konto (`auth.ts`) und die Einstellungen in `store.ts`, siehe Abschnitt [Benutzereinstellungen und deren Speicherung](#_33-7-benutzereinstellungen-und-deren-speicherung).

**Remote Functions** von SvelteKit liegen in `src/lib/remote/network-schema/*.remote.ts`. Genutzt werden sie vom Netzschema und von der Kabelliste der Info-Box in der Karte (`CableTrenchDataManager`). Lesende Funktionen sind `query`, schreibende `command`; ihre Eingaben prüft valibot. Sie laufen auf dem Server und rufen das Backend über `API_URL` auf; die Anmeldung holt `djangoHeaders()` in `remote-auth.ts` über `getRequestEvent()` aus der laufenden Anfrage. Alle anderen Ansichten arbeiten mit Lade-Funktionen, Formularaktionen und `fetch` im Browser.

::: warning
Remote Functions sind in SvelteKit zum Stand des Handbuchs experimentell. Ihre Schnittstelle kann sich mit einer neuen Version von SvelteKit ändern; prüfen Sie bei einer Aktualisierung von `@sveltejs/kit` das Netzschema und die Kabelliste der Karte zuerst.
:::

## 33.3 Kartenintegration mit OpenLayers

Die Karte ist OpenLayers 10, aufgebaut in `src/lib/components/Map.svelte`; die Logik für Auswahl, Info-Box, Messen und Hervorheben liegt in den Klassen `MapState`, `MapInteractionManager`, `MapSelectionManager`, `MapPopupManager` und `MapMeasureManager`. Der Faserweg hat eine eigene Karte (`src/routes/trace/components/TraceMap.svelte`). Was in der Karte zu sehen ist, stammt aus drei Quellen, siehe Abschnitt [Komponenten und Weg einer Anfrage](./29-architekturueberblick.md#_29-1-komponenten-und-weg-einer-anfrage).

**Hintergrundkarte.** `ol-mapbox-style` wendet den Stil `${PUBLIC_TILE_SERVER_URL}/styles/light/style.json` bzw. `…/dark/…` auf die Karte an. Ist der Kachelserver nicht erreichbar oder die Variable leer, fällt die Karte auf Rasterkacheln von OpenStreetMap zurück und hält das im Store `tileServerAvailable` fest, siehe auch Abschnitt [Kartenkacheln bereitstellen und erneuern](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-6-kartenkacheln-bereitstellen-und-erneuern).

**Netzobjekte.** Trassen, Netzknoten, Adressen und Gebiete kommen als Vektorkacheln vom Backend (`src/lib/map/tileSources.ts`), siehe Abschnitt [Vektor-Tile-Endpunkte](./32-rest-api.md#_32-6-vektor-tile-endpunkte). Ihre Verarbeitung ist auf Geschwindigkeit ausgelegt:

- Eine Kachel wird nicht im Hauptthread entpackt, sondern in einem Pool von Web Workern (`workerPool.ts`, `mvtParserWorker.ts`), mit so vielen Workern, wie der Rechner Kerne hat, höchstens vier. `featureReconstructor.ts` baut aus dem Ergebnis die Objekte für OpenLayers.
- Wechselt jemand die Seite, bricht `navigationCancellation.ts` alle laufenden Kachelanfragen ab; `tileLoadingManager.ts` hält dafür die `AbortController` der Anfragen.
- Antwortet das Backend auf eine Kachel mit 401, ruft die Kachel `invalidateAll()` auf, damit der Server-Hook den Token erneuert, und wiederholt die Anfrage einmal, siehe Abschnitt [Anmeldung, Token-Erneuerung und Routenschutz im Frontend](#_33-8-anmeldung-token-erneuerung-und-routenschutz-im-frontend).

GeoJSON nutzt die Karte nur für Ebenen, die eine Ansicht selbst erzeugt: Suchtreffer, Faserweg, Störungsanalyse, Nachverdichtung, Auskunftsbereiche, Wertermittlung.

**WMS-Ebenen.** `TileWMS` in `src/lib/map/layers.ts` lädt die Bilder über den WMS-Proxy des Backends in Kacheln von 512 Pixeln in EPSG:3857. Quellen und Layer liest `src/lib/utils/wmsApi.ts` aus der Schnittstelle; den kurzlebigen Token für die Kachelanfragen hält `wmsTokenHeartbeat.svelte.ts` frisch.

**Projektion.** Die Karte zeigt Web Mercator. Geometrien, die das Backend im Koordinatenbezugssystem der Installation liefert – Suchtreffer, Auskunftsbereiche der Leitungsauskunft, Wertermittlung –, rechnet sie mit proj4 um; `src/lib/map/projectionUtils.ts` registriert dafür die Definition vom Endpunkt `config/`.

**Stile.** Wie die Objekte aussehen, legt `src/lib/map/styles.ts` fest, mit den Vorgabefarben aus `defaultColors.ts`; die Einstellungen der Nutzenden aus Kapitel [Einstellungen](../teil-a-anwenderhandbuch/17-einstellungen.md) überschreiben sie.

## 33.4 Diagramm- und Canvas-Ansichten

Drei Ansichten zeichnen Knoten und Kanten mit **Svelte Flow** (`@xyflow/svelte`):

- das **Netzschema** (`src/routes/network-schema/[[projectId]]`) mit eigenen Knoten und Kanten für Netzknoten und Kabel (`CableDiagramNode`, `CableDiagramEdge`, `DynamicEdgeLabel`) und das Unternetz eines Netzknotens (`…/node/[nodeId]`),
- die **Rohrverzweigung** (`src/routes/pipe-branch/[[projectId]]`) mit eigenen Knoten und Kanten für Rohre und Mikrorohre und einer Lasso-Auswahl, die auf ein eigenes Canvas zeichnet (`PipeBranchLasso.svelte`),
- das **Grabenprofil** einer Trasse in der Karte (`src/routes/map/[[projectId]]/TrenchProfile*.svelte`).

Die Lage der Knoten im Netzschema speichert das Backend (`canvas_x`, `canvas_y` am Netzknoten, `diagram_path` am Kabel, siehe Abschnitt [Kabel, Faser, Spleiß](./31-datenmodell-des-backends.md#_31-4-kabel-faser-spleiß)); der Ausschnitt, den jemand gerade betrachtet, steht im Browser (`networkSchemaViewport`).

Die **Netzknotenstruktur** – Steckplätze, Komponenten, Ports, Spleiße – ist dagegen kein Svelte-Flow-Diagramm, sondern gewöhnliches HTML; das Ziehen und Ablegen übernimmt `DragDropManager`.

Die **Diagramme** des Dashboards zeichnet Chart.js, gekapselt in `src/lib/components/Chart.svelte`, `DonutChart.svelte` und `StackedBarChart.svelte`. Die PDF-Dokumente der Nachverdichtung und der Adressen entstehen mit jsPDF im Browser.

## 33.5 Internationalisierung mit Paraglide

Die Texte der Oberfläche übersetzt Paraglide 2. Die Einstellungen stehen in `project.inlang/settings.json`: Ausgangssprache Deutsch (`baseLocale: "de"`), Sprachen `de` und `en`, die Texte in `messages/de.json` und `messages/en.json`. Das Vite-Plugin übersetzt sie beim Bauen in Funktionen in `src/lib/paraglide/`, die nicht im Repository liegen; im Code steht ein Text als Aufruf, etwa `m.nav_dashboard()`.

Die Sprache bestimmt Paraglide über die Strategie `['localStorage', 'baseLocale']` (`vite.config.ts` und das Skript `paraglide` in `package.json`): zuerst den Schlüssel `PARAGLIDE_LOCALE` im `localStorage` des Browsers, sonst Deutsch. Daraus folgt:

- Der Server kennt `localStorage` nicht und rendert jede Seite **auf Deutsch**. Wer Englisch gewählt hat, sieht beim Laden kurz die deutsche Fassung, bis der Browser übernimmt.
- Texte, die eine Lade-Funktion auf dem Server mit Paraglide erzeugt, bleiben deutsch. Die meisten Fehlermeldungen der Server-Seite stehen ohnehin fest auf Englisch im Code oder kommen vom Backend.
- Die Sprache ist eine Einstellung des Browsers, nicht des Kontos, siehe Abschnitt [Benutzereinstellungen und deren Speicherung](#_33-7-benutzereinstellungen-und-deren-speicherung).

Das Backend übersetzt seine eigenen Texte – den Administrationsbereich, Meldungen der Schnittstelle – unabhängig davon mit gettext von Django, siehe Abschnitt [Eine weitere Sprache ergänzen](./36-erweitern-und-mitwirken.md#_36-3-eine-weitere-sprache-erganzen).

::: info
Der Kommentar in `src/lib/utils/userSettingsSync.ts`, die Sprache liege in einem eigenen Cookie, stimmt zum Stand des Handbuchs nicht; sie liegt im `localStorage`.
:::

## 33.6 Designsystem, Theming und Komponenten

Gestaltet ist die Oberfläche mit **Tailwind CSS 4** und **Skeleton 5** (`@skeletonlabs/skeleton`, `@skeletonlabs/skeleton-svelte`). Es gibt keine `tailwind.config`; Tailwind, das Formular-Plugin, Skeleton und dessen Theme `legacy` werden in `src/app.css` eingebunden, wo auch die Anpassungen für Svelte Flow und die Meldungen stehen. Die Symbole kommen aus `@tabler/icons-svelte`.

- **Theme** – `+layout.svelte` schreibt das Theme aus dem Store `theme` in das Attribut `data-theme` von `<html>`.
- **Hell und dunkel** – die Tailwind-Variante `dark` gilt unter `[data-mode="dark"]` (`@custom-variant dark` in `app.css`). `src/lib/components/LightSwitch.svelte` setzt das Attribut und speichert den Modus doppelt, im Schlüssel `mode` des `localStorage` und im Store `lightSwitchMode`. Gelesen wird nur `mode`; `lightSwitchMode` wird geschrieben, aber nie ausgewertet. Die Hintergrundkarte hat ihren eigenen Hell-Dunkel-Schalter (`basemapTheme`).

Gemeinsame Komponenten liegen flach in `src/lib/components/`: Karte, Info-Box (`Drawer`), Navigationsleiste (`SideBar`, unterhalb von 768 Pixeln `MobileNav`), Kopfzeile (`AppBar`), Auswahllisten, Diagramme, Suchfelder. Was nur eine Ansicht braucht, liegt neben ihrer Route. Von Skeleton kommen vor allem die Bausteine für Dialoge, Reiter, Akkordeons, Menüs, Auswahllisten, Schalter, Schieberegler, Seitenwechsel, Datei-Uploads und Meldungen.

## 33.7 Benutzereinstellungen und deren Speicherung

Die Einstellungen der Oberfläche liegen im `localStorage` des Browsers. `persisted()` in `src/lib/stores/persisted.ts` ist ein Store von Svelte, der seinen Wert beim ersten Abonnieren aus dem `localStorage` liest und jede Änderung dorthin zurückschreibt, als JSON unter einem festen Schlüssel. So sind in `src/lib/stores/store.ts` rund 35 Einstellungen angelegt: Kartenposition (`mapCenter`, `mapZoom`), Sichtbarkeit und Transparenz der Layer, Trassenfarben und Stile der Netzknotentypen, Adressen und Gebiete, Routing-Toleranz, Breite der Info-Box, Anzeigeoptionen des Netzschemas und mehr. `sidebarPreferences.ts` hält die ausgeblendeten Menüpunkte und eingeklappten Gruppen der Navigationsleiste.

Der `localStorage` gehört zur Adresse der Weboberfläche im Browser, nicht zum Konto. Melden sich zwei Personen nacheinander im selben Browser an, teilen sie die Einstellungen.

**Im Konto speichern.** `src/lib/utils/userSettingsSync.ts` überträgt die Einstellungen auf Wunsch ins Backend, siehe Abschnitt [Einstellungen im Konto speichern und wieder laden](../teil-a-anwenderhandbuch/17-einstellungen.md#_17-2-einstellungen-im-konto-speichern-und-wieder-laden):

- `saveUserSettings()` liest die Schlüssel aus der Liste `SYNCED_SETTINGS_KEYS` aus dem `localStorage` und schickt sie mit `PUT user-settings/` an das Backend, das sie als JSON in `user_settings` ablegt.
- `loadUserSettings()` holt sie mit `GET user-settings/` und schreibt sie zurück in den `localStorage`.

Übertragen wird nur, was in `SYNCED_SETTINGS_KEYS` steht. Kartenposition, Sprache und der Schlüssel `mode` gehören nicht dazu. Die Liste enthält zwar `lightSwitchMode`, aber weil die Oberfläche den Modus aus `mode` liest, folgt der Hell- oder Dunkelmodus dem Konto nicht. Eine neue Einstellung, die sich im Konto speichern lassen soll, braucht deshalb zwei Einträge: den `persisted()`-Store und den Schlüssel in der Liste. Das Speichern und Laden geschieht nur auf Knopfdruck; ein automatischer Abgleich zwischen Geräten findet nicht statt. Nach dem Laden lädt die Einstellungsseite die ganze Seite neu (`location.reload()`), weil die bereits abonnierten Stores den geänderten `localStorage` nicht von selbst lesen.

## 33.8 Anmeldung, Token-Erneuerung und Routenschutz im Frontend

Die Anmeldung der Weboberfläche läuft über den Server des Frontends. Die Formularaktion in `src/routes/login/+page.server.ts` schickt Benutzername und Passwort an `auth/login/` des Backends, übernimmt die Cookies aus dessen Antwort und setzt sie für die eigene Antwort an den Browser. Fehlt das Cookie `selected-project`, setzt sie es auf 1.

Bei jeder Anfrage an den Server des Frontends laufen drei Hooks nacheinander (`src/hooks.server.ts`): Paraglide, `handleAuth` und `handleProjectRedirect`. `handleAuth`

1. fragt mit dem Zugangstoken aus dem Cookie `auth/user/` beim Backend ab,
2. erneuert bei 401 oder 403 die Tokens über `auth/token/refresh/` und übernimmt die neuen Cookies, dann fragt es erneut,
3. holt bei Erfolg die Rechte des Kontos über `auth/permissions/` und legt Konto und Rechte in `event.locals.user` ab,
4. löscht andernfalls beide Cookies und leitet auf `/login?redirectTo=…` weiter,
5. leitet auf `/map` weiter, wenn die Routenrechte den angefragten Pfad nicht erlauben.

Jede Seitenanfrage kostet damit mindestens zwei Anfragen an das Backend, bevor die Seite selbst ihre Daten lädt.

**Erneuerung ohne Seitenwechsel.** Der Zugangstoken gilt 15 Minuten. Bleibt jemand länger auf einer Seite, ohne zu navigieren, käme kein Hook zum Zug, und die Anfragen des Browsers liefen ins Leere. `src/lib/utils/tokenHeartbeat.svelte.ts` ruft deshalb alle sieben Minuten `invalidateAll()` auf: SvelteKit lädt die Daten der Seite neu, der Server-Hook läuft und erneuert die Tokens. Dieselbe Rolle spielt `invalidateAll()` in den Kachelanfragen und beim Speichern der Einstellungen, wenn das Backend mit 401 antwortet.

**Routenschutz.** `canAccessRoute()` prüft einen Pfad gegen die Routenrechte aus `auth/permissions/`: erst ein genauer Treffer, dann Muster mit `/*`; was kein Muster erfasst, ist erlaubt. Die Funktion gibt es zweimal, im Server-Hook und in `src/lib/utils/permissions.ts` für die Navigationsleiste; ändern Sie beide gemeinsam. `permissions.ts` enthält außerdem `canView`, `canEdit` und `canDelete`, mit denen die Ansichten Schaltflächen nach den Modellrechten ein- und ausblenden.

Routenrechte prüft nur das Frontend; was eine Anfrage an die Schnittstelle darf, entscheidet das Backend, siehe Abschnitt [Berechtigungsprüfung in der Schnittstelle](./32-rest-api.md#_32-3-berechtigungsprufung-in-der-schnittstelle). Wie eine neue Route mit Menüpunkt und Recht entsteht, beschreibt Abschnitt [Eine neue Route samt Berechtigung ergänzen](./36-erweitern-und-mitwirken.md#_36-2-eine-neue-route-samt-berechtigung-erganzen).
