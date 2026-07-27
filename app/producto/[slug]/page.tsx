import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { AddToCart } from "@/components/add-to-cart";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { Container } from "@/components/container";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { catalog, relatedProducts } from "@/lib/catalog";
import { shopConfig } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { openGraph, productJsonLd } from "@/lib/seo";
import { strings } from "@/lib/strings";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Every product gets its own file in the static export, so every arrangement
 * has a URL that can be sent to someone.
 */
export async function generateStaticParams() {
  const products = await catalog.listProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await catalog.getProductBySlug(slug);

  // Unreachable in the static export — metadata only runs for the slugs
  // `generateStaticParams` returned — but the seam's contract allows `null`,
  // so falling back to the layout's own title keeps the types honest.
  if (!product) return {};

  const title = `${product.name} — ${strings.site.name}`;
  const description = product.tagline ?? product.description;

  return {
    title,
    description,
    alternates: { canonical: routes.product(product.slug) },
    // The arrangement's own photograph is the share image. There is no server to
    // compose one at request time, and a real photo of the thing being sold beats
    // anything generated: portrait, which the platforms crop, but never wrong.
    openGraph: openGraph({
      title,
      description,
      path: routes.product(product.slug),
      image: { url: product.images[0], alt: product.name },
    }),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await catalog.getProductBySlug(slug);

  // A slug the catalog does not have is a missing page, not a failure: the
  // seam answers `null` and this turns it into the Spanish 404.
  if (!product) notFound();

  const [category, inCategory] = await Promise.all([
    catalog.getCategoryBySlug(product.categorySlug),
    catalog.listProductsByCategory(product.categorySlug),
  ]);

  // The category names the product three times over — eyebrow, breadcrumb and
  // the related row — so a product pointing at one the catalog does not have
  // has no coherent page to render. The seed test makes that unreachable; 404
  // is still a better answer than leaking an ASCII slug into the copy.
  if (!category) notFound();

  const related = relatedProducts(inCategory, product);

  const trail: Crumb[] = [
    { label: strings.breadcrumbs.home, href: routes.home },
    { label: category.name, href: routes.category(product.categorySlug) },
    { label: product.name },
  ];

  return (
    <>
      {/* Structured data for the search result: name, photograph, price. Built by
          `lib/seo`, which decides among other things not to claim availability —
          the shop has no stock model to claim it from. Rendered as a script tag
          rather than through `metadata`, which has no field for it. */}
      <script
        type="application/ld+json"
        // The content is the seed's own copy serialised by `JSON.stringify`, not
        // anything a visitor can reach: there is no input on this page.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(product, shopConfig.siteUrl)),
        }}
      />

      <Container className="pt-7 pb-16 md:pb-24">
        <Breadcrumbs items={trail} />

        {/* Photography-forward split, per the locked direction: the photograph
            takes the larger column and leads the mobile stack, because it is
            what the customer is actually judging. */}
        <div className="mt-8 grid items-start gap-9 md:mt-11 md:grid-cols-[1.1fr_1fr] md:gap-14">
          {/* Portrait tile at the source photographs' own 3:4, so the
              arrangement is never cropped at any width. The floral ground
              shows through while the image loads. */}
          <div className="floral-ground relative aspect-[3/4] w-full overflow-hidden">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 1160px) 550px, (min-width: 768px) 52vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="md:pt-3">
            <p className="eyebrow">{category.name}</p>
            <h1 className="mt-3.5 text-[clamp(30px,4vw,42px)] leading-[1.05] text-balance">
              {product.name}
            </h1>
            <p className="text-primary mt-4 text-[24px] tracking-[0.02em]">
              {formatPrice(product.priceUsdCents)}
            </p>
            <hr className="border-hairline mt-7" />
            <p className="text-ink-muted mt-7 max-w-[52ch] text-[16px] leading-[1.7]">
              {product.description}
            </p>

            <AddToCart slug={product.slug} />
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <section className="border-hairline border-t py-[68px]">
          <Container>
            <SectionHeading eyebrow={strings.product.relatedEyebrow}>
              {strings.product.relatedHeading}
            </SectionHeading>
            <div className="grid grid-cols-2 gap-x-6 gap-y-[30px] md:grid-cols-4">
              {related.map((item) => (
                <ProductCard
                  key={item.slug}
                  product={item}
                  categoryName={category.name}
                />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
