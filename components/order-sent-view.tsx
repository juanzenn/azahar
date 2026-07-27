"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { useCart } from "@/components/cart-provider";
import { CopyButton } from "@/components/copy-button";
import { OrderRecord } from "@/components/order-record";
import {
  orderSections,
  orderToWhatsAppUrl,
  readStashedOrder,
} from "@/lib/order";
import type { Order } from "@/lib/order";
import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";

const copy = strings.orderSent;

/**
 * The stashed order, held as the external store it is.
 *
 * `sessionStorage` is an external store in the precise sense React means, so it is
 * read through `useSyncExternalStore` exactly as the cart reads `localStorage`:
 * the prerendered markup gets a snapshot that cannot know an order, and the store
 * is touched after commit rather than during render. Copying it into state from an
 * effect would be the same read with a cascading render in the middle.
 *
 * `undefined` is "not read yet" and `null` is "there was nothing" — two answers
 * the page treats very differently, one being a frame to wait out and the other a
 * customer to send home.
 */
let stashed: Order | null | undefined;

function subscribeToStash(listener: () => void): () => void {
  stashed = readStashedOrder(window.sessionStorage);
  listener();

  // Forgotten on the way out, so a second order placed in the same tab cannot
  // paint the first one's code for a frame on its way in.
  return () => {
    stashed = undefined;
  };
}

const getStash = () => stashed;
const getServerStash = () => undefined;

/**
 * The order this tab has already emptied its cart for.
 *
 * Emptying it is a one-off, not a property of being on this page: a customer who
 * carried on shopping and then pressed Back twice would otherwise find the new
 * cart wiped by an order that was already sent.
 */
let clearedFor: string | undefined;

/**
 * The confirmation page — which is really the *dispatch* page, and says so.
 *
 * Nothing has reached the shop yet. The order was written into a WhatsApp message
 * and a new tab was opened with it; whether that tab appeared, and whether the
 * customer pressed send in it, this page cannot know. So it is built around the
 * one thing still to happen — a button carrying the same deep-link, re-openable
 * as many times as it takes — and the copy never claims an order was received.
 *
 * **The cart is emptied on arrival, and the stash is not.** The cart has done its
 * job the moment the message exists, and a reload that could re-add it is how a
 * customer orders twice; the stash is what makes the reload work at all, and it
 * dies with the tab on its own.
 *
 * The order arrives through `sessionStorage` rather than as props because this is
 * a fresh page load of a statically exported page — there is no server to have
 * been told anything, which is the same reason nothing persists past this tab.
 */
export function OrderSentView({
  whatsappNumber,
  phoneDisplay,
}: {
  /** For the deep-link; digits-only shaping is the order module's. */
  whatsappNumber: string;
  /** The same number as a human reads it, for the fallback. */
  phoneDisplay: string;
}) {
  const router = useRouter();
  const { clear } = useCart();
  const order = useSyncExternalStore(
    subscribeToStash,
    getStash,
    getServerStash,
  );

  useEffect(() => {
    // The frame before the store has been touched. Nothing to decide yet.
    if (order === undefined) return;

    // Nothing stashed is a typed URL, a new tab, or a session that has ended.
    // `replace`, because this page was never a place they chose to be.
    if (order === null) {
      router.replace(routes.home);
      return;
    }

    if (clearedFor !== order.code) {
      clearedFor = order.code;
      clear();
    }
  }, [order, clear, router]);

  // The frame before the store is read, and every frame of a visit that is about
  // to be redirected. Saying nothing beats a receipt with no order on it.
  if (!order) return <div className="min-h-[46vh]" />;

  const chatUrl = orderToWhatsAppUrl(order, { whatsappNumber });

  return (
    <div className="mt-9 grid items-start gap-11 lg:grid-cols-[1fr_360px] lg:gap-16">
      <div className="grid gap-8">
        <div className="border-hairline bg-panel border p-7">
          <p className="eyebrow">{copy.codeLabel}</p>
          <p className="text-plum mt-2 font-serif text-[34px] tracking-[0.06em] tabular-nums">
            {order.code}
          </p>
          <p className="text-ink-muted mt-1 text-[12px] leading-relaxed">
            {copy.codeNote}
          </p>
        </div>

        <div>
          {/* A link rather than a button: this is a navigation, it survives a
              right-click, and it can be pressed again for as long as the page is
              open — which is the whole point of the page. */}
          <a
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground block w-full px-9 py-4 text-center text-sm tracking-[0.04em]"
          >
            {copy.whatsappCta}
          </a>
          <p className="text-ink-muted mt-3 text-center text-[12px] leading-relaxed">
            {copy.sendNote}
          </p>

          {/* Beside the button, not further down the page: WhatsApp can be
              missing, blocked, or simply have failed to open, and the customer
              finds that out here. A number they have to scroll for is a number
              they don't find. */}
          <div className="border-hairline mt-6 border p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-ink-muted text-[11px] tracking-[0.14em] uppercase">
                  {copy.numberLabel}
                </p>
                <p className="mt-1 text-[16px] break-all tabular-nums">
                  {phoneDisplay}
                </p>
              </div>
              <CopyButton label={copy.numberLabel} value={phoneDisplay} />
            </div>
            <p className="text-ink-muted border-hairline mt-4 border-t pt-3 text-[12px] leading-relaxed">
              <span className="text-ink">{copy.fallbackHeading}</span>{" "}
              {copy.fallbackBody}
            </p>
          </div>
        </div>

        {/* The screenshot a deep-link cannot carry. Said again here because this
            is the last screen before the chat, and the chat is where it goes. */}
        <p className="border-hairline bg-panel text-ink-muted border p-5 text-[13px] leading-relaxed">
          {copy.receiptNote}
        </p>

        <div>
          <Link
            href={routes.search}
            className="text-[13px] underline underline-offset-4"
          >
            {copy.keepShopping}
          </Link>
        </div>
      </div>

      {/* The record, in the same blocks the message is written in. Second on a
          phone: what the customer needs first is the button. */}
      <aside className="border-hairline bg-panel border p-7">
        <h2 className="font-serif text-[18px]">{copy.recordHeading}</h2>
        <div className="mt-6">
          <OrderRecord sections={orderSections(order)} />
        </div>
      </aside>
    </div>
  );
}
