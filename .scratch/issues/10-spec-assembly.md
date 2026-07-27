# 10 — Spec assembly (build-ready spec document)

Type: task
Status: resolved
Blocked by: 01, 02, 03, 04, 05, 06, 07, 08, 09

## Question

Collate every locked decision (tickets 01–09) into the single **Azahar build-ready spec document** — the map's destination. A builder should be able to start a Next.js implementation from this document alone, without re-reading the tickets.

This is the terminal deliverable, not a decision: nothing is left to decide (all blocking tickets are resolved). Graduated from the map's "Not yet specified" fog once ticket 08 locked the last open decision.

### Suggested shape

Assemble into a coherent spec (not just concatenated ticket answers), covering:

1. **Overview & scope** — read-only storefront; what's in, what's out (from Destination + Out-of-scope).
2. **Stack & conventions** — static Next export, App Router, Tailwind + shadcn, Spanish-only, USD, Node 24 LTS (ticket 02).
3. **Domain model & data shape** — Product/Category/facets (ticket 01), the `CatalogSource` seam + `data/` modules + images (ticket 04).
4. **Catalog content** — 10 categories, facet vocabularies, the concrete 50-product seed + image pool (ticket 06, [`seed/products.md`](../seed/products.md)).
5. **Information architecture** — routes, header/footer, home composition, URL scheme (ticket 05).
6. **Advanced search & filtering** — the Amazon-style search/filter/sort/pagination spec (ticket 09).
7. **Checkout & order dispatch** — pay-first WhatsApp flow, fields, 5 payment rails, cart model (ticket 07).
8. **Visual design direction** — Direction B "Jardín": layout, cards, palette tokens, imagery treatment, typography, search-results styling (ticket 08).
9. **Research appendix** — WhatsApp deep-link + Venezuelan payment facts (ticket 03).

## Resolution

Assembled spec lives at **[`.scratch/spec.md`](../spec.md)** — labelled `ready-for-agent`.

Produced by `/to-spec`, which collapsed tickets 01–09 into the template's shape (Problem Statement ·
Solution · User Stories · Implementation Decisions · Testing Decisions · Out of Scope · Further
Notes) rather than the 9-section outline suggested above — the decisions are all carried, just
regrouped so each section answers one question a builder actually asks. **117 user stories** across
browsing, search, product detail, cart, checkout, dispatch, shop-owner and builder actors.

Two things the assembly had to *decide*, not just transcribe:

1. **Testing posture — a genuine gap.** No ticket ever picked a test runner or a testing approach
   (ticket 02 stopped at lint/format). Settled with the user during assembly: **Vitest + React
   Testing Library**, over **three pure test seams** (search / cart / order) plus **two deliberately
   thin island wiring tests** proving URL sync, replace-vs-push and the submit gate. Also recorded:
   the catalog seam is an *architecture* seam and gets no tests of its own (the compiler is the
   guarantee), and the order code needs an **injectable** randomness source to be testable at all.
2. **A ticket-04 / ticket-06 contradiction.** 04 specified per-product WebP files named
   `<product-slug>-<n>`; 06's manifest specifies a **19-file pool of subject-named `.jpg` images
   reused across the 50 products**. Mutually exclusive — reuse and per-product naming cannot both
   hold. Resolved in favour of **06's manifest** (later decision, explicitly owns the manifest),
   keeping 04's principle that actually matters: the data stores a complete reference string the UI
   never stitches, so a local path becomes a CDN URL with no UI change. Both tickets still carry the
   older wording; **the spec is authoritative.**

The spec deliberately does **not** duplicate the catalog content — [`seed/products.md`](../seed/products.md)
stays the source of truth for the 50 products, 10 categories, facet vocabularies and image manifest.

**Next step:** `/to-tickets` against the spec. Suggested build order is recorded in the spec's Further
Notes (scaffold → seed + seam → static pages → search → cart → checkout → dispatch).
