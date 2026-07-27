import { describe, expect, it } from "vitest";

import type { Cart } from "@/lib/cart";
import type { Product } from "@/lib/catalog/types";
import {
  EMPTY_FORM,
  quoteOrder,
  requiredFields,
  toIsoDate,
  validate,
} from "@/lib/order";
import type { CheckoutForm } from "@/lib/order";

/**
 * The order seam.
 *
 * Two things are proven here, and both are the kind that go quietly wrong. The
 * first is the **conditional-required web**: which fields the shop actually
 * needs depends on three answers — delivery-or-pickup, is-it-a-gift and how the
 * customer paid — and every combination of them asks for a different set. The
 * second is the **money**, whose only rule — pickup costs nothing to deliver —
 * is one `if` that a call site could get backwards without anything else
 * noticing.
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
