"use client";

import { AppCurrency, formatAppMoney } from "@/lib/currency";
import { formatEventTime } from "@/lib/event-time";
import { cn } from "@/lib/utils";
import { Check, Clock, Copy, Lock, Pencil, Trash2, UserRound } from "lucide-react";
import React, { memo, useState } from "react";
import { toast } from "sonner";

/** What a category card needs to show (a ticket in the event form). */
export type TTicketCardData = {
  ticketName: string;
  ticketPrice: number;
  ticketQuantity: number;
  visibility: "public" | "private";
  actionType: "paid" | "register";
  transferable?: boolean;
  privateAccessCode?: string;
  salesStartAt?: string | null;
  salesEndAt?: string | null;
  maxPerOrder?: number | null;
  soldCount?: number;
};

const short = { withYear: false } as const;

/** "On sale now → Mon 9 Nov, 8:59 pm", and the other shapes a window takes. */
const describeWindow = (ticket: TTicketCardData, timezone?: string) => {
  const start = ticket.salesStartAt ? new Date(ticket.salesStartAt) : null;
  const end = ticket.salesEndAt ? new Date(ticket.salesEndAt) : null;
  const startText =
    start && start > new Date()
      ? formatEventTime(start, timezone, short)
      : null;
  const endText = end ? formatEventTime(end, timezone, short) : null;
  if (startText && endText) return `On sale ${startText} → ${endText}`;
  if (startText) return `On sale from ${startText}, until the event starts`;
  if (endText) return `On sale now → ${endText}`;
  return "On sale now, until the event starts";
};

const Chip: React.FC<{ tone?: "blue" | "green" | "amber"; children: React.ReactNode }> = ({
  tone,
  children,
}) => (
  <span
    className={cn(
      "rounded-full px-2 py-0.5 text-[11px] font-bold",
      tone === "blue"
        ? "bg-sky-50 text-sky-700"
        : tone === "green"
          ? "bg-emerald-50 text-emerald-700"
          : tone === "amber"
            ? "bg-amber-50 text-amber-700"
            : "bg-secondary-100 text-secondary-600",
    )}
  >
    {children}
  </span>
);

/**
 * One ticket category, drawn as a ticket: what it is and its rules on the
 * left, a tear, and the price and how many on the stub (with how many have
 * sold, once some have).
 */
const TicketCategoryCard: React.FC<{
  ticket: TTicketCardData;
  currency: AppCurrency;
  timezone?: string;
  /** For a multi-day event: the days it's for, e.g. "Fri & Sat". */
  daysLabel?: string;
  editing?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ ticket, currency, timezone, daysLabel, editing, onEdit, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const registration = ticket.actionType === "register";
  const free = registration || !(ticket.ticketPrice > 0);
  const isPrivate = ticket.visibility === "private";
  const sold = ticket.soldCount ?? 0;
  const soldShare = ticket.ticketQuantity > 0 ? Math.min(1, sold / ticket.ticketQuantity) : 0;

  const copyCode = async () => {
    if (!ticket.privateAccessCode) return;
    try {
      await navigator.clipboard.writeText(ticket.privateAccessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy the code.");
    }
  };

  return (
    <div
      className={cn(
        "relative flex overflow-hidden rounded-2xl border border-secondary-100 bg-white shadow-[0_8px_22px_-14px_rgba(7,20,29,0.35)]",
        editing && "ring-2 ring-primary",
      )}
    >
      <div className="min-w-0 flex-1 px-4 py-3.5">
        <div className="flex items-start gap-2 pr-16">
          <p className="truncate text-[15px] font-extrabold text-secondary-950">
            {ticket.ticketName}
          </p>
          {isPrivate && <Lock className="mt-0.5 size-3.5 shrink-0 text-secondary-500" aria-label="Private" />}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip tone={isPrivate ? undefined : "blue"}>{isPrivate ? "Private" : "Public"}</Chip>
          {!free && <Chip>{ticket.transferable ? "Transferable" : "Not transferable"}</Chip>}
          {daysLabel && <Chip tone="green">{daysLabel}</Chip>}
          {ticket.salesEndAt && (
            <Chip tone="amber">
              Sales end {formatEventTime(ticket.salesEndAt, timezone, short)}
            </Chip>
          )}
        </div>
        <div className="mt-2.5 space-y-1 text-xs text-secondary-600">
          <p className="flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0 text-secondary-400" />
            {describeWindow(ticket, timezone)}
          </p>
          {!!ticket.maxPerOrder && (
            <p className="flex items-center gap-1.5">
              <UserRound className="size-3.5 shrink-0 text-secondary-400" />
              Max {ticket.maxPerOrder} per order
            </p>
          )}
        </div>
        {isPrivate && ticket.privateAccessCode && (
          <button
            type="button"
            onClick={() => void copyCode()}
            className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-[#0b1d2a] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white tabular-nums transition hover:bg-[#13304a]"
            aria-label={`Copy access code ${ticket.privateAccessCode}`}
          >
            <span className="font-bold opacity-70">Code</span>
            {ticket.privateAccessCode}
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5 opacity-70" />}
          </button>
        )}
      </div>

      <div className="absolute top-2.5 right-[8.5rem] flex gap-1">
        <button
          type="button"
          onClick={onEdit}
          disabled={editing}
          aria-label={`Edit ${ticket.ticketName}`}
          className="flex size-7 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600 transition hover:bg-secondary-100 hover:text-secondary-950 disabled:opacity-40"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${ticket.ticketName}`}
          className="flex size-7 items-center justify-center rounded-lg bg-secondary-50 text-red-600 transition hover:bg-red-50"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* The tear, with a notch bitten out top and bottom. */}
      <div className="relative my-2.5 border-l-2 border-dashed border-secondary-200" aria-hidden>
        <span className="absolute -top-[23px] -left-[12px] size-[22px] rounded-full border border-secondary-100 bg-white" />
        <span className="absolute -bottom-[23px] -left-[12px] size-[22px] rounded-full border border-secondary-100 bg-white" />
      </div>

      <div
        className={cn(
          "flex w-32 shrink-0 flex-col items-center justify-center px-3 py-3.5 text-center",
          free ? "bg-gradient-to-br from-emerald-50 to-emerald-100/60" : "bg-gradient-to-br from-sky-50 to-blue-100/60",
        )}
      >
        <p className="text-lg font-extrabold tracking-tight text-secondary-950">
          {free ? "Free" : formatAppMoney(ticket.ticketPrice, currency)}
        </p>
        <p className="mt-0.5 text-[11px] text-secondary-600">
          {ticket.ticketQuantity.toLocaleString()} {registration ? "spots" : "tickets"}
        </p>
        <div className={cn("mt-2 h-1.5 w-20 overflow-hidden rounded-full", free ? "bg-emerald-100" : "bg-blue-100")}>
          <div
            className={cn("h-full rounded-full", free ? "bg-emerald-600" : "bg-[#0577FA]")}
            style={{ width: `${soldShare * 100}%` }}
          />
        </div>
        {sold > 0 && <p className="mt-1 text-[11px] text-secondary-600">{sold.toLocaleString()} sold</p>}
      </div>
    </div>
  );
};

export default memo(TicketCategoryCard);
