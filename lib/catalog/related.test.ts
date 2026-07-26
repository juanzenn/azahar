import { describe, expect, it } from "vitest";

import { relatedProducts } from "@/lib/catalog/related";
import type { CategorySlug, Product } from "@/lib/catalog/types";

/**
 * A hand-built fixture, deliberately not the 50-item seed: the rule under test
 * is "same category, current excluded, capped", and six named products make
 * that legible in a way production content cannot.
 */
function product(slug: string, categorySlug: CategorySlug = "ramos"): Product {
  return {
    id: slug,
    slug,
    name: slug,
    description: `Descripción de ${slug}`,
    priceUsdCents: 3200,
    images: ["/images/products/rosas-rojas-ramo.jpg"],
    categorySlug,
    occasions: [],
    flowerTypes: [],
    colours: [],
    size: "mediano",
  };
}

const slugsOf = (products: Product[]) => products.map((p) => p.slug);

describe("relatedProducts", () => {
  it("returns the category's other products in catalog order", () => {
    const current = product("uno");
    const catalog = [current, product("dos"), product("tres")];

    expect(slugsOf(relatedProducts(catalog, current))).toEqual(["dos", "tres"]);
  });

  it("excludes the current product wherever it sits in the list", () => {
    const current = product("dos");
    const catalog = [product("uno"), current, product("tres")];

    expect(slugsOf(relatedProducts(catalog, current))).toEqual(["uno", "tres"]);
  });

  it("ignores products from other categories", () => {
    const current = product("ramo-uno", "ramos");
    const catalog = [
      current,
      product("caja-uno", "cajas"),
      product("ramo-dos", "ramos"),
    ];

    expect(slugsOf(relatedProducts(catalog, current))).toEqual(["ramo-dos"]);
  });

  it("caps the row at four so it stays one line of cards", () => {
    const current = product("uno");
    const catalog = [
      current,
      ...["dos", "tres", "cuatro", "cinco", "seis"].map((slug) =>
        product(slug),
      ),
    ];

    expect(slugsOf(relatedProducts(catalog, current))).toEqual([
      "dos",
      "tres",
      "cuatro",
      "cinco",
    ]);
  });

  // The three smallest seed categories hold three products each, so a thin row
  // is normal — but a category of one must yield nothing rather than a row
  // containing the product the customer is already looking at.
  it("returns nothing when the category holds only the current product", () => {
    const current = product("uno");

    expect(relatedProducts([current], current)).toEqual([]);
  });
});
