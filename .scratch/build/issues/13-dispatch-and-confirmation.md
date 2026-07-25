# 13 — Dispatch + confirmation

**What to build:** The payoff for the whole build. The customer presses one button and WhatsApp opens
with their entire order already written out — line items, totals, delivery details, recipient, payment
method and reference — and all they do is press send. They land on a confirmation page carrying their
order code and a record of what they asked for, with the WhatsApp link still there in case the first
attempt failed and the shop's raw number if WhatsApp isn't installed at all.

Nothing persists server-side. The order exists in the message.

Spec: [`spec.md`](../../spec.md) §9 (dispatch, handoff, order code, message template), Testing Decisions.

**Blocked by:** 12

**Status:** ready-for-agent

- [ ] Submitting builds the order and a **single `wa.me` deep-link**: number is country-code + digits only (no `+`, no leading zero, no dashes), the whole message **encoded exactly once**, newlines as `%0A`.
- [ ] The whole URL stays **under ~2000 chars**, asserted in a test against a deliberately large cart.
- [ ] **Message sections appear only when relevant** — recipient only if it's a gift, address only on delivery, tarjeta and notas only if filled — to stay readable and under the URL ceiling. WhatsApp `*bold*` markers throughout. The locked template (inlined because the conditional structure *is* the decision):

  ```
  Hola Azahar 🌸 Quiero confirmar mi pedido *AZ-7K3Q*

  *Productos*
  • 2x Ramo Primavera — $25 c/u
  • 1x Girasoles Radiantes — $18
  Subtotal: $68
  Envío: $5
  *Total: $73*

  *Entrega*
  Tipo: Envío a domicilio
  Fecha: 2026-07-25 (Tarde)
  Dirección: Av. Principal, Edif. Sol, Apto 4B
  Punto de referencia: frente a la panadería
  Zona: Chacao

  *Destinatario (regalo)*      ← only if gift
  Nombre: María Pérez
  Teléfono: 0412-1234567
  Tarjeta: "Feliz cumpleaños ❤️"
  De parte de: Juan

  *Comprador*
  Nombre: Juan Álvarez
  Teléfono: 0414-9876543
  Email: juan@example.com

  *Pago*
  Método: Pago Móvil
  Referencia: 123456789
  (Te envío el comprobante en este chat 📎)

  *Notas*                      ← only if filled
  Entregar antes del mediodía si es posible
  ```

- [ ] **Efectivo variant** of the payment block: `Método: Efectivo (pago contra entrega)` plus `Vuelto: Pago con $50` **only** when change was requested.
- [ ] A client-generated **`AZ-XXXX`** order code (4 base-36 chars) appears in the message and on the confirmation page. Its randomness source is **injectable**, or the code is untestable.
- [ ] On submit the order is stashed in **`sessionStorage`** and the customer is routed to `/pedido-enviado`.
- [ ] `/pedido-enviado` shows: the **full order summary**, the **order code**, a prominent **"Abrir WhatsApp para enviar tu pedido 🌸"** button carrying the deep-link, the **raw shop number with a copy button** beside it, and the **comprobante reminder**.
- [ ] The **cart is cleared on arrival** at the confirmation page — so a reload cannot produce a duplicate order — while the WhatsApp link stays **re-openable** if the first attempt failed.
- [ ] Landing on the confirmation page **with no stashed order redirects home**, never showing an empty broken page.
- [ ] The customer must press Send in WhatsApp themselves; there is no auto-send, and the UI does not imply otherwise.
- [ ] `lib/order` tests cover: message assembly with sections conditionally present, the efectivo variant, **encoded exactly once** (no double-encoding), `%0A` newlines, the URL-length ceiling, and order-code generation via the injected randomness source.
- [ ] **Text only** — no attempt to pre-attach the comprobante, which a deep-link cannot do. No email, no `mailto:`, no third-party form service.
