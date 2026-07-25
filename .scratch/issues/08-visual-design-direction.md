# 08 — Visual design direction (prototype)

Type: prototype
Status: resolved
Blocked by: 05
Assignee: j.alvarez@atrinium.com

## Question

Produce a rough visual prototype of the "very standard" flower-shop storefront to react to, and lock the design direction. At least: home, a product card, and product detail.

Decide from reacting to it: layout, card style, colour palette, imagery treatment (flowers are image-forward), typography feel, and how the advanced-search results page (ticket 09) should look within that direction.

Link the prototype as an asset.

## Asset

- Prototype (3 switchable directions A/B/C): [`.scratch/prototypes/08-visual-direction.html`](../prototypes/08-visual-direction.html) — published artifact: https://claude.ai/code/artifact/f7c892bb-2c7e-472f-94c8-132e944f11ad
- Not a git repo, so no throwaway branch — the file above **is** the captured primary source.

## Resolution

**Direction locked: B — "Jardín" (editorial boutique).** User: "B all the way." No mix-and-match; B adopted as shown in the prototype.

- **Layout** — asymmetric hero: headline/CTA column left, full-bleed image panel right (stacks on mobile). Generous whitespace; section heads centred with an uppercase eyebrow + serif H2. Categories = bordered cell-grid (10 cells, hairline gaps). "Comprar por ocasión" = pill strip on a **solid emerald band**.
- **Card style** — tall **portrait** image tile, edge-to-edge (no border), subtle hover **scale(1.05)** on the image. Meta centred below: uppercase category eyebrow · serif product name · price in emerald. **No quick-add on the card** — whole card links through to the PDP. (Contrast: A had a dense quick-add card, rejected.)
- **Palette** — warm off-white ground `--bg #faf8f3`, panel `#f2eee5`; ink `#21201d`, muted `#6d6a63`; hairline `#e7e2d8`. **Primary accent = deep emerald `#1f4d3a`** (CTAs, prices, active pagination). **Secondary = plum `#5f2a52`** (eyebrows, "Limpiar todo"). Tertiary gold `#b08542`. Deliberately *not* the terracotta-cream florist default.
- **Imagery treatment** — portrait aspect, edge-to-edge, photography-forward and large; soft radial floral grounds behind hero/PDP; hover-zoom. Real photos come from the ticket-06 curated Unsplash pool.
- **Typography** — **serif display** (stack: `ui-serif, "Iowan Old Style", "Palatino Linotype", Georgia, "Times New Roman", serif`) for logo, headings, product names; sans (`ui-sans-serif, system-ui`) for body/UI/prices. Eyebrow labels uppercase, wide letter-spacing (~.28em). Final webfont pairing is a build-time detail on top of this feel (ticket 02 said no i18n/font lib mandated; shadcn default sans + a serif display face).
- **Advanced-search results (ticket 09) within B** — discreet facet sidebar: **serif group headings**, **circular** colour swatches, radio/checkbox lists each with a "Cualquiera" clear-row + right-aligned counts and disabled-zero rows; serif results heading (e.g. "Rosas") + muted result count; rounded pill active-chips with a plum "Limpiar todo"; **underlined** (borderless) select for sort; **circular** numbered pagination with emerald active state. Everything else stays as locked in ticket 09 (Model B island, within-facet OR / across-facet AND, 12/page, chip removal, etc.) — B only sets the *visual* treatment.

Design tokens above are the build-ready input; a builder styles Tailwind/shadcn theme from them.
