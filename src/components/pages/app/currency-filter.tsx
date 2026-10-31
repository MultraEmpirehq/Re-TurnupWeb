"use client";

import {
  VendorTicketAnalyticsApiRecord,
  VendorTicketRevenueByCurrency,
} from "@/hooks/use-vendor-tickets";
import { IEventDetailsType, PriceDetailsType } from "@/lib/types";
import { cn } from "@/lib/utils";
import React, { memo, useEffect, useMemo, useState } from "react";
import { moneyLocale } from "@/lib/currency";

/** Everything, or only what's priced in one currency. */
export const ALL_CURRENCIES = "ALL";

/** Shared by the dashboard and analysis, and kept per browser. */
const FILTER_KEY = "turnupz-dashboard-currency";

const readSaved = () => {
  try {
    return localStorage.getItem(FILTER_KEY);
  } catch {
    return null;
  }
};

/** A currency's total, ready to show. */
export type TCurrencyTotal = { code: string; amount: number; formatted: string };

const moneyCode = (value?: PriceDetailsType | number) =>
  typeof value === "number" ? undefined : value?.currency?.code?.toUpperCase();

const moneyAmount = (value?: PriceDetailsType | number) =>
  typeof value === "number" ? value : Number(value?.amount ?? 0);

/** One total per currency, from the analytics' revenue breakdown. */
export const currencyTotals = (
  revenueByCurrency: VendorTicketRevenueByCurrency[],
  fallback: { code: string; locale?: string },
): TCurrencyTotal[] => {
  const totals = new Map<string, TCurrencyTotal>();
  for (const item of revenueByCurrency) {
    const code = (
      moneyCode(item.revenue) ||
      item.currency?.code ||
      item.currencyCode ||
      fallback.code
    ).toUpperCase();
    const amount = item.revenue ? moneyAmount(item.revenue) : Number(item.amount ?? 0);
    const formatted =
      (typeof item.revenue !== "number" && item.revenue?.formatted?.withCurrency) ||
      item.formatted?.withCurrency ||
      new Intl.NumberFormat(moneyLocale(code, item.currency?.locale || fallback.locale || "en-US"), {
        style: "currency",
        currency: code,
        maximumFractionDigits: 0,
      }).format(amount);
    if (!totals.has(code)) totals.set(code, { code, amount, formatted });
  }
  // The vendor's own currency first, then A to Z: amounts in different
  // currencies can't be ranked against each other.
  return [...totals.values()].sort((a, b) =>
    a.code === fallback.code
      ? -1
      : b.code === fallback.code
        ? 1
        : a.code.localeCompare(b.code),
  );
};

/**
 * The page-wide currency filter: "ALL", or one currency the vendor sells in.
 * A saved choice that no longer applies falls back to ALL.
 */
export const useCurrencyFilter = (codes: string[]) => {
  const [chosen, setChosen] = useState<string>(ALL_CURRENCIES);
  useEffect(() => {
    const saved = readSaved();
    if (saved) setChosen(saved);
  }, []);
  const selected =
    chosen !== ALL_CURRENCIES && codes.includes(chosen) ? chosen : ALL_CURRENCIES;
  const select = (code: string) => {
    setChosen(code);
    try {
      localStorage.setItem(FILTER_KEY, code);
    } catch {
      // Not remembered this time; the filter still applies.
    }
  };
  return { selected, select, isFiltered: selected !== ALL_CURRENCIES };
};

/** What an analytics row is priced in: its revenue's currency, else its event's. */
export const rowCurrency = (
  row: VendorTicketAnalyticsApiRecord,
  eventCurrencies: Map<string, string>,
) =>
  moneyCode(row.revenue) ||
  (row.eventId ? eventCurrencies.get(row.eventId) : undefined);

/** The events and analytics rows a filter keeps. */
export const useCurrencyFiltered = (
  selected: string,
  events: IEventDetailsType[],
  rows: VendorTicketAnalyticsApiRecord[],
) => {
  const eventCurrencies = useMemo(
    () =>
      new Map(
        events
          .filter((event) => event.currency)
          .map((event) => [event.id, event.currency!.toUpperCase()]),
      ),
    [events],
  );
  return useMemo(() => {
    if (selected === ALL_CURRENCIES) return { events, rows };
    return {
      events: events.filter((event) => event.currency?.toUpperCase() === selected),
      rows: rows.filter((row) => rowCurrency(row, eventCurrencies) === selected),
    };
  }, [eventCurrencies, events, rows, selected]);
};

/** "All · NGN · GHS …" above the cards. Hidden for a vendor who sells in one currency. */
const CurrencyFilter: React.FC<{
  totals: TCurrencyTotal[];
  selected: string;
  onSelect: (code: string) => void;
  className?: string;
}> = ({ totals, selected, onSelect, className }) => {
  if (totals.length < 2) return null;
  const options = [ALL_CURRENCIES, ...totals.map((total) => total.code)];
  return (
    <div
      role="radiogroup"
      aria-label="Show figures for"
      className={cn(
        "scrollbar-none flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-secondary-100 bg-white p-1 shadow-sm",
        className,
      )}
    >
      {options.map((code) => {
        const isSelected = code === selected;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(code)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide transition-colors",
              isSelected
                ? "bg-secondary-900 text-white"
                : "text-secondary-500 hover:text-secondary-900",
            )}
          >
            {code === ALL_CURRENCIES ? "All currencies" : code}
          </button>
        );
      })}
    </div>
  );
};

export default memo(CurrencyFilter);

/** Every currency's total stacked, for the revenue card when the filter is "All". */
export const RevenueByCurrencyList: React.FC<{ totals: TCurrencyTotal[] }> = ({
  totals,
}) => (
  <ul className="space-y-1">
    {totals.map((total) => (
      <li key={total.code} className="flex items-baseline justify-between gap-3">
        <span className="text-xl font-bold tracking-tight text-secondary-950 sm:text-2xl">
          {total.formatted}
        </span>
        <span className="text-xs font-semibold text-secondary-400">{total.code}</span>
      </li>
    ))}
  </ul>
);
