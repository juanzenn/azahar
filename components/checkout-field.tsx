"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import type { CheckoutIssue } from "@/lib/order";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

/**
 * One field of the checkout form: its label, its control, its hint and its
 * complaint.
 *
 * Two rules are enforced here rather than repeated at sixteen call sites.
 *
 * **A label says whether the shop needs the answer** — an asterisk when it does,
 * "(opcional)" when it doesn't — and it says so from the first paint, before
 * anything has been submitted. That marking is not decoration: the same
 * `required` flag the shop's rules produced is what draws it and what sets
 * `aria-required`, so what a sighted customer reads and what a screen reader
 * announces cannot drift apart.
 *
 * **A field complains only about itself, and only once the customer has left
 * it.** Blur is tracked per field rather than centrally, because "have they
 * finished with this box" is nobody else's business — and a form that reddens
 * every empty box the moment it loads is telling the customer off for arriving.
 *
 * Native `required` is deliberately absent: validation is `lib/order`'s, and the
 * browser's own bubbles would say something different in a language this app has
 * not chosen.
 */

const copy = strings.checkout;

/** Squared and hairline-bordered, as the Jardín direction has it. */
const CONTROL =
  "border-hairline-strong focus:border-ink aria-invalid:border-destructive w-full border bg-white px-3.5 py-2.5 text-[14px] outline-none";

/** What `Field` hands its control: identity, styling and the wiring below. */
type ControlProps = {
  id: string;
  className: string;
  onBlur: () => void;
  "aria-required"?: true;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

type ShellProps = {
  label: string;
  /** Under the control: what to type, or why the shop is asking. */
  hint?: string;
  /** Right of the hint — a character count, and nothing longer. */
  note?: string;
  required?: boolean;
  /** What is wrong, if anything. Shown only after the field has been left. */
  issue?: CheckoutIssue;
};

type ValueProps = {
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * The mark that says the shop needs an answer.
 *
 * Drawn here and nowhere else, so the one control that cannot go through `Field`
 * — the delivery-method radio group, which is a group rather than a field —
 * still carries the same mark as its sixteen neighbours. `aria-hidden` because
 * an asterisk read aloud is a punctuation mark; `aria-required` on the control is
 * what actually announces it.
 */
export function RequiredMark() {
  return (
    <span aria-hidden className="text-plum">
      {" "}
      {copy.requiredMark}
    </span>
  );
}

/**
 * The shell. `children` is a function so the wiring — the id the label points
 * at, the described-by chain, the invalid flag — reaches whatever control the
 * caller renders without the caller assembling any of it.
 */
function Field({
  label,
  hint,
  note,
  required = false,
  issue,
  children,
}: ShellProps & { children: (control: ControlProps) => React.ReactNode }) {
  const id = useId();
  const [blurred, setBlurred] = useState(false);

  const shown = blurred ? issue : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const issueId = shown ? `${id}-issue` : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-[13px]">
        {label}
        {required ? (
          <RequiredMark />
        ) : (
          <span className="text-ink-muted"> {copy.optional}</span>
        )}
      </label>

      <div className="mt-2">
        {children({
          id,
          className: CONTROL,
          onBlur: () => setBlurred(true),
          "aria-required": required || undefined,
          "aria-invalid": shown ? true : undefined,
          "aria-describedby":
            [hintId, issueId].filter(Boolean).join(" ") || undefined,
        })}
      </div>

      {(hint || note) && (
        <div className="text-ink-muted mt-1.5 flex justify-between gap-4 text-[12px] leading-relaxed">
          {hint && <p id={hintId}>{hint}</p>}
          {note && <p className="ml-auto shrink-0 tabular-nums">{note}</p>}
        </div>
      )}

      {shown && (
        <p id={issueId} className="text-destructive mt-1.5 text-[12px]">
          {copy.errors[shown]}
        </p>
      )}
    </div>
  );
}

export function TextField({
  value,
  onValueChange,
  ...props
}: ShellProps &
  ValueProps &
  Pick<
    React.ComponentProps<"input">,
    "type" | "autoComplete" | "inputMode" | "min" | "maxLength"
  >) {
  const { type, autoComplete, inputMode, min, maxLength, ...shell } = props;

  return (
    <Field {...shell}>
      {(control) => (
        <input
          {...control}
          type={type ?? "text"}
          autoComplete={autoComplete}
          inputMode={inputMode}
          min={min}
          maxLength={maxLength}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        />
      )}
    </Field>
  );
}

export function TextAreaField({
  value,
  onValueChange,
  rows = 3,
  maxLength,
  ...shell
}: ShellProps & ValueProps & { rows?: number; maxLength?: number }) {
  return (
    <Field {...shell}>
      {(control) => (
        <textarea
          {...control}
          className={cn(control.className, "resize-y leading-relaxed")}
          rows={rows}
          maxLength={maxLength}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        />
      )}
    </Field>
  );
}

/**
 * A native `select`, not the popup one the sort control uses: on a phone this is
 * the platform's own picker, and a form field associated with a real `<label>`
 * needs no ARIA to be announced correctly.
 */
export function SelectField({
  value,
  onValueChange,
  children,
  ...shell
}: ShellProps & ValueProps & { children: React.ReactNode }) {
  return (
    <Field {...shell}>
      {(control) => (
        <div className="relative">
          <select
            {...control}
            className={cn(control.className, "appearance-none pr-10")}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
          >
            {children}
          </select>
          <ChevronDown
            aria-hidden
            className="text-ink-muted pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2"
          />
        </div>
      )}
    </Field>
  );
}
