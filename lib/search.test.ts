import { describe, expect, it } from "vitest";

import {
  CATEGORY_SLUGS,
  COLOURS,
  FLOWER_TYPES,
  OCCASIONS,
  SIZES,
} from "@/lib/catalog/types";
import type { Category, Product } from "@/lib/catalog/types";
import {
  PRICE_RANGES,
  SORTS,
  parseCriteria,
  search,
  toSearchParams,
} from "@/lib/search";
import type { Criteria, FacetCount } from "@/lib/search";

/**
 * Build a criteria object, overriding only what the test under way cares
 * about. Written out by hand rather than imported from the module so the
 * round-trip assertions have an independent notion of "empty".
 */
function criteria(overrides: Partial<Criteria> = {}): Criteria {
  return {
    query: "",
    category: null,
    occasions: [],
    flowerTypes: [],
    colours: [],
    size: null,
    priceRange: null,
    sort: "featured",
    page: 1,
    ...overrides,
  };
}

/**
 * A hand-built product, with only the fields the test under way cares about
 * spelled out. The 50-item seed is production content — using it here would
 * make every expectation a lookup rather than something you can read.
 */
function product(overrides: Partial<Product> & { slug: string }): Product {
  return {
    id: overrides.slug,
    name: overrides.slug,
    description: "",
    priceUsdCents: 3000,
    images: ["/images/products/x.jpg"],
    categorySlug: "ramos",
    occasions: [],
    flowerTypes: [],
    colours: [],
    size: "mediano",
    ...overrides,
  };
}

/** The display names the text blob folds in. */
const CATEGORIES: Category[] = [
  { slug: "ramos", name: "Ramos" },
  { slug: "cajas", name: "Cajas de flores" },
  { slug: "arreglos", name: "Arreglos florales" },
  { slug: "plantas", name: "Plantas" },
  { slug: "coronas", name: "Coronas fúnebres" },
  { slug: "rosas-preservadas", name: "Rosas preservadas" },
  { slug: "centros-de-mesa", name: "Centros de mesa" },
  { slug: "detalles", name: "Detalles" },
];

/**
 * Twelve products, in seed order, chosen to exercise the composition rules:
 * every facet has values shared by several products and values held by only
 * one, so OR and AND produce visibly different sets.
 */
