import type { Colour, FlowerType, Occasion, Size } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
// Type-only, so nothing imports back at runtime: the search module reads
// `facetLabels` from here, and price range is its vocabulary rather than the
// domain model's because it is derived from the price.
import type { FacetCounts, PriceRange, Sort } from "@/lib/search";

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

  /**
   * The price buckets, whose boundaries in cents are `lib/search`'s. Written
   * through `formatPrice` like every other amount in the app, which also puts
   * the boundary a label claims next to the number a customer reads.
   */
  priceRange: {
    "0-25": `${formatPrice(0)} – ${formatPrice(2500)}`,
    "25-50": `${formatPrice(2500)} – ${formatPrice(5000)}`,
    "50-100": `${formatPrice(5000)} – ${formatPrice(10000)}`,
    "100+": `${formatPrice(10000)}+`,
  } satisfies Record<PriceRange, string>,
} as const;

/**
 * "24 resultados" / "1 resultado" — the count the results header and the mobile
 * sheet's footer both read from, so the two can never disagree.
 */
const results = (count: number) =>
  count === 1 ? "1 resultado" : `${count} resultados`;

/** A customer's own words, quoted back to them the same way everywhere. */
const quoted = (query: string) => `«${query}»`;

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
    heroEyebrow: "Colección de temporada",
    heroHeading: "Ramos que dicen lo que las palabras callan",
    heroBody:
      "Composiciones artesanales de flores frescas, entregadas con cuidado en toda la ciudad.",
    heroCta: "Ver producto",
    heroSecondary: "Ver todo",
    featuredEyebrow: "Selección del florista",
    featuredHeading: "Favoritos de la casa",
    categoriesEyebrow: "Explora la tienda",
    categoriesHeading: "Comprar por categoría",
    occasionEyebrow: "Para cada momento",
    occasionHeading: "Comprar por ocasión",
  },

  breadcrumbs: {
    /** Names the trail for screen readers; never rendered visually. */
    label: "Ruta de navegación",
    home: "Inicio",
  },

  search: {
    title: "Buscar",
    description:
      "Filtra el catálogo por categoría, ocasión, tipo de flor, color, tamaño y precio.",

    /** The in-page box that live-filters the results. */
    queryLabel: "Buscar en el catálogo",
    queryPlaceholder: "Buscar en la colección…",

    /** The mobile trigger and the sheet it opens. */
    filters: "Filtros",
    filtersWithCount: (count: number) => `Filtros · ${count}`,
    closeFilters: "Cerrar filtros",
    showResults: (count: number) => `Ver ${results(count)}`,

    resultCount: results,
    resultCountFor: (count: number, query: string) =>
      `${results(count)} para ${quoted(query)}`,
    /** The query's own chip, alongside the facet chips. */
    queryChip: quoted,
    /** A category page counts products, not search results. */
    productCount: (count: number) =>
      count === 1 ? "1 producto" : `${count} productos`,

    sortLabel: "Ordenar",
    sorts: {
      featured: "Destacados",
      "price-asc": "Precio: de menor a mayor",
      "price-desc": "Precio: de mayor a menor",
      name: "Nombre: A–Z",
    } satisfies Record<Sort, string>,

    /** Serif headings above each facet group, in sidebar order. */
    groups: {
      category: "Categoría",
      price: "Precio",
      occasion: "Ocasión",
      flowerType: "Tipo de flor",
      colour: "Color",
      size: "Tamaño",
    } satisfies Record<keyof FacetCounts, string>,

    /**
     * The explicit clear row single-select groups get instead of
     * click-to-deselect. Multi-select groups clear by unchecking.
     */
    anyValue: {
      category: "Todas las categorías",
      price: "Cualquier precio",
      size: "Cualquier tamaño",
    } satisfies Record<"category" | "price" | "size", string>,

    pagination: "Paginación",
    page: (number: number) => `Página ${number}`,
    previousPage: "Página anterior",
    nextPage: "Página siguiente",

    activeFiltersLabel: "Filtros activos",
    removeFilter: (label: string) => `Quitar filtro: ${label}`,
    clearAll: "Limpiar todo",
    clearFilters: "Limpiar filtros",

    emptyHeading: "No encontramos productos que coincidan con tu búsqueda.",
    emptyBody: "Revisa la ortografía o ajusta los filtros.",
    suggestionsEyebrow: "Del catálogo",
    suggestionsHeading: "Quizás te interese",
  },

  product: {
    relatedEyebrow: "También te puede gustar",
    relatedHeading: "Más de esta categoría",
  },

  about: {
    title: "Nosotros",
    eyebrow: "Nuestra historia",
    heading: "Flores hechas a mano, desde Caracas",
    intro:
      "Azahar nació de algo muy simple: la convicción de que un ramo bien hecho dice cosas que cuesta poner en palabras. Llevamos años armando flores para los días importantes de nuestros clientes —y también para los martes cualquiera en los que alguien merece una sorpresa.",
    paragraphs: [
      {
        heading: "Cada arreglo se hace el mismo día",
        body: "Trabajamos con flor fresca de temporada y armamos cada pedido el día de la entrega. Nada se prepara con antelación ni se guarda en nevera esperando comprador: por eso lo que llega se ve como en la foto y dura lo que tiene que durar.",
      },
      {
        heading: "Entregamos en Caracas y alrededores",
        body: "Coordinamos la entrega a domicilio en el área metropolitana, o puedes retirar en tienda si te queda más cómodo. Tú eliges la fecha y, si quieres, la franja horaria; nosotros nos encargamos del resto.",
      },
      {
        heading: "Pedidos por WhatsApp, sin complicaciones",
        body: "Arma tu pedido aquí en la tienda y lo terminas por WhatsApp, con todos los datos ya escritos. Aceptamos Pago Móvil, transferencia, Zelle, Binance y efectivo contra entrega.",
      },
    ],
    ctaHeading: "¿Buscas algo en particular?",
    ctaBody:
      "Escríbenos y te ayudamos a elegir. Si necesitas algo fuera del catálogo —un evento, una boda, un arreglo especial— también lo hacemos.",
    ctaButton: "Escríbenos por WhatsApp",
    ctaSecondary: "Ver el catálogo",
  },

  notFound: {
    title: "Página no encontrada",
    eyebrow: "Error 404",
    heading: "No encontramos esta página",
    body: "Puede que el enlace esté roto o que el producto ya no esté disponible. Prueba desde el inicio o busca en el catálogo.",
    home: "Ir al inicio",
    search: "Ver el catálogo",
  },
} as const;
