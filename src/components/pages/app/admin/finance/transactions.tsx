"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import { Input } from "@/components/ui/input";
import ResultPagination from "@/components/ui/result-pagination";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  fetchFinanceTransactions,
  IFinanceTransaction,
  TRANSACTIONS_PAGE_SIZE,
  TTransactionFilter,
  TTransactionStatus,
  useFinanceTransactions,
} from "@/hooks/use-admin-finance";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Search } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { ListSkeleton } from "../moderation/moderation-ui";
import { downloadCsv, FinanceHeader, money, Pill, PROVIDER_LABEL, useFinanceRange } from "./finance-ui";

const FILTERS: { value: TTransactionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
  { value: "held", label: "Held by Turnupz" },
  { value: "review", label: "Needs review" },
];

const STATUS: Record<TTransactionStatus, { label: string; tone: "good" | "warn" | "bad" | "muted" | "info" }> = {
  completed: { label: "Paid", tone: "good" },
  partly_refunded: { label: "Part refunded", tone: "info" },
  refunded: { label: "Refunded", tone: "muted" },
  failed: { label: "Failed", tone: "muted" },
  held: { label: "Held by Turnupz", tone: "warn" },
  needs_review: { label: "Needs review", tone: "bad" },
};

const settledText = (row: IFinanceTransaction) => {
  if (!row.settledTo) return "—";
  if (row.settledTo.kind === "held") return "Held by Turnupz (owed to the organiser)";
  const { bankName, last4, provider } = row.settledTo;
  return [bankName, last4 ? `••${last4}` : null].filter(Boolean).join(" ") || PROVIDER_LABEL[provider] || provider;
};

