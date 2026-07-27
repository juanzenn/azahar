import { envReader } from "@/lib/env";
import type { PaymentRailsConfig } from "@/lib/payment";

/**
 * Shop configuration.
 *
 * Values the shop owner can change without a developer. **This module owns the
 * shape and the defaults; the deploy environment owns the values** — every field
 * below reads a `NEXT_PUBLIC_*` variable and falls back to a placeholder, so the
 * repository never carries a real bank account and a fresh clone still builds
 * into a working demo shop. `.env.example` lists all of them.
 *
 * The prefix is `NEXT_PUBLIC_` because these values genuinely are public: a
 * static export prints them into HTML that anyone can read. It also means the
 * module keeps working if a client island ever needs one — a bare variable would
 * quietly read `undefined` in the browser, which for an account number is the
 * worst way to be wrong.
 *
 * Call sites still import `shopConfig`, unchanged and unaware.
 */

const env = envReader();

const PLACEHOLDER_WHATSAPP = "584121234567";

export const shopConfig = {
  /**
   * WhatsApp number in wa.me form: country code + digits only, with no `+`, no
   * leading zero and no separators. Checkout builds its deep-link from this.
   */
  whatsappNumber: env.text(
    "NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER",
    process.env.NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER,
    PLACEHOLDER_WHATSAPP,
  ),

  /** The same number, formatted for a human to read or dial. */
  phoneDisplay: env.text(
    "NEXT_PUBLIC_SHOP_PHONE_DISPLAY",
    process.env.NEXT_PUBLIC_SHOP_PHONE_DISPLAY,
    "0412-123-4567",
  ),

  hours: env.text(
    "NEXT_PUBLIC_SHOP_HOURS",
    process.env.NEXT_PUBLIC_SHOP_HOURS,
    "Lunes a sábado, 8:00 am – 6:00 pm",
  ),

  location: env.text(
    "NEXT_PUBLIC_SHOP_LOCATION",
    process.env.NEXT_PUBLIC_SHOP_LOCATION,
    "Caracas, Venezuela",
  ),

  /**
   * The flat delivery fee, in USD cents like every other amount in the app.
   *
   * Flat by design and read here rather than at a call site: it is what lets
   * checkout show an exact total before the customer pays out-of-band, and what
   * lets the shop change its pricing — or deliver free, with a `0` — without a
   * developer. Retiro en tienda always costs nothing, which is the order
   * module's rule, not a second number to keep in step.
   */
  deliveryFeeUsdCents: env.cents(
    "NEXT_PUBLIC_SHOP_DELIVERY_FEE_CENTS",
    process.env.NEXT_PUBLIC_SHOP_DELIVERY_FEE_CENTS,
    500,
  ),

  /**
   * The five payment rails.
   *
   * `enabled: false` removes a rail from checkout altogether — it is not shown
   * greyed out, because every rail on the page is an invitation to send money
   * somewhere. Switching bank, adding a Zelle account or dropping Binance is a
   * change to the deploy's environment and nothing else: which fields each rail
   * needs is `lib/payment`'s, and what they are called is `lib/strings`'.
   *
   * A value set to empty is simply not shown, which is how a shop with a Pay ID
   * but no wallet address configures Binance. A value left *unset* falls back to
   * the placeholder beside it, which is why the build warns about the ones it
   * did not find.
   */
  paymentRails: {
    /** Teléfono + cédula/RIF + the bank's 4-digit code. No account number. */
    "pago-movil": {
      enabled: env.flag(
        "NEXT_PUBLIC_PAY_PAGO_MOVIL_ENABLED",
        process.env.NEXT_PUBLIC_PAY_PAGO_MOVIL_ENABLED,
        true,
      ),
      phone: env.text(
        "NEXT_PUBLIC_PAY_PAGO_MOVIL_PHONE",
        process.env.NEXT_PUBLIC_PAY_PAGO_MOVIL_PHONE,
        "0412-1234567",
      ),
      idNumber: env.text(
        "NEXT_PUBLIC_PAY_PAGO_MOVIL_ID",
        process.env.NEXT_PUBLIC_PAY_PAGO_MOVIL_ID,
        "V-12.345.678",
      ),
      bankCode: env.text(
        "NEXT_PUBLIC_PAY_PAGO_MOVIL_BANK_CODE",
        process.env.NEXT_PUBLIC_PAY_PAGO_MOVIL_BANK_CODE,
        "0102",
      ),
    },

    transferencia: {
      enabled: env.flag(
        "NEXT_PUBLIC_PAY_TRANSFERENCIA_ENABLED",
        process.env.NEXT_PUBLIC_PAY_TRANSFERENCIA_ENABLED,
        true,
      ),
      /** 20 digits, which is exactly why it has a copy button. */
      accountNumber: env.text(
        "NEXT_PUBLIC_PAY_TRANSFERENCIA_ACCOUNT_NUMBER",
        process.env.NEXT_PUBLIC_PAY_TRANSFERENCIA_ACCOUNT_NUMBER,
        "01020000000000000000",
      ),
      holder: env.text(
        "NEXT_PUBLIC_PAY_TRANSFERENCIA_HOLDER",
        process.env.NEXT_PUBLIC_PAY_TRANSFERENCIA_HOLDER,
        "Floristería Azahar, C.A.",
      ),
      idNumber: env.text(
        "NEXT_PUBLIC_PAY_TRANSFERENCIA_ID",
        process.env.NEXT_PUBLIC_PAY_TRANSFERENCIA_ID,
        "J-12345678-9",
      ),
      bank: env.text(
        "NEXT_PUBLIC_PAY_TRANSFERENCIA_BANK",
        process.env.NEXT_PUBLIC_PAY_TRANSFERENCIA_BANK,
        "Banco de Venezuela",
      ),
    },

    zelle: {
      enabled: env.flag(
        "NEXT_PUBLIC_PAY_ZELLE_ENABLED",
        process.env.NEXT_PUBLIC_PAY_ZELLE_ENABLED,
        true,
      ),
      /** The registered email or US phone — whichever the shop signed up with. */
      account: env.text(
        "NEXT_PUBLIC_PAY_ZELLE_ACCOUNT",
        process.env.NEXT_PUBLIC_PAY_ZELLE_ACCOUNT,
        "pagos@azahar.example",
      ),
      holder: env.text(
        "NEXT_PUBLIC_PAY_ZELLE_HOLDER",
        process.env.NEXT_PUBLIC_PAY_ZELLE_HOLDER,
        "Azahar Flowers LLC",
      ),
    },

    binance: {
      enabled: env.flag(
        "NEXT_PUBLIC_PAY_BINANCE_ENABLED",
        process.env.NEXT_PUBLIC_PAY_BINANCE_ENABLED,
        true,
      ),
      payId: env.text(
        "NEXT_PUBLIC_PAY_BINANCE_PAY_ID",
        process.env.NEXT_PUBLIC_PAY_BINANCE_PAY_ID,
        "123456789",
      ),
      wallet: env.text(
        "NEXT_PUBLIC_PAY_BINANCE_WALLET",
        process.env.NEXT_PUBLIC_PAY_BINANCE_WALLET,
        "TJ4kL9mNp2QrS5tUvW8xY1zA3bC6dE7fG",
      ),
      /** Shown beside the wallet: the right address on the wrong chain is lost. */
      network: env.text(
        "NEXT_PUBLIC_PAY_BINANCE_NETWORK",
        process.env.NEXT_PUBLIC_PAY_BINANCE_NETWORK,
        "TRC20",
      ),
    },

    /** Pago contra entrega. Nothing to configure but whether it is offered. */
    efectivo: {
      enabled: env.flag(
        "NEXT_PUBLIC_PAY_EFECTIVO_ENABLED",
        process.env.NEXT_PUBLIC_PAY_EFECTIVO_ENABLED,
        true,
      ),
    },
  } satisfies PaymentRailsConfig,
} as const;

/** `https://wa.me/<number>` — the chat link used by the footer CTA. */
export function whatsappChatUrl(): string {
  return `https://wa.me/${shopConfig.whatsappNumber}`;
}

/**
 * The configuration variables this build did not find, and so served from
 * placeholders. Empty on a fully configured deploy.
 *
 * Reported by `next.config.ts` rather than from this module's scope, which Next
 * evaluates once per route and not once per build — a warning here prints dozens
 * of times. `npm run build` deliberately does not *fail* on a missing value: the
 * demo shop is the reason a clone of this repository runs at all.
 */
export function absentShopConfig(): readonly string[] {
  return env.absent;
}
