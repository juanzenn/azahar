# 07 — Search module (pure logic)

**What to build:** The engine behind every results page, as one pure, exhaustively tested door: given
a catalog and a set of criteria, it returns the surviving products in the requested order, the total,
per-facet counts, and the page count — plus the translation between criteria and URL query params. No
React, no DOM, no rendering. Ticket 08 puts a UI on it.

This is the **highest-risk logic in the build**, which is why it lands as its own slice with the
tests as the deliverable.

Spec: [`spec.md`](../../spec.md) §6 (URL scheme), §7 (search & filtering), Testing Decisions.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] One module exposes exactly three functions — the whole surface:

  ```ts
  search(products, criteria) → { results, total, facetCounts, pageCount }
  parseCriteria(searchParams) → criteria
  toSearchParams(criteria)    → URLSearchParams
  ```

- [ ] **URL parse/serialise lives inside this module**, not beside it — the key→field map is its responsibility, and co-locating makes round-trip testing free.
- [ ] **Composition semantics** implemented and tested: within a multi-value facet → **OR**; across different facets → **AND**; free-text → **AND** with facets and never resetting them; price and size single-select and AND. Sort is orthogonal.
- [ ] Tested invariant: **sort never changes which products survive**, only their order.
- [ ] **Text matching**: per product a normalised blob of name + tagline + description + category display name + all facet display labels; blob and query lowercased and diacritic-stripped; query split on whitespace with **every token required as a substring**. Tested: `cumpleanos` matches `Cumpleaños`; multi-token AND; matches against description and facet *labels*, not just names; **no fuzzy/typo tolerance** (asserted as deliberate).
- [ ] **Facet counts** — the subtle rule, and the highest-value test in the suite: a value's count is computed with **all active filters except its own facet** applied, then intersected with that value. Tested explicitly that selecting one colour does **not** zero out its OR-siblings.
- [ ] **Disable-zero**: a value whose count is 0 is reported as disabled, so the UI can never offer a dead end.
- [ ] **Price buckets tested at their boundaries** — 2499 / 2500 / 4999 / 5000 / 9999 / 10000 cents each landing in the correct bucket of `0-25` / `25-50` / `50-100` / `100+`.
- [ ] **Pagination**: 12 per page; correct page count; an out-of-range page **clamps to the last valid page** rather than returning empty.
- [ ] **URL round-trip tested as identity**: criteria → params → criteria. Only active params serialise; **default sort and `page=1` are omitted**; multi-value facets serialise as **repeated keys**; sort tokens are `featured`/`price-asc`/`price-desc`/`name`.
- [ ] `featured` sort means the catalog's curated order — featured first, then seed order.
- [ ] **Zero runtime dependencies** for matching — no Fuse.js, no MiniSearch. Kept pure so a real search library could later drop in behind the same signature with no call-site churn.
- [ ] Tests use **small hand-built fixtures** (roughly a dozen products chosen to exercise the rule under test), not the 50-item seed — the seed is production content and makes tests slow and illegible.
