import type { Metadata } from "next";

import { CheckoutView } from "@/components/checkout-view";
import { Container } from "@/components/container";
import { catalog } from "@/lib/catalog";
import { shopConfig } from "@/lib/config";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: `${strings.checkout.title} — ${strings.site.name}`,
  description: strings.checkout.description,
};

/**
 * Checkout. No breadcrumbs, like the cart: it is a step in the order rather than
 * a place in the catalog.
 *
 * The two things the island cannot work out for itself are read here, at build
 * time, and handed down: the catalog every line resolves its name and price
 * against, and the shop's flat delivery fee. Neither is fetched by the island —
 * the fee in particular arrives as a prop so the number lives in config and
 * nowhere else.
 */
export default async function CheckoutPage() {
  const products = await catalog.listProducts();

  return (
    <Container className="pt-9 pb-24">
      <h1 className="text-[clamp(28px,3.6vw,38px)] leading-[1.08]">
        {strings.checkout.heading}
      </h1>
      <p className="text-ink-muted mt-3 max-w-[52ch] text-[15px] leading-relaxed">
        {strings.checkout.intro}
      </p>

      <CheckoutView
        products={products}
        deliveryFeeUsdCents={shopConfig.deliveryFeeUsdCents}
      />
    </Container>
  );
}
