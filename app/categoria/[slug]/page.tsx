import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { Container } from "@/components/container";
import { ResultsSurface } from "@/components/results-surface";
import { catalog } from "@/lib/catalog";
import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

/** All ten categories get their own file in the static export. */
export async function generateStaticParams() {
  const categories = await catalog.listCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await catalog.getCategoryBySlug(slug);

  // Unreachable in the static export — metadata only runs for the slugs
  // `generateStaticParams` returned — but the seam's contract allows `null`, so
  // falling back to the layout's own title keeps the types honest.
  if (!category) return {};

  return {
    title: `${category.name} — ${strings.site.name}`,
    description: category.description ?? strings.site.description,
  };
}

/**
 * A category: its own hero, and the very same results surface global search
 * uses — already scoped to this category, with no way to filter out of it.
 *
 * This is the payoff on the keystone decision. Nothing about filtering is built
 * twice: the surface is handed this category's products and told what it is
 * looking at, and everything that follows — facets, counts, chips, sort, paging,
 * the URL contract — is the behaviour `/buscar` already has.
 *
 * What the scope changes is deliberately small: no Categoría group, no chip for
 * the category, and every URL written lands back on this path.
 */
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [category, products, categories, featured] = await Promise.all([
    catalog.getCategoryBySlug(slug),
    catalog.listProductsByCategory(slug),
    catalog.listCategories(),
    catalog.listFeaturedProducts(),
  ]);

  // A slug the catalog does not have is a missing page, not a failure.
  if (!category) notFound();

  const trail: Crumb[] = [
    { label: strings.breadcrumbs.home, href: routes.home },
    { label: strings.categories.title, href: routes.categories },
    { label: category.name },
  ];

  return (
    <Container className="pt-7 pb-20">
      <Breadcrumbs items={trail} />

      {/* The hero is the whole reason this is a page and not a `?cat=` link:
          the category gets its name in serif and its own line of copy, so it
          reads as a place in the shop rather than as a search someone ran.
          Sized like a product's h1, the other page that is a thing in the shop
          rather than an editorial one. */}
      <div className="mt-9 max-w-[54ch]">
        <h1 className="font-serif text-[clamp(30px,4vw,42px)] leading-[1.06] font-medium">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-ink-muted mt-4 text-[17px] leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      <div className="mt-11">
        <ResultsSurface
          products={products}
          categories={categories}
          // The curated featured row, exactly as global search shows it: a
          // customer who has filtered themselves down to nothing is owed the
          // shop's best guess, not four arbitrary items from the same seed order
          // they just filtered through.
          suggestions={featured}
          scope={{ kind: "category", category }}
        />
      </div>
    </Container>
  );
}
