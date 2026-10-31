"use client";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { addMinutes, endOfDay, format, isSameDay, startOfDay } from "date-fns";
import { CalendarClock, X } from "lucide-react";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

/** A suggested moment, e.g. "When the event starts". */
export type TQuickPick = { label: string; value: Date };

/**
 * A typed time on `day`: "8:59 pm", "8:59p", "859pm", "20:59" or "2059".
 * Without am/pm it's read as a 24-hour time. Null when it isn't a time.
 */
export const parseTypedTime = (text: string, day: Date) => {
  const match = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .match(/^(\d{1,2})(?:[:.h]?(\d{2}))?(am?|pm?)?$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const half = match[3]?.[0];
  if (minute > 59) return null;
  if (half) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (half === "p" ? 12 : 0);
  } else if (hour > 23) {
    return null;
  }
  const next = new Date(day);
  next.setHours(hour, minute, 0, 0);
  return next;
};

/**
 * A date and a time together, in the site's style: pick a day on the
 * calendar, then a time from that day's list (every quarter hour), or one of a
 * few suggested moments. Only times inside `min`–`max` are offered.
 *
 * Dates are clock times as a Date (the caller turns them into the event's
 * zone), so "8:00 PM" here is 8:00 PM on the venue's clock.
 */
const DateTimePicker: React.FC<{
  value: Date | null;
  onChange: (value: Date | null) => void;
  label: string;
  placeholder?: string;
  min?: Date;
  max?: Date;
  quickPicks?: TQuickPick[];
  /** Shown under the field, e.g. what an empty value means. */
  hint?: string;
  error?: string | null;
}> = ({
  value,
  onChange,
  label,
  placeholder = "Pick a date and time",
  min,
  max,
  quickPicks = [],
  hint,
  error,
}) => {
  const [open, setOpen] = useState(false);
  // The day whose times are listed: the chosen one, or one just tapped.
  const [shownDay, setShownDay] = useState<Date | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");

  // Whether a moment falls outside the allowed range.
  const outside = useCallback(
    (candidate: Date) => (!!min && candidate < min) || (!!max && candidate > max),
    [min, max],
  );
  const firstAllowedDay = min ?? max ?? new Date();
  const day = shownDay ?? value ?? firstAllowedDay;

  // Every quarter hour of that day that's allowed, as one list.
  const slots = useMemo(() => {
    const list: Date[] = [];
    const base = startOfDay(day);
    for (let minutes = 0; minutes < 24 * 60; minutes += 15) {
      const slot = addMinutes(base, minutes);
      if (!outside(slot)) list.push(slot);
    }
    // An allowed edge, or the chosen time, that isn't on the quarter hour
    // (the event's start, or 8:59 typed in).
    for (const edge of [min, max, value]) {
      if (edge && isSameDay(edge, day) && !list.some((slot) => slot.getTime() === edge.getTime())) {
        list.push(edge);
      }
    }
    return list.sort((a, b) => a.getTime() - b.getTime());
  }, [day, min, max, value, outside]);

  const picks = useMemo(
    () => quickPicks.filter((pick) => !outside(pick.value)),
    [quickPicks, outside],
  );

  // On opening, and on changing day: bring the chosen time (or the evening) into view.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const list = listRef.current;
      if (!list) return;
      const target =
        list.querySelector<HTMLElement>('[data-selected="true"]') ??
        list.querySelector<HTMLElement>('[data-evening="true"]');
      if (target) list.scrollTop = target.offsetTop - list.clientHeight / 2 + target.clientHeight / 2;
    });
    return () => cancelAnimationFrame(frame);
  }, [open, day]);

  const pickTime = (slot: Date) => {
    onChange(slot);
    setShownDay(null);
    setTyped("");
    setOpen(false);
  };

  // What the typed time means on the shown day, and whether it's allowed.
  const typedTime = typed.trim() ? parseTypedTime(typed, day) : null;
  const typedProblem = !typed.trim()
    ? null
    : !typedTime
      ? "Type a time like 8:59 pm or 20:59."
      : outside(typedTime)
        ? min && typedTime < min
          ? `That's before ${format(min, "d MMM, h:mm a")}.`
          : `That's after ${format(max!, "d MMM, h:mm a")}.`
        : null;

  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium text-secondary-600">{label}</span>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setShownDay(null);
            setTyped("");
          }
        }}
      >
        <div className="relative">
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-11 w-full items-center gap-2 rounded-xl border bg-white px-3 pr-9 text-left text-sm transition",
                "hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
                error ? "border-destructive" : "border-secondary-200",
                open && "border-primary ring-2 ring-primary/20",
              )}
            >
              <CalendarClock className="size-4 shrink-0 text-primary-600" />
              {value ? (
                <span className="truncate font-medium text-secondary-950">
                  {format(value, "EEE d MMM, h:mm a")}
                </span>
              ) : (
                <span className="truncate text-secondary-400">{placeholder}</span>
              )}
            </button>
          </PopoverTrigger>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={`Clear ${label.toLowerCase()}`}
              className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <PopoverContent
          align="start"
          className="w-auto overflow-hidden rounded-2xl border-secondary-100 p-0 shadow-xl"
        >
          {picks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-b border-secondary-100 bg-secondary-50/60 px-3 py-2.5">
              {picks.map((pick) => (
                <button
                  key={pick.label}
                  type="button"
                  onClick={() => pickTime(pick.value)}
                  className="rounded-full border border-secondary-200 bg-white px-3 py-1 text-xs font-semibold text-secondary-700 transition hover:border-primary hover:text-primary-700"
                >
                  {pick.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-col sm:flex-row">
            <div>
              <p className="px-4 pt-3 text-[11px] font-bold tracking-[0.16em] text-secondary-400 uppercase">
                1. Day
              </p>
              <Calendar
                mode="single"
                selected={shownDay ?? value ?? undefined}
                defaultMonth={value ?? min ?? max}
                captionLayout="label"
                startMonth={min}
                endMonth={max}
                disabled={[
                  ...(min ? [{ before: startOfDay(min) }] : []),
                  ...(max ? [{ after: endOfDay(max) }] : []),
                ]}
                onSelect={(picked) => picked && setShownDay(picked)}
              />
            </div>
            <div className="flex w-full flex-col border-t border-secondary-100 sm:w-44 sm:border-t-0 sm:border-l">
              <p className="px-4 pt-3 text-[11px] font-bold tracking-[0.16em] text-secondary-400 uppercase">
                2. Time
              </p>
              <p className="px-4 pb-2 text-xs font-semibold text-secondary-700">
                {format(day, "EEE d MMM")}
              </p>
              {/* Any exact minute, typed; the list below is every quarter hour. */}
              <form
                className="px-2 pb-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (typedTime && !typedProblem) pickTime(typedTime);
                }}
              >
                <div className="flex gap-1">
                  <input
                    value={typed}
                    onChange={(event) => setTyped(event.target.value)}
                    placeholder="Type, e.g. 8:59 pm"
                    aria-label="Type a time"
                    inputMode="text"
                    className={cn(
                      "h-9 w-full min-w-0 rounded-lg border bg-white px-2.5 text-sm outline-none transition",
                      "focus:border-primary focus:ring-2 focus:ring-primary/20",
                      typedProblem ? "border-destructive" : "border-secondary-200",
                    )}
                  />
                  <button
                    type="submit"
                    disabled={!typedTime || !!typedProblem}
                    className="h-9 shrink-0 rounded-lg bg-primary px-3 text-xs font-bold text-white transition hover:bg-primary/90 disabled:opacity-40"
                  >
                    Set
                  </button>
                </div>
                {typed.trim() && (
                  <p
                    className={cn(
                      "mt-1 px-0.5 text-[11px]",
                      typedProblem ? "text-destructive" : "text-secondary-500",
                    )}
                  >
                    {typedProblem ?? format(typedTime!, "EEE d MMM, h:mm a")}
                  </p>
                )}
              </form>
              <div
                ref={listRef}
                role="listbox"
                aria-label={`Times on ${format(day, "EEEE d MMMM")}`}
                className="relative max-h-64 flex-1 overflow-y-auto px-2 pb-2 sm:max-h-[17rem]"
              >
                {slots.length === 0 ? (
                  <p className="px-2 py-4 text-xs text-secondary-500">
                    No times left on this day. Pick another.
                  </p>
                ) : (
                  slots.map((slot) => {
                    const selected = !!value && slot.getTime() === value.getTime();
                    return (
                      <button
                        key={slot.getTime()}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        data-selected={selected}
                        data-evening={slot.getHours() === 18 && slot.getMinutes() === 0}
                        onClick={() => pickTime(slot)}
                        className={cn(
                          "flex h-9 w-full items-center rounded-lg px-3 text-sm tabular-nums transition",
                          selected
                            ? "bg-primary font-bold text-white"
                            : "text-secondary-800 hover:bg-secondary-100",
                        )}
                      >
                        {format(slot, "h:mm a")}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          {(min || max) && (
            <p className="border-t border-secondary-100 bg-secondary-50/60 px-4 py-2 text-[11px] text-secondary-500">
              {min && max
                ? `Any time from ${format(min, "d MMM, h:mm a")} to ${format(max, "d MMM, h:mm a")}.`
                : min
                  ? `Any time from ${format(min, "d MMM, h:mm a")}.`
                  : `Any time until ${format(max!, "d MMM, h:mm a")}.`}
            </p>
          )}
        </PopoverContent>
      </Popover>
      {(error || hint) && (
        <p className={cn("text-xs", error ? "text-destructive" : "text-secondary-500")}>
          {error || hint}
        </p>
      )}
    </div>
  );
};

export default memo(DateTimePicker);
