# 03 — Research: WhatsApp Click-to-Chat + Venezuelan manual-payment methods

Type: research
Status: resolved
Claimed-by: j.alvarez (research subagent)

## Question

Surface the external facts that checkout (ticket 07) depends on. AFK — resolved by a `/research` subagent, findings captured at `.scratch/azahar/research/whatsapp-payments.md` and linked here.

1. **WhatsApp Click-to-Chat / `wa.me` deep-links** — capabilities & limits: message pre-fill syntax, URL-encoding rules, practical message-length limits, mobile vs desktop/web behaviour, whether a formatted cart (line items + total) can be serialised into the opening message. Any newer `api.whatsapp.com` differences.
2. **Venezuelan manual-payment methods** — the common rails (Pago Móvil, transferencia bancaria, Zelle, Binance/USDT, efectivo USD) and the **exact data each needs** to render clear customer instructions (e.g. Pago Móvil = teléfono + cédula/RIF + código de banco).

Cite primary/high-trust sources.

## Answer

Full report: [`.scratch/azahar/research/whatsapp-payments.md`](../research/whatsapp-payments.md). Actionable findings for checkout (ticket 07):

**WhatsApp deep-link**
- Use `https://wa.me/<number>?text=<encoded>`; number = country-code + digits only, no `+`/leading zeros/dashes (VE example: `584121234567`). Long form: `https://api.whatsapp.com/send?phone=&text=`.
- Encode the whole message once with `encodeURIComponent()` (space→`%20`, newline→`%0A`, emoji auto-encode). A multi-line cart (items + total joined by `%0A`) serialises reliably — **don't double-encode**.
- No documented text cap; real limit is total URL length — keep under ~2,000 chars (a cart is fine).
- Mobile opens the app, desktop opens WhatsApp Web; user **must press Send** (no auto-send). If WhatsApp isn't installed there's no graceful fallback → **also show the raw number + a copy button.**

**Venezuelan payment instructions to display**
- **Pago Móvil**: teléfono + cédula/RIF + banco (4-digit code, e.g. 0102/0105/0134) — no account number.
- **Transferencia**: 20-digit cuenta + titular + cédula/RIF + banco.
- **Zelle**: registered email/US-phone + titular name. **Binance**: Pay ID (or email/QR) and/or wallet + red (label TRC20). **Efectivo USD**: in person.
- Norm: buyer pays first, then sends screenshot + **número de referencia** via WhatsApp → checkout should capture/prompt for the referencia per order.

Caveat: WhatsApp's FAQ is a JS SPA that couldn't be rendered by fetch; wa.me syntax is cited to the official FAQ URL + a corroborating source that reproduces it verbatim.
