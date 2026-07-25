# 06 — Product detail page

**What to build:** A customer can open any arrangement on its own page, see it large enough to judge
with their eyes, read what's actually included, know the price unambiguously, and move sideways to
alternatives in the same category. Every product has its own shareable URL, so a specific arrangement
can be sent to someone.

Add-to-cart is deliberately **not** here — it arrives with the cart slice (ticket 10), which owns all
cart behaviour in one place.

Spec: [`spec.md`](../../spec.md) §5 (routes, breadcrumbs, related row), §10 (visual direction).

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [ ] `/producto/[slug]` is a static Server Component reading through the seam, with all 50 product pages prerendered at build time.
- [ ] A **large portrait photograph**, edge-to-edge and photography-forward, with a soft radial floral ground behind it.
- [ ] The product's **full description**, its serif name, its uppercase category eyebrow, and its price in emerald via `formatPrice`.
- [ ] **Breadcrumbs**: `Inicio / {primary category} / {product name}`, derived from the product's single category, with working links.
- [ ] A **"Más de esta categoría" row**: other products from the same primary category, the current product excluded, capped at ~4, rendered with the same product card as the home page.
- [ ] An **unknown slug calls `notFound()`** and lands on the Spanish 404 — driven by the seam returning `null`, not by a thrown error.
- [ ] The page is fully static with near-zero client JS — nothing on it is interactive yet.
- [ ] All copy from the strings module; the card component is reused, not re-implemented.
- [ ] Responsive: image and copy stack sensibly on a phone without cropping the photograph awkwardly.
