# Azahar — Research (ticket 07): WhatsApp checkout link + Venezuelan payment instructions

_Researched 2026-07-20. Sources listed at bottom; every claim is tagged **[Documented]** (stated in a primary/authoritative source) or **[Common practice]** (widely-followed convention, not in an official spec)._

---

## Bottom line for checkout (ticket 07)

1. **Use `https://wa.me/<number>?text=<url-encoded-message>`** for the "Order via WhatsApp" button. `<number>` = country code + number, **digits only** — no `+`, no leading zeros, no spaces/dashes/parentheses (Venezuela example: `584121234567`). This is the documented, recommended form. `https://api.whatsapp.com/send?phone=<number>&text=<...>` is the equivalent long form and behaves the same. **[Documented]**
2. **URL-encode the whole message** with `encodeURIComponent()`. Spaces → `%20`, **line breaks → `%0A`**, emoji are percent-encoded UTF-8 (🌸 → `%F0%9F%8C%B8`). A multi-line cart (line items + total) serialises fine using `%0A` between lines. **[Documented + Common practice]**
3. **There is no officially documented character cap on the prefilled `text`.** The real constraint is total **URL length** — keep the whole link under ~2,000 characters for universal compatibility. Overlong prefills get silently truncated or the link fails to open. For a cart, that's plenty (dozens of line items), but don't dump unbounded content. **[Common practice]**
4. **Behaviour:** on mobile the link opens the WhatsApp app with the message pre-typed; on desktop it opens WhatsApp Web / the desktop app. **The customer always has to press Send** (we can't auto-send). If WhatsApp isn't installed there's no graceful fallback — the user hits an install prompt or a dead end, so pair the button with a visible fallback (plain phone number / copy-to-clipboard). **[Documented + Common practice]**
5. **Payment instructions to display** (manual/off-app; buyer pays then sends a comprobante):
   - **Pago Móvil** — the standard trio: **teléfono afiliado, cédula/RIF, banco (código de 4 dígitos, e.g. 0102/0105/0134)**. No account number needed. **[Documented]**
   - **Transferencia bancaria** — **número de cuenta (20 dígitos), titular (nombre exacto), cédula/RIF, banco**. **[Documented]**
   - **Zelle** — **email (o teléfono US) registrado + nombre del titular**; requires a US-bank-linked account (or an intermediary wallet like Zinli/Koroto). **[Documented]**
   - **Binance / USDT** — **Binance Pay ID (o email/teléfono registrado o QR)** for Binance-to-Binance; or **wallet address + red (TRC20 / BEP20 / ERC20)** for on-chain. Network label is mandatory — wrong network = lost funds. **[Documented]**
   - **Efectivo en USD/divisas** — no digital fields; show as in-person / on-delivery cash option. **[Common practice]**
6. **Comprobante norm:** buyers pay first, then send a **screenshot ("capture") + número de referencia** (usually over WhatsApp). Each Pago Móvil/transfer generates a unique reference; verify against the receiving bank's SMS/notification, **not** against the customer's image (fake-capture generators exist). Design checkout to ask for the reference/comprobante. **[Common practice / Documented]**

---

## TOPIC 1 — WhatsApp Click-to-Chat / wa.me deep links

### 1.1 The two link formats

**Short / canonical form (recommended):**
```
https://wa.me/<number>?text=<url-encoded-message>
```
- `<number>` is a **full phone number in international format** (country code + subscriber number). **[Documented — WhatsApp FAQ "How to use click to chat"]**
- WhatsApp's own guidance: use `https://wa.me/15551234567`; **do not** use `https://wa.me/+001-(555)1234567`. **Omit any zeroes, brackets, or dashes; do not include the `+`.** **[Documented]**
- Prefilled message: `https://wa.me/<number>?text=<urlencodedtext>` where the text is the **URL-encoded** pre-filled message. **[Documented]**
- Number-less variant: `https://wa.me/?text=<urlencodedtext>` creates a link with just a message and lets the user pick a recipient (share sheet). **[Documented]** — not needed for Azahar since the shop number is fixed.

**Long form (equivalent):**
```
https://api.whatsapp.com/send?phone=<number>&text=<url-encoded-message>
```
- Same phone-number rules; parameters are `phone=` and `text=`. **[Documented]**

**Difference between them:** functionally the same for click-to-chat — both open a chat with the given number and pre-fill `text`. `wa.me` is the short, shareable form WhatsApp promotes for links/QRs; `api.whatsapp.com/send` is the older long form (and is effectively what `wa.me` resolves to on the web). One third-party guide (AppsFlyer) recommends reserving `wa.me` for marketing/QR/web and treating `api.whatsapp.com` as the enterprise/Business-API host — that's their routing opinion, **not** an official restriction; the `/send?phone=&text=` endpoint is plain click-to-chat and works for anyone. **[Documented (equivalence) + vendor opinion]**

> Note: `wa.me` links had a global outage/HTTP-429 incident in Oct 2025 — a reminder to keep a non-`wa.me` fallback (raw number) visible on the page. **[Documented — PiunikaWeb report]**

### 1.2 URL-encoding rules for `text`

- Encode the message with `encodeURIComponent()` (JS) or equivalent. **[Common practice — standard RFC 3986 percent-encoding]**
- Space → `%20` (a literal `+` is also decoded to space in query strings, but `%20` is safest). **[Documented — WhatsApp FAQ says "URL-encoded"; AppsFlyer: "Spaces become %20"]**
- **Newline / line break → `%0A`** (LF). This is how you get multi-line messages. **[Common practice — confirmed working; standard percent-encoding of `\n`]**
- Punctuation that must be encoded so it isn't read as URL syntax: `,` → `%2C`, `'` → `%27`, `?` → `%3F`, `&` → `%26`, `#` → `%23`, `/` → `%2F`, `:` → `%3A`. Example transformation (AppsFlyer): `Hi, I'd like more info` → `Hi%2C%20I%27d%20like%20more%20info`. **[Documented]**
- **Emoji / non-ASCII**: percent-encoded as their UTF-8 bytes; `encodeURIComponent` handles this automatically (e.g. 🌸 → `%F0%9F%8C%B8`, á → `%C3%A1`). Emoji render fine in the prefilled message. **[Common practice]**

**Implementation tip for Azahar:** build the message string with real `\n` between lines and run the whole thing through `encodeURIComponent()` once — don't hand-encode, and don't double-encode.

### 1.3 Message-length limits

- **No official cap is documented for the prefilled `text` parameter specifically.** **[Documented absence — not stated in WhatsApp FAQ]**
- WhatsApp's per-message ceiling is widely reported as **65,536 characters (2¹⁶)** for a normal chat message; Business **template** messages are capped at **1,024**. These are message limits, not link limits. **[Common practice / widely reported — not a citable primary WhatsApp spec]**
- The **binding constraint in practice is total URL length.** There's no RFC limit, but for cross-browser/OS reliability keep the entire URL **under ~2,000 characters** (legacy hard limits were ~2,083 in old IE; modern browsers allow more but WhatsApp's handlers may truncate). **[Common practice]**
- What breaks in practice: overly long prefills get **truncated** or the link silently fails to open; guidance from tooling vendors is to **keep prefilled messages concise**. **[Common practice — uChat, Engati, PickyAssist]**
- **For a cart this is a non-issue**: a formatted order with line items + total is well within limits. Just avoid pasting unbounded free text (e.g. entire product descriptions).

