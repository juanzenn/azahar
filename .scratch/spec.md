# Spec — Azahar flower-shop storefront

Status: ready-for-agent
Type: spec
Source: `/wayfinder` map at [`map.md`](./map.md) — collapses tickets 01–09; resolves ticket [10](./issues/10-spec-assembly.md)
Assets: [`seed/products.md`](./seed/products.md) (catalog content) · [`research/whatsapp-payments.md`](./research/whatsapp-payments.md) · [`prototypes/08-visual-direction.html`](./prototypes/08-visual-direction.html)
Implementation tickets: [`build/issues/`](./build/issues/) — 14 tickets produced by `/to-tickets`, worked blockers-first

---

## Problem Statement

A small Venezuelan flower shop sells entirely over WhatsApp. Customers have no way to see what's for
sale without asking: there is no catalog to browse, no prices to compare, and no way to share a link
to a specific arrangement. Every enquiry starts from zero — the shop re-types the same descriptions
and prices, and the customer has to describe what they want in words for a product that is bought
almost entirely with the eyes.

For the customer, that means:

- They can't see the range. Whatever the shop happens to mention is the whole catalog to them.
- They can't shop by the thing they actually care about — *"algo rojo para un aniversario, menos de
  $50"* — because there's nothing to filter.
- They have no idea what an order will cost until they've already committed to a conversation.
- Ordering means a long back-and-forth: which arrangement, what it costs, delivery or pickup, when,
  for whom, what the card should say, how to pay.

For the shop, that means every order is a manual conversation that starts from nothing, and orders
arrive as unstructured chat that's easy to get wrong — a missing address, no delivery date, an
unclear payment reference.

The shop cannot adopt a conventional e-commerce platform: payment happens on Venezuelan rails
(Pago Móvil, transferencia, Zelle, Binance, efectivo) that integrated gateways don't serve, and
there is no staff to run an admin back-office.

## Solution

**Azahar** — a fast, image-forward, Spanish-language storefront that makes the catalog browsable and
turns the WhatsApp order from a conversation into a single pre-filled message.

The customer browses or searches a catalog of ~50 arrangements across 10 categories. Search is
**first-class**: an Amazon-style faceted search where they narrow by category, price, occasion,
flower type, colour and size, with live result counts, removable filter chips, sorting and
pagination — all reflected in a shareable URL. They open a product, add it to a cart, and check out
by filling in one page: who they are, delivery or pickup, when, for whom, what the card should say.

The exact total — including a flat delivery fee — is shown **before** payment. The customer picks a
payment rail, sees the shop's account details with copy buttons, pays out-of-band, and enters the
`referencia`. Pressing **"Enviar pedido por WhatsApp"** opens WhatsApp with the entire order already
written out: line items, totals, delivery details, recipient, payment method and reference. The
customer presses send.

The whole thing is a **fully static site** — no server, no database, no admin. The catalog is seeded
data compiled into the build; cart, search and checkout run in the browser. This keeps hosting
essentially free and the build trivially deployable, and it is deliberately shaped so the catalog
can later be swapped to a hosted API without the UI changing.

## User Stories

### Browsing & discovery

1. As a customer, I want to land on a home page that immediately shows me a real arrangement, so that I understand what this shop sells within a second of arriving.
2. As a customer, I want the home page to feature one flagship arrangement prominently, so that I have an obvious first thing to look at instead of a wall of choices.
3. As a customer, I want a row of featured arrangements on the home page, so that I can see the shop's best work without searching.
4. As a customer, I want to see all 10 categories as a grid on the home page, so that I can find the *format* I have in mind (a bouquet vs a box vs a plant).
5. As a customer, I want a "comprar por ocasión" strip on the home page, so that I can start from *why* I'm buying rather than *what* I'm buying.
6. As a customer, I want a dedicated page listing every category, so that browsing by format is a first-class path and not buried in a menu.
7. As a customer, I want each category page to have its own heading and description, so that I know where I am and what belongs in this category.
8. As a customer, I want breadcrumbs on category and product pages, so that I can move back up a level without using the browser Back button.
9. As a customer, I want a "más de esta categoría" row on a product page, so that I can compare alternatives without going back to the grid.
10. As a customer, I want an "acerca de" page, so that I can judge whether this is a real shop before I hand over money.
11. As a customer, I want the shop's contact details, hours and accepted payment methods in the footer of every page, so that I can reach a human at any point.
12. As a customer, I want a Spanish 404 page when I follow a dead link, so that a mistyped URL doesn't feel like the site is broken.

### Search & filtering

