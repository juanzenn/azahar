import { describe, expect, it } from "vitest";

import type { Cart } from "@/lib/cart";
import type { Product } from "@/lib/catalog/types";
import {
  EMPTY_FORM,
  ORDER_STORAGE_KEY,
  buildOrder,
  orderCode,
  orderMessage,
  orderToWhatsAppUrl,
  quoteOrder,
  readStashedOrder,
  requiredFields,
  stashOrder,
  toIsoDate,
  validate,
} from "@/lib/order";
import type { CheckoutForm, Order } from "@/lib/order";

/**
 * The order seam.
 *
 * Three things are proven here, and all of them are the kind that go quietly
 * wrong. The first is the **conditional-required web**: which fields the shop
 * actually needs depends on three answers — delivery-or-pickup, is-it-a-gift and
 * how the customer paid — and every combination of them asks for a different
 * set. The second is the **money**, whose only rule — pickup costs nothing to
 * deliver — is one `if` that a call site could get backwards without anything
 * else noticing.
 *
 * The third is the **message**, which is the product: an order that exists
 * nowhere but in a WhatsApp deep-link is only as good as what that link says. A
 * section that appears when it shouldn't costs readability; one that goes missing
 * costs a delivery. So the template is asserted whole, once, and the rules that
 * shape it are then taken one at a time.
 *
 * No DOM. Which fields are required is not a React question, and the island's
 * own test does not restate a single case from here.
 */

/** A Thursday, so "today" is a fixed string and nothing consults a clock. */
const TODAY = "2026-07-27";

function form(overrides: Partial<CheckoutForm> = {}): CheckoutForm {
  return { ...EMPTY_FORM, ...overrides };
}

/** Everything the shop always needs, whatever the toggles say. */
const BUYER = {
  buyerName: "Juan Álvarez",
  buyerPhone: "0414-9876543",
  buyerEmail: "juan@example.com",
  date: TODAY,
} satisfies Partial<CheckoutForm>;

/**
 * A rail chosen and the transfer made. Every complete form now carries one: the
 * customer pays before the order is dispatched, so a form with no payment on it
 * is not a submittable order.
 */
const PAID = {
  paymentMethod: "pago-movil",
  reference: "00123456",
} satisfies Partial<CheckoutForm>;

describe("requiredFields", () => {
  const ALWAYS = [
    "buyerName",
    "buyerPhone",
    "buyerEmail",
    "deliveryMethod",
    "date",
    "paymentMethod",
  ] as const;

  it("asks for the buyer, a method, a date and a rail before anything is chosen", () => {
    expect(requiredFields(EMPTY_FORM)).toEqual(new Set(ALWAYS));
  });

  it("asks for an address once the order is being delivered", () => {
    expect(requiredFields(form({ deliveryMethod: "envio" }))).toEqual(
      new Set([...ALWAYS, "address"]),
    );
  });

  it("asks for no address when the customer is collecting it", () => {
    expect(requiredFields(form({ deliveryMethod: "retiro" }))).toEqual(
      new Set(ALWAYS),
    );
  });

  it("asks for the recipient's name and phone for a delivered gift", () => {
    expect(
      requiredFields(form({ deliveryMethod: "envio", isGift: true })),
    ).toEqual(
      new Set([...ALWAYS, "address", "recipientName", "recipientPhone"]),
    );
  });

  // The courier is the reason the phone is required, and on a pickup there is
  // no courier: the buyer hands the flowers over themselves.
  it("asks for the recipient's name but not their phone on a collected gift", () => {
    expect(
      requiredFields(form({ deliveryMethod: "retiro", isGift: true })),
    ).toEqual(new Set([...ALWAYS, "recipientName"]));
  });

  it("never asks for the recipient when the order is not a gift", () => {
    const required = requiredFields(form({ deliveryMethod: "envio" }));

    expect(required.has("recipientName")).toBe(false);
    expect(required.has("recipientPhone")).toBe(false);
  });

  /**
   * The rails split in two, and the split is the whole rule: four of them are
   * paid before the order is sent and leave a reference behind, and efectivo is
   * paid to the courier at the door and cannot possibly have one. Asking for a
   * reference the customer has no way to produce would lock the submit button
   * on the only rail that needs no bank at all.
   */
  describe("the payment rails", () => {
    it("asks for a reference once a transfer has been made", () => {
      for (const method of [
        "pago-movil",
        "transferencia",
        "zelle",
        "binance",
      ] as const) {
        expect(
          requiredFields(form({ paymentMethod: method })).has("reference"),
        ).toBe(true);
      }
    });

    it("asks for no reference when the customer pays the courier in cash", () => {
      const required = requiredFields(form({ paymentMethod: "efectivo" }));

      expect(required.has("reference")).toBe(false);
    });

    // Nothing has been paid yet, so there is nothing to reference — the missing
    // answer is the rail itself, and saying so twice would be one complaint too
    // many.
    it("asks for no reference before a rail is chosen", () => {
      expect(requiredFields(EMPTY_FORM).has("reference")).toBe(false);
    });

    it("asks how much the customer is paying with once they ask for change", () => {
      const required = requiredFields(
        form({ paymentMethod: "efectivo", needsChange: true }),
      );

      expect(required.has("changeAmount")).toBe(true);
    });

    it("asks for no amount when the customer needs no change", () => {
      const required = requiredFields(form({ paymentMethod: "efectivo" }));

      expect(required.has("changeAmount")).toBe(false);
    });

    // The toggle belongs to efectivo alone, and a stale `true` left behind by a
    // customer who changed their mind must not ask a bank transfer how much
    // cash it is bringing.
    it("asks a transfer for no change amount however the toggle was left", () => {
      const required = requiredFields(
        form({ paymentMethod: "zelle", needsChange: true }),
      );

      expect(required.has("changeAmount")).toBe(false);
    });
  });
});

