"use client";

import { VendorCurrencyEarnings } from "@/hooks/use-vendor-wallet";
import { Amount } from "@/components/pages/app/wallet/amount";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import React, { memo } from "react";

const Stat = ({
  label,
  value,
  note,
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
}) => (
  <div className="min-w-0 rounded-2xl border border-secondary-100 bg-white p-5">
    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
    <p className="mt-2 truncate text-2xl font-bold text-secondary-950">{value}</p>
    {note && <div className="mt-1 text-xs text-muted-foreground">{note}</div>}
  </div>
);

/** Sales against the same number of days before, or nothing for all time. */
const Change = ({ totals, days }: { totals: VendorCurrencyEarnings; days: number }) => {
  const before = totals.previousSales?.amount ?? 0;
  if (!totals.previousSales) return null;
  if (before === 0) {
    return totals.sales.amount > 0 ? <span>No sales in the {days} days before</span> : null;
  }
  const change = Math.round(((totals.sales.amount - before) / before) * 100);
  const up = change >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold",
        up ? "text-emerald-600" : "text-red-600",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {up ? "+" : ""}
      {change}% vs the {days} days before
    </span>
  );
};

/** Sales, tickets, Turnupz's fee and refunds for the period. */
const WalletStats = ({
  totals,
  days,
}: {
  totals: VendorCurrencyEarnings;
  days: number | null;
}) => (
  <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <Stat
      label="Ticket sales"
      value={<Amount value={totals.sales.formatted.withCurrency} />}
      note={days ? <Change totals={totals} days={days} /> : "All time"}
    />
    <Stat
      label="Tickets sold"
      value={totals.ticketsSold.toLocaleString()}
      note={`${totals.eventsCount} event${totals.eventsCount === 1 ? "" : "s"}`}
    />
    <Stat
      label="Turnupz fee"
      value={<Amount value={totals.fees.formatted.withCurrency} />}
      note="Taken at checkout"
    />
    <Stat
      label="Refunded"
      value={<Amount value={totals.refunded.formatted.withCurrency} />}
      note="To buyers · not counted above"
    />
  </section>
);

export default memo(WalletStats);
