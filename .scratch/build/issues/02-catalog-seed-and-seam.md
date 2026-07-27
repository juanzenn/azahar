# 02 — Catalog seed + `CatalogSource` seam

**What to build:** The real catalog, as data the rest of the app can read through exactly one door.
All 10 categories and all 50 products exist as typed, compile-time-validated modules, reachable only
via an async `CatalogSource` seam whose static implementation reads them. Nothing renders yet — this
ticket's payoff is that every page after it has real products to show, and that a future swap to a
hosted API is a one-line change the compiler polices.

**Content source of truth:** [`seed/products.md`](../../seed/products.md) — transcribe from it; do not
invent products. It carries three tables per product (identity/price/category/size/featured/image ·
facets · Spanish copy) that merge into one entry each.

Spec: [`spec.md`](../../spec.md) §2 (domain model), §3 (data source & seam), §4 (catalog content).

**Blocked by:** 01

**Status:** done

- [x] `Product` and `Category` types match the locked shape — inlined here because it fixes cardinality more precisely than prose:

  ```ts
  type Category = {
    slug: string; name: string
    description?: string; heroImage?: string
  }

  type Product = {
    id: string; slug: string; name: string
    tagline?: string          // short line for cards
    description: string       // full copy for the detail page
    priceUsdCents: number     // single price, USD minor units
    images: string[]          // >= 1; images[0] is primary
    categorySlug: string      // exactly ONE primary category
    occasions: string[]       // facet, multi
    flowerTypes: string[]     // facet, multi
    colours: string[]         // facet, multi
    size: string              // facet, single: 'pequeno' | 'mediano' | 'grande'
    featured?: boolean
  }
  ```

- [x] Facet vocabularies are enumerated as types or const unions so an invalid facet value is a **compile error**: occasion ×8, flower type ×8, colour ×8, size ×3 (slugs per the seed asset — ASCII, URL-safe; display labels are accented Spanish).
- [x] All **10 categories** transcribed with name, description and hero image reference.
- [x] All **50 products** transcribed with every field concrete, typed against the shape above.
- [x] `CatalogSource` exists as a **TypeScript interface** with exactly these six async methods, and a static implementation satisfying it:

  ```ts
  listProducts():               Promise<Product[]>
  getProductBySlug(slug):       Promise<Product | null>
  listFeaturedProducts():       Promise<Product[]>
  listCategories():             Promise<Category[]>
  getCategoryBySlug(slug):      Promise<Category | null>
  listProductsByCategory(slug): Promise<Product[]>
  ```

- [x] **Every method is async**, even though the static source resolves immediately — the future API is async, so this keeps the swap a pure behind-the-signature change with no call site moving.
- [x] The two `getBySlug` methods return **`null`** on a miss (pages will translate that to `notFound()`).
- [x] There is **no `search` method** on the seam, deliberately — a build-time search cannot see runtime user filters. Search is ticket 07.
- [x] A single module re-exports the **active** source; consumers import from the seam and can never tell which implementation is behind it. Nothing outside the seam imports the data modules directly.
- [x] **Seed invariant tests** pass, so a transcription slip fails the build instead of producing silent dead ends:
  - [x] 50 products, every `slug` unique and ASCII-hyphenated
  - [x] category spread 8/7/6/5/5/5/4/4/3/3 across ramos → detalles
  - [x] price-bucket coverage 9/19/15/7 using boundaries `<2500` / `2500–4999` / `5000–9999` / `>=10000` cents
  - [x] exactly 7 featured, with the flagship (`ramo-deluxe-24-rosas`) first
  - [x] **every facet value has ≥3 products** — no filter can dead-end
  - [x] every product has exactly one valid `categorySlug`, an integer `priceUsdCents`, and at least one image
  - [x] the three foliage plants having **empty** `flowerTypes`/`colours` is asserted as intentional, not treated as a failure
