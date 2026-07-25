# 06 — Category taxonomy & 50-item seed plan

Type: grilling
Status: resolved
Claimed-by: j.alvarez
Blocked by: 01

## Question

Decide the concrete seed content (no real client assets yet):

- The **10 categories** (candidates: ramos, rosas, arreglos, plantas, bodas, condolencias, cumpleaños, temporada, cajas, canastas…).
- The spread of **~50 items** across them, with names, price ranges, and facet values populated (per ticket 01).
- **Placeholder-image strategy** — Unsplash, generated, or solid placeholders? License-safe for a demo?

Output: a seed-content plan a builder can execute.

## Answer

Full seed-content plan authored as an asset: **[`seed/products.md`](../seed/products.md)** — a
builder transcribes it into `data/categories.ts` + `data/products.ts` (ticket 04 shapes).

**10 categories** (format axis only — occasion/flower-type stay facets per ticket 01):
`ramos` · `arreglos` · `cajas` · `canastas` · `floreros` · `plantas` · `coronas` ·
`centros-de-mesa` · `rosas-preservadas` · `detalles`.

**Facet vocabularies** (the enumerated content ticket 01 deferred here):
- Occasion (8, multi): `amor`, `cumpleanos`, `aniversario`, `bodas`, `condolencias`,
  `dia-de-la-madre`, `graduacion`, `nuevo-bebe`.
- Flower type (8, multi): `rosas`, `girasoles`, `orquideas`, `lirios`, `tulipanes`, `gerberas`,
  `claveles`, `mixtas`.
- Colour (8, multi): `rojo`, `rosado`, `blanco`, `amarillo`, `naranja`, `morado`, `azul`,
  `multicolor`.
- Size (3, single): `pequeno`, `mediano`, `grande`.

**50 products** — every field concrete (name, tagline, Spanish description, `priceUsdCents`,
category, all facets, size, featured, image). Weighted spread 8/7/6/5/5/5/4/4/3/3; price coverage
9/19/15/7 across the ticket-05 buckets; 7 featured (**flagship = p07 `ramo-deluxe-24-rosas`**).
Every facet value has ≥3 products so no filter dead-ends; foliage plants carry empty
flowerTypes/colours by design.

**Images:** curated **Unsplash** pool (19 product files + 10 category heroes), reused across
products, downloaded to local `public/images/` files (no runtime hotlink — static export,
ticket 04). Unsplash License = free commercial use, no attribution → license-safe for the demo.
Swapping in the client's real photos later is just replacing files at the same paths. Ticket 08
(visual direction) may refine the treatment but not the manifest.
