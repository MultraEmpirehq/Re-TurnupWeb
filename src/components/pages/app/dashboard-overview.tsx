"use client";

import Change from "@/components/pages/app/analysis/change";
import CurrencyFilter, {
  TCurrencyTotal,
  useCurrencyFilter,
} from "@/components/pages/app/currency-filter";
import { IVendorInsights, useVendorInsights } from "@/hooks/use-vendor-tickets";
import { getCurrencyForCountry } from "@/lib/currency";
import { formatEventTime } from "@/lib/event-time";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { useActingVendor } from "@/stores/workspace-store";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo } from "react";
import {
  DailyColumns,
  Sparkline,
  SplitMeter,
  TDailyPoint,
} from "./overview-charts";

/** The overview always looks at the last 30 days; Analysis has the other periods. */
const DAYS = 30;
const VERSUS = "previous 30 days";

const number = (value: number) => value.toLocaleString();
const plural = (count: number, one: string, many = `${one}s`) =>
  `${number(count)} ${count === 1 ? one : many}`;

type TSummary = IVendorInsights["summary"];
type TEvent = IVendorInsights["events"][number];

/** The period in one sentence, above the numbers. */
const headline = (summary: TSummary, scope: string) => {
  const { ticketsSold, ticketsSoldChange } = summary;
  if (!ticketsSold) return `No tickets sold${scope} in the last 30 days.`;
  const sold = `${plural(ticketsSold, "ticket")} sold${scope} in the last 30 days`;
  if (ticketsSoldChange === null)
    return `${sold}, up from none the month before.`;
  if (ticketsSoldChange === 0) return `${sold}, level with the month before.`;
  return `${sold}, ${Math.abs(ticketsSoldChange)}% ${ticketsSoldChange > 0 ? "up on" : "down on"} the month before.`;
};

const daysUntil = (date: string) =>
  Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000));

const Panel: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = "",
  children,
}) => (
  <article
    className={`rounded-[1.6rem] border border-secondary-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-6 ${className}`}
  >
    {children}
  </article>
);

const Label: React.FC<{
  children: React.ReactNode;
  aside?: React.ReactNode;
}> = ({ children, aside }) => (
  <div className="flex items-baseline justify-between gap-3">
    <p className="text-sm font-medium text-secondary-500">{children}</p>
    {aside && <span className="text-xs text-secondary-400">{aside}</span>}
  </div>
);

