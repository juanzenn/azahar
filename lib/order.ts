import { resolveCart } from "@/lib/cart";
import type { Cart, CartItem } from "@/lib/cart";
import type { Product } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { strings } from "@/lib/strings";

/**
 * Checkout, as logic: what the shop needs to know, whether it knows it yet, what
 * the order comes to — and the message that carries it away.
 *
 * The third pure seam, alongside search and the cart. Everything a customer
 * types lives in one `CheckoutForm`, and the three questions worth asking about
 * it — *is this enough to deliver flowers?*, *what does it cost?* and *what does
 * the shop read?* — are answered here rather than in the island that renders the
 * fields.
 *
 * The last of those is the whole product. Nothing about an order persists
 * server-side: it exists in a WhatsApp message and in the customer's own
 * `sessionStorage`, so the message *is* the order, and the confirmation page is
 * rendered from the very same sections rather than from a second description of
 * them.
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
 * No React, no DOM, and no reach for a clock, a config module or a random number
 * generator: `today`, the delivery fee, the shop's number and the order code all
 * arrive as arguments, which is what makes the past-date rule, the money and the
 * code testable without mocking any of them.
 */

/** The labels of the order record, shared by the message and the page. */
const record = strings.checkout.record;
/** The two lines that belong to the chat alone. */
const chat = strings.checkout.message;
/** The rails by name, the same short labels the radio group offers. */
const railLabels = strings.checkout.payment.methods;

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
 * A note, not a conversation — the chat this order opens is where a longer story
 * belongs.
 *
 * Capped for the same reason as the card and one more: a textarea invites
 * paragraphs, and the notes are the one field a customer might paste into. The
 * message can summarise a cart that grew too long, but it cannot summarise prose
 * without losing the instruction it was written to carry.
 */
export const MAX_NOTES_LENGTH = 300;

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

/**
 * Pickup uses no courier, so it is charged for none — and so is an order with no
 * method chosen yet, which `quoteOrder` withholds rather than quotes.
 */
function deliveryFee(method: DeliveryMethod | "", config: OrderConfig): number {
  return method === "envio" ? config.deliveryFeeUsdCents : 0;
}

/**
 * One line of the order as it was sent: what it was called, and what it cost
 * *then*.
 *
 * A cart line holds a slug and a quantity precisely so its price is never stale;
 * an order line is the opposite, and deliberately so. It is a record of what the
 * shop was told, read back on a page that holds no catalog, and a price that
 * changed after the message was written would make the confirmation disagree with
 * the message the customer can still re-send.
 */
