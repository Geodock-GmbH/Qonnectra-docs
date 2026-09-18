// Freezes dates that the backend sets itself, so that an image does not change
// just because it was taken on a different day.
//
// The case this exists for: the tab "Anhänge" shows the upload date of every
// file next to its name. The spec uploads the file itself, the backend stamps
// it with `timezone.now()`, and the image therefore carried whatever day the
// run happened on - "17. Sept. 2026" in one run, a different date in the next.
// The same holds for the attachments that come in with the demo data; they
// carry the moment the instance was set up.
//
// Two routes do NOT work here, both tried first:
//
//   - `page.clock`. It moves the clock of the browser, and these timestamps are
//     produced in the backend. `created_at` on the models is `auto_now_add`,
//     `modified_at` is `auto_now` - Django discards a supplied value outright,
//     so seeding one through the API is not possible either.
//   - Patching the value in the database. It would be overwritten again by the
//     next write, and the demo import would have to carry it.
//
// What is left is the response on its way into the page. That only works for
// data the browser fetches itself - anything a SvelteKit `+page.server.ts`
// loads runs inside the container and never passes Playwright (the dashboard is
// the example, see the note on the node dates in tests/04-dashboard.spec.ts).
import type { Page } from '@playwright/test'

/**
 * The moment every capture pretends "now" is.
 *
 * Deliberately inside the period the demo data lives in (its nodes carry
 * 2026-03-19), so that a frozen date next to real values from the test project
 * does not look like an outlier. March is still CET, hence +01:00.
 */
export const CAPTURE_DATE = '2026-03-19T10:24:00+01:00'

export interface FreezeDatesOptions {
  /** Which requests to patch, as a glob or RegExp for `page.route()`. */
  url: string | RegExp
  /** Field names to overwrite, at any depth of the response. */
  fields: string[]
  /** Value to write in. Default: CAPTURE_DATE. */
  value?: string
}

/**
 * Overwrites the named date fields in the matching API responses.
 *
 * Has to be installed before the request goes out, i.e. before the view that
 * triggers it is opened. `null` is left alone: an empty date means "not set"
 * and is rendered differently from a date.
 */
export async function freezeDates(page: Page, options: FreezeDatesOptions): Promise<void> {
  const { url, fields, value = CAPTURE_DATE } = options
  const wanted = new Set(fields)

  await page.route(url, async (route) => {
    // Reading only. The same path takes the uploads, and re-issuing a multipart
    // POST through route.fetch() is a good way to break a capture for no gain -
    // the date is read back with the list afterwards anyway.
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }

    const response = await route.fetch()

    let body: unknown
    try {
      body = await response.json()
    } catch {
      // Not JSON - the same path also delivers downloads and previews.
      await route.fulfill({ response })
      return
    }

    await route.fulfill({ response, json: withFrozenFields(body, wanted, value) })
  })
}

/**
 * Replaces literal strings in the matching responses and reports how often it
 * did so.
 *
 * For the places where the field name is not in the response at all: SvelteKit
 * delivers the data of a `+page.server.ts` as `__data.json` when the page is
 * reached from inside the app, and `devalue` flattens it into an array in which
 * the keys are gone and only the values are left. Replacing by value works
 * there, as long as what is replaced is known exactly - the dates the spec
 * seeded itself, for instance.
 *
 * The returned function gives the number of replacements. Check it: if
 * SvelteKit ever changes the route of that payload, the interception stops
 * working, and without the check the dates would quietly start moving again.
 */
export async function replaceInResponses(
  page: Page,
  url: string | RegExp,
  replacements: Record<string, string>,
): Promise<() => number> {
  let count = 0

  await page.route(url, async (route) => {
    const response = await route.fetch()
    let text = await response.text()

    for (const [from, to] of Object.entries(replacements)) {
      const parts = text.split(from)
      count += parts.length - 1
      text = parts.join(to)
    }

    await route.fulfill({ response, body: text })
  })

  return () => count
}

/** Walks the response and replaces the wanted fields wherever they occur. */
function withFrozenFields(node: unknown, fields: Set<string>, value: string): unknown {
  if (Array.isArray(node)) {
    return node.map((entry) => withFrozenFields(entry, fields, value))
  }

  if (node !== null && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node).map(([key, entry]) =>
        fields.has(key) && entry !== null
          ? [key, value]
          : [key, withFrozenFields(entry, fields, value)],
      ),
    )
  }

  return node
}
