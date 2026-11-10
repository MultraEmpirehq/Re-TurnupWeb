import { cn } from "@/lib/utils";
import { ArrowDown, ArrowRight, RotateCw } from "lucide-react";
import React, { memo } from "react";

type TStep = { title: string; detail?: string; tone?: "default" | "good" | "warn" | "bad" | "muted" };

const TONE: Record<NonNullable<TStep["tone"]>, string> = {
  default: "border-border bg-card",
  good: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  warn: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  bad: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
  muted: "border-dashed border-border bg-muted/40",
};

const Step = ({ step, n }: { step: TStep; n?: number }) => (
  <div className={cn("min-w-0 flex-1 rounded-lg border p-3", TONE[step.tone ?? "default"])}>
    <p className="flex items-center gap-2 text-sm font-semibold">
      {n !== undefined && (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] text-background">
          {n}
        </span>
      )}
      {step.title}
    </p>
    {step.detail && <p className="mt-1 text-xs opacity-80">{step.detail}</p>}
  </div>
);

/** A row of steps joined by arrows: across on wide screens, down on narrow ones. */
const Row = ({ steps, numbered }: { steps: TStep[]; numbered?: boolean }) => (
  <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
    {steps.map((step, index) => (
      <React.Fragment key={step.title}>
        {index > 0 && (
          <>
            <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground md:block" />
            <ArrowDown className="mx-auto size-4 shrink-0 text-muted-foreground md:hidden" />
          </>
        )}
        <Step step={step} n={numbered ? index + 1 : undefined} />
      </React.Fragment>
    ))}
  </div>
);

const Lane = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
    {children}
  </div>
);

/**
 * The refund flow, drawn: what an admin does, what happens at once, and how the
 * card part travels to the buyer. Plus the two other ways money goes back.
 */
const RefundFlow = () => (
  <section className="space-y-5 rounded-xl border border-border bg-card p-5">
    <h2 className="font-semibold">Refund flow</h2>

    <Lane label="Refund an order (admin here, or the organiser from their orders)">
      <Row
        numbered
        steps={[
          { title: "Find the order", detail: "Reference or buyer email" },
          { title: "Pick tickets", detail: "Some or all; scanned tickets can't be refunded" },
          { title: "Check the preview", detail: "To card · as credit · fee kept · from organiser" },
          { title: "Reason and confirm", detail: "The buyer sees the reason. Can't be undone" },
        ]}
      />
    </Lane>

    <Lane label="At once">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Step step={{ title: "Tickets cancelled", detail: "Stop working; places back on sale; pending transfers cancelled" }} />
        <Step step={{ title: "Credit returned", detail: "Credit part back as Turnupz Credit, never cash" }} />
        <Step step={{ title: "Booking fee kept", detail: "Taken from the card part first" }} />
        <Step step={{ title: "Organiser deducted", detail: "Their earnings on these tickets come back" }} />
        <Step step={{ title: "Tax and rewards reversed", detail: "Tax on the refunded part; referral rewards cancelled" }} />
        <Step step={{ title: "Buyer notified", detail: "Notification and email; refund shows on their order" }} />
      </div>
    </Lane>

    <Lane label="Card part">
      <Row
        steps={[
          { title: "Sent to provider", detail: "Flutterwave or Stripe" },
          { title: "Processing", detail: "Waiting for the provider", tone: "muted" },
          { title: "Completed", detail: "Lands on the buyer's statement in 5–10 working days", tone: "good" },
        ]}
      />
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:pl-[calc(33%+0.5rem)]">
        <Step step={{ title: "Failed", detail: "Provider refused; the message says why", tone: "bad" }} />
        <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground md:block" />
        <ArrowDown className="mx-auto size-4 shrink-0 text-muted-foreground md:hidden" />
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border p-3 text-sm font-semibold">
          <RotateCw className="size-4 shrink-0" />
          Retry from Refund history
        </div>
      </div>
    </Lane>

    <div className="grid gap-4 md:grid-cols-3">
      <Lane label="Event cancelled">
        <Row
          steps={[
            { title: "Cancel event", detail: "Here, or approve the organiser's request" },
            { title: "Every order refunded", detail: "In full, booking fee included", tone: "good" },
          ]}
        />
      </Lane>
      <Lane label="Chargeback">
        <Row
          steps={[
            { title: "Mark disputed", detail: "The bank already took the money" },
            { title: "Tickets cancelled", detail: "Nothing sent back; organiser earnings and rewards recovered", tone: "warn" },
          ]}
        />
      </Lane>
      <Lane label="Organiser refunds in Stripe">
        <Row
          steps={[
            { title: "Refunded in Stripe", detail: "From the organiser's own Stripe balance" },
            { title: "Recorded here", detail: "Full refund: unused tickets cancelled, buyer told. Partial: money only", tone: "warn" },
          ]}
        />
      </Lane>
    </div>
  </section>
);

export default memo(RefundFlow);
