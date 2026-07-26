"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

import { SearchForm } from "@/components/search-form";
import { strings } from "@/lib/strings";

/**
 * The persistent header search.
 *
 * On phones it collapses to an icon that expands over the header bar, so the
 * input never squeezes the wordmark and cart out of the row.
 */
export function SearchBar() {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="mx-auto hidden max-w-[420px] flex-1 md:flex">
        <SearchForm className="h-[42px] flex-1" />
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
          <SearchForm
            className="h-[42px] flex-1"
            autoFocus
            onSubmitted={() => setExpanded(false)}
          />
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
