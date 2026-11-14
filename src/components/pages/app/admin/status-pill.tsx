import { TVerificationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import React, { memo } from "react";

const TONE: Record<TVerificationStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-secondary-50 text-secondary-700",
  submitted: "bg-info-soft text-info",
  approved: "bg-success-soft text-success",
  rejected: "bg-danger-soft text-danger",
  needs_more_info: "bg-secondary-50 text-secondary-700",
};

const LABEL: Record<TVerificationStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
  needs_more_info: "Needs more info",
};

const StatusPill: React.FC<{
  status: TVerificationStatus;
  className?: string;
}> = ({ status, className }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
      TONE[status] ?? TONE.not_started,
      className,
    )}
  >
    {LABEL[status] ?? status}
  </span>
);

export default memo(StatusPill);
