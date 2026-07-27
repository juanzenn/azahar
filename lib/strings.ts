import type { Colour, FlowerType, Occasion, Size } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
// Type-only, so nothing imports back at runtime: checkout's vocabularies are the
// order module's, and their labels are this one's.
import type { CheckoutIssue, PaymentMethod, TimeWindow } from "@/lib/order";
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
    /** The list itself is the shop's rails, so a switched-off one cannot be
        advertised here after checkout has stopped offering it. */
    paymentsHeading: "Métodos de pago",
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

  /**
   * The copy-to-clipboard control, wherever it appears — beside a twenty-digit
   * account number today, beside the shop's own number on the confirmation page
   * next. Named after what it copies, so a row of them is not five buttons all
   * called "copiar".
   */
  copyButton: {
    action: (label: string) => `Copiar ${label}`,
    copied: "Copiado",
  },

  breadcrumbs: {
    /** Names the trail for screen readers; never rendered visually. */
    label: "Ruta de navegación",
    home: "Inicio",
  },

  /**
   * The categories index. It carries real weight: the header has no dropdown,
   * so this page — not a menu — is where a customer picks a format.
   */
  categories: {
    title: "Categorías",
    /** A few formats as examples, not the taxonomy — that would go stale in
        `data/categories.ts` without anyone noticing here. */
    description:
      "Explora todo el catálogo de Azahar por formato: ramos, arreglos, cajas, plantas y más.",
    eyebrow: "Todo el catálogo",
    heading: "Explora por categoría",
    intro:
      "Diez maneras de regalar flores. Entra en la que te interese y afina desde ahí por ocasión, tipo de flor, color, tamaño y precio.",
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
    addToCart: "Agregar al carrito",
    /** The confirmation that replaces navigating away, alongside the badge. */
    added: "Agregado a tu carrito",
    viewCart: "Ver el carrito",
    relatedEyebrow: "También te puede gustar",
    relatedHeading: "Más de esta categoría",
  },

  cart: {
    title: "Carrito",
    description: "Revisa lo que elegiste antes de finalizar tu pedido.",
    heading: "Tu carrito",
    itemCount: (count: number) =>
      count === 1 ? "1 artículo" : `${count} artículos`,

    /** "$25 c/u" — the unit price beside a line that may hold several. */
    unitPrice: (price: string) => `${price} c/u`,
    quantity: "Cantidad",
    /** Naming the product keeps a row's steppers apart from the next row's. */
    increase: (name: string) => `Agregar uno más de ${name}`,
    decrease: (name: string) => `Quitar uno de ${name}`,
    remove: "Quitar",
    removeItem: (name: string) => `Quitar ${name} del carrito`,

    subtotal: "Subtotal",
    subtotalNote: "El envío se calcula al finalizar la compra.",
    /** The way out of the cart and into checkout. */
    checkout: "Finalizar compra",
    keepShopping: "Seguir comprando",

    emptyHeading: "Tu carrito está vacío",
    emptyBody:
      "Todavía no has agregado nada. Explora el catálogo y aquí te esperará lo que elijas.",
  },

  /**
   * Checkout. The longest block in the file, and the one where wording does the
   * most work: every hint below exists because a customer filling this in on a
   * phone cannot ask anyone what a field means.
   */
  checkout: {
    title: "Finalizar compra",
    description:
      "Completa los datos de tu pedido y confírmalo por WhatsApp en un paso.",
    heading: "Finalizar compra",
    intro:
      "Completa estos datos y al final te mostramos cómo pagar y confirmas por WhatsApp.",

    /** Explains the asterisk once, above the first field that carries one. */
    requiredNote: "Los campos con * son obligatorios.",
    /** Marks the label; the control itself carries `aria-required`. */
    requiredMark: "*",
    optional: "(opcional)",

    buyer: {
      heading: "Tus datos",
      name: "Nombre completo",
      phone: "Teléfono / WhatsApp",
      phoneHint: "Por aquí te escribimos para coordinar. Ej: 0414-1234567",
      email: "Correo electrónico",
      emailHint: "Ej: nombre@correo.com",
    },

    delivery: {
      heading: "Entrega",
      methodLabel: "¿Cómo quieres recibir el pedido?",
      envio: "Envío a domicilio",
      /** The fee is config, so the copy names it instead of repeating it. */
      envioFee: (fee: string) => `Costo fijo de ${fee}, sin importar la zona.`,
      envioFree: "Sin costo de envío.",
      retiro: "Retiro en tienda",
      retiroNote: "Sin costo de envío. Coordinamos la hora contigo.",
      giftToggle: "Es un regalo — enviar a otra persona",
      giftNote:
        "Nos dices quién lo recibe y el mensajero coordina con esa persona.",
    },

    recipient: {
      heading: "Destinatario",
      name: "Nombre de quien recibe",
      phone: "Teléfono de quien recibe",
      phoneHintDelivery: "El mensajero lo necesita para coordinar la entrega.",
      phoneHintPickup: "No hace falta si lo retiras tú, pero ayuda tenerlo.",
    },

    address: {
      heading: "Dirección de entrega",
      address: "Dirección",
      addressHint: "Calle o avenida, edificio o casa, piso y apartamento.",
      landmark: "Punto de referencia",
      landmarkHint: "Algo que ayude a ubicarla: «frente a la panadería».",
      zone: "Zona o sector",
      /** Said plainly, because a zone field on a shop's form usually means price. */
      zoneHint:
        "Solo para el mensajero: el envío es de costo fijo y esto no cambia el precio.",
    },

    schedule: {
      heading: "Programación",
      date: "Fecha de entrega",
      dateHint: "De hoy en adelante.",
      window: "Franja horaria",
      windowAny: "Sin preferencia",
      windows: {
        manana: "Mañana (8:00 am – 12:00 pm)",
        tarde: "Tarde (12:00 pm – 6:00 pm)",
        otra: "Otra — la indico abajo",
      } satisfies Record<TimeWindow, string>,
      windowNote: "¿A qué hora?",
      windowNoteHint: "Ej: después de las 4:00 pm.",
    },

    extras: {
      heading: "Extras",
      cardMessage: "Mensaje de la tarjeta",
      cardMessageHint:
        "Lo escribimos a mano en la tarjeta que acompaña las flores.",
      cardMessageCount: (used: number, max: number) =>
        `${used}/${max} caracteres`,
      cardFrom: "De parte de",
      cardFromHint: "Déjalo vacío si quieres que el regalo sea anónimo.",
      notes: "Notas adicionales",
      notesHint: "Cualquier cosa que debamos tener en cuenta.",
    },

    /**
     * Pago. The account values themselves are configuration — what lives here
     * is what each of them is called and what the customer is meant to do with
     * it, said once so a bank switch is an edit to `lib/config.ts` alone.
     */
    payment: {
      heading: "Pago",
      intro:
        "Elige cómo vas a pagar. Te mostramos los datos, pagas por tu app o banco y vuelves aquí con el número de referencia.",
      methodLabel: "¿Cómo vas a pagar?",

      /**
       * The rails by name — short, because the same labels are what the footer
       * advertises. What each of them means for the customer is the instruction
       * below, shown once the rail is chosen.
       */
      methods: {
        "pago-movil": "Pago Móvil",
        transferencia: "Transferencia",
        zelle: "Zelle",
        binance: "Binance / USDT",
        efectivo: "Efectivo",
      } satisfies Record<PaymentMethod, string>,

      /** One line above each account block: what to do with what is below it. */
      instructions: {
        "pago-movil":
          "Haz el Pago Móvil con estos datos y luego escribe el número de referencia.",
        transferencia:
          "Transfiere a esta cuenta y luego escribe el número de referencia.",
        zelle:
          "Envía el Zelle a estos datos y luego escribe el número de confirmación.",
        binance:
          "Envía el USDT por la red indicada y luego escribe el ID de la transacción.",
        /** Says nothing about a courier: cash is also how a pickup is paid. */
        efectivo:
          "Pagas en efectivo al recibir el pedido, sin adelanto. No hace falta número de referencia.",
      } satisfies Record<PaymentMethod, string>,

      /** What each line of an account block is called. */
      details: {
        phone: "Teléfono",
        idNumber: "Cédula / RIF",
        bankCode: "Código de banco",
        accountNumber: "Número de cuenta",
        holder: "Titular",
        bank: "Banco",
        zelleAccount: "Correo o teléfono Zelle",
        payId: "Pay ID",
        wallet: "Wallet USDT",
        network: "Red",
      },

      reference: "Número de referencia",
      referenceHint:
        "Los últimos dígitos que te da el banco o la app al confirmar el pago.",
      /** A deep-link cannot carry an image, so the customer is told plainly. */
      receiptNote:
        "Envíanos la captura del comprobante en el chat de WhatsApp: el enlace abre la conversación, pero la imagen la adjuntas tú.",

      changeToggle: "¿Necesitas vuelto?",
      changeAmount: "¿Con cuánto vas a pagar?",
      /** No mention of a mensajero: cash is also how a pickup is paid. */
      changeAmountHint: "Ej: 50. Así llevamos tu vuelto listo.",

      submit: "Enviar pedido por WhatsApp",
      /** Says why the button is off, rather than leaving it a dead end. */
      submitBlocked: "Completa los campos obligatorios para enviar tu pedido.",
    },

    summary: {
      heading: "Tu pedido",
      /** "2 × Ramo Primavera" — the compact form the sticky card can afford. */
      line: (qty: number, name: string) => `${qty} × ${name}`,
      subtotal: "Subtotal",
      delivery: "Envío",
      total: "Total",
      /** Envío and total both wait on the method: an exact total is the point. */
      pending: "Por definir",
      pendingNote: "Elige envío o retiro para ver el total exacto.",
      editCart: "Editar el carrito",
    },

    errors: {
      required: "Completa este campo.",
      "past-date": "Elige una fecha de hoy en adelante.",
    } satisfies Record<CheckoutIssue, string>,
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