13. As a customer, I want a search bar visible in the header on every page, so that I can search from wherever I am.
14. As a customer, I want a prominent search bar in the home hero too, so that searching is an obvious first action.
15. As a customer, I want to search by free text and have it match names, descriptions, categories and flower types, so that I can type what I'm thinking rather than guess the site's vocabulary.
16. As a customer, I want search to ignore accents and capitalisation, so that typing "cumpleanos" finds "Cumpleaños".
17. As a customer, I want the in-page search box to filter results as I type, so that I get feedback without pressing a button.
18. As a customer, I want to filter by category, so that I can restrict results to one format.
19. As a customer, I want to filter by price range, so that I can shop to a budget.
20. As a customer, I want to filter by occasion, so that I can find something appropriate for a wedding or a funeral.
21. As a customer, I want to filter by flower type, so that I can find roses specifically when that's what I want.
22. As a customer, I want to filter by colour, and see a colour swatch next to each option, so that I can scan the list visually instead of reading words.
23. As a customer, I want to filter by size, so that I can match the gesture to the occasion.
24. As a customer, I want to select several values within one facet (red *and* white), so that I can widen a search without starting over.
25. As a customer, I want selections across different facets to narrow the results, so that combining filters behaves the way I expect from other shops.
26. As a customer, I want my typed query to combine with my filters rather than clear them, so that refining never loses work.
27. As a customer, I want a result count next to every filter value, so that I know what's worth clicking before I click it.
28. As a customer, I want filter values with no matches greyed out and unclickable, so that I can never filter my way into an empty page.
29. As a customer, I want the counts to update as I change filters, so that they stay true rather than showing catalog totals.
30. As a customer, I want each active filter shown as a removable chip above the results, so that I can see exactly why I'm seeing these results and undo one piece at a time.
31. As a customer, I want a "Limpiar todo" action, so that I can start over in one click.
32. As a customer, I want to sort by featured, price ascending, price descending, or name, so that I can scan in whatever order suits me.
33. As a customer, I want sorting to reorder results without changing which ones I see, so that sorting never silently drops products.
34. As a customer, I want results paginated at 12 per page with numbered pages, so that a long list doesn't become an endless scroll.
35. As a customer, I want to be returned to page 1 whenever I change a filter, so that I never land on an out-of-range empty page.
36. As a customer, I want the page to scroll to the top of the results when I change pages, so that I start reading at the first result.
37. As a customer, I want the Back button to step back through result *pages*, so that paging behaves like navigation.
38. As a customer, I want the Back button *not* to replay every individual filter tweak, so that leaving a search doesn't mean pressing Back twenty times.
39. As a customer, I want the full URL to capture my search, so that I can bookmark it or send it to someone.
40. As a customer, I want a shared search URL to reproduce exactly the same results, so that a link I receive shows me what the sender saw.
41. As a customer on a phone, I want filters behind a "Filtros" button showing how many are active, so that the filter panel doesn't eat the screen.
42. As a customer on a phone, I want the filter sheet to show live results and a "Ver N resultados" button, so that I can see the effect before dismissing it.
43. As a customer on a desktop, I want a filter sidebar that stays put as I scroll, so that I can refine without scrolling back up.
44. As a customer, I want visiting search with no filters to show me the whole catalog, so that "ver todo" is a real destination.
45. As a customer, I want a category page to use the same filtering tools as global search, so that I don't have to learn two interfaces.
46. As a customer on a category page, I want the category *not* to appear as a removable filter, so that I can't accidentally delete the page I'm on.
47. As a customer whose search finds nothing, I want a clear message and a spelling nudge, so that I know it was a miss rather than a broken page.
48. As a customer whose search finds nothing, I want my filter chips to stay visible and a "Limpiar filtros" button offered, so that I can see and undo the cause.
49. As a customer whose search finds nothing, I want a row of featured products offered anyway, so that I have somewhere to go instead of a dead end.

### Product detail

50. As a customer, I want a large photograph of the arrangement on its own page, so that I can judge something I'm buying with my eyes.
51. As a customer, I want the full description, so that I know what's actually included.
52. As a customer, I want the price shown clearly in USD, so that there's no ambiguity about currency.
53. As a customer, I want to see which category the product belongs to, so that I can jump to similar items.
54. As a customer, I want to add the product to my cart from its page, so that I can order it.
55. As a customer, I want to stay on the page after adding to the cart, so that I'm not yanked away mid-browse.
56. As a customer, I want the header cart badge to update immediately when I add something, so that I get confirmation it worked.
57. As a customer, I want every product to have its own shareable URL, so that I can send a specific arrangement to someone.

### Cart

58. As a customer, I want a cart page listing what I've chosen with quantities and line totals, so that I can check my order before paying.
59. As a customer, I want to change quantities in the cart, so that I can order two of something without re-adding it.
60. As a customer, I want to remove a line from the cart, so that I can undo a choice.
61. As a customer, I want the cart subtotal shown, so that I know the goods cost before delivery.
62. As a customer, I want my cart to survive closing the tab, so that I can come back later without rebuilding it.
63. As a customer, I want an empty cart to say so and offer a way back to the catalog, so that an empty page isn't a dead end.
64. As a customer, I want cart prices to always reflect current catalog prices, so that a stale saved cart can't quote me a price the shop no longer offers.

### Checkout — details

65. As a customer, I want checkout on a single page rather than a multi-step wizard, so that leaving to pay and coming back doesn't lose my progress.
66. As a customer, I want an order summary that stays visible as I scroll the form, so that I can see what I'm paying for while I fill it in.
67. As a customer, I want to enter my name, phone and email, so that the shop can reach me about my order.
68. As a customer, I want to choose delivery or store pickup, so that I can collect it myself if that's easier.
69. As a customer choosing pickup, I want the delivery fee removed, so that I'm not charged for a service I'm not using.
70. As a customer choosing delivery, I want to enter the address and an optional landmark and zone, so that the courier can actually find it.
71. As a customer, I want to mark the order as a gift for someone else, so that I can send flowers without receiving them.
72. As a customer sending a gift, I want to enter the recipient's name and phone, so that the courier can coordinate with them rather than me.
73. As a customer, I want to pick a delivery or pickup date, so that flowers arrive when they're needed.
74. As a customer, I want to be prevented from choosing a date in the past, so that I can't create an impossible order.
75. As a customer, I want to optionally choose a morning or afternoon window, so that I can align with when someone will be home.
76. As a customer, I want to write a card message, so that the recipient knows who it's from and why.
77. As a customer, I want to set who the gift is from, defaulting to my own name, so that I can send anonymously or on someone else's behalf.
78. As a customer, I want a free-text notes field, so that I can add a request the form didn't anticipate.
79. As a customer, I want to see which fields are required before I try to submit, so that I'm not guessing.

### Checkout — money & payment

80. As a customer, I want to see subtotal, delivery fee and total separately, so that I understand what I'm being charged for.
81. As a customer, I want the exact final total *before* I pay, so that I can transfer the right amount out-of-band.
82. As a customer, I want to choose from Pago Móvil, transferencia, Zelle, Binance/USDT or efectivo, so that I can pay on a rail I actually use.
83. As a customer, I want only the chosen method's account details revealed, so that I'm not reading five sets of numbers looking for mine.
84. As a customer, I want the correct fields for my chosen rail — teléfono, cédula/RIF and 4-digit bank code for Pago Móvil; 20-digit account for a transferencia; the network label for Binance — so that the payment doesn't fail on a missing detail.
85. As a customer, I want a copy button on every account detail, so that I don't mistype a 20-digit account number on a phone.
86. As a customer who has paid, I want to enter my `referencia`, so that the shop can match my payment to my order.
87. As a customer paying in efectivo, I want it treated as pay-on-delivery with no reference required, so that I'm not asked for a number that doesn't exist.
88. As a customer paying in efectivo, I want to say whether I need change and with what note I'll pay, so that the courier arrives with change.
89. As a customer, I want the submit button disabled until the form is valid and my reference is entered, so that I can't dispatch an incomplete order.
90. As a customer, I want to be reminded to send my payment screenshot in the chat, so that I know the reference alone may not be enough.
91. As a customer who arrives at checkout with an empty cart, I want to be sent to the cart page, so that I'm not filling in a form for nothing.

