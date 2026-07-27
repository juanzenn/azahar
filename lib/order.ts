import { resolveCart } from "@/lib/cart";
import type { Cart, CartItem } from "@/lib/cart";
import type { Product } from "@/lib/catalog/types";

/**
 * Checkout, as logic: what the shop needs to know, whether it knows it yet, and
 * what the order comes to.
 *
 * The third pure seam, alongside search and the cart. Everything a customer
 * types lives in one `CheckoutForm`, and the two questions worth asking about it
 * — *is this enough to deliver flowers?* and *what does it cost?* — are answered
 * here rather than in the island that renders the fields. Building the WhatsApp
 * message from a finished form joins this module later; the form and its rules
 * come first because the page cannot be drawn without them.
 *
 * **The interesting part is the conditional-required web.** Three answers —
 * delivery-or-pickup, is-it-a-gift and which payment rail — decide between them
 * which fields the shop actually needs, and the page has to know that *before*
 * the customer submits, because required fields are marked as required from the
 * first paint. So the web is a function of the form, `requiredFields`, and
 * validation is the mechanical part layered on top: of the fields this form
 * requires, which are still blank. One rule, one place, and no field asked for
 * twice — and the submit gate is then nothing but "are there no errors", rather
 * than a second opinion that could disagree with the asterisks.
 *
 * No React, no DOM, and no reach for a clock or a config module: `today` and the
 * delivery fee arrive as arguments, which is what makes the past-date rule and
 * the money testable without mocking either.
 */

/**
 * *Envío a domicilio* or *retiro en tienda*. Which one is chosen decides the fee,
 * the address block and whether the courier needs the recipient's phone — it is
 * the single most consequential answer on the page.
 */