const CATALOG: Product[] = [
  product({
    slug: "ramo-rojo",
    name: "Ramo Rojo",
    tagline: "Doce rosas de tallo largo",
    description: "Un ramo clásico de rosas rojas frescas, envuelto a mano.",
    priceUsdCents: 3000,
    categorySlug: "ramos",
    occasions: ["amor", "aniversario"],
    flowerTypes: ["rosas"],
    colours: ["rojo"],
    size: "mediano",
    featured: true,
  }),
  product({
    slug: "ramo-blanco",
    name: "Ramo Blanco",
    tagline: "Elegancia sobria",
    description: "Rosas blancas para una ceremonia.",
    priceUsdCents: 4000,
    categorySlug: "ramos",
    occasions: ["bodas"],
    flowerTypes: ["rosas"],
    colours: ["blanco"],
    size: "mediano",
  }),
  product({
    slug: "ramo-girasoles",
    name: "Ramo de Girasoles",
    tagline: "Pura luz",
    description: "Girasoles abiertos con follaje verde.",
    priceUsdCents: 6000,
    categorySlug: "ramos",
    occasions: ["cumpleanos"],
    flowerTypes: ["girasoles"],
    colours: ["amarillo"],
    size: "grande",
  }),
  product({
    slug: "caja-rosas-rojas",
    name: "Caja de Rosas Rojas",
    tagline: "Sorpresa en caja",
    description: "Rosas rojas en caja de regalo con lazo.",
    priceUsdCents: 2000,
    categorySlug: "cajas",
    occasions: ["amor"],
    flowerTypes: ["rosas"],
    colours: ["rojo"],
    size: "pequeno",
    featured: true,
  }),
  product({
    slug: "caja-mixta",
    name: "Caja Mixta",
    tagline: "Color y fiesta",
    description: "Mezcla de flores de temporada en caja.",
    priceUsdCents: 3500,
    categorySlug: "cajas",
    occasions: ["cumpleanos", "graduacion"],
    flowerTypes: ["mixtas"],
    colours: ["multicolor"],
    size: "mediano",
  }),
  product({
    slug: "arreglo-lirios",
    name: "Arreglo de Lirios",
    tagline: "Serenidad",
    description: "Lirios blancos en base de cerámica.",
    priceUsdCents: 8000,
    categorySlug: "arreglos",
    occasions: ["condolencias"],
    flowerTypes: ["lirios"],
    colours: ["blanco"],
    size: "grande",
  }),
  product({
    slug: "arreglo-tulipanes",
    name: "Arreglo de Tulipanes",
    tagline: "Primavera",
    description: "Tulipanes rosados recién cortados.",
    priceUsdCents: 4500,
    categorySlug: "arreglos",
    occasions: ["cumpleanos", "amor"],
    flowerTypes: ["tulipanes"],
    colours: ["rosado"],
    size: "mediano",
  }),
  product({
    slug: "planta-suculenta",
    name: "Planta Suculenta",
    tagline: "Verde que dura",
    description: "Suculenta en maceta de barro.",
    priceUsdCents: 1500,
    categorySlug: "plantas",
    occasions: ["nuevo-bebe"],
    // Foliage carries no flower type or colour, by design.
    flowerTypes: [],
    colours: [],
    size: "pequeno",
  }),
  product({
    slug: "corona-blanca",
    name: "Corona Blanca",
    tagline: "Homenaje",
    description: "Claveles blancos sobre estructura circular.",
    priceUsdCents: 12000,
    categorySlug: "coronas",
    occasions: ["condolencias"],
    flowerTypes: ["claveles"],
    colours: ["blanco"],
    size: "grande",
  }),
  product({
    slug: "rosas-eternas",
    name: "Rosas Eternas",
    tagline: "Duran años",
    description:
      "Rosas preservadas en cúpula de cristal, suaves como el terciopelo.",
    priceUsdCents: 9000,
    categorySlug: "rosas-preservadas",
    occasions: ["amor", "aniversario"],
    flowerTypes: ["rosas"],
    colours: ["rojo", "rosado"],
    size: "pequeno",
    featured: true,
  }),
  product({
    slug: "centro-boda",
    name: "Centro de Boda",
    tagline: "Para la mesa principal",
    description: "Orquídeas blancas en base baja.",
    priceUsdCents: 7000,
    categorySlug: "centros-de-mesa",
    occasions: ["bodas"],
    flowerTypes: ["orquideas"],
    colours: ["blanco"],
    size: "mediano",
  }),
  product({
    slug: "detalle-globos",
    name: "Detalle con Globos",
    tagline: "Un detalle bonito",
    description: "Gerberas con globos metalizados.",
    priceUsdCents: 1800,
    categorySlug: "detalles",
    occasions: ["cumpleanos"],
    flowerTypes: ["gerberas"],
    colours: ["multicolor"],
    size: "pequeno",
  }),
];

/**
 * Which products survived, alphabetically — composition is about *which*
 * products match; the order they come back in is the sort's business.
 */
function matched(overrides: Partial<Criteria> = {}): string[] {
  return slugsIn(CATALOG, overrides).sort();
}

/** Which products came back, in the order they came back in. */
function slugsIn(
  products: Product[],
  overrides: Partial<Criteria> = {},
): string[] {
  return search(products, criteria(overrides), CATEGORIES).results.map(
    (result) => result.slug,
  );
}

describe("toSearchParams", () => {
  it("serialises nothing when no constraint is active", () => {
    // A clean base URL is the point: /buscar, not /buscar?sort=featured&page=1.
    expect(toSearchParams(criteria()).toString()).toBe("");
  });

  it("omits the default sort and the first page", () => {
    expect(
      toSearchParams(criteria({ sort: "featured", page: 1 })).toString(),
    ).toBe("");
  });

  it("serialises a non-default sort and a later page", () => {
    expect(
      toSearchParams(criteria({ sort: "price-asc", page: 3 })).toString(),
    ).toBe("sort=price-asc&page=3");
  });

  it("serialises multi-value facets as repeated keys", () => {
    expect(
      toSearchParams(criteria({ colours: ["rojo", "blanco"] })).toString(),
    ).toBe("col=rojo&col=blanco");
  });

  it("serialises every active constraint, in the documented key order", () => {
    const params = toSearchParams(
      criteria({
        query: "rosas rojas",
        category: "ramos",
        occasions: ["amor"],
        flowerTypes: ["rosas"],
        colours: ["rojo", "blanco"],
        size: "grande",
        priceRange: "25-50",
        sort: "price-desc",
        page: 2,
      }),
    );

    expect(params.toString()).toBe(
      "q=rosas+rojas&cat=ramos&occ=amor&ft=rosas&col=rojo&col=blanco&sz=grande&pr=25-50&sort=price-desc&page=2",
    );
  });
});