### Checkout — dispatch & confirmation

92. As a customer, I want one button that opens WhatsApp with my whole order already written, so that I don't have to re-type anything I just entered.
93. As a customer, I want the message to contain line items, quantities, unit prices, subtotal, delivery and total, so that the shop and I are working from the same numbers.
94. As a customer, I want the message to contain delivery type, date, window and address, so that nothing has to be asked again.
95. As a customer, I want recipient and card details in the message only when it's a gift, so that the message stays short and readable.
96. As a customer, I want my payment method and reference in the message, so that the shop can verify immediately.
97. As a customer, I want a short order code in the message, so that we can refer to "AZ-7K3Q" in the conversation instead of describing the order again.
98. As a customer, I want a confirmation page after dispatching, so that I know the process completed.
99. As a customer, I want the confirmation page to show my full order, so that I have a record of what I asked for.
100. As a customer, I want the WhatsApp button to remain on the confirmation page, so that I can retry if the first attempt failed.
101. As a customer without WhatsApp installed, I want the shop's raw phone number with a copy button, so that a missing app doesn't strand my order.
102. As a customer, I want my cart emptied once I reach confirmation, so that a reload doesn't make me order twice.
103. As a customer landing on the confirmation page with no order, I want to be sent home, so that I don't see an empty broken page.

### Shop owner

104. As the shop owner, I want incoming orders to arrive as one structured message, so that I don't have to interrogate the customer for missing details.
105. As the shop owner, I want the payment reference in the order message, so that I can confirm payment before preparing the flowers.
106. As the shop owner, I want to enable or disable each payment rail without a code change, so that I can drop a method I've stopped using.
107. As the shop owner, I want to set my account details as configuration, so that changing a bank doesn't need a developer.
108. As the shop owner, I want to set a flat delivery fee, so that I can adjust pricing as costs change.
109. As the shop owner, I want the site to load fast on a mediocre mobile connection, so that customers don't leave before seeing the flowers.
110. As the shop owner, I want the site to look like a boutique rather than a generic template, so that it reflects the quality of the work.
111. As the shop owner, I want to swap in my own photographs later by replacing image files, so that placeholders aren't permanent.

### Builder

112. As a builder, I want the catalog behind one data-access boundary, so that moving to a hosted API later doesn't touch a single page.
113. As a builder, I want the compiler to reject a catalog swap that doesn't satisfy the boundary, so that the swap is enforced rather than hoped for.
114. As a builder, I want the seed catalog type-checked at build time, so that a bad category slug or missing facet is a build error rather than a broken page.
115. As a builder, I want all user-facing Spanish copy in one place, so that wording changes don't mean hunting through components.
116. As a builder, I want search, cart and order logic as pure functions, so that I can test the tricky parts without rendering anything.
117. As a builder, I want the static output deployable to any host, so that we're not locked to one platform.

---

## Implementation Decisions

### 1. Rendering & stack

- **Fully static export.** Next.js configured for static export; **no runtime server**. Every page
  prerenders from the seed catalog at build time. Cart, search and checkout are entirely client-side.
- **App Router, RSC by default + client islands.** Home, category, product detail and about are
  static Server Components (near-zero JS). Only search results, cart and checkout are `'use client'`.
- Pin the **latest stable Next.js major** at scaffold time. TypeScript throughout, `strict: true`,
  `@/*` path alias.
- **Tailwind CSS + shadcn/ui** — primitives copied in (no runtime dependency), themed via CSS
  variables. shadcn supplies `Sheet` (mobile filters), `Select` (sort), `Pagination`, `Checkbox`,
  `RadioGroup`.
- **Spanish-only (es-VE), no i18n library.** All user-facing copy centralised in a single strings
  module.
- **USD only**, no VES reference and no FX rate (would break the static posture and go stale). One
  `formatPrice(cents)` helper renders every price.
- **npm**; Node 24 LTS pinned (`engines: "24.x"` — also the deploy target; see ticket 02). ESLint (flat config, `eslint-config-next`) + Prettier +
  `prettier-plugin-tailwindcss`.
- **Deploy host-agnostic**; Vercel is the zero-config reference but nothing depends on it.
- Flat repo layout (no `src/`): `app/`, `components/` (with `components/ui/` for shadcn),
  `lib/`, `data/`, `public/`.

### 2. Domain model

Three terms, used consistently in code, copy and tests:

- **Product** — one sellable item: one SKU, one size, one price. **No variants.** A cart line is
  product + quantity.
- **Category** — the *presentation/format* of a product (ramo, arreglo, caja…). **Exactly one per
  product.** Mutually exclusive; drives navigation and breadcrumbs.
- **Facet** — a cross-cutting filterable attribute. Four: **occasion**, **flower type**, **colour**
  (all multi-value) and **size** (single-value). **Price range is derived** from price, never stored.

The critical modelling call: *occasion is many-per-product, so it is a facet and never the primary
axis*; category is the single-valued format axis. Price is stored as **integer USD minor units
(cents)** to avoid float arithmetic errors.

Type shape (from ticket 01 — inlined because it fixes cardinality more precisely than prose):

```ts
type Category = {
  slug: string          // "ramos", "arreglos", …
  name: string
  description?: string
  heroImage?: string
}

type Product = {
  id: string
  slug: string
  name: string
  tagline?: string        // short line for cards
  description: string     // full copy for the detail page
  priceUsdCents: number   // single price, USD minor units
  images: string[]        // >= 1; images[0] is primary
  categorySlug: string    // exactly ONE primary category
  occasions: string[]     // facet, multi
  flowerTypes: string[]   // facet, multi
  colours: string[]       // facet, multi
  size: string            // facet, single: 'pequeno' | 'mediano' | 'grande'
  featured?: boolean
}
```

