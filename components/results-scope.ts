import type { Category } from "@/lib/catalog";

/**
 * Which of the two entry points a results surface is serving.
 *
 * One component answers both, so this is the only knob that separates them —
 * and it is deliberately the whole difference, stated in one place rather than
 * inferred from the route.
 *
 * Global search offers the Categoría facet and titles itself by its result
 * count. A category page has its category fixed by the path, so the group is
 * omitted, the fixed category is not a removable chip, "Limpiar todo" leaves the
 * customer where they are, and the heading names the category instead.
 *
 * Its own module because everything downstream needs it — the island, the
 * heading, the surface that wraps them and both pages that mount it — and none
 * of them is where the others would look for it.
 */
export type ResultsScope =
  { kind: "search" } | { kind: "category"; category: Category };
