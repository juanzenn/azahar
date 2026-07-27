import type { OrderSection } from "@/lib/order";
import { cn } from "@/lib/utils";

/**
 * The order, as the shop received it.
 *
 * **Rendered from the very sections the WhatsApp message is written from.** That
 * is the whole design: this page is a record of a message that was sent
 * elsewhere, and a second set of conditionals — recipient only if it's a gift,
 * address only on delivery, card and notes only if filled — would eventually
 * disagree with the first. Here there is nothing to disagree with. What the
 * customer reads is what the florist reads, in the same order, down to which
 * blocks are absent.
 *
 * So this component holds no rules at all: labelled lines, unlabelled ones for
 * the items and the words on a card, and the emphasis the template puts on the
 * total. Presentation, like `OrderSummary` — which stays separate because it
 * shows a *live* quote that can still change, where this shows a figure the
 * customer has already been asked to transfer.
 */
export function OrderRecord({ sections }: { sections: OrderSection[] }) {
  return (
    <div className="grid gap-7">
      {sections.map((section) => (
        <section key={section.key}>
          <h3 className="eyebrow">{section.heading}</h3>

          <ul className="border-hairline mt-3 grid gap-2 border-t pt-3">
            {section.rows.map((row, index) => (
              <li
                key={`${row.label ?? ""}-${index}`}
                className={cn(
                  "flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[13px] leading-relaxed",
                  row.strong && "text-primary text-[17px]",
                )}
              >
                {row.label && (
                  <span className="text-ink-muted shrink-0">{row.label}</span>
                )}
                {/* Kept as the customer typed it: a note written across three
                    lines is read back as three lines. */}
                <span
                  className={cn(
                    "min-w-0 whitespace-pre-line",
                    row.label ? "text-right tabular-nums" : "w-full",
                  )}
                >
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
