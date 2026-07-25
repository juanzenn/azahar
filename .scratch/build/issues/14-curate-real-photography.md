# 14 — Curate real photography

**What to build:** Replace the placeholder images with real, license-safe photographs, so the
storefront looks like the boutique the visual direction describes rather than a wireframe. Pure asset
work — no code changes at all, because the spec deliberately stores complete image reference strings
that the UI never stitches together.

**Why this is a human ticket:** the seed manifest lists Unsplash **search pages**, not direct image
URLs. Choosing 29 photographs that look good together — consistent light, consistent styling, correct
subject — is a taste judgement, not something to delegate.

**Manifest:** [`seed/products.md`](../../seed/products.md) §4 — the 19 product intents and 10 category
heroes, each with its suggested Unsplash search.

Spec: [`spec.md`](../../spec.md) §4 (images).

**Blocked by:** 03 (establishes the filenames and the layout they must fit)

**Blocks:** nothing — the storefront is fully functional on placeholders. Do this whenever.

**Status:** ready-for-human

- [ ] All **19 product photographs** chosen from the manifest's suggested searches and saved at the **exact existing filenames**, overwriting the placeholders.
- [ ] All **10 category hero photographs** chosen and saved at their existing filenames.
- [ ] Every image is **portrait**, matching the card and hero treatment, so no layout shifts when placeholders are replaced.
- [ ] Photographs read as **one coherent set** — consistent enough in light and styling that the grid doesn't look like a collage from ten different shops.
- [ ] Each file is downloaded locally. **No runtime hotlinking**, which static export cannot support anyway.
- [ ] Images are compressed to a sensible weight for mobile — these render `unoptimized`, so there is no server resizing to lean on and the file you commit is the file customers download.
- [ ] Licensing confirmed: Unsplash License permits free commercial use with no attribution required. If any photo comes from elsewhere, its licence is checked and recorded.
- [ ] **No code changes.** If replacing the images requires touching a component, the image reference is being stitched together somewhere it shouldn't be — that's a bug in the data-reference approach, worth fixing rather than working around.

## Later

When the shop supplies its own photographs of real arrangements, this same ticket is the procedure —
drop the files at the same paths. That is the whole reason images are referenced as complete strings
in the data.
