"use client";

import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { useCart } from "@/components/cart-provider";
import { MAX_LINE_QTY, resolveCart } from "@/lib/cart";
import type { CartItem } from "@/lib/cart";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";

const { cart: copy } = strings;

/**
 * The cart, rendered.
 *
 * The customer's stored lines carry a slug and a quantity; every word and every
 * figure on this page comes from `products`, which the page read from the seam at
 * build time. That is the whole reason a cart left for a month cannot quote a
 * price the shop has stopped charging.
 *
 * Quantity and removal go straight back to the shared cart state, so the header
 * badge and the subtotal move together — there is no local copy to drift.
 */
export function CartView({ products }: { products: Product[] }) {
  const { lines, loaded, count, setQty, remove } = useCart();

  const { items, subtotalCents } = useMemo(
    () => resolveCart(lines, products),
    [lines, products],
  );

  // The exported HTML cannot know a cart, so this is what stands where one will
  // be. Saying nothing beats telling a customer with a full cart that it is
  // empty for the frame before the store is read.
  if (!loaded) return <div className="min-h-[46vh]" />;

  if (items.length === 0) return <EmptyCart />;

  return (
    <>
      <p className="text-ink-muted mt-3 text-sm">{copy.itemCount(count)}</p>

      <div className="mt-9 grid items-start gap-11 lg:grid-cols-[1fr_320px] lg:gap-16">
        <ul className="border-hairline border-t">
          {items.map((item) => (
            <CartRow
              key={item.product.slug}
              item={item}
              onQty={setQty}
              onRemove={remove}
            />
          ))}
        </ul>

        <aside className="border-hairline bg-panel border p-7 lg:sticky lg:top-[98px]">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-serif text-[18px]">{copy.subtotal}</span>
            <span className="text-primary text-[22px] tracking-[0.02em]">
              {formatPrice(subtotalCents)}
            </span>
          </div>
          <p className="text-ink-muted mt-3 text-[13px] leading-relaxed">
            {copy.subtotalNote}
          </p>
          <Link
            href={routes.search}
            className="mt-7 inline-block text-[13px] underline underline-offset-4"
          >
            {copy.keepShopping}
          </Link>
        </aside>
      </div>
    </>
  );
}

function CartRow({
  item: { product, qty, lineTotalCents },
  onQty,
  onRemove,
}: {
  item: CartItem;
  onQty: (slug: string, qty: number) => void;
  onRemove: (slug: string) => void;
}) {
  const href = routes.product(product.slug);

  return (
    <li className="border-hairline flex gap-5 border-b py-7 sm:gap-7">
      {/* Clickable but decorative: the name beside it is the row's one link to
          the product, so announcing this one too — and stopping at it on the way
          to the stepper — would only be noise. */}
      <Link
        href={href}
        aria-hidden
        tabIndex={-1}
        className="bg-panel relative aspect-[3/4] w-[84px] shrink-0 overflow-hidden sm:w-[104px]"
      >
        <Image
          src={product.images[0]}
          alt=""
          fill
          sizes="104px"
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-7">
        <div className="min-w-0">
          <Link href={href} className="font-serif text-[19px] leading-snug">
            {product.name}
          </Link>
          <p className="text-ink-muted mt-1.5 text-[13px]">
            {copy.unitPrice(formatPrice(product.priceUsdCents))}
          </p>

          <div className="mt-5 flex items-center gap-5">
            <div className="border-hairline-strong flex items-center border">
              <StepperButton
                label={copy.decrease(product.name)}
                disabled={qty <= 1}
                onClick={() => onQty(product.slug, qty - 1)}
              >
                <Minus aria-hidden className="size-3.5" />
              </StepperButton>
              <span className="min-w-7 text-center text-[14px] tabular-nums">
                {qty}
              </span>
              <StepperButton
                label={copy.increase(product.name)}
                disabled={qty >= MAX_LINE_QTY}
                onClick={() => onQty(product.slug, qty + 1)}
              >
                <Plus aria-hidden className="size-3.5" />
              </StepperButton>
            </div>

            <button
              type="button"
              onClick={() => onRemove(product.slug)}
              aria-label={copy.removeItem(product.name)}
              className="text-ink-muted cursor-pointer text-[13px] underline underline-offset-4"
            >
              {copy.remove}
            </button>
          </div>
        </div>

        <p className="text-primary text-[16px] tracking-[0.02em] sm:text-right">
          {formatPrice(lineTotalCents)}
        </p>
      </div>
    </li>
  );
}

function StepperButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="cursor-pointer px-3 py-2 disabled:cursor-default disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/**
 * An empty cart is a real page with one way out of it, not a blank column: the
 * customer who lands here has nothing to act on, so the catalog is the only
 * useful thing to offer.
 */
function EmptyCart() {
  return (
    <div className="border-hairline mt-9 border-t pt-14 text-center">
      <p className="mx-auto max-w-[30ch] font-serif text-[22px] leading-snug text-balance">
        {copy.emptyHeading}
      </p>
      <p className="text-ink-muted mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed">
        {copy.emptyBody}
      </p>
      <Link
        href={routes.search}
        className="bg-primary text-primary-foreground mt-8 inline-block px-9 py-4 text-sm tracking-[0.04em]"
      >
        {copy.keepShopping}
      </Link>
    </div>
  );
}
