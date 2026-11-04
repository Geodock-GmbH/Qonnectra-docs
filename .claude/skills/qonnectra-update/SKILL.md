---
name: qonnectra-update
description: Bring the manual, the capture specs and the published images up to a new Qonnectra release – raise the app pin, list the chapters the release touches, fix the pipeline, rewrite the text, audit every note block and republish. Use when a new Qonnectra version is out or when QONNECTRA_REF is to be raised.
---

# Updating the manual to a new Qonnectra version

Raising the pin is its own piece of work (`CLAUDE.md`, „Local Qonnectra
instance“). This is the procedure that has worked, in this order. Every phase
ends in at least one commit; the user decides about pushing.

## 1. Scan the release, before changing anything

1. `git -C local-app fetch --tags` and find the **release commit** of the new
   version (`chore(main): release x.y.z`). Pin that commit, not the tag.
2. `git -C local-app log --oneline <old pin>..<new commit>` – one line per PR.
   Read the PR numbers off the subjects.
3. Look where users and operators will notice a change:
   - `frontend/src/routes/**` – moved or new routes, changed URL state
     (`git diff --stat` over the range first, then the files).
   - `frontend/src/lib/config/navLinks.ts`, `routes.ts`, `permissions.ts`,
     `src/lib/server/landing.ts` – navigation, route permissions, landing page.
   - `frontend/messages/de.json` – diff it; every changed or removed label is a
     candidate for a stale quote in `manual/`
     (`grep -rn "„<old label>“" manual/`).
   - `backend/apps/api/migrations/` – new models, fields, triggers, seeded
     permissions; `admin.py` for part B; `deployment/` for chapters 28, 30, 35.
4. Give the user a table **chapter → what changed → PR**, covering parts A, B and
   C, and the capture pipeline separately (routes, storage keys, data the specs
   intercept). Wait for the go-ahead before changing files.

## 2. Raise the pin and get the instance running

- `QONNECTRA_REF` in `scripts/setup-local-qonnectra.sh` (and its comment), then
  `scripts/setup-local-qonnectra.sh`.
- Known traps:
  - After a long pause the Caddy certificates have expired: the setup skips the
    capture account and the demo import. `docker restart qonnectra_caddy_prod`,
    then run the setup again.
  - New database triggers can overwrite what the demo import writes
    (v1.8.0: `tg_place_node_on_canvas` reset every node position). Check the
    import result, not only its exit code: re-import with force and compare a
    checksum of the affected columns. Fix it in
    `scripts/qonnectra-demo-data/import_geodock_export.py`.
  - The project must keep primary key 2 (`PROJECT_ID`).
- Commit: „Local instance: pin Qonnectra vX.Y.Z“.

## 3. Make the capture pipeline work again

Run everything: `pnpm test:e2e --all`. Delegate the fixing to the
`screenshot-automation` agent with the failure list and the PRs from phase 1.

What broke last time, and will break in the same way:
- **Paths and stored state.** Routes moved (`/project/<id>/…`), the project
  cookie and the `localStorage` keys of the map view were renamed. Keep them in
  `playwright/project.ts` and `playwright/auth.setup.ts`, nowhere else.
- **Interceptors that go blind without failing.** `freezeDates()`,
  `stableSearchOrder()`, `stableUnitsByTypeOrder()` rewrite responses on their
  way into the page. When the app changes how it loads data (v1.8.0: SvelteKit
  remote functions instead of `__data.json`), they match nothing and every test
  still passes – the images just stop being deterministic. Make each one fail
  when it rewrote nothing, and run the specs twice.
- **Labels and selectors** – take the new text from `de.json`.

Commit per kind of fix (paths, interceptors, per-chapter spec fixes), not one
commit for everything.

## 4. Rewrite the manual

Work through the chapter table of phase 1 with the `manual-author` agent, one
commit per part (A, B, C). Rules on top of `CLAUDE.md`:
- A section the release needs but `OUTLINE.md` lacks goes into `OUTLINE.md` in
  the same commit.
- Quote labels from `de.json` of the new pin, never from memory or the old
  manual.
- The capture runs show things the code reading missed. Correct the text
  afterwards in a commit of its own (`Manual: correct what the capture runs
  showed …`).

## 5. Audit every note block

Release notes do not mention the bugs a release fixed by accident, and the
manual warns about many of them. Check **every** `::: info`, `::: warning` and
`::: danger` block against the new source, not only those in touched chapters.

- Run four parallel agents (`general-purpose`, read-only): chapters 1–5, 6–13,
  14–18, and parts B + C. Each gets the pin range, the main PRs and the
  instruction to report only what the code proves: file:line, verdict (remove /
  rewrite / partly wrong), evidence in `local-app`.
- Typical findings: warnings about lost data or false success messages that the
  new error handling fixed; English messages that are translated now; empty
  states that became error boxes.
- Verify each finding yourself in the code before editing. Where the code
  cannot decide (stacking order, timing), check it in the running app with a
  temporary test in the chapter's spec, run with `--grep` (stamps nothing),
  and restore the spec afterwards.
- Fix the same claim in body text too (`grep` for it). Errors that predate the
  release get fixed as well – say so in the commit message.
- Changing a spec, even a comment, makes it stale: re-run it and publish.

## 6. Republish and check

1. `pnpm test:e2e --all`, then `pnpm screenshots:publish`. Use `--keep-videos`
   only where a recording is unaffected.
2. Run every spec of chapters 19–24, 27, 28 twice and check its images for
   dates, times and IDs (`CLAUDE.md`, „Dates in the Django administration“).
3. Look at a sample of the changed images.
4. `pnpm lint:spelling`, `pnpm lint:gender`, `pnpm lint:captures`, `pnpm build`.
   After renamed headings, grep for links to the old anchors (`#_<number>-`).
5. Commit images, videos and both lock files together.

## 7. Record the new state

- `CLAUDE.md`: the pin and its date, the app section (version, routes, storage
  keys, anything the specs now depend on).
- `OUTLINE.md`: the version the manual is based on.
- `.claude/agents/*.md` if they quote paths or keys that changed.
- Open points that stay open (undocumented features, flaky tests) go into
  `OUTLINE.md` notes or are reported to the user – not silently dropped.
- Finally, give the user a summary: the commits, the test results, what is still
  open, and that nothing has been pushed.
