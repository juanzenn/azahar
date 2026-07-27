import { Suspense } from "react";

import { ProductGrid } from "@/components/product-grid";
import { ResultsHeading } from "@/components/results-heading";
import type { ResultsScope } from "@/components/results-scope";
import { SearchResults } from "@/components/search-results";
import type { Category, Product } from "@/lib/catalog";
import { clearedCriteria } from "@/lib/facets";
import { search } from "@/lib/search";

/**
 * The results surface as a page mounts it: the island, the boundary static
 * export requires around it, and the merchandise that stands in for it until it
 * hydrates.
 *
 * Both entry points render exactly this, differing only in the catalog they hand
 * over and the scope they declare — so the keystone decision ("one results
 * surface, two entry points") is one component wide, and pairing the boundary
 * with the right fallback is not something a route has to remember.
 *
 * A page's own job is what is genuinely its own: reading the seam at build time,
 * its breadcrumbs, its hero.
 */
export function ResultsSurface({
  products,
  categories,
  suggestions,
  scope,
}: {
  /** The catalog this surface searches, embedded in the page as props. */
  products: Product[];
  categories: Category[];
  /** The "Quizás te interese" row, shown only when nothing matches. */
  suggestions: Product[];
  scope: ResultsScope;
}) {
  return (
    <Suspense
      fallback={
        <PrerenderedFirstPage
          products={products}
          categories={categories}
          scope={scope}
        />
      }
    >
      <SearchResults
        products={products}
        categories={categories}
        suggestions={suggestions}
        scope={scope}
      />
    </Suspense>
  );
}

/**
 * What the exported HTML carries where the island will hydrate.
 *
 * A query string is invisible at build time, so Next requires an island that
 * reads its whole state from one to sit behind a Suspense boundary — and what
 * lands in the static file is the boundary's fallback.
 *
 * Deliberately real merchandise rather than a skeleton, which the direction
 * rules out anyway: the same first page of the same catalog, computed by the
 * same pure search the island runs. The trade is that a *shared, filtered* link
 * paints the unfiltered view for the moment before hydration, which is the
 * better half of the bargain — the bare URL is the common one, it is what a
 * crawler and a JS-less visitor get, and merchandise beats a blank either way.
 */
function PrerenderedFirstPage({
  products,
  categories,
  scope,
}: {
  products: Product[];
  categories: Category[];
  scope: ResultsScope;
}) {
  const { results, total } = search(products, clearedCriteria(), categories);

  return (
    <div>
      <ResultsHeading scope={scope} total={total} />
      <ProductGrid
        products={results}
        categories={categories}
        priorityCount={4}
        className="mt-7"
      />
    </div>
  );
}
