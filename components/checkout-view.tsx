"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useCart } from "@/components/cart-provider";
import {
  RequiredMark,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/checkout-field";
import { OrderSummary } from "@/components/order-summary";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import {
  DELIVERY_METHODS,
  EMPTY_FORM,
  MAX_CARD_MESSAGE_LENGTH,
  TIME_WINDOWS,
  quoteOrder,
  requiredFields,
  toIsoDate,
  validate,
} from "@/lib/order";
import type {
  CheckoutErrors,
  CheckoutField,
  CheckoutForm,
  DeliveryMethod,
} from "@/lib/order";
import { routes } from "@/lib/routes";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const copy = strings.checkout;

/**
 * Checkout, on one page.
 *
 * One page rather than a wizard, because the moment this design is built around
 * is the customer leaving for their bank and coming back: there are no steps to
 * lose, so returning to a still-filled form is the default rather than something
 * that had to be engineered.
 *
 * Nothing here decides what the shop needs or what the order costs — that is
 * `lib/order`'s, and it is decided once for the asterisks, the errors and the
 * total alike. What this island owns is the wiring: which blocks are on screen,
 * which figures the summary is showing, and the two guards that keep a customer
 * out of a form that cannot lead anywhere.
 *
 * The payment rails and the submit button belong to the next slice; the form
 * below ends where they will begin.
 */
export function CheckoutView({
  products,
  deliveryFeeUsdCents,
}: {
  products: Product[];
  /** Flat and the shop's to set, so it arrives from config rather than a literal. */
  deliveryFeeUsdCents: number;
}) {
  const router = useRouter();
  const { lines, loaded } = useCart();
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);

  /**
   * The floor under the date picker, read from the visitor's own clock.
   *
   * It never reaches the exported HTML — the form below does not render until the
   * cart store has been read, which cannot happen before the browser has one —
   * so reading the clock while rendering costs no hydration mismatch here, and a
   * date baked in at build time would floor the picker on the day the site was
   * deployed rather than the day the customer is ordering.
   */
  const [today] = useState(() => toIsoDate(new Date()));

  /**
   * "De parte de" follows the buyer's name until the customer writes their own.
   * Clearing it is how a gift is sent anonymously, so once they have touched it
   * the mirror is off for good — a later edit to the buyer's name must never
   * quietly sign a card the customer left blank on purpose.
   */
  const cardFromEdited = useRef(false);

  function update(patch: Partial<CheckoutForm>) {
    if (patch.cardFrom !== undefined) cardFromEdited.current = true;

    setForm((current) => {
      const next = { ...current, ...patch };
      if (!cardFromEdited.current) next.cardFrom = next.buyerName;
      return next;
    });
  }

  const quote = useMemo(
    () => quoteOrder(lines, products, form, { deliveryFeeUsdCents }),
    [lines, products, form, deliveryFeeUsdCents],
  );

  // Nobody should fill in a delivery address for nothing. `replace`, because the
  // customer never chose to be here and Back should not bring them round again.
  const empty = loaded && quote.items.length === 0;
  useEffect(() => {
    if (empty) router.replace(routes.cart);
  }, [empty, router]);

  // The exported HTML cannot know a cart, and neither can the frame before the
  // store is read. Saying nothing beats flashing a form that is about to leave.
  if (!loaded || empty) return <div className="min-h-[46vh]" />;

  const section = {
    form,
    update,
    errors: validate(form, today),
    required: requiredFields(form),
  };

  return (
    <div className="mt-9 grid items-start gap-11 lg:grid-cols-[1fr_340px] lg:gap-16">
      {/* Ours is the only validation, so the browser's is turned off: its
          bubbles would contradict the hints beside the fields, in a language
          this app never chose. */}
      <form noValidate onSubmit={(event) => event.preventDefault()}>
        <div className="grid gap-9">
          <BuyerSection {...section} />
          <DeliverySection {...section} fee={deliveryFeeUsdCents} />
          {form.isGift && <RecipientSection {...section} />}
          {form.deliveryMethod === "envio" && <AddressSection {...section} />}
          <ScheduleSection {...section} today={today} />
          <ExtrasSection {...section} />
          {/* Pago + referencia land here, above the submit button. */}
        </div>
      </form>

      {/* Sticky beside the form on a desktop. On a phone it stacks below, which
          is where the exact total is wanted anyway: directly above the payment
          instructions the next slice adds. */}
      <OrderSummary quote={quote} className="lg:sticky lg:top-[98px]" />
    </div>
  );
}

