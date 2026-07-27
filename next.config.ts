import { readFileSync } from "node:fs";

import type { NextConfig } from "next";

/**
 * Report the shop-configuration variables this build did not find.
 *
 * It runs here because the config is the one module Next evaluates per *build*:
 * `lib/config` is imported by the footer on every page and evaluated per route,
 * so the same warning in its module scope prints dozens of times.
 *
 * `.env.example` is the manifest — every variable documented there is checked,
 * and `lib/config.test.ts` holds the file and the module to the same list so the
 * two cannot drift. The build only ever warns: a clone with no environment
 * builds into the placeholder demo shop, which is what the placeholders are for.
 * A deploy that wants a hard gate can assert on `absentShopConfig()`.
 */
function reportPlaceholderConfig(): void {
  // Next reads the config twice per build, and again on every dev restart. The
  // sentinel keeps the report to one; child processes inherit it.
  if (process.env.AZAHAR_CONFIG_REPORTED) return;
  process.env.AZAHAR_CONFIG_REPORTED = "1";

  let manifest: string;
  try {
    manifest = readFileSync(".env.example", "utf8");
  } catch {
    return; // No manifest to check against — nothing useful to say.
  }

  const documented = [...manifest.matchAll(/^(NEXT_PUBLIC_\w+)=/gm)].map(
    (match) => match[1],
  );
  // A lookup through a variable is fine here, unlike in `lib/config`: this file
  // is never bundled for a browser, so there is no inlining to defeat.
  const absent = documented.filter((name) => process.env[name] === undefined);

  if (absent.length === 0) return;

  console.warn(
    `\n[azahar] ${absent.length} of ${documented.length} shop-configuration ` +
      `variables are unset — this build uses placeholder values for them:\n` +
      absent.map((name) => `  · ${name}`).join("\n") +
      `\nFine for a demo. A real shop sets all of them — see .env.example.\n`,
  );
}

reportPlaceholderConfig();

const nextConfig: NextConfig = {
  // Fully static export: every page prerenders from the seed catalog at build
  // time and there is no runtime server. Cart, search and checkout are
  // client-side. The output is deployable to any static host.
  output: "export",
  images: {
    // Static export means there is no server to resize images, so next/image
    // serves the committed files as-is. We keep next/image for layout
    // stability and lazy loading.
    unoptimized: true,
  },
};

export default nextConfig;
