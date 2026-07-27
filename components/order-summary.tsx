import Link from "next/link";

import { formatPrice } from "@/lib/format";
import type { OrderQuote } from "@/lib/order";
import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const copy = strings.checkout.summary;

/**
 * What the customer is about to pay for, and what it comes to.
 *
 * **Three figures, never two.** Subtotal, envío and total are separate rows
 * because the delivery fee is the one charge a customer did not choose per
 * product, and a single total would leave them working out whether it was in
 * there. That matters more here than in most shops: the amount is about to be
 * transferred by hand, out of the app, from this number.
 *
 * Until a method is chosen, envío and total read "por definir" rather than
 * standing in as zero. A flat fee makes the exact total knowable the moment the
 * customer says how they want the flowers — so the honest gap is a short one,
 * and filling it with a number that is about to change would undo the reason the
 * fee is flat.
 *
 * Presentation only; the arithmetic is `quoteOrder`'s. Rendered inside the
 * checkout island, whose client boundary it inherits.
 */
export function OrderSummary({
  quote,
  className,
}: {
  quote: OrderQuote;
  className?: string;
}) {
  const { items, subtotalCents, deliveryCents, totalCents } = quote;

  return (
    <aside className={cn("border-hairline bg-panel border p-7", className)}>
      <h2 className="font-serif text-[18px]">{copy.heading}</h2>

      <ul className="mt-5 grid gap-3">
        {items.map(({ product, qty, lineTotalCents }) => (
          <li
            key={product.slug}
            className="flex justify-between gap-4 text-[13px] leading-snug"
          >
            <span>{copy.line(qty, product.name)}</span>
            <span className="shrink-0 tabular-nums">
              {formatPrice(lineTotalCents)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="border-hairline mt-5 grid gap-2.5 border-t pt-5">
        <Figure label={copy.subtotal} value={formatPrice(subtotalCents)} />
        <Figure
          label={copy.delivery}
          value={
            deliveryCents === null ? copy.pending : formatPrice(deliveryCents)
          }
        />
        <Figure
          label={copy.total}
          value={totalCents === null ? copy.pending : formatPrice(totalCents)}
          total
        />
      </dl>

      {totalCents === null && (
        <p className="text-ink-muted mt-3 text-[12px] leading-relaxed">
          {copy.pendingNote}
        </p>
      )}

      <Link
        href={routes.cart}
        className="mt-6 inline-block text-[13px] underline underline-offset-4"
      >
        {copy.editCart}
      </Link>
    </aside>
  );
}

function Figure({
  label,
  value,
  total = false,
}: {
  label: string;
  value: string;
  /** The one the customer is going to transfer, so it carries the emphasis. */
  total?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={total ? "font-serif text-[17px]" : "text-[13px]"}>
        {label}
      </dt>
      <dd
        className={
          total
            ? "text-primary text-[20px] tracking-[0.02em] tabular-nums"
            : "text-[13px] tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}
