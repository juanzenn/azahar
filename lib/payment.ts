import { PAYMENT_METHODS } from "@/lib/order";
import type { PaymentMethod } from "@/lib/order";
import { strings } from "@/lib/strings";

/**
 * The payment rails, as the shop's configuration turns into a block of account
 * details.
 *
 * The view model between `shopConfig` and the payment section, in the same spirit
 * as `lib/facets`: the component below renders labels and values with a copy
 * button beside each, and knows nothing about which rail needs which fields.
 * That knowledge is here, in one switch, because it is the part that is
 * genuinely load-bearing — a Pago Móvil shown with an account number, or a
 * transfer missing its cédula, is money that does not arrive, and no test of a
 * component would notice.
 *
 * **The shop owns the values, this module owns the shape.** Changing banks,
 * adding a Zelle or dropping Binance is an edit to `lib/config.ts`; the type
 * below is what makes a rail with missing details fail to compile rather than
 * render a half-empty card.
 */

const copy = strings.checkout.payment;

/**
 * One configured rail: what the shop can be paid through, plus the switch that
 * takes it off the page. `enabled: false` is not "greyed out" — the rail is
 * gone, because every option on screen is an invitation to send money somewhere.
 */
type Rail<Values extends object = object> = Values & { enabled: boolean };

/**
 * What the shop must supply, per rail.
 *
 * Each rail's fields are the ones that rail actually requires — Pago Móvil
 * deliberately has no account number, and Binance carries the network label
 * without which USDT sent to the right address is gone.
 */
export type PaymentRailsConfig = {
  "pago-movil": Rail<{ phone: string; idNumber: string; bankCode: string }>;
  transferencia: Rail<{
    accountNumber: string;
    holder: string;
    idNumber: string;
    bank: string;
  }>;
  zelle: Rail<{ account: string; holder: string }>;
  binance: Rail<{ payId: string; wallet: string; network: string }>;
  /** In person, at the door. There is nothing to configure and nothing to copy. */
  efectivo: Rail;
};

/** One line of the account block: what it is, and the value to copy. */
export type PaymentDetail = {
  label: string;
  value: string;
};

export type PaymentRail = {
  method: PaymentMethod;
  /** The radio's label. */
  label: string;
  /** What to do with the details below it, in one line. */
  instruction: string;
  details: PaymentDetail[];
};

/**
 * The rails this shop offers, in the order they are shown, each carrying the
 * rows its own block renders.
 */
export function availableRails(config: PaymentRailsConfig): PaymentRail[] {
  return PAYMENT_METHODS.filter((method) => config[method].enabled).map(
    (method) => ({
      method,
      label: copy.methods[method],
      instruction: copy.instructions[method],
      details: filled(detailsOf(method, config)),
    }),
  );
}

/**
 * A blank value means the shop does not have one of these — "Pay ID *and/or*
 * wallet" is a real choice — and an empty box beside a label reads as a value
 * that failed to load. Trimmed on the way out, so a stray space in config is
 * never what the customer pastes into their bank.
 */
function filled(details: PaymentDetail[]): PaymentDetail[] {
  return details
    .map((detail) => ({ ...detail, value: detail.value.trim() }))
    .filter((detail) => detail.value !== "");
}

/** The one place that knows what each rail is paid through. */
function detailsOf(
  method: PaymentMethod,
  config: PaymentRailsConfig,
): PaymentDetail[] {
  const { details } = copy;

  switch (method) {
    case "pago-movil": {
      const rail = config["pago-movil"];
      return [
        { label: details.phone, value: rail.phone },
        { label: details.idNumber, value: rail.idNumber },
        // Four digits identifying the bank — and no account number, which is
        // the transfer's field and not this one's.
        { label: details.bankCode, value: rail.bankCode },
      ];
    }

    case "transferencia": {
      const rail = config.transferencia;
      return [
        { label: details.accountNumber, value: rail.accountNumber },
        { label: details.holder, value: rail.holder },
        { label: details.idNumber, value: rail.idNumber },
        { label: details.bank, value: rail.bank },
      ];
    }

    case "zelle": {
      const rail = config.zelle;
      return [
        // Whichever the shop registered: Zelle accepts an email or a US number,
        // and the customer's app asks for exactly one of them.
        { label: details.zelleAccount, value: rail.account },
        { label: details.holder, value: rail.holder },
      ];
    }

    case "binance": {
      const rail = config.binance;
      const wallet = rail.wallet.trim();

      return [
        { label: details.payId, value: rail.payId },
        { label: details.wallet, value: wallet },
        // The network labels the wallet rather than the rail: a shop paid by
        // Pay ID alone would otherwise show "Red: TRC20" naming no address.
        { label: details.network, value: wallet === "" ? "" : rail.network },
      ];
    }

    case "efectivo":
      return [];
  }
}
