"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import {
  IAdminUserTransfer,
  useAdminCancelTransfer,
  useAdminUserTransfers,
} from "@/hooks/use-admin-moderation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import React, { memo, useState } from "react";
import { toast } from "@/lib/toast";
import { NoteDialog } from "../moderation/moderation-ui";

const STATUS_TONE: Record<IAdminUserTransfer["status"], string> = {
  PENDING: "bg-secondary-50 text-secondary-800",
  CLAIMED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-muted text-muted-foreground",
};
const STATUS_LABEL: Record<IAdminUserTransfer["status"], string> = {
  PENDING: "Waiting",
  CLAIMED: "Claimed",
  CANCELLED: "Cancelled",
};

/**
 * A person's ticket transfers in the user panel, for support: where a ticket
 * went, and (with Suspend users) undoing one still waiting, say to a wrong email.
 */
const UserTransfers: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: transfers = [], isLoading } = useAdminUserTransfers(userId);
  const { has } = useAdminPermissions();
  const canCancel = has("USERS_MANAGE");
  const cancel = useAdminCancelTransfer();
  const [cancelling, setCancelling] = useState<IAdminUserTransfer | null>(null);

  const handleCancel = async (reason: string) => {
    if (!cancelling) return;
    try {
      await cancel.mutateAsync({ id: cancelling.id, reason });
      toast.success("Transfer cancelled. The ticket is back with the sender.");
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

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold">Ticket transfers</h3>
      {isLoading ? (
        <Skeleton className="h-16 rounded-lg" />
      ) : transfers.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          They haven&apos;t sent or received any tickets.
        </p>
      ) : (
        <ul className="space-y-2">
          {transfers.map((transfer) => {
            const sent = transfer.direction === "sent";
            const other = sent ? transfer.to : transfer.from;
            const Icon = sent ? ArrowUpRight : ArrowDownLeft;
            return (
              <li
                key={transfer.id}
                className="flex items-start gap-3 rounded-lg bg-muted/40 p-3"
              >
                <Icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    sent ? "text-sky-600" : "text-emerald-600",
                  )}
                  aria-label={sent ? "Sent" : "Received"}
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-sm font-medium text-foreground">
                    {transfer.event?.name ?? "Event"} · {transfer.ticketName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {sent ? "To " : "From "}
                    {other.name
                      ? `${other.name} (${other.email})`
                      : other.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transfer.createdAt), "d MMM yyyy, HH:mm")}
                    {transfer.ticketCode && ` · ${transfer.ticketCode}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      STATUS_TONE[transfer.status],
                    )}
                  >
                    {STATUS_LABEL[transfer.status]}
                  </span>
                  {canCancel && transfer.status === "PENDING" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                      onClick={() => setCancelling(transfer)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <NoteDialog
        open={!!cancelling}
        title="Cancel this transfer?"
        description="The ticket goes back to the sender and both people are told. Your reason is kept in the audit log and shown to the sender."
        label="Reason"
        placeholder="For example: sent to the wrong email, customer asked us to undo it."
        confirmLabel="Cancel transfer"
        tone="danger"
        required
        busy={cancel.isPending}
        onCancel={() => setCancelling(null)}
        onConfirm={(reason) => void handleCancel(reason)}
      />
    </div>
  );
};

export default memo(UserTransfers);
