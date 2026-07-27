import type { Metadata } from "next";

import { CartView } from "@/components/cart-view";
import { Container } from "@/components/container";
import { catalog } from "@/lib/catalog";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: `${strings.cart.title} — ${strings.site.name}`,
  description: strings.cart.description,
  // A cart's contents live in the visitor's own `localStorage`, so what a crawler
  // would store is the empty state — a search result that shows the shop has
  // nothing in it. `robots.txt` says the same; this is the copy that travels
  // with the page.
  robots: { index: false, follow: true },
};

/**
 * The cart. No breadcrumbs — per the IA it is a step in the order rather than a
 * place in the catalog's tree.
 *
 * The catalog is read here and handed over as props, exactly as the search page
 * does it: the stored lines are slugs and quantities, and every name, photograph
 * and price on the page is resolved from this catalog at render.
 */
export default async function CartPage() {
  const products = await catalog.listProducts();

  return (
    <Container className="pt-9 pb-24">
      <h1 className="text-[clamp(28px,3.6vw,38px)] leading-[1.08]">
        {strings.cart.heading}
      </h1>
      <CartView products={products} />
    </Container>
  );
}
