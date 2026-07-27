# 02 — Stack, i18n & conventions

Type: grilling
Status: resolved
Claimed-by: j.alvarez

## Question

Lock the tech stack and project conventions for the `azahar/` app:

- Next.js version + **App Router**? React Server Components posture?
- Styling — Tailwind? A component kit (shadcn/ui)? Plain CSS?
- **Spanish UI** — Spanish-only hardcoded, or an i18n layer (next-intl) for future locales?
- **Currency display** — USD only? Show a VES reference?
- Deploy target — Vercel? Static export vs SSR?
- Repo layout inside `azahar/` and any lint/format conventions.

## Answer

**Rendering — fully static (SSG export).**
- `next.config` uses `output: 'export'`. All pages prerender from the seed catalog at build time; there is **no runtime server**. Cart, advanced search, and checkout run **entirely client-side** (localStorage + a client-built WhatsApp deep-link per ticket 03).
- *Consequence:* Next's server Image optimization does not run → images are served with `unoptimized` (or a static loader). Fine for ~50 assets; their physical home is ticket 04's call. This confirms ticket 09's client-side-filter leaning.

**Framework — Next.js App Router, RSC by default + client islands.**
- Home, category browse, and product detail are **static React Server Components** (near-zero JS). Only the interactive parts — search/results, cart, checkout — are `'use client'` islands.
- Pin the **latest stable Next.js major** at scaffold time. TypeScript throughout. (Exact route/URL scheme is ticket 05.)

**Styling — Tailwind CSS + shadcn/ui.**
- Tailwind for utilities; **shadcn/ui** primitives copied into `components/ui/` (no runtime dep). Themed via CSS variables → hands ticket 08 its base and gives tickets 08/09 the drawer/sheet/select/dialog primitives (cart drawer, filter sheet). Compatible with static export.

**i18n — Spanish-only (es-VE), no i18n library.**
- Single locale, no `next-intl`. All user-facing copy is centralized in one module (`lib/strings.ts`) so wording is edited in one place.

**Currency — USD only.**
- No VES reference, no FX rate (would break the static, no-runtime posture and go stale). One `formatPrice(cents)` helper renders everywhere; exact glyph/decimal styling (`$45` vs `$45,00`) finalized with ticket 08.

**Deploy — host-agnostic static output; Vercel as default/reference.**
- Build emits static files deployable to any host; Vercel is the zero-config default, but nothing depends on it (Netlify / Cloudflare Pages / S3 / GitHub Pages all work identically).

**Repo layout & conventions.**

```
azahar/
  app/                 # App Router — RSC by default (flat, no src/)
  components/
    ui/                # shadcn/ui copied-in primitives
  lib/                 # data-access seam (t04), strings.ts, format.ts, search
  data/                # seed catalog (t04 / t06)
  public/              # static assets (physical image home decided in t04)
  next.config.ts       # output: 'export'
  tsconfig.json        # strict: true, "@/*" path alias
```

- **TypeScript strict**, `@/*` path alias.
- **ESLint** (`eslint-config-next`, flat config) + **Prettier** + `prettier-plugin-tailwindcss` (class ordering).
- Package manager **npm**. Runtime **Node 24 LTS** (`.nvmrc` / `engines: "24.x"`).
  - History: originally 24, bumped to **26** at the dev's request during this ticket, then settled back
    to 24 at the first deploy. Vercel's build image rejects `>=26` outright ("invalid or discontinued
    Node.js Version"), and under `output: "export"` Node is only the **build** runtime — nothing runs it
    in production, so the version buys nothing at runtime and cost a deploy. 24 is the LTS line
    (Krypton); 26 is Current. Pinning the deploy target also makes CI, which reads `.nvmrc`, test the
    version that actually ships.