### 3. Data source & the catalog seam

- **Seed = typed TS modules in `data/`** (products and categories), typed against the shapes above
  so a bad `categorySlug` or missing facet is a **compile error**. Chosen over JSON (needs separate
  validation), MDX (no long-form need) and SQLite (a runtime source that fights the swap seam).
- **`CatalogSource` is the single data-access seam**, living in `lib/catalog` as a **TypeScript
  interface** plus a static implementation and an index module that re-exports the *active* source.
  **UI imports only from the seam module** and never learns which source is active.
- **All seam methods are async from day one.** The static implementation resolves immediately; RSC
  pages `await` at build time, producing identical static HTML at zero runtime cost. Rationale: the
  future API is inherently async, so an async contract makes the swap a pure behind-the-signature
  change and no call site moves. A sync seam would force every call site to change at exactly the
  moment the seam exists to protect.
- **Six dedicated methods**, mirroring the endpoints a future API would expose (chosen over
  minimal-plus-filter-in-page for swap fidelity and a dumb UI):

```ts
interface CatalogSource {
  listProducts():               Promise<Product[]>       // powers the search-page embed
  getProductBySlug(slug):       Promise<Product | null>  // product detail
  listFeaturedProducts():       Promise<Product[]>       // home highlights
  listCategories():             Promise<Category[]>      // nav + home
  getCategoryBySlug(slug):      Promise<Category | null> // category header/breadcrumb
  listProductsByCategory(slug): Promise<Product[]>       // category grid
}
```

- `getBySlug` returns **`null` on miss** → the page calls Next's `notFound()`.
- **`search` is deliberately NOT a seam method.** Under static export a build-time `search()` cannot
  see runtime user filters. Search is a client-side concern: a pure function over the embedded
  catalog. A server-side `search()` is an API-era addition.
- **Future swap** = add an API implementation of the interface, flip one export. TypeScript refuses
  to compile a non-conforming implementation, so "swap without touching UI" is *enforced*.

**Search data delivery.** The search page is an async RSC that awaits `listProducts()` at build time
and passes the **full product array to the client island as props**, shipped inside the prerendered
HTML. The client never imports the data modules or the seam directly (that would leak the seam), and
never runtime-fetches a JSON index (a needless round-trip and loading state at 50 items). No trimmed
projection type — premature at this scale.

### 4. Catalog content

Full concrete content lives in **[`seed/products.md`](./seed/products.md)** — the builder transcribes
it into the typed `data/` modules. Summarised:

- **10 categories** (format axis only): `ramos` · `arreglos` · `cajas` · `canastas` · `floreros` ·
  `plantas` · `coronas` · `centros-de-mesa` · `rosas-preservadas` · `detalles`.
- **Facet vocabularies** — occasion ×8 (`amor`, `cumpleanos`, `aniversario`, `bodas`,
  `condolencias`, `dia-de-la-madre`, `graduacion`, `nuevo-bebe`); flower type ×8 (`rosas`,
  `girasoles`, `orquideas`, `lirios`, `tulipanes`, `gerberas`, `claveles`, `mixtas`); colour ×8
  (`rojo`, `rosado`, `blanco`, `amarillo`, `naranja`, `morado`, `azul`, `multicolor`); size ×3
  (`pequeno`, `mediano`, `grande`). All slugs ASCII and URL-safe; display labels are accented Spanish.
- **50 products**, every field concrete. Category spread **8/7/6/5/5/5/4/4/3/3**; price-bucket
  coverage **9/19/15/7**; **7 featured**, flagship = `ramo-deluxe-24-rosas` listed first.
- **Every facet value has ≥3 products** so no filter dead-ends. Foliage plants carry empty
  `flowerTypes`/`colours` **by design** — an intentional case, not missing data.
- **Images: curated Unsplash pool** — 19 product files + 10 category heroes, downloaded to local
  files under `public/images/`. Unsplash License permits free commercial use without attribution.
  No runtime hotlinking (incompatible with static export).

> **Resolved conflict (ticket 04 vs ticket 06).** Ticket 04 specified WebP files named
> `<product-slug>-<n>`; ticket 06's manifest specifies a **19-file pool of `.jpg` images named by
> subject and reused across the 50 products**. These are mutually exclusive — reuse and
> per-product-slug naming cannot both hold. **Ticket 06's manifest wins** (it is the later decision
> and explicitly owns the manifest). What survives from ticket 04 is the principle that matters:
> the data stores a **complete reference string** the UI never stitches together, so today's local
> path becomes an absolute CDN URL under the API with no UI change.

Images render through `next/image` with `unoptimized` (static export means no server resizing),
keeping layout stability and lazy-loading.

### 5. Information architecture

**Keystone decision — one results surface, two entry points.** Category pages **reuse the same
advanced-results component** as global search, scoped to a single category. (Rejected: category as
merely a search filter — loses clean URLs, hero and copy; separate simple grids — two surfaces to
maintain, and search is meant to be first-class everywhere.)

**Language convention:** user-facing **URL paths are Spanish**; **all code symbols are English**.
Search query-param keys are the one boundary, and are English + abbreviated.

| Route | Purpose | Data |
|---|---|---|
| `/` | Home — hero, featured, categories, occasion strip | `listFeaturedProducts`, `listCategories` |
| `/categorias` | Index of all 10 categories | `listCategories` |
| `/categoria/[slug]` | Category hero + results island scoped to category | `getCategoryBySlug`, `listProductsByCategory` |
| `/buscar` | Global advanced search | `listProducts` |
| `/producto/[slug]` | Product detail | `getProductBySlug` → `notFound()` |
| `/carrito` | Cart | client state |
| `/finalizar-compra` | Checkout | client state |
| `/pedido-enviado` | Post-dispatch confirmation | client state |
| `/nosotros` | About | — |
| *not-found* | Spanish 404 | — |

No contact page — contact folds into the footer.

- **Header (sticky, all pages):** wordmark → home; **persistent prominent search bar** submitting to
  global search (collapses to an expandable icon on mobile); a plain **"Categorías" link** (no
  dropdown); **cart icon with live item-count badge**.
