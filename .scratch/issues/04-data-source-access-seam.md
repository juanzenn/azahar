# 04 — Data source & access seam

Type: grilling
Status: resolved
Claimed-by: j.alvarez
Blocked by: 01

## Question

How is the seed catalog represented, and what seam sits between the storefront and its data?

- Representation — static TS/JSON committed in-repo? A tiny SQLite? MDX files?
- **Access seam** — define the read interface the UI calls (e.g. `listProducts`, `getByCategory`, `search(filters)`, `getBySlug`) so the data source can later swap to the **SaaS API** without touching UI. What's the seam's shape and where does it live?
- Where do the ~50 product images physically live (repo `public/`, static imports, external host)?

## Answer

**Representation — typed TS modules in `data/`.**
- Seed catalog authored as `data/products.ts` (`Product[]`) and `data/categories.ts` (`Category[]`), typed against the ticket-01 shape so every item is compile-time validated (bad `categorySlug`, missing facet → build error). Chosen over JSON (needs a separate validation step), MDX (no long-form need — `description` is a plain string), and SQLite (a runtime data source that fights the swap seam). Actual seed *content* is ticket 06.

**Seam contract — async from day one.**
- All seam methods return `Promise<…>`. The static impl resolves immediately from the TS modules; RSC pages `await` at **build time**, producing identical static HTML at no runtime cost. Rationale: the SaaS is a network API (inherently async), so an async contract makes the swap a pure behind-the-signature change — call sites never move. A sync seam would force every call site to change at swap time, i.e. the seam failing its one job.

**Client-side search data delivery — RSC embeds the catalog (option A).**
- The search page is an async RSC that `await`s the seam at build and passes the **full `Product[]` to the client search island as props** (shipped inside the prerendered HTML). No runtime fetch, no server. The client filters in-memory and never imports `@/data` or the seam directly (rejected option B — leaks the seam) and doesn't runtime-fetch a JSON index (rejected option C — needless round-trip + loading state at 50 items). Full array embedded, no trimmed projection type (premature at this scale; easy later refinement under the SaaS).

**Method surface — six dedicated async methods; `search` excluded.**
```ts
listProducts():               Promise<Product[]>        // powers the search-page embed
getProductBySlug(slug):       Promise<Product | null>   // product detail
listFeaturedProducts():       Promise<Product[]>        // home highlights
listCategories():             Promise<Category[]>       // nav + home
getCategoryBySlug(slug):      Promise<Category | null>  // category header/breadcrumb
listProductsByCategory(slug): Promise<Product[]>        // category grid
```
- Dedicated methods (not minimal + filter-in-page), mirroring the REST-ish endpoints the future SaaS would expose → best swap fidelity, dumb UI. `getBySlug` returns `null` on miss → the page calls Next's `notFound()`.
- **`search(filters)` is NOT a seam method.** Under static export a build-time `search()` can't see runtime user filters; search/filtering is a client-side concern — a pure `lib/search` function (ticket 09) over the embedded catalog. A server-side `search()` method is a SaaS-era addition, out of scope now.

**Structure & location — `lib/catalog/`, contract as a TypeScript interface.**
```
lib/catalog/
  source.ts          // interface CatalogSource { the 6 methods }  ← the seam, as a type
  static-source.ts   // export const staticSource: CatalogSource — reads @/data
  index.ts           // re-exports the ACTIVE source; UI imports ONLY from '@/lib/catalog'
```
- UI code imports from `@/lib/catalog` and never sees which source is active. **SaaS swap** = add `api-source.ts` implementing `CatalogSource`, flip the one export in `index.ts`. TypeScript refuses to compile if the API impl doesn't match the contract → "swap without touching UI" is *enforced*, not hoped for. The lighter no-interface alternative (functions written straight in `index.ts`, bodies rewritten at swap time) was rejected — it drops the compile-time guarantee exactly at the swap moment the seam exists to protect.

**Images — `public/`, referenced by in-data path strings.**
- Live in `public/images/products/` and `public/images/categories/`; shipped as plain static files.
- Referenced as **root-relative path strings stored in the data** — `images: ["/images/products/rosas-rojas-1.webp", …]`, `images[0]` primary. Naming: `<product-slug>-<n>.webp`, WebP default.
- Rendered via `next/image` with the `unoptimized` posture from ticket 02 (layout stability + lazy-load, no server resizing).
- **Swap fidelity**: the field holds a *reference string* (never a filename the UI stitches into a path), so today's local `/images/...` path becomes an absolute CDN URL under the SaaS with **no UI change** — `next/image unoptimized` renders both. Image *sourcing* (real photos vs placeholders) is ticket 06.

*Resolves nothing else on its own — no ticket is blocked by 04. No new fog or out-of-scope work surfaced.*
