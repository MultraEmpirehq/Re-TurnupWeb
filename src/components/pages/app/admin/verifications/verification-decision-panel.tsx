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
import { Check, X } from "lucide-react";
import React, { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import { APPROVAL_LEVELS } from "./verification-utils";

/** Common reasons, to start from (and edit) rather than type each time. */
const REASONS: Record<"rejected" | "needs_more_info", string[]> = {
  needs_more_info: [
    "The ID document is too blurry to read. Please upload a clearer photo.",
    "The name on your ID doesn't match the legal name you gave. Please check both.",
    "The bank account holder's name doesn't match your legal or business name.",
    "Please pick your bank from the list so we can pay you directly.",
    "Please add your business registration number and certificate.",
    "Your ID document has expired. Please upload a current one.",
  ],
  rejected: [
    "We couldn't verify your identity from the documents provided.",
    "The bank account belongs to someone else.",
    "These details are already used by another vendor account.",
    "Applicants must be at least 18.",
    "This business couldn't be found in the business registry.",
  ],
};

const DECISIONS: { value: TVerificationDecision; label: string }[] = [
  { value: "approved", label: "Approve" },
  { value: "needs_more_info", label: "Needs more info" },
  { value: "rejected", label: "Reject" },
];

type TLevelState = "match" | "lower" | "not_applied" | "blocked" | "hold";

/** The level that matches what the vendor applied for. */
const appliedLevel = (v: IVendorVerification): TApprovalLevel =>
  v.plan === "free"
    ? "basic_verified"
    : v.crossBorderCountries?.length
      ? "cross_border_verified"
      : "paid_verified";

const LEVEL_RANK: Record<TApprovalLevel, number> = {
  high_risk_review: 0,
  basic_verified: 1,
  paid_verified: 2,
  cross_border_verified: 3,
};

/** How a level sits against the application: the guard behind each choice. */
const levelState = (
  level: TApprovalLevel,
  v: IVendorVerification,
): { state: TLevelState; note: string } => {
  const missingSell = v.missingForSelling ?? [];
  const missingAbroad = v.missingForCrossBorder ?? [];
  if (level === "high_risk_review") {
    return { state: "hold", note: "Blocks publishing until reviewed again" };
  }
  if (level === "cross_border_verified") {
    if (missingAbroad.length) {
      return {
        state: "blocked",
        note: "Didn't apply to sell outside their country",
      };
    }
    if (missingSell.length) {
      return { state: "blocked", note: `Missing ${missingSell.join(", ")}` };
    }
  }
  if (level === "paid_verified" && missingSell.length) {
    return { state: "blocked", note: `Missing ${missingSell.join(", ")}` };
  }
  const applied = appliedLevel(v);
  if (level === applied)
    return { state: "match", note: "What they applied for" };
  return LEVEL_RANK[level] < LEVEL_RANK[applied]
    ? { state: "lower", note: "Less than they applied for" }
    : { state: "not_applied", note: "More than they applied for" };
};

const STATE_BADGE: Record<TLevelState, string> = {
  match: "Applied for",
  lower: "Lower",
  not_applied: "Not applied for",
  blocked: "Blocked",
  hold: "Hold",
};

const STATE_STYLE: Record<TLevelState, string> = {
  match: "bg-emerald-50 text-emerald-700",
  lower: "bg-secondary-50 text-secondary-700",
  not_applied: "bg-secondary-50 text-secondary-700",
  blocked: "bg-red-50 text-red-700",
  hold: "bg-muted text-muted-foreground",
};

/** What an approval at each level lets the vendor do. */
const ALLOWS: { label: string; from: TApprovalLevel }[] = [
  { label: "Free and register-only events", from: "basic_verified" },
  { label: "Verified tick", from: "basic_verified" },
  { label: "Sell tickets and get paid", from: "paid_verified" },
  { label: "Sell outside their own country", from: "cross_border_verified" },
];

const Applied: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex items-start justify-between gap-3 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium">{value}</span>
  </div>
);

