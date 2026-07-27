import { readFileSync } from "node:fs";

import type { NextConfig } from "next";

import { auditBuildConfig } from "./lib/config-audit";

/**
 * Check this build's shop configuration, and refuse it in strict mode.
 *
 * It runs here because the config is the one module Next evaluates per *build*:
 * `lib/config` is imported by the footer on every page and evaluated per route,
 * so the same warning in its module scope prints dozens of times.
 *
 * `.env.example` is the manifest — every variable documented there is checked,
 * and `lib/config.test.ts` holds the file and the module to the same list so the
 * two cannot drift. What to do about a gap is `lib/config-audit`'s decision, and
 * the interesting half of it is that a plain `npm run build` still *warns*: a
 * clone with no environment builds into the placeholder demo shop, which is what
 * the placeholders are for. A deploy sets `AZAHAR_STRICT_CONFIG` and gets a
 * build that stops instead.
 */
function checkShopConfig(): void {
  // Next reads the config twice per build, and again on every dev restart. The
  // sentinel keeps the report to one; child processes inherit it. A refusal is
  // exempt — a build must not become shippable by being run twice.
  const alreadyReported = process.env.AZAHAR_CONFIG_REPORTED === "1";
  process.env.AZAHAR_CONFIG_REPORTED = "1";

  let manifest: string;
  try {
    manifest = readFileSync(".env.example", "utf8");
  } catch {
    return; // No manifest to check against — nothing useful to say.
  }

  const audit = auditBuildConfig(manifest, process.env);

  if (audit.kind === "refused") {
    throw new Error(`[azahar] ${audit.message}`);
  }

  if (audit.kind === "placeholders" && !alreadyReported) {
    console.warn(`\n[azahar] ${audit.message}\n`);
  }
}

checkShopConfig();

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
