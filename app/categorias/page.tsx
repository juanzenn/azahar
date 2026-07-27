import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { Container } from "@/components/container";
import { catalog } from "@/lib/catalog";
import { routes } from "@/lib/routes";
import { openGraph } from "@/lib/seo";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: `${strings.categories.title} — ${strings.site.name}`,
  description: strings.categories.description,
  alternates: { canonical: routes.categories },
  openGraph: openGraph({
    title: `${strings.categories.title} — ${strings.site.name}`,
    description: strings.categories.description,
    path: routes.categories,
  }),
};

/**
 * The browse path's front door: all ten categories, each with the photograph
 * and the line of copy that say what the format actually is.
 *
 * A real discovery surface rather than a signpost — the header's "Categorías"
 * is a plain link with no dropdown behind it, so this is the only place the
 * whole taxonomy is visible at once.
 */
export default async function CategoriesPage() {
  const categories = await catalog.listCategories();

  const { categories: copy } = strings;
  const trail: Crumb[] = [
    { label: strings.breadcrumbs.home, href: routes.home },
    { label: copy.title },
  ];

  return (
    <Container className="pt-7 pb-20">
      <Breadcrumbs items={trail} />

      <div className="mt-11 text-center">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 className="mt-4 text-[clamp(30px,4.4vw,46px)] leading-[1.06]">
          {copy.heading}
        </h1>
        <p className="text-ink-muted mx-auto mt-6 max-w-[56ch] text-[17px] leading-relaxed">
          {copy.intro}
        </p>
      </div>

      <div className="mt-14 grid gap-x-6 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => (
          <Link
            key={category.slug}
            href={routes.category(category.slug)}
            className="group flex flex-col"
          >
            {/* The category photographs are landscape 4:3, unlike the portrait
                product cards — a category is a place in the shop, not an item
                on a shelf, and the different crop keeps the two from reading as
                the same kind of thing. */}
            <div className="floral-ground relative aspect-[4/3] overflow-hidden">
              {category.heroImage && (
                <Image
                  src={category.heroImage}
                  alt={category.name}
                  fill
                  priority={index < 3}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-105"
                />
              )}
            </div>
            <h2 className="mt-4 font-serif text-[21px] leading-snug font-medium">
              {category.name}
            </h2>
            {category.description && (
              <p className="text-ink-muted mt-2 max-w-[38ch] text-[14px] leading-relaxed">
                {category.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </Container>
  );
}
