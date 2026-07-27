# Azahar 🌸

**A flower-shop storefront for the Venezuelan market — fully static, Spanish-language, and finished by a WhatsApp message.**

![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-087ea4?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/tests-278%20passing-1f4d3a)

Azahar is a storefront for a small florist: ~50 products across 10 categories, an Amazon-style faceted
search, a cart, and a checkout that collects the order, shows the shop's payment details, and hands
the whole thing to WhatsApp. It prerenders to 69 static pages with no runtime server anywhere.

I built it as a portfolio project, and the interesting part isn't that it works — it's the set of
constraints it was built under, and the way it was planned before a line of it was written. Both are
documented below.

---

## Why it looks like this

Most e-commerce tutorials assume a payment gateway, a stock table and an admin panel. A neighbourhood
florist in Caracas has none of those, and adding them would make the software worse for the person who
has to run it. So the design starts from how the transaction actually happens:

- **Payment is manual and out-of-band.** Pago Móvil, bank transfer, Zelle, Binance/USDT, or cash on
  delivery. The site shows the shop's account details, the customer pays from their own bank app and
  types the _referencia_ back in. There is no gateway to integrate and no card data to hold.
- **The order is dispatched over WhatsApp**, because that is where Venezuelan retail already lives. The
  customer presses one button, WhatsApp opens with the complete order written out, and they press send.
- **Nothing needs a server.** No stock counts to decrement, no orders to persist, no admin to
  authenticate. That makes a fully static export the honest architecture rather than a limitation, and
  it means the whole site can be hosted for free on any static host.

The trade-offs this forces — search that can't run at build time, a cart that lives in the browser, a
total that must be exact _before_ the customer transfers money by hand — are what the code is actually
about.

## What it does

**Catalog**

- 50 seeded products across 10 format categories (ramos, arreglos, cajas, canastas, floreros…), each
  with breadcrumbs, related products from the same category, and a flagship-first featured set.
- Every price is an integer number of cents and renders through a single formatter. No floats, no FX.

**Faceted search** — the centrepiece

- Four facets (occasion, flower type, colour, size) plus derived price buckets, sort and pagination.
- **Within-facet OR, across-facet AND** — pick two colours and you get both; add an occasion and it
  narrows.
- **Facet counts are live, and a facet's own filters are excluded from its own counts**, so selecting
  one colour never zeroes out its siblings. Values that would return nothing are disabled rather than
  hidden.
- **The URL is the only state.** Filters, query, sort and page all serialise to abbreviated params, so
  any result set is shareable and the Back button works. A filter change replaces history; a page
  change pushes, so Back walks back through pages.
- Accent-insensitive token matching with **zero dependencies** — no Fuse.js. Nobody types "ñ" into a
  search box on a phone, so `cumpleanos` has to find _Cumpleaños_.
- Removable chips per active value, "Limpiar todo", a sticky sidebar on desktop and a sheet on mobile,
  and a zero-result state that offers a spelling nudge and a featured fallback instead of a dead end.
- Category pages are the _same_ results component with a different scope — one island, two entry
  points.

**Cart**

- Lives in `localStorage`, and **a cart line stores only `{ slug, qty }`**. Names and prices are
  resolved from the catalog at render, which makes a stale price structurally impossible rather than
  something to remember to invalidate.
- Everything in storage is treated as untrusted: corrupt JSON, a hand-edited quantity or a product
  that no longer exists all degrade to a working cart.

**Checkout**

- One page, sticky summary. Which fields are required is a **function of three answers** — delivery or
  pickup, gift or not, which payment rail — so the asterisks, the `aria-required` attributes and the
  validation errors all read the same source and cannot drift.
- Validation is deliberately soft on format: a phone is checked for being _there_, not for matching a
  regex that might reject a reachable customer.
- Delivery adds a flat configurable fee that pickup zeroes; the total shows **"por definir"** until a
  method is chosen rather than standing in as zero, because the number the customer is about to
  transfer by hand has to be exact.
