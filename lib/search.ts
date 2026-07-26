import {
  CATEGORY_SLUGS,
  COLOURS,
  FLOWER_TYPES,
  OCCASIONS,
  SIZES,
} from "@/lib/catalog/types";
import type {
  Category,
  CategorySlug,
  Colour,
  FlowerType,
  Occasion,
  Product,
  Size,
} from "@/lib/catalog/types";
import { facetLabels } from "@/lib/strings";

/**
 * The search engine behind every results surface.
 *
 * One door, three functions: `search` turns a catalog and a set of criteria
 * into the page of products to show, `parseCriteria` and `toSearchParams`
 * translate between those criteria and the query string. The URL is the single
 * source of truth for search state, so the key→field map lives in here with
 * the logic it serves rather than beside it.
 *
 * Everything is pure — no React, no DOM, no runtime dependency. The whole
 * matching implementation could be replaced by a real search library behind
 * these same signatures without a single call site moving.
 */

/**
 * A price range is derived from a product's price and never stored on it, so
 * unlike the other facet vocabularies it lives here rather than in the domain
 * model.
 */
export const PRICE_RANGES = ["0-25", "25-50", "50-100", "100+"] as const;
export type PriceRange = (typeof PRICE_RANGES)[number];

export const SORTS = ["featured", "price-asc", "price-desc", "name"] as const;
export type Sort = (typeof SORTS)[number];

/** The catalog's curated order. Omitted from the URL. */
export const DEFAULT_SORT: Sort = "featured";

export type Criteria = {
  /** Free text. Empty string when the customer has not typed anything. */
  query: string;
  category: CategorySlug | null;
  occasions: Occasion[];
  flowerTypes: FlowerType[];
  colours: Colour[];
  size: Size | null;
  priceRange: PriceRange | null;
  sort: Sort;
  /** 1-based. `search` clamps it to a page that actually exists. */
  page: number;
};

/**
 * The query-string keys, deliberately terse rather than 1:1 with field names —
 * they are the one place English leaks into a user-facing URL.
 */
const KEYS = {
  query: "q",
  category: "cat",
  occasions: "occ",
  flowerTypes: "ft",
  colours: "col",
  size: "sz",
  priceRange: "pr",
  sort: "sort",
  page: "page",
} as const;

/**
 * Enough of `URLSearchParams` to read from. Typed structurally so Next's
 * `ReadonlyURLSearchParams` — whose mutators throw — satisfies it too.
 */
type ReadableSearchParams = Pick<URLSearchParams, "get" | "getAll">;

/**
 * A URL is user input: it can be hand-edited, or outlive the vocabulary it was
 * written against. Anything the vocabulary doesn't know is dropped, so a stale
 * link degrades to a working search rather than a filter nothing can match.
 */
function knownValue<T extends string>(
  vocabulary: readonly T[],
  value: string | null,
): T | null {
  return vocabulary.includes(value as T) ? (value as T) : null;
}

function knownValues<T extends string>(
  vocabulary: readonly T[],
  values: string[],
): T[] {
  return [...new Set(values)].filter((value): value is T =>
    vocabulary.includes(value as T),
  );
}

export function parseCriteria(params: ReadableSearchParams): Criteria {
  return {
    query: (params.get(KEYS.query) ?? "").trim(),
    category: knownValue(CATEGORY_SLUGS, params.get(KEYS.category)),
    occasions: knownValues(OCCASIONS, params.getAll(KEYS.occasions)),
    flowerTypes: knownValues(FLOWER_TYPES, params.getAll(KEYS.flowerTypes)),
    colours: knownValues(COLOURS, params.getAll(KEYS.colours)),
    size: knownValue(SIZES, params.get(KEYS.size)),
    priceRange: knownValue(PRICE_RANGES, params.get(KEYS.priceRange)),
    sort: knownValue(SORTS, params.get(KEYS.sort)) ?? DEFAULT_SORT,
    page: pageOrFirst(Number(params.get(KEYS.page))),
  };
}

/**
 * Only active constraints are serialised — the default sort and the first page
 * are omitted — so an unfiltered search keeps a clean base URL.
 */
export function toSearchParams(criteria: Criteria): URLSearchParams {
  const params = new URLSearchParams();

  if (criteria.query) params.set(KEYS.query, criteria.query);
  if (criteria.category) params.set(KEYS.category, criteria.category);
  for (const occasion of criteria.occasions) {
    params.append(KEYS.occasions, occasion);
  }
  for (const flowerType of criteria.flowerTypes) {
    params.append(KEYS.flowerTypes, flowerType);
  }
  for (const colour of criteria.colours) params.append(KEYS.colours, colour);
  if (criteria.size) params.set(KEYS.size, criteria.size);
  if (criteria.priceRange) params.set(KEYS.priceRange, criteria.priceRange);
  if (criteria.sort !== DEFAULT_SORT) params.set(KEYS.sort, criteria.sort);
  if (criteria.page > 1) params.set(KEYS.page, String(criteria.page));

  return params;
}

