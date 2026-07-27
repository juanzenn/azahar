// Relative, alone among this directory's imports, and it has to be: the caller
// is `next.config.ts`, which Next transpiles through its own loader before Node
// requires it, and that loader does not resolve the `@/*` alias. An aliased
// import here fails the build with `Cannot find module './lib/env'`.
import { envReader } from "./env";

/**
 * Auditing one build's shop configuration.
 *
 * `lib/config` gives every field a placeholder so that a clone of this
 * repository builds into a working demo shop — which is what keeps the repo
 * browsable, and is the reason `npm run build` does not fail on a missing value.
 * That same kindness is a hazard at deploy time: the placeholders include a
 * Pago Móvil number and a Zelle account, and a shop that deploys with them
 * intact publishes *someone else's* payment details and takes money nowhere.
 *
 * So the decision is deliberately not "is anything missing" but "may this build
 * ship", and it has three answers rather than two. A demo build running on
 * placeholders is fine and says so. A **strict** build — one that has set
 * `AZAHAR_STRICT_CONFIG` — is refused outright, listing every variable at once
 * so a deploy is fixed in one pass instead of one failure at a time.
 *
 * The audit is pure: `.env.example`'s text and the environment both arrive as
 * arguments, because the caller is `next.config.ts`, which is the one place Next
 * evaluates per *build* rather than per route.
 */

/** Set this in a deploy environment to refuse a build that has placeholders. */
export const STRICT_CONFIG_FLAG = "AZAHAR_STRICT_CONFIG";

export type ConfigAudit = {
  /** Every `NEXT_PUBLIC_*` variable `.env.example` documents, in file order. */
  readonly documented: readonly string[];
  /** Those the build did not find. Empty when fully configured. */
  readonly absent: readonly string[];
  /** What to tell whoever is watching the build, or `null` when all is well. */
  readonly message: string | null;
  readonly kind: "configured" | "placeholders" | "refused";
};

/**
 * Decide what a build should do about the configuration it was given.
 *
 * `refused` is the caller's cue to throw; `placeholders` to warn and carry on.
 */
export function auditBuildConfig(
  manifest: string,
  env: Record<string, string | undefined>,
): ConfigAudit {
  // `.env.example` is the manifest, and only its `NEXT_PUBLIC_` lines: the
  // strict flag itself is documented there too, and it is a build switch rather
  // than a value the shop owns.
  const documented = [...manifest.matchAll(/^(NEXT_PUBLIC_\w+)=/gm)].map(
    ([, name]) => name,
  );

  // Absent, not blank. A lookup through a variable is safe here in a way it is
  // not in `lib/config`: this module runs in Node during a build and is never
  // bundled for a browser, so there is no inlining to defeat.
  const absent = documented.filter((name) => env[name] === undefined);

  // Reusing the shared reader buys the same yes/no vocabulary as every other
  // flag in the app, and the same refusal to guess at an unreadable one. Its
  // own absent-list is not ours: a missing strict flag is the normal case.
  const strict = envReader().flag(
    STRICT_CONFIG_FLAG,
    env[STRICT_CONFIG_FLAG],
    false,
  );

  if (absent.length === 0) {
    return { documented, absent, message: null, kind: "configured" };
  }

  const listed = absent.map((name) => `  · ${name}`).join("\n");
  const counted = `${absent.length} of ${documented.length} shop-configuration variables`;

  if (strict) {
    return {
      documented,
      absent,
      kind: "refused",
      message:
        `${counted} are unset, and ${STRICT_CONFIG_FLAG} is on:\n${listed}\n\n` +
        `Refusing to build. These fall back to placeholders — including payment ` +
        `details that are not this shop's — and a static export prints them into ` +
        `every page. Set them, or unset ${STRICT_CONFIG_FLAG} to build the demo shop.`,
    };
  }

  return {
    documented,
    absent,
    kind: "placeholders",
    message:
      `${counted} are unset — this build uses placeholder values for them:\n${listed}\n` +
      `Fine for a demo. A real shop sets all of them — see .env.example. ` +
      `Set ${STRICT_CONFIG_FLAG} to make this an error instead.`,
  };
}