- The five payment rails are configuration, not components. Turning one off removes it from checkout
  _and_ from the footer's trust signals. Cash behaves differently everywhere — it asks whether change
  is needed instead of asking for a reference.

**Dispatch**

- One press builds the order, opens WhatsApp with the whole thing already written — line items, totals,
  delivery, recipient, payment and reference — and lands the customer on a confirmation page. All they
  do is press send; nothing sends itself, and the copy never pretends otherwise.
- **The message _is_ the order.** Nothing persists server-side, so the confirmation page is rendered
  from the very sections the message is written from — one description, two renderings, and no way for
  the page to describe an order differently from the shop's copy of it.
- Sections appear only when they say something (recipient only for a gift, address only for a delivery,
  card and notes only if filled), the message is encoded exactly once with `%0A` newlines, and it keeps
  itself under the deep-link's ~2000 characters — a real order is never trimmed, and an absurd cart
  folds its tail into a summary line rather than letting WhatsApp truncate the end, where the payment
  reference lives.
- An `AZ-XXXX` code to say out loud in the chat, drawn from an **injectable** randomness source.
- The cart is emptied on arrival so a reload can't order twice, the deep-link stays re-openable in case
  the first attempt failed, and the shop's raw number sits beside it with a copy button so a missing
  WhatsApp never strands an order.

**Everything else**

- Spanish throughout, from URLs (`/categoria/ramos`, `/finalizar-compra`) to copy, with every
  user-facing string in one module.
- Real `<label>`s and native pickers on mobile, errors gated on each field's own blur.
- A single committed light palette ("Jardín"), so an OS dark-mode preference can't hijack the design.

