/**
 * Reading the shop's own details out of the build environment.
 *
 * Azahar exports statically, so there is no runtime in which to read
 * configuration: every value below is inlined by `next build` and baked into the
 * HTML. That makes this module's job narrow — turn the strings a deploy
 * environment can hold into the typed values `lib/config` hands the app — and
 * one part of it load-bearing, because several of those strings are a bank
 * account and a build that guesses at one is worse than a build that stops.
 *
 * So the three readers split a **missing** variable from a **malformed** one.
 * Absent is normal: a clone with no `.env` still builds and still runs on the
 * placeholder shop, which is what keeps the repo browsable. Malformed throws,
 * because there is no honest reading of `ENABLED=maybe`, and a rail whose switch
 * cannot be read must not reach a customer.
 *
 * The distinction that earns its keep is **present but empty**. A shop with a
 * Binance Pay ID and no wallet address says so with an empty variable, and that
 * is a real answer — `lib/payment` drops blank rows on purpose — so only an
 * absent variable falls back to a placeholder. A flag is the exception: a blank
 * account number is an answer, a blank switch is not, and `ENABLED=` throws
 * rather than picking a side.
 */

/** Values accepted for a boolean, beyond the obvious. `si`/`sí` for the shop. */
const TRUTHY = new Set(["true", "1", "yes", "si", "sí", "on"]);
const FALSY = new Set(["false", "0", "no", "off"]);

export type EnvReader = {
  text(name: string, raw: string | undefined, fallback: string): string;
  flag(name: string, raw: string | undefined, fallback: boolean): boolean;
  /** An integer count of minor units — `0` is a value, not a missing one. */
  cents(name: string, raw: string | undefined, fallback: number): number;
  /** The variables that were absent, in the order they were read. */
  readonly absent: readonly string[];
};

/**
 * A reader over one build's environment, collecting what it did not find.
 *
 * Each method takes the variable's **name and its value**, which looks like one
 * argument too many until you try to remove it: Next inlines
 * `process.env.NEXT_PUBLIC_X` by substituting that exact expression in the
 * source, so a lookup through a variable — `process.env[name]` — is left
 * untouched and reads `undefined` once the module is in a browser bundle. The
 * literal access has to stay at the call site, which leaves the name to travel
 * beside it. The name is what the missing-configuration report needs anyway.
 */
export function envReader(): EnvReader {
  const absent: string[] = [];

  /** `null` for "not set at all" — every fallback hangs off this one check. */
  function read(name: string, raw: string | undefined): string | null {
    if (raw === undefined) {
      absent.push(name);
      return null;
    }

    return raw.trim();
  }

  return {
    absent,

    text(name, raw, fallback) {
      const value = read(name, raw);
      return value === null ? fallback : value;
    },

    flag(name, raw, fallback) {
      const value = read(name, raw);
      if (value === null) return fallback;

      const normalised = value.toLowerCase();
      if (TRUTHY.has(normalised)) return true;
      if (FALSY.has(normalised)) return false;

      throw new Error(
        `${name}: expected a yes or no value (true/false, 1/0, si/no), got "${value}".`,
      );
    },

    cents(name, raw, fallback) {
      const value = read(name, raw);
      if (value === null) return fallback;

      // Digits only, so a decimal is rejected rather than truncated: "5.50"
      // meaning five and a half dollars would otherwise become 5 cents, and
      // nothing downstream could tell. Money is minor units everywhere in this
      // app, and the variable's name says CENTS.
      if (!/^\d+$/.test(value)) {
        throw new Error(
          `${name}: expected a whole number of cents (e.g. 500 for $5.00), got "${value}".`,
        );
      }

      return Number(value);
    },
  };
}
