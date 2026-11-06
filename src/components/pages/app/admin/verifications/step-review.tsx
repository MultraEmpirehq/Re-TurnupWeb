"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReviewVerification } from "@/hooks/use-admin-verifications";
import { IVendorVerification, TVerificationStepKey } from "@/lib/types";
import { Check, MessageSquareWarning } from "lucide-react";
import React, { useState } from "react";
import { toast } from "@/lib/toast";
import StatusPill from "../status-pill";
import { formatDate } from "./verification-utils";

const STEPS: { key: TVerificationStepKey; label: string }[] = [
  { key: "vendorType", label: "Vendor type" },
  { key: "identity", label: "Identity" },
  { key: "business", label: "Business" },
  { key: "payout", label: "Payout" },
  { key: "crossBorder", label: "Cross-border" },
];

/**
 * Each step with its own state, and (once submitted) a decision per step: accept
 * the ones that are fine and ask about just the one that isn't, so the vendor
 * fixes only that.
 */
const StepReview: React.FC<{ verification: IVendorVerification }> = ({
  verification,
}) => {
  const review = useReviewVerification();
  const [asking, setAsking] = useState<TVerificationStepKey | null>(null);
  const [message, setMessage] = useState("");
  const canDecide = !["not_started", "in_progress"].includes(
    verification.status,
  );

  const decide = (
    stepKey: TVerificationStepKey,
    status: "approved" | "needs_more_info",
  ) =>
    review.mutate(
      {
        id: verification.id,
        stepKey,
        status,
        ...(status === "needs_more_info" ? { message: message.trim() } : {}),
      },
      {
        onSuccess: () => {
          toast.success(
            status === "approved" ? "Step accepted" : "Vendor asked for more",
          );
          setAsking(null);
          setMessage("");
        },
        onError: (error) =>
          toast.error(
            constructErrorMessage(
              error as TApiErrorResponseType,
              "Couldn't save that step",
            ),
          ),
      },
    );

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">Steps</h2>
      <ul className="space-y-3">
        {STEPS.map((step) => {
          const status = verification.stepStatuses?.[step.key] ?? "not_started";
          return (
            <li key={step.key} className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>{step.label}</span>
                <div className="flex items-center gap-1.5">
                  <StatusPill status={status} />
                  {canDecide && status !== "not_started" && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        aria-label={`Accept ${step.label}`}
                        title="Accept this step"
                        disabled={review.isPending || status === "approved"}
                        onClick={() => decide(step.key, "approved")}
                      >
                        <Check className="size-4 text-emerald-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        aria-label={`Ask for more on ${step.label}`}
                        title="Ask for more on this step"
                        disabled={review.isPending}
                        onClick={() => {
                          setAsking(asking === step.key ? null : step.key);
                          setMessage("");
                        }}
                      >
                        <MessageSquareWarning className="size-4 text-secondary-600" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {asking === step.key && (
                <div className="space-y-2 rounded-lg bg-muted/60 p-3">
                  <Textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={`What do they need to fix in ${step.label.toLowerCase()}?`}
                    className="min-h-20 bg-background text-sm"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAsking(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={!message.trim()}
                      loading={review.isPending}
                      onClick={() => decide(step.key, "needs_more_info")}
                    >
                      Send to vendor
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {verification.reviewedAt && (
        <p className="border-t border-border pt-3 text-xs text-muted-foreground">
          Last reviewed {formatDate(verification.reviewedAt, true)}
        </p>
      )}
    </section>
  );
};

export default StepReview;
