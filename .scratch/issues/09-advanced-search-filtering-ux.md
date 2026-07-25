# 09 — Advanced search & filtering UX (Amazon-style)

Type: grilling
Status: resolved
Claimed-by: j.alvarez
Blocked by: 01, 05

## Question

Design the first-class, Amazon-style advanced search:

- **Facets/filters** exposed (category, price range, occasion, colour, flower type, arrangement type…) — driven by the facet attributes from ticket 01.
- How **text search + facet filters + sort** combine; multi-select within a facet vs across facets.
- **Filter UI** — sidebar, chips, collapsible groups? Applied-filter summary + clear-all.
- **Empty / zero-result** states; result counts per facet.
- **State model** — URL query params (shareable/back-button-safe)?
- **Implementation approach** for a ~50-item static catalog — pure client-side filter + a text-search lib (Fuse.js / MiniSearch)? Consider the ticket 04 seam.

May spin off a `/prototype` if the interaction needs to be felt before locking.

## Answer

One results surface (Model B, ticket 05) shared by `/buscar` (global) and `/categoria/[slug]`
(category-scoped), built as a `'use client'` island over the catalog the RSC page embeds as props
(ticket 04). **No prototype spun off** — every choice is a known Amazon-style pattern; the build is
the first real "feel", visual polish stays with ticket 08.

**1 — Composition semantics.** Within a multi-value facet → **OR** (widening); across different
facets → **AND** (narrowing); free-text `q` → **AND** with facets (never resets them); price `pr`
and size `sz` → **AND**, each **single-select**; occasion/flower-type/colour → **multi-select**.
Sort is orthogonal — reorders the surviving set, never filters. Net: everything narrows except
multiple values inside one facet.

**2 — Text-search engine: zero-dependency, accent- & case-insensitive token match** (no
Fuse.js/MiniSearch). Rationale: 50 embedded items, no relevance-ranked mode (results always ordered
by the explicit sort), lean posture. Per product build a normalized blob = `name + tagline +
description + category display-name + all facet display-labels`; normalize blob and query by
lowercase + diacritic-strip (`cumpleaños ↔ cumpleanos`); split query on whitespace; **every token
must appear as a substring** (AND across tokens). No fuzzy/typo tolerance in v1. Lives as a pure
`lib/search` function behind the ticket-04 boundary, so Fuse.js could later drop in with zero
call-site churn.

**3 — Trigger & history hygiene.** In-page query box **live-filters, debounced ~250 ms**; the
header search bar still just navigates to `/buscar?q=…` on Enter (ticket 05). Facets/price/sort
apply **immediately** on change (no "Aplicar" button). **All in-page state uses `router.replace`
(single history entry)** — Back exits search, not step-through-tweaks; "undo a filter" is the chips
+ clear-all, not Back. **Sole exception: page navigation uses `push`** (see §9b) so Back steps
through result pages. Reload/share always restore exact state.

**4 — Layout & responsive.** **Desktop (≥ `lg`):** persistent **left sidebar ~256 px, sticky**
below the header; results grid fills the rest. **Mobile/tablet (< `lg`):** sidebar collapses to a
**"Filtros" button with active-count badge** ("Filtros · 3") → opens a **shadcn `Sheet`** with the
identical facet groups; filters apply live; sticky footer **"Ver N resultados"** dismisses it.
Collapsible groups: **desktop all expanded** (max 8 values each, no "ver más"); **mobile sheet
accordion, collapsed by default**.

**5 — Per-facet controls** (Spanish labels via `lib/strings.ts`), sidebar order top→bottom:

| Group | Control | Notes |
|---|---|---|
| **Categoría** | radio (single) | **Global `/buscar` only.** 10 categories + top **"Todas las categorías"**. **Omitted on `/categoria/[slug]`** — path-fixed, shown in header/breadcrumb. |
| **Precio** | radio (single) | `$0–$25`, `$25–$50`, `$50–$100`, `$100+`, + **"Cualquier precio"** |
| **Ocasión** | checkboxes (multi) | 8 values |
| **Tipo de flor** | checkboxes (multi) | 8 values |
| **Color** | checkboxes (multi) | 8 values, each with a **colour swatch dot** — `blanco` gets a ring, `multicolor` a rainbow/gradient dot |
| **Tamaño** | radio (single) | Pequeño / Mediano / Grande, + **"Cualquier tamaño"** |

