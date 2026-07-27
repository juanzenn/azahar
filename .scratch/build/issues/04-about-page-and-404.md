# 04 — About page + Spanish 404

**What to build:** Two small pages that make the site feel finished rather than under construction. A
customer weighing whether this is a real shop can read an "acerca de" page; a customer who follows a
dead or mistyped link gets a Spanish page that offers a way back, instead of something that reads as
broken.

Small and independent — deliberately parallelisable with the catalog work.

Spec: [`spec.md`](../../spec.md) §5 (route inventory).

**Blocked by:** 01

**Status:** done

- [x] `/nosotros` exists with real Spanish static copy about the shop — enough to establish credibility, not lorem ipsum.
- [x] A **Spanish not-found page** exists, styled inside the global chrome, with links back to the home page and the catalog.
- [x] Both pages are static Server Components carrying near-zero client JS.
- [x] Both sit inside the sticky header and footer from ticket 01, so navigation is never lost.
- [x] Both use the Jardín type scale and palette — serif headings, warm ground — rather than default browser styling.
- [x] All copy comes from the strings module; no inline Spanish literals.
- [x] The footer's about link points at `/nosotros` and works.
- [x] There is **no contact page** — contact deliberately lives in the footer only.
