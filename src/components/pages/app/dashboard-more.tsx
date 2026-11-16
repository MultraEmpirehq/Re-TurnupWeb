"use client";

import {
  useVendorEarnings,
  VendorCurrencyEarnings,
} from "@/hooks/use-vendor-wallet";
import { IVendorInsights } from "@/hooks/use-vendor-tickets";
import { ROUTES } from "@/lib/variables";
import { useActingVendor } from "@/stores/workspace-store";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Amount } from "@/components/pages/app/wallet/amount";
import React, { memo, useMemo } from "react";

/**
 * The lower half of the organiser dashboard, from data we already collect:
 * how people found their events and bought, what brought each order, the
 * best-selling tickets, and what they earned after fees. Team members see
 * only the parts the owner allowed them (sales, the wallet).
 */

const number = (value: number) => value.toLocaleString();
const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;

const Panel: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = "",
  children,
}) => (
  <article
    className={`rounded-3xl border border-secondary-100 bg-card p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-6 ${className}`}
  >
    {children}
  </article>
);

const Heading: React.FC<{
  title: string;
  aside?: React.ReactNode;
  href?: string;
  linkLabel?: string;
}> = ({ title, aside, href, linkLabel }) => (
  <div className="mb-4 flex items-baseline justify-between gap-3">
    <h2 className="text-base font-bold text-secondary-950">{title}</h2>
    {href ? (
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-secondary-600 hover:text-secondary-900"
      >
        {linkLabel} <ArrowRight className="size-3" aria-hidden />
      </Link>
    ) : (
      aside && (
        <span className="shrink-0 text-xs text-secondary-400">{aside}</span>
      )
    )}
  </div>
);

/* --------------------------------------------------------------- funnel */

const STEPS = [
  { key: "views", label: "Saw an event page", of: null },
  { key: "ticketViews", label: "Opened the tickets", of: "of page views" },
  { key: "started", label: "Started checkout", of: "of ticket views" },
  { key: "bought", label: "Paid", of: "of checkouts" },
] as const;

type TFunnel = NonNullable<IVendorInsights["funnel"]>;

/** The step where the most people stop, if the drop is big enough to talk about. */
const biggestDrop = (funnel: TFunnel) => {
  let worst: { index: number; share: number } | null = null;
  STEPS.forEach((step, index) => {
    if (index === 0) return;
    const previous = funnel[STEPS[index - 1].key];
    // Too few to judge, or more than before (counting started late).
    if (previous < 10 || funnel[step.key] > previous) return;
    const share = funnel[step.key] / previous;
    if (share < 0.6 && (!worst || share < worst.share))
      worst = { index, share };
  });
  return worst as { index: number; share: number } | null;
};

/** A small heading inside the merged card. */
const SubHeading: React.FC<{ title: string; aside?: string }> = ({
  title,
  aside,
}) => (
  <div className="mb-3 flex items-baseline justify-between gap-3">
    <h3 className="text-xs font-semibold tracking-wide text-secondary-400 uppercase">
      {title}
    </h3>
    {aside && <span className="text-xs text-secondary-400">{aside}</span>}
  </div>
);

