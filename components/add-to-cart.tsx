"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useCart } from "@/components/cart-provider";
import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";

/** Long enough to read, short enough that adding again reads as new news. */
const CONFIRMATION_MS = 4000;

/**
 * The one control on the product page that does something.
 *
 * Adding deliberately does not navigate and does not open anything: the
 * customer is mid-browse, judging a photograph, and being thrown into a cart
 * page ends that. Confirmation comes from two things moving instead — the
 * header badge, which is always on screen, and the line below the button, which
 * is a live region so the news is not purely visual.
 */
export function AddToCart({ slug }: { slug: string }) {
  const { add } = useCart();
  const [confirmed, setConfirmed] = useState(false);
  const hide = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Nothing should be left ticking for a page the customer has left.
  useEffect(() => () => clearTimeout(hide.current), []);

  function addOne() {
    add(slug);
    setConfirmed(true);
    clearTimeout(hide.current);
    hide.current = setTimeout(() => setConfirmed(false), CONFIRMATION_MS);
  }

  const { product: copy } = strings;

  return (
    <div className="mt-9">
      <button
        type="button"
        onClick={addOne}
        className="bg-primary text-primary-foreground w-full cursor-pointer px-9 py-4 text-sm tracking-[0.04em] sm:w-auto"
      >
        {copy.addToCart}
      </button>

      {/* The height is reserved, so a confirmation never shoves the page down. */}
      <p
        role="status"
        className="mt-4 flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1 text-[14px]"
      >
        {confirmed && (
          <>
            <span className="flex items-center gap-2">
              <Check aria-hidden className="text-primary size-4 shrink-0" />
              {copy.added}
            </span>
            <Link
              href={routes.cart}
              className="text-ink-muted underline underline-offset-4"
            >
              {copy.viewCart}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