type SectionProps = {
  form: CheckoutForm;
  update: (patch: Partial<CheckoutForm>) => void;
  /** Which fields are wrong right now; each field shows its own once left. */
  errors: CheckoutErrors;
  /** Which fields this form makes compulsory — the asterisks come from here. */
  required: ReadonlySet<CheckoutField>;
};

/**
 * The two things every field takes from the shop's rules, read from the same
 * pair for all of them — so no section can mark a field required while showing
 * another field's complaint.
 */
function marksFor({ errors, required }: SectionProps) {
  return (name: CheckoutField) => ({
    required: required.has(name),
    issue: errors[name],
  });
}

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-hairline border-t pt-8 first:border-t-0 first:pt-0">
      <h2 className="font-serif text-[21px]">{heading}</h2>
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

function BuyerSection(props: SectionProps) {
  const { form, update } = props;
  const field = marksFor(props);

  return (
    <Section heading={copy.buyer.heading}>
      <p className="text-ink-muted -mt-1 text-[12px]">{copy.requiredNote}</p>

      <TextField
        {...field("buyerName")}
        label={copy.buyer.name}
        autoComplete="name"
        value={form.buyerName}
        onValueChange={(buyerName) => update({ buyerName })}
      />
      <TextField
        {...field("buyerPhone")}
        label={copy.buyer.phone}
        hint={copy.buyer.phoneHint}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={form.buyerPhone}
        onValueChange={(buyerPhone) => update({ buyerPhone })}
      />
      <TextField
        {...field("buyerEmail")}
        label={copy.buyer.email}
        hint={copy.buyer.emailHint}
        type="email"
        inputMode="email"
        autoComplete="email"
        value={form.buyerEmail}
        onValueChange={(buyerEmail) => update({ buyerEmail })}
      />
    </Section>
  );
}

/**
 * The two answers the rest of the form hangs off. Both are toggles rather than
 * fields, so neither goes through `Field`.
 */
