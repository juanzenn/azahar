import { ProductCard } from "@/components/product-card";
import type { Category, Product } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * A responsive grid of product cards.
 *
 * Cards need their category's display name, which only the catalog knows, so
 * every grid would otherwise rebuild the same slug→name map. Owning that here
 * keeps the results grid, the "quizás te interese" row and the prerendered
 * fallback identical in every respect but their column count.
 */
export function ProductGrid({
  products,
  categories,
  priorityCount = 0,
  className,
}: {
  products: Product[];
  categories: Category[];
  /** How many leading cards skip lazy loading, being above the fold. */
  priorityCount?: number;
  className?: string;
}) {
  const categoryName = new Map(
    categories.map((category) => [category.slug, category.name]),
  );

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-[30px] md:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.slug}
          product={product}
          categoryName={categoryName.get(product.categorySlug) ?? ""}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
