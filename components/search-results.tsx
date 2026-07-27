"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FacetPanel } from "@/components/facet-panel";
import { FilterChips } from "@/components/filter-chips";
import { NoResults } from "@/components/no-results";
import { ProductGrid } from "@/components/product-grid";
import { ResultsHeading } from "@/components/results-heading";
import type { ResultsScope } from "@/components/results-scope";
import { ResultsPagination } from "@/components/results-pagination";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, Product } from "@/lib/catalog";
import { activeFilters, clearedCriteria, facetGroups } from "@/lib/facets";
import { SORTS, parseCriteria, search, toSearchParams } from "@/lib/search";
import type { Criteria, Sort } from "@/lib/search";
import { strings } from "@/lib/strings";

/** Long enough to swallow a burst of typing, short enough to feel live. */
const QUERY_DEBOUNCE_MS = 250;

/**
 * The results surface: sidebar, chips, grid and pagination over a catalog it is
 * handed as props.
 *
 * The **query string is the only state**. Whether the mobile sheet is open is
 * the one thing here React holds; every control computes the criteria it wants,
 * writes them to the URL, and the next render reads them back. Reload, share
 * and Back therefore reproduce a view for free rather than by bookkeeping.
 *
 * Writes `replace` so Back leaves search instead of replaying a customer's
 * tweaks — with one deliberate exception, paging, which `push`es so Back steps
 * through result pages.
 *
 * There is no loading state anywhere: `search` is a synchronous pass over an
 * array that is already in memory.
 *
 * Both entry points are this one component. Everything the scope changes is
 * below; nothing else here knows which route it is on, and the base URL every
 * write lands on is simply `usePathname`, which is what keeps a category page's
 * "Limpiar todo" on the category.
 */
