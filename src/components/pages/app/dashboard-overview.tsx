"use client";

import CurrencyFilter, {
  currencyTotals,
  RevenueByCurrencyList,
  useCurrencyFilter,
  useCurrencyFiltered,
} from "@/components/pages/app/currency-filter";
import { useEvents } from "@/hooks/use-event";
import { useVendorTicketAnalytics } from "@/hooks/use-vendor-tickets";
import { AppCurrency, formatAppMoney, getCurrencyForCountry } from "@/lib/currency";
import { IEventDetailsType, PriceDetailsType } from "@/lib/types";
import useUserStore from "@/stores/user-store";
import { useActingVendor } from "@/stores/workspace-store";
import Link from "next/link";
import React, { memo, useMemo } from "react";

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

const OverviewMetricCard: React.FC<{
  title: string;
  value: React.ReactNode;
  caption: string;
  pill: string;
}> = ({ title, value, caption, pill }) => {
  return (
    <article className="relative overflow-hidden rounded-[1.6rem] border border-secondary-100 bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:px-7 sm:py-6 lg:px-8 lg:py-7">
      <div className="absolute -bottom-8 -right-8 size-24 rounded-full bg-secondary-50/80 sm:-bottom-10 sm:-right-10 sm:size-32" />
      <div className="relative space-y-4">
        <p className="text-sm text-secondary-500">{title}</p>
        {typeof value === "string" ? (
          <p className="text-3xl font-bold tracking-tight text-secondary-950 sm:text-4xl">
            {value}
          </p>
        ) : (
          value
        )}
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

  const allEvents = useMemo<IEventDetailsType[]>(
    () => data?.pages?.flatMap((page) => page?.data ?? []) ?? [],
    [data],
  );
  const allRows = useMemo(
    () => ticketAnalyticsResponse?.rows ?? [],
    [ticketAnalyticsResponse?.rows],
  );

  // Totals in different currencies can't be added up, so the whole page can
  // narrow to one currency's events, tickets and money.
  const totals = useMemo(
    () =>
      currencyTotals(
        ticketAnalyticsResponse?.revenueByCurrency ?? [],
        platformCurrency,
      ),
    [platformCurrency, ticketAnalyticsResponse?.revenueByCurrency],
  );
  const filter = useCurrencyFilter(totals.map((total) => total.code));
  const { events, rows } = useCurrencyFiltered(filter.selected, allEvents, allRows);

  const metrics = useMemo(() => {
    const totalAttendance = rows.reduce(
      (sum, item) => sum + (item.attended ?? item.totalAttended ?? 0),
      0,
    );
    const scope = filter.isFiltered ? ` in ${filter.selected}` : "";

    const revenue: React.ReactNode = (() => {
      if (totals.length > 1) {
        if (!filter.isFiltered) return <RevenueByCurrencyList totals={totals} />;
        return (
          totals.find((total) => total.code === filter.selected)?.formatted ??
          formatAppMoney(0, platformCurrency)
        );
      }
      if (totals.length === 1) return totals[0].formatted;
      if (ticketAnalyticsResponse?.revenue) {
        return formatMoney(ticketAnalyticsResponse.revenue, platformCurrency);
      }
      return formatAppMoney(
        rows.reduce((sum, item) => sum + getMoneyAmount(item.revenue), 0),
        platformCurrency,
      );
    })();

    return [
      {
        title: "Total Events",
        value: formatMetricValue(events.length),
        pill: "Live",
        caption: filter.isFiltered
          ? `Priced in ${filter.selected}, of ${allEvents.length} in total`
          : "Published across your Turnupz workspace",
      },
      {
        title: "Total Attendance",
        value: formatMetricValue(totalAttendance),
        pill: "Checked In",
        caption: `Confirmed attendance from ticket scans and registrations${scope}`,
      },
      {
        title: "Total Revenue",
        value: revenue,
        pill: "Sales",
        caption:
          totals.length > 1 && !filter.isFiltered
            ? `Each currency on its own: you sell in ${totals.length}`
            : `Revenue from paid ticket activity${scope || " across your events"}`,
      },
    ];
  }, [
    allEvents.length,
    events.length,
    filter.isFiltered,
    filter.selected,
    platformCurrency,
    rows,
    ticketAnalyticsResponse?.revenue,
    totals,
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
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <CurrencyFilter
            totals={totals}
            selected={filter.selected}
            onSelect={filter.select}
          />
          <Link
            href="/app/analysis"
            className="text-sm font-medium text-secondary-500 transition-colors hover:text-secondary-400"
          >
            View Full Report
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <OverviewMetricCard key={metric.title} {...metric} />
        ))}
      </div>
    </section>
  );
};

export default memo(DashboardOverview);
