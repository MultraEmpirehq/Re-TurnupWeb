"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAddEventScanner,
  useEventScanners,
  useRevokeEventScanner,
} from "@/hooks/use-vendor-tickets";
import { formatEventTime } from "@/lib/event-time";
import { IEventDetailsType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, ScanLine, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo, useState } from "react";
import { toast } from "sonner";

const statusOf = (scanner: { status: string; expiresAt: string }) => {
  if (scanner.status === "revoked") return "Removed";
  if (new Date(scanner.expiresAt).getTime() < Date.now()) return "Expired";
  return scanner.status === "invited" ? "Invited" : "Active";
};

/**
 * Door scanners for one event: people who can scan that event only, until it's
 * over. Standing door staff are better added once in Team with "Scan tickets".
 */
const DoorScannersTab: React.FC<{ events: IEventDetailsType[] }> = ({ events }) => {
  const upcoming = useMemo(
    () =>
      [...events]
        .filter((event) => new Date(event.endDate ?? event.date).getTime() > Date.now() - 86_400_000)
        .sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    [events],
  );
  const [eventId, setEventId] = useState("");
  const selectedId = eventId || upcoming[0]?.id || "";
  const selected = events.find((event) => event.id === selectedId);
  const { data: scanners = [], isPending } = useEventScanners(selectedId);
  const add = useAddEventScanner(selectedId);
  const revoke = useRevokeEventScanner(selectedId);
  const [email, setEmail] = useState("");

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!address || !selectedId) return;
    try {
      await add.mutateAsync(address);
      setEmail("");
      toast.success(`${address} can scan ${selected?.name ?? "this event"}`);
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't add that scanner."));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 space-y-5 rounded-[1.5rem] border border-secondary-100 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="space-y-1.5">
          <label htmlFor="scanner-event" className="text-sm font-semibold text-secondary-950">
            Event
          </label>
          <select
            id="scanner-event"
            value={selectedId}
            onChange={(event) => setEventId(event.target.value)}
            className="h-11 w-full rounded-xl border border-secondary-200 bg-white px-3 text-sm"
          >
            {upcoming.length === 0 && <option value="">No upcoming events</option>}
            {upcoming.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} · {formatEventTime(event.date, event.timezone, { withWeekday: false })}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={invite} className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="door.staff@example.com"
            aria-label="Scanner email"
            disabled={!selectedId}
            className="h-11 rounded-xl"
          />
          <Button type="submit" className="h-11 rounded-xl" disabled={!selectedId || add.isPending}>
            {add.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Give scanner access
          </Button>
        </form>

        {isPending && selectedId ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-secondary-400" aria-hidden />
          </div>
        ) : scanners.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-secondary-200 px-4 py-8 text-center text-sm text-secondary-500">
            No door scanners for this event yet.
          </p>
        ) : (
          <ul className="divide-y divide-secondary-50 rounded-2xl border border-secondary-100">
            {scanners.map((scanner) => {
              const label = statusOf(scanner);
              const live = label === "Active" || label === "Invited";
              return (
                <li key={scanner.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-secondary-950">
                      {scanner.email}
                    </span>
                    <span className="block text-xs text-secondary-500">
                      {live
                        ? `Until ${new Date(scanner.expiresAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`
                        : label}
                      {label === "Invited" && " · hasn't signed up yet"}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      live ? "bg-emerald-50 text-emerald-700" : "bg-secondary-50 text-secondary-500",
                    )}
                  >
                    {label}
                  </span>
                  {live && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${scanner.email}`}
                      disabled={revoke.isPending}
                      onClick={async () => {
                        try {
                          await revoke.mutateAsync(scanner.id);
                          toast.success(`${scanner.email} can no longer scan`);
                        } catch (error) {
                          toast.error(
                            constructErrorMessage(error as TApiErrorResponseType, "Couldn't remove them."),
                          );
                        }
                      }}
                      className="text-secondary-400 hover:text-red-600"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside className="space-y-4 text-sm">
        <div className="rounded-[1.5rem] border border-secondary-100 bg-white p-5">
          <ShieldCheck className="size-5 text-primary" aria-hidden />
          <p className="mt-2 font-semibold text-secondary-950">One event, then it expires</p>
          <p className="mt-1 leading-6 text-secondary-500">
            Door scanners can only check tickets in for this event, from their own
            account, and lose access when it ends.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-secondary-100 bg-white p-5">
          <UsersRound className="size-5 text-primary" aria-hidden />
          <p className="mt-2 font-semibold text-secondary-950">Same crew every time?</p>
          <p className="mt-1 leading-6 text-secondary-500">
            Add them once in Team with &quot;Scan tickets&quot; and they can scan all
            your events.
          </p>
          <Link href="/app/team" className="mt-3 inline-block font-semibold text-secondary-800 hover:underline">
            Open Team →
          </Link>
        </div>
        <Link
          href={selectedId ? `/app/scan?event=${selectedId}` : "/app/scan"}
          className="flex items-center justify-center gap-2 rounded-[1.5rem] bg-secondary-900 px-5 py-4 font-semibold text-white hover:bg-secondary-800"
        >
          <ScanLine className="size-5" aria-hidden />
          Open the scanner
        </Link>
      </aside>
    </div>
  );
};

export default memo(DoorScannersTab);
