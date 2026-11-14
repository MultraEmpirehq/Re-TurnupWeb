"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { IAuditLogEntry, useUndoAuditEntry } from "@/hooks/use-admin-audit-logs";
import { toast } from "@/lib/toast";
import { Undo2 } from "lucide-react";
import React, { memo, useState } from "react";

/** What happens, in words, before anyone confirms. */
const CONSEQUENCE: Record<string, string> = {
  "vendor_verification.reviewed":
    "The application goes back to where it was before this decision, usually waiting for review. The vendor is told it's being looked at again; your reason isn't shown to them.",
  "event.suspended":
    "The event is published again and its organiser is told it's live.",
  "user.suspended":
    "The account is reactivated and the person is emailed that they can sign in again.",
  "user.restricted":
    "The restriction is lifted and they're emailed. An organiser's payouts resume on new sales.",
};

/** Undo for one audit row, with a required reason that goes in the log. */
const UndoEntryButton = ({ entry }: { entry: IAuditLogEntry }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const undo = useUndoAuditEntry();
  if (!entry.undo) return null;
  const tooShort = reason.trim().length < 3;

  const confirm = () =>
    undo.mutate(
      { id: entry.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Undone. It's in the audit log with your reason.");
          setOpen(false);
          setReason("");
        },
        onError: (error) =>
          toast.error(
            constructErrorMessage(
              error as unknown as TApiErrorResponseType,
              "That couldn't be undone",
            ),
          ),
      },
    );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 whitespace-nowrap"
        onClick={() => setOpen(true)}
      >
        <Undo2 className="size-3.5" aria-hidden />
        {entry.undo.label}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !undo.isPending && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{entry.undo.label}?</DialogTitle>
            <DialogDescription>
              {entry.targetLabel ?? entry.targetId}.{" "}
              {CONSEQUENCE[entry.action] ?? ""}
            </DialogDescription>
          </DialogHeader>
          <label className="space-y-2 text-sm font-medium">
            <span>Why are you undoing it?</span>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={300}
              rows={3}
              placeholder="For example: approved the wrong application by mistake"
            />
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={undo.isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={tooShort}
              loading={undo.isPending}
              onClick={confirm}
            >
              {entry.undo.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default memo(UndoEntryButton);