/**
 * The decision, in the order an admin works: what the vendor applied for, the
 * outcome, the level (each marked against the application, and blocked where
 * details are missing or they never asked for it), what that approval allows,
 * and the message they'll get. Approving at a level other than the one they
 * applied for needs a note, so they're told why.
 */
const VerificationDecisionPanel: React.FC<{
  verification: IVendorVerification;
}> = ({ verification }) => {
  const isFreePlan = verification.plan === "free";
  const abroad = verification.crossBorderCountries ?? [];
  const applied = appliedLevel(verification);
  const initialLevel = (): TApprovalLevel | "" => {
    const current = verification.approvalLevel;
    if (current && levelState(current, verification).state !== "blocked") {
      return current;
    }
    return levelState(applied, verification).state === "blocked"
      ? "basic_verified"
      : applied;
  };

  const [decision, setDecision] = useState<TVerificationDecision>("approved");
  const [approvalLevel, setApprovalLevel] = useState<TApprovalLevel | "">(
    initialLevel,
  );
  const [message, setMessage] = useState("");
  const review = useReviewVerification();

  // Reset whenever a different application is shown, so a reason typed for one
  // vendor can never be submitted against another.
  useEffect(() => {
    setDecision("approved");
    setApprovalLevel(initialLevel());
    setMessage("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verification.id, verification.approvalLevel]);

  const needsReason = decision === "rejected" || decision === "needs_more_info";
  const selected = approvalLevel
    ? levelState(approvalLevel, verification)
    : null;
  const isMismatch =
    decision === "approved" &&
    !!selected &&
    (selected.state === "lower" || selected.state === "not_applied");
  const needsMessage = needsReason || isMismatch;
  const canSubmit =
    (decision !== "approved" ||
      (!!approvalLevel && selected?.state !== "blocked")) &&
    (!needsMessage || message.trim().length > 0);
  const hasDecision = ["approved", "rejected", "needs_more_info"].includes(
    verification.status,
  );
  const levelLabel = APPROVAL_LEVELS.find(
    (level) => level.value === approvalLevel,
  )?.label;

  const submit = () => {
    review.mutate(
      {
        id: verification.id,
        status: decision,
        ...(decision === "approved"
          ? {
              approvalLevel: approvalLevel as TApprovalLevel,
              ...(message.trim() ? { message: message.trim() } : {}),
            }
          : { message: message.trim() }),
      },
      {
        onSuccess: () => {
          toast.success(
            decision === "approved"
              ? `Approved at the ${levelLabel} level`
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

  const mismatchCopy =
    selected?.state === "lower"
      ? isFreePlan
        ? ""
        : applied === "cross_border_verified" &&
            approvalLevel === "paid_verified"
          ? "They asked to sell abroad too. At Paid they can only sell in their own country."
          : "They applied to sell tickets. At this level they can only run free events."
      : selected?.state === "not_applied"
        ? "They only applied for free events. This lets them sell tickets and be paid out."
        : "";

  return (
    <div className="space-y-4 rounded-xl border-2 border-secondary-800/80 bg-card p-5">
      <div className="space-y-1">
        <h2 className="font-semibold">
          {hasDecision ? "Change decision" : "Decision"}
        </h2>
        <p className="text-xs text-muted-foreground">
          Check what they asked for, then decide. The vendor is notified.
        </p>
      </div>

      <section className="space-y-2 rounded-lg bg-muted/50 p-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          They applied for
        </p>
        <Applied
          label="Hosting"
          value={isFreePlan ? "Free events only" : "Selling tickets"}
        />
        {!isFreePlan && (
          <>
            <Applied
              label="Account"
              value={
                verification.vendorType === "business"
                  ? "Registered business"
                  : "Individual"
              }
            />
            <Applied
              label="Paid in"
              value={
                verification.payoutCountry
                  ? `${verification.payoutCountry}${verification.payoutCurrency ? ` · ${verification.payoutCurrency}` : ""}`
                  : "Not given"
              }
            />
          </>
        )}
        <Applied
          label="Outside their country"
          value={
            abroad.length ? (
              <span className="text-secondary-800">
                Yes: {abroad.join(", ")}
              </span>
            ) : (
              "No"
            )
          }
        />
      </section>

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
              "h-auto rounded-md px-2 py-2 text-xs whitespace-normal",
              decision === option.value &&
                "bg-secondary-800 text-white hover:bg-secondary-800 hover:text-white",
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {decision === "approved" && (
        <section className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Approval level
          </p>
          <div className="grid gap-1.5">
            {APPROVAL_LEVELS.map((level) => {
              const { state, note } = levelState(level.value, verification);
              const isSelected = approvalLevel === level.value;
              return (
                <button
                  key={level.value}
                  type="button"
                  disabled={state === "blocked"}
                  onClick={() => setApprovalLevel(level.value)}
                  aria-pressed={isSelected}
                  className={cn(
                    "block w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-transparent",
                    isSelected &&
                      "border-secondary-800 bg-secondary-50 ring-1 ring-secondary-800 hover:bg-secondary-50",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{level.label}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        STATE_STYLE[state],
                      )}
                    >
                      {STATE_BADGE[state]}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {level.hint}
                  </span>
                  {state !== "match" && (
                    <span
                      className={cn(
                        "mt-1 block text-xs",
                        state === "blocked"
                          ? "text-red-700"
                          : "text-secondary-700",
                      )}
                    >
                      {note}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!!mismatchCopy && (
            <p className="rounded-lg border border-secondary-200 bg-secondary-50 p-3 text-xs leading-5 text-secondary-900">
              {mismatchCopy} Add a note below so they know why.
            </p>
          )}

          {approvalLevel && approvalLevel !== "high_risk_review" && (
            <ul className="space-y-1 rounded-lg border border-border p-3 text-xs">
              <li className="pb-1 font-semibold text-muted-foreground">
                This approval allows
              </li>
              {ALLOWS.map((item) => {
                const allowed =
                  LEVEL_RANK[approvalLevel] >= LEVEL_RANK[item.from];
                return (
                  <li
                    key={item.label}
                    className={cn(
                      "flex items-center gap-2",
                      allowed ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {allowed ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <X className="size-3.5 text-muted-foreground" />
                    )}
                    {item.label}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <div className="space-y-1.5">
        {needsReason && (
          <select
            aria-label="Common reasons"
            value=""
            onChange={(event) => {
              const reason = event.target.value;
              if (!reason) return;
              setMessage((current) =>
                current.includes(reason)
                  ? current
                  : [current.trim(), reason].filter(Boolean).join("\n"),
              );
            }}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs text-muted-foreground"
          >
            <option value="">Add a common reason…</option>
            {REASONS[decision as "rejected" | "needs_more_info"].map(
              (reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ),
            )}
          </select>
        )}
        <label
          htmlFor="review-reason"
          className="text-xs text-muted-foreground"
        >
          {decision === "rejected"
            ? "Why it's rejected (required, the vendor is told)"
            : decision === "needs_more_info"
              ? "What they need to supply (required)"
              : isMismatch
                ? "Note to the vendor (required for this level)"
                : "Note to the vendor (optional)"}
        </label>
        <Textarea
          id="review-reason"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={
            decision === "approved"
              ? "e.g. Welcome aboard. You can start selling tickets."
              : "Pick a reason above or write your own."
          }
          rows={3}
        />
      </div>

      <Button
        type="button"
        className="w-full"
        onClick={submit}
        disabled={!canSubmit || review.isPending}
      >
        {review.isPending
          ? "Submitting…"
          : decision === "approved"
            ? levelLabel
              ? `Approve at ${levelLabel} level`
              : "Choose a level"
            : decision === "rejected"
              ? "Reject application"
              : "Ask for more information"}
      </Button>
    </div>
  );
};

export default memo(VerificationDecisionPanel);