- **Footer (all pages):** contact block (WhatsApp CTA, phone, hours, location), accepted payment
  methods as trust signals, category links, about link, copyright.
- **Home composition, top→bottom:** hero (flagship = **first item from `listFeaturedProducts()`** —
  curated by ordering, so no schema change and no sales data needed) with a hero search bar →
  featured row → categories grid (carries weight since nav has no dropdown) → "comprar por ocasión"
  strip linking into occasion-filtered search.
- **Breadcrumbs:** category → `Inicio / Categorías / {category}`; product → `Inicio / {category} /
  {product}`; search → at most `Inicio / Buscar`; none on home, cart or checkout.
- **Product detail** carries a "más de esta categoría" row (same category, current excluded, cap ~4).
- **Primary journey:** browse or search → product → add to cart (stay on page, badge updates) →
  cart → checkout → confirmation.

### 6. URL state scheme

**The URL query string is the single source of truth** for search state — shareable and
back-button-safe. The results island reads from and writes to it. **Only active params are
serialised**; empty facets and default sort are omitted, keeping clean base URLs.

| Key | Field | Cardinality |
|---|---|---|
| `q` | free-text query | single |
| `cat` | category | single — **global search only** (category pages fix it via the path) |
| `occ` | occasions | **multi** (repeated key) |
| `ft` | flowerTypes | **multi** (repeated key) |
| `col` | colours | **multi** (repeated key) |
| `sz` | size | single |
| `pr` | price-range token | single |
| `sort` | sort order | single |
| `page` | page number | single — **omitted when 1** |

- **Multi-value encoding: repeated keys** (`?col=rojo&col=blanco`) — native to Next `searchParams`,
  no custom parsing.
- **Sort tokens:** `featured` (default, omitted), `price-asc`, `price-desc`, `name`.
- **Price tokens** (language-neutral): `0-25`, `25-50`, `50-100`, `100+`. **Boundaries in cents:**
  `0-25` = `< 2500`; `25-50` = `2500–4999`; `50-100` = `5000–9999`; `100+` = `>= 10000`.
- A small English→English key→field map lives **inside the search module** — deliberately terse
  rather than 1:1 field names.

### 7. Advanced search & filtering

**Composition semantics.** Within a multi-value facet → **OR** (widening). Across different facets →
**AND** (narrowing). Free-text → **AND** with facets, never resetting them. Price and size are
**single-select** and AND. Sort is orthogonal — it reorders the surviving set and never filters. Net
rule: *everything narrows except multiple values inside one facet.*

**Text search — zero-dependency accent- and case-insensitive token match.** No Fuse.js or
MiniSearch: 50 embedded items, no relevance-ranked mode (results are always in the explicit sort
order), lean posture. Per product, build a normalised blob from name + tagline + description +
category display name + all facet display labels. Normalise blob and query by lowercasing and
stripping diacritics. Split the query on whitespace; **every token must appear as a substring**
(AND across tokens). **No fuzzy/typo tolerance in v1.** Kept as a pure function so a real search
library could later drop in with zero call-site churn.

**Trigger & history hygiene.** The in-page query box **live-filters, debounced ~250 ms**; the header
search bar navigates on Enter. Facets, price and sort apply **immediately** — no "Aplicar" button.
**All in-page state changes use `replace`** (single history entry) so Back exits search rather than
stepping through tweaks; undoing a filter is the chips and clear-all, not Back. **Sole exception:
page changes use `push`**, so Back steps through result pages. Reload and share always restore exact
state.

**Layout.** Desktop (≥ `lg`): persistent **sticky left sidebar ~256 px** below the header, results
grid filling the rest, all groups expanded (max 8 values each, no "ver más"). Mobile/tablet: sidebar
collapses to a **"Filtros" button with an active-count badge** ("Filtros · 3") opening a `Sheet` with
identical groups as a **collapsed-by-default accordion**; filters apply live; a sticky footer
**"Ver N resultados"** dismisses it.

**Controls**, sidebar order top→bottom:

| Group | Control | Notes |
|---|---|---|
| Categoría | radio (single) | **Global search only.** 10 values + "Todas las categorías". **Omitted on category pages.** |
| Precio | radio (single) | 4 buckets + "Cualquier precio" |
| Ocasión | checkboxes (multi) | 8 values |
| Tipo de flor | checkboxes (multi) | 8 values |
| Color | checkboxes (multi) | 8 values, each with a swatch; `blanco` gets a ring, `multicolor` a gradient |
| Tamaño | radio (single) | 3 values + "Cualquier tamaño" |

Single-select facets clear via an explicit **"Cualquiera/Todas" radio row**, not click-to-deselect.
Category is the only facet that differs between the two entry points.

**Facet counts — dynamic, disable-zero.** Show a count beside every value, recomputed on every
change. A zero-count value is **greyed out and disabled**, so facets can never dead-end. Standard
faceted semantics, and the subtle part: **a value's count = all active filters *except its own
facet*, intersected with that value** — so checking "rojo" does not zero out its OR-sibling
"blanco". Counts and the results header are over the **full filtered set**, independent of the
current page.

**Chips & clear-all.** A row directly above the grid, on desktop and mobile and *outside* the mobile
sheet: **one removable chip per active constraint** — the query, each selected occasion/flower/colour
value individually, size, price, and (global only) category. Labels use the human Spanish display
name. **"Limpiar todo"** clears everything to a clean base URL. The row hides when nothing is active.
**On a category page the fixed category is not a chip** (it lives in the header/breadcrumb), and
clear-all keeps you on the category.

**Sort.** A `Select` at the **top-right** of the results area (count top-left, sort top-right),
**outside** the mobile sheet so it pairs with the "Filtros" button on the same bar. Options map 1:1
to the sort tokens; **"Destacados"** = the catalog's curated order (featured first, then seed order).

