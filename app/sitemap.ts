import type { MetadataRoute } from "next";

import { catalog } from "@/lib/catalog";
import { shopConfig } from "@/lib/config";
import { absoluteUrl, sitemapPaths } from "@/lib/seo";

/**
 * `sitemap.xml`, written into the export at build time like every other page.
 *
 * Which paths belong is `lib/seo`'s call and is tested there — this reads the
 * catalog seam and joins each path onto the configured site, and does nothing
 * else. No `lastModified`: the only date available is this build's, so it would
 * announce that every page changed at once each time the site is deployed, which
 * is worse than saying nothing. `changeFrequency` and `priority` are omitted for
 * the same reason — invented signals a crawler already discounts.
 */
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    catalog.listProducts(),
    catalog.listCategories(),
  ]);

  return sitemapPaths(products, categories).map((path) => ({
    url: absoluteUrl(path, shopConfig.siteUrl),
  }));
}
