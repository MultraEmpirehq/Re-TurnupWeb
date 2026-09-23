"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReviewVerification } from "@/hooks/use-admin-verifications";
import {
  IVendorVerification,
  TApprovalLevel,
  TVerificationDecision,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import React, { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import { APPROVAL_LEVELS } from "./verification-utils";

const DECISIONS: { value: TVerificationDecision; label: string }[] = [
  { value: "approved", label: "Approve" },
  { value: "needs_more_info", label: "Needs more info" },
  { value: "rejected", label: "Reject" },
];

const VerificationDecisionPanel: React.FC<{
  verification: IVendorVerification;
}> = ({ verification }) => {
  const [decision, setDecision] = useState<TVerificationDecision>("approved");
  const [approvalLevel, setApprovalLevel] = useState<TApprovalLevel | "">(
    verification.approvalLevel ?? "",
  );
  const [message, setMessage] = useState("");
  const review = useReviewVerification();

  // Reset whenever a different application is shown, so a reason typed for one
  // vendor can never be submitted against another.
  useEffect(() => {
    setDecision("approved");
    setApprovalLevel(verification.approvalLevel ?? "");
    setMessage("");
  }, [verification.id, verification.approvalLevel]);

  const needsReason = decision === "rejected" || decision === "needs_more_info";
  // Approve needs a level: approving without one leaves the vendor unable to publish.
  const canSubmit = needsReason ? message.trim().length > 0 : !!approvalLevel;
  const hasDecision = ["approved", "rejected", "needs_more_info"].includes(
    verification.status,
  );

  const submit = () => {
    review.mutate(
      {
        id: verification.id,
        status: decision,
        ...(needsReason
          ? { message: message.trim() }
          : { approvalLevel: approvalLevel as TApprovalLevel }),
      },
      {
        onSuccess: () => {
          toast.success(
            decision === "approved"
              ? "Vendor approved"
              : decision === "rejected"
                ? "Application rejected"
                : "More information requested",
          );
          setMessage("");
        },
        onError: (error) => {
          toast.error(
            constructErrorMessage(
              error as TApiErrorResponseType,
              "Could not submit the review",
            ),
          );
        },
      },
    );
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="space-y-1">
        <h2 className="font-semibold">
          {hasDecision ? "Change decision" : "Decision"}
        </h2>
        <p className="text-xs text-muted-foreground">
          The vendor is notified of the outcome.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg border border-border p-1">
        {DECISIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={decision === option.value}
            onClick={() => setDecision(option.value)}
            className={cn(
              "h-auto rounded-md px-2 py-1.5 text-xs whitespace-normal",
              decision === option.value &&
                "bg-secondary-800 text-white hover:bg-secondary-800 hover:text-white",
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {decision === "approved" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Approval level decides how far this vendor may trade.
          </p>
          <div className="grid gap-2">
            {APPROVAL_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setApprovalLevel(level.value)}
                aria-pressed={approvalLevel === level.value}
                className={cn(
                  "rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50",
                  approvalLevel === level.value &&
                    "border-secondary-800 bg-secondary-50 hover:bg-secondary-50",
                )}
              >
                <span className="block text-sm font-medium">{level.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {level.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {needsReason && (
        <div className="space-y-1.5">
          <label
            htmlFor="review-reason"
            className="text-xs text-muted-foreground"
          >
            {decision === "rejected"
              ? "Why is this being rejected? The vendor is told."
              : "What does the vendor need to supply?"}
          </label>
          <Textarea
            id="review-reason"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="The ID document is too blurry to read."
            rows={4}
          />
        </div>
      )}

      <Button
        type="button"
        className="w-full"
        onClick={submit}
        disabled={!canSubmit || review.isPending}
      >
        {review.isPending ? "Submitting…" : "Submit decision"}
      </Button>
    </div>
  );
};

export default memo(VerificationDecisionPanel);
