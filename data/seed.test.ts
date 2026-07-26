import { describe, expect, it } from "vitest";

import { categories } from "@/data/categories";
import { FLAGSHIP_SLUG, products } from "@/data/products";
import { catalog } from "@/lib/catalog";
import {
  CATEGORY_SLUGS,
  COLOURS,
  FLOWER_TYPES,
  OCCASIONS,
  SIZES,
} from "@/lib/catalog/types";

/**
 * Invariants the seed content promises.
 *
 * Transcribing 50 products by hand is exactly the kind of work where a slip is
 * invisible — a mistyped price puts a product in the wrong filter bucket, a
 * dropped facet leaves a filter value with no results. These assertions turn
 * every one of those into a failing build.
 */

/** Price-bucket boundaries from the URL scheme, in cents. */
function priceBucket(cents: number): "0-25" | "25-50" | "50-100" | "100+" {
  if (cents < 2500) return "0-25";
  if (cents < 5000) return "25-50";
  if (cents < 10000) return "50-100";
  return "100+";
}

function countBy<T extends string>(values: T[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

describe("categories", () => {
  it("has all ten format categories, in the documented order", () => {
    expect(categories.map((category) => category.slug)).toEqual([
      ...CATEGORY_SLUGS,
    ]);
  });

  it("gives every category a name and a hero image", () => {
    for (const category of categories) {
      expect(category.name.length).toBeGreaterThan(0);
      expect(category.description?.length ?? 0).toBeGreaterThan(0);
      expect(category.heroImage).toMatch(/^\/images\/categories\/.+\.jpg$/);
    }
  });
});

describe("products", () => {
  it("has 50 products", () => {
    expect(products).toHaveLength(50);
  });

  it("gives every product a unique, URL-safe slug", () => {
    const slugs = products.map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("gives every product a unique id", () => {
    const ids = products.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("prices every product as a positive integer number of cents", () => {
    for (const product of products) {
      expect(Number.isInteger(product.priceUsdCents)).toBe(true);
      expect(product.priceUsdCents).toBeGreaterThan(0);
    }
  });

  it("gives every product at least one image, referenced by complete path", () => {
    for (const product of products) {
      expect(product.images.length).toBeGreaterThanOrEqual(1);
      for (const image of product.images) {
        expect(image).toMatch(/^\/images\/products\/.+\.jpg$/);
      }
    }
  });

  it("gives every product exactly one real category", () => {
    for (const product of products) {
      expect(CATEGORY_SLUGS).toContain(product.categorySlug);
    }
  });

  it("spreads products across categories as planned", () => {
    const counts = countBy(products.map((product) => product.categorySlug));
    expect(counts).toEqual({
      ramos: 8,
      arreglos: 7,
      cajas: 6,
      canastas: 5,
      floreros: 5,
      plantas: 5,
      coronas: 3,
      "centros-de-mesa": 4,
      "rosas-preservadas": 4,
      detalles: 3,
    });
    // The seed plan states the spread as 8/7/6/5/5/5/4/4/3/3. That holds as a
    // multiset, but coronas and rosas-preservadas are the other way round from
    // the order the plan lists — the counts above are what the content
    // actually contains.
    expect(Object.values(counts).sort((a, b) => b - a)).toEqual([
      8, 7, 6, 5, 5, 5, 4, 4, 3, 3,
    ]);
  });

  it("covers every price bucket, so no price filter comes back empty", () => {
    const counts = countBy(
      products.map((product) => priceBucket(product.priceUsdCents)),
    );
    expect(counts).toEqual({
      "0-25": 9,
      "25-50": 19,
      "50-100": 15,
      "100+": 7,
    });
  });

  it("marks exactly seven products as featured", () => {
    expect(products.filter((product) => product.featured)).toHaveLength(7);
  });

  it("has a flagship that is itself featured", () => {
    const flagship = products.find((product) => product.slug === FLAGSHIP_SLUG);
    expect(flagship?.featured).toBe(true);
  });

  it("gives every facet value at least three products, so no filter dead-ends", () => {
    const occasions = countBy(products.flatMap((p) => p.occasions));
    const flowerTypes = countBy(products.flatMap((p) => p.flowerTypes));
    const colours = countBy(products.flatMap((p) => p.colours));
    const sizes = countBy(products.map((p) => p.size));

    for (const value of OCCASIONS) {
      expect(occasions[value] ?? 0).toBeGreaterThanOrEqual(3);
    }
    for (const value of FLOWER_TYPES) {
      expect(flowerTypes[value] ?? 0).toBeGreaterThanOrEqual(3);
    }
    for (const value of COLOURS) {
      expect(colours[value] ?? 0).toBeGreaterThanOrEqual(3);
    }
    for (const value of SIZES) {
      expect(sizes[value] ?? 0).toBeGreaterThanOrEqual(3);
    }
  });

  it("leaves foliage plants without flower types, by design", () => {
    // Pure-foliage plants have no flowers to filter by. This is intentional
    // content, not a transcription gap, so it is pinned rather than tolerated.
    const foliage = [
      "planta-suculenta-maceta",
      "planta-ficus-decorativa",
      "bonsai-elegante",
    ];
    for (const slug of foliage) {
      const product = products.find((candidate) => candidate.slug === slug);
      expect(product?.flowerTypes).toEqual([]);
      expect(product?.colours).toEqual([]);
    }
  });
});

describe("catalog seam", () => {
  it("lists every product", async () => {
    await expect(catalog.listProducts()).resolves.toHaveLength(50);
  });

  it("finds a product by slug", async () => {
    const product = await catalog.getProductBySlug("ramo-amor-rojo");
    expect(product?.name).toBe("Ramo Amor Rojo");
  });

  it("returns null for an unknown product slug", async () => {
    await expect(catalog.getProductBySlug("no-existe")).resolves.toBeNull();
  });

  it("returns the flagship first among featured products", async () => {
    const featured = await catalog.listFeaturedProducts();
    expect(featured).toHaveLength(7);
    expect(featured[0]?.slug).toBe(FLAGSHIP_SLUG);
  });

  it("lists every category", async () => {
    await expect(catalog.listCategories()).resolves.toHaveLength(10);
  });

  it("returns null for an unknown category slug", async () => {
    await expect(catalog.getCategoryBySlug("no-existe")).resolves.toBeNull();
  });

  it("lists the products in a category", async () => {
    const ramos = await catalog.listProductsByCategory("ramos");
    expect(ramos).toHaveLength(8);
    expect(ramos.every((product) => product.categorySlug === "ramos")).toBe(
      true,
    );
  });

  it("returns an empty list for an unknown category", async () => {
    await expect(catalog.listProductsByCategory("no-existe")).resolves.toEqual(
      [],
    );
  });
});
