# 05 — Home page

**What to build:** A customer arriving at Azahar for the first time immediately sees a real
arrangement — one flagship bouquet, large and photographic — understands within a second what this
shop sells, and has three obvious ways in: search it, browse a format, or shop by occasion. Every
product and category shown is real seeded data read through the catalog seam.

Spec: [`spec.md`](../../spec.md) §5 (home composition), §10 (visual direction).

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [ ] `/` is a static Server Component that reads featured products and categories **through the seam** — never importing the data modules directly.
- [ ] **Asymmetric hero**: headline and CTA column left, full-bleed image panel right, stacking on mobile. Shows the **flagship = the first item from the featured list** (curated by ordering, so no schema field and no sales data are needed).
- [ ] Hero shows the flagship's name and price, a primary "Ver producto" CTA linking to its product page, and a secondary "Ver todo" linking to global search.
- [ ] Hero includes a **prominent search bar**, in addition to the one in the header.
- [ ] **Featured products row** rendering the featured items as product cards.
- [ ] **Product card treatment** is established here and reused everywhere after: tall portrait image tile, **edge-to-edge with no border**, subtle hover `scale(1.05)` on the image, meta centred below as uppercase category eyebrow · serif product name · emerald price. **No quick-add button** — the whole card links through to the product page.
- [ ] **Categories grid**: all 10 categories as a bordered cell-grid with hairline gaps, each linking to its category page. This carries real navigational weight because the header has no dropdown.
- [ ] **"Comprar por ocasión" strip**: pill links on a solid emerald band, each pointing at global search pre-filtered by that occasion. The links are correct even though the search page arrives in ticket 08.
- [ ] Section headings follow the locked pattern — centred, uppercase eyebrow above a serif H2.
- [ ] Soft radial floral ground behind the hero, per the visual direction.
- [ ] No trust/contact band on the home page — that content lives in the footer only.
- [ ] Prices render via `formatPrice`; all copy comes from the strings module.
- [ ] Responsive: the hero stacks and the grids reflow cleanly on a phone.
