import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { absentShopConfig, shopConfig } from "@/lib/config";

/**
 * Configuration invariants, in the spirit of `data/seed.test.ts`: what is
 * asserted here is not behaviour but the agreement between three things that are
 * edited by hand and rot silently — the variables `lib/config` reads, the names
 * it reports them under, and the manifest in `.env.example` that documents them
 * and that `next.config.ts` checks a build against.
 *
 * Reading the source is deliberate. Twenty-two near-identical blocks is exactly
 * the shape where a copy-paste puts one rail's name on another rail's value, and
 * no assertion about the resulting object could see it.
 */

const source = readFileSync("lib/config.ts", "utf8");
const manifest = readFileSync(".env.example", "utf8");

/** Every `env.<reader>("NAME", process.env.NAME, fallback)` in the module. */
const reads = [
  ...source.matchAll(
    /env\.(?:text|flag|cents)\(\s*"([A-Z0-9_]+)",\s*process\.env\.([A-Z0-9_]+),/g,
  ),
].map(([, reported, accessed]) => ({ reported, accessed }));

const documented = [...manifest.matchAll(/^(NEXT_PUBLIC_\w+)=/gm)].map(
  ([, name]) => name,
);

describe("shop configuration", () => {
  it("reads every value from the environment", () => {
    // A guard on the regex above as much as on the module: if the call shape
    // changes and this drops to zero, every assertion below would pass vacuously.
    expect(reads.length).toBeGreaterThanOrEqual(20);
  });

  // The copy-paste this file exists for. Getting these out of step would make
  // the build report a missing Zelle account while serving a placeholder one.
  it("reports each variable under the name it actually reads", () => {
    for (const { reported, accessed } of reads) {
      expect(reported).toBe(accessed);
    }
  });

  it("documents exactly the variables it reads in .env.example", () => {
    const read = [...new Set(reads.map((r) => r.accessed))].sort();
    expect(documented.slice().sort()).toEqual(read);
  });

  it("names every variable NEXT_PUBLIC_, since a static export publishes them", () => {
    for (const { accessed } of reads) {
      expect(accessed.startsWith("NEXT_PUBLIC_")).toBe(true);
    }
  });
});

describe("the placeholder shop", () => {
  // Vitest sets no shop variables, so this run is the clone-with-no-environment
  // case: the demo shop every value falls back to must be a working one.
  it("stands in for every unset variable", () => {
    expect(absentShopConfig()).toEqual(documented);
  });

  it("is a usable shop", () => {
    // wa.me form — country code and digits only, or the deep-link is dead.
    expect(shopConfig.whatsappNumber).toMatch(/^\d{8,15}$/);
    expect(Number.isInteger(shopConfig.deliveryFeeUsdCents)).toBe(true);
    expect(shopConfig.deliveryFeeUsdCents).toBeGreaterThanOrEqual(0);
    // Something to show in the footer, and at least one way to be paid.
    expect(shopConfig.phoneDisplay).not.toBe("");
    expect(shopConfig.hours).not.toBe("");
    expect(shopConfig.location).not.toBe("");
    expect(
      Object.values(shopConfig.paymentRails).some((rail) => rail.enabled),
    ).toBe(true);
  });
});