/** Boundaries in cents, matching the URL tokens exactly. */
function priceRangeOf(cents: number): PriceRange {
  if (cents < 2500) return "0-25";
  if (cents < 5000) return "25-50";
  if (cents < 10000) return "50-100";
  return "100+";
}

/**
 * Lowercase and strip diacritics, so "cumpleanos" typed on a phone keyboard
 * finds "Cumpleaños". Applied to both the blob and the query, so the two are
 * always compared in the same alphabet.
 */
function normalise(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Everything about a product a customer might reasonably type, as one string:
 * its own copy plus the *display labels* of its category and facets, so
 * searching "cumpleaños" or "orquídeas" works without the word appearing in
 * the description.
 */
function blobOf(product: Product, categoryNames: Map<string, string>): string {
  return normalise(
    [
      product.name,
      product.tagline ?? "",
      product.description,
      categoryNames.get(product.categorySlug) ?? product.categorySlug,
      ...product.occasions.map((value) => facetLabels.occasion[value]),
      ...product.flowerTypes.map((value) => facetLabels.flowerType[value]),
      ...product.colours.map((value) => facetLabels.colour[value]),
      facetLabels.size[product.size],
    ].join(" "),
  );
}

/**
 * The six groups the sidebar renders. Free text is deliberately not one of
 * them: it is not a facet, carries no counts, and is never excluded.
 */
type FacetKey =
  "category" | "price" | "occasion" | "flowerType" | "colour" | "size";

/**
 * What this module needs to know about a facet: its vocabulary, how to read a
 * product's values for it, and how to read the customer's selection.
 *
 * Single-select facets are modelled as a selection of *at most one* value.
 * That is what lets a single rule — "the product carries any selected value" —
 * serve all six, and it is why the OR/AND semantics are stated once below
 * rather than re-derived per facet.
 */
type Facet<T extends string> = {
  vocabulary: readonly T[];
  valuesOf: (product: Product) => readonly T[];
  selectedIn: (criteria: Criteria) => readonly T[];
};

const FACETS = {
  category: {
    vocabulary: CATEGORY_SLUGS,
    valuesOf: (product) => [product.categorySlug],
    selectedIn: (criteria) => (criteria.category ? [criteria.category] : []),
  },
  price: {
    vocabulary: PRICE_RANGES,
    valuesOf: (product) => [priceRangeOf(product.priceUsdCents)],
    selectedIn: (criteria) =>
      criteria.priceRange ? [criteria.priceRange] : [],
  },
  occasion: {
    vocabulary: OCCASIONS,
    valuesOf: (product) => product.occasions,
    selectedIn: (criteria) => criteria.occasions,
  },
  flowerType: {
    vocabulary: FLOWER_TYPES,
    valuesOf: (product) => product.flowerTypes,
    selectedIn: (criteria) => criteria.flowerTypes,
  },
  colour: {
    vocabulary: COLOURS,
    valuesOf: (product) => product.colours,
    selectedIn: (criteria) => criteria.colours,
  },
  size: {
    vocabulary: SIZES,
    valuesOf: (product) => [product.size],
    selectedIn: (criteria) => (criteria.size ? [criteria.size] : []),
  },
} satisfies Record<FacetKey, Facet<string>>;

/** The vocabulary behind one facet key — `Colour` for `colour`, and so on. */
type FacetValue<K extends FacetKey> = (typeof FACETS)[K]["vocabulary"][number];

type Matches = (product: Product) => boolean;

/** An inactive facet constrains nothing. */
const PASS: Matches = () => true;

/**
 * Within a facet, any selected value is enough to survive — the OR that makes
 * checking a second colour show more products rather than fewer.
 */
function facetMatcher(facet: Facet<string>, criteria: Criteria): Matches {
  const selected = facet.selectedIn(criteria);
  if (selected.length === 0) return PASS;

  return (product) =>
    facet.valuesOf(product).some((value) => selected.includes(value));
}

/**
 * One predicate per constraint, keyed by the facet it belongs to.
 *
 * Keeping them separate rather than folding them into a single filter is what
 * makes correct facet counting possible: a value's count is computed with
 * every constraint *except its own facet's* applied.
 */
function constraintsFor(
  criteria: Criteria,
  categories: Category[],
): Record<"query" | FacetKey, Matches> {
  const tokens = normalise(criteria.query).split(/\s+/).filter(Boolean);
  const categoryNames = new Map(
    categories.map((category) => [category.slug, category.name]),
  );

  // Every facet's counts run the query predicate over the catalog again, so
  // each blob is built once per search rather than once per pass.
  const blobs = new Map<Product, string>();
  const blobFor = (product: Product): string => {
    const cached = blobs.get(product);
    if (cached !== undefined) return cached;

    const blob = blobOf(product, categoryNames);
    blobs.set(product, blob);
    return blob;
  };

  return {
    // Every token must appear as a substring — an AND across tokens, and
    // deliberately no fuzzy or typo tolerance.
    query:
      tokens.length === 0
        ? PASS
        : (product) => {
            const blob = blobFor(product);
            return tokens.every((token) => blob.includes(token));
          },
    category: facetMatcher(FACETS.category, criteria),
    price: facetMatcher(FACETS.price, criteria),
    occasion: facetMatcher(FACETS.occasion, criteria),
    flowerType: facetMatcher(FACETS.flowerType, criteria),
    colour: facetMatcher(FACETS.colour, criteria),
    size: facetMatcher(FACETS.size, criteria),
  };
}

/**
 * Sort is orthogonal to filtering: it reorders the surviving set and can never
 * change it. Every comparator leans on `Array.prototype.sort` being stable, so
 * ties — and "featured" as a whole — fall back to the catalog's own order.
 */
const COMPARATORS: Record<Sort, (a: Product, b: Product) => number> = {
  featured: (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
  "price-asc": (a, b) => a.priceUsdCents - b.priceUsdCents,
  "price-desc": (a, b) => b.priceUsdCents - a.priceUsdCents,
  name: (a, b) => a.name.localeCompare(b.name, "es"),
};

export type FacetCount<T extends string = string> = {
  value: T;
  count: number;
  /**
   * True when nothing could match it — the UI greys it out, so a customer can
   * never filter their way into an empty page.
   */
  disabled: boolean;
};

/**
 * Every value of every vocabulary, always — a value with no matches is
 * reported with a count of 0 rather than omitted, so the sidebar renders a
 * fixed list of rows that doesn't jump around as filters change.
 */
export type FacetCounts = {
  [K in FacetKey]: FacetCount<FacetValue<K>>[];
};

/**
 * Count one facet's values against every active constraint *except its own*.
 *
 * This exclusion is the whole trick. Applying all of them and then counting —
 * the obvious implementation — puts a `(0)` beside every colour except the one
 * that is checked, which visibly contradicts the OR that a multi-select facet
 * promises. Excluding the facet's own constraint answers the question the
 * customer is actually asking: "what would I get if I clicked this too?"
 */
function countFacet<T extends string>(
  facet: Facet<T>,
  key: FacetKey,
  products: Product[],
  constraints: Record<"query" | FacetKey, Matches>,
): FacetCount<T>[] {
  const others = Object.entries(constraints)
    .filter(([constrained]) => constrained !== key)
    .map(([, matches]) => matches);
  const candidates = products.filter((product) =>
    others.every((matches) => matches(product)),
  );

  return facet.vocabulary.map((value) => {
    const count = candidates.filter((product) =>
      facet.valuesOf(product).includes(value),
    ).length;

    return { value, count, disabled: count === 0 };
  });
}

/**
 * A clean multiple of the 2/3/4-column grid, and about five pages over the
 * 50-item catalog, so paging is actually exercised.
 */
const PAGE_SIZE = 12;

/** Anything that isn't a real page number means the first page. */
function pageOrFirst(page: number): number {
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export type SearchResult = {
  /** The products on the requested page. */
  results: Product[];
  /** How many survived the filters, across every page. */
  total: number;
  /** Over the full filtered set, independent of which page is on screen. */
  facetCounts: FacetCounts;
  /** At least 1 — no results is one empty page, never zero pages. */
  pageCount: number;
  /**
   * The page actually returned, which is the requested one clamped into
   * range. Reported rather than left to the caller so a stale `?page=9` can't
   * leave the pagination control highlighting a page that isn't shown.
   */
  page: number;
};

/**
 * Everything narrows except multiple values inside one facet.
 *
 * `categories` supplies the display names the text blob folds in; like
 * `products`, it comes from the catalog seam, so this stays a pure function
 * over data it is handed rather than data it fetches.
 */
export function search(
  products: Product[],
  criteria: Criteria,
  categories: Category[],
): SearchResult {
  const constraints = constraintsFor(criteria, categories);
  const surviving = products.filter((product) =>
    Object.values(constraints).every((matches) => matches(product)),
  );
  const ordered = [...surviving].sort(COMPARATORS[criteria.sort]);

  const pageCount = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  const page = Math.min(pageOrFirst(criteria.page), pageCount);
  const start = (page - 1) * PAGE_SIZE;

  const count = <T extends string>(facet: Facet<T>, key: FacetKey) =>
    countFacet(facet, key, products, constraints);

  return {
    results: ordered.slice(start, start + PAGE_SIZE),
    total: ordered.length,
    facetCounts: {
      category: count(FACETS.category, "category"),
      price: count(FACETS.price, "price"),
      occasion: count(FACETS.occasion, "occasion"),
      flowerType: count(FACETS.flowerType, "flowerType"),
      colour: count(FACETS.colour, "colour"),
      size: count(FACETS.size, "size"),
    },
    pageCount,
    page,
  };
}
