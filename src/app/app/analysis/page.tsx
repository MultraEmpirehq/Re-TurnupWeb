"use client";

import DashboardTicketSalesChart from "@/components/pages/app/dashboard-ticket-sales-chart";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/use-event";
import {
  useVendorTicketAnalytics,
  VendorTicketAnalyticsApiRecord,
  VendorTicketRevenueByCurrency,
} from "@/hooks/use-vendor-tickets";
import { AppCurrency, formatAppMoney, getCurrencyForCountry } from "@/lib/currency";
import { IMonthlyTicketsSold, PriceDetailsType } from "@/lib/types";
import useUserStore from "@/stores/user-store";
import Link from "next/link";
import React, { memo, useMemo } from "react";

type RevenueValue = PriceDetailsType | number | undefined;
type RevenueByCurrencyRow = VendorTicketRevenueByCurrency;
type AnalyticsTotals = {
  purchased: number;
  attended: number;
  transferred: number;
  remaining: number;
};

const formatMetricValue = (value: number) => value.toLocaleString();

const getAnalyticsAmount = (value: RevenueValue) => {
  if (typeof value === "number") return value;
  return Number(value?.amount ?? 0);
};

const getCurrencyMeta = (value: RevenueValue) => {
  if (typeof value === "number" || !value?.currency?.code) return null;
  return {
    code: value.currency.code,
    locale: value.currency.locale || "en-US",
  };
};