/** From seeing an event to paying, across their events, and where people stop. */
const FunnelBody: React.FC<{ funnel: TFunnel }> = ({ funnel }) => {
  const drop = biggestDrop(funnel);
  const top = Math.max(
    funnel.views,
    funnel.ticketViews,
    funnel.started,
    funnel.bought,
    1,
  );
  // Only when it means something: older visits weren't all counted, so paid
  // orders can match or beat page views.
  const overall =
    funnel.bought < funnel.views ? pct(funnel.bought, funnel.views) : null;
  return (
    <div className="min-w-0">
      <SubHeading
        title="From page view to paid"
        aside={
          overall !== null ? `${overall}% of page views bought` : undefined
        }
      />
      {funnel.views + funnel.started === 0 ? (
        <p className="rounded-2xl border border-dashed border-secondary-200 py-8 text-center text-sm text-secondary-500">
          Once people open your events, you&apos;ll see here how many go on to
          buy.
        </p>
      ) : (
        <ol className="space-y-3">
          {STEPS.map((step, index) => {
            const count = funnel[step.key];
            const previous = index > 0 ? funnel[STEPS[index - 1].key] : 0;
            const share = index > 0 ? pct(count, previous) : null;
            return (
              <li key={step.key} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-secondary-800">
                    {step.label}
                  </span>
                  <span className="tabular-nums">
                    <b className="text-secondary-950">{number(count)}</b>
                    {share !== null && step.of && (
                      <span className="text-xs text-secondary-500">
                        {" "}
                        · {Math.min(share, 100)}% {step.of}
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary-100">
                  <div
                    className="h-full rounded-full bg-[#0577FA]"
                    style={{
                      width: `${count ? Math.max((count / top) * 100, 2) : 0}%`,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {drop && (
        <div className="mt-4 rounded-2xl bg-warning-soft px-4 py-3 text-sm text-warning">
          <p className="font-semibold">
            Biggest drop: {STEPS[drop.index].label} ·{" "}
            {Math.round(drop.share * 100)}% of{" "}
            {STEPS[drop.index - 1].label.toLowerCase()}
          </p>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------- sources */

const SourcesBody: React.FC<{
  sources: NonNullable<IVendorInsights["sources"]>;
  codes: NonNullable<IVendorInsights["codes"]>;
}> = ({ sources, codes }) => (
  <div className="min-w-0">
    <SubHeading
      title="Where buyers come from"
      aside={sources.length ? "paid orders" : undefined}
    />
    {sources.length === 0 ? (
      <p className="rounded-2xl border border-dashed border-secondary-200 py-8 text-center text-sm text-secondary-500">
        After your first sales, you&apos;ll see what brought each buyer: share
        links, promo codes, Explore and more.
      </p>
    ) : (
      <ul className="space-y-3">
        {sources.map((row) => (
          <li key={row.key} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-secondary-800">
                {row.label}
              </span>
              <span className="tabular-nums">
                <b className="text-secondary-950">{number(row.orders)}</b>
                <span className="text-xs text-secondary-500">
                  {" "}
                  · {row.share ?? 0}% · {number(row.tickets)} tickets
                </span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary-100">
              <div
                className="h-full rounded-full bg-[#0577FA]"
                style={{ width: `${Math.max(row.share ?? 0, 2)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    )}
    {codes.length > 0 && (
      <div className="mt-5 border-t border-secondary-100 pt-4">
        <p className="mb-2 text-xs font-semibold tracking-wide text-secondary-400 uppercase">
          Top promo codes
        </p>
        <ul className="flex flex-wrap gap-2">
          {codes.map((code) => (
            <li
              key={code.code}
              className="rounded-full bg-secondary-50 px-3 py-1 text-xs"
            >
              <span className="font-mono font-semibold text-secondary-900">
                {code.code}
              </span>
              <span className="text-secondary-500">
                {" "}
                · {number(code.orders)} orders
              </span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

/**
 * How people find them, in one card: page views through to paid on one side,
 * what brought each paid order on the other.
 */
export const Discovery: React.FC<{ data: IVendorInsights }> = ({ data }) => (
  <Panel className="h-full">
    <Heading title="How people find you" />
    <div className="grid gap-8 md:grid-cols-2">
      <FunnelBody
        funnel={
          data.funnel ?? { views: 0, ticketViews: 0, started: 0, bought: 0 }
        }
      />
      <SourcesBody sources={data.sources ?? []} codes={data.codes ?? []} />
    </div>
  </Panel>
);

/* ----------------------------------------------------------- top tickets */

const TopTickets: React.FC<{ tickets: IVendorInsights["topTicketTypes"] }> = ({
  tickets,
}) => {
  const top = Math.max(...tickets.map((ticket) => ticket.sold), 1);
  return (
    <Panel>
      <Heading
        title="Best-selling tickets"
        href={ROUTES.ANALYSIS.href}
        linkLabel="All events"
      />
      {tickets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-secondary-200 py-8 text-center text-sm text-secondary-500">
          Your best sellers will show here.
        </p>
      ) : (
        <ul className="divide-y divide-secondary-100">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-secondary-950">
                  {ticket.name}
                </p>
                <p className="truncate text-xs text-secondary-500">
                  {ticket.eventName}
                </p>
              </div>
              <div className="text-right text-sm tabular-nums">
                <b className="text-secondary-950">{number(ticket.sold)}</b>
                <span className="block text-xs text-secondary-500">
                  <Amount
                    value={ticket.revenue.formatted?.withCurrency ?? ""}
                  />
                </span>
              </div>
              <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-secondary-100">
                <div
                  className="h-full rounded-full bg-secondary-800"
                  style={{ width: `${(ticket.sold / top) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

/* -------------------------------------------------------------- earnings */

/** What they kept in the last 30 days, after Turnupz's fee and Stripe's. */
const Earnings: React.FC<{ currency?: string }> = ({ currency }) => {
  const { data } = useVendorEarnings({ days: 30 });
  const row: VendorCurrencyEarnings | undefined = useMemo(() => {
    const list = data?.currencies ?? [];
    return list.find((item) => item.currency === currency) ?? list[0];
  }, [data?.currencies, currency]);

  return (
    <Panel>
      <Heading
        title="Your earnings"
        href={ROUTES.WALLET.href}
        linkLabel="Wallet"
      />
      {!row ? (
        <p className="text-sm text-secondary-500">
          Nothing earned in the last 30 days.
        </p>
      ) : (
        <>
          <p className="text-3xl font-bold tracking-tight text-secondary-950">
            <Amount value={row.earnings.formatted?.withCurrency ?? ""} />
          </p>
          <p className="text-xs text-secondary-500">
            yours after fees, last 30 days
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            {[
              ["Ticket sales", row.sales.formatted?.withCurrency],
              ["Turnupz fee", `−${row.fees.formatted?.withCurrency}`],
              ...(row.processingFees?.amount
                ? [
                    [
                      "Stripe fees",
                      `−${row.processingFees.formatted?.withCurrency}`,
                    ],
                  ]
                : []),
              ...(row.owed.amount
                ? [["Turnupz still owes you", row.owed.formatted?.withCurrency]]
                : []),
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-secondary-500">{label}</dt>
                <dd className="font-semibold text-secondary-900 tabular-nums">
                  <Amount value={value ?? ""} />
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </Panel>
  );
};

/* ----------------------------------------------------------------- all */

const DashboardMore: React.FC<{
  data?: IVendorInsights | null;
  currency?: string;
}> = ({ data, currency }) => {
  const { can } = useActingVendor();
  const sales = can("SALES_VIEW") && !!data;
  const money = can("FINANCE_VIEW");
  if (!sales && !money) return null;

  return (
    <section className="space-y-4" aria-label="More about your sales">
      {/* How people find you, with earnings beside it (a third, at its own height). */}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {sales && (
          <div className={money ? "lg:col-span-2" : "lg:col-span-3"}>
            <Discovery data={data!} />
          </div>
        )}
        {money && <Earnings currency={currency} />}
      </div>
      {sales && <TopTickets tickets={data!.topTicketTypes} />}
    </section>
  );
};

export default memo(DashboardMore);