The shopping path is end to end: browse, filter, add to cart, check out, pay out-of-band, send the
order. What is left is real photography — see the [roadmap](#roadmap).

## Architecture

Four ideas carry most of the weight.

**1. One door to the data.** `lib/catalog/` is the only way the storefront reaches its content: an
interface, a static implementation reading typed seed modules, and a one-line export of the active
source. UI imports `@/lib/catalog` and never the data. Every method is `async` even though the static
source resolves immediately — moving to a hosted API means adding `api-source.ts` and changing one
line, and TypeScript refuses to compile an implementation that doesn't satisfy the contract, so the
swap is enforced rather than hoped for.

**2. Logic lives in pure modules; React is a thin skin over them.** Search, cart, order and payment are
plain TypeScript with no React, no DOM and no dependencies. Each swallows a lot of behaviour behind one
small interface, which is why the test suite can be substantial without being brittle.

| Module           | Responsibility                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/search.ts`  | Filter, sort, paginate, count facets — plus the URL parse/serialise, because the key→field map is already its job                              |
| `lib/cart.ts`    | Add/remove/set quantity, resolve lines against the catalog, prune what no longer exists                                                        |
| `lib/order.ts`   | Which fields are required, what's invalid, what the order comes to — and the message that carries it                                           |
| `lib/payment.ts` | Turn the shop's configured rails into the rows each account block renders                                                                      |
| `lib/facets.ts`  | The view model between search and the controls: each control carries the criteria it produces when clicked, so no component branches per facet |
| `lib/env.ts`     | Read the shop's own details out of the build environment, distinguishing absent from blank from malformed                                      |

**3. Server Components by default, client islands where interaction demands it.** Pages read
configuration and the catalog at build time and pass them down; the islands are the results surface,
the cart and the checkout form. Nothing fetches.

**4. Configuration is a seam too.** `lib/config.ts` owns the shape and the defaults, the deploy
environment owns the values. Every field reads a `NEXT_PUBLIC_*` variable and falls back to a
placeholder, so the repository carries no real bank account and a fresh clone still builds a working
demo shop. See [Configuration](#configuration).

## Tech

|                      |                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| Framework            | Next.js 16, App Router, `output: "export"`                                                       |
| UI                   | React 19, Tailwind CSS 4, shadcn/ui primitives vendored into the repo (not a runtime dependency) |
| Language             | TypeScript, `strict`, no `any`, path alias `@/*`                                                 |
| Tests                | Vitest 4 + React Testing Library, jsdom — 278 tests                                              |
| Tooling              | ESLint (flat config), Prettier + `prettier-plugin-tailwindcss`, Node 26, npm                     |
| Runtime dependencies | None for logic. Search, cart, order and payment are dependency-free                              |

`next/image` runs `unoptimized` because a static export has no server to resize anything; it stays for
layout stability and lazy loading.

## Running it locally

```bash
nvm use          # Node 26, pinned in .nvmrc
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build      # static export → out/
npm test           # vitest run
npm run typecheck  # tsc --noEmit
npm run lint
npm run format
```

`out/` is a plain folder of HTML — deployable to Vercel, Netlify, Cloudflare Pages, GitHub Pages or an
S3 bucket. Nothing in the build is host-specific.

## Configuration

The shop's real details — WhatsApp number, hours, location, delivery fee and the five payment rails —
are read from `NEXT_PUBLIC_*` variables at **build time**. Copy `.env.example` to `.env.local`, or set
them in your host's environment.

```bash
cp .env.example .env.local
```

Every variable is optional and the module handles three cases on purpose:

|                   |                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Absent**        | Falls back to a placeholder, and the build warns once listing what it didn't find. A clone with no environment still builds the demo shop.                          |
| **Set but empty** | A deliberate blank. A shop with a Binance Pay ID and no wallet address says so this way, and blank rows aren't rendered.                                            |
| **Malformed**     | Fails the build. There is no honest reading of `ENABLED=maybe`, and `FEE_CENTS=5.50` silently becoming 5 cents would misprice every order by a factor of a hundred. |

They are `NEXT_PUBLIC_` because they genuinely are public — a storefront prints its phone number and
bank details on the page. Nothing secret belongs here.

## Testing

278 tests, and what they _don't_ cover is as deliberate as what they do.

- **The pure modules get the depth.** Search, cart and order swallow the real behaviour, and none of
  them needs a DOM. The locked WhatsApp template is asserted whole, once, and every rule that shapes it
  — a section that comes and goes, the cash variant, `%0A` newlines, encoded exactly once, the ~2000
  character ceiling under a cart of the entire catalog — is then taken one at a time.
- **The islands get thin wiring tests** that must not re-test that logic — a filter change uses
  `replace` and resets to page 1, a page change uses `push`, the conditional checkout blocks appear
  with their toggles, an empty cart redirects, pressing send stashes the order and opens the link, a
  confirmation page with no stashed order sends the customer home with their cart untouched. These
  tests name no amounts, no rail's real fields and no message text, because what the figures come to is
  `lib/order`'s job and which rows a rail has is `lib/payment`'s, both proven without a DOM.
- **The 50-item seed gets invariant tests** rather than being used as a fixture: category spread,
  price-bucket coverage, 7 featured with the flagship first, and **every facet value having at least 3
  products**, so no filter can dead-end.
- **The catalog seam is not tested.** Its static implementation returns array literals; the compiler is
  the guarantee. Neither is visual appearance, and Server Component rendering is exercised by the
  build.

Fixtures are small and hand-built — a dozen products exercising the rule under test — never the
production catalog.

## How this was built (working with AI agents)

The whole thing was built with AI agents, and the part worth writing down is what made that work. It
wasn't prompting technique. It was refusing to start building until the decisions were made, and then
writing them down in a form an agent couldn't drift from.

**`.scratch/` is committed, and it is the source of truth.** Planning artefacts aren't scaffolding to
be deleted — they're the reason the implementation is coherent.

**1. Plan to a spec, not to a vibe.** The first phase produced no application code at all. It closed
one decision at a time — domain model, stack, data seam, taxonomy, checkout flow, search UX, page
inventory, visual direction — each as its own ticket with the reasoning kept. A one-line-per-decision
index (`.scratch/map.md`) stayed the wayfinder, so nothing had to be re-derived from a transcript.
Along the way: three visual directions prototyped as throwaway HTML before one was locked, and the
external facts that actually mattered (how `wa.me` deep-links encode, exactly which fields a Pago Móvil
needs) researched rather than assumed.

**2. Lock decisions with their reasons.** The output was a build-ready spec — 117 user stories plus
implementation and testing decisions — and the standing instruction became _consult the spec before
making a design call; most have already been settled, and the reason is written down_. This is the
single highest-leverage habit I found. An agent asked to "build a search page" will invent a facet
model every session. An agent told _within-facet OR, across-facet AND, and here's why_ builds the same
thing every time.

**3. Give the agent a standing brief.** [`CLAUDE.md`](CLAUDE.md) holds the conventions — Spanish URLs
and copy, English code; every price through one formatter; theme tokens over hex; what's tested and
what deliberately isn't. It's written as explanation rather than rules, because an agent that knows
_why_ prices are integer cents extends the convention correctly into code nobody wrote a rule for.

**4. Slice the build into dependency-ordered tickets, one commit each.** Fourteen tickets, each with
acceptance criteria as checkboxes, in an order where nothing is blocked. The commit history reads as
the build order (`feat(07): add the search module`), so any change can be reviewed against exactly the
criteria it claimed to satisfy.

**5. Put the guarantees where they can't be forgotten.** Facet vocabularies are `as const` tuples, so a
typo in the seed is a compile error instead of a filter that silently matches nothing. Display labels
are typed as complete records, so adding a facet value without a label fails to build. The catalog seam
is an interface, so a future API implementation can't quietly diverge. This matters more with agents
than without: review attention is the scarce resource, and every invariant moved into the type system
or a test is one you never have to spend it on.

**What it cost, honestly.** The planning phase was substantial and produced nothing runnable. What it
bought was implementation tickets that were mostly mechanical, a codebase with one way to do each
thing, and — the real test — the ability to come back after a gap and keep building without
re-litigating anything. The judgment calls were still mine; the spec is where they're recorded.

## Roadmap

**Finishing the build**

- [x] **Real photography** (ticket 14) — the placeholder imagery is replaced with a curated set at the
      placeholders' exact dimensions. Because the export is unoptimized, the committed assets _are_ the
      delivered assets: 29 files, mean 104 KB. Provenance and licence per file are in
      [`.scratch/source-photos/CREDITS.md`](.scratch/source-photos/CREDITS.md).

**Making it presentable**

- [ ] Deploy it, and put a live demo link and screenshots at the top of this README.
- [x] CI on pull requests: typecheck, lint, format, test, build — plus a step asserting that strict
      config mode refuses a placeholder build, which is the half of that gate a unit test can't reach.
      Every gate runs even if an earlier one fails, so one push gets the full list.
- [ ] Lighthouse pass — font loading strategy, explicit image dimensions, LCP on the hero.
- [ ] SEO the static export deserves: `sitemap.xml`, `robots.txt`, per-page Open Graph images, and
      `Product` JSON-LD, none of which need a server.

**Hardening**

- [ ] An end-to-end smoke test (Playwright) over add-to-cart → checkout → dispatch. The unit suite
      deliberately doesn't cover that path, and it's the one that costs the shop an order.
- [ ] Accessibility audit with axe — focus management in the mobile filter sheet, keyboard traps, and
      a full pass on the checkout form's error announcements.
- [x] Optional strict configuration mode, so a production deploy fails rather than shipping placeholder
      payment details. `AZAHAR_STRICT_CONFIG=1` turns the build's missing-configuration warning into a
      refusal that lists every unset variable at once. Off by default, because the placeholders are what
      make a fresh clone runnable.

**Where it could go**

- [ ] `api-source.ts` behind the catalog seam, pointing at a hosted backend — the seam was designed for
      this and it should be a one-line change to `lib/catalog/index.ts`.
- [ ] Admin, stock and order history, which are deliberately out of scope here and belong to that
      backend rather than to a static storefront.

---

Built by [Juan Álvarez](https://github.com/juanzenn). The product is fictional; the constraints aren't.
