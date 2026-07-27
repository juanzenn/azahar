import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";
import { whatsappChatUrl } from "@/lib/config";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { strings } from "@/lib/strings";

export const metadata: Metadata = pageMetadata({
  title: `${strings.about.title} — ${strings.site.name}`,
  description: strings.about.intro,
  path: routes.about,
});

export default function AboutPage() {
  const { about } = strings;

  return (
    <>
      <Container className="py-20 text-center">
        <p className="eyebrow">{about.eyebrow}</p>
        <h1 className="mx-auto mt-4 max-w-[20ch] text-[clamp(30px,4.4vw,46px)] leading-[1.06]">
          {about.heading}
        </h1>
        <p className="text-ink-muted mx-auto mt-7 max-w-[58ch] text-[17px] leading-relaxed">
          {about.intro}
        </p>
      </Container>

      <Container>
        <div className="border-hairline grid gap-px border-y sm:grid-cols-3">
          {about.paragraphs.map((section) => (
            <section
              key={section.heading}
              className="py-12 sm:px-8 sm:first:pl-0 sm:last:pr-0"
            >
              <h2 className="font-serif text-[20px] leading-snug font-medium">
                {section.heading}
              </h2>
              <p className="text-ink-muted mt-4 text-[15px] leading-relaxed">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </Container>

      <Container className="py-20 text-center">
        <h2 className="font-serif text-[clamp(24px,3vw,32px)] font-medium">
          {about.ctaHeading}
        </h2>
        <p className="text-ink-muted mx-auto mt-4 max-w-[52ch] text-[16px] leading-relaxed">
          {about.ctaBody}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href={whatsappChatUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground px-8 py-4 text-sm tracking-[0.04em]"
          >
            {about.ctaButton}
          </a>
          <Link
            href={routes.search}
            className="text-sm tracking-[0.04em] underline underline-offset-4"
          >
            {about.ctaSecondary}
          </Link>
        </div>
      </Container>
    </>
  );
}