**Results grid & pagination.** Responsive card grid (~2→3→4 columns). Results header top-left:
global search → "N resultados", echoing an active query as "24 resultados para «rosas»"; category
page → category name + "N productos". **No loading or skeleton state** — filtering is synchronous
in memory. Classic **numbered pagination at 12 per page** (a clean 2/3/4-column multiple, ~5 pages
over the 50-item seed so paging is actually exercised; chosen over show-all because this build
doubles as a reusable storefront template). **Reset to page 1** on any query/facet/price/sort
change; **clamp** an out-of-range page to the last valid page; **scroll to top of results** on page
change.

**Empty & zero-result states.** **No filters = the full set** — no special initial screen; global
search with no params is the entire catalog paginated (doubling as the "ver todo" target), and a
category page with no filters is all its products. **Zero results** (mainly a free-text miss, since
disable-zero prevents facet dead-ends): the message *"No encontramos productos que coincidan con tu
búsqueda."* plus the nudge *"Revisa la ortografía o ajusta los filtros."* (there is no fuzzy match),
**chips stay visible** so the cause is legible, a prominent **"Limpiar filtros"**, and a **"Quizás te
interese" featured fallback row**. The sidebar stays in place.

### 8. Cart

- **React context client island backed by `localStorage`**; survives refresh and drives the header
  badge.
- **A cart line stores only `{ slug, qty }`.** Name and price are resolved from the catalog at
  render, so a saved cart can never quote a stale price.
- A persisted slug that no longer exists in the catalog must be **dropped gracefully**, not crash the
  badge or checkout.

### 9. Checkout & order dispatch

**Shape: pay-first, WhatsApp-dispatched, no server-side order record.** The app collects everything,
shows the exact total and payment instructions; the customer pays out-of-band, enters the
`referencia`, and one deep-link carries the whole order to the shop. Entirely client-side.

**Dispatch — WhatsApp deep-link only.** A single `wa.me` link carries the serialised order: number
is country-code + digits (no `+`, no leading zero, no dashes), the whole message encoded **once**,
newlines as `%0A`, total URL kept **under ~2000 chars**. **Text only** — a deep-link cannot
pre-attach the payment screenshot, so the comprobante is sent manually in the chat and the message
says so. No email, no `mailto:`, no third-party form service (each reintroduces a backend or
duplicates the path unreliably). The user must press Send — there is no auto-send. **Fallback:** the
confirmation page shows the shop's raw number with a copy button beside the WhatsApp button, so a
missing or blocked WhatsApp never strands an order.

**Payment timing.** Show exact total → pick method → show account details → customer pays
out-of-band → enter `referencia` → dispatch. Chosen deliberately to mirror how a future API checkout
will work, so the UX won't be redesigned later. **Note:** payment *verification* and order
*persistence* stay out of scope; pay-first is purely the UX shape, and what future-proofs the build
is the catalog seam, not the flow ordering. Here the reference is captured and forwarded, not
verified.

**Money.** A **flat, configurable delivery fee** (may be zero) added to the subtotal;
`total = subtotal + envío`. **Pickup zeroes the fee.** No zone-based pricing — the zona field is
courier information only. The customer must see an exact number before paying, which is precisely
why the fee is flat.

**Fields collected:**

- **Comprador (always)** — nombre completo **required**, teléfono/WhatsApp **required**, email
  **required**.
- **Entrega (always)** — método **required**: *envío a domicilio* (flat fee, reveals address block)
  or *retiro en tienda* (fee = 0, no address); plus a **"es un regalo"** checkbox revealing the
  recipient block.
- **Destinatario (only if gift)** — nombre **required**; teléfono **required if delivery**, otherwise
  optional.
- **Dirección (only if delivery)** — dirección **required**; punto de referencia optional; zona
  optional (courier info, not pricing).
- **Programación (always)** — fecha **required** (date picker, min = today); franja horaria optional
  (mañana / tarde / free text).
- **Extras (always, optional)** — mensaje de tarjeta (~200-char cap), de parte de (defaults to buyer
  name), notas adicionales.

**Payment rails — all five, config-driven** so the shop can toggle each without a code change:
**Pago Móvil, Transferencia, Zelle, Binance/USDT, Efectivo.** Each renders the exact fields that rail
requires (Pago Móvil = teléfono + cédula/RIF + 4-digit bank code, no account number; transferencia =
20-digit account + titular + cédula/RIF + bank; Zelle = registered email or US phone + titular;
Binance = Pay ID and/or wallet **with the network label**; efectivo = in person). **Single-select
radio** reveals only the chosen rail's block **with copy buttons**, then a **required "número de
referencia"** field appears. Method and reference ride in the message, alongside a reminder to attach
the comprobante.

**Efectivo exception** — treated as *pago contra entrega*: **no `referencia`**. Adds a "¿Necesitas
vuelto?" toggle which, when yes, reveals a "¿Con cuánto vas a pagar?" amount field so the shop brings
change. This rides in the message.

**Page layout.** One page, sections top-to-bottom (Comprador → Entrega → Pago + referencia) with a
**sticky order-summary card** (subtotal + envío + total). The final **"Enviar pedido por WhatsApp"**
button is **disabled** until required fields are valid and, for non-efectivo, a reference is present.
A single page rather than a wizard is deliberately robust to the *leave-to-pay-and-return* moment —
there is no step state to lose.

**Handoff to confirmation.** On submit: validate → build the order and the deep-link → stash the
order in **`sessionStorage`** → route to the confirmation page. That page shows the full order
summary, the **order code**, a prominent WhatsApp button, the **raw-number/copy fallback**, and the
comprobante reminder. **The cart is cleared on arrival**, so confirmation is always seen and the link
stays re-openable if the first attempt failed.

**Order code** — client-generated **`AZ-XXXX`** (4 base-36 chars), shown on confirmation and embedded
in the message. It is a friendly chat reference only; **nothing persists server-side.** The
randomness source must be **injectable** so the code is testable.

**Guards.** Checkout with an empty cart → redirect to the cart page. Confirmation with no stashed
order → redirect home. Validation is client-side; date min = today; phone and email are **soft-format
hints, not strict** validation.

**Message template** (inlined — the conditional-section structure is the decision):

