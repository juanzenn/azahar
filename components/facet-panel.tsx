import { ChevronDown } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Colour } from "@/lib/catalog";
import type { FacetGroupView, FacetValueChoice } from "@/lib/facets";
import type { Criteria } from "@/lib/search";
import { cn } from "@/lib/utils";

/**
 * The filter sidebar, and the identical list the mobile sheet shows.
 *
 * Every group renders the same way because `lib/facets` already decided what a
 * group is: its heading, its rows, their counts, which are selected, and the
 * criteria each one produces. Nothing here knows what a colour or an occasion
 * is — the only per-facet detail left is the swatch.
 *
 * Rendered inside the results island, whose client boundary it inherits.
 */
export function FacetPanel({
  groups,
  onChoose,
  collapsible = false,
  className,
}: {
  groups: FacetGroupView[];
  onChoose: (criteria: Criteria) => void;
  /**
   * The mobile sheet collapses each group so all six fit on a phone; the
   * desktop sidebar shows every group open.
   */
  collapsible?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {groups.map((group) => (
        <Group
          key={group.key}
          group={group}
          onChoose={onChoose}
          collapsible={collapsible}
        />
      ))}
    </div>
  );
}

/** The clear row's value inside a radio group; no facet value is empty. */
const ANY = "";

/**
 * Circular swatches for the colour group, so the list reads as colours rather
 * than as words. The values themselves live in `globals.css` with the rest of
 * the theme; this maps each vocabulary value to its token, and is typed as a
 * complete record so a new colour without a swatch cannot compile.
 */
const SWATCHES: Record<string, string> = {
  rojo: "var(--swatch-rojo)",
  rosado: "var(--swatch-rosado)",
  blanco: "var(--swatch-blanco)",
  amarillo: "var(--swatch-amarillo)",
  naranja: "var(--swatch-naranja)",
  morado: "var(--swatch-morado)",
  azul: "var(--swatch-azul)",
  multicolor: "var(--swatch-multicolor)",
} satisfies Record<Colour, string>;

function Group({
  group,
  onChoose,
  collapsible,
}: {
  group: FacetGroupView;
  onChoose: (criteria: Criteria) => void;
  collapsible: boolean;
}) {
  const rows = <Rows group={group} onChoose={onChoose} />;

  if (!collapsible) {
    return (
      <div className="border-hairline border-b py-[18px] first:pt-0 last:border-b-0">
        <h3 className="mb-3 font-serif text-[16px] font-medium">
          {group.heading}
        </h3>
        {rows}
      </div>
    );
  }

  return (
    <details className="border-hairline group border-b">
      <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 font-serif text-[16px] font-medium">
        {group.heading}
        <ChevronDown
          aria-hidden
          className="text-ink-muted size-4 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="pb-3.5">{rows}</div>
    </details>
  );
}

function Rows({
  group,
  onChoose,
}: {
  group: FacetGroupView;
  onChoose: (criteria: Criteria) => void;
}) {
  const { anyChoice } = group;

  // Multi-select: each row is an independent checkbox, and unticking one is how
  // the group clears — so there is no clear row.
  if (!anyChoice) {
    return (
      <div role="group" aria-label={group.heading}>
        {group.values.map((value) => (
          <Row key={value.value} value={value} swatch={group.swatches}>
            <Checkbox
              checked={value.selected}
              disabled={value.disabled}
              onCheckedChange={() => onChoose(value.next)}
            />
          </Row>
        ))}
      </div>
    );
  }

  // Single-select: the radio group owns "exactly one of these", and clearing is
  // an explicit row rather than clicking the selected value again.
  return (
    <RadioGroup
      aria-label={group.heading}
      className="gap-0"
      value={group.values.find((value) => value.selected)?.value ?? ANY}
      onValueChange={(value: string) => {
        const choice =
          value === ANY
            ? anyChoice
            : group.values.find((candidate) => candidate.value === value);
        if (choice) onChoose(choice.next);
      }}
    >
      <label className="text-plum flex cursor-pointer items-center gap-2.5 py-[5px] text-[12px]">
        <RadioGroupItem value={ANY} />
        {anyChoice.label}
      </label>

      {group.values.map((value) => (
        <Row key={value.value} value={value} swatch={group.swatches}>
          <RadioGroupItem value={value.value} disabled={value.disabled} />
        </Row>
      ))}
    </RadioGroup>
  );
}

/**
 * One value: its control, an optional swatch, its label, and its live count
 * right-aligned. A count of zero means nothing could match, so the row is
 * visibly out of play — the control itself is what refuses the click.
 */
function Row({
  value,
  swatch,
  children,
}: {
  value: FacetValueChoice;
  swatch: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2.5 py-[5px] text-[13px]",
        value.disabled ? "text-ink-muted/55" : "cursor-pointer",
      )}
    >
      {children}
      {swatch && (
        <span
          aria-hidden
          style={{ background: SWATCHES[value.value] }}
          className={cn(
            "size-3.5 shrink-0 rounded-full border border-black/10",
            value.value === "blanco" && "ring-hairline-strong ring-1",
          )}
        />
      )}
      {value.label}
      <span className="text-ink-muted ml-auto text-[12px] tabular-nums">
        {value.count}
      </span>
    </label>
  );
}
