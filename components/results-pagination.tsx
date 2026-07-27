import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

/**
 * Circular numbered pagination, emerald on the current page.
 *
 * Every control is a real link, so a page can be copied, bookmarked or opened
 * in a new tab — but a plain click is handled in-page instead, because paging
 * has to land at the top of the *results* rather than the top of the document,
 * and it is the one state change that pushes onto history.
 *
 * The catalog is 50 products at 12 a page, so every page number fits on one
 * row and there is nothing to truncate.
 *
 * Rendered inside the results island, whose client boundary it inherits.
 */
export function ResultsPagination({
  page,
  pageCount,
  hrefForPage,
  onSelectPage,
}: {
  page: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
  onSelectPage: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  function select(target: number) {
    return (event: React.MouseEvent) => {
      // Leave modified clicks to the browser, so the href keeps its promise.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      event.preventDefault();
      onSelectPage(target);
    };
  }

  const circle = "size-9 rounded-full border-transparent text-[14px]";

  return (
    <Pagination aria-label={strings.search.pagination} className="mt-11">
      <PaginationContent className="gap-1.5">
        {page > 1 && (
          <PaginationItem>
            <PaginationLink
              href={hrefForPage(page - 1)}
              onClick={select(page - 1)}
              aria-label={strings.search.previousPage}
              className={circle}
            >
              <ChevronLeft aria-hidden />
            </PaginationLink>
          </PaginationItem>
        )}

        {Array.from({ length: pageCount }, (_, index) => index + 1).map(
          (number) => (
            <PaginationItem key={number}>
              <PaginationLink
                href={hrefForPage(number)}
                onClick={select(number)}
                isActive={number === page}
                aria-label={strings.search.page(number)}
                className={cn(
                  circle,
                  number === page &&
                    "bg-primary text-primary-foreground hover:bg-primary",
                )}
              >
                {number}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        {page < pageCount && (
          <PaginationItem>
            <PaginationLink
              href={hrefForPage(page + 1)}
              onClick={select(page + 1)}
              aria-label={strings.search.nextPage}
              className={circle}
            >
              <ChevronRight aria-hidden />
            </PaginationLink>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
