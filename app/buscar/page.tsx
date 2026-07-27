import type { Metadata } from "next";

import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { Container } from "@/components/container";
import { ResultsSurface } from "@/components/results-surface";
import { catalog } from "@/lib/catalog";
import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: `${strings.search.title} — ${strings.site.name}`,
  description: strings.search.description,
};

/**
 * Global search — and, with no params, the whole catalog paginated, which is
 * what every "Ver todo" link points at.
 *
 * The catalog is read here, at build time, and handed to the surface as props:
 * under static export there is no runtime server to ask, so the products travel
 * inside the prerendered page. The island never touches the seam.
 */
export default async function SearchPage() {
  const [products, categories, featured] = await Promise.all([
    catalog.listProducts(),
    catalog.listCategories(),
    catalog.listFeaturedProducts(),
  ]);

  const trail: Crumb[] = [
    { label: strings.breadcrumbs.home, href: routes.home },
    { label: strings.search.title },
  ];

  return (
    <Container className="pt-7 pb-20">
      <Breadcrumbs items={trail} />

      <div className="mt-7">
        <ResultsSurface
          products={products}
          categories={categories}
          suggestions={featured}
          scope={{ kind: "search" }}
        />
      </div>
    </Container>
  );
}
