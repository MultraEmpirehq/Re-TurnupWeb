"use client";

import LineupPicker from "@/components/discovery/lineup-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { IPerformerSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarRange, ChevronDown, Plus, Trash2 } from "lucide-react";
import React, { memo, useState } from "react";

/**
 * One day of a multi-day event as the form holds it. Times are wall-clock times
 * in the event's zone, like the single event date; `id` is set for days already
 * saved, so editing keeps their check-ins and the tickets tied to them.
 */
export interface IEventDayFormValue {
  id?: string;
  startsAt: Date;
  endsAt?: Date | null;
  label?: string;
  lineup: IPerformerSummary[];
}

const pad = (value: number) => `${value}`.padStart(2, "0");

/** For a datetime-local input, which reads and writes local wall time. */
const toLocalInput = (date?: Date | null) =>
  date && !Number.isNaN(new Date(date).getTime())
    ? (() => {
        const d = new Date(date);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      })()
    : "";

const toTimeInput = (date?: Date | null) =>
  date && !Number.isNaN(new Date(date).getTime())
    ? `${pad(new Date(date).getHours())}:${pad(new Date(date).getMinutes())}`
    : "";

/** The end time on the day's own date, or the next morning if it's earlier. */
const endOnDay = (startsAt: Date, time: string) => {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  const end = new Date(startsAt);
  end.setHours(hours, minutes, 0, 0);
  if (end <= startsAt) end.setDate(end.getDate() + 1);
  return end;
};

const dayHeading = (day: IEventDayFormValue, index: number) =>
  day.label?.trim() ||
  `Day ${index + 1}${
    day.startsAt
      ? ` · ${new Date(day.startsAt).toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })}`
      : ""
  }`;

/** A fresh day, the day after the last one at the same times. */
export const nextEventDay = (after: IEventDayFormValue): IEventDayFormValue => {
  const startsAt = new Date(after.startsAt);
  startsAt.setDate(startsAt.getDate() + 1);
  const endsAt = after.endsAt ? new Date(after.endsAt) : null;
  endsAt?.setDate(endsAt.getDate() + 1);
  return { startsAt, endsAt, label: "", lineup: [] };
};

/** The first two days when the switch is turned on, from the event date. */
export const firstEventDays = (eventDate: Date): IEventDayFormValue[] => {
  const first: IEventDayFormValue = {
    startsAt: new Date(eventDate),
    endsAt: null,
    label: "",
    lineup: [],
  };
  return [first, nextEventDay(first)];
};

/**
 * "Runs over several days": a switch, then each day with its times, an optional
 * name and its own line-up. Tickets then say which days they're for.
 */
const EventDaysInput: React.FC<{
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  days: IEventDayFormValue[];
  onChange: (days: IEventDayFormValue[]) => void;
  error?: string;
  /** Days already checked into can't be removed; the api would refuse it. */
  lockedDayIds?: string[];
}> = ({ enabled, onEnabledChange, days, onChange, error, lockedDayIds = [] }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const update = (index: number, patch: Partial<IEventDayFormValue>) =>
    onChange(days.map((day, i) => (i === index ? { ...day, ...patch } : day)));

  return (
    <div className="space-y-4 rounded-2xl border border-border p-4 sm:p-5">
      <label className="flex cursor-pointer items-start justify-between gap-4">
        <span className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700">
            <CalendarRange className="size-[18px]" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-semibold">Runs over several days</span>
            <span className="block text-xs leading-5 text-muted-foreground">
              A festival or weekend: give each day its own times and line-up, and
              sell day passes or one ticket for every day.
            </span>
          </span>
        </span>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </label>

      {enabled && (
        <div className="space-y-3">
          {days.map((day, index) => {
            const isOpen = openIndex === index;
            const locked = !!day.id && lockedDayIds.includes(day.id);
            return (
              <div key={day.id ?? index} className="rounded-xl border border-border bg-white">
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <ChevronDown
                      className={cn("size-4 shrink-0 transition-transform", !isOpen && "-rotate-90")}
                      aria-hidden
                    />
                    <span className="truncate text-sm font-semibold">{dayHeading(day, index)}</span>
                    {day.lineup.length > 0 && (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {day.lineup.length} on the bill
                      </span>
                    )}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={days.length <= 2 || locked}
                    title={
                      locked
                        ? "People have been checked in on this day"
                        : days.length <= 2
                          ? "A multi-day event needs at least two days"
                          : undefined
                    }
                    onClick={() => onChange(days.filter((_, i) => i !== index))}
                    aria-label={`Remove ${dayHeading(day, index)}`}
                    className="size-8 text-muted-foreground"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>

                {isOpen && (
                  <div className="space-y-4 border-t border-border p-3 sm:p-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_150px_1fr]">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold" htmlFor={`day-${index}-start`}>
                          Starts
                        </label>
                        <Input
                          id={`day-${index}-start`}
                          type="datetime-local"
                          value={toLocalInput(day.startsAt)}
                          onChange={(event) => {
                            if (!event.target.value) return;
                            const startsAt = new Date(event.target.value);
                            update(index, {
                              startsAt,
                              endsAt: day.endsAt
                                ? endOnDay(startsAt, toTimeInput(day.endsAt))
                                : null,
                            });
                          }}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold" htmlFor={`day-${index}-end`}>
                          Ends <span className="font-normal text-muted-foreground">(optional)</span>
                        </label>
                        <Input
                          id={`day-${index}-end`}
                          type="time"
                          value={toTimeInput(day.endsAt)}
                          onChange={(event) =>
                            update(index, { endsAt: endOnDay(day.startsAt, event.target.value) })
                          }
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold" htmlFor={`day-${index}-label`}>
                          Name <span className="font-normal text-muted-foreground">(optional)</span>
                        </label>
                        <Input
                          id={`day-${index}-label`}
                          maxLength={60}
                          value={day.label ?? ""}
                          placeholder="e.g. Opening night"
                          onChange={(event) => update(index, { label: event.target.value })}
                          className="h-10"
                        />
                      </div>
                    </div>
                    <LineupPicker
                      value={day.lineup}
                      onChange={(lineup) => update(index, { lineup })}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onChange([...days, nextEventDay(days[days.length - 1])]);
              setOpenIndex(days.length);
            }}
          >
            <Plus className="size-4" aria-hidden />
            Add another day
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default memo(EventDaysInput);
