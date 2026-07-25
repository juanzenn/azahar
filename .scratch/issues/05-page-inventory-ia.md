# 05 — Page inventory & information architecture

Type: grilling
Status: resolved
Claimed-by: j.alvarez
Blocked by: 01

## Question

Enumerate the pages/routes and how users move between them:

- Home, category browse, **advanced-search results (with filters)**, product detail, cart, checkout, order-confirmation, any static pages (about/contact)?
- Global navigation & search bar placement — where does search live, and how does it relate to the results page (ticket 09)?
- Route/URL scheme (category slugs, search query params for filters/sort).

## Answer

**Keystone — category ↔ search model (Model B).** Dedicated category pages *reuse the same advanced-results component* as global search, scoped to one category. One results surface, two entry points. (Rejected A = category is just a `/buscar` filter — loses clean URLs/hero/copy; C = simple grids separate from search — two surfaces to maintain, and search is meant to be first-class everywhere.) Maps cleanly onto the 04 seam: `getCategoryBySlug` + `listProductsByCategory` feed category pages; `listProducts` feeds global search.

**Slug/code language convention.** User-facing **URL paths are Spanish** (`/categoria/rosas`, `/producto/…`, `/carrito`, `/buscar`); **all code symbols are English**. (Search query-param *keys* are the one boundary — decided English + abbreviated below.)

**Route inventory** (static export, App Router):

| Route | Purpose | Data (04 seam) |
|---|---|---|
| `/` | Home — hero, featured, category entry, occasion strip | `listFeaturedProducts`, `listCategories` |
| `/categorias` | Index of all 10 categories (cards) — main discovery surface | `listCategories` |
| `/categoria/[slug]` | Category page — hero + advanced-results island scoped to category | `getCategoryBySlug`, `listProductsByCategory` |
| `/buscar` | Global advanced search — full-catalog results island | `listProducts` |
| `/producto/[slug]` | Product detail | `getProductBySlug` → `notFound()` on miss |
| `/carrito` | Cart | client-side cart state |
| `/finalizar-compra` | Checkout (form + payment instructions) — *interaction detail → ticket 07* | client-side |
| `/pedido-enviado` | Post-dispatch confirmation / thank-you — *detail → ticket 07* | client-side |
| `/nosotros` | About (static copy) | — |
| *not-found* | Spanish 404 page | — |

No `/contacto` page — contact folds into the footer.

**Global chrome.**
- **Header (sticky, all pages):** logo/wordmark → `/`; **persistent, prominent search bar** → submits to `/buscar?q=…` (collapses to an expandable icon on mobile); plain **"Categorías" link → `/categorias`** (no dropdown); **cart icon with live item-count badge → `/carrito`**.
- **Footer (all pages):** contact block (WhatsApp CTA + phone + hours/location), accepted payment methods (Pago Móvil / Zelle / efectivo) as trust signals, category links, link to `/nosotros`, copyright.

**Home (`/`) composition** (top→bottom):
1. **Hero** — showcases a curated **flagship = the first item from `listFeaturedProducts()`** (no sales/stock data exists, so flagship is curated by ordering it first; no schema change). Image + name + price + "Ver producto" → `/producto/[slug]`, secondary "Ver todo" → `/buscar`. Includes a **prominent hero search bar** (in addition to the header one).
2. **Featured products** row (`listFeaturedProducts`).
3. **Categories grid** — the 10 categories as cards (carries weight since nav has no dropdown).
4. **"Comprar por ocasión" strip** — quick links → `/buscar?occ=…` (leans on the occasion facet).
- Trust/contact band is *not* a home section — it lives in the footer.

**Cross-page navigation.**
- **Breadcrumbs:** category page `Inicio / Categorías / {category}`; product page `Inicio / {primary category} / {product name}` (from the product's one `categorySlug`); `/buscar` at most `Inicio / Buscar`; none on home/cart/checkout.
- **Product detail → "Más de esta categoría"** related row: products from the same primary category (`listProductsByCategory`, exclude current, cap ~4).

**Search state & URL scheme** (ticket 05 owns this; ticket 09 refines the filter *interaction*):
- **URL query string is the single source of truth** — shareable, back-button-safe. The results island reads from and writes to it.
- **Only active params are serialized** — empty facets and the default sort are omitted; clean base URLs (`/buscar`, `/categoria/rosas`).
- **Abbreviated English keys** (one small English→English `lib/search` key→field map; deliberately terse rather than 1:1 field names):

  | Key | Field | Cardinality |
  |---|---|---|
  | `q` | free-text query | single |
  | `cat` | `categorySlug` (global `/buscar` only; category page fixes it via the path) | single |
  | `occ` | `occasions` | **multi** (repeated key) |
  | `ft` | `flowerTypes` | **multi** (repeated key) |
  | `col` | `colours` | **multi** (repeated key) |
  | `sz` | `size` | single |
  | `pr` | price-range token | single |
  | `sort` | sort | single |

- **Multi-value encoding:** repeated keys (`?col=rojo&col=blanco`) — native to Next `searchParams`, no custom parsing.
- **Sort tokens:** `featured` (default, omitted from URL), `price-asc`, `price-desc`, `name`.
- **Price tokens:** language-neutral numeric ranges — `0-25`, `25-50`, `50-100`, `100+`.
- Examples: `/buscar?q=rosas&col=rojo&col=blanco&sort=price-asc`; `/categoria/rosas?occ=aniversario&pr=25-50`.

**Primary user journey:** browse (`/` · `/categorias` · `/categoria/[slug]`) or search (`/buscar`) → `/producto/[slug]` → add to cart (stay on page, badge updates) → `/carrito` → `/finalizar-compra` → `/pedido-enviado`.

**Handoffs / effects:**
- **Unblocks ticket 09** (advanced-search UX) — it builds directly on this URL scheme and results-surface model. With 01 already resolved, 09's blockers are now clear.
- Checkout & confirmation *interaction* detail (`/finalizar-compra`, `/pedido-enviado`) remains with **ticket 07**; ticket 05 only fixes their routes/slugs.
- No new tickets, no fog graduated, no scope changes surfaced.
