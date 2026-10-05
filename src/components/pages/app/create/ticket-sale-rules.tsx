"use client";

import { Input } from "@/components/ui/input";
import {
  formatEventTime,
  instantToWallTimeInZone,
  wallTimeInZoneToInstant,
} from "@/lib/event-time";
import { format } from "date-fns";
import React, { memo } from "react";

/** When a ticket sells and how many one buyer can take. Every rule is optional. */
export type TTicketSaleRules = {
  salesStartAt?: string | null;
  salesEndAt?: string | null;
  maxPerOrder?: number | null;
};

/** ISO string -> the "yyyy-MM-ddTHH:mm" a datetime-local input shows, on the event's clock. */
const toLocalInput = (value?: string | null, timezone?: string) => {
  if (!value) return "";
  const date = instantToWallTimeInZone(value, timezone);
  return Number.isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd'T'HH:mm");
};

const fromLocalInput = (value: string, timezone?: string) =>
  value
    ? wallTimeInZoneToInstant(new Date(value), timezone).toISOString()
    : null;

/** The rules as the API takes them: unset ones go as null, which clears them. */
export const saleRulesPayload = (ticket: TTicketSaleRules) => ({
  salesStartAt: ticket.salesStartAt || null,
  salesEndAt: ticket.salesEndAt || null,
  maxPerOrder:
    ticket.maxPerOrder && ticket.maxPerOrder > 0
      ? Math.floor(ticket.maxPerOrder)
      : null,
});

/** Why the rules can't be saved, or null when they're fine. */
export const saleRulesError = (ticket: TTicketSaleRules) => {
  if (
    ticket.salesStartAt &&
    ticket.salesEndAt &&
    new Date(ticket.salesEndAt) <= new Date(ticket.salesStartAt)
  ) {
    return "Sales have to end after they start.";
  }
  return null;
};

/** A short line for a ticket summary, e.g. "On sale 1 Nov · max 4 per order". */
export const describeSaleRules = (
  ticket: TTicketSaleRules,
  timezone?: string,
) => {
  const short = { withYear: false, withWeekday: false };
  const parts: string[] = [];
  if (ticket.salesStartAt)
    parts.push(
      `On sale ${formatEventTime(ticket.salesStartAt, timezone, short)}`,
    );
  if (ticket.salesEndAt)
    parts.push(`until ${formatEventTime(ticket.salesEndAt, timezone, short)}`);
  if (ticket.maxPerOrder) parts.push(`max ${ticket.maxPerOrder} per order`);
  return parts.join(" · ");
};

const TicketSaleRulesFields: React.FC<{
  value: TTicketSaleRules;
  onChange: (patch: TTicketSaleRules) => void;
  className?: string;
  /** The event's zone; times are entered on its clock. */
  timezone?: string;
}> = ({ value, onChange, className, timezone }) => {
  const error = saleRulesError(value);
  return (
    <fieldset className={className}>
      <legend className="mb-1 text-sm font-medium text-secondary-700">
        Sales window and limit{" "}
        <span className="font-normal text-secondary-400">(optional)</span>
      </legend>
      <p className="mb-3 text-xs text-secondary-500">
        Leave these empty to sell straight away, until the event, with no
        per-order limit.
        {timezone && ` Times are in ${timezone.replace(/_/g, " ")}.`}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1.5 text-xs font-medium text-secondary-600">
          <span>Sales start</span>
          <Input
            type="datetime-local"
            value={toLocalInput(value.salesStartAt, timezone)}
            onChange={(event) =>
              onChange({
                salesStartAt: fromLocalInput(event.target.value, timezone),
              })
            }
            className="h-11 rounded-xl border-secondary-200 bg-white"
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-secondary-600">
          <span>Sales end</span>
          <Input
            type="datetime-local"
            value={toLocalInput(value.salesEndAt, timezone)}
            min={toLocalInput(value.salesStartAt, timezone) || undefined}
            onChange={(event) =>
              onChange({
                salesEndAt: fromLocalInput(event.target.value, timezone),
              })
            }
            className="h-11 rounded-xl border-secondary-200 bg-white"
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-secondary-600">
          <span>Max per order</span>
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
