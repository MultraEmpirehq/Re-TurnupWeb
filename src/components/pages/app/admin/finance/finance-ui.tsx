"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TFinanceRange, useFinanceCurrencies } from "@/hooks/use-admin-finance";
import { formatCurrency } from "@/lib/functions";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Download } from "lucide-react";
import React, { memo, useMemo } from "react";
import { create } from "zustand";

/* ------------------------------------------------------------ the period */

export type TPeriod =
  | "this_month"
  | "last_month"
  | "last_30"
  | "last_90"
  | "this_year"
  | "last_12_months";

const PERIODS: { value: TPeriod; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_30", label: "Last 30 days" },
  { value: "last_90", label: "Last 90 days" },
  { value: "this_year", label: "This year" },
  { value: "last_12_months", label: "Last 12 months" },
];

const DAY = 24 * 60 * 60 * 1000;

/** The dates a period covers, ending now (or at the end of last month). */
export const periodRange = (period: TPeriod, now = new Date()) => {
  const start = (year: number, month: number) => new Date(year, month, 1);
  switch (period) {
    case "last_month": {
      const from = start(now.getFullYear(), now.getMonth() - 1);
      const to = new Date(start(now.getFullYear(), now.getMonth()).getTime() - 1);
      return { from, to };
    }
    case "last_30":
      return { from: new Date(now.getTime() - 30 * DAY), to: now };
    case "last_90":
      return { from: new Date(now.getTime() - 90 * DAY), to: now };
    case "this_year":
      return { from: start(now.getFullYear(), 0), to: now };
    case "last_12_months":
      return { from: start(now.getFullYear(), now.getMonth() - 11), to: now };
    default:
      return { from: start(now.getFullYear(), now.getMonth()), to: now };
  }
};

// Kept while moving between the finance pages, so each opens on the same view.
const useFinanceView = create<{
  currency: string;
  period: TPeriod;
  setCurrency: (currency: string) => void;
  setPeriod: (period: TPeriod) => void;
}>((set) => ({
  currency: "NGN",
  period: "this_month",
  setCurrency: (currency) => set({ currency }),
  setPeriod: (period) => set({ period }),
}));

/** The currency and dates the finance pages show, and their setters. */
export const useFinanceRange = () => {
  const { currency, period, setCurrency, setPeriod } = useFinanceView();
  const range: TFinanceRange = useMemo(
    () => ({ currency, ...periodRange(period) }),
    // Recomputed when the choice changes, not on every render (which would
    // move "now" and refetch).
    [currency, period],
  );
  return { range, currency, period, setCurrency, setPeriod };
};

/* ---------------------------------------------------------------- money */

/** ₦48,200.00 */
export const money = (amount: number, currency: string) => formatCurrency(amount, currency);

/** ₦48.2m, for headline numbers. */
export const compactMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: amount !== 0 && Math.abs(amount) < 1_000 ? 0 : 1,
    }).format(amount);
  } catch {
    return money(amount, currency);
  }
};

/* --------------------------------------------------------------- export */

/** Saves rows as a CSV file the browser downloads. */
export const downloadCsv = (filename: string, rows: (string | number | null | undefined)[][]) => {
  const cell = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  // A byte-order mark so Excel reads ₦ and names in any language correctly.
  const csv = `﻿${rows.map((row) => row.map(cell).join(",")).join("\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/* ----------------------------------------------------------------- page */

/** Title, the line under it, and the currency, period and export controls. */
export const FinanceHeader: React.FC<{
  title: string;
  description: string;
  onExport?: () => void;
  exporting?: boolean;
}> = ({ title, description, onExport, exporting }) => {
  const { currency, period, setCurrency, setPeriod } = useFinanceRange();
  const { data: currencies = ["NGN"] } = useFinanceCurrencies();
  const options = currencies.includes(currency) ? currencies : [currency, ...currencies];
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-secondary-800">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {options.length > 1 && (
          <div className="inline-flex rounded-full border border-border bg-card p-1" role="group" aria-label="Currency">
            {options.map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={code === currency}
                onClick={() => setCurrency(code)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  code === currency ? "bg-secondary-800 text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {code}
              </button>
            ))}
          </div>
        )}
        <Select value={period} onValueChange={(value) => setPeriod(value as TPeriod)}>
          <SelectTrigger className="h-9 w-[150px] rounded-full bg-card text-xs font-semibold" aria-label="Period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full bg-card text-xs font-semibold"
            onClick={onExport}
            loading={exporting}
          >
            <Download className="size-3.5" aria-hidden />
            Export CSV
          </Button>
        )}
      </div>
    </div>
  );
};

export const FinanceCard: React.FC<{
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ title, action, className, children }) => (
  <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        {title && <h2 className="font-semibold text-secondary-950">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
);

/** One headline number. `tone="warn"` for money owed or something to sort out. */
export const Stat: React.FC<{
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  change?: number | null;
  tone?: "warn";
  loading?: boolean;
}> = memo(({ label, value, note, change, tone, loading }) => (
  <div
    className={cn(
      "rounded-xl border bg-card p-4",
      tone === "warn" ? "border-amber-200 bg-amber-50/60" : "border-border",
    )}
  >
    <p
      className={cn(
        "text-[11px] font-semibold tracking-wider uppercase",
        tone === "warn" ? "text-amber-700" : "text-muted-foreground",
      )}
    >
      {label}
    </p>
    {loading ? (
      <Skeleton className="mt-2 h-7 w-24" />
    ) : (
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-secondary-950 tabular-nums">{value}</p>
    )}
    {change !== undefined && change !== null && !loading ? (
      <p
        className={cn(
          "mt-1 inline-flex items-center gap-0.5 text-xs font-semibold",
          change >= 0 ? "text-emerald-600" : "text-red-600",
        )}
      >
        {change >= 0 ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
        {Math.abs(change)}% vs the period before
      </p>
    ) : note ? (
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    ) : null}
  </div>
));
Stat.displayName = "Stat";

export const Pill: React.FC<{ tone: "good" | "warn" | "bad" | "muted" | "info"; children: React.ReactNode }> = ({
  tone,
  children,
}) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
      tone === "good" && "bg-emerald-50 text-emerald-700",
      tone === "warn" && "bg-amber-50 text-amber-800",
      tone === "bad" && "bg-red-50 text-red-700",
      tone === "info" && "bg-secondary-50 text-secondary-700",
      tone === "muted" && "bg-muted text-muted-foreground",
    )}
  >
    {children}
  </span>
);

export const PROVIDER_LABEL: Record<string, string> = {
  PAYSTACK: "Paystack",
  FLUTTERWAVE: "Flutterwave",
  STRIPE: "Stripe",
};

/** "Oct 2026" from "2026-10". */
export const monthLabel = (month: string, style: "short" | "long" = "short") => {
  const [year, index] = month.split("-").map(Number);
  return new Date(year, index - 1, 1).toLocaleDateString("en-GB", {
    month: style === "long" ? "long" : "short",
    year: style === "long" ? "numeric" : undefined,
  });
};
