# 10 — Cart

**What to build:** A customer can add an arrangement from its page without being yanked away, watch
the header badge tick up, come back tomorrow to find the cart still there, adjust quantities, remove
a line, and see what the goods cost before delivery is considered. Prices always reflect the current
catalog, so a cart saved last week can never quote a price the shop no longer offers.

Spec: [`spec.md`](../../spec.md) §8 (cart), Testing Decisions.

**Blocked by:** 06

**Status:** done

- [x] Cart state is a **client island backed by `localStorage`**, surviving refresh and tab close.
- [x] **A cart line stores only `{ slug, qty }`.** Name and price are resolved from the catalog **at render**, which is what makes stale prices structurally impossible.
- [x] **Add-to-cart on the product page**: the customer stays on the page (no navigation, no modal takeover) and gets clear confirmation the item was added.
- [x] The **header cart badge** shows the live item count and updates immediately on add.
- [x] Adding a product **already in the cart increments its quantity** rather than creating a duplicate line.
- [x] `/carrito` lists each line with its image, name, unit price, quantity and line total.
- [x] Quantities can be **changed** from the cart; lines can be **removed**.
- [x] The cart shows a **subtotal** computed from catalog prices.
- [x] A **persisted slug that no longer exists in the catalog is dropped gracefully** — it must not crash the badge, the cart page or checkout.
- [x] Corrupt or absent stored JSON is handled without throwing; the customer just gets an empty cart.
- [x] **Empty cart** shows a real empty state with a "seguir comprando" route back into the catalog, not a blank page.
- [x] `lib/cart` tests cover: add, add-existing incrementing, quantity change, removal, **subtotal from catalog prices rather than stored ones**, corrupt/absent stored JSON, and the stale-slug drop.
- [x] Prices render via `formatPrice`; all copy from the strings module.
