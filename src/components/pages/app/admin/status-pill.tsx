import { TVerificationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import React, { memo } from "react";

const TONE: Record<TVerificationStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-50 text-amber-700",
  submitted: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  needs_more_info: "bg-orange-50 text-orange-700",
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
