"use client";

import { TScanSummary } from "@/hooks/use-ticket-scan";
import { cn } from "@/lib/utils";
import React, { memo } from "react";

/**
 * The door count for the event, or for the chosen day of a multi-day event, with
 * the day picker. Choosing a day is what the scans then count for.
 */
const ScanProgress: React.FC<{
  summary: TScanSummary;
  dayId?: string;
  onDayChange?: (dayId: string) => void;
}> = ({ summary, dayId, onDayChange }) => {
  const day = summary.days.find((item) => item.id === dayId);
  const checkedIn = day ? day.checkedIn : summary.checkedIn;
  const expected = day ? day.expected : summary.total;
  const percent = expected ? Math.min(100, Math.round((checkedIn / expected) * 100)) : 0;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-5">
      {summary.days.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Scanning for</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Day">
            {summary.days.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={item.id === dayId}
                onClick={() => onDayChange?.(item.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  item.id === dayId
                    ? "border-secondary-800 bg-secondary-800 text-white"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {item.name}
                {item.id === summary.todayDayId && (
                  <span className="ml-1.5 text-[11px] font-bold uppercase opacity-80">Today</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-muted-foreground">
            {day ? `Checked in for ${day.name}` : "Checked in"}
          </p>
          <p className="text-sm text-muted-foreground">{percent}%</p>
        </div>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">
          {checkedIn.toLocaleString()}
          <span className="text-lg font-semibold text-muted-foreground">
            {" "}
            / {expected.toLocaleString()}
          </span>
        </p>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={expected}
          aria-valuenow={checkedIn}
          aria-label="Tickets checked in"
        >
          <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
};

export default memo(ScanProgress);
