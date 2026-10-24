"use client";

import CurrencyFilter, {
  TCurrencyTotal,
  useCurrencyFilter,
} from "@/components/pages/app/currency-filter";
import {
  IVendorInsights,
  TInsightsDays,
  useVendorInsights,
} from "@/hooks/use-vendor-tickets";
import { getCurrencyForCountry } from "@/lib/currency";
import { formatEventDateRange, formatEventTime } from "@/lib/event-time";
import { cn } from "@/lib/utils";
import useUserStore from "@/stores/user-store";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useState } from "react";
import Change from "./change";
import SalesChart from "./sales-chart";

const PERIODS: { days: TInsightsDays; label: string; previous: string }[] = [
  { days: 7, label: "7 days", previous: "previous 7 days" },
  { days: 30, label: "30 days", previous: "previous 30 days" },
  { days: 90, label: "90 days", previous: "previous 90 days" },
  { days: 365, label: "12 months", previous: "previous 12 months" },
  { days: 0, label: "All time", previous: "" },
];
const PERIOD_KEY = "turnupz-analytics-days";

const number = (value: number) => value.toLocaleString();

const Tile: React.FC<{
  label: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ label, children, footer }) => (
  <article className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-secondary-100 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
    <div className="space-y-2">
      <p className="text-sm font-medium text-secondary-500">{label}</p>
      {children}
    </div>
    {footer}
  </article>
);

const BigNumber: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-3xl font-bold tracking-tight text-secondary-950">{children}</p>
);