export type OrderItem = {
  name: string;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

/**
 * A dispatched order. Self-contained on purpose: no `Product`, no catalog, and
 * nothing that needs resolving — it survives `JSON.stringify` and a page load.
 */
export type Order = {
  /** `AZ-7K3Q`. A reference for the chat, not an identifier: nothing persists. */
  code: string;
  items: OrderItem[];
  subtotalCents: number;
  /** Settled, unlike the quote's: an order cannot be sent without a method. */
  deliveryCents: number;
  totalCents: number;
  /** Everything the customer typed, as they typed it. */
  form: CheckoutForm;
};

const CODE_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CODE_LENGTH = 4;

/**
 * An order code: `AZ-` and four base-36 characters.
 *
 * Short because its only job is to be said out loud in a chat — "el AZ-7K3Q" —
 * and it is a label rather than an identifier, so the 1.7 million it can spell is
 * not a uniqueness guarantee and does not need to be. Nothing looks an order up
 * by it; the shop reads the message beside it.
 *
 * **The randomness is a parameter.** A code drawn from a global `Math.random`
 * would be a function with no testable behaviour at all, and this one has some:
 * the alphabet, the length and the prefix.
 */
export function orderCode(random: () => number = Math.random): string {
  let drawn = "";

  for (let position = 0; position < CODE_LENGTH; position += 1) {
    // Clamped rather than trusted: an injected source that ever returns its
    // exclusive upper bound would otherwise index past the alphabet and spell
    // `undefined` into a customer's order code.
    const index = Math.floor(random() * CODE_ALPHABET.length);
    const bounded = Math.min(Math.max(index, 0), CODE_ALPHABET.length - 1);

    drawn += CODE_ALPHABET[bounded];
  }

  return `AZ-${drawn}`;
}

/**
 * Freeze a validated form, a cart and today's catalog into one order.
 *
 * The code arrives from outside rather than being drawn in here, which keeps this
 * a pure function of its arguments — the same order built twice is the same
 * order — and leaves the one unrepeatable act of the whole flow in `orderCode`,
 * where a test can hand it a script.
 */
export function buildOrder(
  cart: Cart,
  products: Product[],
  form: CheckoutForm,
  config: OrderConfig,
  code: string,
): Order {
  const { items, subtotalCents } = resolveCart(cart, products);
  const deliveryCents = deliveryFee(form.deliveryMethod, config);

  return {
    code,
    items: items.map((item) => ({
      name: item.product.name,
      qty: item.qty,
      unitPriceCents: item.product.priceUsdCents,
      lineTotalCents: item.lineTotalCents,
    })),
    subtotalCents,
    deliveryCents,
    totalCents: subtotalCents + deliveryCents,
    form,
  };
}

/** The blocks of the order, in the order they are read. */
export type OrderSectionKey =
  | "products"
  | "delivery"
  | "recipient"
  | "card"
  | "buyer"
  | "payment"
  | "notes";

/**
 * One line of a block. `label` is absent for a line that is not a `label: value`
 * pair — an item, or the words on the card — and `strong` is the emphasis the
 * template puts on the total, which the message spells `*bold*` and the page
 * draws.
 */
export type OrderRow = {
  label?: string;
  value: string;
  strong?: boolean;
};

export type OrderSection = {
  key: OrderSectionKey;
  heading: string;
  rows: OrderRow[];
};

/**
 * The order as blocks of labelled lines — the shared shape behind both the
 * WhatsApp message and the confirmation page.
 *
 * Rendering it twice from one description is the point: the page tells the
 * customer what the shop was told, and it cannot get that wrong by drifting,
 * because there is no second set of conditionals to drift from. Which is also why
 * this is where **sections appear only when relevant** is enforced — a block with
 * no lines is dropped at the door rather than by seven `if`s, and each row that
 * had nothing to say removed itself the same way.
 */
export function orderSections(order: Order): OrderSection[] {
  return sectionsOf(order, order.items.length);
}

/**
 * `itemised` is how many lines the products block spells out before summarising
 * the rest — always all of them for the page, and whatever the deep-link's
 * ceiling leaves room for in the message.
 */
function sectionsOf(order: Order, itemised: number): OrderSection[] {
  const { form } = order;

  const candidates: OrderSection[] = [
    {
      key: "products",
      heading: record.products,
      rows: itemRows(order, itemised),
    },
    {
      key: "delivery",
      heading: record.deliveryHeading,
      rows: deliveryRows(form),
    },
    {
      key: "recipient",
      heading: record.recipientHeading,
      // The card rides in this block when there is one, exactly as the template
      // has it: the words and who they are from belong beside the person
      // receiving them.
      rows: form.isGift ? recipientRows(form) : [],
    },
    {
      key: "card",
      heading: record.cardHeading,
      // And keeps its own block when there is no recipient — a card written on an
      // order that is not a gift is still written by hand by the florist.
      rows: form.isGift ? [] : cardRows(form),
    },
    { key: "buyer", heading: record.buyerHeading, rows: buyerRows(form) },
    { key: "payment", heading: record.paymentHeading, rows: paymentRows(form) },
    {
      key: "notes",
      heading: record.notesHeading,
      rows: row(undefined, form.notes),
    },
  ];

  return candidates.filter((section) => section.rows.length > 0);
}

/**
 * A row, or nothing at all. Blank is how the form says "the customer did not
 * answer this", and a label with nothing after it is worse than a missing line.
 */
function row(label: string | undefined, value: string): OrderRow[] {
  const text = value.trim();

  return text === "" ? [] : [{ label, value: text }];
}

function itemRows(order: Order, itemised: number): OrderRow[] {
  const summarised = order.items.slice(itemised);

  return [
    ...order.items.slice(0, itemised).map((item) => {
      const unit = formatPrice(item.unitPriceCents);

      return {
        // The unit price is marked as one only when the line holds more than one
        // of something; on a single item "c/u" is a distinction without a
        // difference.
        value: record.item(
          item.qty,
          item.name,
          item.qty > 1 ? record.each(unit) : unit,
        ),
      };
    }),
    // The tail of a cart too long for a chat message. Carries its own money, so
    // the subtotal below it still adds up and the shop can see nothing was lost
    // but the names.
    ...(summarised.length > 0
      ? [
          {
            value: record.more(
              summarised.length,
              formatPrice(
                summarised.reduce(
                  (total, item) => total + item.lineTotalCents,
                  0,
                ),
              ),
            ),
          },
        ]
      : []),
    { label: record.subtotal, value: formatPrice(order.subtotalCents) },
    { label: record.delivery, value: formatPrice(order.deliveryCents) },
    // The figure the customer is transferring by hand, so it carries the
    // template's emphasis wherever it is rendered.
    { label: record.total, value: formatPrice(order.totalCents), strong: true },
  ];
}

function deliveryRows(form: CheckoutForm): OrderRow[] {
  return [
    ...row(record.method, methodLabel(form.deliveryMethod)),
    ...row(record.date, scheduleValue(form)),
    // A pickup has no address to get wrong, and the courier's two hints are the
    // customer's to offer.
    ...(form.deliveryMethod === "envio"
      ? [
          ...row(record.address, form.address),
          ...row(record.landmark, form.landmark),
          ...row(record.zone, form.zone),
        ]
      : []),
  ];
}

function methodLabel(method: DeliveryMethod | ""): string {
  return method === "" ? "" : record.methods[method];
}

/** `2026-07-25 (Tarde)` — the day, and the franja when there is one. */
function scheduleValue(form: CheckoutForm): string {
  const date = form.date.trim();
  if (date === "") return "";

  const window = windowLabel(form);

  return window === "" ? date : record.dateWithWindow(date, window);
}

/**
 * `otra` is the escape hatch, so the customer's own words stand in for the label
 * — and a customer who chose it and wrote nothing has expressed no preference.
 */
function windowLabel(form: CheckoutForm): string {
  if (form.timeWindow === "") return "";
  if (form.timeWindow === "otra") return form.timeWindowNote.trim();

  return record.windows[form.timeWindow];
}

/**
 * Who is receiving the flowers, and — the whole reason a gift needs a block of
 * its own — who they are from. The signature stands on its own: a gift with no
 * card is still from somebody, and blank is how one is sent anonymously.
 */
function recipientRows(form: CheckoutForm): OrderRow[] {
  return [
    ...row(record.name, form.recipientName),
    ...row(record.phone, form.recipientPhone),
    ...cardTextRow(form, record.card),
    ...row(record.cardFrom, form.cardFrom),
  ];
}

/** The words on the card, labelled where the template labels them. */
function cardTextRow(form: CheckoutForm, label?: string): OrderRow[] {
  const message = form.cardMessage.trim();

  return row(label, message === "" ? "" : record.cardText(message));
}

/**
 * The card as a block of its own, which is where it goes when the order is not a
 * gift — the florist still writes it out by hand.
 *
 * Gated on the words rather than the signature: "de parte de" mirrors the buyer's
 * name by default, and a heading over nothing but the name already in the
 * Comprador block says nothing at all.
 */
function cardRows(form: CheckoutForm): OrderRow[] {
  const text = cardTextRow(form);

  return text.length === 0
    ? []
    : [...text, ...row(record.cardFrom, form.cardFrom)];
}

function buyerRows(form: CheckoutForm): OrderRow[] {
  return [
    ...row(record.name, form.buyerName),
    ...row(record.phone, form.buyerPhone),
    ...row(record.email, form.buyerEmail),
  ];
}

/**
 * How the shop is being paid, and the proof of it — or, for cash, when it will
 * be paid and what note to bring change for. The shop reads this block to decide
 * whether to start on the flowers, so *pago contra entrega* is part of the label
 * rather than something to infer from a missing reference.
 */
function paymentRows(form: CheckoutForm): OrderRow[] {
  const cash = form.paymentMethod === "efectivo";

  return [
    ...row(record.paymentMethod, cash ? record.cash : railLabel(form)),
    ...(cash
      ? row(record.change, changeValue(form))
      : row(record.reference, form.reference)),
  ];
}

function railLabel(form: CheckoutForm): string {
  return form.paymentMethod === "" ? "" : railLabels[form.paymentMethod];
}

/**
 * `Pago con $50`, from what the customer typed.
 *
 * The hint asks for a bare number, so the currency mark is the copy's — and the
 * customer's own `$` is stripped first, because typing it anyway must not be
 * quoted back as `$$50`. Not `formatPrice`: this is a note the customer is
 * holding, not an amount the shop calculated, and re-reading it as cents would
 * turn "50" into fifty cents.
 */
function changeValue(form: CheckoutForm): string {
  if (!form.needsChange) return "";

  const amount = form.changeAmount.trim().replace(/^\$\s*/, "");

  return amount === "" ? "" : record.changeWith(amount);
}

/**
 * The message's budget, in characters, once encoded.
 *
 * The deep-link has to stay under ~2000 characters, and everything outside the
 * message — `https://wa.me/`, fifteen digits of number, `?text=` — is at most 40
 * of them. Budgeting the message rather than the URL is what lets the ceiling be
 * this module's own invariant, provable without a number to build a link from.
 */
const MAX_MESSAGE_LENGTH = 1960;

/**
 * The order as one WhatsApp message.
 *
 * Plain text with WhatsApp's own `*emphasis*`, because that is all a deep-link
 * can carry — no attachment, no formatting beyond this, and one shot at being
 * complete: the shop reads this and prepares flowers from it.
 *
 * **It fits, whatever the cart.** A message WhatsApp truncates loses its *end* —
 * the payment reference, the notes — and nothing on the customer's screen would
 * say so. Conditional sections keep a real order to about half the budget; past
 * that, item lines are folded into a summary one at a time, so an order nobody
 * would really send costs the names of its tail rather than the reference that
 * proves it was paid.
 *
 * The cart is what can grow without bound, so the cart is what is folded. The
 * fields are the form's to bound, and the two boxes that invite length —
 * `cardMessage` and `notes` — carry caps for exactly this reason; a customer who
 * pastes an essay into a single-line address box can still write a message longer
 * than the budget, and would be reading it back on the confirmation page.
 */
export function orderMessage(order: Order): string {
  let itemised = order.items.length;
  let message = messageText(order, itemised);

  // One line at a time rather than a fixed cap, so a real order is never
  // summarised and an absurd one is summarised only as far as it has to be. The
  // first line always survives: an order that names nothing it ordered would be
  // unreadable in a way a long one is not.
  while (itemised > 1 && encodedLength(message) > MAX_MESSAGE_LENGTH) {
    itemised -= 1;
    message = messageText(order, itemised);
  }

  return message;
}

/** What the message costs the URL, which is not what it costs the eye. */
const encodedLength = (message: string) => encodeURIComponent(message).length;

function messageText(order: Order, itemised: number): string {
  return [
    chat.greeting(order.code),
    ...messageSections(order, itemised).map(sectionText),
  ].join("\n\n");
}

/**
 * The record, plus the one line that belongs to the chat rather than to the
 * order: a deep-link cannot attach the payment screenshot, so the message says
 * whose job it is. Only where something was actually paid in advance — cash
 * leaves no comprobante to promise.
 */
function messageSections(order: Order, itemised: number): OrderSection[] {
  const { paymentMethod } = order.form;
  const prepaid = paymentMethod !== "" && paymentMethod !== "efectivo";

  return sectionsOf(order, itemised).map((section) =>
    section.key === "payment" && prepaid
      ? { ...section, rows: [...section.rows, { value: chat.receipt }] }
      : section,
  );
}

function sectionText(section: OrderSection): string {
  return [`*${section.heading}*`, ...section.rows.map(rowText)].join("\n");
}

function rowText({ label, value, strong }: OrderRow): string {
  const text = label === undefined ? value : `${label}: ${value}`;

  return strong ? `*${text}*` : text;
}

/**
 * The shop's WhatsApp number. Structural, so `shopConfig` satisfies it without
 * this module importing it.
 */
export type DispatchConfig = {
  whatsappNumber: string;
};

/**
 * The deep-link that carries the order to the shop.
 *
 * `wa.me` per WhatsApp's own guidance, with the message encoded **once**:
 * `encodeURIComponent` turns the newlines into `%0A` and the emoji into their
 * UTF-8 bytes, and hand-mixing or re-encoding any of it is what produces a chat
 * full of `%2520`.
 *
 * The customer still presses send themselves — there is no auto-send, and there
 * is no way to attach the comprobante, which is why the message asks for it.
 */
export function orderToWhatsAppUrl(
  order: Order,
  config: DispatchConfig,
): string {
  const text = encodeURIComponent(orderMessage(order));

  return `https://wa.me/${chatNumber(config.whatsappNumber)}?text=${text}`;
}

/**
 * Country code plus digits, which is the only form `wa.me` accepts: no `+`, no
 * leading zero, no separators. The shop owner types this into an environment
 * variable by hand, and a `+58 (412) 123-4567` that reached the link would be a
 * dead button on every order — so it is reduced here rather than trusted.
 */
function chatNumber(configured: string): string {
  return configured.replace(/\D/g, "").replace(/^0+/, "");
}

/**
 * Where the order waits between the two pages. Namespaced like the cart's key,
 * and in `sessionStorage` rather than `localStorage`: an order belongs to the tab
 * that placed it, and has no business greeting the customer again next week.
 */
export const ORDER_STORAGE_KEY = "azahar.order";

/** As much of `Storage` as the stash uses, so a three-line fake satisfies it. */
export type OrderStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * Hand the order to the confirmation page.
 *
 * Silent on failure, like the cart's writer: the customer is already on their way
 * to WhatsApp with the message built, and a private-mode browser that refuses to
 * store anything is not a reason to interrupt them.
 */
export function stashOrder(storage: OrderStorage, order: Order): void {
  try {
    storage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
  } catch {
    // Nothing to recover: the confirmation page will send them home, and the
    // order is unaffected by whether this browser kept a copy.
  }
}

/**
 * The stashed order, or `null` — never an exception, and never half an order.
 *
 * `null` is the answer to every way this can go wrong, because the page has one
 * response to all of them: send the customer home rather than draw a receipt for
 * an order nobody can read. Absent is the ordinary case — a typed URL, a new
 * tab — and the rest is untrusted input like anything else in a browser store.
 */
export function readStashedOrder(storage: OrderStorage): Order | null {
  let raw: string | null;

  try {
    raw = storage.getItem(ORDER_STORAGE_KEY);
  } catch {
    // Private-mode Safari and a cookies-disabled profile throw on access itself.
    return null;
  }

  if (!raw) return null;

  try {
    return asOrder(JSON.parse(raw));
  } catch {
    return null;
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function asItem(value: unknown): OrderItem | null {
  const { name, qty, unitPriceCents, lineTotalCents } = asObject(value);

  if (typeof name !== "string" || name.trim() === "") return null;
  if (!isAmount(qty) || qty < 1) return null;
  if (!isAmount(unitPriceCents) || !isAmount(lineTotalCents)) return null;

  return { name, qty, unitPriceCents, lineTotalCents };
}

function asOrder(value: unknown): Order | null {
  const stored = asObject(value);
  const { code, items, subtotalCents, deliveryCents, totalCents } = stored;

  if (typeof code !== "string" || code.trim() === "") return null;
  if (!Array.isArray(items)) return null;
  if (!isAmount(subtotalCents)) return null;
  if (!isAmount(deliveryCents) || !isAmount(totalCents)) return null;

  const readable: OrderItem[] = items.flatMap(
    (item: unknown) => asItem(item) ?? [],
  );
  // All of the lines or none of them. Keeping the ones that parsed would leave a
  // record whose subtotal is for more flowers than it lists — and an order with
  // nothing in it is not an order at all. Either way: sent home, not shown a
  // receipt that disagrees with itself.
  if (readable.length === 0 || readable.length !== items.length) return null;

  return {
    code,
    items: readable,
    subtotalCents,
    deliveryCents,
    totalCents,
    form: asForm(stored.form),
  };
}

/**
 * The form as the shop can safely read it back.
 *
 * Field by field rather than merged wholesale, so a value that is not what it
 * claims to be falls back to blank instead of reaching a template as `undefined`
 * — and so that adding a field to `CheckoutForm` without reading it here is a
 * compile error rather than a line missing from a re-sent message.
 */
function asForm(value: unknown): CheckoutForm {
  const stored = asObject(value);

  const text = (key: keyof CheckoutForm): string =>
    typeof stored[key] === "string" ? (stored[key] as string) : "";
  const flag = (key: keyof CheckoutForm): boolean => stored[key] === true;
  const oneOf = <Value extends string>(
    vocabulary: readonly Value[],
    key: keyof CheckoutForm,
  ): Value | "" =>
    vocabulary.find((candidate) => candidate === stored[key]) ?? "";

  return {
    buyerName: text("buyerName"),
    buyerPhone: text("buyerPhone"),
    buyerEmail: text("buyerEmail"),
    deliveryMethod: oneOf(DELIVERY_METHODS, "deliveryMethod"),
    isGift: flag("isGift"),
    recipientName: text("recipientName"),
    recipientPhone: text("recipientPhone"),
    address: text("address"),
    landmark: text("landmark"),
    zone: text("zone"),
    date: text("date"),
    timeWindow: oneOf(TIME_WINDOWS, "timeWindow"),
    timeWindowNote: text("timeWindowNote"),
    cardMessage: text("cardMessage"),
    cardFrom: text("cardFrom"),
    notes: text("notes"),
    paymentMethod: oneOf(PAYMENT_METHODS, "paymentMethod"),
    reference: text("reference"),
    needsChange: flag("needsChange"),
    changeAmount: text("changeAmount"),
  };
}
