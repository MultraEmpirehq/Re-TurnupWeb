"use client";

import { IVerificationReview } from "@/hooks/use-admin-verifications";
import { cn } from "@/lib/utils";
import React from "react";
import { formatDate } from "./verification-utils";

const STEP_LABELS: Record<string, string> = {
  vendorType: "Vendor type",
  identity: "Identity",
  business: "Business",
  payout: "Payout",
  crossBorder: "Cross-border",
  review: "Review",
};

const describe = (entry: IVerificationReview["history"][number]) => {
  const step = entry.step ? `${STEP_LABELS[entry.step] ?? entry.step}: ` : "";
  switch (entry.decision) {
    case "started":
      return "Application started";
    case "submitted":
      return "Submitted for review";
    case "approved":
      return `${step}Approved`;
    case "rejected":
      return `${step}Rejected`;
    case "needs_more_info":
      return `${step}More information requested`;
    case "payout_bank_code_set":
      return "Bank set for payouts";
    case "vendor_verification.payout_revealed":
      return "Full bank details viewed";
    default:
      return `${step}${entry.decision.replace(/[._]/g, " ")}`;
  }
};

const tone = (decision: string) =>
  decision === "approved"
    ? "bg-emerald-500"
    : decision === "rejected"
      ? "bg-red-500"
      : decision === "needs_more_info"
        ? "bg-secondary-500"
        : "bg-secondary-300";

/** The application's life, newest first: who decided what, and what they said. */
const VerificationHistory: React.FC<{
  history?: IVerificationReview["history"];
}> = ({ history }) => {
  if (!history?.length) return null;
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">History</h2>
      <ol className="space-y-3">
        {history.map((entry, index) => (
          <li key={`${entry.at}-${index}`} className="flex gap-3">
            <span
              aria-hidden
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                tone(entry.decision),
              )}
            />
            <div className="min-w-0 text-sm">
              <p className="font-medium">{describe(entry)}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(entry.at, true)}
                {entry.actor ? ` · ${entry.actor}` : ""}
              </p>
              {entry.message && (
                <p className="mt-1 rounded-md bg-muted px-2.5 py-1.5 text-xs break-words">
                  {entry.message}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default VerificationHistory;
