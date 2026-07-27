import type { MetadataRoute } from "next";

import { shopConfig } from "@/lib/config";
import { routes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";

/**
 * `robots.txt`.
 *
 * The three disallowed paths are the transactional ones, and the reason is not
 * secrecy — a static export ships them to anyone who asks. It is that they have
 * nothing to index: the cart and checkout read their contents from the visitor's
 * own `localStorage`, and the confirmation page is blank without the order in
 * `sessionStorage` behind it, so a crawler stores an empty page and a searcher
 * finds it instead of the shop.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [routes.cart, routes.checkout, routes.orderSent],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml", shopConfig.siteUrl),
  };
}
