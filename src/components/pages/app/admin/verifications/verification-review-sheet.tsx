"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useReviewVerification } from "@/hooks/use-admin-verifications";
import {
  IVendorVerification,
  TApprovalLevel,
  TVerificationDecision,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import React, { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import StatusPill from "../status-pill";

const DECISIONS: { value: TVerificationDecision; label: string }[] = [
  { value: "approved", label: "Approve" },
  { value: "needs_more_info", label: "Needs more info" },
  { value: "rejected", label: "Reject" },
];

const APPROVAL_LEVELS: { value: TApprovalLevel; label: string; hint: string }[] =
  [
    {
      value: "basic_verified",
      label: "Basic",
      hint: "Free and registration-only events",
    },
    { value: "paid_verified", label: "Paid", hint: "May sell paid tickets" },
    {
      value: "cross_border_verified",
      label: "Cross-border",
      hint: "May sell across countries",
    },
    {
      value: "high_risk_review",
      label: "High risk",
      hint: "Blocked from publishing pending manual review",
    },
  ];

const formatDate = (value?: string | null) =>
  value ? format(new Date(value), "d MMM yyyy, HH:mm") : "—";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm break-words">{children}</span>
  </div>
);

const DocumentLink: React.FC<{ label: string; url?: string | null }> = ({
  label,
  url,
}) =>
  url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-4"
    >
      {label}
      <ExternalLink className="size-3.5" />
    </a>
  ) : (
    <span className="text-sm text-muted-foreground">{label}: not provided</span>
  );

const VerificationReviewSheet: React.FC<{
  verification?: IVendorVerification;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ verification, open, onOpenChange }) => {
  const [decision, setDecision] = useState<TVerificationDecision>("approved");
  const [approvalLevel, setApprovalLevel] = useState<TApprovalLevel | "">("");
  const [message, setMessage] = useState("");
  const review = useReviewVerification();

  // Reset the form whenever a different application is opened, so a reason typed for
  // one vendor can never be submitted against another.
  useEffect(() => {
    setDecision("approved");
    setApprovalLevel("");
    setMessage("");
  }, [verification?.id]);

  if (!verification) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg" />
      </Sheet>
    );
  }

  const needsReason =
    decision === "rejected" || decision === "needs_more_info";
  // Approve needs a level: approving without one leaves the vendor unable to publish.
  const canSubmit = needsReason ? message.trim().length > 0 : !!approvalLevel;

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
          onOpenChange(false);
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

  const isBusiness = verification.vendorType === "business";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="font-mono text-base">
              {verification.reference ?? "Application"}
            </SheetTitle>
            <StatusPill status={verification.status} />
          </div>
          <SheetDescription>
            {verification.vendor?.email ?? "Vendor application"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 px-4 pb-4">
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-4">
            <Field label="Legal name">
              {[verification.legalFirstName, verification.legalLastName]
                .filter(Boolean)
                .join(" ") || "—"}
            </Field>
            <Field label="Vendor type">
              {isBusiness ? "Business" : verification.vendorType ? "Individual" : "—"}
            </Field>
            <Field label="Date of birth">
              {verification.dateOfBirth
                ? format(new Date(verification.dateOfBirth), "d MMM yyyy")
                : "—"}
            </Field>
            <Field label="Country">
              {verification.countryOfResidence ?? "—"}
            </Field>
            <Field label="Phone">{verification.phoneNumber ?? "—"}</Field>
            <Field label="Submitted">
              {formatDate(verification.submittedAt)}
            </Field>
            <div className="col-span-2">
              <Field label="Address">{verification.address ?? "—"}</Field>
            </div>
          </div>

          {isBusiness && (
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-4">
              <Field label="Business name">
                {verification.businessName ?? "—"}
              </Field>
              <Field label="Registration number">
                {verification.businessRegistrationNumber ?? "—"}
              </Field>
              <div className="col-span-2">
                <Field label="Business address">
                  {verification.businessAddress ?? "—"}
                </Field>
              </div>
            </div>
          )}

          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Documents</h3>
            <div className="flex flex-col gap-2">
              <DocumentLink
                label="Identity document"
                url={verification.idDocumentDetails?.url}
              />
              <DocumentLink
                label="Supporting document"
                url={verification.supportingDocumentDetails?.url}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-4">
            <div className="col-span-2">
              <h3 className="text-sm font-semibold">Payout</h3>
            </div>
            <Field label="Account holder">
              {verification.accountHolderName ?? "—"}
            </Field>
            <Field label="Bank">{verification.bankName ?? "—"}</Field>
            <Field label="Account">
              {verification.accountNumberLast4
                ? `•••• ${verification.accountNumberLast4}`
                : "—"}
            </Field>
            <Field label="Currency">
              {verification.payoutCurrency ?? "—"}
            </Field>
          </div>

          {(!!verification.rejectionReason ||
            !!verification.needsMoreInfoMessage) && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">Last decision</p>
              <p className="text-sm">
                {verification.rejectionReason ??
                  verification.needsMoreInfoMessage}
              </p>
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Decision</h3>

            <div className="flex flex-wrap gap-2">
              {DECISIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-pressed={decision === option.value}
                  onClick={() => setDecision(option.value)}
                  className={cn(
                    decision === option.value &&
                      "border-secondary-800 bg-secondary-800 text-white hover:bg-secondary-800 hover:text-white",
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
                <div className="grid gap-2 sm:grid-cols-2">
                  {APPROVAL_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setApprovalLevel(level.value)}
                      aria-pressed={approvalLevel === level.value}
                      className={cn(
                        "rounded-md border border-border p-3 text-left transition",
                        approvalLevel === level.value &&
                          "border-secondary-800 bg-secondary-50",
                      )}
                    >
                      <span className="block text-sm font-medium">
                        {level.label}
                      </span>
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
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>

        <SheetFooter>
          <Button
            type="button"
            onClick={submit}
            disabled={!canSubmit || review.isPending}
          >
            {review.isPending ? "Submitting…" : "Submit decision"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={review.isPending}
          >
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default memo(VerificationReviewSheet);
