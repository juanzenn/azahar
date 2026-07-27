import type {
  Category,
  CategorySlug,
  Colour,
  FlowerType,
  Occasion,
  Size,
} from "@/lib/catalog/types";
import { parseCriteria } from "@/lib/search";
import type {
  Criteria,
  FacetCount,
  FacetCounts,
  PriceRange,
} from "@/lib/search";
import { facetLabels, strings } from "@/lib/strings";

/**
 * What the filter UI renders, as data.
 *
 * The search module answers "what matches, and how many would match this
 * value"; it says nothing about controls. This module is the other half: it
 * turns criteria and counts into the six sidebar groups and the applied-filter
 * chips, each control carrying **the criteria it produces when clicked**.
 *
 * That inversion is the point. The sidebar and the chip row become dumb
 * renderers of labels and callbacks — there is no per-facet branching in any
 * component, radio-versus-checkbox is a property rather than a special case,
 * and the rules a customer can actually feel (choosing a colour widens,
 * choosing a price replaces, the fixed category of a category page is not
 * removable) live here where they can be read and tested without a DOM.
 *
 * Pure, like the search module, and for the same reason.
 */

/** The six groups, in the order the sidebar renders them. */
export type FacetGroupKey = keyof FacetCounts;

/** One control in a facet group. */
export type FacetChoice = {
  label: string;
  selected: boolean;
  /** The criteria clicking this control produces. */
  next: Criteria;
};

export type FacetValueChoice = FacetChoice & {
  value: string;
  /** How many products would match, over the full filtered set. */
  count: number;
  /** Nothing could match it, so the row is greyed out and inert. */
  disabled: boolean;
};

export type FacetGroupView = {
  key: FacetGroupKey;
  heading: string;
  /**
   * The explicit "Cualquiera/Todas" row single-select groups clear through —
   * `null` for multi-select groups, which clear by unchecking.
   */
  anyChoice: FacetChoice | null;
  values: FacetValueChoice[];
  /** Colour is the one group whose values carry a swatch. */
  swatches: boolean;
};

/** One removable chip above the grid. */
export type ActiveFilter = {
  /** Stable identity for React keys: a facet's values must not collide. */
  key: string;
  label: string;
  /**
   * The group this constraint came from, or `null` for the free-text query —
   * which is a chip but not a facet, and so is not something the filter panel
   * (or the badge that counts what is in it) can account for.
   */
  facet: FacetGroupKey | null;
  /** The criteria that remains once this chip is dismissed. */
  next: Criteria;
};

export type FacetScope = {
  criteria: Criteria;
  /** Supplies the category display names; comes from the catalog seam. */
  categories: Category[];
  /**
   * False on a category page, where the path fixes the category: the group is
   * omitted and the fixed category is not a removable chip, so a customer
   * cannot filter — or delete — their way off the page they are on.
   */
  includeCategory: boolean;
};

/** A clean slate, defined as "the criteria an empty query string parses to". */
export function clearedCriteria(): Criteria {
  return parseCriteria(new URLSearchParams());
}

/**
 * A facet holding at most one value. Choosing a value replaces the selection
 * rather than toggling it off, which is why clearing needs its own row.
 */
type SingleFacet<T extends string> = {
  key: FacetGroupKey;
  anyLabel: string;
  label: (value: T) => string;
  selected: (criteria: Criteria) => T | null;
  /** `null` clears the group. */
  with: (criteria: Criteria, value: T | null) => Criteria;
};

/** A facet holding any number of values, where each click flips one of them. */
type MultiFacet<T extends string> = {
  key: FacetGroupKey;
  label: (value: T) => string;
  selected: (criteria: Criteria) => readonly T[];
  toggled: (criteria: Criteria, value: T) => Criteria;
};

function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

/**
 * Categories are content rather than vocabulary, so this one facet is built
 * per call from the names the catalog gave us. A value the catalog does not
 * name falls back to its slug — unreachable while the seed names all ten, and
 * a legible label beats a blank row if that ever stops being true.
 */
function categoryFacet(categories: Category[]): SingleFacet<CategorySlug> {
  const names = new Map(
    categories.map((category) => [category.slug, category.name]),
  );

  return {
    key: "category",
    anyLabel: strings.search.anyValue.category,
    label: (value) => names.get(value) ?? value,
    selected: (criteria) => criteria.category,
    with: (criteria, value) => ({ ...criteria, category: value }),
  };
}

const price: SingleFacet<PriceRange> = {
  key: "price",
  anyLabel: strings.search.anyValue.price,
  label: (value) => facetLabels.priceRange[value],
  selected: (criteria) => criteria.priceRange,
  with: (criteria, value) => ({ ...criteria, priceRange: value }),
};

