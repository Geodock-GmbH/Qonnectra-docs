# Vendored web font of the base map

`@fontsource/noto-sans` **5.3.0**: the stylesheets `400.css` and `700.css` –
the two weights the map styles declare, „Noto Sans Regular“ and „Noto Sans
Bold“ – and the woff2 files they name, fetched from
`https://cdn.jsdelivr.net/npm/@fontsource/noto-sans/` on 2026-10-06. Licence:
SIL Open Font License 1.1, see `LICENSE`.

`ol-mapbox-style` loads this stylesheet from that CDN for the labels of the
base map. `playwright/vendored-fonts.ts` answers the same URLs from this folder
instead, so that every capture renders the labels with exactly these files and
never waits for the internet - see the comment there for what went wrong
without it.

Only the woff2 files are kept; Chromium never asks for the `.woff` fallbacks
the stylesheet also lists. A request for a file that is not here fails the
test, so a stylesheet change in the app shows up as an error, not as a
different image.

The version is pinned on purpose: the unversioned CDN URL serves whatever is
latest, and a new release of the font would redraw every label in every map
image at a moment nobody chose. Refreshing is a deliberate step, like raising
`QONNECTRA_REF`: fetch the stylesheets, `LICENSE` and the woff2 files they
reference, note the version from the package's `package.json` here, regenerate
the map images and review them. A weight the styles start to use and that is
not here shows up as a failed test naming the missing stylesheet.
