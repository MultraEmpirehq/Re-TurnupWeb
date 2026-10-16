"use client";

import { constructErrorMessage } from "@/api/functions";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IAdminDashboard,
  TDashboardDays,
  useAdminDashboard,
  useImportPlayDownloads,
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
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { ROUTES } from "@/lib/variables";
import Link from "next/link";
import React, { memo, useMemo, useState } from "react";
import QuickLinks from "./quick-links";
import { toast } from "sonner";
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
    className={cn("rounded-xl border p-4", className)}
    style={{ background: CARD, borderColor: LINE }}
  >
    {children}
  </section>
);

const ADMIN = ROUTES.ADMIN_OVERVIEW.href;

/**
 * A tile that opens the page you'd go to next from it, or a plain tile. The
 * small arrow shows it's a way through.
 */
const Tile: React.FC<{
  href?: string;
  label?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ href, label, className, children }) =>
  href ? (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "group relative block p-4 transition-colors hover:bg-white/[0.04]",
        className,
      )}
    >
      <ArrowUpRight
        className="absolute top-3 right-3 size-4 text-white/30 transition-colors group-hover:text-white/80"
        aria-hidden
      />
      {children}
    </Link>
  ) : (
    <div className={cn("p-4", className)}>{children}</div>
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
  <ResponsiveContainer width="100%" height={220}>
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
    if (sections?.growth) {
      const visitors = sections.growth.series.reduce(
        (sum, point) => sum + point.value,
        0,
      );
      list.push({
        key: "visitors",
        label: "Visitors per day",
        total: compact(visitors),
        change: null,
        data: sections.growth.series,
        unit: (value) => `${value} visitor${value === 1 ? "" : "s"}`,
      });
    }
    return list;
  }, [money, sections]);
  const measure =
    measures.find((item) => item.key === measureKey) ?? measures[0] ?? null;
  const latest = data?.activity?.[0];

  return (
    <div
      className="-mx-4 -mt-6 -mb-10 min-h-[calc(100vh-4rem)] space-y-4 px-4 pt-6 pb-10 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      style={{ background: INK }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
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
          <QuickLinks />
          {sections?.growth && <Audience growth={sections.growth} />}

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
          {sections?.growth && <Downloads growth={sections.growth} />}
          <Activity activity={data.activity} />

          {!sections?.people &&
            !sections?.events &&
            !sections?.money &&
            !sections?.growth &&
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
  const { has } = useAdminPermissions();
  const tiles: {
    label: string;
    value: string;
    change?: number | null;
    note?: string;
    href?: string;
  }[] = [];
  if (people) {
    tiles.push({
      href: ROUTES.ADMIN_USERS.href,
      label: "People on Turnupz",
      value: people.total.toLocaleString(),
      change: people.newPeople.change,
      note: `${people.newPeople.value.toLocaleString()} new`,
    });
  }
  if (money) {
    tiles.push({
      href: has("REFUNDS_MANAGE") ? `${ADMIN}/finance/refunds` : undefined,
      label: "Ticket sales",
      value: money.sales.value.formatted.withCurrency,
      change: money.sales.change,
      note: `${money.orders.value.toLocaleString()} orders`,
    });
  }
  if (events) {
    tiles.push({
      href: `${ADMIN}/events`,
      label: "Tickets issued",
      value: events.ticketsIssued.value.toLocaleString(),
      change: events.ticketsIssued.change,
    });
    tiles.push({
      href: `${ADMIN}/events`,
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
          <Tile key={tile.label} href={tile.href} label={`${tile.label}: open`}>
            <Label>{tile.label}</Label>
            <p className="mt-1.5 text-2xl font-bold tracking-tight">
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
          </Tile>
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
      <div key="fees" className="p-4">
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
      <div key="tickets" className="p-4">
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
      <div key="mix" className="p-4">
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
      <div key="people" className="p-4">
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
}> = ({ engagement, days }) => {
  const { has } = useAdminPermissions();
  return (
    <Card className="p-0">
      <div className="px-4 pt-4">
        <Label>Engagement</Label>
      </div>
      <div className="grid grid-cols-1 divide-y divide-white/[0.08] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-4">
          <p className="text-2xl font-bold">{engagement.active30.share}%</p>
          <p className="text-xs text-white/60">
            Got a ticket in the last <b className="text-white">30 days</b> (
            {engagement.active30.count.toLocaleString()})
          </p>
        </div>
        <div className="p-4">
          <p className="text-2xl font-bold">{engagement.active7.share}%</p>
          <p className="text-xs text-white/60">
            Got a ticket in the last <b className="text-white">7 days</b> (
            {engagement.active7.count.toLocaleString()})
          </p>
        </div>
        <Tile
          href={
            has("MARKETING_MANAGE") ? `${ADMIN}/marketing/referrals` : undefined
          }
          label="Invite sign-ups: open referrals"
        >
          <p className="text-2xl font-bold">
            {engagement.referredSignUps.toLocaleString()}
          </p>
          <p className="text-xs text-white/60">
            Joined with an invite code in {days} days
          </p>
        </Tile>
      </div>
    </Card>
  );
};

/* --------------------------------------------- super admins: audience */

type TGrowth = NonNullable<IAdminDashboard["sections"]["growth"]>;

/** A number that's live right now, with a pulsing blue dot. */
const LiveTile: React.FC<{ label: string; value: number; hint: string }> = ({
  label,
  value,
  hint,
}) => (
  <div className="p-4">
    <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-white/60 uppercase">
      <span className="relative flex size-2">
        <span
          className="absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:hidden"
          style={{ background: BLUE }}
        />
        <span
          className="relative inline-flex size-2 rounded-full"
          style={{ background: BLUE }}
        />
      </span>
      {label}
    </p>
    <p className="mt-1.5 text-2xl font-bold tracking-tight">
      {value.toLocaleString()}
    </p>
    <p className="mt-1 text-xs text-white/50">{hint}</p>
  </div>
);

/**
 * Who's on Turnupz: attendees and vendors in total, who's online now (seen in
 * the last 5 minutes) and how many visited over each period, signed in or not.
 */
const Audience: React.FC<{ growth: TGrowth }> = ({ growth }) => {
  const { totals, online, visited } = growth;
  const { has } = useAdminPermissions();
  const usersHref = has("USERS_VIEW") ? ROUTES.ADMIN_USERS.href : undefined;
  return (
    <div className="space-y-4">
      <Card className="p-0">
        <div className="grid grid-cols-1 divide-y divide-white/[0.08] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x">
          <Tile href={usersHref} label="Attendees: open users">
            <Label>Attendees</Label>
            <p className="mt-1.5 text-2xl font-bold tracking-tight">
              {totals.attendees.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-white/50">On Turnupz</p>
          </Tile>
          <Tile href={usersHref} label="Vendors: open users">
            <Label>Vendors & businesses</Label>
            <p className="mt-1.5 text-2xl font-bold tracking-tight">
              {totals.vendors.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-white/50">
              {totals.verifiedSellers} selling · {totals.freeHosts} free hosts
            </p>
          </Tile>
          <LiveTile
            label="Attendees online"
            value={online.attendees}
            hint="Active in the last 5 minutes"
          />
          <LiveTile
            label="Vendors online"
            value={online.vendors}
            hint="Active in the last 5 minutes"
          />
          <LiveTile
            label="Visitors online"
            value={online.anonymous}
            hint="Not signed in, last 5 minutes"
          />
        </div>
      </Card>

      <Card className="p-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-4">
          <Label>Visited</Label>
          <p className="text-xs text-white/50">
            Each person counted once per period · all time starts when tracking
            began
          </p>
        </div>
        <div className="overflow-x-auto px-4 pb-3">
          <table className="mt-3 w-full min-w-[560px] text-sm">
            <thead className="text-left text-xs text-white/50">
              <tr className="border-b" style={{ borderColor: LINE }}>
                <th className="py-2 font-medium">Period</th>
                <th className="py-2 text-right font-medium">Attendees</th>
                <th className="py-2 text-right font-medium">Vendors</th>
                <th className="py-2 text-right font-medium">Not signed in</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {visited.map((row) => (
                <tr
                  key={row.key}
                  className="border-b last:border-0"
                  style={{ borderColor: LINE }}
                >
                  <td className="py-1.5 text-white/80">{row.label}</td>
                  <td className="py-1.5 text-right font-semibold tabular-nums">
                    {row.attendees.toLocaleString()}
                  </td>
                  <td className="py-1.5 text-right font-semibold tabular-nums">
                    {row.vendors.toLocaleString()}
                  </td>
                  <td className="py-1.5 text-right font-semibold tabular-nums">
                    {row.anonymous.toLocaleString()}
                  </td>
                  <td className="py-1.5 text-right font-bold tabular-nums">
                    {(
                      row.attendees +
                      row.vendors +
                      row.anonymous
                    ).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/** Our own install count now; the stores' figures once they're connected. */
const Downloads: React.FC<{ growth: TGrowth }> = ({ growth }) => {
  const { installs, stores } = growth;
  const importPlay = useImportPlayDownloads();
  const store = (value: number | null, connected?: boolean) =>
    value === null ? (
      <span className="text-base font-semibold text-white/40">
        Not connected yet
      </span>
    ) : connected && value === 0 ? (
      <span className="text-base font-semibold text-white/60">
        Connected, figures on the way
      </span>
    ) : (
      value.toLocaleString()
    );
  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
        <Label>Downloads</Label>
        {stores.googlePlayConnected && (
          <button
            type="button"
            disabled={importPlay.isPending}
            onClick={() =>
              importPlay.mutate(undefined, {
                onSuccess: (result) =>
                  toast.success(
                    result?.imported
                      ? `Play Store: ${result.imported} days imported`
                      : "Play Store has no report yet. Try again tomorrow.",
                  ),
                onError: (error) =>
                  toast.error(
                    constructErrorMessage(
                      error as TApiErrorResponseType,
                      "Couldn't read the Play Console reports",
                    ),
                  ),
              })
            }
            className="rounded-md px-2 py-1 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {importPlay.isPending ? "Importing…" : "Import Play Store now"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 divide-y divide-white/[0.08] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-4">
          <p className="text-xs text-white/60">Google Play Store</p>
          <p className="mt-1 text-2xl font-bold">
            {store(stores.googlePlay, stores.googlePlayConnected)}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {installs.android.toLocaleString()} Android installs opened the app
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-white/60">Apple App Store</p>
          <p className="mt-1 text-2xl font-bold">{store(stores.appStore)}</p>
          <p className="mt-1 text-xs text-white/50">
            {installs.ios.toLocaleString()} iPhone installs opened the app
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-white/60">Total downloads</p>
          <p className="mt-1 text-2xl font-bold">
            {stores.total === null
              ? installs.total.toLocaleString()
              : stores.total.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {stores.total === null
              ? `App installs so far · ${installs.newThisPeriod} new this period`
              : `From the stores · ${installs.total.toLocaleString()} installs opened the app`}
          </p>
        </div>
      </div>
    </Card>
  );
};

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
  <div className="space-y-4">
    <Skeleton className="h-32 w-full rounded-2xl bg-white/[0.06]" />
    <Skeleton className="h-80 w-full rounded-2xl bg-white/[0.06]" />
    <Skeleton className="h-32 w-full rounded-2xl bg-white/[0.06]" />
  </div>
);

export default memo(AdminDashboard);
