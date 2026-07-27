"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  addLine,
  cartCount,
  dropUnknownSlugs,
  readCart,
  removeLine,
  setLineQty,
  writeCart,
} from "@/lib/cart";
import type { Cart } from "@/lib/cart";

/**
 * The cart, held once for the whole app.
 *
 * State lives here rather than in the two surfaces that show it, because the
 * header badge and the cart page must never disagree — and because "add" happens
 * on a product page while the count renders in the layout above it.
 *
 * What a cart is worth is `lib/cart`'s; this is the React half. `localStorage`
 * is an external store in the precise sense React means, so it is read through
 * `useSyncExternalStore` rather than mirrored into state: the snapshot is stable
 * between renders, the prerendered markup gets a server snapshot that is always
 * an empty cart, and the read happens after commit instead of during render,
 * which is what would otherwise be a hydration mismatch.
 *
 * No line ever carries a price, so nothing here can go stale.
 */

type StoredCart = {
  lines: Cart;
  /**
   * False until the store has been read. The exported HTML cannot know a cart,
   * so a surface that would otherwise paint "empty" for a frame waits on this.
   */
  loaded: boolean;
};

/** One identity for "nothing read yet", so it never looks like a change. */
const UNLOADED: StoredCart = { lines: [], loaded: false };

/**
 * Module scope, which is the right scope: there is one `localStorage` per
 * browser tab, and nothing mutates this on the server — the export renders from
 * `getServerSnapshot` alone.
 */
let snapshot: StoredCart = UNLOADED;
const listeners = new Set<() => void>();

function publish(lines: Cart): void {
  snapshot = { lines, loaded: true };
  for (const listener of listeners) listener();
}

/**
 * React subscribes after the tree has committed, which is exactly when the store
 * may be touched — so the first read happens here rather than in an effect.
 *
 * Slugs the catalog no longer has are dropped on that read and the pruned cart
 * is written straight back, so a retired product stops travelling with the
 * customer instead of being filtered out of three separate renders forever.
 */
function subscribeTo(listener: () => void, known: Set<string>): () => void {
  listeners.add(listener);

  if (!snapshot.loaded) {
    const stored = readCart(window.localStorage);
    const live = dropUnknownSlugs(stored, known);
    if (live.length !== stored.length) writeCart(window.localStorage, live);
    publish(live);
  }

  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => UNLOADED;

/**
 * The one write path. Changes are computed from the store's own snapshot rather
 * than from what a render closed over, so two clicks landing before a re-render
 * cannot lose one.
 */
function update(change: (cart: Cart) => Cart): void {
  const lines = change(snapshot.lines);
  writeCart(window.localStorage, lines);
  publish(lines);
}

type CartContextValue = {
  /** The stored lines: `{ slug, qty }` and nothing else. */
  lines: Cart;
  /** Units across every line — what the header badge shows. */
  count: number;
  loaded: boolean;
  add: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used within a CartProvider");
  return cart;
}

/**
 * `knownSlugs` is the catalog's slugs, read from the seam by the layout and
 * embedded in the export — the one thing the cart needs to know about the
 * catalog without the products themselves, which would put the whole seed in
 * every page's payload.
 */
export function CartProvider({
  knownSlugs,
  children,
}: {
  knownSlugs: string[];
  children: React.ReactNode;
}) {
  const known = useMemo(() => new Set(knownSlugs), [knownSlugs]);
  const subscribe = useCallback(
    (listener: () => void) => subscribeTo(listener, known),
    [known],
  );

  const { lines, loaded } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      loaded,
      add: (slug) => update((cart) => addLine(cart, slug)),
      setQty: (slug, qty) => update((cart) => setLineQty(cart, slug, qty)),
      remove: (slug) => update((cart) => removeLine(cart, slug)),
    }),
    [lines, loaded],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
