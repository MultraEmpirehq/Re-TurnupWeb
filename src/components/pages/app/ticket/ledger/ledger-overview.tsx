"use client";

import { Amount } from "@/components/pages/app/wallet/amount";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TLedgerSummary,
  useVendorCheckInByEvent,
} from "@/hooks/use-vendor-tickets";
import { formatEventTime } from "@/lib/event-time";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { memo } from "react";

const Count = ({
  label,
  value,
  note,
  children,
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <div className="min-w-0 rounded-2xl border border-secondary-100 bg-white p-5">
    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
    <p className="mt-2 truncate text-2xl font-bold text-secondary-950">{value}</p>
    {children}
    {note && <p className="mt-1 truncate text-xs text-muted-foreground">{note}</p>}
  </div>
);

const Bar = ({ value, max, tone = "green" }: { value: number; max: number; tone?: "green" | "blue" }) => (
  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary-50">
    <div
      className={cn("h-full rounded-full", tone === "green" ? "bg-emerald-500" : "bg-secondary-500")}
      style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }}
    />
  </div>
);

/**
 * The ledger at a glance: tickets, how many are in, what they're worth, and
 * check-in so far at each upcoming or live event.
 */
const LedgerOverview = ({
  summary,
  onPickEvent,
}: {
  summary: TLedgerSummary | null | undefined;
  /** Narrows the ledger to an event (its door list). */
  onPickEvent: (eventId: string) => void;
}) => {
  const checkIn = useVendorCheckInByEvent();
  const all = summary?.all ?? 0;
  const inside = summary?.checkedIn ?? 0;
  const percent = all ? Math.round((inside / all) * 100) : 0;
  const value = summary?.value ?? [];
  const events = checkIn.data ?? [];

  return (
    <div className="space-y-5">
      {summary ? (
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Count
            label="Tickets issued"
            value={all.toLocaleString()}
            note={
              summary.orders !== undefined
                ? `${summary.orders.toLocaleString()} order${summary.orders === 1 ? "" : "s"} · ${summary.events ?? 0} event${summary.events === 1 ? "" : "s"}`
                : undefined
            }
          />
          <Count
            label="Checked in"
            value={
              <>
                {inside.toLocaleString()}
                <span className="text-base font-semibold text-muted-foreground"> · {percent}%</span>
              </>
            }
          >
            <Bar value={inside} max={all} />
          </Count>
          <Count
            label="Ticket value"
            value={
              value.length ? (
                value.map((money, index) => (
                  <span key={money.currency.code}>
                    {index > 0 && <span className="text-muted-foreground"> · </span>}
                    <Amount value={money.formatted.withCurrency} />
                  </span>
                ))
              ) : (
                <Amount value="0" />
              )
            }
            note="What buyers paid · see Wallet"
          />
          <Count
            label="Sent on · Refunded"
            value={
              <>
                {(summary.transferred ?? 0).toLocaleString()}
                <span className="text-muted-foreground"> · </span>
                {(summary.refunded ?? 0).toLocaleString()}
              </>
            }
            note={
              summary.pending
                ? `${summary.pending} waiting for your approval`
                : "Passed to someone else, or money back"
            }
          />
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[106px] rounded-2xl" />
          ))}
        </div>
      )}

      {events.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-secondary-950">Check-in by event</h2>
            <span className="text-xs font-semibold text-muted-foreground">Upcoming and live</span>
          </div>
          <div className="scrollbar-none -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-1">
            {events.map((event) => {
              const eventPercent = event.sold ? Math.round((event.checkedIn / event.sold) * 100) : 0;
              return (
                <div
                  key={event.id}
                  className={cn(
                    "w-[280px] shrink-0 snap-start rounded-2xl border p-4",
                    event.live
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-secondary-100 bg-white",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-secondary-950">{event.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatEventTime(event.date, event.timezone)}
                      </p>
                    </div>
                    {event.live && (
                      <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <p className="text-2xl font-bold text-secondary-950">
                      {event.checkedIn.toLocaleString()}
                      <span className="text-sm font-semibold text-muted-foreground">
                        {" "}
                        / {event.sold.toLocaleString()} in
                      </span>
                    </p>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        event.live ? "text-emerald-700" : "text-muted-foreground",
                      )}
                    >
                      {eventPercent}%
                    </p>
                  </div>
                  <Bar value={event.checkedIn} max={event.sold} tone={event.live ? "green" : "blue"} />
                  {event.live ? (
                    <Link
                      href="/app/scan"
                      className="mt-3 inline-block text-xs font-semibold text-secondary-600 hover:underline"
                    >
                      Open scanner →
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onPickEvent(event.id)}
                      className="mt-3 text-xs font-semibold text-secondary-600 hover:underline"
                    >
                      Door list →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default memo(LedgerOverview);