describe("parseCriteria", () => {
  it("reads the defaults from an empty query string", () => {
    expect(parseCriteria(new URLSearchParams())).toEqual(criteria());
  });

  it("trims the free-text query and treats whitespace as absent", () => {
    expect(parseCriteria(new URLSearchParams("q=  rosas  ")).query).toBe(
      "rosas",
    );
    expect(parseCriteria(new URLSearchParams("q=%20%20")).query).toBe("");
  });

  it("ignores values outside the facet vocabularies", () => {
    // A hand-edited or stale URL must degrade to a working search rather than
    // filter on a value nothing can ever match.
    const params = new URLSearchParams(
      "cat=inventada&col=verde&col=rojo&sz=enorme&pr=gratis&sort=aleatorio",
    );

    expect(parseCriteria(params)).toEqual(criteria({ colours: ["rojo"] }));
  });

  it("de-duplicates repeated facet values", () => {
    expect(
      parseCriteria(new URLSearchParams("occ=amor&occ=amor&occ=bodas"))
        .occasions,
    ).toEqual(["amor", "bodas"]);
  });

  it("falls back to the first page for a missing or nonsensical page", () => {
    expect(parseCriteria(new URLSearchParams("page=0")).page).toBe(1);
    expect(parseCriteria(new URLSearchParams("page=-2")).page).toBe(1);
    expect(parseCriteria(new URLSearchParams("page=dos")).page).toBe(1);
    expect(parseCriteria(new URLSearchParams("page=4")).page).toBe(4);
  });
});

describe("composition semantics", () => {
  it("returns the whole catalog when nothing is active", () => {
    expect(matched()).toHaveLength(12);
    expect(search(CATALOG, criteria(), CATEGORIES).total).toBe(12);
  });

  it("keeps the fixture on a single page", () => {
    // `matched` reads the first page. A thirteenth fixture product would
    // silently truncate every assertion in this block rather than fail one.
    expect(search(CATALOG, criteria(), CATEGORIES).pageCount).toBe(1);
  });

  it("narrows to one format by category", () => {
    expect(matched({ category: "ramos" })).toEqual([
      "ramo-blanco",
      "ramo-girasoles",
      "ramo-rojo",
    ]);
  });

  it("widens within a facet — two colours are an OR", () => {
    // The rule customers rely on: adding a second colour must show them more,
    // not fewer, products.
    expect(matched({ colours: ["rojo"] })).toEqual([
      "caja-rosas-rojas",
      "ramo-rojo",
      "rosas-eternas",
    ]);
    expect(matched({ colours: ["rojo", "blanco"] })).toEqual([
      "arreglo-lirios",
      "caja-rosas-rojas",
      "centro-boda",
      "corona-blanca",
      "ramo-blanco",
      "ramo-rojo",
      "rosas-eternas",
    ]);
  });

  it("widens within the occasion and flower-type facets too", () => {
    expect(matched({ occasions: ["amor", "bodas"] })).toEqual([
      "arreglo-tulipanes",
      "caja-rosas-rojas",
      "centro-boda",
      "ramo-blanco",
      "ramo-rojo",
      "rosas-eternas",
    ]);
    expect(matched({ flowerTypes: ["rosas"] })).toEqual([
      "caja-rosas-rojas",
      "ramo-blanco",
      "ramo-rojo",
      "rosas-eternas",
    ]);
  });

  it("narrows across facets — colour AND occasion", () => {
    expect(matched({ colours: ["rojo"], occasions: ["aniversario"] })).toEqual([
      "ramo-rojo",
      "rosas-eternas",
    ]);
  });

  it("narrows across three facets at once", () => {
    expect(
      matched({
        category: "ramos",
        flowerTypes: ["rosas"],
        colours: ["blanco"],
      }),
    ).toEqual(["ramo-blanco"]);
  });

  it("treats size as a single-select that narrows", () => {
    expect(matched({ size: "grande" })).toEqual([
      "arreglo-lirios",
      "corona-blanca",
      "ramo-girasoles",
    ]);
    expect(matched({ size: "grande", colours: ["blanco"] })).toEqual([
      "arreglo-lirios",
      "corona-blanca",
    ]);
  });

  it("treats price as a single-select that narrows", () => {
    expect(matched({ priceRange: "0-25" })).toEqual([
      "caja-rosas-rojas",
      "detalle-globos",
      "planta-suculenta",
    ]);
  });

  it("excludes a product from a facet it carries no value for", () => {
    // Foliage plants have empty colours by design; a colour filter must skip
    // them rather than treat "no value" as "any value".
    expect(matched({ colours: ["blanco"] })).not.toContain("planta-suculenta");
  });

  it("ANDs the free-text query with the facets instead of resetting them", () => {
    // Four products mention rosas; exactly one of them is white.
    expect(matched({ query: "rosas" })).toEqual([
      "caja-rosas-rojas",
      "ramo-blanco",
      "ramo-rojo",
      "rosas-eternas",
    ]);
    expect(matched({ query: "rosas", colours: ["blanco"] })).toEqual([
      "ramo-blanco",
    ]);
  });
});

