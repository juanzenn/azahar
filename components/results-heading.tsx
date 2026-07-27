import type { ResultsScope } from "@/components/results-scope";
import { strings } from "@/lib/strings";

/**
 * The results header's title block, top-left of the results area.
 *
 * Shared by the island and by the prerendered stand-in that holds its place in
 * the exported HTML, so a page cannot retitle itself on hydration.
 */
export function ResultsHeading({
  scope,
  total,
  query = "",
}: {
  scope: ResultsScope;
  /** Over the full filtered set, independent of the current page. */
  total: number;
  /** Echoed by global search when the customer has typed something. */
  query?: string;
}) {
  const { search: copy } = strings;
  const category = scope.kind === "category" ? scope.category : null;

  // Global search is titled by its own count and owns the page's h1. A category
  // page is titled by the category, whose hero already took the h1 — and counts
  // products, "resultados" being the wording of a search someone ran.
  const Heading = category ? "h2" : "h1";

  return (
    <div>
      <Heading className="font-serif text-[26px] font-medium">
        {category
          ? category.name
          : query
            ? copy.resultCountFor(total, query)
            : copy.resultCount(total)}
      </Heading>
      {category && (
        <p className="text-ink-muted mt-1 text-[13px]">
          {copy.productCount(total)}
        </p>
      )}
    </div>
  );
}
