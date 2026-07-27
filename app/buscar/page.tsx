import type { Metadata } from "next";
import { Suspense } from "react";

import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { Container } from "@/components/container";
import { ProductGrid } from "@/components/product-grid";
import { SearchResults } from "@/components/search-results";
import { catalog } from "@/lib/catalog";
import type { Category, Product } from "@/lib/catalog";
import { clearedCriteria } from "@/lib/facets";
import { routes } from "@/lib/routes";
import { search } from "@/lib/search";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: `${strings.search.title} — ${strings.site.name}`,
  description: strings.search.description,
};

/**
 * Global search — and, with no params, the whole catalog paginated, which is
 * what every "Ver todo" link points at.
 *
 * The catalog is read here, at build time, and handed to the island as props:
 * under static export there is no runtime server to ask, so the products travel
 * inside the prerendered page. The island never touches the seam.
 */
export default async function SearchPage() {
  const [products, categories, featured] = await Promise.all([
    catalog.listProducts(),
    catalog.listCategories(),
    catalog.listFeaturedProducts(),
  ]);

  const trail: Crumb[] = [
    { label: strings.breadcrumbs.home, href: routes.home },
    { label: strings.search.title },
  ];

  return (
    <Container className="pt-7 pb-20">
      <Breadcrumbs items={trail} />

      <div className="mt-7">
        {/* A query string is invisible at build time, so Next requires the
            island — which reads its whole state from one — to sit behind a
            boundary, and what lands in the exported HTML is the fallback.

            Deliberately real content rather than a skeleton, which the ticket
            rules out anyway: the same first page of the same catalog, from the
            same pure search the island runs. The trade is that a *shared,
            filtered* link paints the unfiltered page for the moment before
            hydration, which is the better half of the bargain — the bare URL
            is the common one, it is what a crawler and a JS-less visitor get,
            and merchandise beats a blank either way. */}
        <Suspense
          fallback={
            <UnfilteredFirstPage products={products} categories={categories} />
          }
        >
          <SearchResults
            products={products}
            categories={categories}
            suggestions={featured}
            scope={{ kind: "search" }}
          />
        </Suspense>
      </div>
    </Container>
  );
}

function UnfilteredFirstPage({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const { results, total } = search(products, clearedCriteria(), categories);

  return (
    <div>
      <h1 className="font-serif text-[26px] font-medium">
        {strings.search.resultCount(total)}
      </h1>
      <ProductGrid
        products={results}
        categories={categories}
        priorityCount={4}
        className="mt-7"
      />
    </div>
  );
}
