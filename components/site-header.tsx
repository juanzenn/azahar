import Link from "next/link";

import { CartLink } from "@/components/cart-link";
import { Container } from "@/components/container";
import { SearchBar } from "@/components/search-bar";
import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";

/**
 * Sticky site header: wordmark, the persistent search bar, a plain link to the
 * categories index (deliberately not a dropdown — the categories grid on the
 * home page carries that weight), and the cart.
 */
export function SiteHeader() {
  return (
    <header className="border-hairline sticky top-0 z-20 border-b bg-[rgba(250,248,243,0.9)] backdrop-blur-md">
      <Container>
        <div className="relative flex h-[74px] items-center gap-[22px]">
          <Link href={routes.home} className="shrink-0 leading-none">
            <span className="font-serif text-[26px] font-medium tracking-[0.04em]">
              {strings.site.name}
            </span>
            <span className="text-ink-muted -mt-0.5 block font-sans text-[9px] tracking-[0.34em] uppercase">
              {strings.site.tagline}
            </span>
          </Link>

          <SearchBar />

          <Link
            href={routes.categories}
            className="hidden shrink-0 text-sm tracking-[0.02em] md:block"
          >
            {strings.header.categories}
          </Link>

          <CartLink />
        </div>
      </Container>
    </header>
  );
}
