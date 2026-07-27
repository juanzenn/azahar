import { X } from "lucide-react";

import type { ActiveFilter } from "@/lib/facets";
import type { Criteria } from "@/lib/search";
import { strings } from "@/lib/strings";

/**
 * The applied filters, directly above the grid — one pill per active
 * constraint, plus a plum "Limpiar todo".
 *
 * This row is why the mobile sheet can be a throwaway: whatever a customer
 * picked in it stays visible and reversible out here, one constraint at a time.
 * It is also what makes a zero-result page legible, so it renders in that state
 * too and only disappears when nothing is active.
 *
 * Rendered inside the results island, whose client boundary it inherits.
 */
export function FilterChips({
  filters,
  onChoose,
  onClearAll,
}: {
  filters: ActiveFilter[];
  onChoose: (criteria: Criteria) => void;
  onClearAll: () => void;
}) {
  if (filters.length === 0) return null;

  return (
    <div
      role="group"
      aria-label={strings.search.activeFiltersLabel}
      className="flex flex-wrap items-center gap-2"
    >
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          // The label alone would announce as a statement rather than an
          // action, so the accessible name says what the click does.
          aria-label={strings.search.removeFilter(filter.label)}
          onClick={() => onChoose(filter.next)}
          className="border-hairline hover:border-hairline-strong flex cursor-pointer items-center gap-1.5 rounded-full border bg-white px-3 py-[5px] text-[12px] transition-colors"
        >
          {filter.label}
          <X aria-hidden className="text-ink-muted size-3" />
        </button>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="text-plum border-plum/40 hover:border-plum cursor-pointer rounded-full border px-3 py-[5px] text-[12px] transition-colors"
      >
        {strings.search.clearAll}
      </button>
    </div>
  );
}
