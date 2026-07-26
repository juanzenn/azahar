import Link from "next/link";

import { Container } from "@/components/container";
import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";

/**
 * Spanish 404. Reached both by unknown URLs and by pages calling `notFound()`
 * for a slug the catalog does not have.
 */
export default function NotFound() {
  const { notFound } = strings;

  return (
    <Container className="flex flex-col items-center py-28 text-center">
      <p className="eyebrow">{notFound.eyebrow}</p>
      <h1 className="mt-4 max-w-[18ch] text-[clamp(30px,4.4vw,46px)] leading-[1.06]">
        {notFound.heading}
      </h1>
      <p className="text-ink-muted mt-6 max-w-[48ch] text-[17px] leading-relaxed">
        {notFound.body}
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Link
          href={routes.home}
          className="bg-primary text-primary-foreground px-8 py-4 text-sm tracking-[0.04em]"
        >
          {notFound.home}
        </Link>
        <Link
          href={routes.search}
          className="text-sm tracking-[0.04em] underline underline-offset-4"
        >
          {notFound.search}
        </Link>
      </div>
    </Container>
  );
}
