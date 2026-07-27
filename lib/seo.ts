import type { Metadata } from "next";

import type { Category, Product } from "@/lib/catalog";
import { priceDecimal } from "@/lib/format";
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

export type SeoPage = {
  title: string;
  description: string;
  /** Root-relative; `metadataBase` in the layout makes it absolute at build. */
  path: string;
  /**
   * The page's share image, when it has one of its own. The three utility pages
   * — search, the category index, about — have no single photograph that is
   * honestly *theirs*, and inventing one would mean stitching an image path
   * together outside the catalog data, which is the thing ticket 03 set up the
   * complete-reference-string rule to prevent.
   */
  image?: { url: string; alt: string };
};

/**
 * Everything one page owes a crawler: title, description, canonical, Open Graph.
 *
 * A single door because both halves have a way of going missing quietly. Next
 * **replaces** a parent's `openGraph` with a child's rather than merging it, so
 * every page that sets a title would otherwise drop the layout's `siteName` and
 * `locale`; and a canonical is invisible when absent — nothing fails, the page
 * simply competes with itself. Pages state what is theirs and cannot forget the
 * rest.
 */
export function pageMetadata(page: SeoPage): Metadata {
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: openGraph(page),
  };
}

/** One page's Open Graph block, with the site-wide parts filled in. */
export function openGraph(page: SeoPage) {
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
    // Omitted rather than empty when a page has none: a platform showing a
    // link with no image is a smaller loss than one showing a broken one.
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
      // Through `lib/format` like every other amount in the app — minor units
      // are the catalog's currency, and this is the machine-readable rendering.
      price: priceDecimal(product.priceUsdCents),
      priceCurrency: "USD",
    },
  };
}
