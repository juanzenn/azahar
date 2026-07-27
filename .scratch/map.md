<!-- wayfinder:map -->
# Azahar — build-ready spec (flower-shop storefront)

## Destination

A build-ready spec for **Azahar**: a **read-only flower-shop storefront** (single Next.js app) fed by ~50 seeded products across 10 categories. **Search and categories are first-class**, delivered as an **Amazon-style advanced search** (facets, filters, sort). Includes product detail pages, a cart, and a checkout that collects customer details and shows **manual payment instructions** (Pago Móvil / Zelle / cash), then dispatches the order **off-app**. No admin, no order tracking, no stock.

Done when every open decision below is locked and a builder could start from the spec.

## Notes

- Domain: e-commerce storefront, **flowers**, **Venezuelan** market, **Spanish-language** UI. Currency likely USD.
- **Planning effort — plan, don't do.** The destination is a spec, not a running shop.
- Skills: `/prototype` (design + search UX), `/research` (external facts), `/grilling` + `/domain-modeling` (decisions).
- Standing pref: "very standard design", lean, build-ready. **Search is a first-class, Amazon-style advanced search.**

## Decisions so far

<!-- the index — one line per closed ticket -->

- [Domain model & catalog data shape](issues/01-domain-model-catalog-shape.md) — Product = single SKU (one size, one USD price in cents, no variants); **one primary Category** on the presentation/format axis; four **facets** — occasion, flower type, colour (multi), size (single) — plus derived price-range. Enumerated vocab is content (ticket 06).
- [Research: WhatsApp Click-to-Chat + Venezuelan manual-payment methods](issues/03-research-whatsapp-payments.md) — `wa.me/<cc+digits>?text=<encodeURIComponent once>`, multi-line cart via `%0A`, keep URL <~2000 chars, no auto-send so also show raw number; Pago Móvil = teléfono+cédula/RIF+banco(4-digit), plus transferencia/Zelle/Binance field lists; capture the payment **referencia** per order.
- [Stack, i18n & conventions](issues/02-stack-i18n-conventions.md) — **fully static** Next.js (`output: 'export'`, no runtime server; cart/search/checkout client-side); **App Router, RSC + client islands**; **Tailwind + shadcn/ui**; **Spanish-only** (`lib/strings.ts`, no i18n lib); **USD-only** `formatPrice`; host-agnostic deploy (Vercel default); flat repo layout, TS strict + `@/*`, ESLint+Prettier, npm, **Node 24 LTS** (`24.x`, also the deploy target).
- [Data source & access seam](issues/04-data-source-access-seam.md) — seed = **typed TS modules** in `data/`; **async** `CatalogSource` seam in `lib/catalog/` (interface + `static-source` + `index`; UI imports only `@/lib/catalog`), 6 dedicated methods (`listProducts`/`getProductBySlug`/`listFeaturedProducts`/`listCategories`/`getCategoryBySlug`/`listProductsByCategory`, `null`→`notFound()`); **`search` excluded** — client-side `lib/search` fn over a catalog the search-page **RSC embeds as props**; images in `public/images/{products,categories}/` as **in-data path strings** via `next/image unoptimized`. SaaS swap = add `api-source.ts`, flip one export (TS-enforced).
- [Category taxonomy & 50-item seed plan](issues/06-category-taxonomy-seed-plan.md) — **10 format categories** (ramos, arreglos, cajas, canastas, floreros, plantas, coronas, centros-de-mesa, rosas-preservadas, detalles); facet vocabularies fixed (**occasion ×8, flower type ×8, colour ×8, size ×3**); **full concrete 50-product seed** authored at [`seed/products.md`](seed/products.md) (spread 8/7/6/5/5/5/4/4/3/3, price coverage 9/19/15/7, 7 featured, flagship = `ramo-deluxe-24-rosas`, every facet value ≥3 products); **images = curated local Unsplash pool** (19 product + 10 category files, reused, license-safe, no hotlink). Builder transcribes into `data/` per ticket 04.
- [Checkout & order-dispatch flow](issues/07-checkout-order-dispatch.md) — **pay-first, WhatsApp-dispatched, no server order record**: single `wa.me` text-only deep-link carries the full serialized order (raw-number/copy fallback; comprobante sent manually in-chat). **Flat configurable delivery fee** (pickup = free) so the exact total shows before payment; **referencia captured in-app** then forwarded (verification/persistence stay out of scope — pay-first is UX-shape only, seam future-proofs). Fields: comprador (nombre/tel/email all **required**), envío-vs-retiro toggle, optional **destinatario/regalo** block, required fecha + optional franja, optional tarjeta/remitente/notas. **All 5 rails config-driven** (Pago Móvil/Transferencia/Zelle/Binance/Efectivo), single-select radio → account block + copy → required referencia; **Efectivo** = contra-entrega + "¿vuelto?"/con-cuánto-pagas. **Single page + sticky summary**; Finalizar → stash order in `sessionStorage` → `/pedido-enviado` hosts the WhatsApp link + fallback + comprobante reminder, clears cart. Client order code `AZ-XXXX` (label only). Cart = `localStorage` `{slug,qty}`, price from catalog at render.
- [Advanced search & filtering UX](issues/09-advanced-search-filtering-ux.md) — one results island (Model B) over the RSC-embedded catalog. **Within-facet OR, across-facet AND**, `q`/price/size AND; **zero-dep accent-insensitive token match** (no Fuse.js) in `lib/search`. **Desktop sticky sidebar / mobile `Sheet`**; controls = category(radio, global-only)·price(radio)·occasion/flower-type/colour(checkbox, colour swatches)·size(radio), each with a "Cualquiera" clear-row. **Dynamic facet counts + disable-zero**; **removable chips per value + "Limpiar todo"**; shadcn `Select` sort (ticket-05 tokens). **Numbered pagination, 12/page**, new `page` param (omit@1, reset-on-change, clamp), **push-on-page-change** (sole exception to otherwise-`replace` URL state; query debounced ~250ms). No-filter = full set; zero-result → message + spelling nudge + chips + "Limpiar filtros" + featured fallback; no loading state. Extends ticket-05 URL scheme; card/visual treatment → ticket 08.
- [Page inventory & information architecture](issues/05-page-inventory-ia.md) — **Model B**: category pages reuse the advanced-results component scoped to one category; `/buscar` is the global version. Routes (Spanish slugs, code English): `/`, `/categorias`, `/categoria/[slug]`, `/buscar`, `/producto/[slug]`, `/carrito`, `/finalizar-compra`, `/pedido-enviado`, `/nosotros`, 404 — no `/contacto` (contact in footer). Sticky header = logo + **persistent search bar** + plain "Categorías" link + cart badge. Home = hero (flagship = 1st featured + hero search) → featured → categories grid → "comprar por ocasión" strip. Breadcrumbs on category/product + "más de esta categoría" row. **URL = single source of truth, only active params, abbreviated English keys** (`q`,`cat`,`occ`*,`ft`*,`col`*,`sz`,`pr`,`sort`; `*`=repeated multi-value; sort `featured`/`price-asc`/`price-desc`/`name`; price `0-25`/`25-50`/`50-100`/`100+`). **Unblocks ticket 09.**
- [Visual design direction (prototype)](issues/08-visual-design-direction.md) — locked **Direction B "Jardín"** (editorial boutique) from a 3-variant [prototype](prototypes/08-visual-direction.html): **asymmetric photo hero + generous whitespace**; **tall portrait, edge-to-edge, hover-zoom cards** (serif name, emerald price, no quick-add — click-through to PDP); palette = warm off-white ground (`#faf8f3`), **emerald `#1f4d3a` primary** + **plum `#5f2a52` secondary** + gold `#b08542` (NOT terracotta-cream); **serif display + sans body**, uppercase wide-spaced eyebrows; ticket-09 search styled within B (serif facet headings, circular colour swatches, pill chips, underlined sort select, circular pagination). Tokens are build-ready Tailwind/shadcn theme input.

- [Spec assembly](issues/10-spec-assembly.md) — **destination reached.** Tickets 01–09 collapsed into the build-ready spec at [`spec.md`](spec.md) (`ready-for-agent`): 117 user stories + implementation/testing decisions. Assembly settled the one gap no ticket covered — **testing posture: Vitest + RTL over 3 pure seams (search/cart/order) + 2 thin island wiring tests**; catalog seam is architecture-only (compiler is the guarantee), order code needs injectable randomness. Also resolved a **04↔06 image-naming contradiction** in favour of 06's reused subject-named pool. Catalog content stays in [`seed/products.md`](seed/products.md), not duplicated.

## Not yet specified

<!-- All decisions locked and the terminal deliverable (ticket 10) is produced. The map is complete; work continues on the main flow at /to-tickets. -->

_(empty — the way to the destination is clear, and the destination is reached)_

## Out of scope

- The reusable Shopify-lite **SaaS backend** + managed admin + API-token issue/consume (the "other project") — a future, separate effort.
- **Catalog-management admin** (product upload UI) — deferred to the SaaS.
- **Order tracking** & order lifecycle — deferred to the SaaS.
- **Inventory / stock** counts & decrement — deferred to the SaaS.
- Integrated **online payment** gateway.
