"use client";

import { Button } from "@/components/ui/button";
import { useVendorPayoutHistory, useVendorWallet } from "@/hooks/use-vendor-wallet";
import {
  ArrowLeft,
  Globe2,
  Landmark,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";
import { PriceDetailsType } from "@/lib/types";

const moneyFormatter = (money: PriceDetailsType | number, currency = "USD") => {
  if (typeof money !== "number" && money.formatted?.withCurrency) {
    return money.formatted.withCurrency;
  }
  const amount = typeof money === "number" ? money : Number(money?.amount ?? 0);
  const locale = typeof money !== "number" ? money.currency?.locale : "en-US";
  const code = typeof money !== "number" ? money.currency?.code : currency;
  return new Intl.NumberFormat(locale || "en-US", {
    style: "currency",
    currency: code || currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const TreasuryPage = () => {
  const { data: wallet } = useVendorWallet();
  const { data: payouts = [] } = useVendorPayoutHistory();
  const currency = wallet?.balances.currency ?? "USD";
  const configuredCards = wallet?.savedCards.length ?? 0;
  const payoutMethods = new Set(payouts.map((payout) => payout.method).filter(Boolean));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-secondary-400">
            Treasury Review
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-secondary-950 md:text-[2.35rem]">
            Review wallet treasury controls
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary-500">
            See how your vendor wallet is distributed across payouts, reserves,
            cards, and international movement before you release more funds.
          </p>
        </div>

        <Button asChild variant="outline" className="rounded-full border-secondary-100">
          <Link href="/app/wallet">
            <ArrowLeft className="mr-2 size-4" />
            Back to Wallet
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: WalletCards,
            title: "Liquidity Ready",
            value: moneyFormatter(wallet?.balances.availableBalance ?? 0, currency),
            text: "Available for withdrawal and transfer release.",
          },
          {
            icon: ShieldCheck,
            title: "Protected Reserve",
            value: moneyFormatter(wallet?.balances.reservedBalance ?? 0, currency),
            text: "Held for payout checks, refunds, and disputes.",
          },
          {
            icon: Globe2,
            title: "Cross-Border Capacity",
            value: `${payoutMethods.size} routes`,
            text: "Active payout routes used for recent settlement activity.",
          },
          {
            icon: Landmark,
            title: "Settlement Accounts",
            value: `${configuredCards} cards`,
            text: "Saved payment methods available for wallet operations.",
          },
        ].map((item) => (
          <section
            key={item.title}
            className="rounded-[1.6rem] border border-secondary-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
          >
            <span className="inline-flex rounded-2xl bg-secondary-50 p-3 text-secondary-700">
              <item.icon className="size-5" />
            </span>
            <p className="mt-5 text-sm text-secondary-500">{item.title}</p>
            <p className="mt-2 text-2xl font-bold text-secondary-950">{item.value}</p>
            <p className="mt-3 text-xs leading-5 text-secondary-400">{item.text}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <h2 className="text-xl font-semibold text-secondary-950">
            Treasury checkpoints
          </h2>
          <div className="mt-5 space-y-4">
            {[
              "Review reserve thresholds before releasing high-volume event earnings.",
              "Confirm destination account and country rails before submitting international payouts.",
              "Rotate saved cards and settlement methods periodically for cleaner treasury hygiene.",
              "Export wallet reports regularly for finance, tax, and partner reconciliation.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.1rem] bg-secondary-50 px-4 py-4 text-sm leading-6 text-secondary-600"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.8rem] bg-secondary-900 p-6 text-white shadow-[0_20px_55px_rgba(15,23,42,0.18)]">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-white/60">
            Treasury Note
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            Keep treasury controls ready before every payout
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/75">
            Review balances, reserves, saved payment methods, and payout routes
            before releasing funds to banks, venues, teams, or collaborators.
          </p>
        </section>
      </div>
    </div>
  );
};

export default memo(TreasuryPage);