### 1.4 Behaviour: mobile vs desktop vs not-installed

- **Mobile (app installed):** opens the WhatsApp app in a chat with the shop number, message pre-typed. **[Documented — WhatsApp FAQ]**
- **Desktop:** opens **WhatsApp Web** (or the desktop app if installed/linked). **[Documented / Common practice]**
- **The user must tap Send.** Click-to-chat never auto-sends; this is by design ("keeps the interaction genuine, avoids sending without consent"). So Azahar's flow ends at "message pre-filled" — treat the WhatsApp order as *submitted by the customer*, not auto-received. **[Documented]**
- **WhatsApp not installed:** native `wa.me` links have **no fallback control** — the customer "may see an error or a dead end," or an install/QR prompt. Mitigation: also show the plain number + a copy button, and/or the payment instructions inline, so the order can proceed without the deep link. **[Documented — AppsFlyer]**

### 1.5 Serialising a formatted cart — gotchas

- **Yes, a multi-line cart serialises reliably** using `%0A` between lines. Example (pre-encoding):
  ```
  Hola Azahar 🌸, quiero pedir:
  - 1x Ramo Primavera — $25
  - 2x Girasoles — $18 c/u
  Total: $61
  ```
  Then `encodeURIComponent(msg)` → append as `?text=`.
