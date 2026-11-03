"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { VendorPayout } from "@/hooks/use-vendor-wallet";
import { cn } from "@/lib/utils";
import { Amount } from "@/components/pages/app/wallet/amount";
import { format } from "date-fns";
import { Check, Clock, X } from "lucide-react";
import React, { memo } from "react";

export const payoutMoney = (amount: number | null, currency: string) =>
  amount === null
    ? "—"
    : new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency,
        // ₦ for naira; CA$ keeps Canadian dollars apart from US ones.
        currencyDisplay: currency === "NGN" ? "narrowSymbol" : "symbol",
      }).format(amount);

/** Paid, failed, or still on its way to the bank. */
export const payoutState = (status: string) => {
  const value = status.toLowerCase();
  if (value === "completed" || value === "successful") return "paid" as const;
  if (value === "failed") return "failed" as const;
  return "pending" as const;
};

const STATE = {
  paid: { label: "Paid", icon: Check, tone: "bg-emerald-50 text-emerald-700" },
  pending: { label: "On its way", icon: Clock, tone: "bg-amber-50 text-amber-700" },
  failed: { label: "Didn't go through", icon: X, tone: "bg-red-50 text-red-700" },
};

/** Flutterwave's payouts to the organiser's bank: what was paid in and when. */
const PayoutsList = ({
  payouts,
  loading,
  bankLabel,
}: {
  payouts: VendorPayout[];
  loading: boolean;
  /** "Access Bank ••0031", shown on paid rows. */
  bankLabel?: string | null;
}) => (
  <section className="rounded-[1.5rem] border border-secondary-100 bg-white p-5 md:p-6">
    <h2 className="text-base font-bold text-secondary-950">Payouts to your bank</h2>
    <p className="mt-1 text-xs text-muted-foreground">
      Paid by Flutterwave after its fees and any refunds.
    </p>
    {loading ? (
      <div className="mt-4 space-y-3">
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-12 rounded-2xl" />
      </div>
    ) : !payouts.length ? (
      <p className="mt-4 rounded-2xl bg-secondary-50 px-4 py-3 text-sm text-muted-foreground">
        No payouts yet. Once your tickets sell, each payout shows here with when it reaches your
        bank.
      </p>
    ) : (
      <ul className="mt-4 space-y-4">
        {payouts.slice(0, 6).map((payout) => {
          const state = STATE[payoutState(payout.status)];
          const Icon = state.icon;
          const date = payout.paidAt
            ? format(new Date(payout.paidAt), "d MMM yyyy")
            : payout.dueDate
              ? `Expected ${format(new Date(payout.dueDate), "d MMM")}`
              : "";
          return (
            <li key={payout.id} className="flex items-center gap-3 text-sm">
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", state.tone)}>
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-secondary-950">
                  <Amount value={payoutMoney(payout.net, payout.currency)} />
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {date}
                  {payout.paidAt && bankLabel ? ` · ${bankLabel}` : ""}
                  {payout.transactions ? ` · ${payout.transactions} payments` : ""}
                </p>
              </div>
              <span
                className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", state.tone)}
              >
                {state.label}
              </span>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

export default memo(PayoutsList);
