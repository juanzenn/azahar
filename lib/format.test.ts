import { describe, expect, it } from "vitest";

import { formatPrice } from "@/lib/format";

describe("formatPrice", () => {
  // The locked visual direction (ticket 08 prototype) renders prices as plain
  // "$45" — no decimals, no currency code. Every seeded product price is a
  // whole dollar amount, so this is the case that renders on virtually every
  // page.
  it("renders whole-dollar amounts without decimals", () => {
    expect(formatPrice(3200)).toBe("$32");
    expect(formatPrice(6800)).toBe("$68");
    expect(formatPrice(2200)).toBe("$22");
  });

  it("renders zero as $0", () => {
    // Pickup zeroes the delivery fee, and that zero is shown in the summary.
    expect(formatPrice(0)).toBe("$0");
  });

  // The delivery fee and cash-change amounts are configurable and need not be
  // whole dollars. Silently dropping the cents would misprice the order, so
  // fractional amounts must show two decimals — with the es-VE comma.
  it("shows two decimals only when there are cents", () => {
    expect(formatPrice(450)).toBe("$4,50");
    expect(formatPrice(4550)).toBe("$45,50");
  });

  it("pads a single-digit cents value", () => {
    expect(formatPrice(405)).toBe("$4,05");
  });

  it("groups thousands with the es-VE separator", () => {
    expect(formatPrice(120000)).toBe("$1.200");
    expect(formatPrice(123456)).toBe("$1.234,56");
  });
});
