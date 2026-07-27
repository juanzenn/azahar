import Link from "next/link";

import { Container } from "@/components/container";
import { catalog } from "@/lib/catalog";
import { shopConfig, whatsappChatUrl } from "@/lib/config";
import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";

/**
 * Site footer. This is where contact lives — there is deliberately no contact
 * page — alongside the accepted payment methods, which act as trust signals
 * for a shop that takes payment out-of-band.
 *
 * The Explora column links the browse surfaces; the full taxonomy runs along the
 * bottom, giving every page a way into any category. Ten links are too many for
 * a column beside the others, and a row across the foot of the page suits an
 * editorial layout better than a list that dwarfs its neighbours.
 *
 * Reads the seam at build time — the layout renders this on every prerendered
 * page, so the cost disappears into the static output.
 */
export async function SiteFooter() {
  const categories = await catalog.listCategories();

  const links = [
    { href: routes.home, label: strings.footer.home },
    { href: routes.categories, label: strings.footer.categories },
    { href: routes.search, label: strings.footer.search },
    { href: routes.about, label: strings.footer.about },
  ];

  return (
    <footer className="border-hairline bg-panel mt-auto border-t">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-serif text-[22px] font-medium tracking-[0.04em]">
              {strings.site.name}
            </p>
            <p className="text-ink-muted mt-3 max-w-[34ch] text-sm leading-relaxed">
              {strings.site.description}
            </p>
          </div>

          <div>
            <h2 className="eyebrow">{strings.footer.contactHeading}</h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href={whatsappChatUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4"
                >
                  {strings.footer.whatsappCta}
                </a>
              </li>
              <li>
                <a href={`tel:${shopConfig.phoneDisplay}`}>
                  {shopConfig.phoneDisplay}
                </a>
              </li>
              <li className="text-ink-muted">
                {strings.footer.hoursLabel}: {shopConfig.hours}
              </li>
              <li className="text-ink-muted">
                {strings.footer.locationLabel}: {shopConfig.location}
              </li>
            </ul>
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <h2 className="eyebrow">{strings.footer.exploreHeading}</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="eyebrow">{strings.footer.paymentsHeading}</h2>
              <ul className="text-ink-muted mt-4 space-y-2 text-sm">
                {strings.footer.paymentMethods.map((method) => (
                  <li key={method}>{method}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <nav
          // The taxonomy's own name, not the Explora link's label — the two are
          // the same word today and have no reason to be the same string.
          aria-label={strings.categories.title}
          className="border-hairline mt-12 border-t pt-6"
        >
          <ul className="text-ink-muted flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={routes.category(category.slug)}
                  className="hover:text-ink underline-offset-4 transition-colors hover:underline"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-ink-muted mt-7 text-xs">
          {strings.footer.rights(new Date().getFullYear())}
        </p>
      </Container>
    </footer>
  );
}
