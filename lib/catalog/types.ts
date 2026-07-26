/**
 * The catalog domain model.
 *
 * Three terms carry the whole storefront:
 *
 * - **Product** — one sellable item: one SKU, one size, one price. No variants.
 * - **Category** — a product's presentation/format (ramo, caja, planta…).
 *   Exactly one per product; drives navigation and breadcrumbs.
 * - **Facet** — a cross-cutting filterable attribute. Occasion, flower type and
 *   colour are multi-value; size is single-value. Price range is *derived* from
 *   the price and never stored.
 *
 * The vocabularies below are const tuples rather than bare strings so a typo in
 * the seed data is a compile error instead of a filter that silently matches
 * nothing.
 */

export const CATEGORY_SLUGS = [
  "ramos",
  "arreglos",
  "cajas",
  "canastas",
  "floreros",
  "plantas",
  "coronas",
  "centros-de-mesa",
  "rosas-preservadas",
  "detalles",
] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const OCCASIONS = [
  "amor",
  "cumpleanos",
  "aniversario",
  "bodas",
  "condolencias",
  "dia-de-la-madre",
  "graduacion",
  "nuevo-bebe",
] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const FLOWER_TYPES = [
  "rosas",
  "girasoles",
  "orquideas",
  "lirios",
  "tulipanes",
  "gerberas",
  "claveles",
  "mixtas",
] as const;
export type FlowerType = (typeof FLOWER_TYPES)[number];

export const COLOURS = [
  "rojo",
  "rosado",
  "blanco",
  "amarillo",
  "naranja",
  "morado",
  "azul",
  "multicolor",
] as const;
export type Colour = (typeof COLOURS)[number];

export const SIZES = ["pequeno", "mediano", "grande"] as const;
export type Size = (typeof SIZES)[number];

export type Category = {
  slug: CategorySlug;
  name: string;
  description?: string;
  heroImage?: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  /** Short line for cards. */
  tagline?: string;
  /** Full copy for the detail page. */
  description: string;
  /** Single price in USD minor units, to keep money off floating point. */
  priceUsdCents: number;
  /** At least one; `images[0]` is primary. Complete reference strings. */
  images: string[];
  /** Exactly one primary category. */
  categorySlug: CategorySlug;
  occasions: Occasion[];
  flowerTypes: FlowerType[];
  colours: Colour[];
  size: Size;
  featured?: boolean;
};