Single-select facets clear via an explicit **"Cualquiera/Todas" radio row** (not
click-to-deselect). Category is the only facet that differs between the two entry points.

**6 — Facet result counts: dynamic + disable-zero.** Show `Rosas (12)` next to each value,
recomputed on every filter change; a value whose count is 0 is **greyed out and disabled** (no
dead-ends). Standard faceted semantics — a value's count = results with *all active filters except
its own facet* applied, then intersected with that value (so checking "rojo" doesn't zero-out its
OR-sibling "blanco"). Counts and the results header are over the **full filtered set**, independent
of the current page.

**7 — Applied-filter chips + clear-all.** A row directly above the grid (visible on desktop and
mobile, *outside* the sheet): **one removable chip per active constraint** — the query (`«rosas» ✕`),
each selected occasion/flower-type/colour value (**one chip per value**), selected size, selected
price, and (global only) selected category. Labels are the **human Spanish display name**. A
**"Limpiar todo"** clears every filter + query → clean base URL. Row hidden when nothing is active.
**On `/categoria/[slug]` the fixed category is not a chip** (stays in header/breadcrumb); clear-all
there clears filters but keeps you on the category.

**8 — Sort.** shadcn **`Select`**, top-**right** of the results area (count top-left, sort
top-right); **outside** the mobile sheet (pairs with the "Filtros" button on the same bar). Options
map 1:1 to ticket-05 tokens: **Destacados** `featured` (default, omitted from URL), **Precio: menor
a mayor** `price-asc`, **Precio: mayor a menor** `price-desc`, **Nombre: A–Z** `name`. "Destacados" =
the catalog's curated order from the seam (featured-first, then seed order).

**9 — Results grid.** Responsive product-card grid (columns ~2→3→4; exact card composition &
column counts are **ticket 08**). Results-count header top-left: `/buscar` → **"N resultados"**,
echoing an active query — **"24 resultados para «rosas»"**; `/categoria/[slug]` → category name +
**"N productos"**. Cards link to `/producto/[slug]`. **No loading/skeleton state** — filtering is
synchronous in-memory (static export).

**9b — Pagination** (chosen over show-all: this build doubles as a reusable storefront template, and
paging is worth exercising live). Classic **numbered pagination** (`‹ Ant · 1 2 3 … · Sig ›`, shadcn
`Pagination`). **12 per page** (clean 2/3/4-col multiple; ~5 pages over the 50-item seed so it's
actually visible). **URL adds a `page` param** (chosen over terse `pg` for clarity) — **omitted when
`page=1`**; extends the ticket-05 scheme. **Reset to page 1** on any query/facet/price/sort change;
**clamp** out-of-range `page` to the last valid page; **scroll to top of results** on page change.
**Page navigation uses `push`** — the single exception to §3's replace-everything, so Back steps
through pages.

**10 — Empty & zero-result states.** **No-filter default = the full set** (no special initial
screen): `/buscar` with no params → entire catalog paginated (doubles as the home "Ver todo" target);
`/categoria/[slug]` with no filters → all products in that category. **Zero-results** (mainly a
free-text miss, since disable-zero stops facet dead-ends): message **"No encontramos productos que
coincidan con tu búsqueda."** + spelling nudge **"Revisa la ortografía o ajusta los filtros."**
(there's no fuzzy match); **chips stay visible** (shows *why*); prominent **"Limpiar filtros"**; and
a **"Quizás te interese" featured-products fallback row**; sidebar stays in place.

**Handoffs / effects:**
- **Extends ticket 05's URL scheme** with the `page` param and fixes the replace-vs-push history
  behavior (replace-everything except push-on-page-change). Ticket 05 stays closed; pagination is
  09's concern.
- Card *composition* and grid column counts, colour-swatch styling, and general visual treatment are
  **ticket 08** (visual direction).
- Implementation: a pure `lib/search` filter/sort/paginate function over the embedded `Product[]`
  (ticket 04 seam); the results component reads/writes URL `searchParams` as the single source of
  truth (ticket 05).
- **No new tickets, no fog graduated** (Spec assembly still waits on ticket 08), **no scope
  changes** surfaced.
