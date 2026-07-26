import type { Colour, FlowerType, Occasion, Size } from "@/lib/catalog/types";

/**
 * Display labels for the facet vocabularies.
 *
 * Slugs are ASCII so they are safe in URLs; these are what a customer reads,
 * accents and all. Typed as complete records, so adding a facet value without
 * giving it a label is a compile error.
 */
export const facetLabels = {
  occasion: {
    amor: "Amor y romance",
    cumpleanos: "Cumpleaños",
    aniversario: "Aniversario",
    bodas: "Bodas",
    condolencias: "Condolencias",
    "dia-de-la-madre": "Día de la Madre",
    graduacion: "Graduación",
    "nuevo-bebe": "Nuevo bebé",
  } satisfies Record<Occasion, string>,

  flowerType: {
    rosas: "Rosas",
    girasoles: "Girasoles",
    orquideas: "Orquídeas",
    lirios: "Lirios",
    tulipanes: "Tulipanes",
    gerberas: "Gerberas",
    claveles: "Claveles",
    mixtas: "Flores mixtas",
  } satisfies Record<FlowerType, string>,

  colour: {
    rojo: "Rojo",
    rosado: "Rosado",
    blanco: "Blanco",
    amarillo: "Amarillo",
    naranja: "Naranja",
    morado: "Morado",
    azul: "Azul",
    multicolor: "Multicolor",
  } satisfies Record<Colour, string>,

  size: {
    pequeno: "Pequeño",
    mediano: "Mediano",
    grande: "Grande",
  } satisfies Record<Size, string>,
} as const;

/**
 * Every piece of user-facing copy.
 *
 * Azahar is Spanish-only (es-VE) with no i18n library, so this module stands in
 * for one: wording is edited here, never inline in a component. If you are
 * about to type an accented Spanish string into JSX, it belongs in this file.
 */
export const strings = {
  site: {
    name: "Azahar",
    tagline: "Floristería",
    description:
      "Flores frescas, arreglos y detalles para cada ocasión. Pide por WhatsApp.",
  },

  header: {
    searchPlaceholder: "Buscar flores, ramos, ocasiones…",
    searchLabel: "Buscar productos",
    openSearch: "Abrir búsqueda",
    closeSearch: "Cerrar búsqueda",
    categories: "Categorías",
    cart: "Carrito",
    cartWithCount: (count: number) =>
      count === 1
        ? "1 artículo en el carrito"
        : `${count} artículos en el carrito`,
    skipToContent: "Saltar al contenido",
  },

  footer: {
    contactHeading: "Contáctanos",
    whatsappCta: "Escríbenos por WhatsApp",
    hoursLabel: "Horario",
    locationLabel: "Ubicación",
    exploreHeading: "Explora",
    paymentsHeading: "Métodos de pago",
    paymentMethods: [
      "Pago Móvil",
      "Transferencia",
      "Zelle",
      "Binance",
      "Efectivo",
    ],
    home: "Inicio",
    categories: "Categorías",
    search: "Ver todo",
    about: "Nosotros",
    rights: (year: number) =>
      `© ${year} Azahar. Todos los derechos reservados.`,
  },

  home: {
    // Placeholder until the home page is built against the catalog.
    eyebrow: "Floristería en Caracas",
    heading: "Flores que dicen lo que no cabe en un mensaje",
    body: "Estamos preparando nuestra tienda en línea. Muy pronto vas a poder ver todo el catálogo y pedir por WhatsApp.",
  },
} as const;