describe("text matching", () => {
  it("ignores accents and capitalisation", () => {
    // The reason this matters: nobody types "ñ" or "í" into a search box on a
    // phone. "cumpleanos" has to find "Cumpleaños".
    const expected = [
      "arreglo-tulipanes",
      "caja-mixta",
      "detalle-globos",
      "ramo-girasoles",
    ];

    expect(matched({ query: "cumpleanos" })).toEqual(expected);
    expect(matched({ query: "CUMPLEAÑOS" })).toEqual(expected);
  });

  it("matches a facet's display label, not only the product's own copy", () => {
    // The four products above are found purely through the occasion label:
    // none of them says "cumpleaños" in its own name, tagline or description.
    // Asserting that here is what stops the test above from passing for the
    // wrong reason if a fixture is ever reworded.
    for (const slug of [
      "ramo-girasoles",
      "caja-mixta",
      "arreglo-tulipanes",
      "detalle-globos",
    ]) {
      const found = CATALOG.find((candidate) => candidate.slug === slug)!;
      expect(
        `${found.name} ${found.tagline} ${found.description}`.toLowerCase(),
      ).not.toContain("cumplea");
    }

    expect(matched({ query: "orquideas" })).toEqual(["centro-boda"]);
  });

  it("matches the category's display name", () => {
    // "fúnebres" appears only in the category name "Coronas fúnebres".
    expect(matched({ query: "funebres" })).toEqual(["corona-blanca"]);
  });

  it("matches the description, not just the name", () => {
    expect(matched({ query: "terciopelo" })).toEqual(["rosas-eternas"]);
  });

  it("requires every token, in any order and any spacing", () => {
    // "Ramo Blanco" mentions rosas but not rojas, so it must not survive.
    const expected = ["caja-rosas-rojas", "ramo-rojo"];

    expect(matched({ query: "rosas rojas" })).toEqual(expected);
    expect(matched({ query: "rojas rosas" })).toEqual(expected);
    expect(matched({ query: "rosas    rojas" })).toEqual(expected);
  });

  it("matches on substrings rather than whole words", () => {
    expect(matched({ query: "girasol" })).toEqual(["ramo-girasoles"]);
  });

  it("does not tolerate typos", () => {
    // Deliberate: there is no fuzzy matching in v1, which is exactly why the
    // zero-result state offers a spelling nudge.
    expect(matched({ query: "rosaz" })).toEqual([]);
    expect(matched({ query: "girasolez" })).toEqual([]);
  });
});

