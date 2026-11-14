import { cn } from "@/lib/utils";
import React from "react";

export type TTone = "success" | "warning" | "danger" | "info" | "neutral";

/** Text, fill and border for each status tone; light and dark come from the tokens. */
export const TONE_CLASSES: Record<TTone, { text: string; soft: string; line: string }> = {
  success: { text: "text-success", soft: "bg-success-soft", line: "border-success-line" },
  warning: { text: "text-warning", soft: "bg-warning-soft", line: "border-warning-line" },
  danger: { text: "text-danger", soft: "bg-danger-soft", line: "border-danger-line" },
  info: { text: "text-info", soft: "bg-info-soft", line: "border-info-line" },
  neutral: { text: "text-muted-foreground", soft: "bg-muted", line: "border-border" },
};

/**
 * A small status label: "Payouts ready", "Restricted", "Draft". The one pill
 * for statuses across the site, so the same state always looks the same.
 */
const StatusBadge = ({
  tone = "neutral",
  icon: Icon,
  className,
  children,
}: {
  tone?: TTone;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  children: React.ReactNode;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs leading-4 font-semibold whitespace-nowrap",
      TONE_CLASSES[tone].soft,
      TONE_CLASSES[tone].text,
      className,
    )}
  >
    {Icon && <Icon className="size-3" aria-hidden />}
    {children}
  </span>
);

export default StatusBadge;
