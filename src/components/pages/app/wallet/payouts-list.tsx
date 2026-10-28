"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useVendorPayouts } from "@/hooks/use-vendor-wallet";
import { format } from "date-fns";
import { Banknote } from "lucide-react";
import React, { memo } from "react";

const money = (amount: number | null, currency: string) =>
  amount === null
    ? "—"
    : new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);

const STATUS_LABEL: Record<string, string> = {
  completed: "Paid",
  successful: "Paid",
  pending: "On its way",
  processing: "On its way",
  failed: "Didn't go through",
};

/** Flutterwave's payouts to the organiser's bank: what was paid in and when. */
const PayoutsList = () => {
  const payouts = useVendorPayouts(true);
  const rows = payouts.data ?? [];
  return (
    <section className="rounded-[1.5rem] border border-secondary-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="mb-3 flex items-center gap-3">
        <span className="rounded-2xl bg-secondary-50 p-3 text-secondary-700">
          <Banknote className="size-5" />
        </span>
        <div>
          <p className="text-lg font-semibold text-secondary-950">Payouts to your bank</p>
          <p className="text-sm text-secondary-500">
            Paid by Flutterwave on its usual schedule, after fees and any refunds.
          </p>
        </div>
      </div>
      {payouts.isLoading ? (
        <Skeleton className="h-16 rounded-2xl" />
      ) : !rows.length ? (
        <p className="rounded-2xl bg-secondary-50 px-4 py-3 text-sm text-secondary-500">
          No payouts yet. Once your tickets sell, each payout shows here with when it reaches your bank.
        </p>
      ) : (
        <ul className="divide-y divide-secondary-100">
          {rows.map((payout) => (
            <li key={payout.id} className="flex items-center justify-between gap-4 py-3">
              <span>
                <span className="block font-semibold text-secondary-950">
                  {money(payout.net, payout.currency)}
                </span>
                <span className="block text-xs text-secondary-500">
                  {payout.transactions ? `${payout.transactions} payments · ` : ""}
                  {payout.fees ? `${money(payout.fees, payout.currency)} fees` : "No fees"}
                  {payout.refunds ? ` · ${money(payout.refunds, payout.currency)} refunds` : ""}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-semibold text-secondary-800">
                  {STATUS_LABEL[payout.status.toLowerCase()] ?? payout.status}
                </span>
                <span className="block text-xs text-secondary-500">
                  {payout.paidAt
                    ? format(new Date(payout.paidAt), "d MMM yyyy")
                    : payout.dueDate
                      ? `Due ${format(new Date(payout.dueDate), "d MMM yyyy")}`
                      : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default memo(PayoutsList);