describe("price buckets", () => {
  /**
   * The boundaries as the URL scheme states them, transcribed rather than
   * derived: `0-25` is under 2500 cents, `25-50` is 2500–4999, `50-100` is
   * 5000–9999, `100+` is 10000 and up. An off-by-one here silently misfiles a
   * product into a bucket a customer will never look in.
   */
  const BOUNDARIES = [
    { cents: 0, bucket: "0-25" },
    { cents: 2499, bucket: "0-25" },
    { cents: 2500, bucket: "25-50" },
    { cents: 4999, bucket: "25-50" },
    { cents: 5000, bucket: "50-100" },
    { cents: 9999, bucket: "50-100" },
    { cents: 10000, bucket: "100+" },
    { cents: 25000, bucket: "100+" },
  ] as const;

  const priced = BOUNDARIES.map(({ cents }) =>
    product({ slug: `p-${cents}`, priceUsdCents: cents }),
  );

  it.each(PRICE_RANGES)("puts exactly the right prices in %s", (bucket) => {
    expect(slugsIn(priced, { priceRange: bucket })).toEqual(
      BOUNDARIES.filter((boundary) => boundary.bucket === bucket).map(
        (boundary) => `p-${boundary.cents}`,
      ),
    );
  });

  it("accounts for every product across the four buckets", () => {
    const counted = PRICE_RANGES.flatMap((bucket) =>
      slugsIn(priced, { priceRange: bucket }),
    );

    expect(counted).toHaveLength(priced.length);
  });
});

describe("sorting", () => {
  // Two products share a price so tie-breaking is visible, and the featured
  // ones are deliberately not first in seed order.
  const SORTABLE: Product[] = [
    product({ slug: "bromelia", name: "Bromelia", priceUsdCents: 9000 }),
    product({
      slug: "azalea",
      name: "Azalea",
      priceUsdCents: 1000,
      featured: true,
    }),
    product({ slug: "dalia", name: "Dalia", priceUsdCents: 5000 }),
    product({
      slug: "camelia",
      name: "Camelia",
      priceUsdCents: 5000,
      featured: true,
    }),
  ];

  it("puts featured products first, then the catalog's own order", () => {
    expect(slugsIn(SORTABLE, { sort: "featured" })).toEqual([
      "azalea",
      "camelia",
      "bromelia",
      "dalia",
    ]);
  });

  it("sorts by price in both directions, keeping catalog order for ties", () => {
    expect(slugsIn(SORTABLE, { sort: "price-asc" })).toEqual([
      "azalea",
      "dalia",
      "camelia",
      "bromelia",
    ]);
    expect(slugsIn(SORTABLE, { sort: "price-desc" })).toEqual([
      "bromelia",
      "dalia",
      "camelia",
      "azalea",
    ]);
  });

  it("sorts by name alphabetically", () => {
    expect(slugsIn(SORTABLE, { sort: "name" })).toEqual([
      "azalea",
      "bromelia",
      "camelia",
      "dalia",
    ]);
  });

  it("sorts names in Spanish order, so an accent is not a separate letter", () => {
    const accented = [
      product({ slug: "zinnia", name: "Zinnia" }),
      product({ slug: "angel", name: "Ángel" }),
      product({ slug: "azalea", name: "Azalea" }),
    ];

    expect(slugsIn(accented, { sort: "name" })).toEqual([
      "angel",
      "azalea",
      "zinnia",
    ]);
  });

  it("never changes which products survive, only their order", () => {
    // The invariant behind "sorting never silently drops a product".
    const filters: Partial<Criteria> = { colours: ["rojo", "blanco"] };
    const baseline = matched(filters);

    for (const sort of SORTS) {
      expect([...slugsIn(CATALOG, { ...filters, sort })].sort()).toEqual(
        baseline,
      );
    }
  });
});

