# 01 — Walking skeleton: scaffold, Jardín theme, static build

**What to build:** A deployable static site that already *looks* like Azahar — a visitor sees the
boutique wordmark, the persistent search bar, a "Categorías" link and a cart icon in a sticky header,
and the shop's contact details, payment-method trust signals and category links in the footer. The
page between them is a placeholder, but the warm off-white ground, emerald accents and serif display
type are all real. A build produces static files that can be dropped on any host.

This is a **walking skeleton**, not a vertical slice — greenfield has no layers to cut through yet.
Everything after this ticket is a proper vertical slice.

Spec: [`spec.md`](../../spec.md) §1 (rendering & stack), §5 (global chrome), §10 (visual direction).

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Next.js (latest stable major) on the App Router, configured for **fully static export** — no runtime server; `npm run build` emits static files.
- [x] TypeScript `strict: true` with the `@/*` path alias; flat repo layout (no `src/`).
- [x] Tailwind CSS installed, plus shadcn/ui primitives copied in (no runtime dependency). At minimum the primitives later tickets need are available: Sheet, Select, Pagination, Checkbox, RadioGroup.
- [x] The **Jardín palette** is wired into the Tailwind/shadcn theme as named tokens, not scattered hex literals (values from the ticket-08 prototype):

  | Token | Value | Use |
  |---|---|---|
  | ground | `#faf8f3` | page background |
  | panel | `#f2eee5` | raised surfaces |
  | ink | `#21201d` | body text |
  | muted | `#6d6a63` | secondary text, counts |
  | hairline | `#e7e2d8` | borders, grid lines |
  | primary (emerald) | `#1f4d3a` | CTAs, prices, active pagination |
  | secondary (plum) | `#5f2a52` | eyebrows, "Limpiar todo" |
  | tertiary (gold) | `#b08542` | accents |

- [x] Typography set up: **serif display** for logo/headings/product names (`ui-serif, "Iowan Old Style", "Palatino Linotype", Georgia, "Times New Roman", serif`), **sans** for body/UI/prices (`ui-sans-serif, system-ui`), and an eyebrow style that is uppercase with ~`.28em` letter-spacing.
- [x] **Sticky header on every page**: wordmark linking home, a prominent persistent search bar that navigates to global search on Enter and collapses to an expandable icon on mobile, a plain "Categorías" link (no dropdown), and a cart icon with a badge slot. The badge shows nothing until the cart ticket wires it.
- [x] **Footer on every page**: contact block (WhatsApp CTA, phone, hours, location), accepted payment methods as trust signals, category links, about link, copyright.
- [x] All user-facing Spanish copy lives in a **single strings module** — no Spanish string literals inline in components.
- [x] A `formatPrice` helper renders USD from integer cents and is the only place price formatting happens.
- [x] **Vitest configured** (resolving the `@/*` alias) **plus React Testing Library**, with at least one real passing test — `formatPrice` is the natural first subject. `npm test` is green.
- [x] ESLint (flat config, `eslint-config-next`) + Prettier + `prettier-plugin-tailwindcss`; lint passes clean.
- [x] npm as the package manager; **Node 26** pinned via `.nvmrc` and `engines`.
- [x] Nothing in the build depends on Vercel specifically — the static output is host-agnostic.
