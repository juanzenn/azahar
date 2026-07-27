import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";
import type { Category, Product } from "@/lib/catalog";
import { strings } from "@/lib/strings";

/**
 * What a search that matched nothing says.
 *
 * Since disable-zero keeps the facets from ever dead-ending, getting here means
 * the free text missed — hence the spelling nudge, there being no fuzzy match to
 * save it. The sidebar and the chips stay exactly where they were, outside this
 * component, so the cause is still on screen and still reversible; all this adds
 * is the wording, one prominent way out, and something to look at instead.
 *
 * Rendered inside the results island, whose client boundary it inherits.
 */
export function NoResults({
  suggestions,
  categories,
  onClearFilters,
}: {
  /** The "Quizás te interese" row; nothing renders if it is empty. */
  suggestions: Product[];
  categories: Category[];
  /** Omitted when there is nothing to clear, which leaves the button out. */
  onClearFilters?: () => void;
}) {
  const { search: copy } = strings;

  return (
    <>
      <div className="border-hairline mt-7 border-t pt-12 text-center">
        <p className="mx-auto max-w-[34ch] font-serif text-[22px] leading-snug text-balance">
          {copy.emptyHeading}
        </p>
        <p className="text-ink-muted mt-3 text-[15px]">{copy.emptyBody}</p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="bg-primary text-primary-foreground mt-7 cursor-pointer px-[30px] py-[15px] text-sm tracking-[0.04em]"
          >
            {copy.clearFilters}
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <section className="mt-16">
          <SectionHeading eyebrow={copy.suggestionsEyebrow}>
            {copy.suggestionsHeading}
          </SectionHeading>
          <ProductGrid
            products={suggestions.slice(0, 4)}
            categories={categories}
            className="md:grid-cols-4"
          />
        </section>
      )}
    </>
  );
}