describe("pagination", () => {
  /** `count` products in a knowable order, so a page is legible at a glance. */
  function numbered(count: number): Product[] {
    return Array.from({ length: count }, (_, index) =>
      product({ slug: `p-${String(index + 1).padStart(2, "0")}` }),
    );
  }

  const THIRTY = numbered(30);

  it("returns twelve products per page", () => {
    expect(slugsIn(THIRTY, { page: 1 })).toEqual([
      "p-01",
      "p-02",
      "p-03",
      "p-04",
      "p-05",
      "p-06",
      "p-07",
      "p-08",
      "p-09",
      "p-10",
      "p-11",
      "p-12",
    ]);
    expect(slugsIn(THIRTY, { page: 2 })).toHaveLength(12);
    expect(slugsIn(THIRTY, { page: 2 })[0]).toBe("p-13");
  });

  it("leaves a short final page short", () => {
    expect(slugsIn(THIRTY, { page: 3 })).toEqual([
      "p-25",
      "p-26",
      "p-27",
      "p-28",
      "p-29",
      "p-30",
    ]);
  });

  it("counts the pages, and the total over every page", () => {
    const result = search(THIRTY, criteria({ page: 2 }), CATEGORIES);

    expect(result.pageCount).toBe(3);
    expect(result.total).toBe(30);
  });

  it("does not open a second page for an exact multiple", () => {
    expect(search(numbered(12), criteria(), CATEGORIES).pageCount).toBe(1);
    expect(search(numbered(13), criteria(), CATEGORIES).pageCount).toBe(2);
  });

  it("clamps an out-of-range page to the last real one", () => {
    // A shared link to ?page=9 that outlived the filter it was taken under
    // must show the last page of results, never an empty grid.
    const result = search(THIRTY, criteria({ page: 9 }), CATEGORIES);

    expect(result.page).toBe(3);
    expect(result.results.map((found) => found.slug)).toEqual([
      "p-25",
      "p-26",
      "p-27",
      "p-28",
      "p-29",
      "p-30",
    ]);
  });

  it("falls back to the first page for a page that isn't one", () => {
    // `parseCriteria` already guards the URL, but the island builds criteria
    // objects directly for its page links, and NaN would otherwise slice out
    // an empty grid.
    for (const page of [0, -3, 1.5, Number.NaN]) {
      expect(search(THIRTY, criteria({ page }), CATEGORIES).page).toBe(1);
    }
  });

  it("reports the page it actually returned", () => {
    expect(search(THIRTY, criteria({ page: 2 }), CATEGORIES).page).toBe(2);
  });

  it("treats no results as a single empty page", () => {
    const result = search(THIRTY, criteria({ query: "nada" }), CATEGORIES);

    expect(result.results).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
    expect(result.page).toBe(1);
  });
});

