import { IOrderDetailsType, IOrderRefund } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check } from "lucide-react";
import React, { memo } from "react";

type TStage = { label: string; date?: string; state: "done" | "now" | "next" | "delayed" };

const day = (value?: string | null) => (value ? format(new Date(value), "d MMM") : undefined);

/** Where the refund has got to, as steps the buyer can follow. */
const stagesOf = (refund: IOrderRefund): TStage[] => {
  const approved: TStage = { label: "Refund approved", date: day(refund.requestedAt), state: "done" };
  // All credit: there's nothing to wait for.
  if (refund.toCard.amount <= 0) {
    return [approved, { label: "Back in your Turnupz Credit", date: day(refund.requestedAt), state: "done" }];
  }
  if (refund.status === "failed") {
    return [
      approved,
      { label: "Delayed, we're retrying", state: "delayed" },
      { label: "In your account", state: "next" },
    ];
  }
  if (refund.status === "processing") {
    return [
      approved,
      { label: "Sending to your card", state: "now" },
      { label: "In your account", state: "next" },
    ];
  }
  return [
    approved,
    { label: "Sent to your card", date: day(refund.completedAt ?? refund.requestedAt), state: "done" },
    { label: "In your account in 5–10 working days", state: "now" },
  ];
};

const DOT: Record<TStage["state"], string> = {
  done: "bg-success-solid text-white",
  now: "bg-primary text-white",
  next: "border-2 border-border bg-background",
  delayed: "bg-warning-solid text-white",
};

const Tracker = ({ stages }: { stages: TStage[] }) => (
  <ol className="flex items-start">
    {stages.map((stage, index) => (
      <li key={stage.label} className="relative flex flex-1 flex-col items-center text-center">
        {index > 0 && (
          <span
            aria-hidden
            className={cn(
              "absolute top-3 right-1/2 left-[-50%] h-0.5",
              stage.state === "next" ? "bg-border" : "bg-success-solid",
            )}
          />
        )}
        <span className={cn("relative z-10 flex size-6 items-center justify-center rounded-full", DOT[stage.state])}>
          {stage.state === "done" && <Check className="size-3.5" />}
        </span>
        <span className="mt-1.5 px-1 text-xs font-medium">{stage.label}</span>
        {stage.date && <span className="text-2xs text-muted-foreground">{stage.date}</span>}
      </li>
    ))}
  </ol>
);

/** Every refund on an order: the amounts, the reason, and where it's got to. */
const OrderRefunds: React.FC<{
  order: Pick<IOrderDetailsType, "refunds" | "status">;
}> = ({ order }) => {
  const refunds = order.refunds ?? [];
  if (!refunds.length) return null;
  return (
    <section className="space-y-5 rounded-2xl border bg-card p-4 sm:p-6">
      <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
        Your refund{refunds.length > 1 ? "s" : ""}
      </h2>
      {refunds.map((refund, index) => (
        <div key={index} className="space-y-3">
          <p className="font-semibold">
            {refund.tickets} ticket{refund.tickets === 1 ? "" : "s"}
            {refund.kind === "event_cancelled" ? " · event cancelled" : ""}
          </p>
          <Tracker stages={stagesOf(refund)} />
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
            {refund.toCard.amount > 0 && (
              <>
                <dt className="text-muted-foreground">To your card</dt>
                <dd className="text-right font-semibold">{refund.toCard.formatted.withCurrency}</dd>
              </>
            )}
            {refund.asCredit.amount > 0 && (
              <>
                <dt className="text-muted-foreground">As Turnupz Credit</dt>
                <dd className="text-right font-semibold">{refund.asCredit.formatted.withCurrency}</dd>
              </>
            )}
            {!!refund.feeKept?.amount && (
              <>
                <dt className="text-muted-foreground">Booking fee, not refunded</dt>
                <dd className="text-right">{refund.feeKept.formatted.withCurrency}</dd>
              </>
            )}
            {!!refund.reason && (
              <>
                <dt className="text-muted-foreground">Reason</dt>
                <dd className="text-right">{refund.reason}</dd>
              </>
            )}
          </dl>
        </div>
      ))}
    </section>
  );
};

export default memo(OrderRefunds);
