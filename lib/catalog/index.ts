import { staticSource } from "@/lib/catalog/static-source";

import type { CatalogSource } from "@/lib/catalog/source";

/**
 * The active catalog source.
 *
 * UI code imports from `@/lib/catalog` and never learns which implementation
 * is behind it. Moving to a hosted API means adding an implementation of
 * `CatalogSource` and changing this one line — and TypeScript refuses to
 * compile an implementation that does not satisfy the contract, so "swap
 * without touching the UI" is enforced rather than hoped for.
 */
export const catalog: CatalogSource = staticSource;

export { relatedProducts } from "@/lib/catalog/related";
export type { CatalogSource } from "@/lib/catalog/source";
export type {
  Category,
  CategorySlug,
  Colour,
  FlowerType,
  Occasion,
  Product,
  Size,
} from "@/lib/catalog/types";
export {
  CATEGORY_SLUGS,
  COLOURS,
  FLOWER_TYPES,
  OCCASIONS,
  SIZES,
} from "@/lib/catalog/types";