export function SearchResults({
  products,
  categories,
  suggestions,
  scope,
}: {
  /** The whole catalog this surface searches, embedded by the page. */
  products: Product[];
  categories: Category[];
  /** The "Quizás te interese" row, shown only when nothing matches. */
  suggestions: Product[];
  scope: ResultsScope;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsTop = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const includeCategory = scope.kind === "search";

  const criteria = useMemo(() => {
    const parsed = parseCriteria(searchParams);
    // A category page's `cat` param is meaningless and could only contradict
    // the path, so it is dropped before it can filter the page to nothing.
    return includeCategory ? parsed : { ...parsed, category: null };
  }, [searchParams, includeCategory]);

  const { results, total, facetCounts, pageCount, page } = useMemo(
    () => search(products, criteria, categories),
    [products, criteria, categories],
  );

  const scopeForFacets = { criteria, categories, includeCategory };
  const groups = facetGroups(scopeForFacets, facetCounts);
  const filters = activeFilters(scopeForFacets);
  // The badge counts what is inside the sheet. The query has its own box and its
  // own chip out here, so counting it would promise a selection the panel has
  // no row for.
  const facetCount = filters.filter((filter) => filter.facet !== null).length;

  const hrefFor = useCallback(
    (next: Criteria) => {
      const query = toSearchParams(next).toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname],
  );

  /**
   * Every state change lands here. Filters replace the history entry; paging is
   * the exception that pushes. Next's own scrolling is off throughout — the one
   * place a scroll is wanted, it goes to the results rather than the document.
   */
  const commit = useCallback(
    (next: Criteria, history: "replace" | "push" = "replace") => {
      router[history](hrefFor(next), { scroll: false });
    },
    [hrefFor, router],
  );

  /** Filters, price, sort and the query box: page 1, one history entry. */
  const apply = useCallback(
    (next: Criteria) => commit({ ...next, page: 1 }),
    [commit],
  );

  function goToPage(next: number) {
    commit({ ...criteria, page: next }, "push");
    resultsTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // The query box is deliberately uncontrolled: the text mid-word is the DOM's
  // business, and React re-deriving it from the URL is what would swallow the
  // space a customer had just typed — the criteria come back *trimmed*, so the
  // second word would be glued onto the first.
  const queryBox = useRef<HTMLInputElement>(null);

  function queryTyped(text: string) {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(
      () => apply({ ...criteria, query: text.trim() }),
      QUERY_DEBOUNCE_MS,
    );
  }

  // The URL still wins, though — just only where the two genuinely disagree,
  // which is exactly when the query changed from somewhere that is not this box:
  // a chip, a clear-all, or the header bar searching again from this very page.
  useEffect(() => {
    const box = queryBox.current;
    if (box && box.value.trim() !== criteria.query) box.value = criteria.query;
  }, [criteria.query]);

  // Nothing should navigate on behalf of a page the customer has already left.
  useEffect(() => () => clearTimeout(debounce.current), []);

  const { search: copy } = strings;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[256px_1fr] lg:gap-11">
      <aside className="hidden lg:sticky lg:top-[98px] lg:block">
        <FacetPanel groups={groups} onChoose={apply} />
      </aside>

      <div>
        <form
          role="search"
          // Enter applies at once instead of waiting out the debounce; there is
          // nothing else to submit, since filtering never left the page.
          onSubmit={(event) => {
            event.preventDefault();
            clearTimeout(debounce.current);
            apply({ ...criteria, query: queryBox.current?.value.trim() ?? "" });
          }}
          className="border-hairline-strong flex h-[46px] items-center gap-2 rounded-full border bg-white px-5"
        >
          <Search aria-hidden className="text-ink-muted size-4 shrink-0" />
          <input
            ref={queryBox}
            type="search"
            defaultValue={criteria.query}
            onChange={(event) => queryTyped(event.target.value)}
            aria-label={copy.queryLabel}
            placeholder={copy.queryPlaceholder}
            className="placeholder:text-ink-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </form>

        <div
          ref={resultsTop}
          className="mt-7 flex scroll-mt-[92px] flex-wrap items-baseline justify-between gap-x-6 gap-y-3"
        >
          <ResultsHeading scope={scope} total={total} query={criteria.query} />

          <div className="flex items-center gap-4">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger className="border-hairline-strong flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-[13px] lg:hidden">
                <SlidersHorizontal aria-hidden className="size-3.5" />
                {facetCount > 0
                  ? copy.filtersWithCount(facetCount)
                  : copy.filters}
              </SheetTrigger>

              <SheetContent
                side="left"
                showCloseButton={false}
                className="flex w-[88%] flex-col gap-0 p-0 sm:max-w-sm"
              >
                <SheetHeader className="border-hairline flex-row items-center justify-between border-b px-6 py-4">
                  <SheetTitle className="font-serif text-[20px]">
                    {copy.filters}
                  </SheetTitle>
                  <SheetClose
                    aria-label={copy.closeFilters}
                    className="cursor-pointer p-1"
                  >
                    <X aria-hidden className="size-4" />
                  </SheetClose>
                </SheetHeader>

                {/* Identical groups to the sidebar, collapsed so all six fit,
                    and applying live — the footer only dismisses. */}
                <div className="flex-1 overflow-y-auto px-6 py-2">
                  <FacetPanel groups={groups} onChoose={apply} collapsible />
                </div>

                <SheetFooter className="border-hairline border-t p-5">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="bg-primary text-primary-foreground w-full cursor-pointer py-3.5 text-sm tracking-[0.04em]"
                  >
                    {copy.showResults(total)}
                  </button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Select
              value={criteria.sort}
              onValueChange={(sort: Sort | null) => {
                if (sort) apply({ ...criteria, sort });
              }}
            >
              <SelectTrigger
                aria-label={copy.sortLabel}
                className="border-ink h-auto rounded-none border-0 border-b px-1 py-1.5 text-[13px]"
              >
                <SelectValue>{(sort: Sort) => copy.sorts[sort]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((sort) => (
                  <SelectItem key={sort} value={sort}>
                    {copy.sorts[sort]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5">
          <FilterChips
            filters={filters}
            onChoose={apply}
            onClearAll={() => apply(clearedCriteria())}
          />
        </div>

        {results.length > 0 ? (
          <ProductGrid
            products={results}
            categories={categories}
            priorityCount={4}
            className="mt-7"
          />
        ) : (
          <NoResults
            suggestions={suggestions}
            categories={categories}
            onClearFilters={
              filters.length > 0 ? () => apply(clearedCriteria()) : undefined
            }
          />
        )}

        <ResultsPagination
          page={page}
          pageCount={pageCount}
          hrefForPage={(number) => hrefFor({ ...criteria, page: number })}
          onSelectPage={goToPage}
        />
      </div>
    </div>
  );
}