export const DELIVERY_METHODS = ["envio", "retiro"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

/**
 * The franja horaria. `otra` is the escape hatch the spec asks for — the
 * customer's own words in `timeWindowNote` — because a shop that delivers all
 * day cannot enumerate every arrangement a family makes.
 */
export const TIME_WINDOWS = ["manana", "tarde", "otra"] as const;
export type TimeWindow = (typeof TIME_WINDOWS)[number];

/**
 * The rails the shop can be paid through, in the order they are offered.
 *
 * Which of them a given shop actually accepts, and the account numbers behind
 * each, are configuration — this is only the vocabulary, so that a rail with no
 * copy, no config and no place in the message is a compile error rather than a
 * radio button that leads nowhere.
 *
 * `efectivo` is the one that behaves differently everywhere it appears: it is
 * *pago contra entrega*, paid to the courier at the door, so it produces no
 * reference and asks its own question instead.
 */
export const PAYMENT_METHODS = [
  "pago-movil",
  "transferencia",
  "zelle",
  "binance",
  "efectivo",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * A card, not a letter. The cap keeps the message inside the deep-link's ~2000
 * characters, which the dispatch step depends on and cannot recover from.
 */
export const MAX_CARD_MESSAGE_LENGTH = 200;

/**
 * Everything the checkout page collects.
 *
 * Flat and all-strings on purpose: it is the shape a form has, so no section
 * needs assembling before it can be validated, and an unchosen radio is `""`
 * rather than a nested block that might be missing.
 */
export type CheckoutForm = {
  // Comprador — always required.
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;

  // Entrega — the two toggles the rest of the form hangs off.
  deliveryMethod: DeliveryMethod | "";
  isGift: boolean;

  // Destinatario — only asked for when it is a gift.
  recipientName: string;
  recipientPhone: string;

  // Dirección — only asked for when it is being delivered. The zone is courier
  // information; the fee is flat and no field on this page changes it.
  address: string;
  landmark: string;
  zone: string;

  /** `yyyy-mm-dd`, as the date input speaks it. */
  date: string;
  timeWindow: TimeWindow | "";
  /** The customer's own franja, when they picked `otra`. */
  timeWindowNote: string;

  // Extras — never required, and `cardFrom` blank is a deliberate choice: an
  // anonymous gift, not a missing answer.
  cardMessage: string;
  cardFrom: string;
  notes: string;

  // Pago. The customer pays out-of-band and comes back with a reference; the
  // two cash fields are efectivo's alone, and are ignored — not cleared —
  // whenever another rail is chosen, so changing your mind twice loses nothing.
  paymentMethod: PaymentMethod | "";
  reference: string;
  needsChange: boolean;
  /** What the customer is paying with, so the courier brings the difference. */
  changeAmount: string;
};

/** What the page starts from, and what a test varies one field of. */
export const EMPTY_FORM: CheckoutForm = {
  buyerName: "",
  buyerPhone: "",
  buyerEmail: "",
  deliveryMethod: "",
  isGift: false,
  recipientName: "",
  recipientPhone: "",
  address: "",
  landmark: "",
  zone: "",
  date: "",
  timeWindow: "",
  timeWindowNote: "",
  cardMessage: "",
  cardFrom: "",
  notes: "",
  paymentMethod: "",
  reference: "",
  needsChange: false,
  changeAmount: "",
};

/**
 * The fields validation has anything to say about — every one of them required
 * under some combination of the toggles. The optional fields are absent by
 * design: nothing can report an error against a field the shop never needed.
 */
export type CheckoutField =
  | "buyerName"
  | "buyerPhone"
  | "buyerEmail"
  | "deliveryMethod"
  | "recipientName"
  | "recipientPhone"
  | "address"
  | "date"
  | "paymentMethod"
  | "reference"
  | "changeAmount";

/** Asked for whatever the customer chooses. */
const ALWAYS_REQUIRED: readonly CheckoutField[] = [
  "buyerName",
  "buyerPhone",
  "buyerEmail",
  "deliveryMethod",
  "date",
  "paymentMethod",
];

/**
 * Which fields this form makes necessary.
 *
 * The page's own reason for existing: a field is marked required as it appears,
 * so nobody discovers what was compulsory by being refused. Validation reads the
 * same set, so the asterisk and the error can never disagree about what the shop
 * needs.
 */
export function requiredFields(form: CheckoutForm): ReadonlySet<CheckoutField> {
  const required = new Set<CheckoutField>(ALWAYS_REQUIRED);
  const delivered = form.deliveryMethod === "envio";

  if (delivered) required.add("address");

  if (form.isGift) {
    required.add("recipientName");
    // The phone exists so the courier can coordinate with whoever is receiving
    // the flowers. On a pickup there is no courier.
    if (delivered) required.add("recipientPhone");
  }

  if (form.paymentMethod === "efectivo") {
    // Cash is paid at the door, so there is no reference — and the note the
    // customer is holding is only the shop's business if they want change back.
    if (form.needsChange) required.add("changeAmount");
  } else if (form.paymentMethod !== "") {
    required.add("reference");
  }

  return required;
}

/**
 * `required` — the shop needs this and does not have it. `past-date` — the one
 * answer that can be present and still impossible.
 */
export type CheckoutIssue = "required" | "past-date";

/** Empty means submittable, which is the whole question the submit gate asks. */
export type CheckoutErrors = Partial<Record<CheckoutField, CheckoutIssue>>;

const isBlank = (value: string) => value.trim() === "";

/**
 * What is wrong with this form right now, keyed by field.
 *
 * Deliberately soft on format: a phone or an email is checked for being *there*
 * and nothing else. Venezuelan numbers are written half a dozen ways, and a
 * regex that rejects a reachable customer costs the shop an order — whereas a
 * typo is caught by the human on the other end of the WhatsApp chat, which is
 * where this order is going anyway.
 *
 * `today` is passed in as `yyyy-mm-dd` rather than read from a clock: the
 * comparison is then a string comparison, with no timezone able to move it, and
 * a same-day order stays valid all day.
 */
export function validate(form: CheckoutForm, today: string): CheckoutErrors {
  const errors: CheckoutErrors = {};

  for (const field of requiredFields(form)) {
    if (isBlank(form[field])) errors[field] = "required";
  }

  // A blank date is already reported as missing; telling the customer it is also
  // in the past would be two complaints about one empty box.
  if (!errors.date && form.date < today) errors.date = "past-date";

  return errors;
}

/**
 * Today as the date input writes it.
 *
 * Built from the local calendar rather than sliced off an ISO timestamp, which
 * in Caracas names yesterday from 8pm onwards — and floors the picker on the
 * wrong day for the customers most likely to be ordering for tomorrow.
 */
export function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * What the shop charges for delivery. Flat, and the shop's to set — including to
 * zero. Structural, so `shopConfig` satisfies it without this module importing
 * it.
 */
export type OrderConfig = {
  deliveryFeeUsdCents: number;
};

export type OrderQuote = {
  /** The cart resolved against the catalog, in cart order. */
  items: CartItem[];
  subtotalCents: number;
  /**
   * `null` until a method is chosen: zero would read as "delivery is free", and
   * the customer would be looking at a total they might not be about to pay.
   */
  deliveryCents: number | null;
  /** `null` for the same reason, and never anything but `subtotal + envío`. */
  totalCents: number | null;
};

/**
 * The three figures the summary card shows.
 *
 * A flat fee is what makes this a total rather than an estimate: there is no
 * zone lookup and no distance, so the exact number is knowable the moment the
 * customer says how they want the flowers — which is well before they are asked
 * to pay it out-of-band, where a surprise cannot be corrected.
 *
 * The subtotal comes from the catalog through `resolveCart`, never from anything
 * the cart persisted, so a month-old cart is quoted at today's prices.
 */
export function quoteOrder(
  cart: Cart,
  products: Product[],
  form: CheckoutForm,
  config: OrderConfig,
): OrderQuote {
  const { items, subtotalCents } = resolveCart(cart, products);

  const deliveryCents =
    form.deliveryMethod === ""
      ? null
      : deliveryFee(form.deliveryMethod, config);

  return {
    items,
    subtotalCents,
    deliveryCents,
    totalCents: deliveryCents === null ? null : subtotalCents + deliveryCents,
  };
}

/** Pickup uses no courier, so it is charged for none. */
function deliveryFee(method: DeliveryMethod, config: OrderConfig): number {
  return method === "envio" ? config.deliveryFeeUsdCents : 0;
}
