import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CART_STORAGE_KEY } from "@/lib/cart";
import type { Cart } from "@/lib/cart";
import type { Product } from "@/lib/catalog/types";
import { toIsoDate } from "@/lib/order";
import type { PaymentRail } from "@/lib/payment";

/**
 * Wiring only.
 *
 * Which fields the shop needs, what the order comes to and which rows a rail
 * shows are `lib/order`'s and `lib/payment`'s to prove, and all of it is proven
 * without a DOM — not one case from those tests is restated here. What is left
 * is what no pure test can see: whether those rules are actually *plugged in*. A
 * block that stays on screen after the gift toggle is unticked, an asterisk that
 * never moves when the customer switches to pickup, a summary quoting a subtotal
 * as a total, a date picker with no floor, five sets of bank details on screen
 * at once, a send button that lights up on an unpaid order — every one of them
 * passes a green `lib/order`.
 *
 * So each assertion below is about connection: a toggle changes what is asked
 * for, a method changes what is owed, a rail changes what is on screen, and an
 * empty cart never gets a form.
 */

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

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

const CATALOG = [product("ramo", "Ramo Primavera", 2500)];
const FEE = 500;

/**
 * Rails as the page receives them — hand-built rather than run through
 * `availableRails`, so a change to which fields a real Pago Móvil needs cannot
 * reach into a test about revealing one block at a time. The values are
 * deliberately unmistakable: finding one on screen says exactly which rail is
 * showing.
 */
const RAILS: PaymentRail[] = [
  {
    method: "pago-movil",
    label: "Pago Móvil",
    instruction: "Haz el pago móvil con estos datos.",
    details: [{ label: "Teléfono", value: "0412-0000001" }],
  },
  {
    method: "zelle",
    label: "Zelle",
    instruction: "Envía el Zelle a estos datos.",
    details: [{ label: "Titular", value: "Azahar Flowers LLC" }],
  },
  {
    method: "efectivo",
    label: "Efectivo",
    instruction: "Pagas al recibir el pedido.",
    details: [],
  },
];

/**
 * A cart is a precondition of this page existing at all, so the store is seeded
 * before mounting — read once per page load, which is what a fresh module
 * registry means here.
 */
async function visit(cart: Cart = [{ slug: "ramo", qty: 2 }]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));

  vi.resetModules();
  const [{ CartProvider }, { CheckoutView }] = await Promise.all([
    import("@/components/cart-provider"),
    import("@/components/checkout-view"),
  ]);

  const user = userEvent.setup();
  render(
    <CartProvider knownSlugs={CATALOG.map((item) => item.slug)}>
      <CheckoutView
        products={CATALOG}
        deliveryFeeUsdCents={FEE}
        rails={RAILS}
      />
    </CartProvider>,
  );

  // Queried on use, not here: a page that redirects an empty cart renders none
  // of these, which is one of the things under test.
  const radio = (name: RegExp) => screen.getByRole("radio", { name });

  return {
    user,
    chooseDelivery: () => user.click(radio(/^Envío a domicilio/)),
    choosePickup: () => user.click(radio(/^Retiro en tienda/)),
    chooseRail: (name: RegExp) => user.click(radio(name)),
    /** The gift toggle is the only checkbox on the page until cash is chosen. */
    toggleGift: () => user.click(screen.getAllByRole("checkbox")[0]),
    /**
     * Everything the shop asks for whatever the customer chooses, short of
     * paying: a pickup needs no address, and no rail has been picked yet.
     */
    fillDetails: async () => {
      await user.type(screen.getByLabelText(/^Nombre completo/), "Juan");
      await user.type(screen.getByLabelText(/^Teléfono \/ WhatsApp/), "0414");
      await user.type(screen.getByLabelText(/^Correo/), "juan@example.com");
      await user.click(radio(/^Retiro en tienda/));
      // A date input is not typed into character by character the way a text
      // field is; the picker hands the value over whole.
      fireEvent.change(screen.getByLabelText(/^Fecha de entrega/), {
        target: { value: toIsoDate(new Date()) },
      });
    },
  };
}

const submitButton = () =>
  screen.getByRole("button", { name: "Enviar pedido por WhatsApp" });

/**
 * The whole summary card as one string. Deliberately not row-by-row: what the
 * figures come to is `quoteOrder`'s to prove, so these assertions are about what
 * the card *says* rather than about how its rows are built.
 */
const summary = () => screen.getByRole("complementary").textContent ?? "";

const block = (heading: string) =>
  screen.queryByRole("heading", { name: heading });

beforeEach(() => {
  window.localStorage.clear();
  router.replace.mockClear();
});