describe("validate", () => {
  it("reports every field the shop is missing, and nothing else", () => {
    expect(validate(EMPTY_FORM, TODAY)).toEqual({
      buyerName: "required",
      buyerPhone: "required",
      buyerEmail: "required",
      deliveryMethod: "required",
      date: "required",
      paymentMethod: "required",
    });
  });

  it("passes a complete delivered gift", () => {
    expect(
      validate(
        form({
          ...BUYER,
          ...PAID,
          deliveryMethod: "envio",
          address: "Av. Principal, Edif. Sol, Apto 4B",
          isGift: true,
          recipientName: "María Pérez",
          recipientPhone: "0412-1234567",
        }),
        TODAY,
      ),
    ).toEqual({});
  });

  // The address block is not merely hidden on a pickup — its emptiness is not a
  // problem, which is a different claim and the one the submit gate reads.
  it("passes a pickup with no address at all", () => {
    expect(
      validate(form({ ...BUYER, ...PAID, deliveryMethod: "retiro" }), TODAY),
    ).toEqual({});
  });

  it("treats whitespace as blank", () => {
    expect(
      validate(
        form({
          ...BUYER,
          ...PAID,
          buyerName: "   ",
          deliveryMethod: "envio",
          address: "\n\t ",
          reference: "  ",
        }),
        TODAY,
      ),
    ).toEqual({
      buyerName: "required",
      address: "required",
      reference: "required",
    });
  });

  it("leaves the optional fields alone however empty they are", () => {
    const errors = validate(
      form({
        ...BUYER,
        ...PAID,
        deliveryMethod: "envio",
        address: "Av. Principal",
      }),
      TODAY,
    );

    expect(errors).toEqual({});
    // landmark, zone, timeWindow, cardMessage, cardFrom and notes are all blank
    // in EMPTY_FORM, and none of them is the shop's business.
  });

  /**
   * The submit gate reads nothing but "is this empty", so these cases are the
   * gate: a form that validates clean is a form the customer can send, and the
   * only difference between the two halves of the payment rules is whether a
   * reference stands between them and that button.
   */
  describe("the payment", () => {
    const READY = {
      ...BUYER,
      deliveryMethod: "retiro",
    } satisfies Partial<CheckoutForm>;

    it("holds back a transfer with no reference", () => {
      expect(
        validate(form({ ...READY, paymentMethod: "transferencia" }), TODAY),
      ).toEqual({ reference: "required" });
    });

    it("passes a transfer once the reference is typed in", () => {
      expect(
        validate(
          form({
            ...READY,
            paymentMethod: "transferencia",
            reference: "00987654",
          }),
          TODAY,
        ),
      ).toEqual({});
    });

    // Pago contra entrega: the money changes hands at the door, so there is no
    // reference to type and nothing standing between this customer and their
    // order.
    it("passes efectivo with no reference at all", () => {
      expect(
        validate(form({ ...READY, paymentMethod: "efectivo" }), TODAY),
      ).toEqual({});
    });

    it("holds back a cash order that needs change until the shop knows the note", () => {
      expect(
        validate(
          form({ ...READY, paymentMethod: "efectivo", needsChange: true }),
          TODAY,
        ),
      ).toEqual({ changeAmount: "required" });
    });

    it("passes a cash order once the shop knows what to bring change for", () => {
      expect(
        validate(
          form({
            ...READY,
            paymentMethod: "efectivo",
            needsChange: true,
            changeAmount: "50",
          }),
          TODAY,
        ),
      ).toEqual({});
    });

    it("holds back a form with no rail chosen", () => {
      expect(validate(form(READY), TODAY)).toEqual({
        paymentMethod: "required",
      });
    });
  });

  describe("the date", () => {
    it("refuses a date already past", () => {
      expect(
        validate(
          form({
            ...BUYER,
            ...PAID,
            date: "2026-07-26",
            deliveryMethod: "retiro",
          }),
          TODAY,
        ),
      ).toEqual({ date: "past-date" });
    });

    it("accepts today, which is a same-day order rather than an impossible one", () => {
      expect(
        validate(
          form({ ...BUYER, ...PAID, date: TODAY, deliveryMethod: "retiro" }),
          TODAY,
        ).date,
      ).toBeUndefined();
    });

    it("accepts a date in the future", () => {
      expect(
        validate(
          form({
            ...BUYER,
            ...PAID,
            date: "2026-12-24",
            deliveryMethod: "retiro",
          }),
          TODAY,
        ).date,
      ).toBeUndefined();
    });

    // A missing date is missing, not impossible — the customer should be told to
    // pick one, not that the one they picked is in the past.
    it("calls a blank date missing rather than past", () => {
      expect(
        validate(
          form({ ...BUYER, ...PAID, date: "", deliveryMethod: "retiro" }),
          TODAY,
        ).date,
      ).toBe("required");
    });
  });
});

