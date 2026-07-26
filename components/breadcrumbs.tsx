import Link from "next/link";

import { strings } from "@/lib/strings";

/**
 * One step in a breadcrumb trail. The last step is the page you are on, so it
 * carries no `href`.
 */
export type Crumb = {
  label: string;
  href?: string;
};

/**
 * The trail back up the hierarchy — `Inicio / Ramos / Ramo Amor Rojo`.
 *
 * The trail itself is the caller's to compose: only the page knows what it
 * descends from. This owns the markup and the semantics, so every trail in the
 * app is the same discreet line and announces itself the same way.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label={strings.breadcrumbs.label}>
      <ol className="text-ink-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] tracking-[0.02em]">
        {items.map((item, index) => (
          // Position is the identity here: a trail is fixed at render and two
          // steps can legitimately share a label.
          <li key={index} className="flex items-center gap-x-2">
            {index > 0 && (
              <span aria-hidden="true" className="text-hairline-strong">
                /
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-ink underline-offset-4 transition-colors hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