describe("facet counts", () => {
  /** Counts as a value→count map, which reads far better than an array of
   * objects when the point of the assertion is the numbers. */
  function counts(facet: FacetCount<string>[]): Record<string, number> {
    return Object.fromEntries(facet.map((entry) => [entry.value, entry.count]));
  }

  function facets(overrides: Partial<Criteria> = {}) {
    return search(CATALOG, criteria(overrides), CATEGORIES).facetCounts;
  }

  it("reports every value of every vocabulary, in vocabulary order", () => {
    // The sidebar renders a fixed list of rows; a value with no matches is
    // greyed out, never missing, so the layout doesn't jump as filters change.
    const all = facets();

    expect(all.category.map((entry) => entry.value)).toEqual([
      ...CATEGORY_SLUGS,
    ]);
    expect(all.price.map((entry) => entry.value)).toEqual([...PRICE_RANGES]);
    expect(all.occasion.map((entry) => entry.value)).toEqual([...OCCASIONS]);
    expect(all.flowerType.map((entry) => entry.value)).toEqual([
      ...FLOWER_TYPES,
    ]);
    expect(all.colour.map((entry) => entry.value)).toEqual([...COLOURS]);
    expect(all.size.map((entry) => entry.value)).toEqual([...SIZES]);
  });

  it("counts the whole catalog when nothing is active", () => {
    const all = facets();

    expect(counts(all.colour)).toEqual({
      rojo: 3,
      rosado: 2,
      blanco: 4,
      amarillo: 1,
      naranja: 0,
      morado: 0,
      azul: 0,
      multicolor: 2,
    });
    expect(counts(all.price)).toEqual({
      "0-25": 3,
      "25-50": 4,
      "50-100": 4,
      "100+": 1,
    });
    expect(counts(all.size)).toEqual({ pequeno: 4, mediano: 5, grande: 3 });
  });

  it("excludes a facet's own selections from its own counts", () => {
    // The subtle rule, and the one an intuitive implementation gets wrong:
    // applying every active filter before counting would show (0) beside every
    // colour except the selected one, visibly breaking the OR that multi-select
    // promises. Checking "rojo" must leave "blanco" clickable.
    const withRojo = facets({ colours: ["rojo"] });

    expect(counts(withRojo.colour)).toEqual(counts(facets().colour));
    expect(counts(withRojo.colour).blanco).toBe(4);
  });

  it("excludes only its own facet, not every filter", () => {
    // The case that separates the correct rule from dropping *all* filters
    // whenever the facet has a selection. Small products are caja-rosas-rojas
    // (rojo), planta-suculenta (none), rosas-eternas (rojo + rosado) and
    // detalle-globos (multicolor) — so with red already checked, the colour
    // counts must be the small ones, not the whole catalog's.
    const smallAndRed = facets({ colours: ["rojo"], size: "pequeno" });

    expect(counts(smallAndRed.colour)).toEqual({
      rojo: 2,
      rosado: 1,
      blanco: 0,
      amarillo: 0,
      naranja: 0,
      morado: 0,
      azul: 0,
      multicolor: 1,
    });
  });

  it("excludes their own selections from single-select facets too", () => {
    // Same rule, so a customer can see what is in the next price bucket up
    // before abandoning the one they are in.
    expect(counts(facets({ priceRange: "0-25" }).price)).toEqual(
      counts(facets().price),
    );
    expect(counts(facets({ size: "grande" }).size)).toEqual(
      counts(facets().size),
    );
    expect(counts(facets({ category: "ramos" }).category)).toEqual(
      counts(facets().category),
    );
  });

  it("applies every other active filter to a facet's counts", () => {
    // Red narrows the catalog to ramo-rojo, caja-rosas-rojas and rosas-eternas.
    const withRojo = facets({ colours: ["rojo"] });

    expect(counts(withRojo.occasion)).toEqual({
      amor: 3,
      aniversario: 2,
      bodas: 0,
      condolencias: 0,
      cumpleanos: 0,
      graduacion: 0,
      "dia-de-la-madre": 0,
      "nuevo-bebe": 0,
    });
    expect(counts(withRojo.category)).toEqual({
      ramos: 1,
      arreglos: 0,
      cajas: 1,
      canastas: 0,
      floreros: 0,
      plantas: 0,
      coronas: 0,
      "centros-de-mesa": 0,
      "rosas-preservadas": 1,
      detalles: 0,
    });
  });

  it("applies the free-text query to every facet's counts", () => {
    // Text is not a facet, so unlike a colour it narrows the colour counts too.
    expect(counts(facets({ query: "rosas" }).colour)).toMatchObject({
      rojo: 3,
      blanco: 1,
      rosado: 1,
      amarillo: 0,
    });
  });

  it("marks a value nothing can match as disabled", () => {
    // Disable-zero is what makes it impossible to filter into an empty page.
    const withRojo = facets({ colours: ["rojo"] });
    const disabled = (facet: FacetCount<string>[], value: string) =>
      facet.find((entry) => entry.value === value)?.disabled;

    expect(disabled(withRojo.occasion, "bodas")).toBe(true);
    expect(disabled(withRojo.occasion, "amor")).toBe(false);
    expect(disabled(facets().colour, "naranja")).toBe(true);
    expect(disabled(facets().colour, "rojo")).toBe(false);
  });

  it("counts the full filtered set, not just the page on screen", () => {
    const twenty = Array.from({ length: 20 }, (_, index) =>
      product({ slug: `p-${index}`, colours: ["rojo"] }),
    );
    const secondPage = search(twenty, criteria({ page: 2 }), CATEGORIES);

    expect(secondPage.results).toHaveLength(8);
    expect(counts(secondPage.facetCounts.colour).rojo).toBe(20);
  });
});

describe("the URL round trip", () => {
  it("is the identity for a fully populated criteria object", () => {
    const original = criteria({
      query: "rosas rojas",
      category: "cajas",
      occasions: ["amor", "aniversario"],
      flowerTypes: ["rosas", "tulipanes"],
      colours: ["rojo", "blanco"],
      size: "pequeno",
      priceRange: "100+",
      sort: "name",
      page: 5,
    });

    expect(parseCriteria(toSearchParams(original))).toEqual(original);
  });

  it("is the identity for an empty criteria object", () => {
    const original = criteria();

    expect(parseCriteria(toSearchParams(original))).toEqual(original);
  });

  it.each(SORTS)("is the identity for the %s sort token", (sort) => {
    const original = criteria({ sort });

    expect(parseCriteria(toSearchParams(original))).toEqual(original);
  });
});
