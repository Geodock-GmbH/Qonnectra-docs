# 32. REST-API

Dieses Kapitel beschreibt die Schnittstelle des Backends: wie sich ein Programm anmeldet, wie die Endpunkte aufgebaut sind, welche Rechte sie prüfen und wie sie antworten. Die Weboberfläche bezieht ihre Fachdaten ausschließlich über diese Schnittstelle; alles, was sie davon anzeigt, lässt sich auch direkt abrufen.

Die Schnittstelle liegt unter `https://<API_DOMAIN>/api/v1/`. Die Version steht im Pfad und wird über `NamespaceVersioning` von Django REST Framework ausgewertet; eine andere als `v1` gibt es nicht. Antworten sind JSON, sofern ein Endpunkt nicht ausdrücklich eine Datei liefert.

## 32.1 Authentifizierung: JWT, Cookies, Token-Rotation

Die Schnittstelle kennt drei Arten der Anmeldung, je nach Gegenüber.

**Weboberfläche: JWT in Cookies.** Die Anmeldung über `POST /api/v1/auth/login/` mit `username` und `password` (dj-rest-auth) setzt zwei Cookies:

| Cookie | Inhalt | Gültigkeit |
|---|---|---|
| `api-access-token` | Zugangstoken | 15 Minuten |
| `api-refresh-token` | Erneuerungstoken | 7 Tage |

Beide sind `HttpOnly`, `Secure` und `SameSite=Lax`; im Browser kommt kein Skript an sie heran. Bei jeder Anfrage liest das Backend den Zugangstoken aus dem Cookie. Läuft er ab, holt `POST /api/v1/auth/token/refresh/` mit dem Erneuerungstoken ein neues Paar. Dabei wird auch der Erneuerungstoken ersetzt und der alte auf eine Sperrliste gesetzt (`ROTATE_REFRESH_TOKENS`, `BLACKLIST_AFTER_ROTATION`): Jeder Erneuerungstoken gilt genau einmal. Wer denselben Token zweimal verwendet, etwa aus zwei parallelen Prozessen, bekommt beim zweiten Mal 401. `POST /api/v1/auth/logout/` löscht die Cookies, `GET /api/v1/auth/user/` liefert das angemeldete Konto.

