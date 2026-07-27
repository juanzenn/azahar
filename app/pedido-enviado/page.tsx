import type { Metadata } from "next";

import { Container } from "@/components/container";
import { OrderSentView } from "@/components/order-sent-view";
import { shopConfig } from "@/lib/config";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: `${strings.orderSent.title} — ${strings.site.name}`,
  description: strings.orderSent.description,
  // Nobody should reach a stranger's confirmation from a search result — and
  // without a stashed order there is nothing here but a redirect home.
  robots: { index: false, follow: false },
};

/**
 * The confirmation page. No catalog read: the order stopped needing one the
 * moment it was built, which is what lets it be a self-contained record in the
 * customer's own `sessionStorage`.
 *
 * The heading is here rather than in the island so it is in the exported HTML,
 * and the shop's two numbers are read here for the same reason every other page
 * reads config: the deep-link's destination and the fallback a customer copies
 * belong in configuration and nowhere else.
 */
export default function OrderSentPage() {
  return (
    <Container className="pt-9 pb-24">
      <p className="eyebrow">{strings.orderSent.eyebrow}</p>
      <h1 className="mt-3 text-[clamp(28px,3.6vw,38px)] leading-[1.08]">
        {strings.orderSent.heading}
      </h1>
      <p className="text-ink-muted mt-3 max-w-[52ch] text-[15px] leading-relaxed">
        {strings.orderSent.intro}
      </p>

      <OrderSentView
        whatsappNumber={shopConfig.whatsappNumber}
        phoneDisplay={shopConfig.phoneDisplay}
      />
    </Container>
  );
}
