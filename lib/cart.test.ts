import { describe, expect, it } from "vitest";

import {
  CART_STORAGE_KEY,
  MAX_LINE_QTY,
  addLine,
  cartCount,
  dropUnknownSlugs,
  readCart,
  removeLine,
  resolveCart,
  setLineQty,
  writeCart,
} from "@/lib/cart";
import type { Cart } from "@/lib/cart";
import type { Product } from "@/lib/catalog/types";

/**
 * A hand-built product carrying only what the cart cares about: a slug to key
 * on and a price to multiply. The 50-item seed is production content, and using
 * it here would turn every expectation into a lookup.
 */
function product(slug: string, priceUsdCents: number): Product {
  return {
    id: slug,
    slug,
    name: slug,
    description: "",
    priceUsdCents,
    images: [`/images/products/${slug}.jpg`],
    categorySlug: "ramos",
    occasions: [],
    flowerTypes: [],
    colours: [],
    size: "mediano",
  };
}

const RAMO = product("ramo", 2500);
const CAJA = product("caja", 1800);
const CATALOG = [RAMO, CAJA];

/**
 * `localStorage` reduced to what the adapter uses, so the resilience cases can
 * be set up as what they really are: bytes already sitting in the store.
 */
function fakeStorage(stored?: string) {
  const store = new Map<string, string>(
    stored === undefined ? [] : [[CART_STORAGE_KEY, stored]],
  );

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    /** What the adapter left behind, for the round-trip assertions. */
    raw: () => store.get(CART_STORAGE_KEY) ?? null,
  };
}

describe("cart lines", () => {
  it("adds a product as a new line of one", () => {
    expect(addLine([], "ramo")).toEqual([{ slug: "ramo", qty: 1 }]);
  });

  it("increments an existing line rather than duplicating it", () => {
    const cart = addLine(addLine([], "ramo"), "ramo");

    expect(cart).toEqual([{ slug: "ramo", qty: 2 }]);
  });

  it("keeps lines in the order they were added", () => {
    const cart = addLine(addLine(addLine([], "ramo"), "caja"), "ramo");

    expect(cart.map((line) => line.slug)).toEqual(["ramo", "caja"]);
  });

  it("changes one line's quantity and leaves the others alone", () => {
    const cart: Cart = [
      { slug: "ramo", qty: 1 },
      { slug: "caja", qty: 3 },
    ];

    expect(setLineQty(cart, "caja", 5)).toEqual([
      { slug: "ramo", qty: 1 },
      { slug: "caja", qty: 5 },
    ]);
  });

  it("clamps a quantity into a range a customer can actually order", () => {
    const cart: Cart = [{ slug: "ramo", qty: 4 }];

    expect(setLineQty(cart, "ramo", 0)).toEqual([{ slug: "ramo", qty: 1 }]);
    expect(setLineQty(cart, "ramo", -3)).toEqual([{ slug: "ramo", qty: 1 }]);
    expect(setLineQty(cart, "ramo", MAX_LINE_QTY + 10)).toEqual([
      { slug: "ramo", qty: MAX_LINE_QTY },
    ]);
  });

  it("removes a line", () => {
    const cart: Cart = [
      { slug: "ramo", qty: 1 },
      { slug: "caja", qty: 2 },
    ];

    expect(removeLine(cart, "ramo")).toEqual([{ slug: "caja", qty: 2 }]);
  });

  it("counts units rather than lines, which is what the badge shows", () => {
    expect(cartCount([])).toBe(0);
    expect(
      cartCount([
        { slug: "ramo", qty: 2 },
        { slug: "caja", qty: 3 },
      ]),
    ).toBe(5);
  });

  it("never mutates the cart it is given", () => {
    const cart: Cart = [{ slug: "ramo", qty: 1 }];

    addLine(cart, "ramo");
    setLineQty(cart, "ramo", 7);
    removeLine(cart, "ramo");

    expect(cart).toEqual([{ slug: "ramo", qty: 1 }]);
  });
});

