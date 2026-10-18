"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import { Input } from "@/components/ui/input";
import ResultPagination from "@/components/ui/result-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ILookupOrder,
  REFUNDS_PAGE_SIZE,
  TRefundKind,
  TRefundStatus,
  useAdminRefunds,
  useCancelEventWithRefunds,
  useMarkDisputed,
  useOrderLookup,
  useRefundOrder,
  useRefundPreview,
  useRetryRefund,
} from "@/hooks/use-admin-refunds";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { AlertTriangle, Search, Undo2 } from "lucide-react";
import React, { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import {
  FilterTabs,
  ListSkeleton,
  PageHeading,
} from "../moderation/moderation-ui";

const STATUS_STYLE: Record<TRefundStatus, string> = {
  PROCESSING: "bg-secondary-50 text-secondary-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
};
const STATUS_LABEL: Record<TRefundStatus, string> = {
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
};
const KIND_LABEL: Record<TRefundKind, string> = {
  ORDER: "Order refund",
  EVENT_CANCELLED: "Event cancelled",
  DISPUTE: "Payment dispute",
};

const name = (
  person?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null,
) =>
  person
    ? [person.firstName, person.lastName].filter(Boolean).join(" ") ||
      person.email
    : "—";

const Card: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <section className="space-y-4 rounded-xl border border-border bg-card p-5">
    <div>
      <h2 className="font-semibold">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    {children}
  </section>
);

/**
 * Refunds, for admins who hold the refunds permission. Find an order, pick
 * tickets, check what goes where, then refund; cancel an event for everyone;
 * mark a payment disputed; and retry card refunds the provider refused. Every
 * action is in the audit log.
 */
const Refunds = () => (
  <div className="space-y-6">
    <PageHeading title="Refunds">
      Credit goes back at once; the card part through Flutterwave (or Paystack
      for older payments). Refunding one order keeps Turnupz&apos;s fee;
      cancelling an event returns it. Everything here is audited.
    </PageHeading>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <RefundAnOrder />
      <CancelEvent />
    </div>
    <RefundHistory />
  </div>
);

/* ------------------------------------------------------------- one order */

