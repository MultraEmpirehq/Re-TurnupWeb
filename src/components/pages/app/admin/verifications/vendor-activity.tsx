"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { IVerificationReview } from "@/hooks/use-admin-verifications";
import { cn } from "@/lib/utils";
import React from "react";

const Stat: React.FC<{ label: string; value: number; warn?: boolean }> = ({
  label,
  value,
  warn,
}) => (
  <div className="rounded-lg bg-muted/60 px-3 py-2.5">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p
      className={cn(
        "text-lg font-semibold tabular-nums",
        warn && value > 0 && "text-amber-700",
      )}
    >
      {value.toLocaleString()}
    </p>
  </div>
);

/** What the vendor has already done on Turnupz, as context for the decision. */
const VendorActivity: React.FC<{
  review?: IVerificationReview;
  isLoading: boolean;
}> = ({ review, isLoading }) => {
  if (isLoading) return <Skeleton className="h-36 w-full rounded-xl" />;
  if (!review) return null;
  const { events, ticketsSold, paidOrders, reports } = review.activity;

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">Activity so far</h2>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Events" value={events.total} />
        <Stat label="Published" value={events.published} />
        <Stat label="Tickets issued" value={ticketsSold} />
        <Stat label="Paid orders" value={paidOrders} />
        <Stat label="Reports on events" value={reports.total} warn />
        <Stat label="Suspended events" value={events.suspended} warn />
      </div>
      {reports.open > 0 && (
        <p className="text-xs text-amber-700">
          {reports.open} report{reports.open === 1 ? " is" : "s are"} still
          open on their events.
        </p>
      )}
    </section>
  );
};

export default VendorActivity;
