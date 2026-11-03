// Reading and rewriting the data of SvelteKit remote functions on its way into
// the page.
//
// Since Qonnectra v1.8.0 the views no longer load their data through
// `+page.server.ts` (`__data.json`) but through remote functions
// (local-app/frontend/src/lib/remote/**). The browser calls them itself, also on
// a full page load - the server renders the page without the data and the
// client fetches it after hydration:
//
//   GET /_app/remote/<hash>/<name>?payload=<base64url of the argument>
//   -> { "type": "result", "data": "<devalue string of { _: result }>" }
//
// The hash is generated per build, the function name (`getDashboardStatistics`,
// `searchAddresses`, ...) is the export name in the `.remote.ts` file and
// stable. `data` is a string holding a `devalue`-flattened array: one array of
// values, objects and arrays in it holding indices into the same array, index 0
// being the envelope `{ _: <index of the result> }`. The helpers below work on
// that flat array in place, so the rewritten response keeps the exact shape
// SvelteKit wrote - a reorder moves indices, it never re-serialises values.
//
// The argument travels the same way, base64url-encoded and devalue-flattened,
// with plain objects tagged `["__skrao", <index>]` (SvelteKit sorts their keys
// so equal arguments share a cache entry).
import type { Page } from '@playwright/test'

/** A devalue-flattened payload. */
export type Flat = unknown[]

/** The address of a remote function, whatever hash the build gave it. */
export function remoteUrl(name: string): RegExp {
  return new RegExp(`/_app/remote/[^/?]+/${name}(\\?|$)`)
}

/**
 * Resolves one entry of a flattened payload to a plain value. Only what the
 * app sends is supported: objects, arrays, primitives, `Date` and the
 * `__skrao` tag of remote arguments. Negative indices are devalue's special
 * values; they come back as `undefined` (or the number they stand for).
 */
export function hydrate(flat: Flat, index: unknown): unknown {
  if (typeof index !== 'number') return undefined
  if (index < 0) {
    return { [-3]: NaN, [-4]: Infinity, [-5]: -Infinity, [-6]: -0 }[index]
  }
  const value = flat[index]
  if (Array.isArray(value)) {
    if (typeof value[0] === 'string') {
      const [tag, inner] = value as [string, unknown]
      if (tag === 'Date') return inner
      if (tag.startsWith('__skra')) return hydrate(flat, inner)
      return undefined
    }
    return value.map((entry) => hydrate(flat, entry))
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, hydrate(flat, entry)]),
    )
  }
  return value
}

/** The argument a remote query was called with, read from its `payload`. */
export function remoteArgument(url: string): unknown {
  const payload = new URL(url).searchParams.get('payload')
  if (!payload) return undefined
  const json = Buffer.from(payload.replaceAll('-', '+').replaceAll('_', '/'), 'base64').toString(
    'utf8',
  )
  return hydrate(JSON.parse(json) as Flat, 0)
}

/** Index of the result inside a flattened response (`{ _: <index> }` at 0). */
export function resultIndex(flat: Flat): number | undefined {
  const envelope = flat[0] as { _?: unknown } | undefined
  return typeof envelope?._ === 'number' ? envelope._ : undefined
}

/**
 * Rewrites the result of every call to the named remote function.
 *
 * `rewrite` gets the flattened response, the index of the result in it and the
 * argument of the call, and changes the array in place. Install it before the
 * view that calls the function is opened. Error responses and anything that is
 * not a remote result are passed through untouched.
 */
export async function rewriteRemote(
  page: Page,
  name: string,
  rewrite: (flat: Flat, result: number, argument: unknown) => void,
): Promise<void> {
  await page.route(remoteUrl(name), async (route) => {
    // Queries are GET; a command or form of the same name is left alone.
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }

    const response = await route.fetch()

    let body: { type?: string; data?: unknown }
    try {
      body = await response.json()
    } catch {
      await route.fulfill({ response })
      return
    }

    if (body.type !== 'result' || typeof body.data !== 'string') {
      await route.fulfill({ response, json: body })
      return
    }

    const flat = JSON.parse(body.data) as Flat
    const result = resultIndex(flat)
    if (result !== undefined) {
      rewrite(flat, result, remoteArgument(route.request().url()))
    }

    await route.fulfill({ response, json: { ...body, data: JSON.stringify(flat) } })
  })
}
