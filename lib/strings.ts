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
