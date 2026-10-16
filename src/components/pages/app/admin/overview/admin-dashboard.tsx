"use client";

import { constructErrorMessage } from "@/api/functions";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IAdminDashboard,
  TDashboardDays,
  useAdminDashboard,
} from "@/hooks/use-admin-dashboard";
import { cn } from "@/lib/utils";
import useUserStore from "@/stores/user-store";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  ChevronDown,
  Minus,
  ShoppingBag,
  UserPlus,
} from "lucide-react";
import React, { memo, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/*
 * The admin overview, dark like a control room: headline numbers with their
 * change on the period before, one large chart you can switch between
 * measures, smaller cards beneath, and what just happened. Every chart is a
 * single series in brand blue on one axis; a section the admin's permissions
 * don't cover is never fetched or drawn.
 */

const INK = "#07141D";
const CARD = "#0B1D2A";
const LINE = "rgba(255,255,255,0.08)";
const BLUE = "#00B2FF";
const MUTED = "#A1A1AA";

type TPoint = { date: string; value: number };

const RANGES: { value: TDashboardDays; label: string }[] = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

const compact = (value: number) =>
  new Intl.NumberFormat(undefined, {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);

/** Up, down or flat on the period before: an arrow and a sign, not colour alone. */
const Change: React.FC<{ value: number | null; days: number }> = ({
  value,
  days,
}) => {
  if (value === null) {
    return <span className="text-xs text-white/50">new this period</span>;
  }
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold",
        value > 0
          ? "text-emerald-400"
          : value < 0
            ? "text-red-400"
            : "text-white/50",
      )}
      title={`Compared with the ${days} days before`}
    >
      <Icon className="size-3.5" aria-hidden />
      {value > 0 ? "+" : ""}
      {value}%
    </span>
  );
};

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <section
    className={cn("rounded-2xl border p-5", className)}
    style={{ background: CARD, borderColor: LINE }}
  >
    {children}
  </section>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">
    {children}
  </p>
);

/* ------------------------------------------------------------- tooltips */

const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: { value: number; payload: TPoint }[];
  unit: (value: number) => string;
}> = ({ active, payload, unit }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{ background: INK, borderColor: LINE }}
    >
      <p className="text-white/60">
        {format(new Date(point.payload.date), "d MMM yyyy")}
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-white">
        <span
          className="inline-block size-2 rounded-full"
          style={{ background: BLUE }}
        />
        {unit(point.value)}
      </p>
    </div>
  );
};

/* ---------------------------------------------------------------- charts */

