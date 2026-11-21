"use client";

import { constructErrorMessage } from "@/api/functions";
import { scanSummaryKey, setDoorsOpen, TScanSummary } from "@/hooks/use-ticket-scan";
import { toast } from "@/lib/toast";
import { useQueryClient } from "@tanstack/react-query";
import { DoorOpen } from "lucide-react";
import React, { memo, useState } from "react";

/** What an organiser can pick (as the API allows), in minutes before the start. */
const CHOICES = [30, 60, 90, 120, 180, 240, 360, 720];
const DEFAULT_MINUTES = 360;

const label = (minutes: number) =>
  minutes < 60 ? `${minutes} minutes before` : `${minutes / 60} hour${minutes === 60 ? "" : "s"} before`;

const timeOf = (at: string, timeZone?: string) =>
  new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(at));

/**
 * When tickets start scanning in: earlier scans are refused as too early. The
 * organiser (or their team with "Manage events") picks it; door staff see it.
 */
const DoorsOpen: React.FC<{ summary: TScanSummary; canChange: boolean }> = ({ summary, canChange }) => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const minutes = summary.doorsOpenMinutes ?? DEFAULT_MINUTES;

  const change = async (next: number) => {
    setSaving(true);
    try {
      await setDoorsOpen(summary.eventId, next === DEFAULT_MINUTES ? null : next);
      await queryClient.invalidateQueries({ queryKey: scanSummaryKey(summary.eventId) });
      toast.success(`Doors now open ${label(next)} the start`);
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't change it."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <DoorOpen className="size-4 text-primary" aria-hidden /> Doors open
      </p>
      {summary.doorsOpenAt && (
        <p className="mt-1 text-lg font-bold text-foreground">{timeOf(summary.doorsOpenAt, summary.timezone)}</p>
      )}
      {canChange ? (
        <label className="mt-2 block text-xs text-muted-foreground">
          <span className="sr-only">When doors open</span>
          <select
            value={minutes}
            disabled={saving}
            onChange={(event) => void change(Number(event.target.value))}
            className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground"
          >
            {CHOICES.map((choice) => (
              <option key={choice} value={choice}>
                {label(choice)} the start{choice === DEFAULT_MINUTES ? " (default)" : ""}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{label(minutes)} the start. Earlier scans are refused.</p>
      )}
    </div>
  );
};

export default memo(DoorsOpen);
