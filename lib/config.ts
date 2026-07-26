/**
 * Shop configuration.
 *
 * Values the shop owner can change without a developer. Everything here is a
 * PLACEHOLDER until the real details are supplied.
 *
 * The delivery fee and the five payment rails join this module when checkout
 * is built; today it carries only what the site chrome needs.
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
} as const;

/** `https://wa.me/<number>` — the chat link used by the footer CTA. */
export function whatsappChatUrl(): string {
  return `https://wa.me/${shopConfig.whatsappNumber}`;
}
