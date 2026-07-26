import type { Product } from "@/lib/catalog/types";

/**
 * How many products the "más de esta categoría" row shows.
 *
 * Four fills one row of cards at every breakpoint the grid uses, so the row
 * never wraps into a lonely orphan card.
 */
const RELATED_LIMIT = 4;

/**
 * The sideways move out of a product page: other arrangements in the same
 * category, so a customer who likes the format but not this particular one has
 * somewhere to go.
 *
 * Callers normally pass the category's products (`listProductsByCategory`),
 * which is the one scoped request a hosted API would make. Filtering by
 * category here anyway costs a line and makes the whole catalog a safe input
 * too — the rule is stated once, in the one place that owns it.
 *
 * Ordering is the catalog's own: the seed is curated, and there is no
 * behavioural data to rank relatedness by.
 */
export function relatedProducts(
  products: Product[],
  current: Product,
): Product[] {
  return products
    .filter(
      (product) =>
        product.categorySlug === current.categorySlug &&
        product.slug !== current.slug,
    )
    .slice(0, RELATED_LIMIT);
}
