# 34. Qualitätssicherung

Dieses Kapitel beschreibt die Tests, Prüfwerkzeuge und automatischen Abläufe des Repositorys: was es gibt, wie Sie es ausführen und was davon bei jedem Commit läuft. Die Zahlen stammen aus einem Lauf gegen den Stand, auf dem das Handbuch beruht, Commit `aa28575`.

| Ebene | Werkzeug | Umfang | In der CI |
|---|---|---|---|
| Backend | pytest mit pytest-django und factory_boy | 1114 Tests, alle bestanden | nein |
| Frontend | Vitest | 1940 Tests in 179 Dateien, alle bestanden | ja |
| End-to-End | Playwright | 99 Tests in 13 Dateien, je in drei Browsern | nur von Hand |
| Typen | svelte-check | ohne Befund | ja |
| Formatierung und Linting | Prettier, ESLint, ruff | mit Befunden, siehe Abschnitt [Linting, Formatierung und Typprüfung](#_34-4-linting-formatierung-und-typprufung) | nein |

## 34.1 Backend-Tests

Die Tests des Backends liegen in `backend/apps/api/tests/`: Dateien `test_*.py` für Endpunkte, Dienste, Routing, Faserweg, Rechte, Signale und Validatoren, dazu die Unterordner `models/` und `viewsets/`. Testdaten erzeugen die Factories in `factories.py` (factory_boy); `conftest.py` stellt sie als Fixtures bereit, schaltet für jeden Test auf Englisch, damit Meldungen vergleichbar sind, und leert den Zwischenspeicher der Content Types.

Die Konfiguration steht in `pytest.ini` im **Wurzelverzeichnis** des Repositorys, nicht in `backend/`. pytest sucht sie vom Arbeitsverzeichnis aus nach oben und findet sie auch aus `backend/` heraus; dort greift zusätzlich die Einstellung der Abdeckung aus `backend/pyproject.toml`:

```bash
cd backend
uv sync --dev
uv run pytest
```

Die Tests brauchen eine echte PostgreSQL-Datenbank mit PostGIS; eine SQLite-Datenbank genügt nicht, weil Geometrien, Trigger und `pg_trgm` im Spiel sind. Die Verbindung kommt wie beim Entwicklungsserver aus `deployment/.env` und der Shell, siehe Abschnitt [Backend starten](./30-entwicklungsumgebung.md#_30-2-backend-starten). pytest-django legt daneben eine Testdatenbank `test_<DB_NAME>` an; das Konto aus `DB_USER` braucht dafür das Recht, Datenbanken anzulegen. Der Container aus Abschnitt [Backend starten](./30-entwicklungsumgebung.md#_30-2-backend-starten) legt `POSTGRES_USER` als Superuser an und erfüllt das.

Der Lauf, aus dem die Zahl in der Tabelle oben stammt, nutzte die Python-Pakete des Backend-Images, nicht die aus `uv.lock`, siehe Abschnitt [Technologiestack](./29-architekturueberblick.md#_29-2-technologiestack).

`--reuse-db` steht in den Voreinstellungen: Die Testdatenbank bleibt zwischen zwei Läufen bestehen, und ein Lauf beginnt ohne erneute Migration. Nach einer neuen Migration rufen Sie pytest einmal mit `--create-db` auf, sonst laufen die Tests gegen den alten Stand der Tabellen.

`pytest.ini` deklariert die Marker `slow`, `integration` und `unit`, kein Test setzt sie aber; `-m integration` wählt deshalb nichts aus. Teile wählen Sie über den Pfad oder mit `-k`. `--strict-markers` lässt außer den eingebauten Markern von pytest keine anderen als die deklarierten zu. Die Abdeckung misst pytest-cov, eingestellt in `backend/pyproject.toml` (`[tool.coverage.*]`): `uv run pytest --cov` in `backend/`.

::: info
`backend/README.md` nennt Testdateien, die es nicht mehr gibt (`test_models.py`). Maßgeblich ist der Inhalt von `backend/apps/api/tests/`.
:::

## 34.2 Frontend-Tests

Die Tests des Frontends führt Vitest aus, eingestellt in `frontend/vite.config.ts` mit zwei Projekten:

- **`client`** – Komponenten und Zustandsklassen, Dateien `*.svelte.test.ts`, in jsdom mit der Testing Library für Svelte. `vitest-setup-client.js` ersetzt dort alle Remote Functions (`*.remote`), `ResizeObserver` und `matchMedia` durch Attrappen.
- **`server`** – Lade-Funktionen, Formularaktionen und Hilfsfunktionen, Dateien `*.test.ts`, in Node.

Die Tests liegen neben dem Code, den sie prüfen. Gemeinsame Attrappen stehen in `src/lib/test-utils/`, darunter eine für Svelte Flow und eine für die Karte; einige Komponenten haben für ihre Tests eine Hülle `*.fixture.svelte`.

```bash
cd frontend
npm test               # alle Tests einmal
npm run test:unit      # im Beobachtungsmodus
npm run test:coverage  # mit Abdeckung, Bericht in coverage/
```

Die Tests brauchen weder Backend noch Datenbank. In der CI laufen sie mit `TZ=Europe/Berlin`; Tests mit Datumsangaben können in einer anderen Zeitzone abweichen. Setzen Sie die Variable lokal ebenso, wenn ein solcher Test nur bei Ihnen scheitert.

## 34.3 End-to-End-Tests

Die End-to-End-Tests liegen in `frontend/tests/e2e/`, eine Datei je Bereich der Oberfläche, mit gemeinsamer Anmeldung in `helpers/auth.js`. `frontend/playwright.config.js` startet sie in Chromium, Firefox und WebKit gegen `http://localhost:5173` und ruft dafür selbst `npm run dev` auf, falls dort noch nichts läuft.

Die Tests klicken sich durch eine laufende Anwendung. Sie brauchen deshalb:

- ein laufendes Backend mit Daten, an das das Frontend über `.env` angeschlossen ist, siehe Kapitel [Entwicklungsumgebung](./30-entwicklungsumgebung.md),
- ein Konto zum Anmelden, in `frontend/.env` als `E2E_TEST_USERNAME` und `E2E_TEST_PASSWORD`.

Fehlen die Zugangsdaten oder schlägt die Anmeldung fehl, überspringen die Tests sich selbst, statt zu scheitern. Ein Lauf ohne Fehler sagt deshalb nur etwas, wenn der Bericht auch ausgeführte Tests zeigt.

```bash
cd frontend
npx playwright install --with-deps   # einmal: Browser installieren
npx playwright test
npx playwright show-report
```

::: warning
Der Workflow „Playwright Tests“ in GitHub Actions startet nur von Hand und bringt weder Backend noch Zugangsdaten mit. Auf GitHub überspringen die Tests sich deshalb alle selbst; aussagekräftig ist nur ein lokaler Lauf gegen eine vollständige Umgebung.
:::

## 34.4 Linting, Formatierung und Typprüfung

**Frontend.** Die Namen der Skripte in `frontend/package.json` führen teils in die Irre:

| Skript | Wirkung |
|---|---|
| `npm run check` | übersetzt die Texte mit Paraglide, synchronisiert SvelteKit und prüft Typen mit svelte-check |
| `npm run lint` | prüft nur die Formatierung mit Prettier |
| `npm run lint:ts` | ESLint über `src/**/*.{ts,svelte}` |
| `npm run format` | formatiert alles mit Prettier – zum Stand des Handbuchs auch fremde Dateien |

Prettier ist eingestellt in `.prettierrc`: Tabulatoren, einfache Anführungszeichen, 100 Zeichen, das Plugin für Svelte und eine feste Reihenfolge der Importe. ESLint (`eslint.config.js`) nutzt die empfohlenen Regeln für TypeScript und Svelte und verbietet vor allem `any`.

**Backend.** Für Python gibt es nur ruff, ohne eigene Konfiguration, also mit seinen Voreinstellungen. Rufen Sie es über uv auf, damit die gesperrte Version läuft:

```bash
cd backend
uv run ruff check .
uv run ruff format --check .
```

Eine andere Version von ruff findet andere Dinge: Mit der gesperrten Version 0.11.4 meldet `ruff check` zum Stand des Handbuchs einen Befund, mit einer aktuellen mehrere hundert. Typprüfung für Python (mypy o. ä.) und pre-commit-Hooks gibt es nicht.

Zum Stand des Handbuchs ist nur svelte-check ohne Befund. ESLint meldet rund 200 Fehler, Prettier zwei Dateien, die Paraglide selbst in `project.inlang/` erzeugt, und `ruff format --check` 32 Dateien im Backend, die es anders formatieren würde. Keines dieser Werkzeuge läuft in der CI; ein neuer Befund fällt dort nicht auf. Prüfen Sie Ihre eigenen Änderungen deshalb vor dem Commit selbst, und formatieren Sie nur die geänderten Dateien – `npx prettier --write <Datei>`, `uv run ruff format <Datei>` –, damit der Diff nicht fremde Stellen umformatiert.

In VS Code formatiert `.vscode/settings.json` beim Speichern Python mit ruff, JavaScript mit Prettier und Svelte mit der Svelte-Erweiterung, sofern die Erweiterungen installiert sind; für TypeScript legt die Datei keinen Formatierer fest.

## 34.5 CI-Pipeline

Die automatischen Abläufe liegen in `.github/workflows/`:

| Workflow | Auslöser | Wirkung |
|---|---|---|
| `frontend-ci.yml` („Frontend CI“) | Push und Pull Request auf `main` | `npm ci`, `npm run check`, prüft `api.d.ts`, `npm test` |
| `playwright.yml` („Playwright Tests“) | nur von Hand | End-to-End-Tests, Bericht als Artefakt, siehe Abschnitt [End-to-End-Tests](#_34-3-end-to-end-tests) |
| `release-please.yml` | Push auf `main` | pflegt den Release-Pull-Request, siehe Abschnitt [Beitragsprozess, Versionierung, Releases](./36-erweitern-und-mitwirken.md#_36-4-beitragsprozess-versionierung-releases) |

Die CI des Frontends erzeugt `src/lib/types/api.d.ts` aus der eingecheckten `backend/schema.yml` neu und bricht ab, wenn sich die Datei dabei ändert. Damit fällt auf, wenn jemand das Schema erneuert, die Typen aber nicht; dass das Schema zum Code des Backends passt, prüft sie nicht, siehe Abschnitt [OpenAPI-Schema und Typgenerierung](./32-rest-api.md#_32-7-openapi-schema-und-typgenerierung).

::: warning
Für das Backend gibt es keine CI. Seine Tests, ruff und das Schema prüft niemand automatisch; ein Pull Request, der das Backend bricht, besteht die Prüfungen auf GitHub. Lassen Sie `pytest` vor jedem Pull Request, der das Backend berührt, selbst laufen.
:::

Images baut keiner der Workflows; die Container entstehen auf dem Server, siehe Abschnitt [Container und Images](./35-bereitstellung-und-infrastruktur.md#_35-2-container-und-images).