function DeliverySection({
  form,
  update,
  required,
  fee,
}: SectionProps & { fee: number }) {
  const labelId = useId();
  // The method is a group rather than a field, so its mark and its
  // `aria-required` are drawn from one boolean here instead of by `Field` —
  // which is the whole reason they cannot say different things.
  const methodRequired = required.has("deliveryMethod");

  const notes: Record<DeliveryMethod, string> = {
    envio:
      fee > 0
        ? copy.delivery.envioFee(formatPrice(fee))
        : copy.delivery.envioFree,
    retiro: copy.delivery.retiroNote,
  };
  const labels: Record<DeliveryMethod, string> = {
    envio: copy.delivery.envio,
    retiro: copy.delivery.retiro,
  };

  return (
    <Section heading={copy.delivery.heading}>
      <div>
        <p id={labelId} className="text-[13px]">
          {copy.delivery.methodLabel}
          {methodRequired && <RequiredMark />}
        </p>

        <RadioGroup
          aria-labelledby={labelId}
          aria-required={methodRequired || undefined}
          value={form.deliveryMethod}
          onValueChange={(value: string) => {
            const method = DELIVERY_METHODS.find(
              (candidate) => candidate === value,
            );
            if (method) update({ deliveryMethod: method });
          }}
          className="mt-3 gap-3 sm:grid-cols-2"
        >
          {DELIVERY_METHODS.map((method) => (
            <label
              key={method}
              className={cn(
                "border-hairline-strong flex cursor-pointer items-start gap-3 border p-4",
                form.deliveryMethod === method && "border-ink bg-panel",
              )}
            >
              <RadioGroupItem value={method} className="mt-0.5" />
              <span>
                <span className="block text-[14px]">{labels[method]}</span>
                <span className="text-ink-muted mt-1 block text-[12px] leading-relaxed">
                  {notes[method]}
                </span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div>
        <label className="flex cursor-pointer items-center gap-3 text-[14px]">
          <Checkbox
            checked={form.isGift}
            onCheckedChange={(isGift: boolean) => update({ isGift })}
          />
          {copy.delivery.giftToggle}
        </label>
        <p className="text-ink-muted mt-1.5 pl-7 text-[12px] leading-relaxed">
          {copy.delivery.giftNote}
        </p>
      </div>
    </Section>
  );
}

/**
 * Only on screen when the order is a gift. The recipient's phone is required for
 * a delivery and optional for a pickup, and the hint says which — the courier is
 * the reason it is asked for, and on a pickup there is no courier.
 */
function RecipientSection(props: SectionProps) {
  const { form, update } = props;
  const field = marksFor(props);

  return (
    <Section heading={copy.recipient.heading}>
      <TextField
        {...field("recipientName")}
        label={copy.recipient.name}
        value={form.recipientName}
        onValueChange={(recipientName) => update({ recipientName })}
      />
      <TextField
        {...field("recipientPhone")}
        label={copy.recipient.phone}
        hint={
          form.deliveryMethod === "envio"
            ? copy.recipient.phoneHintDelivery
            : copy.recipient.phoneHintPickup
        }
        type="tel"
        inputMode="tel"
        value={form.recipientPhone}
        onValueChange={(recipientPhone) => update({ recipientPhone })}
      />
    </Section>
  );
}

/** Only on screen for a delivery — a pickup has no address to get wrong. */
function AddressSection(props: SectionProps) {
  const { form, update } = props;
  const field = marksFor(props);

  return (
    <Section heading={copy.address.heading}>
      <TextField
        {...field("address")}
        label={copy.address.address}
        hint={copy.address.addressHint}
        autoComplete="street-address"
        value={form.address}
        onValueChange={(address) => update({ address })}
      />
      <TextField
        label={copy.address.landmark}
        hint={copy.address.landmarkHint}
        value={form.landmark}
        onValueChange={(landmark) => update({ landmark })}
      />
      <TextField
        label={copy.address.zone}
        hint={copy.address.zoneHint}
        value={form.zone}
        onValueChange={(zone) => update({ zone })}
      />
    </Section>
  );
}

function ScheduleSection(props: SectionProps & { today: string }) {
  const { form, update, today } = props;
  const field = marksFor(props);

  return (
    <Section heading={copy.schedule.heading}>
      <TextField
        {...field("date")}
        label={copy.schedule.date}
        hint={copy.schedule.dateHint}
        type="date"
        // Floored at today, so an impossible order cannot be built in the first
        // place. The same boundary is checked again in `validate`, for the
        // browsers that let a date be typed straight past it.
        min={today}
        value={form.date}
        onValueChange={(date) => update({ date })}
      />

      <SelectField
        label={copy.schedule.window}
        value={form.timeWindow}
        onValueChange={(value) =>
          update({
            timeWindow:
              TIME_WINDOWS.find((candidate) => candidate === value) ?? "",
          })
        }
      >
        <option value="">{copy.schedule.windowAny}</option>
        {TIME_WINDOWS.map((window) => (
          <option key={window} value={window}>
            {copy.schedule.windows[window]}
          </option>
        ))}
      </SelectField>

      {form.timeWindow === "otra" && (
        <TextField
          label={copy.schedule.windowNote}
          hint={copy.schedule.windowNoteHint}
          value={form.timeWindowNote}
          onValueChange={(timeWindowNote) => update({ timeWindowNote })}
        />
      )}
    </Section>
  );
}

/** All optional, and the only section where a blank field is an answer. */
function ExtrasSection({ form, update }: SectionProps) {
  return (
    <Section heading={copy.extras.heading}>
      <TextAreaField
        label={copy.extras.cardMessage}
        hint={copy.extras.cardMessageHint}
        note={copy.extras.cardMessageCount(
          form.cardMessage.length,
          MAX_CARD_MESSAGE_LENGTH,
        )}
        maxLength={MAX_CARD_MESSAGE_LENGTH}
        value={form.cardMessage}
        onValueChange={(cardMessage) => update({ cardMessage })}
      />
      <TextField
        label={copy.extras.cardFrom}
        hint={copy.extras.cardFromHint}
        value={form.cardFrom}
        onValueChange={(cardFrom) => update({ cardFrom })}
      />
      <TextAreaField
        label={copy.extras.notes}
        hint={copy.extras.notesHint}
        value={form.notes}
        onValueChange={(notes) => update({ notes })}
      />
    </Section>
  );
}
