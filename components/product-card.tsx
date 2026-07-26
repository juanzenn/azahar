import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";

/**
 * The product card, used everywhere products appear in a grid.
 *
 * Deliberately has no quick-add control: the whole card is one link through to
 * the product page, where the customer can actually see what they're buying.
 */
export function ProductCard({
  product,
  categoryName,
  priority = false,
}: {
  product: Product;
  /** Display name of the product's category, shown as the eyebrow. */
  categoryName: string;
  /** Set on above-the-fold cards to opt out of lazy loading. */
  priority?: boolean;
}) {
  return (
    <Link href={routes.product(product.slug)} className="group flex flex-col">
      <div className="bg-panel relative aspect-[3/4] overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-105"
        />
      </div>
      <div className="px-0.5 pt-4 text-center">
        <p className="text-ink-muted text-[10px] tracking-[0.18em] uppercase">
          {categoryName}
        </p>
        <p className="mt-1.5 font-serif text-[19px] leading-snug font-medium">
          {product.name}
        </p>
        <p className="text-primary mt-1.5 text-[15px] tracking-[0.02em]">
          {formatPrice(product.priceUsdCents)}
        </p>
      </div>
    </Link>
  );
}
