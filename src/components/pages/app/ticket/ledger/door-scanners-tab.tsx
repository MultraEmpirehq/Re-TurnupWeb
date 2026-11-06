"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IDoorTeamMember,
  useAddDoorStaff,
  useDoorTeam,
  useEventCheckIns,
  usePeopleSearch,
  useRevokeEventScanner,
} from "@/hooks/use-vendor-tickets";
import { formatEventTime } from "@/lib/event-time";
import { IEventDetailsType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, RotateCcw, ScanLine } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/lib/toast";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initials = (name: string) =>
  name
    .replace(/^@/, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const KIND = {
  event: { label: "This event", className: "bg-secondary-50 text-secondary-700" },
  team: { label: "Team", className: "bg-muted text-muted-foreground" },
  owner: { label: "You", className: "bg-muted text-muted-foreground" },
};

const Status = ({ member }: { member: IDoorTeamMember }) => {
  if (member.status === "expired") {
    return <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Ended</span>;
  }
  if (member.status === "invited") {
    return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Invite sent</span>;
  }
  if (member.scanningNow) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Scanning now
      </span>
    );
  }
  return <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Ready</span>;
};

/**
 * One box for adding door staff: Turnupz members by name or @username (picked
 * from suggestions), or anyone by email, who's invited.
 */
