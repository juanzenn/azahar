# 03 — Image assets

**What to build:** Every image the storefront references exists as a real local file at the exact
path stored in the catalog data, so product cards, hero panels and category cells render at their
true portrait proportions with no broken images and no layout shift. Photography quality comes later
(ticket 14); this ticket's job is that the layout is honest and every downstream page is unblocked.

**Decision (agreed during ticket breakdown):** the seed manifest lists Unsplash *search* pages, not
direct image URLs, so photo selection is not something to guess at here. This ticket commits
**generated placeholder images** at the manifest's filenames and correct aspect ratios. Ticket 14
swaps in curated photography at the same paths — which the spec already treats as a file swap
requiring no code change.

**Manifest:** [`seed/products.md`](../../seed/products.md) §4 — 19 product files + 10 category heroes.

Spec: [`spec.md`](../../spec.md) §4 (images), §1 (static export consequences).

**Blocked by:** 01

**Status:** done

- [x] All **19 product image files** exist at the manifest's filenames (subject-named and reused across the 50 products — e.g. one red-rose-bouquet file serves several products).
- [x] All **10 category hero files** exist, one per category slug.
- [x] Placeholders are **portrait aspect** matching the card treatment, so no downstream layout is designed against the wrong proportions. Each is visually distinguishable (subject label and/or a distinct tint from the Jardín palette) rather than 29 identical grey boxes — a wrong image must be *noticeable*.
- [x] Filenames match the manifest **exactly**, since ticket 14 swaps files in place at these paths.
- [x] Images are referenced from the catalog data as **complete root-relative reference strings** the UI never stitches together from parts. This is what lets a local path become an absolute CDN URL under a future API with no UI change.
- [x] Rendering goes through `next/image` with **`unoptimized`** — static export means no server-side resizing — while keeping layout stability and lazy loading.
- [x] **No runtime hotlinking** to any external host; every file is served from the build output.
- [x] Every image reference in the seed data resolves to a file that actually exists. Worth asserting in a test — a typo'd path is otherwise invisible until someone looks at the page.

## Note

Ticket 04 of the wayfinder map specified per-product WebP filenames; ticket 06's manifest specified a
reused subject-named JPEG pool. These are mutually exclusive and **the manifest won** — see
[`spec.md`](../../spec.md) §4 for the resolution. The spec is authoritative; the older wording still
sits in the decision tickets.
