"use client";

import ScanProgress from "@/components/scanning/scan-progress";
import TicketScanner from "@/components/scanning/ticket-scanner";
import { useEvents } from "@/hooks/use-event";
import {
  readmitEventTicket,
  scanEventTicket,
  scanSummaryKey,
  useScanEvents,
  useScanSummary,
} from "@/hooks/use-ticket-scan";
import { formatEventDateRange, formatEventTime } from "@/lib/event-time";
import { IEventDetailsType } from "@/lib/types";
import { useActingVendor } from "@/stores/workspace-store";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import React, { memo, useCallback, useMemo, useState } from "react";

const HOUR = 60 * 60 * 1000;

/** Over a while ago: a day's grace after the end, for late scans and re-entries. */
const endOf = (event: IEventDetailsType) =>
  new Date(event.endDate ?? event.date).getTime() + 24 * HOUR;

const whenOf = (event: IEventDetailsType) =>
  event.days?.length && event.endDate
    ? formatEventDateRange(event.date, event.endDate, event.timezone)
    : formatEventTime(event.date, event.timezone);

/**
 * The door: pick one of the organiser's events (today's comes first), then scan.
 * Owners and team members with "Scan tickets" use it, and so do door staff an
 * organiser added to a single event; the api checks every scan.
 */
const VendorScanPage = () => {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { vendorId, isTeamMember } = useActingVendor();
  const { data, isPending } = useEvents(
    { limit: 50, userId: vendorId ?? undefined },
    { enabled: !!vendorId },
  );
  // Door staff: events they were given access to on their own account. Not
  // while working in a team, whose scans go out as that organiser.
  const { data: scanEvents } = useScanEvents(!isTeamMember);
  const doorEvents = useMemo(
    () =>
      (scanEvents ?? [])
        .filter((event) => event.via === "door")
        .map(
          (event) =>
            ({
              id: event.id,
              name: event.name,
              date: event.date,
              endDate: event.endDate ?? undefined,
              timezone: event.timezone ?? undefined,
              days: event.days > 1 ? Array.from({ length: event.days }) : undefined,
            }) as unknown as IEventDetailsType,
        ),
    [scanEvents],
  );

  const events = useMemo(() => {
    const now = Date.now();
    const own = data?.pages?.flatMap((page) => page?.data || []) ?? [];
    const seen = new Set(own.map((event: IEventDetailsType) => event.id));
    return [...own, ...doorEvents.filter((event) => !seen.has(event.id))]
      .filter(
        (event: IEventDetailsType) =>
          (!event.status || event.status === "published") && endOf(event) >= now,
      )
      .sort(
        (a: IEventDetailsType, b: IEventDetailsType) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) as IEventDetailsType[];
  }, [data, doorEvents]);

  const [chosenEventId, setChosenEventId] = useState(searchParams.get("event") ?? "");
  // A linked event that isn't one of the scannable ones (a draft, one long over)
  // falls back to the first that is, so the picker and the counts agree.
  const eventId =
    (events.some((event) => event.id === chosenEventId) && chosenEventId) ||
    events[0]?.id ||
    "";
  const { data: summary } = useScanSummary(eventId || undefined);

  const [chosenDayId, setChosenDayId] = useState<string>("");
  const dayId = summary?.days.length
    ? summary.days.some((day) => day.id === chosenDayId)
      ? chosenDayId
      : (summary.todayDayId ?? summary.days[0]?.id)
    : undefined;

  const onScan = useCallback(
    (code: string, typed: boolean) => scanEventTicket(eventId, code, dayId, typed),
    [eventId, dayId],
  );
  const onReadmit = useCallback(
    (code: string, reason: string) => readmitEventTicket(eventId, code, reason, dayId),
    [eventId, dayId],
  );
  const onScanned = useCallback(
    () => queryClient.invalidateQueries({ queryKey: scanSummaryKey(eventId) }),
    [eventId, queryClient],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div className="space-y-2">
        <span className="text-[0.75rem] font-bold tracking-[0.2em] text-secondary-400 uppercase">
          Door
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-secondary-950">Scan tickets</h1>
        <p className="max-w-2xl text-secondary-500">
          Point the camera at a ticket&apos;s QR code. Each ticket gets in once,
          or once a day for multi-day events.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 lg:order-1">
          <TicketScanner
            onScan={onScan}
            onReadmit={onReadmit}
            onScanned={onScanned}
            disabled={!eventId}
            disabledMessage={
              isPending ? "Loading your events…" : "There's no upcoming event to scan for."
            }
          />
        </div>

        <aside className="order-1 space-y-4 lg:order-2">
          <div className="space-y-1.5">
            <label htmlFor="scan-event" className="text-sm font-semibold">
              Event
            </label>
            <select
              id="scan-event"
              value={eventId}
              onChange={(event) => {
                setChosenEventId(event.target.value);
                setChosenDayId("");
              }}
              disabled={!events.length}
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-medium"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} · {whenOf(event)}
                </option>
              ))}
            </select>
          </div>
          {summary && (
            <ScanProgress summary={summary} dayId={dayId} onDayChange={setChosenDayId} />
          )}
        </aside>
      </div>
    </div>
  );
};

export default memo(VendorScanPage);
