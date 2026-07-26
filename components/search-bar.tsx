"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const PILL =
  "flex h-[42px] items-center gap-2 rounded-full border border-hairline-strong bg-white px-4";

/**
 * The persistent header search. Submitting navigates to the search page, which
 * owns all filtering; this control only carries the query across.
 *
 * On phones it collapses to an icon that expands over the header bar, so the
 * input never squeezes the wordmark and cart out of the row.
 */
export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    router.push(routes.searchFor(query));
    setExpanded(false);
  }

  const field = (autoFocus: boolean) => (
    <form
      onSubmit={submit}
      role="search"
      className={cn(PILL, "min-w-0 flex-1")}
    >
      <Search aria-hidden className="text-ink-muted size-4 shrink-0" />
      <input
        // Focus follows an explicit user action: the field only autofocuses
        // when the mobile search button opened it.
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label={strings.header.searchLabel}
        placeholder={strings.header.searchPlaceholder}
        className="placeholder:text-ink-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
      />
    </form>
  );

  return (
    <>
      <div className="mx-auto hidden max-w-[420px] flex-1 md:flex">
        {field(false)}
      </div>

      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label={strings.header.openSearch}
        className="ml-auto cursor-pointer p-1 md:hidden"
      >
        <Search aria-hidden className="size-5" />
      </button>

      {expanded && (
        <div className="bg-ground absolute inset-x-0 top-0 flex h-full items-center gap-3 px-7 md:hidden">
          {field(true)}
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label={strings.header.closeSearch}
            className="cursor-pointer p-1"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
      )}
    </>
  );
}
