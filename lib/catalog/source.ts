import type { Category, Product } from "@/lib/catalog/types";

/**
 * The one door between the storefront and its catalog data.
 *
 * Every method is async even though today's implementation resolves
 * immediately from committed modules. A hosted API is inherently async, so an
 * async contract makes swapping the source a change behind the signature —
 * no call site moves. A sync contract would force every call site to change at
 * exactly the moment this seam exists to protect.
 *
 * The methods mirror the endpoints such an API would expose, so the UI stays
 * dumb and the swap stays faithful.
 *
 * There is deliberately no `search` method: under static export a build-time
 * search cannot see a visitor's filters, so search is a pure client-side
 * function over the catalog the page embeds.
 */
export interface CatalogSource {
  /** Every product. Powers the catalog the search page embeds as props. */
  listProducts(): Promise<Product[]>;

  /** `null` when no product has that slug — the page turns that into a 404. */
  getProductBySlug(slug: string): Promise<Product | null>;

  /** Curated home-page highlights, flagship first. */
  listFeaturedProducts(): Promise<Product[]>;

  listCategories(): Promise<Category[]>;

  /** `null` when no category has that slug. */
  getCategoryBySlug(slug: string): Promise<Category | null>;

  listProductsByCategory(slug: string): Promise<Product[]>;
}
