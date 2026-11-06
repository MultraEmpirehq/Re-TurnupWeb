"use client";

import { deleteData, patchData, postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TextareaField from "@/components/ui/textarea-field";
import { IEventDetailsType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Archive, ArchiveRestore, Ban, Hourglass, Trash2 } from "lucide-react";
import React, { memo, useState } from "react";
import { toast } from "@/lib/toast";

const people = (count: number) =>
  `${count.toLocaleString()} ${count === 1 ? "person holds a ticket" : "people hold tickets"}`;

const BUTTON =
  "h-10 rounded-xl px-3 text-sm font-semibold inline-flex items-center justify-center gap-1.5";

/** Ask Turnupz to call the event off; an admin cancels and refunds everyone. */
const CancelRequestDialog: React.FC<{
  event: IEventDetailsType;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}> = ({ event, open, onClose, onDone }) => {
  const manage = event.manage!;
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const declined =
    manage.cancellationRequest?.status === "declined"
      ? manage.cancellationRequest
      : null;

  const submit = async () => {
    setBusy(true);
    try {
      await postData(`/event/${event.id}/cancellation-request`, {
        reason: reason.trim(),
      });
      toast.success("Request sent. We'll review it and let you know.");
      setReason("");
      onDone();
      onClose();
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't send the request.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent className="rounded-[1.6rem] p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary-950">
            Ask us to cancel this event?
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-secondary-500">
            {people(manage.holders)} for &ldquo;{event.name}&rdquo;, so it
            can&apos;t just be deleted.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-2 rounded-2xl bg-secondary-50/70 p-4 text-sm leading-6 text-secondary-700">
          <li>1. The Turnupz team reviews your request.</li>
          <li>
            2. If we approve it, the event is cancelled and every ticket holder
            is refunded in full and told why.
          </li>
          <li>3. Refunds come out of what this event earned.</li>
        </ol>

        {declined && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Your last request wasn&apos;t approved
            {declined.reviewNote ? `: ${declined.reviewNote}` : "."}
          </p>
        )}

        <TextareaField
          label="Why are you cancelling?"
          placeholder="For example: the venue pulled out and we couldn't find another in time."
          value={reason}
          maxLength={300}
          inputClassName="min-h-24"
          onChange={(change: React.ChangeEvent<HTMLTextAreaElement>) =>
            setReason(change.target.value)
          }
          helperText="Ticket holders see this if the cancellation goes ahead."
        />

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl border-secondary-200"
            disabled={busy}
            onClick={onClose}
          >
            Keep the event
          </Button>
          <Button
            type="button"
            className="rounded-2xl bg-red-600 text-white hover:bg-red-700"
            loading={busy}
            disabled={busy || reason.trim().length < 10}
            onClick={submit}
          >
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/** A request is waiting: say so, and let them take it back. */
const PendingDialog: React.FC<{
  event: IEventDetailsType;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}> = ({ event, open, onClose, onDone }) => {
  const request = event.manage?.cancellationRequest;
  const [busy, setBusy] = useState(false);
  const withdraw = async () => {
    setBusy(true);
    try {
      await deleteData(`/event/${event.id}/cancellation-request`);
      toast.success("Request withdrawn. Your event stays on.");
      onDone();
      onClose();
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't withdraw the request.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent className="rounded-[1.6rem] p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary-950">
            Cancellation requested
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-secondary-500">
            We&apos;re reviewing your request to cancel &ldquo;{event.name}
            &rdquo;. Tickets stay on sale and valid until we decide.
          </DialogDescription>
        </DialogHeader>
        {request && (
          <blockquote className="rounded-2xl bg-secondary-50/70 p-4 text-sm leading-6 text-secondary-700">
            &ldquo;{request.reason}&rdquo;
            <span className="mt-1 block text-xs text-secondary-400">
              Sent{" "}
              {new Date(request.createdAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </blockquote>
        )}
        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl border-secondary-200"
            loading={busy}
            disabled={busy}
            onClick={withdraw}
          >
            Withdraw request
          </Button>
          <Button
            type="button"
            className="rounded-2xl"
            disabled={busy}
            onClick={onClose}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * The organiser's "remove" button for one event. It becomes whatever removing
 * means for that event: delete, ask us to cancel, see the request, or archive.
 * Without `manage` (an admin's view, or an older api) it's a plain delete.
 */
const EventRemovalAction: React.FC<{
  event: IEventDetailsType;
  onDeleteRequest: (event: IEventDetailsType) => void;
  onChanged: () => void;
  className?: string;
}> = ({ event, onDeleteRequest, onChanged, className }) => {
  const [dialog, setDialog] = useState<"cancel" | "pending" | null>(null);
  const [archiving, setArchiving] = useState(false);
  const removal = event.manage?.removal ?? "delete";

  const setArchived = async (archived: boolean) => {
    setArchiving(true);
    try {
      await patchData(`/event/${event.id}/archive`, { archived });
      toast.success(
        archived
          ? "Archived. Find it under Archived events."
          : "Back in your listings.",
      );
      onChanged();
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't update the event.",
        ),
      );
    } finally {
      setArchiving(false);
    }
  };

  if (removal === "archive" || removal === "archived") {
    const archived = removal === "archived";
    const Icon = archived ? ArchiveRestore : Archive;
    return (
      <Button
        type="button"
        variant="outline"
        className={cn(
          BUTTON,
          "border-secondary-200 bg-white text-secondary-800 hover:bg-secondary-50",
          className,
        )}
        loading={archiving}
        disabled={archiving}
        title={
          archived
            ? undefined
            : "Over, with tickets sold: it can't be deleted, but you can tuck it away"
        }
        onClick={() => setArchived(!archived)}
      >
        <Icon className="size-4" aria-hidden />
        {archived ? "Unarchive" : "Archive"}
      </Button>
    );
  }

  if (
    removal === "request_cancellation" ||
    removal === "cancellation_pending"
  ) {
    const pending = removal === "cancellation_pending";
    return (
      <>
        <Button
          type="button"
          variant="outline"
          className={cn(
            BUTTON,
            pending
              ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
            className,
          )}
          onClick={() => setDialog(pending ? "pending" : "cancel")}
        >
          {pending ? (
            <Hourglass className="size-4" aria-hidden />
          ) : (
            <Ban className="size-4" aria-hidden />
          )}
          {pending ? "Requested" : "Cancel"}
        </Button>
        <CancelRequestDialog
          event={event}
          open={dialog === "cancel"}
          onClose={() => setDialog(null)}
          onDone={onChanged}
        />
        <PendingDialog
          event={event}
          open={dialog === "pending"}
          onClose={() => setDialog(null)}
          onDone={onChanged}
        />
      </>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        BUTTON,
        "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        className,
      )}
      onClick={() => onDeleteRequest(event)}
    >
      <Trash2 className="size-4" aria-hidden />
      Delete
    </Button>
  );
};

export default memo(EventRemovalAction);