describe("resolving a cart against the catalog", () => {
  it("prices every line from the catalog", () => {
    const { items, subtotalCents } = resolveCart(
      [
        { slug: "ramo", qty: 2 },
        { slug: "caja", qty: 1 },
      ],
      CATALOG,
    );

    expect(items).toEqual([
      { product: RAMO, qty: 2, lineTotalCents: 5000 },
      { product: CAJA, qty: 1, lineTotalCents: 1800 },
    ]);
    expect(subtotalCents).toBe(6800);
  });

  it("takes the price from the catalog, never from what was stored", () => {
    // A cart saved when the ramo cost $1 — the shape a hand-edited or
    // long-forgotten store would have. The stored figure must not survive.
    const storage = fakeStorage(
      JSON.stringify([{ slug: "ramo", qty: 2, priceUsdCents: 100 }]),
    );

    const { subtotalCents } = resolveCart(readCart(storage), CATALOG);

    expect(subtotalCents).toBe(5000);
  });

  it("drops a line whose product the catalog no longer has, and its money with it", () => {
    const { items, subtotalCents } = resolveCart(
      [
        { slug: "ramo", qty: 1 },
        { slug: "corona-retirada", qty: 4 },
      ],
      CATALOG,
    );

    expect(items).toEqual([{ product: RAMO, qty: 1, lineTotalCents: 2500 }]);
    expect(subtotalCents).toBe(2500);
  });

  it("resolves an empty cart to nothing owed", () => {
    expect(resolveCart([], CATALOG)).toEqual({ items: [], subtotalCents: 0 });
  });
});

describe("dropping slugs the catalog no longer has", () => {
  it("keeps the lines the catalog still knows", () => {
    const cart: Cart = [
      { slug: "ramo", qty: 2 },
      { slug: "corona-retirada", qty: 1 },
      { slug: "caja", qty: 1 },
    ];

    expect(dropUnknownSlugs(cart, ["ramo", "caja"])).toEqual([
      { slug: "ramo", qty: 2 },
      { slug: "caja", qty: 1 },
    ]);
  });
});

describe("persistence", () => {
  it("round-trips a cart through storage", () => {
    const storage = fakeStorage();
    const cart: Cart = [
      { slug: "ramo", qty: 2 },
      { slug: "caja", qty: 1 },
    ];

    writeCart(storage, cart);

    expect(readCart(storage)).toEqual(cart);
  });

  it("reads an empty cart when nothing was ever stored", () => {
    expect(readCart(fakeStorage())).toEqual([]);
  });

  it("reads an empty cart from corrupt JSON instead of throwing", () => {
    expect(readCart(fakeStorage("{not json"))).toEqual([]);
    expect(readCart(fakeStorage(""))).toEqual([]);
  });

  it("reads an empty cart from JSON that is not a list of lines", () => {
    expect(readCart(fakeStorage('"ramo"'))).toEqual([]);
    expect(readCart(fakeStorage("42"))).toEqual([]);
    expect(readCart(fakeStorage("null"))).toEqual([]);
    expect(readCart(fakeStorage('{"ramo":2}'))).toEqual([]);
  });

  it("keeps the usable lines out of a partly broken store", () => {
    const storage = fakeStorage(
      JSON.stringify([
        { slug: "ramo", qty: 2 },
        { slug: "", qty: 1 },
        { slug: "caja" },
        { qty: 3 },
        { slug: "caja", qty: "dos" },
        { slug: "caja", qty: 0 },
        null,
        "caja",
      ]),
    );

    expect(readCart(storage)).toEqual([{ slug: "ramo", qty: 2 }]);
  });

  it("folds a slug stored twice into a single line", () => {
    const storage = fakeStorage(
      JSON.stringify([
        { slug: "ramo", qty: 2 },
        { slug: "ramo", qty: 3 },
      ]),
    );

    expect(readCart(storage)).toEqual([{ slug: "ramo", qty: 5 }]);
  });

  it("clamps a stored quantity nobody could have ordered", () => {
    const storage = fakeStorage(
      JSON.stringify([{ slug: "ramo", qty: 10_000 }]),
    );

    expect(readCart(storage)).toEqual([{ slug: "ramo", qty: MAX_LINE_QTY }]);
  });

  it("survives storage the browser refuses to hand over", () => {
    // Safari's private mode, a disabled-cookies profile: the property itself
    // throws. A cart that cannot be saved must still work for this visit.
    const hostile = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };

    expect(readCart(hostile)).toEqual([]);
    expect(() => writeCart(hostile, [{ slug: "ramo", qty: 1 }])).not.toThrow();
  });
});
