"use client";

import DateTimePicker, { TQuickPick } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import {
  instantToWallTimeInZone,
  wallTimeInZoneToInstant,
} from "@/lib/event-time";
import { addDays, addMinutes } from "date-fns";
import React, { memo } from "react";

/** When a ticket sells and how many one buyer can take. Every rule is optional. */
export type TTicketSaleRules = {
  salesStartAt?: string | null;
  salesEndAt?: string | null;
  maxPerOrder?: number | null;
};

/** An ISO instant as a clock time on the event's clock. */
const toWall = (value?: string | null, timezone?: string) => {
  if (!value) return null;
  const date = instantToWallTimeInZone(value, timezone);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** A clock time on the event's clock back to an ISO instant. */
const fromWall = (value: Date | null, timezone?: string) =>
  value ? wallTimeInZoneToInstant(value, timezone).toISOString() : null;

/** The rules as the API takes them: unset ones go as null, which clears them. */
export const saleRulesPayload = (ticket: TTicketSaleRules) => ({
  salesStartAt: ticket.salesStartAt || null,
  salesEndAt: ticket.salesEndAt || null,
  maxPerOrder:
    ticket.maxPerOrder && ticket.maxPerOrder > 0
      ? Math.floor(ticket.maxPerOrder)
      : null,
});

/**
 * Why the rules can't be saved, or null when they're fine. `closesAt` is when
 * the ticket stops being bookable (the event's start, or its last day's).
 */
export const saleRulesError = (
  ticket: TTicketSaleRules,
  closesAt?: Date | null,
) => {
  const start = ticket.salesStartAt ? new Date(ticket.salesStartAt) : null;
  const end = ticket.salesEndAt ? new Date(ticket.salesEndAt) : null;
  if (start && end && end <= start) {
    return "Sales have to end after they start.";
  }
  if (closesAt && start && start >= closesAt) {
    return "Sales have to start before the event does.";
  }
  if (closesAt && end && end > closesAt) {
    return "Sales have to end by the time the event starts.";
  }
  return null;
};

const TicketSaleRulesFields: React.FC<{
  value: TTicketSaleRules;
  onChange: (patch: TTicketSaleRules) => void;
  className?: string;
  /** The event's zone; times are entered on its clock. */
  timezone?: string;
  /** When the ticket stops being bookable, on the event's clock. */
  closesAt?: Date | null;
}> = ({ value, onChange, className, timezone, closesAt }) => {
  const closesInstant = closesAt ? wallTimeInZoneToInstant(closesAt, timezone) : null;
  const error = saleRulesError(value, closesInstant);
  const start = toWall(value.salesStartAt, timezone);
  const end = toWall(value.salesEndAt, timezone);
  // Now on the event's clock; a start already in the past stays allowed.
  const now = instantToWallTimeInZone(new Date(), timezone);
  const startMin = start && start < now ? start : now;
  const startMax = closesAt ? addMinutes(closesAt, -15) : undefined;
  const endMin = start && start > now ? addMinutes(start, 15) : now;
  const endMax = closesAt ?? undefined;

  const startPicks: TQuickPick[] = [
    { label: "Now", value: now },
    { label: "Tomorrow, 9 AM", value: new Date(addDays(now, 1).setHours(9, 0, 0, 0)) },
  ];
  const endPicks: TQuickPick[] = closesAt
    ? [
        { label: "When the event starts", value: closesAt },
        { label: "An hour before", value: addMinutes(closesAt, -60) },
        { label: "The day before", value: addDays(closesAt, -1) },
        { label: "A week before", value: addDays(closesAt, -7) },
      ]
    : [];

  return (
    <fieldset className={className}>
      <legend className="mb-1 text-sm font-medium text-secondary-700">
        Sales window and limit{" "}
        <span className="font-normal text-secondary-400">(optional)</span>
      </legend>
      <p className="mb-3 text-xs text-secondary-500">
        Leave these empty to sell straight away until the event starts, with no
        per-order limit.
        {timezone && ` Times are on the venue's clock (${timezone.split("/").pop()?.replace(/_/g, " ")}).`}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <DateTimePicker
          label="Sales start"
          placeholder="Straight away"
          value={start}
          min={startMin}
          max={startMax}
          quickPicks={startPicks}
          onChange={(next) => onChange({ salesStartAt: fromWall(next, timezone) })}
        />
        <DateTimePicker
          label="Sales end"
          placeholder="When the event starts"
          value={end}
          min={endMin}
          max={endMax}
          quickPicks={endPicks}
          onChange={(next) => onChange({ salesEndAt: fromWall(next, timezone) })}
        />
        <label className="space-y-1.5 text-xs font-medium text-secondary-600">
          <span className="block">Max per order</span>
          <Input
            type="number"
            min={1}
            step={1}
            placeholder="No limit"
            value={value.maxPerOrder ?? ""}
            onChange={(event) =>
              onChange({
                maxPerOrder: event.target.value
                  ? Math.max(1, Math.floor(Number(event.target.value)))
                  : null,
              })
            }
            className="h-11 rounded-xl border-secondary-200 bg-white"
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </fieldset>
  );
};

export default memo(TicketSaleRulesFields);
