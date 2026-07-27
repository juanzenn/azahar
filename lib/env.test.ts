import { describe, expect, it } from "vitest";

import { envReader } from "@/lib/env";

// The variable name is passed in beside the value, so these tests can hand the
// reader any string without touching `process.env` — which under a static export
// would mean rebuilding to change a fixture.
const NAME = "NEXT_PUBLIC_SHOP_THING";

describe("envReader.text", () => {
  it("returns the configured value, trimmed", () => {
    const env = envReader();
    // A trailing space pasted into a host's environment UI must not become part
    // of an account number the customer copies into their bank.
    expect(env.text(NAME, "  0412-1234567 ", "placeholder")).toBe(
      "0412-1234567",
    );
  });

  it("falls back when the variable is absent", () => {
    const env = envReader();
    expect(env.text(NAME, undefined, "placeholder")).toBe("placeholder");
    expect(env.absent).toEqual([NAME]);
  });

  // The distinction the whole module exists for. A shop with a Binance Pay ID
  // and no wallet address sets the wallet empty; falling back there would print
  // a placeholder crypto address as if it were the shop's.
  it("treats a set-but-empty value as a deliberate blank, not a fallback", () => {
    const env = envReader();
    expect(env.text(NAME, "", "placeholder")).toBe("");
    expect(env.text(NAME, "   ", "placeholder")).toBe("");
    expect(env.absent).toEqual([]);
  });
});

describe("envReader.flag", () => {
  it("accepts the forms a shop owner might reasonably type", () => {
    const env = envReader();
    for (const raw of [
      "true",
      "TRUE",
      "1",
      "yes",
      "si",
      "sí",
      "on",
      " true ",
    ]) {
      expect(env.flag(NAME, raw, false)).toBe(true);
    }
    for (const raw of ["false", "FALSE", "0", "no", "off", " false "]) {
      expect(env.flag(NAME, raw, true)).toBe(false);
    }
  });

  it("falls back when the variable is absent", () => {
    const env = envReader();
    expect(env.flag(NAME, undefined, true)).toBe(true);
    expect(env.flag(NAME, undefined, false)).toBe(false);
    expect(env.absent).toEqual([NAME, NAME]);
  });

  // A flag decides whether a payment rail is shown at all. There is no honest
  // reading of "maybe", and guessing either way puts money somewhere.
  it("throws on a value it cannot read, naming the variable", () => {
    const env = envReader();
    expect(() => env.flag(NAME, "maybe", true)).toThrow(NAME);
  });

  // Deliberately unlike `text`: a blank account number is an answer, a blank
  // switch is not.
  it("throws on an empty value rather than picking a side", () => {
    const env = envReader();
    expect(() => env.flag(NAME, "", true)).toThrow(NAME);
  });
});

describe("envReader.cents", () => {
  it("reads a whole number of cents", () => {
    const env = envReader();
    expect(env.cents(NAME, "500", 999)).toBe(500);
    expect(env.cents(NAME, " 1250 ", 999)).toBe(1250);
  });

  // Free delivery is a real configuration, and zero is the value that a
  // fallback-on-falsy reader would silently replace with the default fee.
  it("reads zero as zero, not as missing", () => {
    const env = envReader();
    expect(env.cents(NAME, "0", 500)).toBe(0);
    expect(env.absent).toEqual([]);
  });

  it("falls back when the variable is absent", () => {
    const env = envReader();
    expect(env.cents(NAME, undefined, 500)).toBe(500);
    expect(env.absent).toEqual([NAME]);
  });

  // "5.50" meaning five dollars fifty would truncate to 5 cents, and every
  // total on the page would be wrong by a factor of a hundred with nothing to
  // show it. The name says CENTS; anything else stops the build.
  it("rejects anything that is not a whole number", () => {
    const env = envReader();
    for (const raw of ["5.50", "-100", "", "1e3", "5,00", "$5", "abc"]) {
      expect(() => env.cents(NAME, raw, 500)).toThrow(NAME);
    }
  });
});

describe("envReader.url", () => {
  it("returns the origin, with any trailing slash removed", () => {
    const env = envReader();

    expect(env.url(NAME, "https://azahar.com/", "https://fallback.test")).toBe(
      "https://azahar.com",
    );
    expect(
      env.url(NAME, "  https://azahar.com  ", "https://fallback.test"),
    ).toBe("https://azahar.com");
  });

  it("keeps a path, minus its trailing slash", () => {
    const env = envReader();

    expect(env.url(NAME, "https://example.com/tienda/", "https://f.test")).toBe(
      "https://example.com/tienda",
    );
  });

  it("falls back when the variable is absent", () => {
    const env = envReader();

    expect(env.url(NAME, undefined, "https://fallback.test")).toBe(
      "https://fallback.test",
    );
  });

  // Unlike an account number, a blank site URL is not an answer: every canonical
  // link, sitemap entry and Open Graph tag is built from it.
  it("throws on an empty value rather than building relative links", () => {
    const env = envReader();

    expect(() => env.url(NAME, "", "https://fallback.test")).toThrow(NAME);
  });

  it("throws on a URL with no scheme, which is the typo that looks fine", () => {
    const env = envReader();

    expect(() => env.url(NAME, "azahar.com", "https://f.test")).toThrow(NAME);
  });

  it("throws on a scheme a browser would not follow", () => {
    const env = envReader();

    for (const bad of [
      "ftp://azahar.com",
      "javascript:alert(1)",
      "not a url",
    ]) {
      expect(() => env.url(NAME, bad, "https://f.test")).toThrow(NAME);
    }
  });
});

describe("envReader.absent", () => {
  it("collects only the variables that were not set, in read order", () => {
    const env = envReader();
    env.text("FIRST", undefined, "a");
    env.text("SECOND", "set", "b");
    env.flag("THIRD", undefined, true);
    env.cents("FOURTH", "0", 1);

    expect(env.absent).toEqual(["FIRST", "THIRD"]);
  });
});
