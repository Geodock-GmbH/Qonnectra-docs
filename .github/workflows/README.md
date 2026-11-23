# Workflows

Four of them, and only one of them produces something anybody outside this
repository sees.

| Workflow | Runs on | What it does |
|---|---|---|
| `test.yml` | every push to `main`, every pull request | spelling, Gendersternchen, and the captures: spec lint, the `tests/captures.lock` gate and a Playwright run against a local Qonnectra instance |
| `preview.yml` | every pull request, every push to `main` | builds the site and commits it into the `gh-pages-preview` branch |
| `cleanup-preview.yml` | a closed pull request | removes that pull request's directory from `gh-pages-preview` |
| `release.yml` | a pushed tag `v*` | builds the site for a webserver and attaches the archives to the release of that tag |

## Previews, including `main`

`preview.yml` treats every branch alike. A pull request is built with
`BASE_PATH=/Qonnectra-docs/pr-<number>/` and lands in `gh-pages-preview` under
`pr-<number>/`, a push to `main` with `BASE_PATH=/Qonnectra-docs/branch-main/`
under `branch-main/`. GitHub Pages serves the branch at its root, so
`index.html` there is a generated list of all previews
(`.github/scripts/generate-preview-index.sh`) and the state of `main` is one
entry in it:

- list of previews: <https://geodock-gmbh.github.io/Qonnectra-docs/>
- `main`: <https://geodock-gmbh.github.io/Qonnectra-docs/branch-main/>

There is no separate production deployment on Pages. A `deploy.yml` used to
build `main` a second time into the Pages artifact; it was removed in `8a056f1`
because `preview.yml` already builds every push to `main`.

**Every one of these builds carries a base path** and only works under the URL
it was built for. None of them is suitable for a webserver of its own - that is
what the release is for.

## Releases

A release is cut by pushing a version tag:

```bash
git tag v1.1.0
git push origin v1.1.0
```

`release.yml` then runs the static checks, builds the site **without**
`BASE_PATH` - so for the root path `/` of a domain - and attaches to the
release of that tag:

- `qonnectra-docs-v1.1.0.tar.gz` and `.zip` - the built site, unpacking into a
  directory of the same name
- `SHA256SUMS.txt` - the checksums of both

Nothing is deployed anywhere. The archives are downloaded from the release page
and uploaded by hand.

The workflow does not run the Playwright captures - that takes the better part
of an hour and needs the app stack. What it does check is that
`tests/captures.lock` is not stale, i.e. that the images in the build are the
ones the specs produce. Tag a commit that `test.yml` ran green on.

### Why `--notes-start-tag`

The map tile sets are releases of this repository as well (tag `tiles-<id>`,
written by `scripts/build-map-tiles.sh`, consumed by
`scripts/setup-local-qonnectra.sh`). When GitHub generates release notes
without being told where the range starts, it takes the previous release by
date - which is a tile set whenever one was published after the last version,
and the notes then list every commit since a map build. `release.yml` therefore
looks up the previous `v*` tag by version order and passes it as
`--notes-start-tag`. Tile releases are invisible to the note generator no
matter when they are published, and `--latest` keeps the "Latest" badge on the
version (`build-map-tiles.sh` already publishes tile sets with `--latest=false`).

### A tag that already has a release

`release.yml` can also be started by hand from the Actions tab with a tag as
its input. If that tag already carries a release, the run replaces its assets
and leaves title, notes and the "Latest" badge alone - the way to give an older
release its archives without moving the tag.

## Configuration

`BASE_PATH` is the only environment variable the build reads
(`.vitepress/config.ts`):

| Where | Value |
|---|---|
| local development | unset → `/` |
| release | unset → `/` |
| `main` preview | `/Qonnectra-docs/branch-main/` |
| pull request preview | `/Qonnectra-docs/pr-<number>/` |

GitHub Pages is configured as "Deploy from a branch", branch
`gh-pages-preview`, folder `/`. The previews need no further setup per branch.
