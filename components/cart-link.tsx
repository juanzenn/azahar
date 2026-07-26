import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";

/**
 * Header cart affordance.
 *
 * The badge slot below renders as soon as there is a count to show. Wiring it
 * to live cart state — which turns this into a client component reading the
 * cart context — belongs to the cart ticket; until then the count is zero and
 * the badge stays out of the markup.
 */
const itemCount = 0;

export function CartLink() {
  return (
    <Link
      href={routes.cart}
      aria-label={
        itemCount > 0
          ? strings.header.cartWithCount(itemCount)
          : strings.header.cart
      }
      className="flex shrink-0 items-center gap-[7px] text-sm"
    >
      <ShoppingBag aria-hidden className="size-5" />
      {itemCount > 0 && (
        <span className="bg-primary text-primary-foreground rounded-full px-[7px] py-px text-[11px] tabular-nums">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
