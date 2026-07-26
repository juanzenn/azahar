import type { Category } from "@/lib/catalog/types";

/**
 * The ten categories, on the presentation/format axis only.
 *
 * Occasion, flower type and colour are deliberately facets rather than
 * categories: a product has many occasions but exactly one format.
 *
 * Order matters — it is the order categories appear in navigation and on the
 * home grid.
 */
export const categories: Category[] = [
  {
    slug: "ramos",
    name: "Ramos",
    description: "Ramos de flores frescas para toda ocasión.",
    heroImage: "/images/categories/ramos.jpg",
  },
  {
    slug: "arreglos",
    name: "Arreglos florales",
    description: "Arreglos elaborados en base, listos para sorprender.",
    heroImage: "/images/categories/arreglos.jpg",
  },
  {
    slug: "cajas",
    name: "Cajas de flores",
    description: "Flores presentadas en elegantes cajas de regalo.",
    heroImage: "/images/categories/cajas.jpg",
  },
  {
    slug: "canastas",
    name: "Canastas",
    description: "Canastas florales generosas para celebrar en grande.",
    heroImage: "/images/categories/canastas.jpg",
  },
  {
    slug: "floreros",
    name: "Floreros",
    description: "Arreglos en florero, listos para lucir en casa.",
    heroImage: "/images/categories/floreros.jpg",
  },
  {
    slug: "plantas",
    name: "Plantas",
    description: "Plantas vivas que duran mucho más que un ramo.",
    heroImage: "/images/categories/plantas.jpg",
  },
  {
    slug: "coronas",
    name: "Coronas fúnebres",
    description: "Coronas y homenajes florales para despedidas.",
    heroImage: "/images/categories/coronas.jpg",
  },
  {
    slug: "centros-de-mesa",
    name: "Centros de mesa",
    description: "Centros de mesa para bodas, eventos y celebraciones.",
    heroImage: "/images/categories/centros-de-mesa.jpg",
  },
  {
    slug: "rosas-preservadas",
    name: "Rosas preservadas",
    description: "Rosas eternas que duran años, sin agua.",
    heroImage: "/images/categories/rosas-preservadas.jpg",
  },
  {
    slug: "detalles",
    name: "Detalles",
    description: "Pequeños detalles con flores, globos y chocolates.",
    heroImage: "/images/categories/detalles.jpg",
  },
];