const size: SingleFacet<Size> = {
  key: "size",
  anyLabel: strings.search.anyValue.size,
  label: (value) => facetLabels.size[value],
  selected: (criteria) => criteria.size,
  with: (criteria, value) => ({ ...criteria, size: value }),
};

const occasion: MultiFacet<Occasion> = {
  key: "occasion",
  label: (value) => facetLabels.occasion[value],
  selected: (criteria) => criteria.occasions,
  toggled: (criteria, value) => ({
    ...criteria,
    occasions: toggle(criteria.occasions, value),
  }),
};

const flowerType: MultiFacet<FlowerType> = {
  key: "flowerType",
  label: (value) => facetLabels.flowerType[value],
  selected: (criteria) => criteria.flowerTypes,
  toggled: (criteria, value) => ({
    ...criteria,
    flowerTypes: toggle(criteria.flowerTypes, value),
  }),
};

const colour: MultiFacet<Colour> = {
  key: "colour",
  label: (value) => facetLabels.colour[value],
  selected: (criteria) => criteria.colours,
  toggled: (criteria, value) => ({
    ...criteria,
    colours: toggle(criteria.colours, value),
  }),
};

function groupOf(
  key: FacetGroupKey,
  anyChoice: FacetChoice | null,
  values: FacetValueChoice[],
): FacetGroupView {
  return {
    key,
    heading: strings.search.groups[key],
    anyChoice,
    values,
    swatches: key === "colour",
  };
}

function singleGroup<T extends string>(
  facet: SingleFacet<T>,
  criteria: Criteria,
  counts: FacetCount<T>[],
): FacetGroupView {
  const selected = facet.selected(criteria);

  return groupOf(
    facet.key,
    {
      label: facet.anyLabel,
      selected: selected === null,
      next: facet.with(criteria, null),
    },
    counts.map(({ value, count, disabled }) => ({
      value,
      count,
      disabled,
      label: facet.label(value),
      selected: selected === value,
      next: facet.with(criteria, value),
    })),
  );
}

function multiGroup<T extends string>(
  facet: MultiFacet<T>,
  criteria: Criteria,
  counts: FacetCount<T>[],
): FacetGroupView {
  const selected = facet.selected(criteria);

  return groupOf(
    facet.key,
    null,
    counts.map(({ value, count, disabled }) => ({
      value,
      count,
      disabled,
      label: facet.label(value),
      selected: selected.includes(value),
      next: facet.toggled(criteria, value),
    })),
  );
}

/**
 * The sidebar, resolved: every group, every value, its live count, whether it
 * is selected, and the criteria it produces.
 *
 * Values come from the counts rather than the vocabulary so a zero-count value
 * still gets its row — the list must not jump around as filters change.
 */
export function facetGroups(
  { criteria, categories, includeCategory }: FacetScope,
  counts: FacetCounts,
): FacetGroupView[] {
  return [
    ...(includeCategory
      ? [singleGroup(categoryFacet(categories), criteria, counts.category)]
      : []),
    singleGroup(price, criteria, counts.price),
    multiGroup(occasion, criteria, counts.occasion),
    multiGroup(flowerType, criteria, counts.flowerType),
    multiGroup(colour, criteria, counts.colour),
    singleGroup(size, criteria, counts.size),
  ];
}

function singleFilters<T extends string>(
  facet: SingleFacet<T>,
  criteria: Criteria,
): ActiveFilter[] {
  const value = facet.selected(criteria);
  if (value === null) return [];

  return [
    {
      key: facet.key,
      label: facet.label(value),
      facet: facet.key,
      next: facet.with(criteria, null),
    },
  ];
}

function multiFilters<T extends string>(
  facet: MultiFacet<T>,
  criteria: Criteria,
): ActiveFilter[] {
  return facet.selected(criteria).map((value) => ({
    key: `${facet.key}:${value}`,
    label: facet.label(value),
    facet: facet.key,
    next: facet.toggled(criteria, value),
  }));
}

/**
 * Every active constraint as its own removable chip — one per *value* in a
 * multi-select facet, so what narrowed the results is legible and reversible
 * one piece at a time. Sort and page are not constraints and get no chip.
 */
export function activeFilters({
  criteria,
  categories,
  includeCategory,
}: FacetScope): ActiveFilter[] {
  return [
    ...(criteria.query
      ? [
          {
            key: "query",
            label: strings.search.queryChip(criteria.query),
            facet: null,
            next: { ...criteria, query: "" },
          },
        ]
      : []),
    ...(includeCategory
      ? singleFilters(categoryFacet(categories), criteria)
      : []),
    ...singleFilters(price, criteria),
    ...multiFilters(occasion, criteria),
    ...multiFilters(flowerType, criteria),
    ...multiFilters(colour, criteria),
    ...singleFilters(size, criteria),
  ];
}