const RefundAnOrder = () => {
  const [search, setSearch] = useState("");
  const [q] = useDebounce(search.trim(), 400);
  const { data: orders, isFetching } = useOrderLookup(q);
  const [selected, setSelected] = useState<ILookupOrder | null>(null);

  // Keep the chosen order fresh after a refund lands.
  useEffect(() => {
    if (!selected || !orders) return;
    const fresh = orders.find((order) => order.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [orders, selected]);

  return (
    <Card
      title="Refund an order"
      description="Search by order reference or the buyer's email."
    >
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setSelected(null);
          }}
          placeholder="e.g. ORD-7HX2 or ada@example.com"
          className="pl-9"
        />
      </div>

      {q.length >= 3 && !selected && (
        <div className="space-y-2">
          {isFetching && <Skeleton className="h-16 w-full rounded-lg" />}
          {!isFetching && orders?.length === 0 && (
            <p className="text-sm text-muted-foreground">No orders match.</p>
          )}
          {orders?.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelected(order)}
              className="flex w-full items-start justify-between gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {order.event?.name ?? "Event"} · {order.ticketName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.reference ?? order.id.slice(0, 8)} ·{" "}
                  {name(order.buyer)} ·{" "}
                  {format(new Date(order.createdAt), "d MMM yyyy")}
                </p>
              </div>
              <div className="shrink-0 text-right text-xs">
                <p className="font-semibold">
                  {order.paidByCard.formatted.withCurrency}
                </p>
                <p className="text-muted-foreground">
                  {order.status.toLowerCase()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <OrderRefundPanel order={selected} onBack={() => setSelected(null)} />
      )}
    </Card>
  );
};

const OrderRefundPanel: React.FC<{
  order: ILookupOrder;
  onBack: () => void;
}> = ({ order, onBack }) => {
  const refundable = useMemo(
    () => order.tickets.filter((ticket) => !ticket.refundedAt),
    [order.tickets],
  );
  const [ticketIds, setTicketIds] = useState<string[]>(() =>
    refundable.map((ticket) => ticket.id),
  );
  useEffect(() => {
    setTicketIds(refundable.map((ticket) => ticket.id));
  }, [refundable]);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState<"refund" | "dispute" | null>(
    null,
  );
  const preview = useRefundPreview(order.id, ticketIds);
  const refund = useRefundOrder();
  const dispute = useMarkDisputed();
  const busy = refund.isPending || dispute.isPending;

  const toggle = (id: string) =>
    setTicketIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );

  const run = () => {
    const done = (message: string) => () => {
      toast.success(message);
      setConfirming(null);
      setReason("");
    };
    const failed = (error: unknown) =>
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "That didn't go through",
        ),
      );
    if (confirming === "refund") {
      refund.mutate(
        { orderId: order.id, ticketIds, reason: reason.trim() },
        {
          onSuccess: done(
            `Refunded ${ticketIds.length} ticket${ticketIds.length === 1 ? "" : "s"}`,
          ),
          onError: failed,
        },
      );
    } else if (confirming === "dispute") {
      dispute.mutate(
        { orderId: order.id, reason: reason.trim() },
        { onSuccess: done("Marked as disputed"), onError: failed },
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-muted/50 p-3 text-sm">
        <div>
          <p className="font-semibold">
            {order.event?.name} · {order.ticketName}
          </p>
          <p className="text-muted-foreground">
            {order.reference ?? order.id} · {name(order.buyer)} (
            {order.buyer.email})
          </p>
          <p className="text-muted-foreground">
            Paid {order.paidByCard.formatted.withCurrency} by card
            {order.provider ? ` (${order.provider.toLowerCase()})` : ""}
            {order.paidWithCredit.amount > 0 &&
              ` + ${order.paidWithCredit.formatted.withCurrency} credit`}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          Change order
        </Button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Tickets</p>
        <ul className="space-y-1.5">
          {order.tickets.map((ticket) => {
            const done = !!ticket.refundedAt;
            return (
              <li key={ticket.id}>
                <label
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border p-2.5 text-sm",
                    done ? "opacity-60" : "cursor-pointer",
                  )}
                >
                  <Checkbox
                    checked={ticketIds.includes(ticket.id)}
                    disabled={done || busy}
                    onCheckedChange={() => toggle(ticket.id)}
                  />
                  <span className="font-mono text-xs">{ticket.code}</span>
                  {!!ticket.ticketName && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                      {ticket.ticketName}
                    </span>
                  )}
                  <span className="truncate text-muted-foreground">
                    {ticket.attendeeName ?? ""}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {done
                      ? `Refunded ${format(new Date(ticket.refundedAt!), "d MMM")}`
                      : ticket.status.toLowerCase().replace("_", " ")}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {refundable.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Every ticket on this order is already refunded.
          </p>
        )}
      </div>

      {ticketIds.length > 0 && (
        <div className="rounded-lg border border-border p-3 text-sm">
          <p className="mb-2 font-medium">What happens</p>
          {preview.isLoading && <Skeleton className="h-20 w-full" />}
          {preview.error && (
            <p className="text-red-700">
              {constructErrorMessage(
                preview.error as TApiErrorResponseType,
                "Couldn't work out this refund",
              )}
            </p>
          )}
          {preview.data && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <dt className="text-muted-foreground">Back to their card</dt>
              <dd className="text-right font-semibold">
                {preview.data.toCard.formatted.withCurrency}
              </dd>
              <dt className="text-muted-foreground">Back as credit</dt>
              <dd className="text-right font-semibold">
                {preview.data.asCredit.formatted.withCurrency}
              </dd>
              <dt className="text-muted-foreground">Turnupz fee kept</dt>
              <dd className="text-right">
                {preview.data.feeKept.formatted.withCurrency}
              </dd>
              <dt className="text-muted-foreground">From the organiser</dt>
              <dd className="text-right">
                {preview.data.fromOrganiser.formatted.withCurrency}
              </dd>
              <dd className="col-span-2 text-xs text-muted-foreground">
                The organiser was paid {preview.data.organiserWasPaid}.
              </dd>
            </dl>
          )}
        </div>
      )}

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Reason (the buyer is told)</span>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={2}
          placeholder="e.g. Buyer can no longer attend"
        />
      </label>

      {confirming ? (
        <div className="space-y-3 rounded-lg border-2 border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {confirming === "refund"
              ? `Refund ${ticketIds.length} ticket${ticketIds.length === 1 ? "" : "s"}? They stop working now and the money goes back. This can't be undone.`
              : "Mark this order disputed? Its tickets stop working, any rewards from it are taken back, and nothing is refunded by us (the bank handles disputes)."}
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={run}
              disabled={busy}
            >
              {busy ? "Working…" : "Yes, go ahead"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(null)}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setConfirming("refund")}
            disabled={!ticketIds.length || !reason.trim() || !preview.data}
          >
            <Undo2 className="size-4" />
            Refund {ticketIds.length} ticket{ticketIds.length === 1 ? "" : "s"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirming("dispute")}
            disabled={!reason.trim()}
          >
            Mark disputed
          </Button>
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------------------- cancel event */

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const CancelEvent = () => {
  const [link, setLink] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const cancel = useCancelEventWithRefunds();
  const eventId = link.match(UUID)?.[0] ?? null;

  const run = () =>
    eventId &&
    cancel.mutate(
      { eventId, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Event cancelled. Refunds are on their way.");
          setLink("");
          setReason("");
          setConfirming(false);
        },
        onError: (error) =>
          toast.error(
            constructErrorMessage(
              error as TApiErrorResponseType,
              "Couldn't cancel the event",
            ),
          ),
      },
    );

  return (
    <Card
      title="Cancel an event"
      description="Cancels it and refunds every buyer in full, Turnupz's fee included."
    >
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Event link or ID</span>
        <Input
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder="Paste the event's page link"
        />
        {link && !eventId && (
          <span className="text-xs text-red-600">
            That doesn&apos;t contain an event ID.
          </span>
        )}
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Reason (every buyer is told)</span>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={2}
          placeholder="e.g. Venue flooded"
        />
      </label>
      {confirming ? (
        <div className="space-y-3 rounded-lg border-2 border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            Cancel this event and refund everyone? Every ticket stops working.
            This can&apos;t be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={run}
              disabled={cancel.isPending}
            >
              {cancel.isPending ? "Cancelling…" : "Yes, cancel it"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={cancel.isPending}
            >
              Keep it
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="destructive"
          onClick={() => setConfirming(true)}
          disabled={!eventId || !reason.trim()}
        >
          Cancel event and refund all
        </Button>
      )}
    </Card>
  );
};

/* --------------------------------------------------------------- history */

const STATUS_TABS: { value: TRefundStatus | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "PROCESSING", label: "Processing" },
  { value: "FAILED", label: "Failed" },
  { value: "COMPLETED", label: "Completed" },
];