describe("toIsoDate", () => {
  // The date input speaks yyyy-mm-dd, and so must the "today" it is floored at.
  // Built from the local calendar rather than from an ISO timestamp, which in
  // Caracas would name yesterday for most of the evening.
  it("names the local calendar day", () => {
    expect(toIsoDate(new Date(2026, 6, 27, 23, 30))).toBe("2026-07-27");
  });

  it("pads a single-digit month and day", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

function product(slug: string, priceUsdCents: number): Product {
  return {
    id: slug,
    slug,
    name: slug,
    description: "",
    priceUsdCents,
    images: ["/images/products/x.jpg"],
    categorySlug: "ramos",
    occasions: [],
    flowerTypes: [],
    colours: [],
    size: "mediano",
  };
}

const CATALOG = [product("ramo", 2500), product("caja", 1800)];
const CART: Cart = [
  { slug: "ramo", qty: 2 },
  { slug: "caja", qty: 1 },
];

const FEE = { deliveryFeeUsdCents: 500 };

describe("quoteOrder", () => {
  it("adds the flat fee to a subtotal taken from the catalog", () => {
    const quote = quoteOrder(
      CART,
      CATALOG,
      form({ deliveryMethod: "envio" }),
      FEE,
    );

    expect(quote.subtotalCents).toBe(6800);
    expect(quote.deliveryCents).toBe(500);
    expect(quote.totalCents).toBe(7300);
  });

  it("zeroes the fee when the customer collects in store", () => {
    const quote = quoteOrder(
      CART,
      CATALOG,
      form({ deliveryMethod: "retiro" }),
      FEE,
    );

    expect(quote.deliveryCents).toBe(0);
    expect(quote.totalCents).toBe(6800);
  });

  // Not a hard-coded 500 anywhere: a shop that delivers free is a config change.
  it("charges nothing for delivery when the shop's fee is zero", () => {
    const quote = quoteOrder(CART, CATALOG, form({ deliveryMethod: "envio" }), {
      deliveryFeeUsdCents: 0,
    });

    expect(quote.deliveryCents).toBe(0);
    expect(quote.totalCents).toBe(6800);
  });

  /**
   * The whole point of the flat fee is that the total is exact before payment.
   * Until a method is chosen there is no exact total, and quoting the subtotal
   * as one would be the single most expensive lie this page could tell.
   */
  it("withholds the fee and the total until a method is chosen", () => {
    const quote = quoteOrder(CART, CATALOG, EMPTY_FORM, FEE);

    expect(quote.subtotalCents).toBe(6800);
    expect(quote.deliveryCents).toBeNull();
    expect(quote.totalCents).toBeNull();
  });

  it("resolves the lines the summary renders, in cart order", () => {
    const quote = quoteOrder(
      CART,
      CATALOG,
      form({ deliveryMethod: "envio" }),
      FEE,
    );

    expect(
      quote.items.map((item) => [
        item.product.slug,
        item.qty,
        item.lineTotalCents,
      ]),
    ).toEqual([
      ["ramo", 2, 5000],
      ["caja", 1, 1800],
    ]);
  });

  it("quotes an empty cart at nothing rather than throwing", () => {
    const quote = quoteOrder(
      [],
      CATALOG,
      form({ deliveryMethod: "envio" }),
      FEE,
    );

    expect(quote.items).toEqual([]);
    expect(quote.subtotalCents).toBe(0);
    // The fee still stands: an empty cart is the guard's problem, not the
    // arithmetic's.
    expect(quote.totalCents).toBe(500);
  });
});

/**
 * Named products, because from here on what the shop reads is under test and a
 * line saying "2x ramo" would prove nothing about the line that says
 * "2x Ramo Primavera". Prices chosen to reach the template's own figures.
 */
const NAMED: Product[] = [
  { ...product("ramo", 2500), name: "Ramo Primavera" },
  { ...product("girasoles", 1800), name: "Girasoles Radiantes" },
];

const NAMED_CART: Cart = [
  { slug: "ramo", qty: 2 },
  { slug: "girasoles", qty: 1 },
];

/** The order the locked template was written from, field for field. */
const TEMPLATE_FORM = form({
  buyerName: "Juan Álvarez",
  buyerPhone: "0414-9876543",
  buyerEmail: "juan@example.com",
  deliveryMethod: "envio",
  isGift: true,
  recipientName: "María Pérez",
  recipientPhone: "0412-1234567",
  address: "Av. Principal, Edif. Sol, Apto 4B",
  landmark: "frente a la panadería",
  zone: "Chacao",
  date: "2026-07-25",
  timeWindow: "tarde",
  cardMessage: "Feliz cumpleaños ❤️",
  cardFrom: "Juan",
  notes: "Entregar antes del mediodía si es posible",
  paymentMethod: "pago-movil",
  reference: "123456789",
});

const order = (
  overrides: Partial<CheckoutForm> = {},
  code = "AZ-7K3Q",
): Order =>
  buildOrder(NAMED_CART, NAMED, { ...TEMPLATE_FORM, ...overrides }, FEE, code);

describe("buildOrder", () => {
  /**
   * The order stops asking the catalog anything the moment it is built: it is
   * stashed, reloaded and read back on a page that holds no products, and what
   * the shop was told a ramo cost cannot be allowed to change afterwards.
   */
  it("freezes each line's name and price as they were when it was sent", () => {
    expect(order().items).toEqual([
      {
        name: "Ramo Primavera",
        qty: 2,
        unitPriceCents: 2500,
        lineTotalCents: 5000,
      },
      {
        name: "Girasoles Radiantes",
        qty: 1,
        unitPriceCents: 1800,
        lineTotalCents: 1800,
      },
    ]);
  });

  it("carries the money the customer was shown", () => {
    const built = order();

    expect(built.subtotalCents).toBe(6800);
    expect(built.deliveryCents).toBe(500);
    expect(built.totalCents).toBe(7300);
  });

  it("charges a pickup nothing to deliver, exactly as the quote did", () => {
    const built = order({ deliveryMethod: "retiro" });

    expect(built.deliveryCents).toBe(0);
    expect(built.totalCents).toBe(6800);
  });

  // Generated outside and handed in, so this stays a pure function of its
  // arguments and the randomness has one home.
  it("carries the code it was given", () => {
    expect(order({}, "AZ-0001").code).toBe("AZ-0001");
  });
});

describe("orderMessage", () => {
  /**
   * The template, whole. Every rule below takes one section away or changes one
   * line of it, so this is the one assertion that says what a complete order
   * looks like — and the only place the exact wording, the bullets, the em
   * dashes and the `*bold*` markers are pinned down.
   */
  it("writes the locked template for a complete order", () => {
    expect(orderMessage(order())).toBe(
      [
        "Hola Azahar 🌸 Quiero confirmar mi pedido *AZ-7K3Q*",
        "",
        "*Productos*",
        "• 2x Ramo Primavera — $25 c/u",
        "• 1x Girasoles Radiantes — $18",
        "Subtotal: $68",
        "Envío: $5",
        "*Total: $73*",
        "",
        "*Entrega*",
        "Tipo: Envío a domicilio",
        "Fecha: 2026-07-25 (Tarde)",
        "Dirección: Av. Principal, Edif. Sol, Apto 4B",
        "Punto de referencia: frente a la panadería",
        "Zona: Chacao",
        "",
        "*Destinatario (regalo)*",
        "Nombre: María Pérez",
        "Teléfono: 0412-1234567",
        'Tarjeta: "Feliz cumpleaños ❤️"',
        "De parte de: Juan",
        "",
        "*Comprador*",
        "Nombre: Juan Álvarez",
        "Teléfono: 0414-9876543",
        "Email: juan@example.com",
        "",
        "*Pago*",
        "Método: Pago Móvil",
        "Referencia: 123456789",
        "(Te envío el comprobante en este chat 📎)",
        "",
        "*Notas*",
        "Entregar antes del mediodía si es posible",
      ].join("\n"),
    );
  });

  /**
   * Sections appear only when they say something. Two reasons, and the second is
   * the one that bites: an empty heading is noise in a chat the florist reads on
   * a phone, and every line spent on nothing is a line closer to the deep-link's
   * ceiling.
   */
  describe("the sections that come and go", () => {
    it("leaves out the recipient when the flowers are not a gift", () => {
      const message = orderMessage(order({ isGift: false, cardMessage: "" }));

      expect(message).not.toContain("Destinatario");
      expect(message).not.toContain("María Pérez");
    });

    it("leaves out the address when the customer is collecting", () => {
      const message = orderMessage(
        order({ deliveryMethod: "retiro", landmark: "", zone: "" }),
      );

      expect(message).toContain("Tipo: Retiro en tienda");
      expect(message).not.toContain("Dirección:");
      expect(message).not.toContain("Av. Principal");
    });

    // The zone and the landmark are the courier's help, not the shop's
    // requirement, and a blank one must not leave a label with nothing after it.
    it("leaves out the landmark and the zone when they were not filled in", () => {
      const message = orderMessage(order({ landmark: "", zone: "" }));

      expect(message).toContain("Dirección: Av. Principal, Edif. Sol, Apto 4B");
      expect(message).not.toContain("Punto de referencia");
      expect(message).not.toContain("Zona");
    });

    it("leaves out the notes when there are none", () => {
      expect(orderMessage(order({ notes: "" }))).not.toContain("Notas");
    });

    it("leaves out the card when nothing was written on it", () => {
      expect(orderMessage(order({ cardMessage: "" }))).not.toContain("Tarjeta");
    });

    // A gift with no card is still from somebody, and that is the recipient's
    // business rather than the card's.
    it("still says who a gift is from when no card was written", () => {
      expect(orderMessage(order({ cardMessage: "" }))).toContain(
        "De parte de: Juan",
      );
    });

    // Blank is how a gift is sent anonymously — the one case where an empty field
    // is an answer.
    it("signs nothing when the customer cleared the signature", () => {
      expect(orderMessage(order({ cardFrom: "" }))).not.toContain(
        "De parte de",
      );
    });

    /**
     * A card written on an order that is not a gift still has to be handed to
     * the florist, who writes it out by hand — so it keeps its own heading
     * rather than riding in a recipient block that does not exist.
     */
    it("gives the card its own section when the order is not a gift", () => {
      const message = orderMessage(order({ isGift: false }));

      expect(message).not.toContain("Destinatario");
      expect(message).toContain(
        ["*Tarjeta*", '"Feliz cumpleaños ❤️"', "De parte de: Juan"].join("\n"),
      );
    });

    /**
     * And no heading at all when there is nothing to write. "De parte de" mirrors
     * the buyer's name by default, so a section gated on the signature would
     * appear on almost every order to say what the Comprador block already says.
     */
    it("gives it no section when the order is not a gift and the card is blank", () => {
      expect(
        orderMessage(order({ isGift: false, cardMessage: "" })),
      ).not.toContain("Tarjeta");
    });

    it("says nothing about a franja the customer had no preference about", () => {
      expect(orderMessage(order({ timeWindow: "" }))).toContain(
        "Fecha: 2026-07-25\n",
      );
    });

    // `otra` exists because a shop that delivers all day cannot enumerate every
    // arrangement a family makes, so the customer's own words are the franja.
    it("uses the customer's own words for a franja they wrote themselves", () => {
      expect(
        orderMessage(
          order({ timeWindow: "otra", timeWindowNote: "después de las 4 pm" }),
        ),
      ).toContain("Fecha: 2026-07-25 (después de las 4 pm)");
    });
  });

  /**
   * Efectivo is the rail that behaves differently everywhere, and here is where
   * it matters most: the shop reads this message to decide whether to prepare
   * flowers, and *pago contra entrega* means nothing has been paid yet.
   */
  describe("paying in cash", () => {
    const CASH = { paymentMethod: "efectivo", reference: "" } as const;

    it("says the money changes hands on delivery, and asks for no reference", () => {
      const message = orderMessage(order(CASH));

      expect(message).toContain(
        ["*Pago*", "Método: Efectivo (pago contra entrega)"].join("\n"),
      );
      expect(message).not.toContain("Referencia");
    });

    // Nothing was transferred, so there is no screenshot to promise.
    it("promises no comprobante for a payment that has not happened", () => {
      expect(orderMessage(order(CASH))).not.toContain("comprobante");
    });

    it("names the note the courier has to bring change for", () => {
      expect(
        orderMessage(order({ ...CASH, needsChange: true, changeAmount: "50" })),
      ).toContain("Vuelto: Pago con $50");
    });

    // The hint asks for a bare number, and a customer who types the currency
    // mark anyway must not be quoted back "$$50".
    it("marks the amount as dollars exactly once", () => {
      expect(
        orderMessage(
          order({ ...CASH, needsChange: true, changeAmount: " $50 " }),
        ),
      ).toContain("Vuelto: Pago con $50");
    });

    it("says nothing about change when the customer needs none", () => {
      expect(orderMessage(order(CASH))).not.toContain("Vuelto");
    });
  });
});

describe("orderToWhatsAppUrl", () => {
  const SHOP = { whatsappNumber: "584121234567" };

  it("addresses the shop's own chat", () => {
    expect(orderToWhatsAppUrl(order(), SHOP)).toMatch(
      /^https:\/\/wa\.me\/584121234567\?text=/,
    );
  });

  /**
   * The failure this prevents is a link that opens a chat full of `%2520`: the
   * message goes through `encodeURIComponent` once, so decoding the query once
   * gives back exactly the message.
   */
  it("encodes the message exactly once", () => {
    const built = order();
    const text = new URL(orderToWhatsAppUrl(built, SHOP)).searchParams.get(
      "text",
    );

    expect(text).toBe(orderMessage(built));
    expect(orderToWhatsAppUrl(built, SHOP)).not.toContain("%25");
  });

  it("carries its newlines as %0A", () => {
    const url = orderToWhatsAppUrl(order(), SHOP);

    expect(url).toContain("%0A");
    expect(url).not.toContain("\n");
  });

  /**
   * WhatsApp's own guidance: country code plus digits, no `+`, no leading zero,
   * no separators. The shop owner types this number into an environment variable
   * by hand, and a `+58 412-123 4567` that reaches the link is a dead button on
   * every order — so the shape is enforced here rather than hoped for.
   */
  it("reduces a hand-typed number to the digits wa.me accepts", () => {
    expect(
      orderToWhatsAppUrl(order(), { whatsappNumber: "+58 (412) 123-4567" }),
    ).toContain("wa.me/584121234567?");

    expect(
      orderToWhatsAppUrl(order(), { whatsappNumber: "0584121234567" }),
    ).toContain("wa.me/584121234567?");
  });

  /**
   * The ceiling the whole message design answers to. A deep-link that WhatsApp
   * truncates loses the *end* of the order — the payment reference, the notes —
   * and nothing on the customer's screen would say so.
   *
   * Asserted against carts nobody would really send: every product in a
   * fifty-item catalog, ninety-nine of each, long names, and both capped boxes
   * filled to their caps.
   */
  describe("the ~2000-character ceiling", () => {
    /** Long-named, dear, and far more of them than a florist ever gets. */
    const many = (count: number): Product[] =>
      Array.from({ length: count }, (_, index) => ({
        ...product(`arreglo-${index}`, 12_550),
        name: `Arreglo Primaveral de Rosas y Lirios Blancos ${index}`,
      }));

    const url = (products: Product[], qty: number) =>
      orderToWhatsAppUrl(
        buildOrder(
          products.map((item) => ({ slug: item.slug, qty })),
          products,
          {
            ...TEMPLATE_FORM,
            cardMessage: "Feliz cumpleaños ❤️ ".repeat(10).trim(),
            notes: "Dejarlo con el conserje si no hay nadie. ".repeat(7).trim(),
          },
          FEE,
          "AZ-7K3Q",
        ),
        SHOP,
      );

    it("holds for a deliberately large order", () => {
      expect(url(many(12), 9).length).toBeLessThan(2000);
    });

    it("holds for a cart of the whole catalog", () => {
      expect(url(many(50), 99).length).toBeLessThan(2000);
    });

    /**
     * And says so, rather than quietly dropping the tail: the count and its
     * money ride in one line, so the subtotal still adds up and the shop can see
     * that what it is missing is names.
     */
    it("summarises the lines it had to leave out, money included", () => {
      const products = many(50);
      const built = buildOrder(
        products.map((item) => ({ slug: item.slug, qty: 1 })),
        products,
        TEMPLATE_FORM,
        FEE,
        "AZ-7K3Q",
      );
      const message = orderMessage(built);

      expect(message).toContain(
        "• 1x Arreglo Primaveral de Rosas y Lirios Blancos 0",
      );
      expect(message).toMatch(/• y \d+ productos más — \$\d/);
      expect(message).toContain(`Referencia: ${TEMPLATE_FORM.reference}`);
    });

    // A real order is never summarised, which is the other half of the rule.
    it("itemises every line of an order a shop would actually receive", () => {
      expect(orderMessage(order())).not.toContain("productos más");
    });
  });
});

describe("orderCode", () => {
  /** A scripted source, so the code is a fact rather than a shape. */
  function source(...values: number[]): () => number {
    let index = 0;
    return () => values[index++ % values.length];
  }

  it("spells four base-36 characters out of the source it is given", () => {
    expect(orderCode(source(0, 0.5, 0.999, 0.3))).toBe("AZ-0IZA");
  });

  it("gives two different draws two different codes", () => {
    expect(orderCode(source(0))).not.toBe(orderCode(source(0.5)));
  });

  // A source that ever returns its exclusive upper bound would otherwise index
  // past the alphabet and spell "undefined" into the customer's order code.
  it("survives a source that returns one", () => {
    expect(orderCode(source(1))).toBe("AZ-ZZZZ");
  });

  it("reads as an order code without a source to script it", () => {
    expect(orderCode()).toMatch(/^AZ-[0-9A-Z]{4}$/);
  });
});

/**
 * `sessionStorage` reduced to what the stash uses — the same shape the cart's
 * adapter takes, and for the same reason: the failure cases are bytes already
 * sitting in the store.
 */
function fakeStorage(stored?: string) {
  const store = new Map<string, string>(
    stored === undefined ? [] : [[ORDER_STORAGE_KEY, stored]],
  );

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  };
}

/**
 * The handoff. It exists because the confirmation page is a fresh page load with
 * no props from the form that produced it — and it is `sessionStorage` rather
 * than `localStorage` because an order belongs to the tab that placed it and
 * should not greet the customer again next week.
 */
describe("the stashed order", () => {
  it("round-trips the order the confirmation page is going to render", () => {
    const storage = fakeStorage();
    const built = order();

    stashOrder(storage, built);

    expect(readStashedOrder(storage)).toEqual(built);
  });

  // Landing here with nothing stashed is a customer who typed the URL or opened
  // a new tab; the page sends them home, and this is the answer it reads.
  it("reads nothing when nothing was stashed", () => {
    expect(readStashedOrder(fakeStorage())).toBeNull();
  });

  it("reads nothing out of a store it cannot make sense of", () => {
    expect(readStashedOrder(fakeStorage("{not json"))).toBeNull();
    expect(readStashedOrder(fakeStorage("null"))).toBeNull();
    expect(readStashedOrder(fakeStorage("[]"))).toBeNull();
    expect(readStashedOrder(fakeStorage('{"code":"AZ-7K3Q"}'))).toBeNull();
  });

  // An order with nothing in it is not an order, and rendering one would be a
  // receipt for no flowers.
  it("reads nothing out of an order with no items", () => {
    expect(
      readStashedOrder(fakeStorage(JSON.stringify({ ...order(), items: [] }))),
    ).toBeNull();
  });

  /**
   * All of the lines or none of them. Keeping the ones that parsed would draw a
   * record listing fewer flowers than its own subtotal is for — a receipt that
   * disagrees with itself, which is worse than being sent home.
   */
  it("reads nothing out of an order with one unreadable line", () => {
    const built = order();

    expect(
      readStashedOrder(
        fakeStorage(
          JSON.stringify({
            ...built,
            items: [built.items[0], { name: "Girasoles", qty: "uno" }],
          }),
        ),
      ),
    ).toBeNull();
  });

  /**
   * Everything in a store is untrusted input, and this one is read straight into
   * the message the customer can still re-send. A field that is not what it
   * claims falls back to blank rather than reaching a template as `undefined`.
   */
  it("falls back to blank for a field that is not what it claims to be", () => {
    const stashed = readStashedOrder(
      fakeStorage(
        JSON.stringify({
          ...order(),
          form: {
            ...TEMPLATE_FORM,
            buyerName: 42,
            isGift: "yes",
            deliveryMethod: "helicoptero",
            timeWindow: "medianoche",
          },
        }),
      ),
    );

    expect(stashed?.form.buyerName).toBe("");
    expect(stashed?.form.isGift).toBe(false);
    expect(stashed?.form.deliveryMethod).toBe("");
    expect(stashed?.form.timeWindow).toBe("");
    // The rest of the order survived, so a hand-edited field costs one line
    // rather than the whole record.
    expect(stashed?.form.buyerEmail).toBe("juan@example.com");
  });

  it("survives storage the browser refuses to hand over", () => {
    const hostile = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };

    expect(readStashedOrder(hostile)).toBeNull();
    expect(() => stashOrder(hostile, order())).not.toThrow();
  });
});
