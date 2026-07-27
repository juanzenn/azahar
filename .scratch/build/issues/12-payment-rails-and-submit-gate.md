# 12 — Payment rails + referencia + submit gate

**What to build:** The customer picks how they'll pay, sees only that rail's account details with copy
buttons beside every number, pays out-of-band, types in their `referencia`, and watches the submit
button become enabled. Paying in cash is handled as its own case — no reference, but a question about
change. After this ticket the checkout is complete and submittable.

The shop must be able to turn a rail on or off and change its account values **without a code
change** — a bank switch should not need a developer.

Spec: [`spec.md`](../../spec.md) §9 (payment rails, efectivo exception, submit gate), §11 (configuration).

**Blocked by:** 11

**Status:** done

- [x] **All five rails supported and config-driven**: Pago Móvil, Transferencia, Zelle, Binance/USDT, Efectivo. Each has an **enable flag** and its account values in configuration, not in components.
- [x] Each rail renders **exactly the fields that rail actually requires** — getting this wrong makes payments fail:
  - **Pago Móvil** — teléfono + cédula/RIF + **4-digit bank code**; deliberately **no account number**
  - **Transferencia** — 20-digit cuenta + titular + cédula/RIF + banco
  - **Zelle** — registered email or US phone + titular name
  - **Binance/USDT** — Pay ID and/or wallet, **with the network label** (e.g. TRC20)
  - **Efectivo** — in person, no account details
- [x] **Single-select radio** for the method; only the chosen rail's account block is revealed, so nobody reads five sets of numbers looking for theirs.
- [x] **A copy button on every account detail** — a 20-digit account number must never have to be retyped on a phone.
- [x] Once a non-efectivo rail is chosen, a **required "Número de referencia"** field appears.
- [x] **Efectivo exception**: treated as **pago contra entrega** with **no referencia required**. Adds a "¿Necesitas vuelto?" toggle which, when yes, reveals a "¿Con cuánto vas a pagar?" amount field so the courier brings change.
- [x] A visible note reminds the customer to **send the comprobante screenshot in the WhatsApp chat**, since a deep-link cannot attach it.
- [x] The **"Enviar pedido por WhatsApp" button is disabled** until all required fields from ticket 11 are valid **and** a referencia is present (or the rail is efectivo), and becomes enabled exactly when that holds.
- [x] A disabled rail never appears as an option anywhere in the UI.
- [x] `validate` is extended and tested for the payment rules: non-efectivo ⇒ referencia required; **efectivo ⇒ referencia not required**; efectivo + needs-change ⇒ change amount required.
- [x] **Checkout island wiring test** (deliberately thin): conditional blocks appear and disappear with the gift and delivery toggles; choosing a rail reveals only that rail's block; the submit button stays disabled until the form is valid with a reference and then becomes enabled.
- [x] Real account values are **placeholders** in the committed config — see the configuration checklist in the spec for what the shop must supply.
