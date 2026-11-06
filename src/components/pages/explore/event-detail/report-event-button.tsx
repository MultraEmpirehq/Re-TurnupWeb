"use client";

import { postData } from "@/api";
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
import { REPORT_REASON_HINTS, REPORT_REASON_LABELS } from "@/lib/event-reports";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { Flag } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { memo, useState } from "react";
import { toast } from "@/lib/toast";

const REASONS = Object.keys(REPORT_REASON_LABELS);

/**
 * Lets an attendee flag an event to the moderators. Hidden from the event's own
 * organiser and from admins, who act on reports rather than send them.
 */
const ReportEventButton: React.FC<{
  eventId: string;
  eventName?: string;
  isOwner?: boolean;
}> = ({ eventId, eventName, isOwner }) => {
  const router = useRouter();
  const pathname = usePathname();
  const userDetails = useUserStore((state) => state.userDetails);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  if (isOwner || userDetails?.role === EUserRoles.ADMIN) return null;

  const needsDetails = reason === "other";
  const canSend = !!reason && (!needsDetails || !!details.trim());

  const openDialog = () => {
    if (!userDetails) {
      toast("Log in to report an event", {
        description: "Reports are tied to an account so we can follow up.",
        action: {
          label: "Log in",
          onClick: () =>
            router.push(
              `${ROUTES.LOGIN.href}?redirect=${encodeURIComponent(pathname)}`,
            ),
        },
      });
      return;
    }
    setReason(null);
    setDetails("");
    setOpen(true);
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await postData(`/event/${eventId}/report`, {
        reason,
        details: details.trim() || undefined,
      });
      setOpen(false);
      toast.success("Thanks, we've got your report", {
        description:
          "A moderator will look into it. We'll let you know what happens.",
      });
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "We couldn't send your report. Please try again.",
        ),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-red-600 hover:underline"
      >
        <Flag className="size-4" aria-hidden />
        Report this event
      </button>

      <Dialog open={open} onOpenChange={(next) => !sending && setOpen(next)}>
        <DialogContent className="rounded-[1.6rem] border-secondary-100 p-6 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-secondary-950">
              Report {eventName ? `"${eventName}"` : "this event"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-secondary-500">
              Tell us what&apos;s wrong. The organiser won&apos;t see who sent
              it.
            </DialogDescription>
          </DialogHeader>

          <div
            role="radiogroup"
            aria-label="What's wrong"
            className="grid gap-2"
          >
            {REASONS.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={reason === value}
                onClick={() => setReason(value)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition-colors",
                  reason === value
                    ? "border-red-300 bg-red-50"
                    : "border-secondary-100 hover:border-secondary-200 hover:bg-secondary-50",
                )}
              >
                <span className="block text-sm font-semibold text-secondary-950">
                  {REPORT_REASON_LABELS[value]}
                </span>
                <span className="block text-xs text-secondary-500">
                  {REPORT_REASON_HINTS[value]}
                </span>
              </button>
            ))}
          </div>

          <TextareaField
            label={needsDetails ? "Details" : "Details (optional)"}
            placeholder="Anything that helps us check, like what you were told or charged."
            value={details}
            maxLength={1000}
            inputClassName="min-h-20"
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDetails(event.target.value)
            }
          />

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-secondary-200"
              disabled={sending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canSend || sending}
              loading={sending}
              onClick={() => void handleSend()}
              className="rounded-2xl bg-red-600 text-white hover:bg-red-700"
            >
              Send report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default memo(ReportEventButton);