Damit die Cookies für alle Adressen einer Installation gelten, setzt die Middleware `CookieDomainMiddleware` ihre Domain auf `COOKIE_DOMAIN`, sofern `USE_COOKIE_DOMAIN_MIDDLEWARE` eingeschaltet ist. Wie die Weboberfläche die Tokens erneuert, beschreibt Abschnitt [Anmeldung, Token-Erneuerung und Routenschutz im Frontend](./33-frontend.md#_33-8-anmeldung-token-erneuerung-und-routenschutz-im-frontend).

**Andere Programme: JWT im Header.** Für Anwendungen außerhalb des Browsers, die keine Cookies verwalten, gibt es eigene Endpunkte unter `/api/v1/auth/app/`:

- `POST login/` mit `username` und `password` liefert die Tokens im Rumpf der Antwort statt in Cookies: `access`, `refresh`, die Ablaufzeitpunkte `access_expiration` und `refresh_expiration` als Unix-Zeit und das Konto unter `user`.
- `POST token/refresh/` mit `refresh` im Rumpf liefert ein neues Paar; auch hier gilt jeder Erneuerungstoken nur einmal.
- `POST logout/` mit `refresh` im Rumpf setzt den Erneuerungstoken auf die Sperrliste.

Jede weitere Anfrage trägt den Zugangstoken im Header `Authorization: Bearer <access>`. Anmeldung und Erneuerung über `auth/app/` sind gedrosselt; bei zu vielen Anfragen antwortet die Schnittstelle mit 429.

**Kartendienste und WebDAV: Benutzername und Passwort.** QGIS Server unter `QGIS_DOMAIN` und der WebDAV-Zugang unter `FILES_DOMAIN` gehören nicht zur Schnittstelle, werden aber von ihr geprüft: Caddy fragt vor jeder Anfrage per `forward_auth` bei `/api/v1/auth/qgis-auth/` bzw. `/api/v1/auth/webdav-auth/` an und leitet nur weiter, wenn das Backend zustimmt. Die beiden Endpunkte akzeptieren die Cookies der Weboberfläche oder HTTP-Basic-Authentifizierung, wie sie QGIS sendet. Was das für die Konten bedeutet, beschreibt Abschnitt [Authentifizierung der Dienste](../teil-b-betrieb-admin-qgis/27-qgis-server-und-kartendienste.md#_27-3-authentifizierung-der-dienste).

Für die WMS-Ebenen der Karte holt die Weboberfläche über `GET /api/v1/wms-sources/access_token/` einen Token, der fünf Minuten gilt, und hängt ihn als Parameter `token` an die Kachelanfragen an den WMS-Proxy. Ein Bildelement der Karte kann keinen Header setzen; der Parameter ersetzt ihn.

## 32.2 Aufbau und Benennung der Endpunkte

Die Endpunkte der Fachobjekte sind `ViewSet`s von Django REST Framework an einem `DefaultRouter` (`backend/apps/api/urls.py`) und folgen dessen Muster:

| Anfrage | Bedeutung |
|---|---|
| `GET /api/v1/trench/` | Liste |
| `POST /api/v1/trench/` | anlegen |
| `GET /api/v1/trench/<schlüssel>/` | ein Objekt |
| `PUT`, `PATCH /api/v1/trench/<schlüssel>/` | ändern |
| `DELETE /api/v1/trench/<schlüssel>/` | löschen |

Der Schlüssel ist bei den meisten Fachobjekten die UUID, bei Trassen die Kennung `id_trench`, bei den Stammdaten die Nummer. Weil `id_trench` nur je Projekt eindeutig ist, geben Sie bei Trassen `?project=<id>` mit an; ohne ihn kann dieselbe Kennung zwei Trassen treffen, und die Anfrage scheitert. Zusatzaktionen hängen am Pfad, etwa `GET /api/v1/trench/all/` oder `GET /api/v1/conduit/<uuid>/trenches/`. Die Stammdaten (`attributes_*`), Projekte, Kennzeichen, Container-Typen, Kostensätze und die Auswahllisten der Leitungsauskunft sind nur lesbar; gepflegt werden sie im Administrationsbereich, siehe Kapitel [Projekte und Stammdaten pflegen](../teil-b-betrieb-admin-qgis/21-projekte-und-stammdaten.md).

Eine einheitliche Benennung gibt es nicht. Die Präfixe mischen Unterstriche und Bindestriche, Einzahl und Mehrzahl, und weichen teils von den Tabellennamen ab:

- mit Unterstrich: `attributes_cable_type`, `cable_label`, `microduct_connection`, `trench_conduit_connection` …
- mit Bindestrich: `residential-unit`, `fiber-splice`, `feature-files`, `node-structure`, `wms-sources`, `pipeline-records` …
- Einzahl: `trench`, `conduit`, `node`, `address`, `cable`, `fiber`; Mehrzahl: `projects`, `flags`, `logs`, `wms-sources`

Nehmen Sie die Pfade deshalb aus dem Schema, nicht aus einer Regel, siehe Abschnitt [OpenAPI-Schema und Typgenerierung](#_32-7-openapi-schema-und-typgenerierung). Neben dem Router stehen Endpunkte mit eigenem Pfad für alles, was kein einzelnes Objekt ist: die Auswertungen aus Abschnitt [Fachliche Endpunkte](#_32-5-fachliche-endpunkte-routing-faserweg-signalanalyse-storung-wertermittlung-statistik-import-und-export), die Kacheln, die Anmeldung und Hilfsabfragen wie `conduits/by-trenches/`.

## 32.3 Berechtigungsprüfung in der Schnittstelle

Eine globale Vorgabe für die Rechteprüfung gibt es nicht (`DEFAULT_PERMISSION_CLASSES` ist nicht gesetzt); jeder Endpunkt nennt seine Prüfung selbst. Es gibt zwei Stufen:

- **Angemeldet** (`IsAuthenticated`) – jedes aktive Konto mit gültigem Token.
- **Modellrecht** (`RoleBasedPermission` in `backend/apps/api/permissions.py`) – zusätzlich das Recht der Gruppe auf das Modell, aus der Tabelle `model_permission`.

`RoleBasedPermission` ordnet jeder HTTP-Methode die Stufe zu, die sie mindestens braucht:

| Methode | nötige Stufe |
|---|---|
| `GET`, `HEAD`, `OPTIONS` | `view` |
| `POST`, `PUT`, `PATCH` | `edit` |
| `DELETE` | `full` |

Das Modell ergibt sich aus dem `ViewSet`. Gehört ein Konto mehreren Gruppen an, gilt die höchste Stufe; ein Konto ohne Gruppe hat auf kein Modell ein Recht und bekommt 403. Ein Superuser wird nicht geprüft. Was die Stufen für die Verwaltung bedeuten, beschreibt Abschnitt [Modellrechte](../teil-b-betrieb-admin-qgis/19-rollen-und-rechte.md#_19-2-modellrechte-zugriff-je-datenmodell). Die zusammengeführten Rechte eines Kontos hält jeder Prozess des Backends fünf Minuten vor. Signale leeren diesen Zwischenspeicher, sobald sich `model_permission`, `route_permission` oder die Gruppen eines Kontos ändern – aber nur in dem Prozess, der die Änderung speichert; eine geänderte Stufe greift deshalb erst nach bis zu fünf Minuten überall. `GET /api/v1/auth/permissions/` liefert die zusammengeführten Modell- und Routenrechte des angemeldeten Kontos; die Weboberfläche richtet danach ihre Schaltflächen und ihre Navigationsleiste aus.

Modellrechte prüfen die `ViewSet`s der Fachobjekte; welche Objektarten ein Modellrecht haben, listet Abschnitt [Modellrechte](../teil-b-betrieb-admin-qgis/19-rollen-und-rechte.md#_19-2-modellrechte-zugriff-je-datenmodell).

::: warning
Die Rechte der Gruppen steuern die Bearbeitung über die Endpunkte der Fachobjekte; sie teilen die Daten einer Installation nicht zwischen Konten auf. Vergeben Sie Konten nur an Personen und Stellen, die das Netz der Installation sehen dürfen. Für Daten, die eine Stelle nicht sehen darf, ist eine eigene Installation der sichere Weg.
:::

Routenrechte (`route_permission`) prüft das Backend nicht; sie steuern nur die Navigation der Weboberfläche, siehe Abschnitt [Routenrechte](../teil-b-betrieb-admin-qgis/19-rollen-und-rechte.md#_19-3-routenrechte-zugriff-je-menupunkt).

## 32.4 Paginierung, Filter und Suche

**Paginierung.** Auch sie ist nicht global eingestellt, sondern je Endpunkt, und es gibt drei Formen:

- Die meisten Listen der Fachobjekte nutzen `CustomPagination` (`backend/apps/api/pageination.py` – der Dateiname ist so geschrieben): 10 Einträge je Seite, mit `page_size` bis 100, Seite über `page`. Die Antwort hat die Form von Django REST Framework, `count`, `next`, `previous`, `results`.
- Die Zusatzaktionen `…/all/` liefern alle Einträge auf einmal, als einfache Liste. Ausnahmen sind `conduit/all/` und `address/all/` sowie die Liste der Leitungsauskünfte: Sie blättern selbst, mit 50 Einträgen je Seite, `page_size` bis 200, und antworten mit `results`, `count`, `page`, `page_size`, `total_pages`. `conduit/all/?no_pagination=true` liefert alles.
- Listen ohne eigene Paginierung, etwa Wohneinheiten, Fasern, Spleiße oder die Netzknotenstruktur, liefern immer alles.

Die Form der Antwort hängt also am Endpunkt; prüfen Sie sie im Schema.

**Filter.** Django-Filter ist nicht im Einsatz. Die Endpunkte lesen ihre Filter selbst aus den Abfrageparametern, und welche ein Endpunkt kennt, steht nur in seinem Code und in seiner Beschreibung im Schema. Die häufigsten:

- `project` – die Nummer des Projekts. Fast jede Liste erwartet diesen Parameter; ohne ihn liefern viele Listen die Objekte aller Projekte. Beim Anlegen steht das Projekt im Rumpf; auch die Auswertungen erwarten meist `project`, nur `routing/` und `fault-simulation/` heißen den Wert `project_id`.
- `flag` – die Nummer eines Kennzeichens.
- Verweise auf übergeordnete Objekte, etwa `uuid_conduit` für die Mikrorohre eines Rohrs oder `uuid_node` für die Struktur eines Netzknotens.

**Suche.** Der Parameter `search` gehört zu den Zusatzaktionen `…/all/`, zu `trace-search/` und zu den Listen `pipeline-records/` und `logs/`. In `address/all/`, `node/all/` und `area/all/` sowie bei Adressen und Netzknoten in `trace-search/` sucht er mit einer Ähnlichkeitssuche (`TrigramWordSimilarity` aus `pg_trgm`, `backend/apps/api/search.py`). Die Adresssuche zerlegt den Begriff in Wörter und vergleicht sie mit Straße, Ort, Postleitzahl und Ortsteil; Treffer sind nach Ähnlichkeit sortiert. Rohre, Kabel, Trassen, Wohneinheiten und Leitungsauskünfte suchen dagegen mit einem einfachen Teilstring-Vergleich über mehrere Spalten.

::: info
Bei gleicher Ähnlichkeit ist die Reihenfolge der Treffer nicht festgelegt; zwei gleiche Anfragen können gleich bewertete Treffer in unterschiedlicher Reihenfolge liefern. Wer über die Seiten einer Suche blättert, kann deshalb Treffer doppelt sehen oder verpassen.
:::

## 32.5 Fachliche Endpunkte: Routing, Faserweg, Signalanalyse, Störung, Wertermittlung, Statistik, Import und Export

Die Auswertungen der Weboberfläche sind eigene Endpunkte mit eigenem Pfad:

| Endpunkt | Zweck |
|---|---|
| `POST routing/` | Weg durch das Trassennetz zwischen zwei Trassen, für die Rohrzuordnung |
| `GET trace-search/` | Suche nach Einstiegspunkten für den Faserweg |
| `GET fiber-trace/` | Faserweg ab einer Faser, einem Kabel, Netzknoten, einer Adresse oder Wohneinheit |
| `GET fiber-trace/summary/` | Kurzfassung des Faserwegs einer Faser |
| `GET signal-analysis/` | Signalweg einer Faser ab einer Signalquelle |
| `POST fault-simulation/` | betroffene Objekte zu einem Schadenspunkt |
| `POST valuation/calculate/` | Wertermittlung eines Projekts oder Gebiets |
| `GET dashboard/statistics/` | Kennzahlen des Dashboards |
| `POST spatial/intersects/` | Objekte, die eine Geometrie schneiden |
| `GET layer-extent/` | Ausdehnung eines Layers |
| `GET config/` | Konfiguration für das Frontend, etwa das Koordinatenbezugssystem |

Einige Eigenheiten, die beim Aufruf auffallen:

- `routing/` erwartet `project_id` und `tolerance` als Liste mit einem Element (`"project_id": [2]`), entgegen dem Schema, das einfache Zahlen angibt: Der Endpunkt liest jeweils das erste Element. Fehlt einer der beiden Werte, scheitert er mit 500.
- `fiber-trace/` nimmt genau einen der Parameter `fiber_id`, `cable_id`, `node_id`, `address_id`, `residential_unit_id`. Mit `include_geometry` liefert er den Weg als Geometrie, `geometry_mode` und `orient_geometry` steuern, wie er zusammengesetzt wird.
- `dashboard/statistics/` hält sein Ergebnis bis zu fünf Minuten im Arbeitsspeicher vor. Jeder Worker von gunicorn hat seinen eigenen Stand.

Import und Export:

| Endpunkt | Zweck |
|---|---|
| `GET template/conduit/` | Excel-Vorlage für den Rohrimport |
| `POST import/conduit/` | Rohrimport aus Excel, siehe Abschnitt [Excel-Import](../teil-a-anwenderhandbuch/10-rohrverwaltung.md#_10-5-excel-import-vorlage-ablauf-fehlermeldungen) |
| `GET export/features/` | Fachobjekte als GeoJSON |
| `GET schema.gpkg` | leeres GeoPackage mit den Tabellen der Netzdaten, siehe Abschnitt [GeoPackage-Schema herunterladen](../teil-b-betrieb-admin-qgis/24-daten-import-und-export.md#_24-2-geopackage-schema-herunterladen) |
| `GET node-export/excel/<uuid>/` | Struktur eines Netzknotens als Excel-Datei |
| `GET pipeline-records/<uuid>/inquiry-export/` | Leitungsauskunft als ZIP-Archiv |
| `GET feature-files/<uuid>/download/` | ein Anhang |

**`export/features/`** ist der Export ohne Gegenstück in der Oberfläche. `layers` wählt die Objektarten (`cable`, `conduit`, `node`, `area`, kommagetrennt), `project` das Projekt; `exclude_projects` nimmt Projekte aus, wenn `project` fehlt. Die Antwort enthält je Objektart eine `FeatureCollection`. Kabel und Rohre haben keine eigene Geometrie; der Export setzt sie aus den Trassen zusammen, in denen sie liegen. Die Eigenschaften enthalten die Stammdaten aufgelöst, also etwa Eigentümer mit Anschrift und Kontaktdaten, nicht nur deren Nummer. Die Koordinaten stehen im Koordinatenbezugssystem der Installation, nicht in WGS 84, wie es GeoJSON-Leser meist annehmen; die Antwort nennt es unter `srid`. Trassen und Adressen bietet der Export nicht an.

**Proxys.** Zwei Endpunkte reichen Anfragen an Kartendienste weiter: `wms-proxy/<uuid>/` an eine WMS-Quelle, mit den dort hinterlegten Zugangsdaten, siehe Abschnitt [WMS-Proxy und Zwischenspeicher](../teil-b-betrieb-admin-qgis/27-qgis-server-und-kartendienste.md#_27-5-wms-proxy-und-zwischenspeicher), und `wfs3/<name>/…` an die OGC-API-Features-Schnittstelle von QGIS Server, siehe Abschnitt [Angebotene Dienste](../teil-b-betrieb-admin-qgis/27-qgis-server-und-kartendienste.md#_27-2-angebotene-dienste-wms-wfs-wmts-ogc-api-features).

## 32.6 Vektor-Tile-Endpunkte

Die Netzobjekte der Karte liefert das Backend als Vektorkacheln im Format Mapbox Vector Tile:

```text
GET /api/v1/ol_trench_tiles/{z}/{x}/{y}.mvt?project=<id>
GET /api/v1/ol_node_tiles/{z}/{x}/{y}.mvt?project=<id>
GET /api/v1/ol_address_tiles/{z}/{x}/{y}.mvt?project=<id>
GET /api/v1/ol_area_tiles/{z}/{x}/{y}.mvt?project=<id>
```

Die Kacheln entstehen bei jeder Anfrage in PostGIS, mit `ST_TileEnvelope`, `ST_AsMVTGeom` und `ST_AsMVT` über die Spalte `geom_3857` (Ausdehnung 4096, Puffer 64). Welche Eigenschaften ein Objekt in der Kachel trägt, legt das SQL im jeweiligen View fest; ein neues Attribut, das in der Karte erscheinen soll, muss dort ergänzt werden, siehe Abschnitt [Ein Attribut oder Modell ergänzen](./36-erweitern-und-mitwirken.md#_36-1-ein-attribut-oder-modell-erganzen).

Die Antwort hat den Typ `application/vnd.mapbox-vector-tile`. Eine Kachel ohne Objekte beantwortet der Endpunkt mit 204, auch für ein Projekt, das es nicht gibt; eine Projektnummer, die keine Zahl ist, mit 400. Ohne `project` enthält die Kachel die Objekte aller Projekte. nginx hält gefüllte Kacheln 30 Sekunden und leere zehn Minuten vor; daher die Verzögerung, mit der Änderungen in der Karte erscheinen, siehe Abschnitt [Gleichzeitiges Arbeiten mit der Weboberfläche](../teil-b-betrieb-admin-qgis/26-netzdaten-in-qgis-bearbeiten.md#_26-3-gleichzeitiges-arbeiten-mit-der-weboberflache).

Die Hintergrundkarte kommt nicht aus diesen Endpunkten, sondern vom Kachelserver unter `TILE_SERVER_DOMAIN`, siehe Abschnitt [Kachelserver](./35-bereitstellung-und-infrastruktur.md#_35-6-kachelserver).

## 32.7 OpenAPI-Schema und Typgenerierung

Das Schema der Schnittstelle erzeugt drf-spectacular. Es liegt in zwei Formen vor:

- **`backend/schema.yml`** im Repository, OpenAPI 3.0. Aus ihr erzeugt `npm run generate:types` im Frontend mit openapi-typescript die Typen in `frontend/src/lib/types/api.d.ts`.
- **Zur Laufzeit** unter `/api/v1/schema/`, mit einer Swagger-Oberfläche unter `/api/v1/docs/`. Beide gibt es nur bei `DEBUG=True`, also in der Entwicklungsumgebung aus Kapitel [Entwicklungsumgebung](./30-entwicklungsumgebung.md); eine Installation im Betrieb beantwortet beide Pfade mit 404. Ebenso nur mit `DEBUG` ist die im Browser bedienbare Darstellung von Django REST Framework eingeschaltet.

Nach einer Änderung an Modellen, Serialisierern oder Views erneuern Sie beide Dateien:

```bash
cd backend
uv run manage.py spectacular --file schema.yml
cd ../frontend
npm run generate:types
```

Die CI des Frontends erzeugt `api.d.ts` aus der eingecheckten `schema.yml` neu und schlägt fehl, wenn sich die Datei dabei ändert, siehe Abschnitt [CI-Pipeline](./34-qualitaetssicherung.md#_34-5-ci-pipeline). Ob `schema.yml` selbst zum Code passt, prüft sie nicht.

::: warning
Die Beschreibungstexte im Schema hängen von der Sprache ab, in der `spectacular` läuft – Texte von Django REST Framework und die Namen der Modelle werden übersetzt. Eine neu erzeugte `schema.yml` unterscheidet sich deshalb auch ohne Änderung am Code in Hunderten von Zeilen von der eingecheckten. Prüfen Sie den Diff vor dem Commit und übernehmen Sie nur, was zur eigenen Änderung gehört.
:::

Das Schema ist so gut wie die Annotationen der Views. Viele eigene Endpunkte beschreiben ihre Parameter nur im Docstring, und `spectacular` meldet beim Erzeugen zahlreiche Warnungen zu Endpunkten, deren Antwort es nicht ableiten kann. Für diese Endpunkte ist der Code die verlässliche Quelle.

## 32.8 Fehlerbehandlung und Statuscodes

Eine eigene Fehlerbehandlung (`EXCEPTION_HANDLER`) gibt es nicht. Die Form einer Fehlerantwort hängt deshalb davon ab, wo der Fehler entsteht:

- **Django REST Framework** – Anmeldung, Rechte, nicht gefundene Objekte, Drosselung: `{"detail": "…"}`.
- **Serialisierer** – ungültige Eingaben beim Anlegen oder Ändern: ein Objekt mit dem Feldnamen als Schlüssel und einer Liste von Meldungen je Feld, `{"name": ["…"]}`.
- **Eigene Endpunkte** – fehlende Parameter, fachliche Fehler: meist `{"error": "…"}`, vereinzelt auch `{"detail": "…"}`.

Ein Programm, das die Schnittstelle nutzt, prüft deshalb beide Schlüssel. Die Meldungen sind teils übersetzt, teils englisch; werten Sie den Statuscode aus, nicht den Text.

| Code | Bedeutung |
|---|---|
| 200, 201 | Erfolg, angelegt |
| 204 | gelöscht; bei Kacheln: keine Objekte in der Kachel |
| 400 | Parameter fehlt oder Eingabe ungültig |
| 401 | nicht angemeldet oder Token abgelaufen – erneuern und wiederholen |
| 403 | angemeldet, aber ohne das nötige Modellrecht |
| 404 | Objekt oder Pfad nicht vorhanden |
| 429 | zu viele Anmelde- oder Erneuerungsanfragen über `auth/app/` |
| 500 | Fehler im Backend; die Meldung steht in den Protokollen, siehe Abschnitt [Protokolle auswerten](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-5-protokolle-auswerten) |

Fehler, die die Datenbank selbst auslöst – ein Trigger, der eine ungültige Geometrie zurückweist, oder ein Netzknoten, der sich wegen seiner Kabel nicht löschen lässt –, kommen bei den meisten Endpunkten als 500 an, nicht als 400. Ihre Meldung steht in den Protokollen; was die Trigger prüfen, beschreibt Abschnitt [Migrationen, Datenbank-Trigger und Signale](./31-datenmodell-des-backends.md#_31-9-migrationen-datenbank-trigger-und-signale).
