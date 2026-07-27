import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CART_STORAGE_KEY, readCart } from "@/lib/cart";
import type { Product } from "@/lib/catalog/types";

/**
 * Wiring only.
 *
 * What a cart is worth — incrementing rather than duplicating, clamping,
 * subtotals from catalog prices, a tolerant read of the store — is `lib/cart`'s
 * to prove, and it is proven without a DOM. Nothing here re-states any of it.
 * What is left is what no pure test can see: whether the three surfaces are
 * plugged into the same store. A badge that never moves, a row rendering
 * yesterday's cart, a click that never reaches `localStorage` — every one of
 * those passes a green `lib/cart`.
 *
 * So every assertion below is about *connection*: the badge and the page agree,
 * a click lands in the store, and what the store holds comes back next visit.
 */

function product(slug: string, name: string, priceUsdCents: number): Product {
  return {
    id: slug,
    slug,
    name,
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

const RAMO = product("ramo", "Ramo Primavera", 2500);
const CAJA = product("caja", "Caja Sol", 1800);
const CATALOG = [RAMO, CAJA];

/**
 * The product page's button, the header badge and the cart page at once, since
 * "they share one cart" is the whole claim.
 *
 * The store behind them is read once per page load, so a fresh module registry
 * is what a fresh visit means here — which is also what lets a test seed
 * `localStorage` and then mount into it.
 */
async function visit() {
  vi.resetModules();
  const [{ AddToCart }, { CartLink }, { CartProvider }, { CartView }] =
    await Promise.all([
      import("@/components/add-to-cart"),
      import("@/components/cart-link"),
      import("@/components/cart-provider"),
      import("@/components/cart-view"),
    ]);

  return render(
    <CartProvider knownSlugs={CATALOG.map((item) => item.slug)}>
      <CartLink />
      <AddToCart slug={RAMO.slug} />
      <CartView products={CATALOG} />
    </CartProvider>,
  );
}

/** Read back the way the app does, not as the bytes it happens to write. */
const stored = () => readCart(window.localStorage);

beforeEach(() => {
  window.localStorage.clear();
});

describe("the cart island", () => {
  it("adds without leaving the page, and the badge ticks up with it", async () => {
    const user = userEvent.setup();
    await visit();

    await user.click(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    );

    // The confirmation is a live region rather than a navigation or a modal:
    // the customer is still looking at the photograph they were judging.
    expect(screen.getByRole("status")).toHaveTextContent(
      "Agregado a tu carrito",
    );
    expect(
      screen.getByRole("link", { name: "1 artículo en el carrito" }),
    ).toHaveTextContent("1");
    expect(stored()).toEqual([{ slug: "ramo", qty: 1 }]);
  });

  it("renders a line from the catalog rather than from the store", async () => {
    const user = userEvent.setup();
    await visit();

    await user.click(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    );

    // The store holds a slug and a quantity; every word and figure in the row
    // came from the catalog the page was handed.
    expect(
      screen.getByRole("link", { name: "Ramo Primavera" }),
    ).toHaveAttribute("href", "/producto/ramo");
    expect(screen.getByText("$25 c/u")).toBeInTheDocument();
  });

  it("changes a quantity and removes a line, in the page and in the store", async () => {
    const user = userEvent.setup();
    await visit();

    await user.click(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Agregar uno más de Ramo Primavera" }),
    );

    expect(
      screen.getByRole("link", { name: "2 artículos en el carrito" }),
    ).toBeInTheDocument();
    // The line total and the subtotal, moving together.
    expect(screen.getAllByText("$50")).toHaveLength(2);
    expect(stored()).toEqual([{ slug: "ramo", qty: 2 }]);

    await user.click(
      screen.getByRole("button", { name: "Quitar Ramo Primavera del carrito" }),
    );

    expect(screen.getByText("Tu carrito está vacío")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Seguir comprando" }),
    ).toBeInTheDocument();
    expect(stored()).toEqual([]);
  });

  it("comes back tomorrow with the cart, minus what the catalog no longer has", async () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        { slug: "caja", qty: 3 },
        { slug: "corona-retirada", qty: 2 },
      ]),
    );

    await visit();

    expect(screen.getByText("Caja Sol")).toBeInTheDocument();
    expect(screen.getByText("3 artículos")).toBeInTheDocument();
    // The badge counts the same three, not the retired product's two as well.
    expect(
      screen.getByRole("link", { name: "3 artículos en el carrito" }),
    ).toBeInTheDocument();
    // And the store was healed, not merely filtered on the way out.
    expect(stored()).toEqual([{ slug: "caja", qty: 3 }]);
  });
});
