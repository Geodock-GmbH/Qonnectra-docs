# Test data for local manual screenshots

`testprojekt-export.json` is a 1:1 export of the real project
**"Testprojekt"** from app.geodock.de (nodes, trenches, conduits, addresses,
cables, fibers, microducts, areas including the associated reference data such
as companies, conduit/cable types and flags). `scripts/setup-local-qonnectra.sh`
imports this file into a fresh local instance automatically.

Deliberately **not** included: Container/ContainerType, FiberSplice,
NodeStructure/slot configuration (patch panel modelling) and
NetworkSchemaSettings (which node types are hidden in the network schema) -
these are not (yet) part of the scope of the manual, or had no suitable API
endpoint to export from.

## Updating the data

The export was produced with a browser script (JavaScript, against the
logged-in session on app.geodock.de), because the app has no ready-made
"export everything" button. Short version, in case the data ever has to be
pulled again:

1. Log in to app.geodock.de (in the browser).
2. Through the browser console/DevTools, against
   `https://api.geodock.de/api/v1/`, fetch all pages for every required
   resource (`trench`, `conduit`, `trench_conduit_connection`, `microduct`,
   `microduct_connection`, `microduct_cable_connection`, `node`, `address`,
   `residential-unit`, `cable`, `cable_label`, `fiber`, `area`, each with
   `?project=<id>`, plus the global `attributes_*` and `flags` lists without a
   project filter) and merge them into a single JSON object.
   Careful: `trench`, `node`, `address` and `area` return a GeoJSON
   `FeatureCollection` per page (`results.features`), all other resources a
   plain `results` array - see `import_geodock_export.py` for the exact
   processing logic.
3. Save it as a JSON file and import it into the local instance with
   `import_geodock_export.py --file ... --force`.

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
