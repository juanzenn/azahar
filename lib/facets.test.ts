import { describe, expect, it } from "vitest";

import type { Category, Product } from "@/lib/catalog/types";
import {
  activeFilters,
  clearedCriteria,
  facetGroups,
  type FacetScope,
} from "@/lib/facets";
import { search } from "@/lib/search";
import type { Criteria } from "@/lib/search";

/** Criteria with only what the test under way cares about spelled out. */
function criteria(overrides: Partial<Criteria> = {}): Criteria {
  return { ...clearedCriteria(), ...overrides };
}

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

/**
 * Only the two categories the fixture actually uses. The remaining eight
 * vocabulary values still get a row — that is the point of disable-zero — and
 * this test never reads their labels.
 */
const CATEGORIES: Category[] = [
  { slug: "ramos", name: "Ramos" },
  { slug: "cajas", name: "Cajas de flores" },
];

const CATALOG: Product[] = [
  product({
    slug: "ramo-rojo",
    categorySlug: "ramos",
    occasions: ["amor"],
    colours: ["rojo"],
    priceUsdCents: 3000,
  }),
  product({
    slug: "ramo-blanco",
    categorySlug: "ramos",
    occasions: ["bodas"],
    colours: ["blanco"],
    priceUsdCents: 4000,
  }),
  product({
    slug: "caja-rosada",
    categorySlug: "cajas",
    occasions: ["amor"],
    colours: ["rosado"],
    priceUsdCents: 12000,
  }),
];

/** The counts the sidebar renders come straight from the search module. */
function scopeFor(
  overrides: Partial<Criteria> = {},
  includeCategory = true,
): { scope: FacetScope; counts: ReturnType<typeof search>["facetCounts"] } {
  const scope: FacetScope = {
    criteria: criteria(overrides),
    categories: CATEGORIES,
    includeCategory,
  };
  const { facetCounts } = search(CATALOG, scope.criteria, CATEGORIES);
  return { scope, counts: facetCounts };
}

function groupsFor(overrides: Partial<Criteria> = {}, includeCategory = true) {
  const { scope, counts } = scopeFor(overrides, includeCategory);
  return facetGroups(scope, counts);
}

function groupNamed(key: string, overrides: Partial<Criteria> = {}) {
  const group = groupsFor(overrides).find((candidate) => candidate.key === key);
  if (!group) throw new Error(`no ${key} group`);
  return group;
}

describe("facetGroups", () => {
  it("renders the six groups in sidebar order", () => {
    expect(groupsFor().map((group) => group.key)).toEqual([
      "category",
      "price",
      "occasion",
      "flowerType",
      "colour",
      "size",
    ]);
  });

  it("titles each group with its Spanish heading", () => {
    expect(groupsFor().map((group) => group.heading)).toEqual([
      "Categoría",
      "Precio",
      "Ocasión",
      "Tipo de flor",
      "Color",
      "Tamaño",
    ]);
  });

  it("omits the category group when the path fixes the category", () => {
    expect(groupsFor({}, false).map((group) => group.key)).not.toContain(
      "category",
    );
  });

  it("gives single-select groups a clear row and multi-select groups none", () => {
    const clearRows = Object.fromEntries(
      groupsFor().map((group) => [group.key, group.anyChoice?.label ?? null]),
    );

    expect(clearRows).toEqual({
      category: "Todas las categorías",
      price: "Cualquier precio",
      size: "Cualquier tamaño",
      occasion: null,
      flowerType: null,
      colour: null,
    });
  });

  it("labels values with their display names", () => {
    expect(groupNamed("colour").values.map((value) => value.label)).toContain(
      "Rosado",
    );
    expect(
      groupNamed("category").values.find((value) => value.value === "cajas")
        ?.label,
    ).toBe("Cajas de flores");
  });

  it("passes each value's count and disabled flag straight through", () => {
    // What the numbers *should* be is the search module's rule and its test's
    // business; all this owes the sidebar is that it reports them untouched, in
    // the order given, with no value dropped.
    const { scope, counts } = scopeFor({ colours: ["rojo"] });
    const colour = facetGroups(scope, counts).find(
      (group) => group.key === "colour",
    );

    expect(
      colour?.values.map(({ value, count, disabled }) => ({
        value,
        count,
        disabled,
      })),
    ).toEqual(counts.colour);
  });

  it("only marks the colour swatches group", () => {
    expect(
      groupsFor()
        .filter((group) => group.swatches)
        .map((group) => group.key),
    ).toEqual(["colour"]);
  });

  it("selects a single-select value by replacing the selection", () => {
    const price = groupNamed("price", { priceRange: "25-50" });

    expect(
      price.values.find((value) => value.value === "25-50")?.selected,
    ).toBe(true);
    expect(
      price.values.find((value) => value.value === "100+")?.next.priceRange,
    ).toBe("100+");
  });

  it("clears a single-select group through its clear row", () => {
    const price = groupNamed("price", { priceRange: "25-50" });

    expect(price.anyChoice?.selected).toBe(false);
    expect(price.anyChoice?.next.priceRange).toBeNull();
  });

  it("marks the clear row as selected while the group is untouched", () => {
    expect(groupNamed("size").anyChoice?.selected).toBe(true);
  });

  it("adds an unselected multi-select value and keeps its siblings", () => {
    const colour = groupNamed("colour", { colours: ["rojo"] });

    expect(
      colour.values.find((value) => value.value === "blanco")?.next.colours,
    ).toEqual(["rojo", "blanco"]);
  });

  it("removes a selected multi-select value", () => {
    const colour = groupNamed("colour", { colours: ["rojo", "blanco"] });
    const rojo = colour.values.find((value) => value.value === "rojo");

    expect(rojo?.selected).toBe(true);
    expect(rojo?.next.colours).toEqual(["blanco"]);
  });

  it("leaves the rest of the criteria alone when a value is chosen", () => {
    const colour = groupNamed("colour", { query: "rosas", page: 3 });
    const next = colour.values.find((value) => value.value === "rojo")?.next;

    expect(next).toMatchObject({ query: "rosas", page: 3 });
  });
});

