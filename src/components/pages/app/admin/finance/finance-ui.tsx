"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TFinanceRange, useFinanceCurrencies } from "@/hooks/use-admin-finance";
import { formatCurrency } from "@/lib/functions";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Download } from "lucide-react";
import React, { memo, useMemo } from "react";
import { create } from "zustand";
import { CalendarPeriodFilter } from "@/components/ui/period-filter";
import SegmentedControl from "@/components/ui/segmented-control";
import {
  calendarPeriodRange,
  DEFAULT_CALENDAR_PERIOD,
  type TCalendarPeriod,
} from "@/lib/periods";

/* ------------------------------------------------------------ the period */

/** Finance keeps calendar periods (this month, last month, this year…): they line up with statements. */
export type TPeriod = TCalendarPeriod;

// Kept while moving between the finance pages, so each opens on the same view.
const useFinanceView = create<{
  currency: string;
  period: TPeriod;
  setCurrency: (currency: string) => void;
  setPeriod: (period: TPeriod) => void;
}>((set) => ({
  currency: "NGN",
  period: DEFAULT_CALENDAR_PERIOD,
  setCurrency: (currency) => set({ currency }),
  setPeriod: (period) => set({ period }),
}));

/** The currency and dates the finance pages show, and their setters. */
export const useFinanceRange = () => {
  const { currency, period, setCurrency, setPeriod } = useFinanceView();
  const range: TFinanceRange = useMemo(
    () => ({ currency, ...calendarPeriodRange(period) }),
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {options.length > 1 && (
          <SegmentedControl
            label="Currency"
            value={currency}
            onChange={setCurrency}
            options={options.map((code) => ({ value: code, label: code }))}
          />
        )}
        <CalendarPeriodFilter value={period} onChange={setPeriod} />
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
        {title && <h2 className="font-semibold text-secondary-950 dark:text-foreground">{title}</h2>}
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
      tone === "warn" ? "border-warning-line bg-warning-soft/60 dark:border-warning/30 dark:bg-warning-solid/10" : "border-border",
    )}
  >
    <p
      className={cn(
        "text-2xs font-semibold tracking-wider uppercase",
        tone === "warn" ? "text-warning dark:text-amber-300" : "text-muted-foreground",
      )}
    >
      {label}
    </p>
    {loading ? (
      <Skeleton className="mt-2 h-7 w-24" />
    ) : (
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-secondary-950 tabular-nums dark:text-foreground">{value}</p>
    )}
    {change !== undefined && change !== null && !loading ? (
      <p
        className={cn(
          "mt-1 inline-flex items-center gap-0.5 text-xs font-semibold",
          change >= 0 ? "text-success dark:text-emerald-400" : "text-danger dark:text-red-400",
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
      tone === "good" && "bg-success-soft text-success dark:bg-success-solid/15 dark:text-emerald-300",
      tone === "warn" && "bg-warning-soft text-warning dark:bg-warning-solid/15 dark:text-amber-300",
      tone === "bad" && "bg-danger-soft text-danger dark:bg-danger-solid/15 dark:text-red-300",
      tone === "info" && "bg-secondary-50 text-secondary-700 dark:bg-white/10 dark:text-foreground",
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
