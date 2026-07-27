/**
 * Price formatting.
 *
 * Prices are stored throughout the catalog as integer USD minor units (cents)
 * to keep money arithmetic off floating point. This module is the only place
 * they are turned into something a customer reads — or, in `priceDecimal`'s
 * case, something a machine reads.
 */

const WHOLE = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const WITH_CENTS = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Render a price in USD, e.g. `formatPrice(3200) === "$32"`.
 *
 * Decimals appear only when the amount actually has cents — every seeded
 * product price is a whole dollar, and the locked visual direction shows those
 * as a bare "$32". Configurable amounts (the delivery fee, cash change) may be
 * fractional, and those must never be rounded away.
 */
export function formatPrice(cents: number): string {
  const formatter = cents % 100 === 0 ? WHOLE : WITH_CENTS;
  return `$${formatter.format(cents / 100)}`;
}

/**
 * The same amount for a machine: `priceDecimal(3200) === "32.00"`.
 *
 * No currency symbol, no locale, always two decimals — what schema.org's
 * `price` wants beside an explicit `priceCurrency`. It lives here rather than at
 * its one call site because minor-units-to-major is this module's job, and
 * splitting the integer keeps the conversion off floating point exactly as
 * `formatPrice` does.
 */
export function priceDecimal(cents: number): string {
  const major = Math.floor(cents / 100);
  const minor = String(cents % 100).padStart(2, "0");

  return `${major}.${minor}`;
}
