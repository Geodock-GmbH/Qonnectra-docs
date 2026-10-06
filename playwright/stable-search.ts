// Pins the order of search hits that the backend leaves to chance.
//
// `trigram_address_search()` ends in `order_by("-similarity")` without a second
// sort key (local-app/backend/apps/api/search.py), and the hits of one street
// all score the same. Measured in the Django shell of the backend container:
// for "Toft 1" every address of the street Toft comes back with a similarity
// of 1.0, the "1" is a short token that only filters and does not score - and
// the same holds for "Nieharde". Postgres then returns the ties in whatever
// order the plan happens to produce, and the hit list in compaction_search and
// trace_search reordered itself from one run to the next.
//
// That is a bug in the app, not in the capture: paginating through tied results
// skips and repeats rows for users too. The fix belongs upstream
// (`order_by("-similarity", "id")`); local-app/ is a foreign, gitignored
// checkout and is never patched from here. Until then the response is sorted on
// its way into the page, the same device as freezeDates(): ties are broken by
// `id_address`, which stands in for the id the upstream fix would use.
//
// The response carries no score, so the tie groups have to be rebuilt from what
// it does carry. The score of a hit is the best word similarity of the first
// token of three or more characters against street, city, zip code and
// district, and it is 1.0 exactly when one of those fields contains the token
// as a word. That splits the hits into the full matches and the rest, in that
// order - for "Toft 1" the ten addresses of the street Toft before the two of
// "Oster Torf" at 0.4, which is the order the backend produces too. Within the
// rest a further split would need the real scores, so this is only right for
// terms whose hits below the full matches tie among themselves. "Toft 1" and
// "Nieharde" do; for another term, check in the Django shell first:
//
//   docker exec qonnectra_backend_prod python manage.py shell -c "
//   from apps.api.search import trigram_address_search
//   from apps.api.models import Address
//   for a in trigram_address_search(Address.objects.filter(project=2), 'Toft 1'):
//       print(a.similarity, a.street, a.housenumber, a.id_address)"
import type { Page } from '@playwright/test'

/**
 * The search endpoint the browser calls itself: `trace-search/` serves the
 * address fields of the Nachverdichtung (chapter 7) and the Faserweg (chapter
 * 15). The search panel of the map and the list of the Adressen go through
 * SvelteKit form actions instead; their payload is flattened by `devalue` and
 * cannot be sorted here. The map search for "Nieharde" ties just the same and
 * has merely come out in the same order so far - if `map_search` starts
 * reordering its hits, that is where to look.
 */
const SEARCH_URLS = /\/api\/v1\/trace-search\/\?.*search=/

type Hit = Record<string, unknown>

/** The fields the backend scores an address against. */
const SCORED_FIELDS = ['street', 'city', 'zip_code', 'district']

/**
 * The token the backend ranks by: the first one of three or more characters,
 * exactly as `trigram_address_search()` picks it. Shorter tokens only filter.
 */
function rankingToken(url: string): string | undefined {
  const search = new URL(url).searchParams.get('search') ?? ''
  return search
    .trim()
    .split(/\s+/)
    .find((token) => token.length >= 3)
}

/** 0 for a hit one of whose scored fields contains the token as a word, else 1. */
function rank(hit: Hit, token: string | undefined): number {
  if (!token) return 0
  const asWord = new RegExp(`(^|[^\\p{L}\\p{N}])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}\\p{N}]|$)`, 'iu')
  return SCORED_FIELDS.some((field) => asWord.test(String(hit[field] ?? ''))) ? 0 : 1
}

/** Tie-break of a hit: addresses by their ID, everything else by name or uuid. */
function tieBreak(hit: Hit): string {
  return String(hit.id_address ?? hit.name ?? hit.uuid ?? '')
}

/**
 * Sorts the `results` of every matching search response: full matches of the
 * ranking token first, then the rest, and `tieBreak()` within each group.
 *
 * Has to be installed before the view loads, i.e. before `page.goto()`. Only
 * `results` is touched; a paginated response keeps `count`, `next` and
 * `previous` as they are.
 */
export async function stableSearchOrder(page: Page): Promise<void> {
  await page.route(SEARCH_URLS, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }

    const response = await route.fetch()

    let body: unknown
    try {
      body = await response.json()
    } catch {
      await route.fulfill({ response })
      return
    }

    if (body && typeof body === 'object' && Array.isArray((body as { results?: unknown }).results)) {
      const token = rankingToken(route.request().url())
      const results = (body as { results: Hit[] }).results
      results.sort(
        (a, b) => rank(a, token) - rank(b, token) || tieBreak(a).localeCompare(tieBreak(b)),
      )
    }

    await route.fulfill({ response, json: body })
  })
}
