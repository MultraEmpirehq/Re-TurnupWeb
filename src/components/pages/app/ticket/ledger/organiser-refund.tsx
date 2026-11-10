"use client";

import { getData, postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ILedgerOrder, useVendorLedger } from "@/hooks/use-vendor-tickets";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { memo, useEffect, useMemo, useState } from "react";

type TMoney = { amount: number; formatted: { withCurrency: string } };

type TPreview = {
  ticketCount: number;
  toCard: TMoney;
  asCredit: TMoney;
  feeKept: TMoney;
  fromOrganiser: TMoney;
};

const usePreview = (orderId: string | null, ticketIds: string[]) =>
  useQuery({
    queryKey: ["vendor-refund-preview", orderId, ticketIds],
    enabled: !!orderId && ticketIds.length > 0,
    queryFn: async () =>
      (
        await getData<TPreview>(`/vendor/orders/${orderId}/refund-preview`, {
          params: { ticketIds: ticketIds.join(",") },
        })
      ).data?.data ?? null,
    retry: 0,
  });

/**
 * Refunding a buyer: pick the tickets, say why (the buyer sees it), see what
 * goes back and what comes off your earnings, then confirm. Tickets already
 * used at the door can't be refunded.
 */
const OrganiserRefund = ({
  order,
  open,
  onClose,
}: {
  order: ILedgerOrder | null;
  open: boolean;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState("");

  const { data, isPending } = useVendorLedger(
    order ? { orderId: order.id, status: "not_checked_in", sort: "oldest" } : {},
    1,
    100,
    open && !!order,
  );
  const tickets = useMemo(
    () => (open && order ? (data?.records ?? []).filter((r) => !r.refundedAt) : []),
    [data?.records, open, order],
  );

  // Everything still refundable starts ticked.
  useEffect(() => {
    if (open) setSelected(tickets.map((t) => t.id));
  }, [open, tickets]);
  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const preview = usePreview(open ? (order?.id ?? null) : null, selected);

  const refund = useMutation({
    mutationFn: () =>
      postData(`/vendor/orders/${order?.id}/refunds`, {
        ticketIds: selected,
        reason: reason.trim(),
      }),
    onSuccess: () => {
      for (const key of ["vendor-ledger", "vendor-ledger-orders", "vendor-ledger-summary"]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      toast.success(
        `Refunded ${selected.length} ticket${selected.length === 1 ? "" : "s"}. The buyer has been told.`,
      );
      onClose();
    },
    onError: (error) =>
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't refund this order.")),
  });

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const ready = selected.length > 0 && reason.trim().length >= 3 && !!preview.data;
  const p = preview.data;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refund {order?.buyer.name ?? "this buyer"}</DialogTitle>
          <DialogDescription>
            {order?.reference ? `Order #${order.reference}` : "This order"}
            {order?.event?.name ? ` · ${order.event.name}` : ""}
          </DialogDescription>
        </DialogHeader>

        {isPending && !data ? (
          <div className="space-y-2">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
        ) : tickets.length === 0 ? (
          <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            Nothing left to refund: every ticket was used at the door or is already refunded.
          </p>
        ) : (
          <div className="space-y-4">
            <fieldset className="space-y-1">
              <legend className="mb-1 text-sm font-semibold">Tickets</legend>
              <ul className="max-h-48 divide-y overflow-y-auto rounded-xl border">
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                      <Checkbox
                        checked={selected.includes(ticket.id)}
                        onCheckedChange={() => toggle(ticket.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{ticket.ticketType}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {ticket.holderName}
                        </span>
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">{ticket.ticketCode}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            <label className="block space-y-1">
              <span className="text-sm font-semibold">Reason (the buyer sees this)</span>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={300}
                rows={2}
                placeholder="e.g. Can no longer attend"
              />
            </label>

            <dl
              className={cn(
                "grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 rounded-xl bg-muted/60 p-4 text-sm",
                preview.isFetching && "opacity-60",
              )}
            >
              {!p ? (
                <dd className="col-span-2 text-muted-foreground">
                  {selected.length ? "Working it out…" : "Pick at least one ticket."}
                </dd>
              ) : (
                <>
                  {p.toCard.amount > 0 && (
                    <>
                      <dt className="text-muted-foreground">Back to their card</dt>
                      <dd className="text-right font-semibold">{p.toCard.formatted.withCurrency}</dd>
                    </>
                  )}
                  {p.asCredit.amount > 0 && (
                    <>
                      <dt className="text-muted-foreground">Back as Turnupz Credit</dt>
                      <dd className="text-right font-semibold">{p.asCredit.formatted.withCurrency}</dd>
                    </>
                  )}
                  {p.feeKept.amount > 0 && (
                    <>
                      <dt className="text-muted-foreground">Booking fee, not refunded</dt>
                      <dd className="text-right">{p.feeKept.formatted.withCurrency}</dd>
                    </>
                  )}
                  <dt className="border-t pt-1.5 font-semibold">Comes off your earnings</dt>
                  <dd className="border-t pt-1.5 text-right font-bold">
                    {p.fromOrganiser.formatted.withCurrency}
                  </dd>
                </>
              )}
            </dl>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose}>
            Cancel
          </Button>
          {tickets.length > 0 && (
            <Button
              variant="destructive"
              className="rounded-full"
              disabled={!ready}
              loading={refund.isPending}
              onClick={() => refund.mutate()}
            >
              Refund {selected.length} ticket{selected.length === 1 ? "" : "s"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(OrganiserRefund);
