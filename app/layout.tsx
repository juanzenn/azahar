import type { Metadata } from "next";

import { CartProvider } from "@/components/cart-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { catalog } from "@/lib/catalog";
import { shopConfig } from "@/lib/config";
import { routes } from "@/lib/routes";
import { openGraph } from "@/lib/seo";
import { strings } from "@/lib/strings";

import "./globals.css";

/**
 * `metadataBase` is what lets every page below write `openGraph.url` and its
 * images as plain root-relative paths and still emit absolute ones — a static
 * export has no request to infer a host from, so without it Next warns and falls
 * back to localhost. Each page then overrides only what is its own.
 */
export const metadata: Metadata = {
  metadataBase: new URL(shopConfig.siteUrl),
  title: `${strings.site.name} — ${strings.site.tagline}`,
  description: strings.site.description,
  openGraph: openGraph({
    title: `${strings.site.name} — ${strings.site.tagline}`,
    description: strings.site.description,
    path: routes.home,
  }),
};

/**
 * The cart provider wraps everything, because the badge it feeds lives in the
 * header while the button that fills it lives on a product page.
 *
 * Reading the seam here is the layout's one piece of data work: the provider
 * needs the catalog's slugs — just the slugs — to forget a product the shop has
 * retired. It happens at build time like every other read in the app.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const products = await catalog.listProducts();

  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a
          href="#contenido"
          className="bg-primary text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2"
        >
          {strings.header.skipToContent}
        </a>
        <CartProvider knownSlugs={products.map((product) => product.slug)}>
          <SiteHeader />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
