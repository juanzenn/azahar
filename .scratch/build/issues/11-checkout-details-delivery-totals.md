# 11 — Checkout: details, delivery, totals

**What to build:** A customer with a cart can fill in everything the shop needs to actually deliver
flowers — who they are, whether it's delivery or pickup, where to, when, for whom, and what the card
should say — on **one page**, with a summary that stays visible and shows the exact total including
delivery. Fields appear and disappear as choices are made, so nobody is asked for a recipient's phone
when they're collecting it themselves.

**The page is deliberately not submittable yet.** Payment and the submit gate are ticket 12 — the
submit control depends on payment state, so splitting it here would mean building the gate twice.

Spec: [`spec.md`](../../spec.md) §9 (fields, money, page layout), Testing Decisions.

**Blocked by:** 10

**Status:** ready-for-agent

- [ ] `/finalizar-compra` is a **single page**, not a wizard — deliberately robust to the leave-to-pay-and-return moment, since there is no step state to lose.
- [ ] Sections run top-to-bottom: **Comprador → Entrega → Programación → Extras**, with the payment section's place left for ticket 12.
- [ ] A **sticky order-summary card** stays visible while scrolling, showing line items, **subtotal + envío + total** as three separate figures.
- [ ] **Comprador**, all required: nombre completo, teléfono/WhatsApp, email.
- [ ] **Entrega method required**: *envío a domicilio* (adds the flat fee, reveals the address block) or *retiro en tienda* (**fee = 0**, no address block).
- [ ] The **flat delivery fee is configurable** (and may be zero) — not hard-coded at a call site. No zone-based pricing.
- [ ] `total = subtotal + envío`, exact and visible **before** any payment step, which is the whole reason the fee is flat.
- [ ] An **"es un regalo — enviar a otra persona"** checkbox reveals the **Destinatario** block: recipient name **required**; recipient phone **required when delivery**, optional on pickup.
- [ ] **Dirección block (delivery only)**: dirección **required**; punto de referencia optional; zona/sector optional and explicitly **courier information, not used for pricing**.
- [ ] **Programación**: fecha **required** via a date picker with **min = today** so an impossible order cannot be created; franja horaria optional (mañana / tarde / free text).
- [ ] **Extras**, all optional: mensaje de tarjeta (~200-char cap), "de parte de" **defaulting to the buyer's name**, notas adicionales.
- [ ] Required fields are **visibly marked as required before submission is attempted** — the customer should not have to guess.
- [ ] Validation is **client-side**; phone and email are **soft-format hints, not strict** validation.
- [ ] **Empty-cart guard**: reaching checkout with an empty cart redirects to the cart page, so nobody fills in a form for nothing.
- [ ] `lib/order`'s `validate` covers the **conditional-required web** as pure logic: gift ⇒ recipient name; gift + delivery ⇒ recipient phone; delivery ⇒ address; pickup ⇒ no address required and fee zeroed. (The non-efectivo ⇒ referencia rule arrives with ticket 12.)
- [ ] Money math is tested: subtotal from catalog prices, fee added on delivery, fee zeroed on pickup.
- [ ] All copy from the strings module; all prices via `formatPrice`.
