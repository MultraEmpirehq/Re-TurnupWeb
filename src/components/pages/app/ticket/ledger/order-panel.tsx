"use client";

import { constructErrorMessage } from "@/api/functions";
import { Amount } from "@/components/pages/app/wallet/amount";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  downloadLedgerCsv,
  ILedgerOrder,
  ILedgerRecord,
  TLedgerStatus,
  useVendorLedger,
} from "@/hooks/use-vendor-tickets";
import { cn } from "@/lib/utils";
import { ChevronRight, Download, Search } from "lucide-react";
import React, { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { describeTypes, orderWhen } from "./orders-table";

const PAGE = 25;

const FILTERS: { value: TLedgerStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "not_checked_in", label: "Not in" },
  { value: "checked_in", label: "Checked in" },
  { value: "transferred", label: "Sent on" },
];

const STATE: Record<ILedgerRecord["status"], { label: string; className: string }> = {
  checked_in: { label: "In", className: "bg-emerald-50 text-emerald-700" },
  not_checked_in: { label: "Not in", className: "bg-secondary-50 text-secondary-700" },
  pending: { label: "Waiting", className: "bg-amber-50 text-amber-800" },
  refunded: { label: "Refunded", className: "bg-red-50 text-red-700" },
  declined: { label: "Declined", className: "bg-muted text-muted-foreground" },
};

/**
 * An order's tickets, a page at a time, so a 500-ticket order opens as fast as
 * a single one. Search and filter within it; open a ticket for its live code.
 */
const OrderPanel = ({
  order,
  onClose,
  onOpenTicket,
}: {
  order: ILedgerOrder | null;
  onClose: () => void;
  onOpenTicket: (record: ILedgerRecord) => void;
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TLedgerStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setPage(1);
  }, [order?.id]);
  useEffect(() => setPage(1), [search, status]);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      ...(order ? { orderId: order.id } : {}),
      ...(search ? { q: search } : {}),
      ...(status !== "all" ? { status } : {}),
      sort: "oldest" as const,
    }),
    [order, search, status],
  );
  const { data, isPending, isFetching } = useVendorLedger(filters, page, PAGE);
  const records = data?.records ?? [];
  const total = data?.total ?? 0;

  const exportOrder = async () => {
    if (!order) return;
    setExporting(true);
    try {
      await downloadLedgerCsv({ orderId: order.id });
      toast.success("Door list for this order downloaded");
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't export the tickets."));
    } finally {
      setExporting(false);
    }
  };

  const live = order ? order.tickets - order.refunded : 0;

  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {order && (
          <>
            <SheetHeader className="border-b border-secondary-100 p-5">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Order {order.reference && <span className="font-mono">#{order.reference}</span>}
              </p>
              <SheetTitle className="text-xl">{order.buyer.name}</SheetTitle>
              <SheetDescription>
                {order.buyer.username ? `@${order.buyer.username}` : order.buyer.email} ·{" "}
                {orderWhen(order.boughtAt)}
              </SheetDescription>
              <p className="text-sm text-secondary-800">
                {describeTypes(order.ticketTypes)} · {order.event?.name}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                {[
                  [order.tickets.toLocaleString(), "tickets"],
                  [`${order.checkedIn}/${live}`, "checked in"],
                  [
                    order.paid.amount ? <Amount key="paid" value={order.paid.formatted.withCurrency} /> : "Free",
                    "paid",
                  ],
                ].map(([value, label]) => (
                  <div key={label as string} className="min-w-0 rounded-xl bg-secondary-50/70 px-2 py-2">
                    <p className="truncate text-sm font-bold text-secondary-950">{value}</p>
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              {order.tickets > 1 && (
                <>
                  <label className="relative mt-3 block">
                    <Search
                      className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Find a ticket code or holder"
                      aria-label="Find a ticket in this order"
                      className="h-10 w-full rounded-full border border-secondary-100 bg-white pr-4 pl-10 text-sm outline-none focus:border-secondary-300"
                    />
                  </label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {FILTERS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={status === option.value}
                        onClick={() => setStatus(option.value)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                          status === option.value
                            ? "bg-secondary-950 text-white"
                            : "border border-secondary-100 text-muted-foreground hover:text-secondary-800",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </SheetHeader>

            <div className={cn("flex-1 overflow-y-auto px-5", isFetching && "opacity-70")}>
              {isPending && !data ? (
                <div className="space-y-2 py-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : records.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No tickets match.</p>
              ) : (
                <ul className="divide-y divide-secondary-50">
                  {records.map((record, index) => {
                    const position = (page - 1) * PAGE + index + 1;
                    const state = STATE[record.status];
                    return (
                      <li key={record.id}>
                        <button
                          type="button"
                          onClick={() => onOpenTicket(record)}
                          className="flex w-full items-center gap-3 py-3 text-left hover:bg-secondary-50/50"
                        >
                          <span className="w-7 shrink-0 text-xs text-muted-foreground">{position}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-secondary-950">
                              {record.ticketType}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {record.transfer?.status === "claimed"
                                ? `Sent to ${record.transfer.to ?? "someone"}`
                                : `Holder: ${record.holderName}`}
                            </span>
                          </span>
                          <span className="hidden font-mono text-[11px] text-secondary-600 sm:block">
                            {record.ticketCode}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              record.transfer?.status === "claimed" && record.status === "not_checked_in"
                                ? "bg-violet-50 text-violet-700"
                                : state.className,
                            )}
                          >
                            {record.transfer?.status === "claimed" && record.status === "not_checked_in"
                              ? "Sent"
                              : state.label}
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {total > PAGE && (
                <div className="flex items-center justify-between py-4 text-sm text-muted-foreground">
                  <span>
                    {((page - 1) * PAGE + 1).toLocaleString()}–
                    {Math.min(page * PAGE, total).toLocaleString()} of {total.toLocaleString()}
                  </span>
                  <span className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={page === 1}
                      onClick={() => setPage((current) => current - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={page * PAGE >= total}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                    </Button>
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-secondary-100 p-4">
              <Button
                variant="outline"
                className="w-full rounded-full"
                loading={exporting}
                onClick={() => void exportOrder()}
              >
                <Download className="size-4" aria-hidden />
                Door list for this order
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default memo(OrderPanel);
