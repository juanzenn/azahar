import { describe, expect, it } from "vitest";

import { availableRails } from "@/lib/payment";
import type { PaymentRailsConfig } from "@/lib/payment";

/**
 * The rails, as the shop's configuration turns into a payment block.
 *
 * Two claims are worth a test, and both are the kind that fail silently and
 * expensively. The first: **each rail shows exactly the fields that rail needs**
 * — a Pago Móvil with an account number beside it invites the customer to pay
 * into a form of transfer this shop is not watching, and a transfer missing its
 * cédula is a payment the bank will not accept. The second: **a rail the shop
 * has switched off is gone**, not greyed out, because every rail on screen is an
 * invitation to send money somewhere.
 *
 * No DOM: which rows exist is a question about configuration, not about markup.
 */

const RAILS: PaymentRailsConfig = {
  "pago-movil": {
    enabled: true,
    phone: "0412-1234567",
    idNumber: "V-12.345.678",
    bankCode: "0102",
  },
  transferencia: {
    enabled: true,
    accountNumber: "01020000000000000000",
    holder: "Floristería Azahar, C.A.",
    idNumber: "J-12345678-9",
    bank: "Banco de Venezuela",
  },
  zelle: {
    enabled: true,
    account: "pagos@azahar.test",
    holder: "Azahar Flowers LLC",
  },
  binance: {
    enabled: true,
    payId: "987654321",
    wallet: "TJ4kL9mNp2QrS5tUvW8xY1zA3bC6dE7fG",
    network: "TRC20",
  },
  efectivo: { enabled: true },
};

/** A copy of the shop's rails with one of them changed. */
function rails(overrides: Partial<PaymentRailsConfig>): PaymentRailsConfig {
  return { ...RAILS, ...overrides };
}

/** One rail's account block, as label/value pairs in the order shown. */
function rows(config: PaymentRailsConfig, method: string) {
  const rail = availableRails(config).find(
    (candidate) => candidate.method === method,
  );

  return rail?.details.map((detail) => [detail.label, detail.value]);
}

describe("availableRails", () => {
  it("offers every rail the shop has switched on, in a fixed order", () => {
    expect(availableRails(RAILS).map((rail) => rail.method)).toEqual([
      "pago-movil",
      "transferencia",
      "zelle",
      "binance",
      "efectivo",
    ]);
  });

  // Not disabled, not greyed: absent. A rail the shop cannot receive money
  // through has no business being one of the options.
  it("leaves a switched-off rail out of the list entirely", () => {
    const offered = availableRails(
      rails({
        zelle: { ...RAILS.zelle, enabled: false },
        binance: { ...RAILS.binance, enabled: false },
      }),
    );

    expect(offered.map((rail) => rail.method)).toEqual([
      "pago-movil",
      "transferencia",
      "efectivo",
    ]);
  });

  it("names every rail it offers", () => {
    for (const rail of availableRails(RAILS)) {
      expect(rail.label).not.toBe("");
      expect(rail.instruction).not.toBe("");
    }
  });

  /**
   * A Pago Móvil is made against a phone, an ID and a **bank code** — and
   * deliberately not an account number, which is the transfer's field. Showing
   * one here is the single easiest way to make a payment go astray.
   */
  it("gives Pago Móvil a phone, an ID and a bank code — and no account number", () => {
    expect(rows(RAILS, "pago-movil")).toEqual([
      ["Teléfono", "0412-1234567"],
      ["Cédula / RIF", "V-12.345.678"],
      ["Código de banco", "0102"],
    ]);
  });

  it("gives a transfer the four things a bank asks for", () => {
    expect(rows(RAILS, "transferencia")).toEqual([
      ["Número de cuenta", "01020000000000000000"],
      ["Titular", "Floristería Azahar, C.A."],
      ["Cédula / RIF", "J-12345678-9"],
      ["Banco", "Banco de Venezuela"],
    ]);
  });

  it("gives Zelle the registered account and the name behind it", () => {
    expect(rows(RAILS, "zelle")).toEqual([
      ["Correo o teléfono Zelle", "pagos@azahar.test"],
      ["Titular", "Azahar Flowers LLC"],
    ]);
  });

  // The network is not decoration: USDT sent over the wrong chain to the right
  // address is gone, so it is shown beside the wallet it belongs to.
  it("labels the network alongside the Binance wallet", () => {
    expect(rows(RAILS, "binance")).toEqual([
      ["Pay ID", "987654321"],
      ["Wallet USDT", "TJ4kL9mNp2QrS5tUvW8xY1zA3bC6dE7fG"],
      ["Red", "TRC20"],
    ]);
  });

  /**
   * "Pay ID *and/or* wallet" — a shop with only one of them leaves the other
   * blank, and a blank row is worse than no row: an empty box beside "Wallet
   * USDT" reads as a value that failed to load.
   *
   * The network goes with it. It names the chain an address lives on, so on its
   * own it labels nothing — and a lone "Red: TRC20" invites the customer to
   * look for an address that was never there.
   */
  it("drops a detail the shop has left blank, and the network with the wallet", () => {
    expect(
      rows(rails({ binance: { ...RAILS.binance, wallet: "  " } }), "binance"),
    ).toEqual([["Pay ID", "987654321"]]);
  });

  // Paid at the door, in person: there is nowhere to send money and nothing to
  // copy.
  it("gives efectivo no account details at all", () => {
    expect(rows(RAILS, "efectivo")).toEqual([]);
  });
});