describe("the checkout island", () => {
  it("asks for an address only when the flowers are being delivered", async () => {
    const { chooseDelivery, choosePickup } = await visit();

    expect(block("Dirección de entrega")).toBeNull();

    await chooseDelivery();
    expect(block("Dirección de entrega")).toBeInTheDocument();

    await choosePickup();
    expect(block("Dirección de entrega")).toBeNull();
  });

  it("asks for a recipient only when the order is a gift", async () => {
    const { toggleGift } = await visit();

    expect(block("Destinatario")).toBeNull();

    await toggleGift();
    expect(block("Destinatario")).toBeInTheDocument();

    await toggleGift();
    expect(block("Destinatario")).toBeNull();
  });

  /**
   * The rule the page exists to communicate: the courier needs the recipient's
   * phone, and on a pickup there is no courier. The marking has to move with the
   * method, or the customer is told the wrong thing about the same field.
   */
  it("marks the recipient's phone required for a delivery and optional for a pickup", async () => {
    const { chooseDelivery, choosePickup, toggleGift } = await visit();

    await toggleGift();
    await chooseDelivery();

    const phone = screen.getByLabelText(/^Teléfono de quien recibe/);
    expect(phone).toHaveAttribute("aria-required", "true");

    await choosePickup();
    expect(
      screen.getByLabelText(/^Teléfono de quien recibe/),
    ).not.toHaveAttribute("aria-required");
  });

  /**
   * What the three figures come to — the fee added, the fee zeroed on a pickup —
   * is `order.test.ts`'s, and no amount is named here. What only a mounted page
   * can show is that the card is fed by *this* catalog and answers to *this*
   * radio group.
   */
  it("feeds the summary from the catalog, and moves it with the method", async () => {
    const { chooseDelivery, choosePickup } = await visit();

    // Two of a product whose name and price the store never held.
    expect(summary()).toContain("2 × Ramo Primavera");
    expect(summary()).toContain("Por definir");

    await chooseDelivery();
    const delivered = summary();
    expect(delivered).not.toContain("Por definir");

    // A different method, a different card — so the choice reaches the quote
    // rather than merely unlocking it.
    await choosePickup();
    expect(summary()).not.toBe(delivered);
  });

  // The picker itself refuses yesterday, rather than leaving it to a message
  // after the fact — and the floor is the visitor's own day, not the day this
  // page was exported.
  it("floors the date picker at today", async () => {
    await visit();

    expect(screen.getByLabelText(/^Fecha de entrega/)).toHaveAttribute(
      "min",
      toIsoDate(new Date()),
    );
  });

  it("signs the card with the buyer's name until the customer signs it themselves", async () => {
    const { user } = await visit();

    const buyer = screen.getByLabelText(/^Nombre completo/);
    const from = screen.getByLabelText(/^De parte de/);

    await user.type(buyer, "Juan");
    expect(from).toHaveValue("Juan");

    // Once they have written their own, a later edit to their name must not
    // re-sign the card — clearing this field is how a gift is sent anonymously.
    await user.type(from, " y Ana");
    await user.type(buyer, " Álvarez");

    expect(buyer).toHaveValue("Juan Álvarez");
    expect(from).toHaveValue("Juan y Ana");
  });

  /**
   * Five rails' worth of account numbers on one screen is a customer scanning
   * for theirs with a banking app open in the other window. Choosing one is what
   * reveals one — and, just as importantly, what hides the last.
   */
  it("shows the account details of the chosen rail and no other", async () => {
    const { chooseRail } = await visit();

    expect(screen.queryByText("0412-0000001")).toBeNull();
    expect(screen.queryByText("Azahar Flowers LLC")).toBeNull();

    await chooseRail(/^Pago Móvil/);
    expect(screen.getByText("0412-0000001")).toBeInTheDocument();
    expect(screen.queryByText("Azahar Flowers LLC")).toBeNull();

    await chooseRail(/^Zelle/);
    expect(screen.getByText("Azahar Flowers LLC")).toBeInTheDocument();
    expect(screen.queryByText("0412-0000001")).toBeNull();
  });

  // Cash is paid at the door, so there is no reference to type — asking for one
  // would leave the button locked on the only rail that needs no bank at all.
  it("asks for a reference on a transfer and for change on cash", async () => {
    const { chooseRail } = await visit();

    await chooseRail(/^Pago Móvil/);
    expect(screen.getByLabelText(/^Número de referencia/)).toBeInTheDocument();
    expect(screen.queryByText("¿Necesitas vuelto?")).toBeNull();

    await chooseRail(/^Efectivo/);
    expect(screen.queryByLabelText(/^Número de referencia/)).toBeNull();
    expect(screen.getByText("¿Necesitas vuelto?")).toBeInTheDocument();
  });

  /**
   * The gate, in the order a customer meets it. What counts as valid is
   * `lib/order`'s and is not restated — what is under test is that the button
   * asks it at all, and asks it again after every keystroke rather than once on
   * submit.
   */
  it("keeps the send button shut until the order is complete and paid", async () => {
    const { user, chooseRail, fillDetails } = await visit();

    expect(submitButton()).toBeDisabled();

    await fillDetails();
    // Everything but the payment: the rail itself is still missing.
    expect(submitButton()).toBeDisabled();

    await chooseRail(/^Pago Móvil/);
    expect(submitButton()).toBeDisabled();

    await user.type(screen.getByLabelText(/^Número de referencia/), "00123456");
    expect(submitButton()).toBeEnabled();
  });

  it("sends a customer with an empty cart back to the cart", async () => {
    await visit([]);

    expect(router.replace).toHaveBeenCalledWith("/carrito");
    expect(block("Tus datos")).toBeNull();
  });

  // A cart of nothing but retired products is an empty cart, and the guard has
  // to see it that way — the lines are gone once the catalog is consulted.
  it("treats a cart the catalog no longer stocks as empty", async () => {
    await visit([{ slug: "corona-retirada", qty: 1 }]);

    expect(router.replace).toHaveBeenCalledWith("/carrito");
  });
});