const RefundHistory = () => {
  const [status, setStatus] = useState<TRefundStatus | undefined>();
  const [search, setSearch] = useState("");
  const [q] = useDebounce(search.trim(), 400);
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status, q]);
  const { data, error, isLoading, refetch } = useAdminRefunds({
    page,
    status,
    q: q || undefined,
  });
  const retry = useRetryRefund();
  const refunds = data?.items ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / REFUNDS_PAGE_SIZE);

  return (
    <Card title="Refund history">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs tabs={STATUS_TABS} value={status} onChange={setStatus} />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Reference, email or reason"
          className="sm:max-w-xs"
        />
      </div>
      {isLoading && <ListSkeleton />}
      {!!error && !isLoading && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Could not load refunds",
          )}
          retryFunction={() => void refetch()}
        />
      )}
      {!isLoading && !error && refunds.length === 0 && (
        <EmptyContainer
          icon={<Undo2 className="size-6" />}
          title="No refunds here"
          description="Refunds show here as they're made."
        />
      )}
      {refunds.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-2 font-medium">When</th>
                <th className="p-2 font-medium">Order</th>
                <th className="p-2 font-medium">Type</th>
                <th className="p-2 font-medium">Tickets</th>
                <th className="p-2 font-medium">To card</th>
                <th className="p-2 font-medium">As credit</th>
                <th className="p-2 font-medium">Status</th>
                <th className="p-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund) => (
                <tr
                  key={refund.id}
                  className="border-b border-border align-top last:border-0"
                >
                  <td className="p-2 whitespace-nowrap text-muted-foreground">
                    {formatDistanceToNow(new Date(refund.createdAt), {
                      addSuffix: true,
                    })}
                    <p className="text-xs">by {name(refund.createdBy)}</p>
                  </td>
                  <td className="p-2">
                    <p className="font-medium">
                      {refund.order.ticketDetails?.eventDetails?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {refund.order.reference} ·{" "}
                      {name(refund.order.userDetails)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      “{refund.reason}”
                    </p>
                  </td>
                  <td className="p-2 text-xs">{KIND_LABEL[refund.kind]}</td>
                  <td className="p-2">{refund.ticketCount}</td>
                  <td className="p-2">
                    {refund.cardAmount.formatted.withCurrency}
                  </td>
                  <td className="p-2">
                    {refund.creditAmount.formatted.withCurrency}
                  </td>
                  <td className="p-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        STATUS_STYLE[refund.status],
                      )}
                    >
                      {STATUS_LABEL[refund.status]}
                    </span>
                    {refund.status === "FAILED" && refund.providerMessage && (
                      <p className="mt-1 max-w-[180px] text-xs text-red-700">
                        {refund.providerMessage}
                      </p>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {refund.status === "FAILED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={retry.isPending}
                        onClick={() =>
                          retry.mutate(refund.id, {
                            onSuccess: () => toast.success("Retried"),
                            onError: (retryError) =>
                              toast.error(
                                constructErrorMessage(
                                  retryError as TApiErrorResponseType,
                                  "The retry failed",
                                ),
                              ),
                          })
                        }
                      >
                        Retry
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <ResultPagination
          totalPages={totalPages}
          currentPage={page}
          onPageChange={setPage}
        />
      )}
    </Card>
  );
};

export default memo(Refunds);