const Card: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, children, className }) => (
  <section
    className={cn(
      "min-w-0 rounded-[1.75rem] border border-secondary-100 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)] sm:p-6",
      className,
    )}
  >
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-secondary-950">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-secondary-500">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const Segmented = <T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; disabled?: boolean; title?: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) => (
  <div
    role="radiogroup"
    aria-label={label}
    className="scrollbar-none flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-secondary-100 bg-white p-1 shadow-sm"
  >
    {options.map((option) => (
      <button
        key={String(option.value)}
        type="button"
        role="radio"
        aria-checked={option.value === value}
        disabled={option.disabled}
        title={option.title}
        onClick={() => onChange(option.value)}
        className={cn(
          "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40",
          option.value === value
            ? "bg-secondary-900 text-white"
            : "text-secondary-500 hover:text-secondary-900",
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);

type TSort = "upcoming" | "sold" | "sellThrough";

const sortEvents = (events: IVendorInsights["events"], sort: TSort) => {
  const list = [...events];
  if (sort === "sold") return list.sort((a, b) => b.sold - a.sold);
  if (sort === "sellThrough") {
    return list.sort((a, b) => (b.sellThrough ?? -1) - (a.sellThrough ?? -1));
  }
  // Upcoming soonest first, then past ones, most recent first.
  const upcoming = list
    .filter((event) => !event.isPast)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const past = list
    .filter((event) => event.isPast)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return [...upcoming, ...past];
};

const SellThrough: React.FC<{ sold: number; capacity: number; percent: number | null }> = ({
  sold,
  capacity,
  percent,
}) => {
  if (!capacity) return <span className="text-sm text-secondary-400">No tickets set</span>;
  const soldOut = sold >= capacity;
  return (
    <div className="min-w-[140px] space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold text-secondary-950">
          {number(sold)} <span className="font-normal text-secondary-400">/ {number(capacity)}</span>
        </span>
        <span className="text-xs font-semibold text-secondary-500">
          {soldOut ? "Sold out" : `${percent ?? 0}%`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary-100">
        <div
          className="h-full rounded-full bg-[#0577FA]"
          style={{ width: `${Math.min(100, percent ?? 0)}%` }}
        />
      </div>
    </div>
  );
};

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse rounded-[1.5rem] bg-secondary-100/70", className)} />
);

/**
 * The vendor's analytics: pick a period and (if they sell in several) a currency,
 * then see how sales moved against the period before, sales over time, how each
 * event is doing and which tickets sell best.
 */
const AnalysisPage = () => {
  const userDetails = useUserStore((state) => state.userDetails);
  const ownCurrency = getCurrencyForCountry(
    userDetails?.platformCurrency || userDetails?.countryCode || userDetails?.country,
  ).code;

  const [days, setDays] = useState<TInsightsDays>(30);
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(PERIOD_KEY));
      if (PERIODS.some((period) => period.days === saved)) setDays(saved as TInsightsDays);
    } catch {
      // Starts on 30 days.
    }
  }, []);
  const choosePeriod = (next: TInsightsDays) => {
    setDays(next);
    try {
      localStorage.setItem(PERIOD_KEY, String(next));
    } catch {
      // Not remembered this time.
    }
  };

  // The currency filter is shared with the dashboard. Its list comes from the
  // unfiltered answer, so picking one never hides the others.
  const { data: everything } = useVendorInsights(days);
  const codes = useMemo(() => {
    const all = everything?.currencies ?? [];
    return [...all].sort((a, b) =>
      a === ownCurrency ? -1 : b === ownCurrency ? 1 : a.localeCompare(b),
    );
  }, [everything?.currencies, ownCurrency]);
  const filter = useCurrencyFilter(codes);
  const { data: filtered, isPending } = useVendorInsights(
    days,
    filter.isFiltered ? filter.selected : undefined,
  );
  const data = filter.isFiltered ? filtered : everything;

  const [metric, setMetric] = useState<"tickets" | "revenue">("tickets");
  const [sort, setSort] = useState<TSort>("upcoming");

  const period = PERIODS.find((item) => item.days === days)!;
  const revenue = data?.summary.revenue ?? [];
  // Money is charted only in one currency at a time.
  const chartCurrency = filter.isFiltered
    ? filter.selected
    : revenue.length === 1
      ? revenue[0].code
      : null;
  const showRevenue = metric === "revenue" && !!chartCurrency;
  const money = useMemo(
    () =>
      chartCurrency
        ? new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: chartCurrency,
            maximumFractionDigits: 0,
          })
        : null,
    [chartCurrency],
  );
  const points = useMemo(
    () =>
      (data?.series ?? []).map((point) => ({
        start: point.start,
        value: showRevenue ? (point.revenue[chartCurrency!] ?? 0) : point.tickets,
      })),
    [chartCurrency, data?.series, showRevenue],
  );
  const chartTotal = points.reduce((sum, point) => sum + point.value, 0);
  const events = useMemo(() => sortEvents(data?.events ?? [], sort), [data?.events, sort]);
  const topMax = Math.max(1, ...(data?.topTicketTypes ?? []).map((item) => item.sold));
  const scope = filter.isFiltered ? ` priced in ${filter.selected}` : "";
  const periodText = days ? `the last ${period.label}` : "all time";

  return (
    <main className="space-y-6 pb-16">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-[0.24em] text-secondary-400 uppercase">
            Analytics
          </p>
          <h1 className="text-[clamp(1.9rem,3.4vw,2.6rem)] font-bold leading-tight tracking-tight text-secondary-950">
            How your events are selling
          </h1>
          <p className="text-sm text-secondary-500">
            Sales in {periodText}
            {scope}, compared with the period before.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <Segmented
            label="Period"
            value={days}
            onChange={choosePeriod}
            options={PERIODS.map((item) => ({ value: item.days, label: item.label }))}
          />
          <CurrencyFilter
            totals={codes.map<TCurrencyTotal>((code) => ({ code, amount: 0, formatted: "" }))}
            selected={filter.selected}
            onSelect={filter.select}
          />
        </div>
      </header>

      {!data && isPending ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-36" />
            ))}
          </div>
          <Skeleton className="h-[380px]" />
          <Skeleton className="h-[320px]" />
        </div>
      ) : !data ? (
        <p className="rounded-[1.5rem] border border-dashed border-secondary-200 p-10 text-center text-sm text-secondary-500">
          We couldn&apos;t load your analytics. Refresh to try again.
        </p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Tile
              label="Tickets sold"
              footer={
                <Change
                  value={data.summary.ticketsSoldChange}
                  hasCurrent={data.summary.ticketsSold > 0}
                  versus={period.previous}
                />
              }
            >
              <BigNumber>{number(data.summary.ticketsSold)}</BigNumber>
            </Tile>
            <Tile
              label="Revenue"
              footer={
                revenue.length === 1 ? (
                  <Change
                    value={revenue[0].change}
                    hasCurrent={revenue[0].total.amount > 0}
                    versus={period.previous}
                  />
                ) : revenue.length > 1 ? (
                  <span className="text-xs text-secondary-400">
                    Pick a currency above to compare periods
                  </span>
                ) : null
              }
            >
              {revenue.length > 1 ? (
                <ul className="space-y-0.5">
                  {revenue.map((item) => (
                    <li key={item.code} className="flex items-baseline justify-between gap-3">
                      <span className="text-lg font-bold text-secondary-950">
                        {item.total.formatted?.withCurrency}
                      </span>
                      <span className="text-xs font-semibold text-secondary-400">{item.code}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <BigNumber>{revenue[0]?.total.formatted?.withCurrency ?? "No sales yet"}</BigNumber>
              )}
            </Tile>
            <Tile
              label="Buyers"
              footer={
                <Change
                  value={data.summary.buyersChange}
                  hasCurrent={data.summary.buyers > 0}
                  versus={period.previous}
                />
              }
            >
              <BigNumber>{number(data.summary.buyers)}</BigNumber>
            </Tile>
            <Tile
              label="Check-in rate"
              footer={
                <span className="text-xs text-secondary-400">
                  {data.summary.checkInBase
                    ? `${number(data.summary.checkedIn)} of ${number(data.summary.checkInBase)} tickets at events that have started`
                    : "Shows once one of your events has started"}
                </span>
              }
            >
              <BigNumber>
                {data.summary.checkInRate === null ? "—" : `${data.summary.checkInRate}%`}
              </BigNumber>
            </Tile>
          </section>

          <Card
            title="Sales over time"
            subtitle={
              showRevenue && money
                ? `${money.format(chartTotal)} in ${periodText}`
                : `${number(chartTotal)} ticket${chartTotal === 1 ? "" : "s"} in ${periodText}`
            }
            action={
              <Segmented
                label="Show"
                value={metric}
                onChange={setMetric}
                options={[
                  { value: "tickets", label: "Tickets" },
                  {
                    value: "revenue",
                    label: "Revenue",
                    disabled: !chartCurrency,
                    title: chartCurrency
                      ? undefined
                      : "Pick one currency above to chart revenue",
                  },
                ]}
              />
            }
          >
            {chartTotal > 0 ? (
              <SalesChart
                points={points}
                bucket={data.period.bucket}
                integer={!showRevenue}
                formatValue={(value) =>
                  showRevenue && money
                    ? money.format(value)
                    : `${number(value)} ticket${value === 1 ? "" : "s"}`
                }
              />
            ) : (
              <p className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-secondary-200 text-sm text-secondary-500">
                No sales in {periodText}
                {scope}.
              </p>
            )}
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Card
              title="Event performance"
              subtitle={`${number(data.summary.events)} event${data.summary.events === 1 ? "" : "s"}${scope}, ${number(data.summary.upcomingEvents)} still to come. Totals are all time.`}
              action={
                <Segmented
                  label="Sort events"
                  value={sort}
                  onChange={setSort}
                  options={[
                    { value: "upcoming", label: "Upcoming" },
                    { value: "sold", label: "Most sold" },
                    { value: "sellThrough", label: "Fullest" },
                  ]}
                />
              }
            >
              {events.length === 0 ? (
                <p className="py-10 text-center text-sm text-secondary-500">No events{scope} yet.</p>
              ) : (
                <div className="-mx-5 overflow-x-auto sm:-mx-6">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-secondary-100 text-xs font-semibold tracking-wide text-secondary-400 uppercase">
                        <th className="px-5 pb-3 font-semibold sm:px-6">Event</th>
                        <th className="px-3 pb-3 font-semibold">Sold</th>
                        <th className="px-3 pb-3 font-semibold">In period</th>
                        <th className="px-3 pb-3 text-right font-semibold">Revenue</th>
                        <th className="px-5 pb-3 text-right font-semibold sm:px-6">Checked in</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event.id} className="border-b border-secondary-50 last:border-0">
                          <td className="max-w-[260px] px-5 py-3.5 sm:px-6">
                            <Link
                              href={`/app/events/${event.id}`}
                              className="block truncate font-semibold text-secondary-950 hover:underline"
                            >
                              {event.name}
                            </Link>
                            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-secondary-500">
                              {event.endDate
                                ? formatEventDateRange(event.date, event.endDate)
                                : formatEventTime(event.date, undefined, { withWeekday: false })}
                              {event.isPast && (
                                <span className="rounded-full bg-secondary-50 px-1.5 py-0.5 font-semibold">
                                  Ended
                                </span>
                              )}
                              {event.status !== "published" && (
                                <span className="rounded-full bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700 capitalize">
                                  {event.status.replace("_", " ")}
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <SellThrough
                              sold={event.sold}
                              capacity={event.capacity}
                              percent={event.sellThrough}
                            />
                          </td>
                          <td className="px-3 py-3.5 text-secondary-700">
                            {event.soldInPeriod ? `+${number(event.soldInPeriod)}` : "—"}
                          </td>
                          <td className="px-3 py-3.5 text-right font-semibold whitespace-nowrap text-secondary-950">
                            {event.sold ? event.revenue.formatted?.withCurrency : (
                              <span className="font-normal text-secondary-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap text-secondary-700 sm:px-6">
                            {event.hasStarted
                              ? `${number(event.checkedIn)} of ${number(event.sold)}`
                              : "Not started"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="Best-selling tickets" subtitle={`In ${periodText}${scope}`}>
              {data.topTicketTypes.length === 0 ? (
                <p className="py-6 text-sm text-secondary-500">Nothing sold in this period yet.</p>
              ) : (
                <ol className="space-y-4">
                  {data.topTicketTypes.map((item) => (
                    <li key={item.id} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-secondary-950">
                            {item.name}
                          </span>
                          <span className="block truncate text-xs text-secondary-500">
                            {item.eventName}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-sm font-semibold text-secondary-950">
                            {number(item.sold)} sold
                          </span>
                          <span className="block text-xs text-secondary-500">
                            {item.revenue.formatted?.withCurrency}
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary-100">
                        <div
                          className="h-full rounded-full bg-[#0577FA]"
                          style={{ width: `${(item.sold / topMax) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              <Link
                href="/app/tickets"
                className="mt-6 inline-block text-sm font-semibold text-secondary-700 hover:underline"
              >
                See every ticket in the ledger →
              </Link>
            </Card>
          </div>
        </>
      )}
    </main>
  );
};

export default memo(AnalysisPage);
