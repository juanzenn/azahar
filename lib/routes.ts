/**
 * Route paths.
 *
 * User-facing URL paths are Spanish; every code symbol is English. Keeping the
 * paths here means that convention is stated once instead of being retyped as
 * string literals across the app.
 */
export const routes = {
  home: "/",
  categories: "/categorias",
  category: (slug: string) => `/categoria/${slug}`,
  search: "/buscar",
  searchFor: (query: string) =>
    query.trim() ? `/buscar?q=${encodeURIComponent(query.trim())}` : "/buscar",
  searchByOccasion: (occasion: string) =>
    `/buscar?occ=${encodeURIComponent(occasion)}`,
  product: (slug: string) => `/producto/${slug}`,
  cart: "/carrito",
  checkout: "/finalizar-compra",
  orderSent: "/pedido-enviado",
  about: "/nosotros",
} as const;
