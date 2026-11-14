"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clock3,
  FilePen,
  Send,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import React, { memo, useMemo, useState } from "react";
import type { IVerificationStage, VerificationStatus } from "./types";

type TMilestone = {
  label: string;
  state: "done" | "current" | "todo" | "warn" | "fail";
  at?: string;
  icon: LucideIcon;
};

const when = (at?: string) => (at ? format(new Date(at), "d MMM yyyy") : undefined);
const latest = (stages: IVerificationStage[], status: VerificationStatus) =>
  [...stages].reverse().find((stage) => stage.status === status);

/** One line of history, in the vendor's words. */
const describe = (stage: IVerificationStage, index: number, all: IVerificationStage[]) => {
  switch (stage.status) {
    case "in_progress":
      return index === 0
        ? "You started your application"
        : all[index - 1]?.status === "submitted"
          ? "You took it back to make changes"
          : "Back with you to edit";
    case "submitted":
      return stage.byTeam
        ? "Our team reopened it for another look"
        : "You sent it for review";
    case "approved":
      return stage.byTeam ? "Approved by our team" : "Approved to host free events";
    case "rejected":
      return "Not approved";
    case "needs_more_info":
      return "We asked you for a bit more";
    default:
      return "Updated";
  }
};

/**
 * Where an application is, at a glance: started, sent, in review, decided,
 * with dates, and the full history underneath with anything the team said.
 */
const VerificationStages = ({
  stages: recorded,
  status,
}: {
  stages: IVerificationStage[];
  status: VerificationStatus;
}) => {
  const [showHistory, setShowHistory] = useState(false);

  // A save or submit on this page changes the status before the history is
  // fetched again, so the latest step is added here until then.
  const stages = useMemo(() => {
    const last = recorded[recorded.length - 1];
    if (status === "not_started" || !last || last.status === status) return recorded;
    return [
      ...recorded,
      { status, note: null, byTeam: false, at: new Date().toISOString() },
    ];
  }, [recorded, status]);

  const milestones = useMemo<TMilestone[]>(() => {
    const started = stages[0];
    const sent = latest(stages, "submitted");
    const decided = status === "approved" || status === "rejected" || status === "needs_more_info";
    const sentDone = !!sent && status !== "in_progress";
    const decision = decided ? latest(stages, status) : undefined;
    return [
      { label: "Started", state: started ? "done" : "current", at: started?.at, icon: FilePen },
      {
        label: "Sent for review",
        state: sentDone ? "done" : started ? "current" : "todo",
        at: sentDone ? sent?.at : undefined,
        icon: Send,
      },
      {
        label: "In review",
        state: status === "submitted" ? "current" : decided ? "done" : "todo",
        icon: Clock3,
      },
      {
        label:
          status === "approved"
            ? "Approved"
            : status === "rejected"
              ? "Not approved"
              : status === "needs_more_info"
                ? "More info needed"
                : "Decision",
        state:
          status === "approved"
            ? "done"
            : status === "rejected"
              ? "fail"
              : status === "needs_more_info"
                ? "warn"
                : "todo",
        at: decision?.at,
        icon:
          status === "rejected"
            ? XCircle
            : status === "needs_more_info"
              ? AlertTriangle
              : ShieldCheck,
      },
    ];
  }, [stages, status]);

  if (!stages.length) return null;

  return (
    <section aria-labelledby="stages-title" className="space-y-4">
      <h2 id="stages-title" className="sr-only">
        Where your application is
      </h2>
      <ol className="grid grid-cols-4 gap-2">
        {milestones.map((milestone, index) => {
          const Icon = milestone.state === "done" ? Check : milestone.icon;
          return (
            <li key={milestone.label} className="relative flex flex-col items-center gap-2 text-center">
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-5 right-1/2 h-0.5 w-full -translate-y-1/2",
                    milestone.state === "todo" ? "bg-secondary-100" : "bg-primary",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex size-10 items-center justify-center rounded-full ring-4 ring-white",
                  milestone.state === "done" && "bg-primary text-white",
                  milestone.state === "current" && "bg-primary-50 text-primary ring-primary-100",
                  milestone.state === "todo" && "bg-secondary-50 text-secondary-400",
                  milestone.state === "warn" && "bg-warning-soft text-warning",
                  milestone.state === "fail" && "bg-danger-soft text-danger",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="space-y-0.5">
                <span
                  className={cn(
                    "block text-xs font-semibold sm:text-sm",
                    milestone.state === "todo" ? "text-secondary-400" : "text-secondary-950",
                  )}
                >
                  {milestone.label}
                  <span className="sr-only">
                    {milestone.state === "current" ? " (now)" : milestone.state === "todo" ? " (to come)" : ""}
                  </span>
                </span>
                {milestone.at && (
                  <span className="block text-2xs text-secondary-500 sm:text-xs">{when(milestone.at)}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border border-secondary-100">
        <button
          type="button"
          aria-expanded={showHistory}
          onClick={() => setShowHistory((open) => !open)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-secondary-950"
        >
          Full history ({stages.length})
          <ChevronDown
            className={cn("size-4 transition-transform", showHistory && "rotate-180")}
            aria-hidden
          />
        </button>
        {showHistory && (
          <ol className="space-y-4 border-t border-secondary-100 px-4 py-4">
            {[...stages].reverse().map((stage, reversedIndex) => {
              const index = stages.length - 1 - reversedIndex;
              return (
                <li key={`${stage.at}-${index}`} className="flex gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      stage.byTeam ? "bg-primary" : "bg-secondary-300",
                    )}
                  />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-secondary-950">
                      {describe(stage, index, stages)}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {format(new Date(stage.at), "d MMM yyyy, h:mm a")}
                    </p>
                    {stage.note && (
                      <p className="mt-1.5 rounded-xl bg-secondary-50 px-3 py-2 whitespace-pre-line text-secondary-800">
                        {stage.note}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
};

export default memo(VerificationStages);
