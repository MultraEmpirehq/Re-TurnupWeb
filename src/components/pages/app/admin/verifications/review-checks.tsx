"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  IReviewCheck,
  IVerificationReview,
  TReviewCheckStatus,
} from "@/hooks/use-admin-verifications";
import { cn } from "@/lib/utils";
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Info,
  LucideIcon,
} from "lucide-react";
import React from "react";

const STATUS: Record<
  TReviewCheckStatus,
  { icon: LucideIcon; className: string; label: string }
> = {
  fail: { icon: CircleX, className: "text-red-600", label: "Problem" },
  warn: { icon: CircleAlert, className: "text-amber-600", label: "Check" },
  pass: { icon: CircleCheck, className: "text-emerald-600", label: "Passed" },
  info: { icon: Info, className: "text-muted-foreground", label: "Note" },
};

const GROUPS: { key: IReviewCheck["group"]; label: string }[] = [
  { key: "identity", label: "Identity" },
  { key: "business", label: "Business" },
  { key: "payout", label: "Payout" },
  { key: "duplicates", label: "Duplicates" },
  { key: "account", label: "Account" },
];

const ORDER: TReviewCheckStatus[] = ["fail", "warn", "info", "pass"];

/**
 * What the API checked on the application, problems first, so the admin starts
 * with what needs a closer look rather than reading every field.
 */
const ReviewChecks: React.FC<{
  review?: IVerificationReview;
  isLoading: boolean;
}> = ({ review, isLoading }) => {
  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }
  if (!review) return null;

  const { summary } = review;
  const headline =
    summary.fail > 0
      ? `${summary.fail} problem${summary.fail === 1 ? "" : "s"} to look at`
      : summary.warn > 0
        ? `${summary.warn} thing${summary.warn === 1 ? "" : "s"} to check`
        : "Everything we can check passed";

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Checks</h2>
          <p
            className={cn(
              "text-sm",
              summary.fail
                ? "text-red-700"
                : summary.warn
                  ? "text-amber-700"
                  : "text-emerald-700",
            )}
          >
            {headline}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          {(["fail", "warn", "pass"] as const).map((status) => {
            const { icon: Icon, className, label } = STATUS[status];
            return (
              <span
                key={status}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"
              >
                <Icon className={cn("size-3.5", className)} aria-hidden />
                {summary[status]} {label.toLowerCase()}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map((group) => {
          const checks = review.checks
            .filter((check) => check.group === group.key)
            .sort(
              (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status),
            );
          if (!checks.length) return null;
          return (
            <div key={group.key} className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group.label}
              </p>
              <ul className="space-y-2">
                {checks.map((check) => {
                  const { icon: Icon, className, label } = STATUS[check.status];
                  return (
                    <li key={check.key} className="flex gap-2.5">
                      <Icon
                        className={cn("mt-0.5 size-4 shrink-0", className)}
                        aria-label={label}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{check.label}</p>
                        <p className="text-xs break-words text-muted-foreground">
                          {check.detail}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ReviewChecks;
