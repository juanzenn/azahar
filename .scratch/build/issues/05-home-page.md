# 05 — Home page

**What to build:** A customer arriving at Azahar for the first time immediately sees a real
arrangement — one flagship bouquet, large and photographic — understands within a second what this
shop sells, and has three obvious ways in: search it, browse a format, or shop by occasion. Every
product and category shown is real seeded data read through the catalog seam.

Spec: [`spec.md`](../../spec.md) §5 (home composition), §10 (visual direction).

**Blocked by:** 02, 03

**Status:** done

- [x] `/` is a static Server Component that reads featured products and categories **through the seam** — never importing the data modules directly.
- [x] **Asymmetric hero**: headline and CTA column left, full-bleed image panel right, stacking on mobile. Shows the **flagship = the first item from the featured list** (curated by ordering, so no schema field and no sales data are needed).
- [x] Hero shows the flagship's name and price, a primary "Ver producto" CTA linking to its product page, and a secondary "Ver todo" linking to global search.
- [x] Hero includes a **prominent search bar**, in addition to the one in the header.
- [x] **Featured products row** rendering the featured items as product cards.
- [x] **Product card treatment** is established here and reused everywhere after: tall portrait image tile, **edge-to-edge with no border**, subtle hover `scale(1.05)` on the image, meta centred below as uppercase category eyebrow · serif product name · emerald price. **No quick-add button** — the whole card links through to the product page.
- [x] **Categories grid**: all 10 categories as a bordered cell-grid with hairline gaps, each linking to its category page. This carries real navigational weight because the header has no dropdown.
- [x] **"Comprar por ocasión" strip**: pill links on a solid emerald band, each pointing at global search pre-filtered by that occasion. The links are correct even though the search page arrives in ticket 08.
- [x] Section headings follow the locked pattern — centred, uppercase eyebrow above a serif H2.
- [x] Soft radial floral ground behind the hero, per the visual direction.
- [x] No trust/contact band on the home page — that content lives in the footer only.
- [x] Prices render via `formatPrice`; all copy comes from the strings module.
- [x] Responsive: the hero stacks and the grids reflow cleanly on a phone.
