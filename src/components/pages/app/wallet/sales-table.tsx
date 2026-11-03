"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchAllVendorSales,
  TWalletFilter,
  useVendorSales,
  VendorSale,
} from "@/hooks/use-vendor-wallet";
import { cn } from "@/lib/utils";
import { Amount } from "@/components/pages/app/wallet/amount";
import { format, isToday, isYesterday } from "date-fns";
import { Download } from "lucide-react";
import React, { memo, useEffect, useState } from "react";
import { toast } from "sonner";

const when = (date: string) => {
  const day = new Date(date);
  if (isToday(day)) return `Today, ${format(day, "h:mm a")}`;
  if (isYesterday(day)) return `Yesterday, ${format(day, "h:mm a")}`;
  return format(day, "d MMM yyyy");
};

const csvCell = (value: string | number | null | undefined) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** The sales as a spreadsheet, amounts in major units. */
const toCsv = (sales: VendorSale[]) => {
  const rows = [
    ["Date", "Reference", "Event", "Tickets", "Quantity", "Promo code", "Currency", "Paid", "Turnupz fee", "You earn", "Status", "Paid to"],
    ...sales.map((sale) => [
      format(new Date(sale.date), "yyyy-MM-dd HH:mm"),
      sale.reference,
      sale.event?.name,
      sale.ticketName,
      sale.quantity,
      sale.promoCode,
      sale.amount.currency.code,
      sale.amount.formatted.withoutCurrency,
      sale.fee.formatted.withoutCurrency,
      sale.status === "refunded" ? "0" : sale.earnings.formatted.withoutCurrency,
      sale.status === "refunded" ? "Refunded" : "Paid",
      sale.settlement === "direct" ? (sale.settledTo ?? "Your bank") : "Owed by Turnupz",
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
};

/** The organiser's sales for the period and event chosen, newest first. */
const SalesTable = ({
  filter,
  events,
  onEventChange,
}: {
  filter: TWalletFilter;
  events: { id: string; name: string }[];
  onEventChange: (eventId?: string) => void;
}) => {
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const { data, isLoading, error, refetch } = useVendorSales(page, filter);
  const sales = data?.sales ?? [];
  const pagination = data?.pagination;

  // A new period or event starts from the first page.
  useEffect(() => setPage(1), [filter.days, filter.eventId]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await fetchAllVendorSales(filter);
      const url = URL.createObjectURL(new Blob([toCsv(all)], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `turnupz-sales-${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      toast.error(
        constructErrorMessage(exportError as TApiErrorResponseType, "Couldn't export your sales."),
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="min-w-0 rounded-[1.5rem] border border-secondary-100 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-secondary-950">Sales</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter.eventId ?? ""}
            onChange={(event) => onEventChange(event.target.value || undefined)}
            aria-label="Event"
            className="h-9 max-w-[14rem] truncate rounded-full border border-secondary-100 bg-white px-3 text-xs font-semibold text-secondary-700"
          >
            <option value="">All events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-secondary-100 text-xs"
            loading={exporting}
            disabled={!sales.length}
            onClick={() => void exportCsv()}
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="py-10">
          <ErrorContainer
            error={constructErrorMessage(error as TApiErrorResponseType, "Couldn't load your sales.")}
            retryFunction={refetch}
          />
        </div>
      ) : sales.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {filter.days || filter.eventId
            ? "No sales for this period or event."
            : "No ticket sales yet. They'll show here as people buy."}
        </p>
      ) : (
        <div className="mt-4">
          <Table label="Sales">
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="text-right">You earn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => {
                const refunded = sale.status === "refunded";
                return (
                  <TableRow key={sale.id} className={cn(refunded && "opacity-60")}>
                    <TableCell className="py-3">
                      <p className="font-semibold text-secondary-950">
                        {sale.event?.name ?? "Event"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {when(sale.date)}
                        {sale.reference && ` · #${sale.reference}`}
                        {sale.promoCode && (
                          <span className="text-secondary-600"> · Promo {sale.promoCode}</span>
                        )}
                        {sale.settlement === "held" && !refunded && (
                          <span className="text-amber-700"> · Owed by Turnupz</span>
                        )}
                      </p>
                    </TableCell>
                    <TableCell>
                      {sale.quantity} × {sale.ticketName ?? "Ticket"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Amount value={sale.amount.formatted.withCurrency} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {refunded ? "—" : <Amount value={`−${sale.fee.formatted.withCurrency}`} />}
                    </TableCell>
                    <TableCell className="text-right">
                      {refunded ? (
                        <span className="rounded-full bg-secondary-50 px-2 py-0.5 text-xs font-semibold text-secondary-600">
                          Refunded
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-700">
                          <Amount value={sale.earnings.formatted.withCurrency} />
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {pagination && pagination.totalPage > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {pagination.presentPage} of {pagination.totalPage}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={!pagination.previousPage}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={!pagination.nextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default memo(SalesTable);
