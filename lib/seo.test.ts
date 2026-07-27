import { describe, expect, it } from "vitest";

import type { Category, Product } from "@/lib/catalog";
import { absoluteUrl, openGraph, productJsonLd, sitemapPaths } from "@/lib/seo";
import { strings } from "@/lib/strings";

const SITE = "https://azahar.test";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "p01",
    slug: "ramo-amor-rojo",
    name: "Ramo Amor Rojo",
    tagline: "Rosas rojas clásicas",
    description: "Doce rosas rojas.",
    priceUsdCents: 4500,
    images: ["/images/products/rosas-rojas-ramo.jpg"],
    categorySlug: "ramos",
    occasions: ["amor"],
    flowerTypes: ["rosas"],
    colours: ["rojo"],
    size: "mediano",
    featured: false,
    ...overrides,
  } as Product;
}

const CATEGORIES = [
  { slug: "ramos", name: "Ramos" },
  { slug: "cajas", name: "Cajas" },
] as Category[];

describe("absoluteUrl", () => {
  it("joins a route path onto the configured site", () => {
    expect(absoluteUrl("/producto/ramo-amor-rojo", SITE)).toBe(
      "https://azahar.test/producto/ramo-amor-rojo",
    );
  });

  it("renders the home route as the bare site, with no trailing slash", () => {
    expect(absoluteUrl("/", SITE)).toBe("https://azahar.test");
  });

  // The join is the whole job, so the two ways to get a double slash are the two
  // things worth pinning.
  it("does not double the separator, whichever side carries it", () => {
    expect(absoluteUrl("/buscar", "https://azahar.test/")).toBe(
      "https://azahar.test/buscar",
    );
    expect(absoluteUrl("buscar", SITE)).toBe("https://azahar.test/buscar");
  });

  it("drops a query string, which is never canonical", () => {
    expect(absoluteUrl("/buscar?q=rosas", SITE)).toBe(
      "https://azahar.test/buscar",
    );
  });
});

describe("sitemapPaths", () => {
  const paths = sitemapPaths(
    [product(), product({ slug: "caja-rosas" })],
    CATEGORIES,
  );

  it("lists the shop's content: home, the browsable pages, categories, products", () => {
    expect(paths).toEqual([
      "/",
      "/categorias",
      "/buscar",
      "/nosotros",
      "/categoria/ramos",
      "/categoria/cajas",
      "/producto/ramo-amor-rojo",
      "/producto/caja-rosas",
    ]);
  });

  // A crawler indexing someone's half-filled cart, or a confirmation page that
  // only means anything with a sessionStorage order behind it, is noise at best.
  it("omits the transactional pages", () => {
    for (const path of ["/carrito", "/finalizar-compra", "/pedido-enviado"]) {
      expect(paths).not.toContain(path);
    }
  });

  it("has no duplicates and no relative paths", () => {
    expect(new Set(paths).size).toBe(paths.length);
    for (const path of paths) expect(path.startsWith("/")).toBe(true);
  });
});

/**
 * The reason this exists rather than each page writing its own object: Next
 * *replaces* a parent's `openGraph` with a child's instead of merging them, so
 * every page that sets one drops the layout's `siteName` and `locale` on the
 * floor. Building them here means a page cannot forget.
 */
describe("openGraph", () => {
  const og = openGraph({
    title: "Ramo Amor Rojo — Azahar",
    description: "Doce rosas rojas.",
    path: "/producto/ramo-amor-rojo",
  });

  it("always carries the site-wide identity a page would otherwise lose", () => {
    expect(og.siteName).toBe(strings.site.name);
    expect(og.locale).toBe("es_VE");
    expect(og.type).toBe("website");
  });

  it("carries the page's own title, description and path", () => {
    expect(og.title).toBe("Ramo Amor Rojo — Azahar");
    expect(og.description).toBe("Doce rosas rojas.");
    // Root-relative: `metadataBase` in the layout makes it absolute at build.
    expect(og.url).toBe("/producto/ramo-amor-rojo");
  });

  it("takes an image when the page has one", () => {
    const withImage = openGraph({
      title: "t",
      description: "d",
      path: "/p",
      image: { url: "/images/products/x.jpg", alt: "X" },
    });

    expect(withImage.images).toEqual([
      { url: "/images/products/x.jpg", alt: "X" },
    ]);
  });

  // Absent rather than an empty array, so the layout's own default can apply.
  it("omits images entirely when the page has none", () => {
    expect(og).not.toHaveProperty("images");
  });
});

describe("productJsonLd", () => {
  const ld = productJsonLd(product(), SITE);

  it("describes the product as a schema.org Product", () => {
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Product");
    expect(ld.name).toBe("Ramo Amor Rojo");
    expect(ld.description).toBe("Doce rosas rojas.");
  });

  it("gives absolute URLs for the page and the image, as crawlers require", () => {
    expect(ld.image).toEqual([
      "https://azahar.test/images/products/rosas-rojas-ramo.jpg",
    ]);
    expect(ld.offers.url).toBe("https://azahar.test/producto/ramo-amor-rojo");
  });

  // Money is minor units everywhere in this app; schema.org wants major, as a
  // string, so this is the one place the conversion happens.
  it("prices in major units with the currency named", () => {
    expect(ld.offers.price).toBe("45.00");
    expect(ld.offers.priceCurrency).toBe("USD");
  });

  it("prices a whole-dollar and a sub-dollar amount without floating point", () => {
    expect(
      productJsonLd(product({ priceUsdCents: 10000 }), SITE).offers.price,
    ).toBe("100.00");
    expect(
      productJsonLd(product({ priceUsdCents: 999 }), SITE).offers.price,
    ).toBe("9.99");
    expect(
      productJsonLd(product({ priceUsdCents: 5 }), SITE).offers.price,
    ).toBe("0.05");
  });

  // The shop has no stock model, so there is nothing behind an availability
  // claim. Asserting `InStock` for a rich result would be inventing it.
  it("claims no availability, having no stock to claim it from", () => {
    expect(ld.offers).not.toHaveProperty("availability");
  });

  it("carries the category as the product's category", () => {
    expect(ld.category).toBe("ramos");
  });
});
