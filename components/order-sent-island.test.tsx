import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CART_STORAGE_KEY } from "@/lib/cart";
import type { Cart } from "@/lib/cart";
import { ORDER_STORAGE_KEY } from "@/lib/order";
import type { Order } from "@/lib/order";

/**
 * Wiring only, and thinner than checkout's — this page renders a record it was
 * handed and asks nothing of the customer but one press.
 *
 * What the record *says* is `lib/order`'s: the sections, which of them appear, the
 * message inside the link and its length are all proven without a DOM, and none
 * of it is restated here. What no pure test can see is the handoff itself — a page
 * that reads no stash, a cart that survives the order that emptied it, or a
 * receipt drawn for a customer who has nothing stashed at all. Each of those is a
 * duplicate order or a dead end, and each is invisible to a green `lib/order`.
 */

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

const SHOP_NUMBER = "584121234567";
const PHONE = "0412-123-4567";

/**
 * An order as the checkout page left it: already resolved, already priced, and
 * holding no product — which is exactly why this page needs no catalog.
 */
const ORDER: Order = {
  code: "AZ-7K3Q",
  items: [
    {
      name: "Ramo Primavera",
      qty: 2,
      unitPriceCents: 2500,
      lineTotalCents: 5000,
    },
  ],
  subtotalCents: 5000,
  deliveryCents: 500,
  totalCents: 5500,
  form: {
    buyerName: "Juan Álvarez",
    buyerPhone: "0414-9876543",
    buyerEmail: "juan@example.com",
    deliveryMethod: "envio",
    isGift: false,
    recipientName: "",
    recipientPhone: "",
    address: "Av. Principal, Edif. Sol, Apto 4B",
    landmark: "",
    zone: "",
    date: "2026-07-28",
    timeWindow: "tarde",
    timeWindowNote: "",
    cardMessage: "",
    cardFrom: "Juan Álvarez",
    notes: "",
    paymentMethod: "pago-movil",
    reference: "00123456",
    needsChange: false,
    changeAmount: "",
  },
};

const CART: Cart = [{ slug: "ramo", qty: 2 }];

/**
 * A visit to the page, with whatever the two stores held when the customer
 * arrived. The module registry is reset per visit because the cart provider reads
 * `localStorage` once per page load, which is what this simulates.
 */
async function visit({ order }: { order?: Order } = { order: ORDER }) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(CART));
  if (order) {
    window.sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
  }

  vi.resetModules();
  const [{ CartProvider }, { OrderSentView }] = await Promise.all([
    import("@/components/cart-provider"),
    import("@/components/order-sent-view"),
  ]);

  render(
    <CartProvider knownSlugs={["ramo"]}>
      <OrderSentView whatsappNumber={SHOP_NUMBER} phoneDisplay={PHONE} />
    </CartProvider>,
  );
}

const storedCart = () => window.localStorage.getItem(CART_STORAGE_KEY);

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  router.replace.mockClear();
});

describe("the confirmation island", () => {
  it("carries the order code and a link to the shop's own chat", async () => {
    await visit();

    expect(screen.getByText("AZ-7K3Q")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Abrir WhatsApp/ }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining(`wa.me/${SHOP_NUMBER}?text=`),
    );
  });

  /**
   * The link is the page's reason for existing: the first attempt may have been
   * blocked, may have opened a tab that never resolved, or may have been closed
   * before the customer pressed send. So it stays, it opens away from this page,
   * and it stays pressable.
   */
  it("keeps the link re-openable rather than spending it once", async () => {
    await visit();

    expect(
      screen.getByRole("link", { name: /Abrir WhatsApp/ }),
    ).toHaveAttribute("target", "_blank");
  });

  // A missing or blocked WhatsApp must not strand an order, so the number is on
  // the page as text — copyable, and named by what it is.
  it("offers the shop's raw number as a way round WhatsApp", async () => {
    await visit();

    expect(screen.getByText(PHONE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Copiar/ })).toBeInTheDocument();
  });

  /**
   * The order exists in a message by the time this page is reached, so the cart
   * has done its job. Leaving it filled is how a reload turns one order into two.
   */
  it("empties the cart on arrival", async () => {
    expect(storedCart()).toBeNull();

    await visit();

    expect(storedCart()).toBe("[]");
  });

  it("sends a customer with no stashed order home, showing them nothing", async () => {
    await visit({ order: undefined });

    expect(router.replace).toHaveBeenCalledWith("/");
    expect(screen.queryByText("AZ-7K3Q")).toBeNull();
  });

  // Their cart is not theirs to lose: nothing was dispatched, so nothing is spent.
  it("leaves the cart alone when there was no order to confirm", async () => {
    await visit({ order: undefined });

    expect(storedCart()).toBe(JSON.stringify(CART));
  });

  /**
   * The record is rendered from the same sections the message is written from, so
   * this asks only that it is rendered at all — the address the customer typed and
   * the product they chose, both read back off the stash. Which blocks a given
   * order has, and what each of them is called, is `orderSections`'.
   */
  it("shows the order back to the customer", async () => {
    await visit();

    expect(
      screen.getByText("Av. Principal, Edif. Sol, Apto 4B"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ramo Primavera/)).toBeInTheDocument();
  });
});
