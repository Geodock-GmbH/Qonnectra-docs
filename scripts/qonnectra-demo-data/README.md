# Test data for local manual screenshots

`testprojekt-export.json` is a 1:1 export of the real project
**"Testprojekt"** from app.geodock.de. `scripts/setup-local-qonnectra.sh`
imports it into a fresh local instance automatically.

It covers everything the export account may read: nodes, trenches, conduits,
microducts, addresses, residential units, cables, fibers, areas, the patch
panel modelling of the nodes (container, slot configurations, node structures)
and the **fiber splices** on top of it, the valuation cost rates, the pipeline
record with its inquiry area, attachment metadata, plus the associated
reference data (companies, conduit/cable/component types, flags).

The fiber splices matter beyond their own chapter: without them every fiber
trace ends at the cable, so the fault simulation reports "Keine betroffenen
Adressen" and the "Faserverbindungen" section of the post compaction PDF stays
empty. The same holds for the valuation, which only shows a hint as long as no
cost rate is configured.

Not included, because the export account gets HTTP 403 on those endpoints (see
`EXPECTED_FORBIDDEN` in `fetch_geodock_export.py`):

| Resource | Consequence |
|---|---|
| `wms-sources` | `wms-layers` comes through, but without the URL of the WMS server the layers cannot be recreated - the map shows the base map only |
| `node-slot-divider`, `node-slot-clip-number` | visual subdivision inside a slot configuration is missing; the slots themselves are there |
| `node-trench-selection` | the branch canvas starts without a preselected trench |

`trench-conduit-canvas` does come through and is empty in production - no
manually arranged trench profile has been saved there.

Attachments are imported as **metadata only** (file name, type, path on
api.geodock.de). The files themselves stay there: they are real documents of a
real installation and have no place in this repository.

## Updating the data

`fetch_geodock_export.py` pulls the whole project through the API and writes
the JSON file. Standard library only, no extra dependency.

1. Put the credentials of the export account next to the script:

   ```bash
   cp scripts/qonnectra-demo-data/.env.example scripts/qonnectra-demo-data/.env
   ```

   Fill in `GEODOCK_USERNAME` / `GEODOCK_PASSWORD`. `.env` is gitignored and
   must never be committed; the script never prints the values.

2. Fetch:

   ```bash
   python3 scripts/qonnectra-demo-data/fetch_geodock_export.py \
     --out scripts/qonnectra-demo-data/testprojekt-export.json
   ```

   It prints a row count per resource, so a resource that silently ran dry is
   visible. The four endpoints above are reported as "not readable for this
   account" - that is expected and not a failure. Everything else that fails
   makes the run exit non-zero.

3. Import it into the local instance (see below) and run the specs of the
   affected chapters - new data can invalidate images and the assertions that
   guard them.

`--host` and `--project` target a different installation, `--skip` leaves a
resource out.

Two details of the export format worth knowing:

- GeoJSON resources (`trench`, `node`, `address`, `area`) are flattened to
  `{**properties, "geometry": ...}`, which is the shape the importer reads.
- Resources with no project filter of their own are fetched per parent object
  (`node-structure?node=<uuid>`, `fiber-splice?node_structure=<uuid>`, ...).
  Because not every serializer returns the relation it was queried by - a
  container exposes no `uuid_node` - each of those rows carries the query it
  came from in `_fetched_with`.

## Import command

`import_geodock_export.py` is copied by `setup-local-qonnectra.sh` into
`local-app/backend/apps/api/management/commands/` (local-app/ is gitignored and
is refilled from the checkout on every run). After that:

```bash
python manage.py import_geodock_export --file /path/to/file.json [--force]
```

Without `--force` an already existing local project "Testprojekt" is skipped
(no re-import). With `--force` it is deleted completely first and imported
again.

Reference data (companies, conduit/cable types, flags, ...) is merged with the
entries already present locally by matching names (`get_or_create`); objects
with a UUID primary key are created with the ORIGINAL UUID from production, so
that relations work without an additional id mapping.

The project itself is created with the fixed primary key **2** (`PROJECT_ID`).
That is what a fresh instance produces anyway ("Default" takes 1), and it has
to stay stable: the Playwright setup pins the cookie `selected-project=2` and
the URLs of the app contain the id. Without pinning, a re-import with `--force`
would hand out the next free id and every capture run would land in "Default".
