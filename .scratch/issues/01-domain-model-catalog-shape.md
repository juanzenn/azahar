# 01 — Domain model & catalog data shape

Type: grilling
Status: resolved
Claimed-by: j.alvarez

## Question

Define Azahar's catalog domain model and ubiquitous language:

- **Product** — what fields? (name, description, price, images[], slug, …). Long vs short description? Multiple images?
- **Category** — what is it, and how do products relate? One category per product, or many? Sub-categories?
- **Facets for advanced search** — which attributes are filterable? Candidates for flowers: occasion (cumpleaños, aniversario, condolencias, bodas…), colour, flower type (rosas, girasoles, orquídeas…), arrangement type (ramo, caja, canasta…), size/price tier. These must exist on Product to power ticket 09.
- **Pricing** — currency (USD?), representation (integer cents? decimal?), any "desde $X" ranges.

Establish the terms the rest of the spec will reuse.

## Answer

**Ubiquitous language**

- **Product** — a single sellable item (one SKU, one size, one price). No variants.
- **Category** — the *primary presentation/format* of a product (ramos, arreglos, cajas, canastas, floreros, plantas…). **Exactly one per product**; drives nav & breadcrumbs. Mutually exclusive.
- **Facet** — a cross-cutting, filterable attribute powering advanced search (ticket 09). Four facets: **Occasion**, **Flower type**, **Colour** (all multi-value), **Size/tier** (single-value). **Price range** is a derived facet computed from `price`, not stored.

**Decisions**
- Primary category + facets model (category is one-per-product; occasion is many-per-product → a facet, never the primary axis).
- Primary-category axis = **presentation/format**.
- **Single SKU per product** — size is a filter facet, *not* a priced variant. Cart line = product + quantity.
- Price: **USD, single price**, stored as **integer minor units (cents)** to avoid float errors. Display format (symbol, VES reference?) deferred to ticket 02.
- The concrete *enumerated values* (the 10 category slugs; the occasion/flower-type/colour vocabularies) are **content**, decided in ticket 06. Ticket 01 fixes only the shape & cardinality.

**Shape sketch** (illustrative; final types land in the build-ready spec)

```ts
type Category = {
  slug: string        // "ramos", "arreglos", "cajas", ...
  name: string        // "Ramos"
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
  images: string[]        // >=1; images[0] is primary
  categorySlug: string    // exactly ONE primary category
  // facets:
  occasions: string[]     // multi
  flowerTypes: string[]   // multi
  colours: string[]       // multi
  size: string            // single: 'pequeno' | 'mediano' | 'grande'
  featured?: boolean      // homepage highlight
}
```