- Gotchas:
  - Encode once with `encodeURIComponent`; hand-mixing `%20`/`+` or double-encoding produces literal `%2520` garbage. **[Common practice]**
  - Keep it compact (names, qty, price, total) to stay well under the URL-length ceiling. **[Common practice]**
  - `%0A` (LF) is the reliable newline; avoid relying on `%0D%0A` (CRLF). **[Common practice]**
  - Currency/`&`/`#` inside item names must be encoded (they're handled by `encodeURIComponent`). **[Common practice]**

### 1.6 Number formatting (for the shop's own number)

- Store the shop number as **country code + number, digits only, no `+`, no leading zero.** Venezuela mobile example: local `0412-123-4567` → `584121234567` (country code 58, drop the leading 0). **[Documented — WhatsApp FAQ number rules]**

---

## TOPIC 2 — Venezuelan manual / off-app payment methods

For each rail, the exact fields the merchant must display so the buyer can pay.

### 2.1 Pago Móvil (P2P — the dominant local rail)

- **Fields to show (the standard trio):**
  1. **Teléfono** — the mobile number affiliated to the account. **[Documented — Banesco, BDV]**
  2. **Cédula o RIF** — beneficiary's ID (V/E for personas, J/G for empresas). **[Documented]**
  3. **Banco** — identified by a **4-digit bank code** ("cada banco tiene su código diferenciador"), e.g. **Banco de Venezuela 0102, Mercantil 0105, Banesco 0134.** **[Documented — El Estímulo códigos list]**
- **No account number is required** for Pago Móvil — only teléfono + cédula/RIF + banco. Banesco: _"Para realizar pagos solo requieres el número de teléfono, la cédula de identidad o RIF, el banco."_ **[Documented — Banesco]**
- The receiver must be **afiliado al servicio Pago Móvil** at their bank to get paid. **[Documented — Banesco]**

### 2.2 Transferencia bancaria

- **Fields to show:**
  1. **Número de cuenta** — the full **20-digit** account number. **[Documented]**
  2. **Titular** — account-holder name; must match exactly. Fonmoney: _"El nombre del destinatario debe coincidir exactamente con el titular de la cuenta bancaria."_ **[Documented]**
  3. **Cédula o RIF** of the titular. **[Documented]**
  4. **Banco** (name). **[Documented]**
- Same-bank/interbank instant transfers are the norm; buyer receives a confirmation/reference on completion. **[Documented]**

### 2.3 Zelle (USD, for buyers with US banking)

- **Fields to show:** the **registered email address** (and/or the registered **US phone number**) plus the **nombre del titular** of the Zelle-linked account. **[Documented — Efecto Cocuyo]**
- Constraint: Zelle works only with **US bank accounts**; Venezuelan merchants either hold a US account or use an **intermediary wallet** (Zinli, Koroto, AirTM, etc.) that gives them a receiving email. The sender just "realiza un pago a una dirección de correo electrónico." **[Documented]**
- Practically, the merchant should display: **Zelle email**, **beneficiary name**, and note "confirm amount/rate before sending."

### 2.4 Binance / USDT (crypto)

- **Binance Pay (Binance-to-Binance):** show your **Pay ID** (or **email/phone registered with Binance**, or a **QR**). Remesas.com: _"Le compartes tu Pay ID o QR a quien te va a mandar el dinero."_ **[Documented]**
- **On-chain USDT:** show your **wallet (deposit) address** **and the network / red** — **TRC20** (Tron; cheap/fast, most common in VE), BEP20, or ERC20. _"Selecciona la red correcta (TRC20, ERC20, etc.)"_ — **wrong network = permanent loss of funds.** So the **network label is a required field**, not optional. **[Documented]**
- Recommended display: **Pay ID** (for Binance users) **+** wallet address **+ RED: TRC20** (for on-chain), plus a warning to match the network.

### 2.5 Efectivo en USD / divisas

- Cash in USD (and increasingly EUR) is widely accepted in-store and on delivery. No digital fields — present as an **in-person / pago contra entrega** option; optionally note whether change is given and the reference rate used. **[Common practice]**

### 2.6 Referencia / comprobante norm (applies to all off-app rails)

- **Standard flow: pay first, then send proof.** The buyer takes a **screenshot ("capture") of the payment confirmation** and sends it — **usually via WhatsApp** — as evidence. **[Common practice — Kharyo]**
- The comprobante shows **monto, fecha, banco emisor, and número de referencia.** Each Pago Móvil/transfer generates a **unique referencia.** **[Common practice / Documented]**
- **Verification:** an organised merchant matches the **reference number against the receiving bank's SMS/notification or statement**, not against the customer's image — **fake-capture generator sites exist** and have been reported. **[Documented — Efecto Cocuyo (Cocuyo Chequea)]**
- **Checkout implication:** after showing payment instructions, collect the **número de referencia** and/or a **comprobante upload**, tied to the order, so the shop can reconcile against its bank notifications.

---

## Sources

**Topic 1 — WhatsApp**
- WhatsApp Help Center — How to use click to chat (official): https://faq.whatsapp.com/5913398998672934/
- WhatsApp Help Center — How to link to WhatsApp from a different app (official): https://faq.whatsapp.com/425247423114725/
- BusinessChat — How to build a WhatsApp click-to-chat URL (wa.me) [reproduces official syntax]: https://help.businesschat.io/en/articles/6517838-how-to-build-a-whatsapp-click-to-chat-url-wa-me
- AppsFlyer — WhatsApp deep links: how to create, use, and measure them: https://www.appsflyer.com/blog/deep-linking/whatsapp-deep-link/
- PiunikaWeb — wa.me links broken / HTTP 429 (Oct 2025 outage): https://piunikaweb.com/2025/10/22/whatsapp-wa-me-links-http-error-429/
- uChat — Customizing pre-filled text for WhatsApp and workarounds (truncation guidance): https://uchat.au/uchat-training/whatsapp-pre-fill-text-for-whatsapp-and-workaround
- Engati — WhatsApp text truncation: https://www.engati.ai/blog/whatsapp-new-update-text-truncation
- PickyAssist — Character limits WhatsApp: https://help.pickyassist.com/general-guidelines/character-limits-whatsapp

**Topic 2 — Venezuelan payments**
- Banesco — PagoMóvil para Personas (fields required): https://www.banesco.com/personas/banca-digital-personas/pagomovil/
- Banco de Venezuela — PagomóvilBDV: https://www.bancodevenezuela.com/index.html@p=3457.html
- El Estímulo — Códigos de pago móvil (4-digit bank codes list): https://elestimulo.com/elinteres/de-interes/2025-10-21/codigos-pago-movil/
- Fonmoney — Qué datos necesita el destinatario para enviar dinero a Venezuela (transferencia fields): https://www.fonmoney.es/blog/datos-beneficiario-cuenta-bancaria-venezuela
- Efecto Cocuyo — Cómo recibir Zelle en Venezuela sin cuenta en EE.UU: https://efectococuyo.com/economia/como-recibir-zelle-venezuela/
- Remesas.com — Cómo enviar y recibir dinero por Binance y Binance Pay: https://remesas.com/blog/como-enviar-recibir-dinero-por-binance-binance-pay/
- Kharyo — Capture de Pago Móvil: qué es y cómo validar que sea real (comprobante norm): https://kharyo.com/blog/capture-pago-movil-que-es-validacion
- Efecto Cocuyo (Cocuyo Chequea) — Falsos comprobantes de pago móvil: https://efectococuyo.com/cocuyo-chequea/falsos-comprobantes-pago/