const MainChart: React.FC<{
  data: TPoint[];
  unit: (value: number) => string;
}> = ({ data, unit }) => (
  <ResponsiveContainer width="100%" height={260}>
    <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="dash-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BLUE} stopOpacity={0.45} />
          <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <CartesianGrid stroke={LINE} vertical={false} />
      <XAxis
        dataKey="date"
        tickFormatter={(date: string) => format(new Date(date), "d MMM")}
        tick={{ fill: MUTED, fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        minTickGap={32}
      />
      <YAxis
        tickFormatter={(value: number) => compact(value)}
        tick={{ fill: MUTED, fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        width={44}
        allowDecimals={false}
      />
      <Tooltip
        cursor={{ stroke: "rgba(255,255,255,0.35)", strokeWidth: 1 }}
        content={<ChartTooltip unit={unit} />}
      />
      <Area
        type="monotone"
        dataKey="value"
        stroke={BLUE}
        strokeWidth={2}
        fill="url(#dash-area)"
        activeDot={{ r: 5, stroke: CARD, strokeWidth: 2, fill: BLUE }}
        isAnimationActive
      />
    </AreaChart>
  </ResponsiveContainer>
);

/** A small trend under a number, with its own hover. */
const Sparkline: React.FC<{
  data: TPoint[];
  unit: (value: number) => string;
  kind?: "line" | "bars";
}> = ({ data, unit, kind = "line" }) => (
  <ResponsiveContainer width="100%" height={56}>
    {kind === "bars" ? (
      <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <Tooltip cursor={false} content={<ChartTooltip unit={unit} />} />
        <Bar dataKey="value" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={8} />
      </BarChart>
    ) : (
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.3)" }}
          content={<ChartTooltip unit={unit} />}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={BLUE}
          strokeWidth={2}
          fill={BLUE}
          fillOpacity={0.08}
          dot={false}
          activeDot={{ r: 4, stroke: CARD, strokeWidth: 2, fill: BLUE }}
        />
      </AreaChart>
    )}
  </ResponsiveContainer>
);

/* ------------------------------------------------------------- dashboard */

type TMeasure = {
  key: string;
  label: string;
  total: string;
  change: number | null;
  data: TPoint[];
  unit: (value: number) => string;
};

const AdminDashboard = () => {
  const firstName = useUserStore((state) => state.userDetails?.firstName);
  const [days, setDays] = useState<TDashboardDays>(30);
  const { data, error, isLoading, refetch } = useAdminDashboard(days);
  const [currency, setCurrency] = useState<string | null>(null);
  const [measureKey, setMeasureKey] = useState<string | null>(null);

  const sections = data?.sections;
  const money =
    sections?.money?.find((row) => row.currency === currency) ??
    sections?.money?.[0] ??
    null;

  // Whatever the admin may see becomes something the big chart can show.
  const measures = useMemo<TMeasure[]>(() => {
    const list: TMeasure[] = [];
    if (money) {
      const asMoney = (value: number) =>
        new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: money.currency,
          maximumFractionDigits: 0,
        }).format(value);
      list.push({
        key: "sales",
        label: `Ticket sales (${money.currency})`,
        total: money.sales.value.formatted.withCurrency,
        change: money.sales.change,
        data: money.series,
        unit: asMoney,
      });
    }
    if (sections?.events) {
      list.push({
        key: "tickets",
        label: "Tickets issued",
        total: compact(sections.events.ticketsIssued.value),
        change: sections.events.ticketsIssued.change,
        data: sections.events.series,
        unit: (value) => `${value} ticket${value === 1 ? "" : "s"}`,
      });
    }
    if (sections?.people) {
      list.push({
        key: "people",
        label: "New people",
        total: compact(sections.people.newPeople.value),
        change: sections.people.newPeople.change,
        data: sections.people.series,
        unit: (value) => `${value} joined`,
      });
    }
    return list;
  }, [money, sections]);
  const measure =
    measures.find((item) => item.key === measureKey) ?? measures[0] ?? null;
  const latest = data?.activity?.[0];

  return (
    <div
      className="-mx-4 -mt-6 -mb-10 min-h-[calc(100vh-4rem)] space-y-5 px-4 pt-6 pb-10 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      style={{ background: INK }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-white/60">
            {firstName ? `Welcome back, ${firstName}. ` : ""}
            The last {days} days, against the {days} before.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {latest && (
            <div
              className="flex items-center gap-3 rounded-xl border px-3 py-2"
              style={{ background: CARD, borderColor: LINE }}
            >
              <ActivityIcon kind={latest.kind} />
              <div className="text-xs">
                <p className="font-semibold">{latest.title}</p>
                <p className="text-white/50">
                  {formatDistanceToNow(new Date(latest.at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          )}
          <div
            role="radiogroup"
            aria-label="Period"
            className="inline-flex rounded-lg border p-1"
            style={{ background: CARD, borderColor: LINE }}
          >
            {RANGES.map((range) => (
              <button
                key={range.value}
                type="button"
                role="radio"
                aria-checked={days === range.value}
                onClick={() => setDays(range.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  days === range.value
                    ? "bg-white text-[#07141D]"
                    : "text-white/70 hover:text-white",
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && <DashboardSkeleton />}
      {!!error && !isLoading && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Could not load the dashboard",
          )}
          retryFunction={() => void refetch()}
        />
      )}

      {data && (
        <>
          <KpiRow data={data} money={money} days={days} />

          {measure && (
            <Card>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center">
                    <span className="sr-only">Chart</span>
                    <select
                      value={measure.key}
                      onChange={(event) => setMeasureKey(event.target.value)}
                      className="appearance-none rounded-lg bg-transparent py-1 pr-7 text-sm font-semibold text-white focus:outline-none"
                    >
                      {measures.map((item) => (
                        <option
                          key={item.key}
                          value={item.key}
                          className="text-black"
                        >
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-1 size-4 text-white/60" />
                  </label>
                  <span className="text-sm font-semibold">{measure.total}</span>
                  <Change value={measure.change} days={days} />
                </div>
                {(sections?.money?.length ?? 0) > 1 &&
                  measure.key === "sales" && (
                    <div className="flex gap-1">
                      {sections!.money!.map((row) => (
                        <button
                          key={row.currency}
                          type="button"
                          onClick={() => setCurrency(row.currency)}
                          className={cn(
                            "rounded-md px-2 py-1 text-xs font-semibold",
                            row.currency === money?.currency
                              ? "bg-white/15 text-white"
                              : "text-white/60 hover:text-white",
                          )}
                        >
                          {row.currency}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
              <MainChart data={measure.data} unit={measure.unit} />
            </Card>
          )}

          <SecondRow data={data} money={money} days={days} />
          {sections?.engagement && (
            <Engagement engagement={sections.engagement} days={days} />
          )}
          <Activity activity={data.activity} />

          {!sections?.people &&
            !sections?.events &&
            !sections?.money &&
            !sections?.engagement && (
              <Card>
                <p className="text-sm text-white/70">
                  Your permissions don&apos;t include any dashboard figures.
                  Your sections are in the menu on the left.
                </p>
              </Card>
            )}
        </>
      )}
    </div>
  );
};

/* ------------------------------------------------------------ sections */

type TMoneyRow = NonNullable<IAdminDashboard["sections"]["money"]>[number];

const KpiRow: React.FC<{
  data: IAdminDashboard;
  money: TMoneyRow | null;
  days: number;
}> = ({ data, money, days }) => {
  const { people, events } = data.sections;
  const tiles: {
    label: string;
    value: string;
    change?: number | null;
    note?: string;
  }[] = [];
  if (people) {
    tiles.push({
      label: "People on Turnupz",
      value: people.total.toLocaleString(),
      change: people.newPeople.change,
      note: `${people.newPeople.value.toLocaleString()} new`,
    });
  }
  if (money) {
    tiles.push({
      label: "Ticket sales",
      value: money.sales.value.formatted.withCurrency,
      change: money.sales.change,
      note: `${money.orders.value.toLocaleString()} orders`,
    });
  }
  if (events) {
    tiles.push({
      label: "Tickets issued",
      value: events.ticketsIssued.value.toLocaleString(),
      change: events.ticketsIssued.change,
    });
    tiles.push({
      label: "Upcoming events",
      value: events.upcoming.toLocaleString(),
      change: events.newEvents.change,
      note: `${events.newEvents.value} went live`,
    });
  }
  if (!tiles.length) return null;
  return (
    <Card className="p-0">
      <div className="grid grid-cols-1 divide-y divide-white/[0.08] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {tiles.map((tile) => (
          <div key={tile.label} className="p-5">
            <Label>{tile.label}</Label>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {tile.value}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {tile.change !== undefined && (
                <Change value={tile.change} days={days} />
              )}
              {tile.note && (
                <span className="text-xs text-white/50">{tile.note}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const SecondRow: React.FC<{
  data: IAdminDashboard;
  money: TMoneyRow | null;
  days: number;
}> = ({ data, money, days }) => {
  const { events, people } = data.sections;
  const cards: React.ReactNode[] = [];
  if (money) {
    cards.push(
      <div key="fees" className="p-5">
        <Label>Turnupz fees</Label>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-bold">
            {money.fees.value.formatted.withCurrency}
          </p>
          <Change value={money.fees.change} days={days} />
        </div>
        <p className="mt-1 text-xs text-white/50">
          Credit spent {money.creditSpent.value.formatted.withCurrency} ·
          refunds {money.refunds.value.formatted.withCurrency}
        </p>
      </div>,
    );
  }
  if (events) {
    cards.push(
      <div key="tickets" className="p-5">
        <Label>Tickets per day</Label>
        <Sparkline
          data={events.series}
          kind="bars"
          unit={(value) => `${value} ticket${value === 1 ? "" : "s"}`}
        />
      </div>,
    );
    const mix = [
      { label: "Selling on Turnupz", value: events.mix.selling },
      { label: "Registration", value: events.mix.register },
      { label: "External link", value: events.mix.external },
    ];
    const most = Math.max(1, ...mix.map((row) => row.value));
    cards.push(
      <div key="mix" className="p-5">
        <Label>Upcoming events by type</Label>
        <ul className="mt-3 space-y-2.5">
          {mix.map((row) => (
            <li key={row.label} className="text-xs">
              <div className="mb-1 flex justify-between text-white/70">
                <span>{row.label}</span>
                <span className="font-semibold text-white">{row.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06]">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${(row.value / most) * 100}%`,
                    background: BLUE,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>,
    );
  } else if (people) {
    cards.push(
      <div key="people" className="p-5">
        <Label>Sign-ups per day</Label>
        <Sparkline data={people.series} unit={(value) => `${value} joined`} />
      </div>,
    );
  }
  if (!cards.length) return null;
  return (
    <Card className="p-0">
      <div
        className={cn(
          "grid grid-cols-1 divide-y divide-white/[0.08] md:divide-y-0 md:divide-x",
          cards.length >= 3
            ? "md:grid-cols-3"
            : cards.length === 2
              ? "md:grid-cols-2"
              : "",
        )}
      >
        {cards}
      </div>
    </Card>
  );
};

const Engagement: React.FC<{
  engagement: NonNullable<IAdminDashboard["sections"]["engagement"]>;
  days: number;
}> = ({ engagement, days }) => (
  <Card className="p-0">
    <div className="px-5 pt-5">
      <Label>Engagement</Label>
    </div>
    <div className="grid grid-cols-1 divide-y divide-white/[0.08] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <div className="p-5">
        <p className="text-3xl font-bold">{engagement.active30.share}%</p>
        <p className="text-xs text-white/60">
          Got a ticket in the last <b className="text-white">30 days</b> (
          {engagement.active30.count.toLocaleString()})
        </p>
      </div>
      <div className="p-5">
        <p className="text-3xl font-bold">{engagement.active7.share}%</p>
        <p className="text-xs text-white/60">
          Got a ticket in the last <b className="text-white">7 days</b> (
          {engagement.active7.count.toLocaleString()})
        </p>
      </div>
      <div className="p-5">
        <p className="text-3xl font-bold">
          {engagement.referredSignUps.toLocaleString()}
        </p>
        <p className="text-xs text-white/60">
          Joined with an invite code in {days} days
        </p>
      </div>
    </div>
  </Card>
);

const ActivityIcon: React.FC<{ kind: "signup" | "order" | "event" }> = ({
  kind,
}) => {
  const Icon =
    kind === "signup"
      ? UserPlus
      : kind === "order"
        ? ShoppingBag
        : CalendarCheck;
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.08]">
      <Icon className="size-4" style={{ color: BLUE }} aria-hidden />
    </span>
  );
};

const ACTIVITY_TABS = [
  { value: "all", label: "Everything" },
  { value: "order", label: "Orders" },
  { value: "signup", label: "Sign-ups" },
  { value: "event", label: "Events" },
] as const;

const Activity: React.FC<{ activity: IAdminDashboard["activity"] }> = ({
  activity,
}) => {
  const [tab, setTab] =
    useState<(typeof ACTIVITY_TABS)[number]["value"]>("all");
  const kinds = new Set(activity.map((item) => item.kind));
  const tabs = ACTIVITY_TABS.filter(
    (item) => item.value === "all" || kinds.has(item.value),
  );
  const items = activity.filter((item) => tab === "all" || item.kind === tab);
  if (!activity.length) return null;
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <p className="font-semibold">Latest activity</p>
        <div className="flex gap-1">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold",
                tab === item.value
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-white/[0.06]">
        {items.map((item, index) => (
          <li
            key={`${item.kind}-${index}`}
            className="flex items-center gap-3 py-2.5"
          >
            <ActivityIcon kind={item.kind} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="truncate text-xs text-white/50">{item.detail}</p>
            </div>
            <span className="shrink-0 text-xs text-white/50">
              {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-5">
    <Skeleton className="h-32 w-full rounded-2xl bg-white/[0.06]" />
    <Skeleton className="h-80 w-full rounded-2xl bg-white/[0.06]" />
    <Skeleton className="h-32 w-full rounded-2xl bg-white/[0.06]" />
  </div>
);

export default memo(AdminDashboard);