describe("activeFilters", () => {
  function filtersFor(
    overrides: Partial<Criteria> = {},
    includeCategory = true,
  ) {
    return activeFilters({
      criteria: criteria(overrides),
      categories: CATEGORIES,
      includeCategory,
    });
  }

  it("is empty when nothing is active", () => {
    expect(filtersFor()).toEqual([]);
  });

  it("does not treat sort or page as filters", () => {
    expect(filtersFor({ sort: "price-asc", page: 2 })).toEqual([]);
  });

  it("quotes the query and names every selected value in Spanish", () => {
    const labels = filtersFor({
      query: "rosas",
      category: "ramos",
      priceRange: "25-50",
      occasions: ["amor", "bodas"],
      colours: ["rojo"],
      size: "grande",
    }).map((filter) => filter.label);

    expect(labels).toEqual([
      "«rosas»",
      "Ramos",
      "$25 – $50",
      "Amor y romance",
      "Bodas",
      "Rojo",
      "Grande",
    ]);
  });

  it("gives every selected value in a multi facet its own chip", () => {
    expect(filtersFor({ colours: ["rojo", "blanco"] })).toHaveLength(2);
  });

  it("removes exactly the constraint it names", () => {
    const filters = filtersFor({
      query: "rosas",
      colours: ["rojo", "blanco"],
      size: "grande",
    });
    const rojo = filters.find((filter) => filter.label === "Rojo");

    expect(rojo?.next).toMatchObject({
      query: "rosas",
      colours: ["blanco"],
      size: "grande",
    });
  });

  it("clears a single-select constraint entirely", () => {
    const filters = filtersFor({ priceRange: "25-50", size: "grande" });
    const price = filters.find((filter) => filter.label === "$25 – $50");

    expect(price?.next).toMatchObject({ priceRange: null, size: "grande" });
  });

  it("never offers a chip for a category the path fixes", () => {
    expect(filtersFor({ category: "ramos" }, false)).toEqual([]);
  });

  it("keys each chip distinctly so a facet's values never collide", () => {
    const filters = filtersFor({
      query: "rosas",
      colours: ["rojo", "blanco"],
      occasions: ["amor"],
    });
    const keys = filters.map((filter) => filter.key);

    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("clearedCriteria", () => {
  it("drops every constraint, the sort and the page", () => {
    expect(clearedCriteria()).toEqual({
      query: "",
      category: null,
      occasions: [],
      flowerTypes: [],
      colours: [],
      size: null,
      priceRange: null,
      sort: "featured",
      page: 1,
    });
  });
});
