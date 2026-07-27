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

**Status:** done

- [x] All **19 product photographs** chosen from the manifest's suggested searches and saved at the **exact existing filenames**, overwriting the placeholders.
- [x] All **10 category hero photographs** chosen and saved at their existing filenames.
- [x] Every image matches the card and hero treatment, so no layout shifts when placeholders are replaced. Products are portrait 900×1200 and category heroes landscape 1200×900 — the dimensions ticket 03 established and `/categorias`' `aspect-[4/3]` cells were designed against. "Portrait" as written here predates that split; matching the placeholder exactly is what the criterion is actually for.
- [x] Photographs read as **one coherent set** — bright natural light, soft palettes, subject against a plain or shallow-depth background. The pool's two dark studio shots are among the eight that went unused rather than break that.
- [x] Each file is downloaded locally. **No runtime hotlinking**, which static export cannot support anyway.
- [x] Images are compressed to a sensible weight for mobile: 29 files, 39–216 KB, mean 104 KB, 3.0 MB total (mozjpeg q82).
- [x] Licensing confirmed: every photograph is Unsplash License — free commercial use, no attribution required. Photographer and photo URL recorded per file anyway in [`source-photos/CREDITS.md`](../../source-photos/CREDITS.md), which is what makes the licence claim checkable later.
- [x] **No code changes.** Nothing under `app/`, `components/`, `lib/` or `data/` was touched, and no component was needed to place an image. The change is `public/images/`, the originals moved out of `public/`, and the planning docs.

## What was done

The 15 photographs staged in `public/unsplash/` filled 8 of the 29 slots — 7 photographs, one of them
serving both a product and its category hero — and left six subjects with no plausible match at all:
gift box, basket, funeral wreath, preserved-rose dome, succulent, green plant, between them backing 15
of the 50 products. The pool also skewed to five orchids against two orchid slots, which is why 8 of
it went unused. The other 21 slots were curated from the manifest's suggested searches through the
Unsplash API, against the same six criteria above.

Two crops needed framing by hand rather than by automatic gravity, both recorded in
[`source-photos/CREDITS.md`](../../source-photos/CREDITS.md): the preserved-rose dome (the gravity
framed the bouquet standing behind it) and the potted plant (its pot sat at the bottom of the frame and
was being cropped away).

The originals moved from `public/unsplash/` to `.scratch/source-photos/`. They were shipping in the
static export — `output: "export"` copies all of `public/` — so 35 MB of unreferenced full-res
photography was being deployed. The export is now 13 MB.

## Later

When the shop supplies its own photographs of real arrangements, this same ticket is the procedure —
drop the files at the same paths. That is the whole reason images are referenced as complete strings
in the data.
