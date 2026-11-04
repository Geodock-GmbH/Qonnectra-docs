---
name: qonnectra-update
description: Bring the manual, the capture specs and the published images up to a new Qonnectra release – raise the app pin, list the chapters the release touches, fix the pipeline, rewrite the text, audit every note block and republish. Use when a new Qonnectra version is out or when QONNECTRA_REF is to be raised.
---

# Updating the manual to a new Qonnectra version

Raising the pin is its own piece of work (`CLAUDE.md`, „Local Qonnectra
instance“). This is the procedure that has worked, in this order. Every phase
ends in at least one commit. Nothing is pushed before phase 8; from there on
the skill pushes the update branch itself.

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

1. `scripts/setup-local-qonnectra.sh --reset`, then `pnpm test:e2e --all`, then
   `pnpm screenshots:publish`. Use `--keep-videos` only where a recording is
   unaffected. The reset is not optional: overlapping map symbols are drawn in
   the physical row order of the database, which every run shifts, and CI
   imports fresh (`CLAUDE.md`, „Draw order of overlapping map symbols“).
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
## 8. Push and wait for the pipeline

1. Push the update branch (`git push -u origin <branch>`), never with
   `--force`, never to `main`. The review environment and the PR runs of
   `test.yml` only exist for a pull request: if `gh pr view` finds none, open
   one against `main` with `gh pr create` (title „Update to Qonnectra
   vX.Y.Z“, body: the chapter table of phase 1 in short and the attribution
   line).
2. Wait for every check of the pull request: `gh pr checks --watch
   --fail-fast`, run in the background – the „Captures“ job of `test.yml`
   takes the better part of an hour, longer than a foreground command may
   run. „Deploy PR Preview“ (`preview.yml`) has to be green as well, otherwise
   the review URL of phase 9 leads nowhere.
3. If a check fails, read why: `gh run view <run-id> --log-failed`, and for
   „Captures“ the artifacts (`gh run download <run-id>`):
   `screenshots-from-this-run` holds the images that differ from the
   published ones, `playwright-report` the failing tests.
4. Fix what can be fixed, locally and by the rules of this repo:
   - Spelling, gender, `lint:captures` → fix the source, rerun the lint.
   - „tests/captures.lock is stale“ → run the named specs locally,
     `pnpm screenshots:publish`, commit images and lock together.
   - Images that differ from the published ones → find the cause in the spec
     or in the list „What the pipeline cannot make deterministic“ in
     `CLAUDE.md`; fix the spec, recapture, publish. Never edit a file in
     `public/` by hand, never raise the publish tolerance, never skip or
     weaken a test to get green.
   - A failing test → the same procedure as in phase 3.
   Commit each fix on its own, push, and wait again.
5. Stop after three rounds that end in red, and stop at once where the cause
   lies outside the repo (runner outage, GitHub Pages not configured, a bug in
   the app at the pinned commit). Do not guess further – report the failing
   check, the log excerpt and what was tried.
6. Then give the user a summary: the commits (including the fix commits of
   this phase), the local test results, the result of every check with a link
   to the run, and what is still open.

## 9. Final output: where to review the changes

The very last thing of the run, after the summary, is a table of every place in
the manual that changed, so that the user can walk through them in the review
environment.

1. **Review URL.** `.github/workflows/preview.yml` deploys every pull request to
   `https://geodock-gmbh.github.io/Qonnectra-docs/pr-<number>/` (and `main` to
   `…/branch-main/`). Look the number up with
   `gh pr view --json number,url` on the update branch – phase 8 has opened
   it. If phase 8 stopped before the preview was deployed, say so next to the
   URL: the links of the table lead nowhere until „Deploy PR Preview“ is
   green.
2. **What changed.** Diff against the branch point of the pull request, not
   against the last commit, and against the remote base – a local `main` that
   is behind lists everything merged since as a change of this branch:
   `git fetch origin`, then
   `git diff --name-status origin/main...HEAD -- manual/ public/ OUTLINE.md`
   and `git diff origin/main...HEAD -- manual/` for the hunks (base branch
   from `gh pr view --json baseRefName`).
   - A changed `.md` hunk → the nearest heading above it (`##`/`###`).
   - A changed image or video in `public/` → every place in `manual/` that
     embeds it (`grep -rn "<name>.jpg" manual/`) and the heading above that.
   - A renamed or new heading, a removed section, a changed `OUTLINE.md` entry
     is a row of its own.
3. **The table**, one row per section, sorted by chapter number:

   | Kapitel | Abschnitt | Was geändert wurde | Link |
   |---|---|---|---|
   | 5 Karte | 5.4 Rohrübersicht und Kabelübersicht einer Trasse | Hinweis entfernt; Bild `map_trench_conduits.jpg` neu | <URL> |

   - „Was geändert wurde“ in one line, prefixed with the kind: Text, Hinweis
     (note block), Bild, Video, Überschrift, Abschnitt neu/entfernt.
   - The link is the full review URL of the page plus the anchor:
     `<review URL>manual/<part folder>/<file>.html#<anchor>`. VitePress builds
     without `cleanUrls`, so the page ends in `.html`; take the anchor from the
     heading the way VitePress slugs it (lower case, spaces and dots to `-`,
     umlauts lose their dots, leading `_` before a digit:
     `## 32.3 Berechtigungsprüfung in der Schnittstelle` →
     `#_32-3-berechtigungsprufung-in-der-schnittstelle`). Check one
     anchor against `pnpm build` output (`.vitepress/dist/`) before handing
     the table over.
   - Images whose only change is a new capture with no visible difference do
     not exist – the publish gate does not write them. Every changed image is
     therefore a row.
