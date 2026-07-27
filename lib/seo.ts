import type { Metadata } from "next";

import type { Category, Product } from "@/lib/catalog";
import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";

/**
 * What a crawler needs, which a static export has to decide at build time.
 *
 * There is no request to read a host from, so nothing here can be derived — the
 * site's own URL arrives as an argument, from `shopConfig.siteUrl`, and every
 * absolute URL in the sitemap, the canonical tags and the Open Graph metadata is
 * built by joining a path onto it. Passing it in rather than importing config is
 * what keeps this module a pure function of its inputs, testable without an
 * environment.
 *
 * The one judgement worth stating: **the sitemap lists content, not the
 * checkout.** Cart, checkout and confirmation are transactional — one is a
 * half-filled cart in somebody's browser, another means nothing without the
 * order sitting in `sessionStorage` behind it — so indexing them is noise at
 * best and a confusing search result at worst.
 */

/** Venezuelan Spanish, the one locale the site ships. */
const LOCALE = "es_VE";

type OpenGraphPage = {
  title: string;
  description: string;
  /** Root-relative; `metadataBase` in the layout makes it absolute at build. */
  path: string;
  image?: { url: string; alt: string };
};

/**
 * One page's Open Graph block, with the site-wide parts filled in.
 *
 * This exists because of a sharp edge in Next's metadata merge: a page's
 * `openGraph` **replaces** the layout's rather than merging into it, so every
 * page that sets a title silently drops `siteName` and `locale`. Six pages each
 * repeating those two fields is six chances to forget one; building the block
 * here means a page states only what is its own.
 */
export function openGraph(page: OpenGraphPage) {
  // The return type is inferred rather than annotated as `Metadata["openGraph"]`,
  // which is a union whose common base has no `type` — annotating it would hide
  // the fields from every reader, tests included. `satisfies` gets the checking
  // without the widening: this shape has to remain valid Next metadata, and the
  // call sites still assign it to a `Metadata`.
  return {
    type: "website",
    siteName: strings.site.name,
    locale: LOCALE,
    title: page.title,
    description: page.description,
    url: page.path,
    // Absent rather than empty, so a page with no image of its own inherits
    // whatever default the layout carries.
    ...(page.image && { images: [page.image] }),
  } satisfies NonNullable<Metadata["openGraph"]>;
}

/** Join a route path onto the site's own URL. Query strings are never canonical. */
export function absoluteUrl(path: string, siteUrl: string): string {
  const site = siteUrl.replace(/\/+$/, "");
  const [pathname] = path.split("?");
  const trimmed = pathname.replace(/^\/+/, "").replace(/\/+$/, "");

  return trimmed ? `${site}/${trimmed}` : site;
}

/** Every path worth indexing, in the order a reader would meet them. */
export function sitemapPaths(
  products: readonly Product[],
  categories: readonly Category[],
): string[] {
  return [
    routes.home,
    routes.categories,
    routes.search,
    routes.about,
    ...categories.map((category) => routes.category(category.slug)),
    ...products.map((product) => routes.product(product.slug)),
  ];
}

/**
 * A schema.org `Product` for one product page.
 *
 * Deliberately silent about `availability`: the shop has no stock model at all,
 * so `InStock` would be a claim with nothing behind it. A missing property costs
 * some richness in a search result; an invented one misleads a customer.
 */
export function productJsonLd(product: Product, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    category: product.categorySlug,
    image: product.images.map((image) => absoluteUrl(image, siteUrl)),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(routes.product(product.slug), siteUrl),
      // Minor units are the app's currency everywhere; schema.org wants major,
      // as a string. Splitting the integer keeps the conversion off floats.
      price: `${Math.floor(product.priceUsdCents / 100)}.${String(
        product.priceUsdCents % 100,
      ).padStart(2, "0")}`,
      priceCurrency: "USD",
    },
  };
}
