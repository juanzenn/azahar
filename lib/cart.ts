import type { Product } from "@/lib/catalog/types";

/**
 * The cart: line operations, resolution against the catalog, and the store the
 * whole thing survives in.
 *
 * **A line holds nothing but `{ slug, qty }`.** Names, images and prices are
 * looked up at render through `resolveCart`, which is what makes a stale price
 * structurally impossible rather than something the shop has to remember to
 * invalidate — a cart saved last month quotes today's catalog or it quotes
 * nothing at all.
 *
 * Two rules follow from the same idea and are enforced here rather than at the
 * call sites: a slug appears at most once (adding again increments), and a slug
 * the catalog no longer has simply disappears. Both are applied at the doors —
 * on read from the store and on resolution — so no surface can be handed a cart
 * that breaks them.
 *
 * Pure, like the search module: no React, no DOM. The persistence adapter takes
 * the store as an argument for the same reason, which is also what lets its
 * failure modes be set up as what they really are — bytes already in the store.
 */

export type CartLine = {
  slug: string;
  /** Always a whole number between 1 and `MAX_LINE_QTY`. */
  qty: number;
};

export type Cart = CartLine[];

/**
 * A sanity ceiling on one line, not a stock limit — there is no stock. Nothing
 * in the shop's rules caps an order; this exists because the quantity is
 * untrusted input (a held-down stepper, a hand-edited store) and a line of
 * 10^9 renders a total no layout survives.
 */
export const MAX_LINE_QTY = 99;

/** Quantities arrive from steppers, URLs and old stores; none of them are trusted. */
function clampQty(qty: number): number {
  return Math.min(Math.max(Math.trunc(qty), 1), MAX_LINE_QTY);
}

/**
 * Add one of a product, or one more of it. Never a second line for the same
 * slug — the cart page would show the same arrangement twice, each with its own
 * stepper, and neither would be wrong.
 */
export function addLine(cart: Cart, slug: string, qty = 1): Cart {
  if (!cart.some((line) => line.slug === slug)) {
    return [...cart, { slug, qty: clampQty(qty) }];
  }

  return cart.map((line) =>
    line.slug === slug ? { slug, qty: clampQty(line.qty + qty) } : line,
  );
}

/**
 * Set a line's quantity. Clamped rather than allowed to reach zero: removal is
 * `removeLine`, so nothing disappears from under a customer who was aiming for
 * "one".
 */
export function setLineQty(cart: Cart, slug: string, qty: number): Cart {
  return cart.map((line) =>
    line.slug === slug ? { slug, qty: clampQty(qty) } : line,
  );
}

export function removeLine(cart: Cart, slug: string): Cart {
  return cart.filter((line) => line.slug !== slug);
}

/** Units, not lines — two of one ramo is a badge showing 2. */
export function cartCount(cart: Cart): number {
  return cart.reduce((total, line) => total + line.qty, 0);
}

/**
 * Forget the lines the catalog no longer has.
 *
 * Applied once when the store is read, which is what keeps the badge, the cart
 * page and checkout agreeing about how many items there are: the retired
 * product is gone from the state they all share rather than filtered out of
 * three renders independently.
 */
export function dropUnknownSlugs(
  cart: Cart,
  knownSlugs: Iterable<string>,
): Cart {
  const known = new Set(knownSlugs);
  return cart.filter((line) => known.has(line.slug));
}

export type CartItem = {
  product: Product;
  qty: number;
  lineTotalCents: number;
};

export type ResolvedCart = {
  /** In cart order, with any unresolvable line left out. */
  items: CartItem[];
  /** Goods only — delivery is checkout's to add. */
  subtotalCents: number;
};

/**
 * Turn stored lines into something renderable, against the catalog the page was
 * built with.
 *
 * `products` is passed in rather than fetched, exactly as the search module
 * takes its catalog: under static export the page embeds it, and this stays a
 * pure function of what it is handed.
 */
export function resolveCart(cart: Cart, products: Product[]): ResolvedCart {
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const items = cart.flatMap<CartItem>((line) => {
    const product = bySlug.get(line.slug);
    if (!product) return [];

    return [
      {
        product,
        qty: line.qty,
        lineTotalCents: product.priceUsdCents * line.qty,
      },
    ];
  });

  return {
    items,
    subtotalCents: items.reduce(
      (total, item) => total + item.lineTotalCents,
      0,
    ),
  };
}

/** Namespaced, so the shop can share an origin without colliding. */
export const CART_STORAGE_KEY = "azahar.cart";

/**
 * As much of `Storage` as the cart uses. Structural, so `localStorage` and a
 * three-line fake both satisfy it.
 */
export type CartStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * Anything in the store is untrusted input: it can be hand-edited, half-written
 * by a killed tab, or shaped by a version of this app that no longer exists. A
 * line survives only if it is still recognisable, and a line's extra fields —
 * a price some past build cached, say — are dropped on the floor.
 */
function asLine(value: unknown): CartLine | null {
  if (typeof value !== "object" || value === null) return null;

  const { slug, qty } = value as { slug?: unknown; qty?: unknown };
  if (typeof slug !== "string" || slug === "") return null;
  if (typeof qty !== "number" || !Number.isFinite(qty) || qty < 1) return null;

  return { slug, qty: clampQty(qty) };
}

/** Folded through `addLine`, so a slug stored twice comes back as one line. */
function parseCart(raw: string | null): Cart {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.reduce<Cart>((cart, entry) => {
    const line = asLine(entry);
    return line ? addLine(cart, line.slug, line.qty) : cart;
  }, []);
}

/**
 * The stored cart, or an empty one — never an exception. A customer whose store
 * is unreadable gets a cart they can fill again, which is the worst thing that
 * should ever come of it.
 */
export function readCart(storage: CartStorage): Cart {
  try {
    return parseCart(storage.getItem(CART_STORAGE_KEY));
  } catch {
    // Private-mode Safari and a cookies-disabled profile throw on access
    // itself, before there is anything to parse.
    return [];
  }
}

export function writeCart(storage: CartStorage, cart: Cart): void {
  try {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // A cart that cannot be persisted is still a working cart for this visit,
    // and losing it on refresh beats losing the click.
  }
}
