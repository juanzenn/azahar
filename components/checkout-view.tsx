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
import { CopyButton } from "@/components/copy-button";
import { OrderSummary } from "@/components/order-summary";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import {
  DELIVERY_METHODS,
  EMPTY_FORM,
  MAX_CARD_MESSAGE_LENGTH,
  PAYMENT_METHODS,
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
import type { PaymentRail } from "@/lib/payment";
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
 * `lib/order`'s, and it is decided once for the asterisks, the errors, the total
 * and the submit gate alike. Which rails exist and what each of them is paid
 * through is `lib/payment`'s, arriving as data. What this island owns is the
 * wiring: which blocks are on screen, which figures the summary is showing, and
 * the two guards that keep a customer out of a form that cannot lead anywhere.
 *
 * **The submit gate is not a second opinion.** It asks `validate` whether
 * anything is wrong and nothing else — so the button cannot be enabled while an
 * asterisk goes unanswered, and cannot be disabled for a reason no field is
 * showing. Where it *leads* is the next slice: building the message and opening
 * WhatsApp belongs to dispatch.
 */
export function CheckoutView({
  products,
  deliveryFeeUsdCents,
  rails,
}: {
  products: Product[];
  /** Flat and the shop's to set, so it arrives from config rather than a literal. */
  deliveryFeeUsdCents: number;
  /** The rails the shop has switched on, already resolved from config. */
  rails: PaymentRail[];
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

  const errors = validate(form, today);
  const section = { form, update, errors, required: requiredFields(form) };

  // Nothing left unanswered — which is the only question the button asks, and
  // the same answer every asterisk on the page was drawn from.
  const submittable = Object.keys(errors).length === 0;

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
          <PaymentSection {...section} rails={rails} />
          <Submit ready={submittable} />
        </div>
      </form>

      {/* Sticky beside the form on a desktop. On a phone it stacks below, which
          is where the exact total is wanted anyway: directly above the payment
          instructions, so the figure being transferred is on screen while the
          account details are being read. */}
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

/**
 * How the customer is paying, and the proof of it.
 *
 * **One rail's details, never five.** A column of five account blocks is a
 * customer scanning past four sets of numbers looking for theirs, on a phone,
 * with a banking app open in the other window — so choosing a rail is what
 * reveals one.
 *
 * Which rails exist and which fields each of them needs arrives as data, so
 * nothing here branches per rail — the single exception is cash, which asks a
 * different question rather than a differently-worded one, and is named once
 * below. Whether the answer is compulsory is still the shop's rules' to say.
 */
function PaymentSection(props: SectionProps & { rails: PaymentRail[] }) {
  const { form, update, required, rails } = props;
  const labelId = useId();

  // A group rather than a field, like the delivery method, so its mark and its
  // `aria-required` are drawn from one boolean here.
  const methodRequired = required.has("paymentMethod");
  const chosen = rails.find((rail) => rail.method === form.paymentMethod);

  return (
    <Section heading={copy.payment.heading}>
      <p className="text-ink-muted -mt-1 text-[12px] leading-relaxed">
        {copy.payment.intro}
      </p>

      <div>
        <p id={labelId} className="text-[13px]">
          {copy.payment.methodLabel}
          {methodRequired && <RequiredMark />}
        </p>

        <RadioGroup
          aria-labelledby={labelId}
          aria-required={methodRequired || undefined}
          value={form.paymentMethod}
          onValueChange={(value: string) => {
            const method = PAYMENT_METHODS.find(
              (candidate) => candidate === value,
            );
            if (method) update({ paymentMethod: method });
          }}
          className="mt-3 gap-2"
        >
          {rails.map((rail) => (
            <label
              key={rail.method}
              className={cn(
                "border-hairline-strong flex cursor-pointer items-center gap-3 border px-4 py-3 text-[14px]",
                form.paymentMethod === rail.method && "border-ink bg-panel",
              )}
            >
              <RadioGroupItem value={rail.method} />
              {rail.label}
            </label>
          ))}
        </RadioGroup>
      </div>

      {chosen && (
        <>
          <AccountBlock rail={chosen} />

          {/* The two halves of one question — what proof is there of payment —
              and the only place this island names a rail. Every other rail is
              paid before the order is sent and leaves a reference behind; cash
              is handed over on arrival and leaves the shop a different problem,
              which is having the right notes on them. */}
          {chosen.method === "efectivo" ? (
            <CashQuestions {...props} />
          ) : (
            <ReferenceBlock {...props} />
          )}
        </>
      )}
    </Section>
  );
}

/** The proof of a payment already made, and what to do with the receipt. */
function ReferenceBlock(props: SectionProps) {
  const { form, update } = props;
  const field = marksFor(props);

  return (
    <div className="grid gap-4">
      <TextField
        {...field("reference")}
        label={copy.payment.reference}
        hint={copy.payment.referenceHint}
        value={form.reference}
        onValueChange={(reference) => update({ reference })}
      />

      {/* A deep-link cannot attach an image, so the customer is told whose job
          the screenshot is before they leave for WhatsApp. */}
      <p className="border-hairline bg-panel text-ink-muted border p-4 text-[12px] leading-relaxed">
        {copy.payment.receiptNote}
      </p>
    </div>
  );
}

/**
 * What cash needs instead: whether the shop has to bring change, and for what
 * note. Optional — most customers have the amount — so it is a toggle rather
 * than a field nobody has an answer to.
 */
function CashQuestions(props: SectionProps) {
  const { form, update } = props;
  const field = marksFor(props);

  return (
    <div className="grid gap-4">
      <label className="flex cursor-pointer items-center gap-3 text-[14px]">
        <Checkbox
          checked={form.needsChange}
          onCheckedChange={(needsChange: boolean) => update({ needsChange })}
        />
        {copy.payment.changeToggle}
      </label>

      {form.needsChange && (
        <TextField
          {...field("changeAmount")}
          label={copy.payment.changeAmount}
          hint={copy.payment.changeAmountHint}
          inputMode="decimal"
          value={form.changeAmount}
          onValueChange={(changeAmount) => update({ changeAmount })}
        />
      )}
    </div>
  );
}

/** The chosen rail's account details, each copyable. Empty for efectivo. */
function AccountBlock({ rail }: { rail: PaymentRail }) {
  return (
    <div className="border-hairline bg-panel border p-5">
      <p className="text-ink-muted text-[12px] leading-relaxed">
        {rail.instruction}
      </p>

      {rail.details.length > 0 && (
        <dl className="mt-4 grid gap-3">
          {rail.details.map((detail) => (
            <div
              key={detail.label}
              className="border-hairline flex items-center justify-between gap-4 border-t pt-3 first:border-t-0 first:pt-0"
            >
              <div className="min-w-0">
                <dt className="text-ink-muted text-[11px] tracking-[0.14em] uppercase">
                  {detail.label}
                </dt>
                <dd className="mt-1 text-[15px] break-all tabular-nums">
                  {detail.value}
                </dd>
              </div>
              <CopyButton label={detail.label} value={detail.value} />
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/**
 * The last control on the page, and the only one that is ever unavailable.
 *
 * Disabled rather than allowed-then-refused: the customer is about to leave for
 * WhatsApp, and a button that opens a chat with half an order in it is worse
 * than one that waits. The line underneath is why it is off — a dead button with
 * no explanation is the same dead end the asterisks exist to prevent.
 */
function Submit({ ready }: { ready: boolean }) {
  return (
    <div className="border-hairline border-t pt-8">
      {/* Dispatch — the message, the order code and the deep-link — is the next
          slice. The gate is here because it is what the payment state decides. */}
      <button
        type="submit"
        disabled={!ready}
        className="bg-primary text-primary-foreground w-full cursor-pointer px-9 py-4 text-sm tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copy.payment.submit}
      </button>

      {/* Only when it is off. What pressing it does is dispatch's to promise,
          and there is nothing to say about a button that is ready to press. */}
      {!ready && (
        <p className="text-ink-muted mt-3 text-center text-[12px] leading-relaxed">
          {copy.payment.submitBlocked}
        </p>
      )}
    </div>
  );
}
