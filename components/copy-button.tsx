"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const copy = strings.copyButton;

/** Long enough to notice, short enough that copying again reads as new news. */
const CONFIRMATION_MS = 2000;

/**
 * Copies one value, and says so.
 *
 * The reason this exists is a twenty-digit account number being read off one
 * phone and typed into a banking app on the same phone: every one of those
 * digits is a chance to send the shop's money somewhere else, and a customer who
 * mistypes one does not find out until the payment is refused.
 *
 * **Named after what it copies.** An account block is a column of otherwise
 * identical buttons, so the accessible name carries the label of the row it
 * belongs to — "Copiar número de cuenta", not the fifth "copiar" on the page.
 *
 * **A clipboard that isn't there is not an error.** Insecure origins, older
 * browsers and a refused permission all land in the same place, and the value is
 * on screen and selectable regardless — so the failure is silent rather than an
 * alarm about a convenience.
 */
export function CopyButton({
  label,
  value,
}: {
  /** What this value is, for the accessible name. */
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  const hide = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Nothing should be left ticking for a page the customer has left.
  useEffect(() => () => clearTimeout(hide.current), []);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }

    setCopied(true);
    clearTimeout(hide.current);
    hide.current = setTimeout(() => setCopied(false), CONFIRMATION_MS);
  }

  const Icon = copied ? Check : Copy;

  return (
    <span className="flex shrink-0 items-center gap-2">
      {/* Announced rather than merely drawn: the tick is a colour change, and
          the customer's eyes are on their banking app. */}
      <span role="status" className="text-primary text-[11px]">
        {copied ? copy.copied : ""}
      </span>

      <button
        type="button"
        onClick={copyValue}
        aria-label={copy.action(label)}
        className="border-hairline-strong hover:bg-panel cursor-pointer border p-2"
      >
        <Icon
          aria-hidden
          className={cn("size-4", copied ? "text-primary" : "text-ink-muted")}
        />
      </button>
    </span>
  );
}
