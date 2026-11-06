"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  downloadLedgerCsv,
  ILedgerOrder,
  ILedgerRecord,
  TLedgerFilters,
  TLedgerSort,
  TLedgerStatus,
  TLedgerSummary,
  useVendorLedger,
  useVendorLedgerOrders,
  useVendorLedgerSummary,
} from "@/hooks/use-vendor-tickets";
import { useActingVendor } from "@/stores/workspace-store";
import { Amount } from "@/components/pages/app/wallet/amount";
import LedgerOverview from "./ledger-overview";
import OrderPanel from "./order-panel";
import OrdersTable from "./orders-table";
import TicketPanel from "./ticket-panel";
import { IEventDetailsType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Download,
  Ban,
  Hourglass,
  Loader2,
  Search,
  Undo2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { memo, useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toast";

const PAGE_SIZE = 25;

const STATUSES: {
  value: TLedgerStatus | "all";
  label: string;
  count: keyof NonNullable<ReturnType<typeof useVendorLedgerSummary>["data"]>;
}[] = [
  { value: "all", label: "All", count: "all" },
  { value: "not_checked_in", label: "Not checked in", count: "notCheckedIn" },
  { value: "checked_in", label: "Checked in", count: "checkedIn" },
  { value: "transferred", label: "Transferred", count: "transferred" },
  { value: "pending", label: "Awaiting approval", count: "pending" },
  { value: "refunded", label: "Refunded", count: "refunded" },
];

/** Each state with an icon and a word, so it never rests on colour alone. */
const STATUS_STYLE: Record<
  ILedgerRecord["status"],
  { icon: React.ElementType; className: string }
> = {
  checked_in: {
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700",
  },
  not_checked_in: {
    icon: CircleDashed,
    className: "bg-secondary-50 text-secondary-600",
  },
  pending: { icon: Hourglass, className: "bg-amber-50 text-amber-700" },
  refunded: { icon: Undo2, className: "bg-red-50 text-red-700" },
  declined: { icon: Ban, className: "bg-secondary-50 text-muted-foreground" },
};

const LEDGER_STATUSES = STATUSES.map((option) => option.value);
const statusFromUrl = (value: string | null) =>
  LEDGER_STATUSES.find((status) => status === value) ?? "all";

const shortDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const time = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

const initials = (name: string) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const StatusChip: React.FC<{
  record: ILedgerRecord;
  /** Who let them in, under the badge. */
  showScanner?: boolean;
}> = ({ record, showScanner }) => {
  const style = STATUS_STYLE[record.status];
  const Icon = style.icon;
  return (
    <span className="flex flex-col items-start gap-1">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
          style.className,
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {record.days && record.status === "checked_in"
          ? `In ${record.days.checkedIn} of ${record.days.covered} days`
          : record.statusLabel}
      </span>
      {showScanner && record.checkedInAt && record.scannerEmail && (
        <span className="block max-w-[200px] truncate text-xs text-muted-foreground">
          by {record.scannerEmail}
        </span>
      )}
      {record.transfer?.status === "claimed" && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowRightLeft className="size-3" aria-hidden />
          Passed on
        </span>
      )}
      {record.transfer?.status === "pending" && (
        <span className="text-xs text-muted-foreground">Transfer pending</span>
      )}
    </span>
  );
};

const Meter: React.FC<{
  value: number;
  max: number | null;
  className?: string;
}> = ({ value, max, className }) =>
  max ? (
    <span
      className={cn("block h-1.5 rounded-full bg-secondary-100", className)}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <span
        className="block h-1.5 rounded-full bg-primary"
        style={{
          width: `${Math.min(100, Math.max(value ? 2 : 0, (value / max) * 100))}%`,
        }}
      />
    </span>
  ) : null;

/** Sold against what's on offer for the picked event. */
const CapacityStrip: React.FC<{
  capacity: NonNullable<TLedgerSummary["capacity"]>;
}> = ({ capacity }) => (
  <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-secondary-100 bg-white px-4 py-2.5">
    <Meter
      value={capacity.sold}
      max={capacity.total}
      className="w-28 sm:w-36"
    />
    <p className="text-sm whitespace-nowrap text-secondary-600">
      <b className="text-secondary-950">{capacity.sold.toLocaleString()}</b>
      {capacity.total !== null
        ? ` of ${capacity.total.toLocaleString()} sold`
        : " sold"}
      {capacity.left !== null && (
        <>
          {" · "}
          <b className="text-secondary-950">
            {capacity.left.toLocaleString()} left
          </b>
        </>
      )}
    </p>
  </div>
);

/** The picked event, one row per ticket type; a row narrows the list below. */
const TicketTypeBreakdown: React.FC<{
  eventName?: string;
  rows: NonNullable<TLedgerSummary["byTicketType"]>;
  selectedId: string;
  onSelect: (id: string) => void;
}> = ({ eventName, rows, selectedId, onSelect }) => (
  <section className="rounded-[1.5rem] border border-secondary-100 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="font-bold text-secondary-950">
        {eventName ? `${eventName} · by ticket type` : "By ticket type"}
      </h2>
      <span className="text-xs text-muted-foreground">
        Pick a row to see only those tickets
      </span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <th className="pb-2 font-semibold">Ticket type</th>
            <th className="pb-2 font-semibold">Sold</th>
            <th className="pb-2 font-semibold">Checked in</th>
            <th className="pb-2 font-semibold">Transferred</th>
            <th className="pb-2 font-semibold">Left</th>
            <th className="pb-2 text-right font-semibold">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const selected = row.id === selectedId;
            return (
              <tr
                key={row.id}
                tabIndex={0}
                aria-selected={selected}
                onClick={() => onSelect(selected ? "" : row.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(selected ? "" : row.id);
                  }
                }}
                className={cn(
                  "cursor-pointer border-t border-secondary-50 tabular-nums transition-colors hover:bg-secondary-50/60 focus-visible:bg-secondary-50 focus-visible:outline-none",
                  selected && "bg-secondary-50",
                )}
              >
                <td className="py-2.5 pr-3 font-semibold text-secondary-950">
                  {row.name}
                </td>
                <td className="py-2.5 pr-3">
                  <span className="flex items-center gap-2">
                    <span className="whitespace-nowrap">
                      {row.sold.toLocaleString()}
                      {row.capacity !== null &&
                        ` / ${row.capacity.toLocaleString()}`}
                    </span>
                    <Meter
                      value={row.sold}
                      max={row.capacity}
                      className="w-24"
                    />
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  {row.checkedIn.toLocaleString()}
                </td>
                <td className="py-2.5 pr-3">
                  {row.transferred.toLocaleString()}
                </td>
                <td className="py-2.5 pr-3">
                  {row.left === null ? "No limit" : row.left.toLocaleString()}
                </td>
                <td className="py-2.5 text-right font-semibold whitespace-nowrap text-secondary-950">
                  {row.revenue.amount
                    ? row.revenue.formatted?.withCurrency
                    : "Free"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
);

/**
 * Every ticket for the organiser's events: search, filter by event, ticket type
 * and state, page through, open one for its QR code, or export what's showing.
 */
const TicketsTab: React.FC<{ events: IEventDetailsType[] }> = ({ events }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [search, setSearch] = useState(searchInput.trim());
  const [eventId, setEventId] = useState(searchParams.get("event") ?? "");
  const [ticketTypeId, setTicketTypeId] = useState("");
  const [status, setStatus] = useState<TLedgerStatus | "all">(
    statusFromUrl(searchParams.get("status")),
  );
  // The sidebar's approvals badge links here with ?status=pending.
  const urlStatus = searchParams.get("status");
  useEffect(() => {
    if (urlStatus) setStatus(statusFromUrl(urlStatus));
  }, [urlStatus]);
  const { can } = useActingVendor();
  const [sort, setSort] = useState<TLedgerSort>("newest");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [openRecord, setOpenRecord] = useState<ILedgerRecord | null>(null);
  const [openOrder, setOpenOrder] = useState<ILedgerOrder | null>(null);
  // By order keeps a bulk purchase to one row; each ticket is the full list.
  const [view, setView] = useState<"orders" | "tickets">(
    searchParams.get("view") === "tickets" ? "tickets" : "orders",
  );

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  // Any change to what's asked for starts again at the first page.
  useEffect(() => setPage(1), [search, eventId, ticketTypeId, status, sort, view]);

  const baseFilters = useMemo(
    () => ({
      ...(eventId ? { eventId } : {}),
      ...(ticketTypeId ? { ticketTypeId } : {}),
      ...(search ? { q: search } : {}),
    }),
    [eventId, search, ticketTypeId],
  );
  const filters: TLedgerFilters = useMemo(
    () => ({ ...baseFilters, ...(status !== "all" ? { status } : {}), sort }),
    [baseFilters, sort, status],
  );
  const { data, isPending, isFetching } = useVendorLedger(
    filters,
    page,
    PAGE_SIZE,
    view === "tickets",
  );
  const ordersQuery = useVendorLedgerOrders(filters, page, PAGE_SIZE, view === "orders");
  const { data: summary } = useVendorLedgerSummary(baseFilters);

  // A ticket linked to directly (e.g. /app/tickets?ticket=…) opens on arrival.
  const linkedTicket = searchParams.get("ticket");
  const { data: linked } = useVendorLedger(
    linkedTicket ? { q: linkedTicket } : {},
    1,
    1,
  );
  useEffect(() => {
    if (linkedTicket && linked?.records[0]) setOpenRecord(linked.records[0]);
  }, [linked, linkedTicket]);

  const ticketTypes = useMemo(
    () => events.find((event) => event.id === eventId)?.eventTickets ?? [],
    [eventId, events],
  );
  const records = data?.records ?? [];
  const orders = ordersQuery.data?.orders ?? [];
  const total = (view === "orders" ? ordersQuery.data?.total : data?.total) ?? 0;
  const loading = view === "orders" ? ordersQuery.isPending && !ordersQuery.data : isPending && !data;
  const empty = view === "orders" ? orders.length === 0 : records.length === 0;
  const first = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(page * PAGE_SIZE, total);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { truncated } = await downloadLedgerCsv(filters);
      toast.success(
        truncated
          ? "Exported the first 10,000 tickets. Narrow the filters for the rest."
          : "Ticket list downloaded",
      );
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't export the tickets.",
        ),
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <LedgerOverview
        summary={summary}
        onPickEvent={(id) => {
          setEventId(id);
          setTicketTypeId("");
          setView("tickets");
        }}
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, email, order or ticket code"
            aria-label="Search tickets"
            className="h-11 rounded-xl bg-white pl-10"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <select
            value={eventId}
            onChange={(event) => {
              setEventId(event.target.value);
              setTicketTypeId("");
            }}
            aria-label="Event"
            className="col-span-2 h-11 min-w-0 rounded-xl border border-secondary-200 bg-white px-3 text-sm sm:max-w-[240px]"
          >
            <option value="">All events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
          <select
            value={ticketTypeId}
            onChange={(event) => setTicketTypeId(event.target.value)}
            disabled={!eventId}
            aria-label="Ticket type"
            title={eventId ? undefined : "Pick an event first"}
            className="h-11 min-w-0 rounded-xl border border-secondary-200 bg-white px-3 text-sm disabled:opacity-50"
          >
            <option value="">All ticket types</option>
            {ticketTypes.map((ticket) => (
              <option key={ticket.id} value={ticket.id}>
                {ticket.ticketName}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as TLedgerSort)}
            aria-label="Sort"
            className="h-11 min-w-0 rounded-xl border border-secondary-200 bg-white px-3 text-sm"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="checked_in">Latest check-ins</option>
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={exportCsv}
            disabled={exporting || !total}
            className="col-span-2 h-11 rounded-xl bg-white sm:col-span-1"
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            Export CSV
          </Button>
          <div
            role="tablist"
            aria-label="Show"
            className="col-span-2 flex h-11 shrink-0 rounded-xl border border-secondary-200 bg-white p-1 text-xs font-semibold sm:col-span-1"
          >
            {(
              [
                ["orders", "By order"],
                ["tickets", "Each ticket"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={view === value}
                onClick={() => setView(value)}
                className={cn(
                  "flex-1 rounded-lg px-3 whitespace-nowrap transition-colors",
                  view === value ? "bg-secondary-950 text-white" : "text-muted-foreground hover:text-secondary-800",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div
          role="radiogroup"
          aria-label="Ticket status"
          className="scrollbar-none -mx-1 flex min-w-0 gap-2 overflow-x-auto px-1"
        >
          {STATUSES.map((option) => {
            const count = summary?.[option.count] ?? 0;
            const isSelected = status === option.value;
            if (
              !count &&
              !isSelected &&
              option.value !== "all" &&
              ["pending", "refunded"].includes(option.value)
            ) {
              return null;
            }
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setStatus(option.value)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  isSelected
                    ? "border-secondary-900 bg-secondary-900 text-white"
                    : "border-secondary-200 bg-white text-secondary-600 hover:border-secondary-400",
                )}
              >
                {option.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    isSelected
                      ? "bg-white/20"
                      : "bg-secondary-50 text-muted-foreground",
                  )}
                >
                  {count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
        {summary?.capacity && <CapacityStrip capacity={summary.capacity} />}
      </div>

      {eventId && !!summary?.byTicketType?.length && (
        <TicketTypeBreakdown
          eventName={events.find((event) => event.id === eventId)?.name}
          rows={summary.byTicketType}
          selectedId={ticketTypeId}
          onSelect={setTicketTypeId}
        />
      )}

      <section className="overflow-hidden rounded-[1.5rem] border border-secondary-100 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2
              className="size-6 animate-spin text-muted-foreground"
              aria-label="Loading tickets"
            />
          </div>
        ) : empty ? (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-secondary-950">No tickets match</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || eventId || status !== "all"
                ? "Try a different search or clear the filters."
                : "Tickets will show here as soon as people book."}
            </p>
          </div>
        ) : view === "orders" ? (
          <OrdersTable orders={orders} fetching={ordersQuery.isFetching} onOpen={setOpenOrder} />
        ) : (
          <>
            {/* Phones: one card per ticket instead of a wide table. */}
            <ul
              className={cn(
                "divide-y divide-secondary-50 sm:hidden",
                isFetching && "opacity-60",
              )}
            >
              {records.map((record) => (
                <li key={record.id}>
                  <button
                    type="button"
                    onClick={() => setOpenRecord(record)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left active:bg-secondary-50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-xs font-bold text-secondary-700">
                      {initials(record.holderName)}
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-semibold text-secondary-950">
                          {record.holderName}
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-secondary-950">
                          {record.price.amount ? (
                            <Amount value={record.price.formatted?.withCurrency} />
                          ) : (
                            "Free"
                          )}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {record.ticketType} · {record.eventName}
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
                          {record.ticketCode}
                        </span>
                        <StatusChip record={record} />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div
              className={cn(
                "hidden overflow-x-auto transition-opacity sm:block",
                isFetching && "opacity-60",
              )}
            >
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-secondary-100 bg-secondary-50/60 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    <th className="px-5 py-3 font-semibold">Holder</th>
                    <th className="px-3 py-3 font-semibold">Ticket</th>
                    <th className="px-3 py-3 font-semibold">Code</th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Price
                    </th>
                    <th className="px-3 py-3 font-semibold">
                      {sort === "checked_in" ? "Checked in" : "Bought"}
                    </th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      tabIndex={0}
                      onClick={() => setOpenRecord(record)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setOpenRecord(record);
                        }
                      }}
                      aria-label={`Open ticket for ${record.holderName}`}
                      className="cursor-pointer border-b border-secondary-50 transition-colors last:border-0 hover:bg-secondary-50/60 focus-visible:bg-secondary-50 focus-visible:outline-none"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-xs font-bold text-secondary-700">
                            {initials(record.holderName)}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[200px] truncate font-semibold text-secondary-950">
                              {record.holderName}
                            </span>
                            <span className="block max-w-[200px] truncate text-xs text-muted-foreground">
                              {record.buyerName
                                ? `Bought by ${record.buyerName}`
                                : record.holderEmail}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="block font-medium text-secondary-950">
                          {record.ticketType}
                        </span>
                        <span className="block max-w-[220px] truncate text-xs text-muted-foreground">
                          {record.eventName}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs tracking-wide text-secondary-600">
                        {record.ticketCode}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold whitespace-nowrap text-secondary-950">
                        {record.price.amount ? (
                          <Amount value={record.price.formatted?.withCurrency} />
                        ) : (
                          "Free"
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-secondary-600">
                        {sort === "checked_in"
                          ? record.checkedInAt
                            ? time(record.checkedInAt)
                            : "—"
                          : shortDate(record.boughtAt)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusChip record={record} showScanner />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {total > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-secondary-100 px-5 py-3 text-sm text-muted-foreground">
            <span>
              {first.toLocaleString()}–{last.toLocaleString()} of{" "}
              {total.toLocaleString()} {view === "orders" ? "orders" : "tickets"}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={last >= total}
                onClick={() => setPage((current) => current + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </section>

      <OrderPanel
        order={openOrder}
        onClose={() => setOpenOrder(null)}
        onOpenTicket={setOpenRecord}
      />
      <TicketPanel
        canReview={can("REGISTRATIONS_REVIEW")}
        record={openRecord}
        onClose={() => {
          setOpenRecord(null);
          if (linkedTicket) router.replace("/app/tickets");
        }}
      />
    </div>
  );
};

export default memo(TicketsTab);
