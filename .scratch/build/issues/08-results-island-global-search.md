# 08 — Results island + global search page

**What to build:** First-class search, working end to end. A customer types "rosas", narrows to red
and white under $50, sorts by price, pages through the results, sees exactly why they're seeing what
they see, removes one filter, and shares the URL with someone who gets the identical view. On a phone
the same filters live behind a "Filtros · 3" button. This is the largest slice in the build.

The single results surface built here is **reused by category pages** in ticket 09 — build it as a
component that takes its catalog and its scope as input, not as something welded to the search route.

Spec: [`spec.md`](../../spec.md) §7 (search & filtering UX), §6 (URL scheme), §10 (search styling).

**Blocked by:** 03, 06, 07

**Status:** done

- [x] `/buscar` is an async Server Component that awaits the seam at build time and passes the **full product array to the client island as props**, shipped inside the prerendered HTML. The island never imports the data modules or the seam, and never runtime-fetches an index.
- [x] **The URL is the single source of truth.** The island reads its entire state from query params and writes every change back. Reload and share reproduce the exact view.
- [x] **Desktop (≥ `lg`)**: a persistent sticky left sidebar (~256 px) below the header, results grid filling the rest, all groups expanded (max 8 values each, no "ver más").
- [x] **Mobile/tablet**: the sidebar collapses to a **"Filtros" button with an active-count badge** ("Filtros · 3") opening a `Sheet` with the identical groups as a **collapsed-by-default accordion**; filters apply live; a sticky footer **"Ver N resultados"** dismisses it.
- [x] All six facet groups render in order — Categoría (radio, 10 + "Todas las categorías"), Precio (radio, 4 buckets + "Cualquier precio"), Ocasión (checkboxes ×8), Tipo de flor (checkboxes ×8), Color (checkboxes ×8 each with a **circular swatch**, `blanco` ringed and `multicolor` a gradient), Tamaño (radio ×3 + "Cualquier tamaño").
- [x] Single-select facets clear via an explicit **"Cualquiera/Todas" radio row**, not click-to-deselect.
- [x] **Live facet counts** beside every value, right-aligned, recomputed on every change; **zero-count values greyed out and disabled**. Counts are over the full filtered set, independent of the current page.
- [x] **Applied-filter chips** in a row directly above the grid — on desktop and mobile, and **outside** the mobile sheet. One removable chip per active constraint, including **one chip per selected value** in multi-select facets, using human Spanish display names. A plum **"Limpiar todo"** resets to a clean base URL. The row hides when nothing is active.
- [x] The in-page query box **live-filters, debounced ~250 ms**; facets, price and sort apply **immediately** with no "Aplicar" button.
- [x] **History hygiene**: every in-page state change uses **`replace`** so Back exits search rather than replaying tweaks — **except page changes, which use `push`** so Back steps through result pages.
- [x] **Sort** via an underlined borderless `Select` at the **top-right** of the results area (count top-left), **outside** the mobile sheet so it pairs with the Filtros button. Four options mapping 1:1 to the sort tokens.
- [x] **Results grid** of product cards (~2→3→4 columns) reusing the card from ticket 05, each linking to its product page. Serif results heading with a muted count: "N resultados", echoing an active query as "24 resultados para «rosas»".
- [x] **Circular numbered pagination** with an emerald active state, 12 per page. Any query/facet/price/sort change **resets to page 1**; an out-of-range page clamps; changing page **scrolls to the top of the results**.
- [x] **No loading or skeleton state anywhere** — filtering is synchronous in memory.
- [x] **No filters shows the full catalog** paginated, so this route doubles as the "Ver todo" target.
- [x] **Zero-result state**: "No encontramos productos que coincidan con tu búsqueda." plus "Revisa la ortografía o ajusta los filtros.", **chips still visible** so the cause is legible, a prominent "Limpiar filtros", and a **"Quizás te interese" featured fallback row**. The sidebar stays in place.
- [x] Styled within the Jardín direction: serif facet group headings, circular swatches, pill chips, plum "Limpiar todo", underlined sort select, circular pagination.
- [x] **Results-island wiring test** (deliberately thin — it must not re-test ticket 07's logic): a filter change updates the URL and uses `replace`; a **page change uses `push`**; changing a filter resets to page 1; removing a chip removes exactly that constraint; mounting from a URL with params reproduces that state.
