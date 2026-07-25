# 07 — Checkout & order-dispatch flow

Type: grilling
Status: resolved
Claimed-by: j.alvarez
Blocked by: 01, 03

## Question

Define the checkout flow, given no backend order record and off-app payment:

- What customer info is collected (nombre, teléfono, dirección/entrega, fecha, mensaje de tarjeta…)?
- How is the payment method chosen and its **instructions shown** (using ticket 03's findings)?
- **Dispatch mechanism** — WhatsApp deep-link with the serialised cart? Email? Both? What exactly gets sent?
- What does the **order-confirmation** experience look like when nothing is persisted server-side?

## Answer

The checkout is a **pay-first, WhatsApp-dispatched** flow with **no server-side order record**. The app collects everything, shows the exact total and payment instructions, the customer pays out-of-band and enters the `referencia`, then a single `wa.me` deep-link carries the whole order to the shop. Everything runs client-side (consistent with ticket 02's fully-static build).

### 1. Dispatch mechanism — WhatsApp deep-link only

- A single **`wa.me` deep-link** carries the serialized order (ticket 03 mechanics: `https://wa.me/<cc+digits>?text=<encodeURIComponent(msg) once>`, `%0A` newlines, whole URL kept < ~2000 chars).
- **Text only** — a deep-link *cannot* pre-attach the payment screenshot, so the comprobante is sent **manually in the chat** (the message includes a reminder).
- **Fallback:** `/pedido-enviado` shows the shop's raw number + a copy button beside the "Abrir WhatsApp" button, so a missing/blocked WhatsApp never strands the order.
- No email, no `mailto:`, no third-party form service — those either reintroduce a backend dependency (ticket 02 ruled out) or duplicate the path unreliably.

### 2. Payment timing — pay-first, `referencia` captured in-app

- Flow shape: **show exact total → pick method → show account details → customer pays out-of-band → enter `referencia` → dispatch**. Chosen deliberately to mirror how a future backend/API checkout will work, so the UX won't be redesigned later.
- **Note:** payment *verification* and order *persistence* remain **out of scope** (future SaaS backend). What future-proofs for that is ticket 04's `CatalogSource` seam, not the flow ordering; pay-first is purely the UX shape. In this static build the `referencia` is captured and forwarded, not verified.
- Because the customer must see an exact number before paying, **delivery cost must be knowable in-app** — see §3.

### 3. Money — flat delivery fee, total exact in-app

- **Flat, configurable delivery fee** (may be set to 0) added to the cart subtotal. `Total = subtotal + envío`.
- **Retiro en tienda (pickup)** zeroes the fee.
- No zone-based pricing (a zona field exists only as courier info, not for pricing).

### 4. Customer info collected

**Comprador (always)**
- Nombre completo — **required**
- Teléfono / WhatsApp — **required**
- Email — **required**

**Entrega (always)**
- Método: `Envío a domicilio` (flat fee, reveals address block) / `Retiro en tienda` (fee = 0, no address) — **required**
- ☑ *"Es un regalo — enviar a otra persona"* → reveals recipient block

**Destinatario (only if gift)**
- Nombre del destinatario — **required**
- Teléfono del destinatario — **required if delivery**, else optional

**Dirección (only if Envío a domicilio)**
- Dirección de entrega — **required**
- Punto de referencia — optional
- Zona / sector — optional (courier info; not used for pricing)

**Programación (always)**
- Fecha de entrega/retiro — **required** (date picker, min = today)
- Franja horaria — optional (Mañana / Tarde / free text)

**Extras (always, optional)**
- Mensaje de tarjeta / dedicatoria — optional (textarea, ~200-char cap)
- De parte de (remitente) — optional (defaults to buyer name)
- Notas adicionales — optional

### 5. Payment method selection & instructions

- **All five rails supported, config-driven** (shop toggles each on/off without code changes): **Pago Móvil, Transferencia, Zelle, Binance/USDT, Efectivo**. Each renders the exact display fields from ticket 03 research (e.g. Pago Móvil = teléfono + cédula/RIF + banco 4-dígitos; Binance = Pay ID + wallet + **red** label; etc.). Real account values are config/content — placeholders in the spec.
- **Single-select radio** → reveals only the chosen method's account block with **copy buttons** → customer pays → a required **"Número de referencia"** field appears. The chosen method + referencia ride in the WhatsApp message; a note reminds the customer to attach the comprobante screenshot in the chat.
- **Efectivo exception:** treated as *pago contra entrega* — no `referencia`. Adds a **"¿Necesitas vuelto?"** toggle → when yes, a **"¿Con cuánto vas a pagar?"** amount field (e.g. "Pago con $50") so the shop brings change. This rides in the message.

### 6. Page layout — single page + sticky summary

- One `/finalizar-compra` page, sections top-to-bottom (Comprador → Entrega → Pago + referencia) with a **sticky order-summary card** (subtotal + envío + total).
- Final **"Enviar pedido por WhatsApp"** button at the end, **disabled** until required fields are valid + `referencia` present (non-Efectivo).
- Single page (not a wizard) is robust to the *leave-to-pay-and-return* moment — no step state to lose.

### 7. Handoff → confirmation

- Clicking Finalizar: validate → build order + `wa.me` URL → stash order in **`sessionStorage` (`azahar:lastOrder`)** → route to **`/pedido-enviado`**.
- `/pedido-enviado` shows: full order summary + **order code** + a prominent **"Abrir WhatsApp para enviar tu pedido 🌸"** button (the `wa.me` link) + **raw number/copy fallback** + a **"paga y envía tu comprobante en el chat"** reminder.
- The **cart is cleared** on arrival at `/pedido-enviado`. Confirmation is always seen, and the link is re-openable if the first WhatsApp attempt failed.

### 8. Order code

- Client-generated **`AZ-XXXX`** (4 base-36 chars), shown on confirmation and embedded in the message. It's a friendly reference label for the chat only — **nothing persists server-side**.

### 9. WhatsApp message template (the exact payload)

Built once through `encodeURIComponent`, `%0A` newlines, WhatsApp `*bold*` markers. **Sections appear only when relevant** (destinatario only if gift, dirección only if delivery, tarjeta/notas only if filled) to stay compact and under the URL ceiling.

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

*Destinatario (regalo)*
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

*Notas*
Entregar antes del mediodía si es posible
```

Efectivo variant of the Pago block:
```
*Pago*
Método: Efectivo (pago contra entrega)
Vuelto: Pago con $50   ← only if "necesito vuelto" checked
```

### 10. Cart & edge-case mechanics (minimum checkout depends on — no separate cart ticket)

- **Cart state:** React context (client island) backed by `localStorage` (`azahar:cart`); survives refresh, drives the header badge. A cart line stores `{ slug, qty }` only — name/price resolved from the catalog at render, so saved prices can't go stale.
- **Empty-cart guard:** `/finalizar-compra` with an empty cart → redirect to `/carrito` (empty state + "seguir comprando"). `/pedido-enviado` with no stashed order → redirect home.
- **Validation:** client-side; date min = today; phone/email are soft-format hints, not strict.

### Downstream / notes for spec assembly

- **Config/content placeholders** the builder must fill: shop WhatsApp number (cc+digits), flat delivery fee, and each enabled payment rail's account values.
- Ticket 08 (visual design) covers how these screens *look*; this ticket fixes structure, fields, and behavior only.
