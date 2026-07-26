import { Container } from "@/components/container";
import { strings } from "@/lib/strings";

/**
 * Placeholder home page.
 *
 * The real composition — flagship hero, featured row, categories grid and the
 * occasion strip — is built against the catalog in a later ticket. This stands
 * in so the chrome and the theme are visible end to end.
 */
export default function HomePage() {
  return (
    <Container className="flex flex-col items-center py-28 text-center">
      <p className="eyebrow">{strings.home.eyebrow}</p>
      <h1 className="mt-4 max-w-[18ch] text-[clamp(34px,5vw,56px)] leading-[1.02]">
        {strings.home.heading}
      </h1>
      <p className="text-ink-muted mt-6 max-w-[46ch] text-[17px] leading-relaxed">
        {strings.home.body}
      </p>
    </Container>
  );
}