const formatMoney = (
  amount: number,
  value?: RevenueValue,
  fallbackCurrency?: AppCurrency,
) => {
  const currency = getCurrencyMeta(value);
  if (amount === 0) {
    return currency
      ? new Intl.NumberFormat(currency.locale, {
          style: "currency",
          currency: currency.code,
          maximumFractionDigits: 0,
        }).format(0)
      : formatAppMoney(0, fallbackCurrency);
  }

  if (typeof value !== "number" && value?.formatted?.withCurrency) {
    return value.formatted.withCurrency;
  }

  if (currency) {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return formatAppMoney(amount, fallbackCurrency);
};

const summarizeRevenue = (
  rows: VendorTicketAnalyticsApiRecord[],
  fallbackCurrency: AppCurrency,
  revenueByCurrency: RevenueByCurrencyRow[] = [],
) => {
  if (revenueByCurrency.length > 0) {
    return revenueByCurrency
      .map((item) => {
        const money = item.revenue;
        if (money && typeof money !== "number") {
          return formatMoney(money.amount, money, fallbackCurrency);
        }
        const amount = Number(item.amount ?? 0);
        const currency =
          item.currency?.code || item.currencyCode
            ? {
                code: item.currency?.code || item.currencyCode || fallbackCurrency.code,
                locale: item.currency?.locale || fallbackCurrency.locale,
              }
            : null;
        return currency
          ? new Intl.NumberFormat(currency.locale, {
              style: "currency",
              currency: currency.code,
              maximumFractionDigits: 0,
            }).format(amount)
          : formatAppMoney(amount, fallbackCurrency);
      })
      .join(" + ");
  }

  const grouped = new Map<
    string,
    { amount: number; sample?: RevenueValue; label: string }
  >();

  rows.forEach((row) => {
    const amount = getAnalyticsAmount(row.revenue);
    const currency = getCurrencyMeta(row.revenue);
    const key = currency?.code ?? "plain";
    const label = currency?.code ?? "Total";
    const existing = grouped.get(key);

    grouped.set(key, {
      amount: (existing?.amount ?? 0) + amount,
      sample: existing?.sample ?? row.revenue,
      label,
    });
  });

  const values = Array.from(grouped.values());
  if (values.length === 0) return formatAppMoney(0, fallbackCurrency);
  if (values.length === 1) {
    return formatMoney(values[0].amount, values[0].sample, fallbackCurrency);
  }

  return values
    .map((item) =>
      `${item.label} ${formatMoney(item.amount, item.sample, fallbackCurrency)}`,
    )
    .join(" + ");
};

const getPurchased = (row: VendorTicketAnalyticsApiRecord) =>
  row.purchased ?? row.totalPurchased ?? 0;

const getAttended = (row: VendorTicketAnalyticsApiRecord) =>
  row.attended ?? row.totalAttended ?? 0;

const getTransferred = (row: VendorTicketAnalyticsApiRecord) =>
  row.transferred ?? row.totalTransferred ?? 0;

const getRemaining = (row: VendorTicketAnalyticsApiRecord) =>
  row.remaining ?? row.totalRemaining ?? 0;

const getEventName = (row: VendorTicketAnalyticsApiRecord) =>
  row.eventName ?? row.event ?? "Event";

const getCategoryName = (row: VendorTicketAnalyticsApiRecord) =>
  row.ticketCategory ?? row.category ?? "Ticket";

const MetricCard: React.FC<{
  title: string;
  value: string;
  caption: string;
  pill: string;
}> = ({ title, value, caption, pill }) => (
  <article className="relative overflow-hidden rounded-[1.6rem] border border-secondary-100 bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:px-7 sm:py-6 lg:px-8 lg:py-7">
    <div className="absolute -bottom-8 -right-8 size-24 rounded-full bg-secondary-50/80 sm:-bottom-10 sm:-right-10 sm:size-32" />
    <div className="relative space-y-4">
      <p className="text-sm text-secondary-500">{title}</p>
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

const InsightCard: React.FC<{
  title: string;
  subtitle: string;
  value: string;
  caption: string;
}> = ({ title, subtitle, value, caption }) => (
  <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary-400">
      {subtitle}
    </p>
    <h2 className="mt-3 text-xl font-bold text-secondary-950">{title}</h2>
    <p className="mt-5 text-3xl font-bold tracking-tight text-secondary-950">
      {value}
    </p>
    <p className="mt-3 text-sm leading-7 text-secondary-500">{caption}</p>
  </article>
);

const TopTicketEventCard: React.FC<{
  row: VendorTicketAnalyticsApiRecord | null;
  fallbackCurrency: AppCurrency;
}> = ({ row, fallbackCurrency }) => {
  if (!row) {
    return (
      <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary-400">
          Top Ticket Event
        </p>
        <h2 className="mt-3 text-2xl font-bold text-secondary-950">
          No ticket analytics yet
        </h2>
        <p className="mt-3 text-sm leading-7 text-secondary-500">
          Ticket sales, registrations, and check-ins will appear here once
          attendees start booking and arriving.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary-400">
            Top Ticket Event
          </p>
          <h2 className="mt-3 text-2xl font-bold leading-tight text-secondary-950">
            {getEventName(row)}
          </h2>
          <p className="mt-3 text-sm leading-7 text-secondary-500">
            This event currently has the strongest ticket movement across your
            published listings.
          </p>
        </div>
        <span className="rounded-full bg-secondary-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-secondary-400">
          Tickets
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1rem] border border-secondary-100 bg-secondary-50/70">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0 text-sm">
          {[
            ["Purchased", formatMetricValue(getPurchased(row))],
            ["Attended", formatMetricValue(getAttended(row))],
            ["Transferred", formatMetricValue(getTransferred(row))],
            ["Remaining", formatMetricValue(getRemaining(row))],
            [
              "Revenue",
              formatMoney(getAnalyticsAmount(row.revenue), row.revenue, fallbackCurrency),
            ],
          ].map(([label, value]) => (
            <React.Fragment key={label}>
              <div className="border-b border-secondary-100 px-4 py-3 font-semibold text-secondary-950 last:border-b-0">
                {label}
              </div>
              <div className="border-b border-secondary-100 px-4 py-3 text-secondary-500 last:border-b-0">
                {value}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </article>
  );
};

export const dynamic = "force-dynamic";

const AnalysisPage = () => {
  const userDetails = useUserStore((state) => state?.userDetails);
  const userId = userDetails?.id;
  const platformCurrency = useMemo(
    () =>
      getCurrencyForCountry(
        userDetails?.platformCurrency ||
          userDetails?.countryCode ||
          userDetails?.country,
      ),
    [userDetails?.country, userDetails?.countryCode, userDetails?.platformCurrency],
  );
  const { data: eventsData } = useEvents({
    limit: 50,
    userId: userId ?? undefined,
  });
  const { data: ticketAnalyticsResponse } = useVendorTicketAnalytics({});
  const ticketAnalytics = useMemo(
    () => ticketAnalyticsResponse?.rows ?? [],
    [ticketAnalyticsResponse?.rows],
  );
  const revenueByCurrency = useMemo(
    () => ticketAnalyticsResponse?.revenueByCurrency ?? [],
    [ticketAnalyticsResponse?.revenueByCurrency],
  );

  const events = useMemo(
    () => eventsData?.pages?.flatMap((page) => page?.data ?? []) ?? [],
    [eventsData],
  );

  const totals = useMemo<AnalyticsTotals>(() => {
    return ticketAnalytics.reduce<AnalyticsTotals>(
      (summary, row) => ({
        purchased: summary.purchased + getPurchased(row),
        attended: summary.attended + getAttended(row),
        transferred: summary.transferred + getTransferred(row),
        remaining: summary.remaining + getRemaining(row),
      }),
      { purchased: 0, attended: 0, transferred: 0, remaining: 0 },
    );
  }, [ticketAnalytics]);

  const metrics = useMemo(
    () => [
      {
        title: "Total Events",
        value: formatMetricValue(events.length),
        pill: "Events",
        caption: "Events currently linked to your vendor profile",
      },
      {
        title: "Tickets Purchased",
        value: formatMetricValue(totals.purchased),
        pill: "Purchased",
        caption: "Paid tickets and confirmed registration records",
      },
      {
        title: "Total Revenue",
        value: summarizeRevenue(
          ticketAnalytics,
          platformCurrency,
          revenueByCurrency,
        ),
        pill: "Revenue",
        caption: "Revenue from ticket and registration activity",
      },
    ],
    [
      events.length,
      platformCurrency,
      revenueByCurrency,
      ticketAnalytics,
      totals.purchased,
    ],
  );

  const attendanceRate = useMemo(() => {
    if (totals.purchased === 0) return 0;
    return Math.round((totals.attended / totals.purchased) * 100);
  }, [totals.attended, totals.purchased]);

  const transferRate = useMemo(() => {
    if (totals.purchased === 0) return 0;
    return Math.round((totals.transferred / totals.purchased) * 100);
  }, [totals.purchased, totals.transferred]);

  const chartRows = useMemo<IMonthlyTicketsSold[]>(
    () =>
      ticketAnalytics
        .map((row, index) => ({
          month: row.eventId || `${getEventName(row)}-${index}`,
          label: getEventName(row).slice(0, 14),
          count: getPurchased(row),
        }))
        .filter((row) => row.count > 0)
        .slice(0, 8),
    [ticketAnalytics],
  );

  const topTicketEvent = useMemo(() => {
    if (ticketAnalytics.length === 0) return null;
    return [...ticketAnalytics].sort(
      (left, right) => getPurchased(right) - getPurchased(left),
    )[0];
  }, [ticketAnalytics]);

  const topAttendanceEvent = useMemo(() => {
    if (ticketAnalytics.length === 0) return null;
    return [...ticketAnalytics].sort(
      (left, right) => getAttended(right) - getAttended(left),
    )[0];
  }, [ticketAnalytics]);

  const latestEvents = useMemo(
    () =>
      [...events]
        .sort(
          (left, right) =>
            new Date(right.date).getTime() - new Date(left.date).getTime(),
        )
        .slice(0, 5),
    [events],
  );

  return (
    <main className="space-y-10">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
            Event Analytics
          </p>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[0.96] tracking-tight text-secondary-950">
            Event performance analytics
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-secondary-500 sm:text-base">
            Review purchases, attendance, transfers, remaining capacity, and
            revenue across your events.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-2xl border-secondary-200 px-5 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
        >
          <Link href="/app">Back to Dashboard</Link>
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary-400">
              Performance Overview
            </p>
            <h2 className="mt-3 text-[clamp(1.9rem,3vw,2.6rem)] font-bold tracking-tight text-secondary-950">
              Ticket movement and attendance
            </h2>
          </div>
          <Link
            href="/app/tickets"
            className="text-sm font-medium text-secondary-500 transition-colors hover:text-secondary-400"
          >
            View Ticket Ledger
          </Link>
        </div>

        <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-sm leading-7 text-secondary-500">
            These numbers focus on ticket and registration activity. Audience
            views, likes, and reactions will appear here once they are available.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <InsightCard
              title="Attendance rate"
              subtitle="Check-ins"
              value={`${attendanceRate}%`}
              caption="Checked-in attendees compared with purchased or registered tickets."
            />
            <InsightCard
              title="Transfer rate"
              subtitle="Transfers"
              value={`${transferRate}%`}
              caption="Transferred tickets compared with total purchased tickets."
            />
            <InsightCard
              title="Remaining capacity"
              subtitle="Inventory"
              value={formatMetricValue(totals.remaining)}
              caption="Ticket inventory still available across your events."
            />
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-secondary-100 bg-secondary-50/50 p-4 sm:p-6">
            {chartRows.length > 0 ? (
              <DashboardTicketSalesChart data={chartRows} />
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-secondary-200 bg-white px-4 py-10 text-center text-sm text-secondary-500">
                Ticket purchase chart will appear once attendees begin booking.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <TopTicketEventCard
          row={topTicketEvent}
          fallbackCurrency={platformCurrency}
        />

        <div className="space-y-6">
          <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-400">
              Best Attendance
            </p>
            <h2 className="mt-3 text-xl font-bold text-secondary-950">
              {topAttendanceEvent ? getEventName(topAttendanceEvent) : "No check-ins yet"}
            </h2>
            <p className="mt-5 text-3xl font-bold tracking-tight text-secondary-950">
              {topAttendanceEvent
                ? formatMetricValue(getAttended(topAttendanceEvent))
                : "0"}
            </p>
            <p className="mt-3 text-sm leading-7 text-secondary-500">
              Highest checked-in attendance from your scanner activity.
            </p>
          </article>

          <article className="rounded-[1.8rem] bg-[#11172d] p-6 text-white shadow-[0_20px_50px_rgba(17,23,45,0.24)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/40">
              Operations View
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight">
              Track sales, check-ins, transfers, and remaining inventory.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/72 sm:text-base sm:leading-8">
              Use this page to decide where to promote more, which events need
              scanner support, and how much ticket capacity is still available.
            </p>
          </article>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-secondary-950">
                Ticket analytics by category
              </h2>
              <p className="mt-2 text-sm leading-7 text-secondary-500">
                Purchases, check-ins, transfers, remaining inventory, and
                revenue by event and ticket category.
              </p>
            </div>
            <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-500">
              {ticketAnalytics.length} rows
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {ticketAnalytics.length === 0 && (
              <p className="text-sm text-secondary-500">
                No ticket activity has been recorded yet.
              </p>
            )}
            {ticketAnalytics.map((row, index) => (
              <div
                key={`${row.eventId}-${getCategoryName(row)}-${index}`}
                className="rounded-[1.4rem] border border-secondary-100 bg-secondary-50/50 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-secondary-950">
                      {getEventName(row)}
                    </p>
                    <p className="mt-1 text-sm text-secondary-500">
                      {getCategoryName(row)}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-secondary-500">
                    {formatMetricValue(getPurchased(row))} bought
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-secondary-500 sm:grid-cols-4">
                  <span>{formatMetricValue(getAttended(row))} attended</span>
                  <span>{formatMetricValue(getTransferred(row))} transferred</span>
                  <span>{formatMetricValue(getRemaining(row))} remaining</span>
                  <span>
                    {formatMoney(
                      getAnalyticsAmount(row.revenue),
                      row.revenue,
                      platformCurrency,
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-secondary-950">
                Latest created events
              </h2>
              <p className="mt-2 text-sm leading-7 text-secondary-500">
                Recent events linked to your vendor profile.
              </p>
            </div>
            <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-500">
              {latestEvents.length} shown
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {latestEvents.length === 0 && (
              <p className="text-sm text-secondary-500">
                No event activity yet.
              </p>
            )}
            {latestEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-[1.4rem] border border-secondary-100 bg-secondary-50/50 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-secondary-950">
                      {event.name}
                    </p>
                    <p className="mt-1 text-sm text-secondary-500">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(event.date))}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-secondary-500">
                    {(event.totalTickets ?? 0).toLocaleString()} capacity
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
};

export default memo(AnalysisPage);
