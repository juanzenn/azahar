/**
 * Shop configuration.
 *
 * Values the shop owner can change without a developer. Everything here is a
 * PLACEHOLDER until the real details are supplied.
 *
 * The five payment rails join this module when they are built.
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
} as const;

/** `https://wa.me/<number>` — the chat link used by the footer CTA. */
export function whatsappChatUrl(): string {
  return `https://wa.me/${shopConfig.whatsappNumber}`;
}