const AddDoorStaff = ({ eventId, eventName }: { eventId: string; eventName?: string }) => {
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const add = useAddDoorStaff(eventId);
  const people = usePeopleSearch(query);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(value.trim()), 250);
    return () => clearTimeout(timer);
  }, [value]);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const give = async (who: { username?: string; email?: string }, label: string) => {
    try {
      await add.mutateAsync(who);
      setValue("");
      setOpen(false);
      toast.success(
        who.username
          ? `${label} can scan ${eventName ?? "this event"}. We've let them know.`
          : `Invite sent to ${label}`,
      );
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't give access."));
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const typed = value.trim();
    if (!typed) return;
    // Several emails at once, separated by commas.
    const emails = typed.split(/[,;\s]+/).filter(Boolean);
    if (emails.length && emails.every((item) => EMAIL.test(item))) {
      for (const email of emails) await give({ email: email.toLowerCase() }, email);
      return;
    }
    const username = typed.replace(/^@/, "");
    if (/^[a-z0-9_.]{2,40}$/i.test(username)) {
      await give({ username }, `@${username}`);
      return;
    }
    toast.error("Type a @username or an email address.");
  };

  const results = people.data ?? [];
  return (
    <div className="rounded-2xl bg-secondary-50/70 p-4">
      <p className="text-sm font-semibold text-secondary-950">Add door staff for this event</p>
      <form onSubmit={submit} className="mt-2 flex flex-col gap-2 sm:flex-row">
        <div ref={boxRef} className="relative flex-1">
          <input
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="@username, name or email"
            aria-label="Add door staff by username or email"
            autoComplete="off"
            className="h-11 w-full rounded-full border border-secondary-100 bg-white px-4 text-sm outline-none focus:border-secondary-300"
          />
          {open && query.replace(/^@/, "").length >= 2 && !value.includes("@", 1) && (
            <ul className="absolute top-full right-0 left-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-secondary-100 bg-white p-1 shadow-lg">
              {people.isFetching && !results.length ? (
                <li className="px-3 py-2.5 text-sm text-muted-foreground">Searching…</li>
              ) : !results.length ? (
                <li className="px-3 py-2.5 text-sm text-muted-foreground">
                  No one on Turnupz matches. Type their email to invite them.
                </li>
              ) : (
                results.map((person) => (
                  <li key={person.id}>
                    <button
                      type="button"
                      disabled={!person.username || add.isPending}
                      onClick={() => person.username && void give({ username: person.username }, person.name)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-secondary-50 disabled:opacity-50"
                    >
                      {person.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={person.image} alt="" className="size-8 rounded-full object-cover" />
                      ) : (
                        <span className="grid size-8 place-items-center rounded-full bg-secondary-50 text-xs font-bold text-secondary-700">
                          {initials(person.name)}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-secondary-950">{person.name}</span>
                        {person.username && (
                          <span className="block truncate text-xs text-muted-foreground">@{person.username}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <Button type="submit" className="h-11 rounded-full px-5" loading={add.isPending}>
          Give access
        </Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        They scan from their own Turnupz account, for this event only, and get a notification. Access
        ends when the event does. Several emails can go in at once, separated by commas.
      </p>
    </div>
  );
};

/**
 * The door for one event: who can check people in (people added for it, and
 * the organiser and team members who may scan), how many each has scanned,
 * and the latest check-ins.
 */
const DoorScannersTab: React.FC<{ events: IEventDetailsType[] }> = ({ events }) => {
  const now = Date.now();
  const upcoming = useMemo(
    () =>
      [...events]
        .filter((event) => new Date(event.endDate ?? event.date).getTime() > now - 86_400_000)
        .sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    [events, now],
  );
  const past = useMemo(
    () => events.filter((event) => !upcoming.includes(event)).slice(0, 20),
    [events, upcoming],
  );
  const [eventId, setEventId] = useState("");
  const selectedId = eventId || upcoming[0]?.id || "";
  const selected = events.find((event) => event.id === selectedId);
  const team = useDoorTeam(selectedId);
  const feed = useEventCheckIns(selectedId);
  const revoke = useRevokeEventScanner(selectedId);
  const queryClient = useQueryClient();
  const [removing, setRemoving] = useState<IDoorTeamMember | null>(null);

  const remove = async () => {
    if (!removing?.accessId) return;
    try {
      await revoke.mutateAsync(removing.accessId);
      await queryClient.invalidateQueries({ queryKey: ["door-team", selectedId] });
      toast.success(`${removing.name ?? removing.email ?? "They"} can no longer scan this event`);
      setRemoving(null);
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't remove them."));
    }
  };

  if (!events.length) {
    return (
      <p className="rounded-2xl border border-dashed border-secondary-200 px-6 py-12 text-center text-sm text-muted-foreground">
        Create an event first, then add the people who&apos;ll check tickets at its door.
      </p>
    );
  }

  const isLive = (event: IEventDetailsType) => {
    const starts = new Date(event.date).getTime();
    return now >= starts - 2 * 3_600_000 && now <= new Date(event.endDate ?? starts + 12 * 3_600_000).getTime();
  };
  const members = team.data?.members ?? [];

  return (
    <div className="space-y-5">
      <section>
        <p className="mb-2 text-sm font-bold text-secondary-950">Choose an event</p>
        <div className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {upcoming.map((event) => {
            const chosen = event.id === selectedId;
            return (
              <button
                key={event.id}
                type="button"
                aria-pressed={chosen}
                onClick={() => setEventId(event.id)}
                className={cn(
                  "w-[240px] shrink-0 rounded-2xl border bg-white p-4 text-left transition-colors",
                  chosen ? "border-secondary-500 ring-2 ring-secondary-100" : "border-secondary-100 hover:border-secondary-300",
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="truncate font-bold text-secondary-950">{event.name}</span>
                  {isLive(event) && (
                    <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                      Live
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {formatEventTime(event.date, event.timezone)}
                </span>
              </button>
            );
          })}
          {past.length > 0 && (
            <select
              value={past.some((event) => event.id === selectedId) ? selectedId : ""}
              onChange={(event) => event.target.value && setEventId(event.target.value)}
              aria-label="Past events"
              className="h-auto w-[170px] shrink-0 rounded-2xl border border-dashed border-secondary-200 bg-white px-3 text-xs font-semibold text-muted-foreground"
            >
              <option value="">Past events</option>
              {past.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </section>

      {selected && (
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-[1.5rem] border border-secondary-100 bg-white p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-secondary-950">Door team · {selected.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Who can check people in, and how many each has scanned.
                </p>
              </div>
              {team.data && (
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold text-secondary-950">
                    {team.data.checkedIn.toLocaleString()}
                    <span className="text-sm font-semibold text-muted-foreground">
                      {" "}
                      / {team.data.total.toLocaleString()} in
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">checked in so far</p>
                </div>
              )}
            </div>

            <div className="mt-5">
              <AddDoorStaff eventId={selected.id} eventName={selected.name} />
            </div>

            {team.isPending ? (
              <div className="mt-5 space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-secondary-50">
                {members.map((member, index) => {
                  const name = member.name ?? member.email ?? "Door staff";
                  return (
                    <li key={member.accessId ?? `${member.kind}-${index}`} className="flex items-center gap-3 py-3.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary-50 text-sm font-bold text-secondary-700">
                        {initials(name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 font-semibold text-secondary-950">
                          <span className="truncate">{name}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", KIND[member.kind].className)}>
                            {KIND[member.kind].label}
                          </span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {member.username ? `@${member.username}` : member.email ? "Not on Turnupz yet" : ""}
                        </p>
                      </div>
                      <div className="hidden w-32 justify-end sm:flex">
                        <Status member={member} />
                      </div>
                      <div className="w-24 text-right">
                        <p className="font-bold text-secondary-950">{member.scans.toLocaleString()}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {member.lastScanAt ? `Last ${format(new Date(member.lastScanAt), "h:mm a")}` : "scans"}
                        </p>
                      </div>
                      <div className="w-16 text-right">
                        {member.accessId && (
                          <button
                            type="button"
                            onClick={() => setRemoving(member)}
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Team members with &quot;Scan tickets&quot; can scan every event.{" "}
              <Link href="/app/team" className="font-semibold text-secondary-600 hover:underline">
                Manage in Team →
              </Link>
            </p>
          </section>

          <div className="space-y-5">
            <section className="rounded-[1.5rem] border border-secondary-100 bg-white p-5 md:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-secondary-950">At the door</h2>
                {isLive(selected) && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                    Live
                  </span>
                )}
              </div>
              {feed.isPending ? (
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-10 rounded-xl" />
                  <Skeleton className="h-10 rounded-xl" />
                </div>
              ) : !feed.data?.length ? (
                <p className="mt-3 rounded-2xl bg-secondary-50/70 px-4 py-3 text-sm text-muted-foreground">
                  No one checked in yet. Check-ins show here as they happen.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-secondary-50">
                  {feed.data.map((entry, index) => {
                    const again = entry.kind === "let_in_again";
                    return (
                      <li key={`${entry.ticketId}-${index}`} className="flex items-start gap-3 py-2.5 text-sm">
                        <span
                          className={cn(
                            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                            again ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600",
                          )}
                        >
                          {again ? <RotateCcw className="size-3.5" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-secondary-950">
                            <b>{entry.holder}</b> {again ? "let in again" : "checked in"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {entry.by ? `by ${entry.by}` : ""}
                            {entry.reason ? ` · reason: ${entry.reason}` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {format(new Date(entry.at), "h:mm a")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link
                href={`/app/tickets?event=${selected.id}&status=checked_in`}
                className="mt-2 block text-center text-xs font-semibold text-secondary-600 hover:underline"
              >
                See all check-ins →
              </Link>
            </section>
            <Link
              href="/app/scan"
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-secondary-950 text-sm font-semibold text-white hover:bg-secondary-800"
            >
              <ScanLine className="size-4" aria-hidden />
              Open the scanner
            </Link>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!removing}
        title={`Remove ${removing?.name ?? removing?.email ?? "them"}?`}
        description="They won't be able to check tickets in for this event any more."
        confirmLabel="Remove"
        tone="danger"
        busy={revoke.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
};

export default memo(DoorScannersTab);
