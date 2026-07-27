import type { PaymentRailsConfig } from "@/lib/payment";

/**
 * Shop configuration.
 *
 * Values the shop owner can change without a developer. Everything here is a
 * PLACEHOLDER until the real details are supplied.
 */
export const shopConfig = {
  /**
   * WhatsApp number in wa.me form: country code + digits only, with no `+`,
   * no leading zero and no separators. Checkout builds its deep-link from
   * this.
   */
  whatsappNumber: "584121234567",

  /** The same number, formatted for a human to read or dial. */
  phoneDisplay: "0412-123-4567",

  hours: "Lunes a sábado, 8:00 am – 6:00 pm",

  location: "Caracas, Venezuela",

  /**
   * The flat delivery fee, in USD cents like every other amount in the app.
   *
   * Flat by design and set here rather than at a call site: it is what lets
   * checkout show an exact total before the customer pays out-of-band, and what
   * lets the shop change its pricing — or deliver free, with a `0` — without a
   * developer. Retiro en tienda always costs nothing, which is the order
   * module's rule, not a second number to keep in step.
   */
  deliveryFeeUsdCents: 500,

  /**
   * The five payment rails.
   *
   * `enabled: false` removes a rail from checkout altogether — it is not shown
   * greyed out, because every rail on the page is an invitation to send money
   * somewhere. Switching bank, adding a Zelle account or dropping Binance is an
   * edit to this block and nothing else: which fields each rail needs is
   * `lib/payment`'s, and what they are called is `lib/strings`'.
   *
   * A value left blank is simply not shown, which is how a shop with a Pay ID
   * but no wallet address configures Binance.
   *
   * EVERY VALUE BELOW IS A PLACEHOLDER.
   */
  paymentRails: {
    /** Teléfono + cédula/RIF + the bank's 4-digit code. No account number. */
    "pago-movil": {
      enabled: true,
      phone: "0412-1234567",
      idNumber: "V-12.345.678",
      bankCode: "0102",
    },

    transferencia: {
      enabled: true,
      /** 20 digits, which is exactly why it has a copy button. */
      accountNumber: "01020000000000000000",
      holder: "Floristería Azahar, C.A.",
      idNumber: "J-12345678-9",
      bank: "Banco de Venezuela",
    },

    zelle: {
      enabled: true,
      /** The registered email or US phone — whichever the shop signed up with. */
      account: "pagos@azahar.example",
      holder: "Azahar Flowers LLC",
    },

    binance: {
      enabled: true,
      payId: "123456789",
      wallet: "TJ4kL9mNp2QrS5tUvW8xY1zA3bC6dE7fG",
      /** Shown beside the wallet: the right address on the wrong chain is lost. */
      network: "TRC20",
    },

    /** Pago contra entrega. Nothing to configure but whether it is offered. */
    efectivo: { enabled: true },
  } satisfies PaymentRailsConfig,
} as const;

/** `https://wa.me/<number>` — the chat link used by the footer CTA. */
export function whatsappChatUrl(): string {
  return `https://wa.me/${shopConfig.whatsappNumber}`;
}
