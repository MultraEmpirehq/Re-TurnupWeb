"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IAnalyticsEvent, IAnalyticsSource } from "@/hooks/use-admin-analytics";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import React from "react";
import { PERIODS, TPeriod } from "../finance/finance-ui";

export const count = (value: number) => value.toLocaleString();
export const pct = (value: number | null | undefined) =>
  value === null || value === undefined ? "–" : `${value}%`;

export const AnalyticsHeader: React.FC<{
  title: string;
  description: string;
  period: TPeriod;
  setPeriod: (period: TPeriod) => void;
  paidOnly?: boolean;
  setPaidOnly?: (paidOnly: boolean) => void;
  onExport?: () => void;
}> = ({ title, description, period, setPeriod, paidOnly, setPaidOnly, onExport }) => (
  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div className="space-y-1">
      <h1 className="text-xl font-bold text-secondary-800 dark:text-foreground">{title}</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {setPaidOnly && (
        <div className="inline-flex rounded-full border border-border bg-card p-1" role="group" aria-label="Which events">
          {[
            [false, "All events"],
            [true, "Paid only"],
          ].map(([value, label]) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={paidOnly === value}
              onClick={() => setPaidOnly(value as boolean)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                paidOnly === value ? "bg-secondary-800 text-white dark:bg-foreground dark:text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <Select value={period} onValueChange={(value) => setPeriod(value as TPeriod)}>
        <SelectTrigger className="h-9 w-[150px] rounded-full bg-card text-xs font-semibold" aria-label="Period">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIODS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {onExport && (
        <Button variant="outline" size="sm" className="h-9 rounded-full bg-card text-xs font-semibold" onClick={onExport}>
          <Download className="size-3.5" aria-hidden /> Export CSV
        </Button>
      )}
    </div>
  </div>
);

/** Views to sales for each event. `compact` leaves out the middle steps. */
export const EventsTable: React.FC<{ rows: IAnalyticsEvent[]; compact?: boolean }> = ({ rows, compact }) => (
  <div className="overflow-x-auto">
    <table className={cn("w-full text-sm", !compact && "min-w-[760px]")}>
      <thead>
        <tr className="border-b border-border text-left text-[11px] tracking-wider text-muted-foreground uppercase">
          <th className="py-2 pr-3 font-semibold">Event</th>
          <th className="py-2 pr-3 text-right font-semibold">Views</th>
          {!compact && <th className="py-2 pr-3 text-right font-semibold">Opened tickets</th>}
          {!compact && <th className="py-2 pr-3 text-right font-semibold">Checkouts</th>}
          <th className="py-2 pr-3 text-right font-semibold">Bought</th>
          {!compact && <th className="py-2 pr-3 text-right font-semibold">Tickets</th>}
          <th className="py-2 text-right font-semibold">Rate</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.eventId} className="border-b border-border/60 last:border-0">
            <td className="py-2.5 pr-3">
              <p className="font-medium">{row.name}</p>
              {row.organiser && <p className="text-xs text-muted-foreground">{row.organiser}</p>}
            </td>
            <td className="py-2.5 pr-3 text-right tabular-nums">{count(row.views)}</td>
            {!compact && <td className="py-2.5 pr-3 text-right tabular-nums">{count(row.ticketViews)}</td>}
            {!compact && <td className="py-2.5 pr-3 text-right tabular-nums">{count(row.started)}</td>}
            <td className="py-2.5 pr-3 text-right tabular-nums">{count(row.bought)}</td>
            {!compact && <td className="py-2.5 pr-3 text-right tabular-nums">{count(row.tickets)}</td>}
            <td className="py-2.5 text-right font-semibold tabular-nums">{pct(row.rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const SourceBars: React.FC<{ rows: IAnalyticsSource[] }> = ({ rows }) => {
  const top = Math.max(...rows.map((row) => row.orders), 1);
  return (
    <ul className="space-y-3.5">
      {rows.map((row) => (
        <li key={row.key} className="space-y-1.5">
          <div className="flex justify-between gap-3 text-sm">
            <span>{row.label}</span>
            <span className="font-semibold tabular-nums">
              {count(row.orders)} · {pct(row.share)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted" title={`${count(row.tickets)} tickets`}>
            <div
              className="h-full rounded-full bg-series-1"
              style={{ width: `${Math.max((row.orders / top) * 100, 2)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};
