"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

/**
 * The search field itself, shared by the header and the home hero.
 *
 * Submitting navigates to the search page, which owns all filtering — this
 * control only carries the query across.
 */
export function SearchForm({
  className,
  iconClassName,
  autoFocus = false,
  onSubmitted,
}: {
  className?: string;
  iconClassName?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    router.push(routes.searchFor(query));
    onSubmitted?.();
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      className={cn(
        "border-hairline-strong flex min-w-0 items-center gap-2 rounded-full border bg-white px-4",
        className,
      )}
    >
      <Search
        aria-hidden
        className={cn("text-ink-muted size-4 shrink-0", iconClassName)}
      />
      <input
        // Focus follows an explicit user action: only the mobile header search,
        // which the visitor opened by tapping the icon, asks for it.
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label={strings.header.searchLabel}
        placeholder={strings.header.searchPlaceholder}
        className="placeholder:text-ink-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
      />
    </form>
  );
}