/** One payment and how it split. */
const PaymentPanel: React.FC<{ row: IFinanceTransaction | null; currency: string; onClose: () => void }> = ({
  row,
  currency,
  onClose,
}) => {
  const lines: [string, string, boolean?][] = row
    ? [
        ["Paid by buyer", money(row.gross - row.credit, currency)],
        ...(row.credit ? ([["Turnupz Credit", money(row.credit, currency)]] as [string, string][]) : []),
        ...(row.discount ? ([["Organiser discount", `−${money(row.discount, currency)}`]] as [string, string][]) : []),
        ["Ticket value", money(row.gross, currency), true],
        ["Turnupz fee", money(row.fee, currency)],
        [`To ${row.organiser ?? "the organiser"}`, money(row.toOrganiser, currency), true],
        ...(row.refunded ? ([["Refunded", `−${money(row.refunded, currency)}`]] as [string, string][]) : []),
        ["Paid to", settledText(row)],
        ["Provider", row.provider ? PROVIDER_LABEL[row.provider] : "—"],
        ["Provider ref", row.providerRef ?? "—"],
      ]
    : [];
  const feeShare = row && row.gross ? (row.fee / row.gross) * 100 : 0;
  return (
    <Sheet open={!!row} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        {row && (
          <>
            <SheetHeader className="border-b">
              <p className="font-mono text-xs text-muted-foreground">Order {row.reference ?? row.id.slice(0, 8)}</p>
              <SheetTitle className="text-xl">{money(row.gross, currency)}</SheetTitle>
              <SheetDescription>
                {row.event?.name ?? "Event"} · {row.tickets} {row.tickets === 1 ? "ticket" : "tickets"} ·{" "}
                {format(new Date(row.createdAt), "d MMM yyyy, h:mm a")}
              </SheetDescription>
              <div className="pt-1">
                <Pill tone={STATUS[row.status]?.tone ?? "muted"}>{STATUS[row.status]?.label ?? row.status}</Pill>
              </div>
            </SheetHeader>
            <div className="space-y-5 overflow-y-auto p-4">
              {row.gross > 0 && row.fee > 0 && (
                <div>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div className="bg-primary-600" style={{ width: `${100 - feeShare}%` }} />
                    <div className="bg-secondary-950" style={{ width: `${feeShare}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {Math.round(100 - feeShare)}% to the organiser, {Math.round(feeShare * 10) / 10}% Turnupz fee
                  </p>
                </div>
              )}
              <dl className="space-y-2.5 text-sm">
                {lines.map(([label, value, strong]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className={cn("text-right tabular-nums", strong && "font-semibold")}>{value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Buyer</dt>
                  <dd className="text-right">{row.buyer}</dd>
                </div>
              </dl>
              {row.reference && (row.status === "completed" || row.status === "partly_refunded" || row.status === "held") && (
                <Button asChild variant="outline" className="w-full rounded-full border-red-200 text-red-600 hover:bg-red-50">
                  <Link href={`/app/admin/finance/refunds?order=${encodeURIComponent(row.reference)}`}>Refund…</Link>
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

/** Every payment on Turnupz in the period, with how it split. */
const Transactions = () => {
  const { range, currency } = useFinanceRange();
  const [status, setStatus] = useState<TTransactionFilter>("all");
  const [search, setSearch] = useState("");
  const [q] = useDebounce(search.trim(), 400);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<IFinanceTransaction | null>(null);
  const [exporting, setExporting] = useState(false);
  useEffect(() => setPage(1), [status, q, range]);

  const { data, isPending, error, refetch } = useFinanceTransactions(range, { status, q, page });
  const totalPages = Math.ceil((data?.total ?? 0) / TRANSACTIONS_PAGE_SIZE);

  const exportCsv = async () => {
    setExporting(true);
    try {
      // Everything matching, up to 5,000 rows.
      const all = await fetchFinanceTransactions(range, { status, q, page: 1, limit: 5000 });
      downloadCsv(`turnupz-transactions-${currency}.csv`, [
        ["Date", "Order", "Status", "Buyer", "Event", "Organiser", "Provider", "Provider ref", "Tickets", `Ticket value (${currency})`, `Credit (${currency})`, `Turnupz fee (${currency})`, `To organiser (${currency})`, `Refunded (${currency})`, "Paid to"],
        ...all.items.map((row) => [
          format(new Date(row.createdAt), "yyyy-MM-dd HH:mm"),
          row.reference,
          STATUS[row.status]?.label ?? row.status,
          row.buyer,
          row.event?.name,
          row.organiser,
          row.provider ? PROVIDER_LABEL[row.provider] : "",
          row.providerRef,
          row.tickets,
          row.gross,
          row.credit,
          row.fee,
          row.toOrganiser,
          row.refunded,
          settledText(row),
        ]),
      ]);
      if (all.total > all.items.length) toast.info(`Exported the first ${all.items.length.toLocaleString()} of ${all.total.toLocaleString()}.`);
    } catch (failure) {
      toast.error(constructErrorMessage(failure as TApiErrorResponseType, "We couldn't export the payments"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5 pb-16">
      <FinanceHeader
        title="Transactions"
        description="Every payment on Turnupz, with how it was split."
        onExport={() => void exportCsv()}
        exporting={exporting}
      />

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search order, buyer, organiser or event"
          className="h-11 rounded-full bg-card pl-10"
          aria-label="Search payments"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter payments">
        {FILTERS.map((filter) => {
          const count = data?.counts?.[filter.value];
          const active = status === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={active}
              onClick={() => setStatus(filter.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-secondary-800 bg-secondary-800 text-white"
                  : filter.value === "held" && count
                    ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                    : "border-border bg-card text-secondary-800 hover:bg-muted",
              )}
            >
              {filter.label}
              {count !== undefined && <span className="ml-1.5 tabular-nums opacity-70">{count.toLocaleString()}</span>}
            </button>
          );
        })}
      </div>

      {error ? (
        <ErrorContainer
          error={constructErrorMessage(error as TApiErrorResponseType, "We couldn't load payments")}
          retryFunction={() => void refetch()}
        />
      ) : isPending ? (
        <ListSkeleton />
      ) : !data?.items.length ? (
        <EmptyContainer title="No payments" description="Nothing matches in this period. Try another period or filter." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] tracking-wider text-muted-foreground uppercase">
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Order · buyer</th>
                  <th className="px-4 py-3 font-semibold">Event · organiser</th>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 text-right font-semibold">Value</th>
                  <th className="px-4 py-3 text-right font-semibold">Turnupz fee</th>
                  <th className="px-4 py-3 text-right font-semibold">To organiser</th>
                  <th className="px-4 py-3 text-right font-semibold">Credit</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setOpen(row)}
                    onKeyDown={(event) => event.key === "Enter" && setOpen(row)}
                    tabIndex={0}
                    className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {format(new Date(row.createdAt), "d MMM, h:mm a")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-mono text-xs text-primary-700">{row.reference ?? "—"}</span>
                      <span className="block">{row.buyer}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block">{row.event?.name ?? "—"}</span>
                      <span className="block text-xs text-muted-foreground">{row.organiser ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.provider ? PROVIDER_LABEL[row.provider] : "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{money(row.gross, currency)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.fee ? money(row.fee, currency) : "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.toOrganiser ? money(row.toOrganiser, currency) : "—"}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{row.credit ? money(row.credit, currency) : "—"}</td>
                    <td className="px-4 py-3">
                      <Pill tone={STATUS[row.status]?.tone ?? "muted"}>{STATUS[row.status]?.label ?? row.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>
              {((page - 1) * TRANSACTIONS_PAGE_SIZE + 1).toLocaleString()}–
              {Math.min(page * TRANSACTIONS_PAGE_SIZE, data.total).toLocaleString()} of {data.total.toLocaleString()}
            </span>
            {totalPages > 1 && <ResultPagination totalPages={totalPages} currentPage={page} onPageChange={setPage} />}
          </div>
        </div>
      )}

      <PaymentPanel row={open} currency={currency} onClose={() => setOpen(null)} />
    </div>
  );
};

export default memo(Transactions);
