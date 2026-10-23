"use client";

import { useEvents } from "@/hooks/use-event";
import { useVendorTicketAnalytics } from "@/hooks/use-vendor-tickets";
import { AppCurrency, formatAppMoney, getCurrencyForCountry } from "@/lib/currency";
import { PriceDetailsType } from "@/lib/types";
import useUserStore from "@/stores/user-store";
import { useActingVendor } from "@/stores/workspace-store";
import Link from "next/link";
import { cn } from "@/lib/utils";
import React, { memo, useEffect, useMemo, useState } from "react";

const formatMetricValue = (value: number) => {
  return value.toLocaleString();
};

type RevenueValue = PriceDetailsType | number | undefined;

const getMoneyAmount = (value: RevenueValue) => {
  if (typeof value === "number") return value;
  return Number(value?.amount ?? 0);
};

const formatMoney = (value: RevenueValue, fallbackCurrency: AppCurrency) => {
  if (typeof value !== "number" && value?.formatted?.withCurrency) {
    return value.formatted.withCurrency;
  }
  const amount = getMoneyAmount(value);
  if (typeof value !== "number" && value?.currency?.code) {
    return new Intl.NumberFormat(value.currency.locale || "en-US", {
      style: "currency",
      currency: value.currency.code,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return formatAppMoney(amount, fallbackCurrency);
};

type TCurrencyTotal = { code: string; amount: number; formatted: string };

/** Which currency the revenue card shows; kept per browser, so it's there next visit. */
const REVENUE_CURRENCY_KEY = "turnupz-dashboard-revenue-currency";

const readSavedCurrency = () => {
  try {
    return localStorage.getItem(REVENUE_CURRENCY_KEY);
  } catch {
    return null;
  }
};

const OverviewMetricCard: React.FC<{
  title: string;
  value: string;
  caption: string;
  pill: string;
  /** Totals that can't be added up, one per currency, to switch between. */
  currencies?: TCurrencyTotal[];
  selectedCurrency?: string;
  onSelectCurrency?: (code: string) => void;
}> = ({
  title,
  value,
  caption,
  pill,
  currencies,
  selectedCurrency,
  onSelectCurrency,
}) => {
  return (
    <article className="relative overflow-hidden rounded-[1.6rem] border border-secondary-100 bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:px-7 sm:py-6 lg:px-8 lg:py-7">
      <div className="absolute -bottom-8 -right-8 size-24 rounded-full bg-secondary-50/80 sm:-bottom-10 sm:-right-10 sm:size-32" />
      <div className="relative space-y-4">
        <div className="space-y-3">
          <p className="text-sm text-secondary-500">{title}</p>
          {currencies && currencies.length > 1 && (
            <div
              role="radiogroup"
              aria-label={`${title} currency`}
              className="scrollbar-none flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-secondary-50 p-1"
            >
              {currencies.map((currency) => {
                const isSelected = currency.code === selectedCurrency;
                return (
                  <button
                    key={currency.code}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onSelectCurrency?.(currency.code)}
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide transition-colors",
                      isSelected
                        ? "bg-white text-secondary-950 shadow-sm"
                        : "text-secondary-500 hover:text-secondary-800",
                    )}
                  >
                    {currency.code}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <p className="text-3xl font-bold tracking-tight text-secondary-950 sm:text-4xl">
          {value}
        </p>
        <div className="flex flex-col items-start gap-2 text-sm text-secondary-400 sm:flex-row sm:items-center sm:gap-3">
          <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-500">
            {pill}
          </span>
          <span>{caption}</span>
        </div>
      </div>
    </article>
  );
};

const DashboardOverview = () => {
  const userDetails = useUserStore((state) => state?.userDetails);
  const userId = useActingVendor().vendorId;
  const platformCurrency = useMemo(
    () =>
      getCurrencyForCountry(
        userDetails?.platformCurrency ||
          userDetails?.countryCode ||
          userDetails?.country,
    ),
    [userDetails?.country, userDetails?.countryCode, userDetails?.platformCurrency],
  );
  // Totals cover only the vendor's own events.
  const { data } = useEvents(
    { limit: 50, userId: userId ?? undefined },
    { enabled: !!userId },
  );
  const { data: ticketAnalyticsResponse } = useVendorTicketAnalytics({});
  const ticketAnalytics = useMemo(
    () => ticketAnalyticsResponse?.rows ?? [],
    [ticketAnalyticsResponse?.rows],
  );

  const events = useMemo(
    () => data?.pages?.flatMap((page) => page?.data ?? []) ?? [],
    [data],
  );

  // One total per currency: they can't be added together, so the card switches.
  const revenueTotals = useMemo<TCurrencyTotal[]>(
    () =>
      (ticketAnalyticsResponse?.revenueByCurrency ?? [])
        .map((item) => {
          const code = (
            (typeof item.revenue !== "number" && item.revenue?.currency?.code) ||
            item.currency?.code ||
            item.currencyCode ||
            platformCurrency.code
          ).toUpperCase();
          const amount = item.revenue
            ? getMoneyAmount(item.revenue)
            : Number(item.amount ?? 0);
          const formatted = item.revenue
            ? formatMoney(item.revenue, platformCurrency)
            : new Intl.NumberFormat(
                item.currency?.locale || platformCurrency.locale,
                { style: "currency", currency: code, maximumFractionDigits: 0 },
              ).format(amount);
          return { code, amount, formatted };
        })
        .filter((total, index, all) =>
          all.findIndex((other) => other.code === total.code) === index,
        ),
    [platformCurrency, ticketAnalyticsResponse?.revenueByCurrency],
  );
  const [chosenCurrency, setChosenCurrency] = useState<string | null>(null);
  useEffect(() => {
    setChosenCurrency(readSavedCurrency());
  }, []);
  // The saved choice if it's still one they sell in, else their own currency,
  // else whichever they've taken the most in.
  const selectedCurrency =
    revenueTotals.find((total) => total.code === chosenCurrency)?.code ??
    revenueTotals.find((total) => total.code === platformCurrency.code)?.code ??
    [...revenueTotals].sort((a, b) => b.amount - a.amount)[0]?.code;
  const selectCurrency = (code: string) => {
    setChosenCurrency(code);
    try {
      localStorage.setItem(REVENUE_CURRENCY_KEY, code);
    } catch {
      // Not remembered this time; the choice still applies.
    }
  };

  const metrics = useMemo(() => {
    const totalAttendance =
      ticketAnalytics.reduce(
        (sum, item) => sum + (item.attended ?? item.totalAttended ?? 0),
        0,
      );
    const totalRevenue = (() => {
      if (revenueTotals.length > 0) {
        return (
          revenueTotals.find((total) => total.code === selectedCurrency) ??
          revenueTotals[0]
        ).formatted;
      }

      if (ticketAnalyticsResponse?.revenue) {
        return formatMoney(ticketAnalyticsResponse.revenue, platformCurrency);
      }

      const amount = ticketAnalytics.reduce(
        (sum, item) => sum + getMoneyAmount(item.revenue),
        0,
      );
      return formatAppMoney(amount, platformCurrency);
    })();

    return [
      {
        title: "Total Events",
        value: formatMetricValue(events.length),
        pill: "Live",
        caption: "Published across your Turnupz workspace",
      },
      {
        title: "Total Attendance",
        value: formatMetricValue(totalAttendance),
        pill: "Checked In",
        caption: "Confirmed attendance from ticket scans and registrations",
      },
      {
        title: "Total Revenue",
        value: totalRevenue,
        pill: "Sales",
        caption:
          revenueTotals.length > 1
            ? `${selectedCurrency} sales only. You sell in ${revenueTotals.length} currencies`
            : "Revenue from paid ticket activity across your events",
        currencies: revenueTotals,
      },
    ];
  }, [
    events.length,
    platformCurrency,
    revenueTotals,
    selectedCurrency,
    ticketAnalytics,
    ticketAnalyticsResponse,
  ]);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
            Analytics
          </p>
          <div className="space-y-1">
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[0.95] tracking-tight text-secondary-950">
              Performance Overview
            </h1>
            <p className="max-w-2xl text-sm text-secondary-500">
              Keep track of event output, upcoming drops, and where your
              audience can still convert.
            </p>
          </div>
        </div>
        <Link
          href="/app/analysis"
          className="text-sm font-medium text-secondary-500 transition-colors hover:text-secondary-400"
        >
          View Full Report
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <OverviewMetricCard
            key={metric.title}
            {...metric}
            selectedCurrency={selectedCurrency}
            onSelectCurrency={selectCurrency}
          />
        ))}
      </div>
    </section>
  );
};

export default memo(DashboardOverview);
