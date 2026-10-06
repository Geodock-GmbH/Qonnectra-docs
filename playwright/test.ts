// The `test` every spec imports - Playwright's own, plus one fixture that runs
// for every test without being asked for: the vendored web font of the base
// map (vendored-fonts.ts). A spec that imported `test` from '@playwright/test'
// directly would fetch the font from the internet again, or in the capture
// container not at all; `pnpm lint:captures` fails on such an import.
//
// Everything else is re-exported unchanged, so a spec needs no second import.
import { test as base, expect } from '@playwright/test'

import { serveVendoredFonts } from './vendored-fonts'

export { expect, request } from '@playwright/test'
export type { APIRequestContext, BrowserContext, Locator, Page } from '@playwright/test'

export const test = base.extend<{ vendoredFonts: void }>({
  vendoredFonts: [
    async ({ context }, use) => {
      const unknown = await serveVendoredFonts(context)
      await use()
      expect(
        unknown(),
        'The app requested a font file that is not vendored in ' +
          'playwright/fonts/noto-sans/. The browser fell back to the local font ' +
          'for it, so the image is not the one the manual shows. Has the map ' +
          'style or ol-mapbox-style changed? See the README in that folder.',
      ).toEqual([])
    },
    { auto: true },
  ],
})
