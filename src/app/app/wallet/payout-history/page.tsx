"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Banknote, Clock3, Download, Landmark } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";

const payoutRows = [
  {
    id: "PO-10021",
    date: "Apr 22, 2026",
    method: "Bank Transfer",
    amount: "NGN 420,000",
    fee: "NGN 1,500",
    net: "NGN 418,500",
    status: "Completed",
  },
  {
    id: "PO-10016",
    date: "Apr 18, 2026",
    method: "Instant Cashout",
    amount: "NGN 180,000",
    fee: "NGN 1,500",
    net: "NGN 178,500",
    status: "Processing",
  },
  {
    id: "PO-10009",
    date: "Apr 10, 2026",
    method: "Vendor Wallet",
    amount: "NGN 250,000",
    fee: "NGN 0",
    net: "NGN 250,000",
    status: "Completed",
  },
];

const PayoutHistoryPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-secondary-400">
            Wallet History
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-secondary-950 md:text-[2.35rem]">
            Review payout history
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary-500">
            Track every withdrawal request, payout method, and net settlement
            from your vendor wallet.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full border-secondary-100">
            <Link href="/app/wallet">
              <ArrowLeft className="mr-2 size-4" />
              Back to Wallet
            </Link>
          </Button>
          <Button className="rounded-full bg-primary text-white hover:bg-primary/90">
            <Download className="mr-2 size-4" />
            Export Payouts
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Banknote,
            label: "Total Paid Out",
            value: "NGN 848,500",
          },
          {
            icon: Clock3,
            label: "Pending Review",
            value: "NGN 180,000",
          },
          {
            icon: Landmark,
            label: "Primary Method",
            value: "Bank Transfer",
          },
        ].map((item) => (
          <section
            key={item.label}
            className="rounded-[1.6rem] border border-secondary-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-secondary-500">{item.label}</p>
                <p className="mt-3 text-2xl font-bold text-secondary-950">{item.value}</p>
              </div>
              <span className="rounded-2xl bg-secondary-50 p-3 text-secondary-700">
                <item.icon className="size-5" />
              </span>
            </div>
          </section>
        ))}
      </div>

      <section className="overflow-hidden rounded-[1.8rem] border border-secondary-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="border-b border-secondary-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-secondary-950">
            Payout timeline
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-secondary-50 text-xs uppercase tracking-[0.18em] text-secondary-400">
              <tr>
                <th className="px-6 py-4">Payout ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Fee</th>
                <th className="px-6 py-4">Net</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {payoutRows.map((row) => (
                <tr key={row.id} className="border-t border-secondary-100">
                  <td className="px-6 py-5 text-sm font-semibold text-secondary-950">
                    {row.id}
                  </td>
                  <td className="px-6 py-5 text-sm text-secondary-500">{row.date}</td>
                  <td className="px-6 py-5 text-sm text-secondary-500">{row.method}</td>
                  <td className="px-6 py-5 text-sm text-secondary-950">{row.amount}</td>
                  <td className="px-6 py-5 text-sm text-secondary-500">{row.fee}</td>
                  <td className="px-6 py-5 text-sm font-semibold text-secondary-950">
                    {row.net}
                  </td>
                  <td className="px-6 py-5">
                    <span className="rounded-full bg-secondary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-500">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default memo(PayoutHistoryPage);
