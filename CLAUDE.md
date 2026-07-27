# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # next dev
npm run build        # static export -> out/
npm test             # vitest run
npm run test:watch   # vitest
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (flat config)
npm run format       # prettier --write .
```

Run a single test file or a single case:

```bash
npx vitest run lib/search.test.ts
npx vitest run -t "accent-insensitive"
```

Node 26 is pinned (`.nvmrc`, `engines`). Package manager is npm.

## What this is

Azahar is a **read-only flower-shop storefront** for the Venezuelan market — ~50 seeded products
across 10 categories, Spanish-language UI, USD prices. It has no admin, no stock, no order tracking
and no payment gateway: checkout collects details, shows manual payment instructions (Pago Móvil /
Zelle / cash), and dispatches the order off-app via a WhatsApp deep link.

## Architecture

### Fully static export

`next.config.ts` sets `output: "export"` — there is **no runtime server**. Every page prerenders from
the seed catalog at build time; cart, search and checkout are entirely client-side. Two consequences
that shape everything:

- Dynamic routes need `generateStaticParams`. See `app/producto/[slug]/page.tsx`.
- `next/image` runs `unoptimized` (no server to resize). It is kept for layout stability and lazy
  loading only.

Pages are Server Components by default; only interactive surfaces are `'use client'` islands.

### The catalog seam — the most important boundary

`lib/catalog/` is the single door between the storefront and its data:

```
lib/catalog/types.ts          domain model + const-tuple vocabularies
lib/catalog/source.ts         the CatalogSource interface (6 async methods)
lib/catalog/static-source.ts  today's implementation, reading data/
lib/catalog/index.ts          `export const catalog: CatalogSource = staticSource`
```

**UI code imports only from `@/lib/catalog`** — never `data/products.ts`, never `static-source.ts`
directly. Moving to a hosted API means adding an `api-source.ts` and changing one line in `index.ts`;
TypeScript refuses to compile an implementation that doesn't satisfy the contract, so the swap is
enforced rather than hoped for.

Every method is `async` even though the static implementation resolves immediately — a hosted API is
inherently async, and a sync contract would force every call site to change at exactly the moment the
seam exists to protect. Getters return `null` for a missing slug; pages turn that into `notFound()`.

There is deliberately **no `search` method on the seam**: under static export, build-time search
cannot see a visitor's filters. Search is a pure client-side function over a catalog the page embeds
as props.

### Search — pure, and the URL is the state

`lib/search.ts` is a pure module (no React, no DOM, no dependencies) exposing three functions:

```ts
search(products, criteria) → { results, total, facetCounts, pageCount }
parseCriteria(searchParams) → Criteria
toSearchParams(criteria)    → URLSearchParams
```

URL parse/serialise lives **inside** this module because the key→field map is already its
responsibility. The query string is the single source of truth for search state — shareable and
back-button-safe. Only active params are serialised; default sort and page 1 are omitted.

Abbreviated English keys: `q`, `cat`, `occ`\*, `ft`\*, `col`\*, `sz`, `pr`, `sort`, `page`
(`*` = repeated key for multi-value). Composition is **within-facet OR, across-facet AND**. Price
buckets in cents: `0-25` = `<2500`, `25-50` = `2500–4999`, `50-100` = `5000–9999`, `100+` = `>=10000`.

The subtle rule worth knowing before touching it: a facet value's **count excludes its own facet's
active filters**, so selecting one colour must not zero out its OR-siblings.

### The results surface — one island, two entry points

`/buscar` and `/categoria/[slug]` mount the same `ResultsSurface`, differing only in the catalog they
hand over and the `ResultsScope` they declare. Everything a category page does differently lives in
that one type: the Categoría group is omitted, its fixed category is not a removable chip, and the
heading names the category instead of counting results.

`lib/facets.ts` is the view model between the search module and the controls. It turns criteria and
counts into the six sidebar groups and the chip row, **each control carrying the criteria it produces
when clicked** — so no component branches per facet, and radio-versus-checkbox is a property rather
than a special case.

URL writes use `replace`, with one deliberate exception: **a page change uses `push`**, so Back walks
back through pages of results. A filter change resets to page 1; the query box is debounced ~250ms.

### The cart — a line holds no price

`lib/cart.ts` is pure; `components/cart-provider.tsx` is the React half, holding one cart for the
whole app because the badge lives in the header while the button that fills it lives on a product
page.

**A cart line stores only `{ slug, qty }`.** Names, images and prices are resolved from the catalog at
render through `resolveCart(cart, products)`, which is what makes a stale price structurally
impossible rather than something to remember to invalidate. Two rules are enforced at the doors rather
than at call sites: a slug appears at most once (adding again increments), and a slug the catalog no
longer has is dropped on read and the pruned cart written straight back.

`localStorage` (key `azahar.cart`) is read through `useSyncExternalStore`, so the prerendered markup
gets an always-empty server snapshot and the store is touched after commit instead of during render.
Everything in it is untrusted input — corrupt JSON, an unreadable store, a hand-edited quantity all
degrade to a working cart. Surfaces wait on `loaded` before painting, so nobody with a full cart sees
"empty" for a frame.

### Checkout — the order seam

`lib/order.ts` is the third pure module. Everything a customer types is one flat, all-strings
`CheckoutForm`, and the questions worth asking about it live here:

```ts
requiredFields(form)                     → ReadonlySet<CheckoutField>
validate(form, today)                    → CheckoutErrors
quoteOrder(cart, products, form, config) → OrderQuote
```

The **conditional-required web** is a function of the form rather than a validation pass: three
answers (delivery-vs-pickup, is-it-a-gift, which payment rail) decide between them which fields the
shop needs, so the asterisks, the `aria-required` attributes and the errors all read one answer and
cannot drift. Gift ⇒ recipient name; gift + delivery ⇒ recipient phone (the courier is the reason it
is asked for, and a pickup has no courier); delivery ⇒ address; any rail but efectivo ⇒ reference.
Validation is deliberately **soft on format** — phone and email are
checked for being _there_ and nothing else, because a regex that rejects a reachable customer costs
the shop an order.

`today` arrives as a `yyyy-mm-dd` argument rather than from a clock, so the past-date rule is a string
comparison no timezone can move. The island reads the visitor's own clock for it — never build time,
which would floor the date picker on the day the site was deployed.

**Money:** `total = subtotal + envío`, from a flat `shopConfig.deliveryFeeUsdCents` (may be zero) that
pickup always zeroes. `deliveryCents` and `totalCents` are **`null` until a method is chosen**, and the
summary card shows "por definir" rather than standing in as zero — the point of a flat fee is that the
number the customer is about to transfer by hand is exact before they transfer it.

**Payment rails.** The five rails (Pago Móvil, transferencia, Zelle, Binance/USDT, efectivo) are
config, not components: `shopConfig.paymentRails` holds an enable flag and the account values,
`lib/payment.ts` is the view model that turns them into `{ label, value }` rows — one switch that
knows a Pago Móvil takes a bank code and no account number, and that a blank value means the shop
doesn't have one. `enabled: false` removes a rail from checkout _and_ from the footer's list, which
reads the same function. `efectivo` is the rail that behaves differently everywhere: pago contra
entrega, so `requiredFields` asks it for no `reference` and asks instead — when the customer says
they need change — what note they are paying with. The submit gate is nothing but
`validate(form, today)` being empty, so the button can't disagree with the asterisks.

`buildOrder` and `orderToWhatsAppUrl` join this module with dispatch.

### Domain model

Three terms, used consistently in code, copy and tests:

- **Product** — one sellable item: one SKU, one size, one price. No variants. Price is
  `priceUsdCents` (integer minor units, to keep money off floating point).
- **Category** — the _presentation/format_ axis (ramo, arreglo, caja…). Exactly one per product;
  drives navigation and breadcrumbs.
- **Facet** — a cross-cutting filterable attribute: occasion, flower type, colour (multi-value) and
  size (single). **Price range is derived** from price and never stored.

Vocabularies are `as const` tuples in `lib/catalog/types.ts`, so a typo in the seed is a compile error
rather than a filter that silently matches nothing.

## Conventions

- **Spanish URLs and copy, English code.** Route paths live in `lib/routes.ts` so the convention is
  stated once. Every user-facing string lives in `lib/strings.ts` (there is no i18n library) — facet
  display labels are typed as complete records, so adding a facet value without a label fails to
  compile.
- **Every price renders through `formatPrice(cents)`** in `lib/format.ts`. USD only, no VES, no FX.
- **What the shop owner can change lives in `lib/config.ts`** — WhatsApp number, hours, location and
  the flat delivery fee, with the five payment rails to follow. Never inline one of these at a call
  site: pages read config and pass it down (see `app/finalizar-compra/page.tsx`).
- **Theme tokens over hex.** `app/globals.css` defines the "Jardín" palette as CSS variables and maps
  them onto shadcn's semantic tokens, exposed as utilities: `bg-ground`, `text-ink`, `text-ink-muted`,
  `border-hairline`, `text-plum`, `text-gold`. Prefer `text-primary` for the brand emerald. The site
  commits to a single light palette — the `dark` variant is pinned to a `.dark` ancestor that nothing
  sets, so OS dark preference can't hijack the design.
- **shadcn primitives are copied into `components/ui/`**, not a runtime dependency. Already vendored:
  `button`, `checkbox`, `input`, `pagination`, `radio-group`, `select`, `sheet`.
- **Checkout's fields go through `components/checkout-field.tsx`**, which owns the label, the mark,
  the hint and the error for every field, and gates each error on that field's own blur. Its controls
  are native `input`/`textarea`/`select` styled with theme tokens rather than the vendored `Select` —
  on a phone that is the platform's own picker, and a real `<label>` needs no ARIA to name it. The one
  control that cannot go through it (the delivery-method radio _group_) still imports its
  `RequiredMark`, so the mark is drawn in one place.
- Flat layout, no `src/`. Path alias `@/*`, TypeScript `strict`.

## Testing posture

Vitest + React Testing Library, jsdom. Tests assert **external behaviour through a module's public
interface** — never internals, never markup snapshots. Fixtures are small and hand-built (a dozen
products exercising the rule under test), **not** the 50-item seed, which is production content and
gets its own invariant tests (`data/seed.test.ts`: category spread, price-bucket coverage, 7 featured
with flagship first, every facet value ≥3 products, unique ASCII slugs).

Logic tests concentrate on three pure seams — **search**, **cart**, **order** — each of which
swallows a lot of behaviour behind one door and needs no DOM.

Islands get **deliberately thin wiring tests** that must not re-test that logic. Two exist:

- **results island** — a filter change uses `replace`, a page change uses `push`, a filter change
  resets to page 1, mounting from a URL with params reproduces that state.
- **checkout island** — the conditional blocks appear and disappear with the toggles, the recipient
  phone's marking moves with the method, the summary is fed by the catalog and moves with the method,
  choosing a rail reveals that rail's account block and hides the last, the submit button opens only
  once the order is complete and paid, an empty cart redirects. It names **no amounts** and no rail's
  real fields: what the figures come to is `lib/order`'s and which rows a rail has is `lib/payment`'s,
  both proven without a DOM, and restating either here would be the exact duplication this split
  exists to avoid.

Explicitly **not** tested: the catalog seam's static implementation (it returns array literals; the
compiler is the guarantee), visual appearance, and Server Component page rendering (the build
exercises it).

## Planning docs and the build workflow

`.scratch/` is committed and is the source of truth for what to build:

- `.scratch/spec.md` — the build-ready spec: 117 user stories plus implementation and testing
  decisions. Consult it before making a design call; most have already been settled with reasons.
- `.scratch/map.md` — the wayfinder index of locked decisions, one line per planning ticket.
- `.scratch/build/issues/01-14.md` — the implementation tickets, in dependency order.
- `.scratch/seed/products.md` — the authored 50-product catalog content.

**One ticket, one commit**, message `feat(NN): <summary>`. Progress is tracked by commit history and
by the ticket checkboxes.

Tickets 01–12 are complete: scaffold, catalog seam, imagery, about/404, home, product detail, search
module, results island + `/buscar`, categories index + category pages, cart, checkout details, and
the payment rails + submit gate.

Next is **13 — dispatch and confirmation**: `buildOrder` and `orderToWhatsAppUrl` in `lib/order`
(the locked message template, sections present only when relevant, `*bold*` markers, encoded exactly
once, `%0A` newlines, under ~2000 chars), an `AZ-XXXX` order code from an **injectable** randomness
source, the order stashed in `sessionStorage`, and `/pedido-enviado` carrying the summary, the code,
the WhatsApp button, the raw-number copy fallback and the comprobante reminder — clearing the cart on
arrival. One thing is already shaped for it: the checkout form's submit button is gated and waiting
for a handler, and `components/copy-button.tsx` is the fallback's copy control. Then **14** (real
photography).
