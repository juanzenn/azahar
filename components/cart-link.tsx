"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { useCart } from "@/components/cart-provider";
import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";

/**
 * Header cart affordance, with the live item count.
 *
 * The badge is the confirmation an add gets — the customer stays on the product
 * page, so this is what has to move. It reads the shared cart state, which means
 * it ticks up on the same render as the click.
 *
 * The count is 0 in the exported HTML, where no cart can be known yet; the badge
 * simply stays out of the markup until the store has been read.
 */
export function CartLink() {
  const { count } = useCart();

  return (
    <Link
      href={routes.cart}
      aria-label={
        count > 0 ? strings.header.cartWithCount(count) : strings.header.cart
      }
      className="flex shrink-0 items-center gap-[7px] text-sm"
    >
      <ShoppingBag aria-hidden className="size-5" />
      {count > 0 && (
        <span className="bg-primary text-primary-foreground rounded-full px-[7px] py-px text-[11px] tabular-nums">
          {count}
        </span>
      )}
    </Link>
  );
}