```
Hola Azahar 🌸 Quiero confirmar mi pedido *AZ-7K3Q*

*Productos*
• 2x Ramo Primavera — $25 c/u
• 1x Girasoles Radiantes — $18
Subtotal: $68
Envío: $5
*Total: $73*

*Entrega*
Tipo: Envío a domicilio
Fecha: 2026-07-25 (Tarde)
Dirección: Av. Principal, Edif. Sol, Apto 4B
Punto de referencia: frente a la panadería
Zona: Chacao

*Destinatario (regalo)*      ← only if gift
Nombre: María Pérez
Teléfono: 0412-1234567
Tarjeta: "Feliz cumpleaños ❤️"
De parte de: Juan

*Comprador*
Nombre: Juan Álvarez
Teléfono: 0414-9876543
Email: juan@example.com

*Pago*
Método: Pago Móvil
Referencia: 123456789
(Te envío el comprobante en este chat 📎)

*Notas*                       ← only if filled
Entregar antes del mediodía si es posible
```

Efectivo variant of the Pago block:

```
*Pago*
Método: Efectivo (pago contra entrega)
Vuelto: Pago con $50          ← only if "necesito vuelto" checked
```

Sections appear **only when relevant** (recipient only if gift, address only if delivery, card and
notes only if filled) to stay compact and under the URL ceiling. WhatsApp `*bold*` markers are used
throughout.

### 10. Visual design direction — "Jardín" (editorial boutique)

Locked from a 3-variant [prototype](./prototypes/08-visual-direction.html) (Direction B, adopted as
shown — no mix-and-match). Deliberately **not** the terracotta-cream florist default.

- **Layout** — asymmetric hero: headline/CTA column left, full-bleed image panel right (stacks on
  mobile). Generous whitespace. Section heads centred with an uppercase eyebrow above a serif H2.
  Categories as a **bordered cell-grid** (10 cells, hairline gaps). The occasion strip is a pill
  strip on a **solid emerald band**.
- **Product card** — tall **portrait** image tile, **edge-to-edge, no border**, subtle hover
  `scale(1.05)` on the image. Meta centred below: uppercase category eyebrow · serif product name ·
  price in emerald. **No quick-add on the card** — the whole card links through to the product page.
  (A dense quick-add card was prototyped and rejected.)
- **Palette tokens** (build-ready Tailwind/shadcn theme input):

  | Token | Value | Use |
  |---|---|---|
  | ground | `#faf8f3` | warm off-white page background |
  | panel | `#f2eee5` | raised surfaces |
  | ink | `#21201d` | body text |
  | muted | `#6d6a63` | secondary text, counts |
  | hairline | `#e7e2d8` | borders, grid lines |
  | **primary — emerald** | `#1f4d3a` | CTAs, prices, active pagination |
  | **secondary — plum** | `#5f2a52` | eyebrows, "Limpiar todo" |
  | tertiary — gold | `#b08542` | accents |

- **Imagery** — portrait aspect, edge-to-edge, photography-forward and large; soft radial floral
  grounds behind hero and product detail; hover-zoom.
- **Typography** — **serif display** for logo, headings and product names (stack: `ui-serif, "Iowan
  Old Style", "Palatino Linotype", Georgia, "Times New Roman", serif`); **sans** for body, UI and
  prices (`ui-sans-serif, system-ui`). Eyebrow labels uppercase with wide letter-spacing (~`.28em`).
  A final webfont pairing is a build-time detail on top of this feel.
- **Search results within this direction** — discreet facet sidebar with **serif group headings**;
  **circular** colour swatches; radio/checkbox lists each with a "Cualquiera" clear-row,
  right-aligned counts and visibly disabled zero rows; serif results heading with a muted count;
  rounded **pill** active-chips with a plum "Limpiar todo"; **underlined, borderless** select for
  sort; **circular** numbered pagination with an emerald active state. This sets visual treatment
  only — all search behaviour stays exactly as specified in §7.

### 11. Configuration the builder must supply

Content/config placeholders, not code:

- Shop **WhatsApp number** (country code + digits).
- **Flat delivery fee** (cents).
- **Per-rail enable flag + account values** for each of the five payment rails.
- Shop contact details for the footer (phone, hours, location).

---

## Testing Decisions

**Test runner: Vitest** (fast, zero-config with TS and the path alias) **+ React Testing Library**
for the two wiring tests. No ticket had decided this; it is settled here.

**What makes a good test here.** Tests assert **external behaviour through a module's public
interface** — given this catalog and these criteria, these products in this order with these counts.
They never reach into internals, never assert on how filtering is implemented, and never snapshot
markup. Fixtures are **small and hand-built** (a dozen products chosen to exercise the rule under
test), not the 50-item seed — the seed is production content, and using it as a fixture makes tests
both slow and illegible. The seed gets its *own* small set of invariant tests instead.

**Three pure seams carry the logic tests.** Each swallows a lot of behaviour behind one door, and
none needs React or a DOM:

**1. The search module** — the single door for everything about results:

```ts
search(products, criteria) → { results, total, facetCounts, pageCount }
parseCriteria(searchParams) → criteria
toSearchParams(criteria)    → URLSearchParams
```

URL parse/serialise lives **inside this module**, not beside it — the key→field map is already its
responsibility, and co-locating makes round-trip testing free. Table-driven coverage of:

- **Composition semantics** — within-facet OR, across-facet AND, `q` AND-ing with facets, single-vs
  multi-select facets, and the invariant that **sort never changes the result set**.
- **Text matching** — accent- and case-insensitivity (`cumpleanos` matches `Cumpleaños`),
  multi-token AND, matching against description and facet *labels* as well as names, and the
  explicit absence of fuzzy matching.
- **Facet counts** — the subtle rule: a value's count excludes its own facet's active filters, so
  selecting one colour must **not** zero out its OR-siblings. This is the highest-value test in the
  suite and the easiest thing to get wrong.
- **Disable-zero** — a value with count 0 is reported as disabled.
- **Price buckets at their boundaries** — `2499`/`2500`/`4999`/`5000`/`9999`/`10000` cents landing in
  the correct bucket. Off-by-one here silently misfiles products.
- **Pagination** — 12 per page, page count, out-of-range clamping to the last valid page, and page 1
  omitted from serialised params.
