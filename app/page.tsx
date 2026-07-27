import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/container";
import { ProductCard } from "@/components/product-card";
import { SearchForm } from "@/components/search-form";
import { SectionHeading } from "@/components/section-heading";
import { catalog, OCCASIONS } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { openGraph } from "@/lib/seo";
import { facetLabels, strings } from "@/lib/strings";

/**
 * The title and description are the layout's already — this adds the two things
 * only the home page can say: its canonical, and a share image.
 *
 * The image is the flagship's photograph, the same one the hero shows, so a link
 * pasted into WhatsApp previews with the arrangement the page opens on. It needs
 * the catalog, hence `generateMetadata` rather than a static object.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [flagship] = await catalog.listFeaturedProducts();

  return {
    alternates: { canonical: routes.home },
    openGraph: openGraph({
      title: `${strings.site.name} — ${strings.site.tagline}`,
      description: strings.site.description,
      path: routes.home,
      ...(flagship && {
        image: { url: flagship.images[0], alt: flagship.name },
      }),
    }),
  };
}

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    catalog.listFeaturedProducts(),
    catalog.listCategories(),
  ]);

  // The flagship is simply the first featured product — curated by ordering,
  // with no schema field and no sales data. It headlines the hero, so the row
  // below shows the rest rather than repeating it.
  const [flagship, ...rest] = featured;
  const categoryName = new Map(
    categories.map((category) => [category.slug, category.name]),
  );
  const { home } = strings;

  return (
    <>
      {flagship && (
        <section className="border-hairline grid border-b md:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col justify-center px-7 py-11 md:px-14 md:py-[74px]">
            <p className="eyebrow">{home.heroEyebrow}</p>
            <h1 className="mt-[18px] text-[clamp(34px,5vw,56px)] leading-[1.02] text-balance">
              {home.heroHeading}
            </h1>
            <p className="text-ink-muted mt-5 max-w-[40ch] text-[17px] leading-relaxed">
              {home.heroBody}
            </p>

            <SearchForm className="mt-7 h-[46px] w-full max-w-[420px] px-5" />

            <div className="mt-7 flex flex-wrap items-center gap-6">
              <Link
                href={routes.product(flagship.slug)}
                className="bg-primary text-primary-foreground px-[30px] py-[15px] text-sm tracking-[0.04em]"
              >
                {home.heroCta}
              </Link>
              <Link
                href={routes.search}
                className="text-sm tracking-[0.04em] underline underline-offset-4"
              >
                {home.heroSecondary}
              </Link>
            </div>
          </div>

          <div className="floral-ground relative min-h-[420px]">
            <Image
              src={flagship.images[0]}
              alt={flagship.name}
              fill
              priority
              sizes="(min-width: 768px) 55vw, 100vw"
              className="object-cover"
            />
            <p className="absolute bottom-[22px] left-[22px] bg-white/85 px-3.5 py-2 text-xs">
              <span className="font-serif font-semibold">{flagship.name}</span>{" "}
              · {formatPrice(flagship.priceUsdCents)}
            </p>
          </div>
        </section>
      )}

      <section className="py-[68px]">
        <Container>
          <SectionHeading eyebrow={home.featuredEyebrow}>
            {home.featuredHeading}
          </SectionHeading>
          <div className="grid grid-cols-2 gap-x-6 gap-y-[30px] md:grid-cols-3">
            {rest.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                categoryName={categoryName.get(product.categorySlug) ?? ""}
              />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-[68px]">
        <Container>
          <SectionHeading eyebrow={home.categoriesEyebrow}>
            {home.categoriesHeading}
          </SectionHeading>
          {/* Hairline cell grid: the 1px gap lets the container's background
              show through, so the rules never double up at the seams. */}
          <div className="bg-hairline border-hairline grid grid-cols-2 gap-px border md:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={routes.category(category.slug)}
                className="bg-ground hover:bg-panel px-4 py-[30px] text-center transition-colors"
              >
                <span className="font-serif text-[15px]">{category.name}</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-primary">
        <Container className="py-[68px]">
          <SectionHeading eyebrow={home.occasionEyebrow} tone="onEmerald">
            {home.occasionHeading}
          </SectionHeading>
          <div className="flex flex-wrap justify-center gap-3.5">
            {OCCASIONS.map((occasion) => (
              <Link
                key={occasion}
                href={routes.searchByOccasion(occasion)}
                className="text-primary-foreground rounded-full border border-white/35 px-[22px] py-2.5 text-sm"
              >
                {facetLabels.occasion[occasion]}
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
