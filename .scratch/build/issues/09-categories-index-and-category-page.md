# 09 — Categories index + category page

**What to build:** The browse path, and the payoff on the map's keystone decision. A customer picks a
format from a page listing all 10 categories, lands on that category with its own hero and copy, and
finds **the same filtering tools they'd get from search** — already scoped to that category, with no
way to accidentally filter themselves out of it. One results surface, two entry points; nothing is
built twice.

Spec: [`spec.md`](../../spec.md) §5 (Model B keystone, routes, breadcrumbs), §7 (category-page differences).

**Blocked by:** 08

**Status:** ready-for-agent

- [ ] `/categorias` lists all 10 categories as cards with name, description and hero image, each linking to its category page. This is a real discovery surface, since the header has no dropdown.
- [ ] `/categoria/[slug]` is a static Server Component reading the category and its products through the seam, with all 10 pages prerendered.
- [ ] The category page has its **own hero** — category name as a serif heading plus its description — so it doesn't read as a filtered search result.
- [ ] It **reuses the ticket-08 results component**, scoped to the one category. No second results implementation, no duplicated facet UI.
- [ ] The **Categoría facet group is omitted** on this page — the category is fixed by the path and shown in the hero and breadcrumb instead.
- [ ] The fixed category **is not rendered as a removable chip**, so a customer cannot delete the page they're on.
- [ ] **"Limpiar todo" clears the filters but keeps you on the category** rather than dumping you into global search.
- [ ] The results heading reads category name + **"N productos"** (not "N resultados", which is the global-search wording).
- [ ] **Breadcrumbs**: `Inicio / Categorías / {category}` with working links.
- [ ] All other search behaviour is identical to global search — same facets, same OR/AND semantics, same live counts and disable-zero, same chips, same sort, same 12-per-page pagination, same replace-vs-push history rule.
- [ ] Filter state still serialises to the URL and is still shareable; the category comes from the path, not from a `cat` param.
- [ ] An unknown category slug calls `notFound()`.
- [ ] The footer's category links and the home categories grid both land here correctly.