- **URL round-trip** — criteria → params → criteria is identity; only active params are serialised;
  default sort and page 1 are omitted; multi-value facets serialise as repeated keys.

**2. The cart module** — line operations over `{ slug, qty }` plus the persistence adapter. Covers
add (including add-existing incrementing rather than duplicating), quantity change, removal, subtotal
from **catalog** prices rather than stored ones, and the resilience cases the adapter owns: corrupt
or absent stored JSON, and a **persisted slug no longer in the catalog being dropped gracefully**.

**3. The order module** — all of checkout behind one door:

```ts
validate(form)                          → errors
buildOrder(cart, catalog, form, config) → Order
orderToWhatsAppUrl(order, config)       → string
```

Covers the **conditional-required web**, which is the densest logic in the app — gift implies
recipient name; gift + delivery implies recipient phone; delivery implies address; non-efectivo
implies reference; efectivo implies *no* reference but an optional change amount. Plus: money math
(`subtotal + envío`, pickup zeroing the fee), **message assembly** (sections present only when
relevant, efectivo variant of the payment block), **encoded exactly once** (no double-encoding),
newlines as `%0A`, and a **URL-length assertion against a deliberately large cart** to prove the
~2000-char ceiling holds. Order-code generation is tested through an **injected randomness source**.

**Two deliberately thin wiring tests** prove the islands are connected, and **do not re-test the
logic above**:

- **Results island** — a filter change updates the URL and uses `replace`; a **page change uses
  `push`**; changing a filter resets to page 1; removing a chip removes exactly that constraint;
  mounting from a URL with params reproduces that state. This is the "does Back behave" class of bug
  that pure tests structurally cannot see.
- **Checkout island** — conditional blocks appear and disappear with the gift and delivery toggles;
  the submit button stays **disabled** until the form is valid and a reference is present, and
  becomes enabled when it is.

**Seed invariants** get a small data test asserting what the seed content promises, so a transcription
slip fails the build rather than producing quiet dead ends: 50 products with unique ASCII slugs; the
8/7/6/5/5/5/4/4/3/3 category spread; price-bucket coverage 9/19/15/7; exactly 7 featured with the
flagship first; **every facet value having ≥3 products**; every product carrying exactly one valid
`categorySlug` and at least one image; and integer prices.

**Explicitly not tested.** The catalog seam's static implementation — it returns array literals, and
the interface is already enforced by the compiler, which is the guarantee that matters. Visual
appearance and palette tokens (a human judgement, and the prototype is the reference). Server
Component page rendering, which under static export is exercised by the build itself.

**Prior art:** none — this is a greenfield repo with no existing tests, so these become the prior art
for everything after. There are no existing seams to prefer and no ADRs to respect yet.

---

## Out of Scope

- **The reusable "Shopify-lite" hosted backend**, managed admin, and API-token issue/consume — a
  separate, future effort. This build only *prepares* for it, via the catalog seam.
- **Catalog-management admin** (any product-upload UI) — deferred to that backend. The catalog is
  changed by editing seed data and rebuilding.
- **Order tracking** and any order lifecycle — nothing about an order persists server-side.
- **Inventory / stock** counts and decrementing. Every product is always orderable.
- **Integrated online payment gateway.** All payment is out-of-band on manual rails.
- **Payment verification.** The `referencia` is captured and forwarded, never checked.
- **User accounts, login, order history, wishlists.**
- **Product variants or per-size pricing** — one SKU, one price; size is a filter facet only.
- **Multi-currency and VES display.** USD only, no FX rate.
- **Multi-language.** Spanish-only, no i18n layer.
- **Fuzzy / typo-tolerant search** and relevance ranking — exact accent-insensitive token match only.
- **Sub-categories.** The category axis is flat.
- **Email dispatch, `mailto:`, or third-party form services.**
- **Attaching the payment screenshot automatically** — a deep-link cannot; it is sent manually in the
  chat.
- **Analytics, SEO beyond Next defaults, sitemap generation.**
- **Real client photography** — the curated Unsplash pool stands in, swappable by replacing files.

---

## Further Notes

**Why static.** The no-runtime-server posture is the load-bearing constraint behind several
decisions that look independent but aren't: it is why search is client-side (a build-time `search()`
cannot see user filters), why images are `unoptimized` (no server to resize them), why the catalog is
embedded in the search page's HTML, why there is no order record, and why hosting is
host-agnostic and nearly free.

**Two seams doing different jobs.** The **catalog seam** is an *architecture* seam — its job is to
make a future API swap invisible to the UI, and the compiler enforces it. The **search, cart and
order modules** are *test* seams — their job is to make the tricky logic assertable without a
browser. Don't conflate them: the catalog seam gets no tests of its own, and the pure modules are
not swap points.

**The single subtle algorithm.** Facet counting is the one place where an intuitive implementation is
wrong. A value's count must be computed with **all active filters except its own facet** applied,
then intersected with that value. The naive version — apply every active filter, then count — makes
selecting one colour show `(0)` on every other colour, which visibly breaks the OR semantics that
multi-select facets promise. Get this right first.

**Where the truth lives.** The 50 products, 10 categories, facet vocabularies and image manifest are
**not duplicated in this spec** — [`seed/products.md`](./seed/products.md) is the source of truth, and
the builder transcribes from it. This spec fixes the shapes, rules and behaviour; that asset fixes
the content.

**A resolved contradiction.** Ticket 04 and ticket 06 disagreed about image naming (per-product
WebP files vs a reused subject-named JPEG pool). §4 resolves it in favour of ticket 06's manifest.
Flagged here because the tickets themselves still contain the older statement — the spec is
authoritative.

**Deliberately deferred v1 simplifications**, each a known and accepted trade-off: no fuzzy search;
no loading states anywhere (filtering is synchronous); soft rather than strict phone/email
validation; a flat rather than zone-based delivery fee; and a client-generated order code that is a
chat label rather than an identifier.

**Suggested build order** for ticket-splitting: scaffold and theme tokens → seed data and the
catalog seam → static pages (home, categories, category, product, about, 404) → the search module and
results island → cart → checkout → dispatch and confirmation. Search before cart because it is the
largest and highest-risk single piece; the two share nothing.

## Comments

_(none yet)_
