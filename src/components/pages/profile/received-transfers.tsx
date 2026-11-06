"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import CustomImageComponent from "@/components/ui/custom-image.component";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IReceivedTransfer,
  useAcceptTransfer,
  useDeclineTransfer,
  useReceivedTransfers,
} from "@/hooks/use-user-tickets";
import { formatEventTime } from "@/lib/event-time";
import { ROUTES } from "@/lib/variables";
import { formatDistanceToNow } from "date-fns";
import { Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { memo, useState } from "react";
import { toast } from "@/lib/toast";

/**
 * Tickets someone has sent you. Accepting moves it into My Tickets; declining
 * sends it back to them. Either way they're told.
 */
const ReceivedTransfers = () => {
  const router = useRouter();
  const { data: transfers = [], isLoading } = useReceivedTransfers();
  const accept = useAcceptTransfer();
  const decline = useDeclineTransfer();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [declining, setDeclining] = useState<IReceivedTransfer | null>(null);

  const handleAccept = async (transfer: IReceivedTransfer) => {
    setBusyId(transfer.id);
    try {
      await accept.mutateAsync(transfer.id);
      toast.success("It's yours. You'll find it in My Tickets.");
      router.push(ROUTES.PROFILE_TICKETS.href);
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't accept this ticket.",
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async () => {
    if (!declining) return;
    try {
      await decline.mutateAsync(declining.id);
      toast.success(`Declined. It's gone back to ${declining.senderName}.`);
      setDeclining(null);
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't decline this ticket.",
        ),
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Inbox className="mx-auto mb-4 size-12 opacity-40" />
        <p className="text-lg font-medium">Nothing waiting for you</p>
        <p className="mt-1 text-sm">
          When someone sends you a ticket, it shows here for you to accept.
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
          return (
            <li
              key={transfer.id}
              className="flex flex-col gap-4 rounded-2xl border border-sky-100 bg-sky-50/40 p-4 sm:flex-row sm:items-center"
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
                <p className="truncate font-semibold text-foreground">
                  {event?.name ?? "Event"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {transfer.senderName}
                  </span>
                  {transfer.senderUsername &&
                    !transfer.senderName.startsWith("@") &&
                    ` (@${transfer.senderUsername})`}{" "}
                  sent you{" "}
                  {ticket?.name ? `a ${ticket.name} ticket` : "a ticket"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sent{" "}
                  {formatDistanceToNow(new Date(transfer.createdAt), {
                    addSuffix: true,
                  })}
                  {event?.date &&
                    ` · Event ${formatEventTime(event.date, event.timezone, { withYear: false })}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!busyId}
                  onClick={() => setDeclining(transfer)}
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  loading={busyId === transfer.id}
                  disabled={!!busyId}
                  onClick={() => void handleAccept(transfer)}
                  className="bg-secondary text-white hover:bg-secondary-600"
                >
                  Accept
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={!!declining}
        title="Decline this ticket?"
        description={`It goes back to ${declining?.senderName ?? "the sender"}, and they're told you declined.`}
        confirmLabel="Decline"
        tone="danger"
        busy={decline.isPending}
        onCancel={() => setDeclining(null)}
        onConfirm={() => void handleDecline()}
      />
    </>
  );
};

export default memo(ReceivedTransfers);
