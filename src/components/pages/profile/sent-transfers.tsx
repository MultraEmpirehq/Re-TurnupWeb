"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import CustomImageComponent from "@/components/ui/custom-image.component";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ISentTransfer,
  TTransferStatus,
  useCancelTransfer,
  useSentTransfers,
  recipientLabel,
} from "@/hooks/use-user-tickets";
import { formatEventTime } from "@/lib/event-time";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { formatDistanceToNow } from "date-fns";
import { Send } from "lucide-react";
import Link from "next/link";
import React, { memo, useState } from "react";
import { toast } from "@/lib/toast";

const STATUS: Record<TTransferStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Waiting to be claimed",
    className: "bg-secondary-50 text-secondary-800",
  },
  CLAIMED: { label: "Claimed", className: "bg-emerald-50 text-emerald-700" },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground",
  },
};

/**
 * Tickets you've sent. A waiting one is no longer yours to use or send again
 * until the recipient claims it or you take it back; a claimed one is theirs.
 */
const SentTransfers = () => {
  const { data: transfers = [], isLoading } = useSentTransfers();
  const cancel = useCancelTransfer();
  const [cancelling, setCancelling] = useState<ISentTransfer | null>(null);

  const handleCancel = async () => {
    if (!cancelling) return;
    try {
      await cancel.mutateAsync(cancelling.id);
      toast.success("Transfer cancelled. The ticket is back in My Tickets.");
      setCancelling(null);
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't cancel the transfer.",
        ),
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Send className="mx-auto mb-4 size-12 opacity-40" />
        <p className="text-lg font-medium">Nothing sent yet</p>
        <p className="mt-1 text-sm">
          Tickets you transfer to someone show here until they&apos;re claimed.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {transfers.map((transfer) => {
          const ticket = transfer.userTicket?.ticket;
          const event = ticket?.event;
          const status = STATUS[transfer.status] ?? STATUS.PENDING;
          return (
            <li
              key={transfer.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-secondary-50">
                {!!event?.image && (
                  <CustomImageComponent
                    fill
                    src={event.image}
                    alt=""
                    className="size-full rounded-none"
                    imageClassName="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-foreground">
                    {event?.name ?? "Event"}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      status.className,
                    )}
                  >
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {ticket?.name ?? "Ticket"} to{" "}
                  <span className="font-medium text-foreground">
                    {recipientLabel(transfer)}
                  </span>
                  {transfer.recipientName &&
                    transfer.recipientUsername &&
                    ` (@${transfer.recipientUsername})`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transfer.status === "CLAIMED" && transfer.claimedAt
                    ? `Claimed ${formatDistanceToNow(new Date(transfer.claimedAt), { addSuffix: true })}`
                    : `Sent ${formatDistanceToNow(new Date(transfer.createdAt), { addSuffix: true })}`}
                  {event?.date &&
                    ` · Event ${formatEventTime(event.date, event.timezone, { withYear: false })}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {transfer.status === "PENDING" && (
                  <>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`${ROUTES.PROFILE_TICKETS.href}/transfer/${transfer.userTicket.id}`}
                      >
                        Details
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setCancelling(transfer)}
                    >
                      Take it back
                    </Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={!!cancelling}
        title="Take this ticket back?"
        description={`${cancelling ? recipientLabel(cancelling) : "They"} won't be able to claim it any more, and it goes back into your tickets.`}
        confirmLabel="Take it back"
        tone="danger"
        busy={cancel.isPending}
        onCancel={() => setCancelling(null)}
        onConfirm={() => void handleCancel()}
      />
    </>
  );
};

export default memo(SentTransfers);
