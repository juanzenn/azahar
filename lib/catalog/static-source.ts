import { categories } from "@/data/categories";
import { FLAGSHIP_SLUG, products } from "@/data/products";
import type { CatalogSource } from "@/lib/catalog/source";
import type { Category, Product } from "@/lib/catalog/types";

/**
 * Catalog served from the committed seed modules.
 *
 * Everything resolves immediately; pages await it at build time and the cost
 * disappears into the static output.
 */
export const staticSource: CatalogSource = {
  async listProducts(): Promise<Product[]> {
    return products;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    return products.find((product) => product.slug === slug) ?? null;
  },

  async listFeaturedProducts(): Promise<Product[]> {
    const featured = products.filter((product) => product.featured);
    // The flagship is curated purely by ordering — there is no sales data to
    // rank by, and the home hero is defined as the first item returned here.
    return [
      ...featured.filter((product) => product.slug === FLAGSHIP_SLUG),
      ...featured.filter((product) => product.slug !== FLAGSHIP_SLUG),
    ];
  },

  async listCategories(): Promise<Category[]> {
    return categories;
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return categories.find((category) => category.slug === slug) ?? null;
  },

  async listProductsByCategory(slug: string): Promise<Product[]> {
    return products.filter((product) => product.categorySlug === slug);
  },
};