const NextEvent: React.FC<{ event?: TEvent; upcoming: number }> = ({
  event,
  upcoming,
}) => {
  if (!event) {
    return (
      <Panel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label>Next event</Label>
          <p className="mt-1 text-lg font-bold text-secondary-950">
            Nothing scheduled
          </p>
        </div>
        <Link
          href={ROUTES.CREATE_EVENT.href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-secondary-800 hover:underline"
        >
          Create an event <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </Panel>
    );
  }
  const days = daysUntil(event.date);
  const left = Math.max(event.capacity - event.sold, 0);
  return (
    <Panel className="grid gap-5 md:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1.6fr)] md:items-center md:gap-8">
      <div className="min-w-0">
        <Label>
          Next event
          {upcoming > 1 ? ` · ${number(upcoming - 1)} more after` : ""}
        </Label>
        <p className="mt-1 truncate text-lg font-bold text-secondary-950">
          {event.name}
        </p>
        <p className="text-xs text-secondary-500">
          {formatEventTime(event.date)}
        </p>
      </div>
      <div className="md:border-x md:border-secondary-100 md:px-8">
        <p className="text-4xl font-bold tracking-tight text-secondary-950">
          {event.hasStarted ? "Live" : days === 0 ? "Today" : number(days)}
        </p>
        <p className="text-xs text-secondary-500">
          {event.hasStarted
            ? "happening now"
            : days === 0
              ? "doors open later"
              : `${days === 1 ? "day" : "days"} to go`}
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span>
            <b className="text-xl text-secondary-950">{number(event.sold)}</b>
            <span className="text-secondary-500">
              {event.capacity ? ` of ${number(event.capacity)} sold` : " sold"}
            </span>
          </span>
          {event.capacity > 0 && (
            <span className="text-xs font-semibold text-secondary-500">
              {event.sold >= event.capacity
                ? "Sold out"
                : `${number(left)} left`}
            </span>
          )}
        </div>
        {event.capacity > 0 && (
          <SplitMeter
            value={event.sold}
            total={event.capacity}
            label={`${event.sold} of ${event.capacity} tickets sold`}
          />
        )}
        <Link
          href={`/app/tickets?event=${event.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-secondary-700 hover:underline"
        >
          See who&apos;s coming <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>
    </Panel>
  );
};

type TRevenue = TSummary["revenue"][number];

/** One currency large with its daily trend; any others as chips underneath. */
const RevenuePanel: React.FC<{
  revenue: { main?: TRevenue; others: TRevenue[] };
  points: TDailyPoint[];
  money: Intl.NumberFormat | null;
}> = ({ revenue, points, money }) => (
  <Panel className="flex flex-col gap-2">
    <Label aside={revenue.main?.code}>Revenue</Label>
    <p className="text-3xl font-bold tracking-tight text-secondary-950">
      {revenue.main?.total.formatted?.withCurrency ?? "No sales yet"}
    </p>
    {revenue.main && (
      <Change
        value={revenue.main.change}
        hasCurrent={revenue.main.total.amount > 0}
        versus={VERSUS}
      />
    )}
    {revenue.main && money && revenue.main.total.amount > 0 && (
      <Sparkline points={points} format={(value) => money.format(value)} />
    )}
    {revenue.others.length > 0 && (
      <ul className="flex flex-wrap gap-1.5 pt-1" aria-label="Other currencies">
        {revenue.others.map((item) => (
          <li
            key={item.code}
            className="rounded-full bg-secondary-50 px-2 py-0.5 text-xs font-semibold text-secondary-700"
          >
            {item.total.formatted?.withCurrency}
          </li>
        ))}
      </ul>
    )}
  </Panel>
);

/** Who came, out of everyone holding a ticket for an event that has started. */
const TurnUpPanel: React.FC<{ summary: TSummary }> = ({ summary }) => {
  const notIn = summary.checkInBase - summary.checkedIn;
  return (
    <Panel className="flex flex-col gap-3">
      <Label
        aside={summary.checkInBase ? "events that have started" : undefined}
      >
        Turn-up rate
      </Label>
      <p className="text-3xl font-bold tracking-tight text-secondary-950">
        {summary.checkInRate === null ? "—" : `${summary.checkInRate}%`}
      </p>
      {summary.checkInBase > 0 ? (
        <>
          <SplitMeter
            value={summary.checkedIn}
            total={summary.checkInBase}
            label={`${summary.checkedIn} of ${summary.checkInBase} ticket holders came`}
          />
          <div className="flex justify-between text-xs text-secondary-500">
            <span>
              <span className="mr-1.5 inline-block size-2 rounded-full bg-[#0577FA] align-middle" />
              <b className="text-secondary-900">{number(summary.checkedIn)}</b>{" "}
              came
            </span>
            <span>
              <span className="mr-1.5 inline-block size-2 rounded-full bg-secondary-100 align-middle" />
              <b className="text-secondary-900">{number(notIn)}</b> didn&apos;t,
              or weren&apos;t scanned
            </span>
          </div>
        </>
      ) : (
        <p className="text-xs text-secondary-500">
          Fills in once one of your events has started.
        </p>
      )}
    </Panel>
  );
};

/**
 * The top of the vendor dashboard: the last 30 days at a glance. Tickets lead
 * with a daily chart; revenue, turn-up and the next event sit beside it. Same
 * data as Analysis, which has the other periods.
 */
const DashboardOverview = () => {
  const userDetails = useUserStore((state) => state.userDetails);
  const { can } = useActingVendor();
  const ownCurrency = getCurrencyForCountry(
    userDetails?.platformCurrency ||
      userDetails?.countryCode ||
      userDetails?.country,
  ).code;

  // Same pattern as Analysis: the currency list comes from the unfiltered answer.
  const { data: everything, isPending } = useVendorInsights(DAYS);
  const codes = useMemo(
    () =>
      [...(everything?.currencies ?? [])].sort((a, b) =>
        a === ownCurrency ? -1 : b === ownCurrency ? 1 : a.localeCompare(b),
      ),
    [everything?.currencies, ownCurrency],
  );
  const filter = useCurrencyFilter(codes);
  const { data: filtered } = useVendorInsights(
    DAYS,
    filter.isFiltered ? filter.selected : undefined,
  );
  const data = filter.isFiltered ? filtered : everything;
  const summary = data?.summary;

  // Money is shown one currency at a time: the picked one, else their own.
  const revenue = useMemo(() => {
    const list = [...(summary?.revenue ?? [])].sort((a, b) =>
      a.code === ownCurrency
        ? -1
        : b.code === ownCurrency
          ? 1
          : b.total.amount - a.total.amount,
    );
    const main = filter.isFiltered
      ? list.find((item) => item.code === filter.selected)
      : list[0];
    return { main, others: list.filter((item) => item !== main) };
  }, [filter.isFiltered, filter.selected, ownCurrency, summary?.revenue]);

  const ticketPoints = useMemo(
    () =>
      (data?.series ?? []).map((point) => ({
        start: point.start,
        value: point.tickets,
      })),
    [data?.series],
  );
  const revenuePoints = useMemo(
    () =>
      revenue.main
        ? (data?.series ?? []).map((point) => ({
            start: point.start,
            value: point.revenue[revenue.main!.code] ?? 0,
          }))
        : [],
    [data?.series, revenue.main],
  );
  const money = useMemo(
    () =>
      revenue.main
        ? new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: revenue.main.code,
            maximumFractionDigits: 0,
          })
        : null,
    [revenue.main],
  );
  const nextEvent = useMemo(
    () =>
      (data?.events ?? [])
        .filter((event) => !event.isPast)
        .sort((a, b) => +new Date(a.date) - +new Date(b.date))[0],
    [data?.events],
  );

  if (!can("SALES_VIEW")) return null;

  const scope = filter.isFiltered ? ` on ${filter.selected} events` : "";

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
            Last 30 days
          </p>
          <h1 className="text-[clamp(1.8rem,3.4vw,2.6rem)] font-bold leading-tight tracking-tight text-secondary-950">
            How you&apos;re doing
          </h1>
          <p className="text-sm text-secondary-500">
            {summary ? (
              <>
                {headline(summary, scope)}{" "}
                {summary.events > 0 &&
                  `${number(summary.upcomingEvents)} of your ${plural(summary.events, "event")} still to come.`}
              </>
            ) : isPending ? (
              <span className="inline-block h-4 w-72 max-w-full animate-pulse rounded bg-secondary-100" />
            ) : (
              "We couldn't load your numbers. Refresh to try again."
            )}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <CurrencyFilter
            totals={codes.map<TCurrencyTotal>((code) => ({
              code,
              amount: 0,
              formatted: "",
            }))}
            selected={filter.selected}
            onSelect={filter.select}
          />
          <Link
            href={ROUTES.ANALYSIS.href}
            className="inline-flex items-center gap-1 text-sm font-semibold text-secondary-600 hover:text-secondary-900"
          >
            Full report <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      {!summary ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-72 animate-pulse rounded-[1.6rem] bg-secondary-100/70 lg:col-span-2" />
          <div className="h-72 animate-pulse rounded-[1.6rem] bg-secondary-100/70" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {/* The hero: tickets, and how they came in day by day. */}
            <Panel className="flex flex-col gap-4 lg:col-span-2">
              <Label
                aside={
                  summary.buyers
                    ? `${plural(summary.buyers, "buyer")}`
                    : undefined
                }
              >
                Tickets sold
              </Label>
              <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
                <p className="text-[56px] font-bold leading-none tracking-tight text-secondary-950">
                  {number(summary.ticketsSold)}
                </p>
                <div className="pb-1.5">
                  <Change
                    value={summary.ticketsSoldChange}
                    hasCurrent={summary.ticketsSold > 0}
                    versus={VERSUS}
                  />
                </div>
              </div>
              <div className="mt-auto">
                {summary.ticketsSold ? (
                  <DailyColumns
                    points={ticketPoints}
                    format={number}
                    unit={(value) => (value === 1 ? "ticket" : "tickets")}
                  />
                ) : (
                  <p className="rounded-2xl border border-dashed border-secondary-200 py-10 text-center text-sm text-secondary-500">
                    Sales will chart here, day by day.
                  </p>
                )}
              </div>
            </Panel>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <RevenuePanel
                revenue={revenue}
                points={revenuePoints}
                money={money}
              />
              <TurnUpPanel summary={summary} />
            </div>
          </div>

          <NextEvent event={nextEvent} upcoming={summary.upcomingEvents} />
        </>
      )}

      <details className="group rounded-[1.25rem] border border-secondary-100 bg-white px-5 py-3 text-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-secondary-800">
          How these are counted
          <ChevronDown
            className="size-4 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <ul className="mt-3 space-y-2 pb-2 leading-6 text-secondary-600">
          <li>
            <b className="text-secondary-900">Tickets sold</b>: paid for, or
            approved for events that need approval, minus refunds. Free tickets
            count too.
          </li>
          <li>
            <b className="text-secondary-900">The arrow</b>: the last 30 days
            against the 30 days before. &ldquo;New&rdquo; means there was
            nothing to compare with.
          </li>
          <li>
            <b className="text-secondary-900">Revenue</b>: ticket prices added
            up, one currency at a time. Your payouts are in{" "}
            <Link href={ROUTES.WALLET.href} className="font-semibold underline">
              Wallet
            </Link>
            .
          </li>
          <li>
            <b className="text-secondary-900">Turn-up rate</b>: tickets scanned
            in at the door, out of every ticket for your events that have
            started.
          </li>
        </ul>
      </details>
    </section>
  );
};

export default memo(DashboardOverview);
