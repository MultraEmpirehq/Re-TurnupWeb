import InputField from "@/components/ui/input-field";
import { Label } from "@/components/ui/label";
import TextareaField from "@/components/ui/textarea-field";
import { cn } from "@/lib/utils";
import React, { memo, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { format, isSameDay } from "date-fns";
import { Clock, Pencil, PlusIcon, TrashIcon } from "lucide-react";

export interface IEventActivity {
  activityName: string;
  /** On the event's clock: the day it happens and its time. */
  activityDate: Date;
  activityDescription: string;
}

/** A day activities can be on: its start, and what to call it. */
export type TActivityDay = { startsAt: Date; label?: string };

interface IEventActivitiesInputProps {
  eventActivities: IEventActivity[];
  setEventActivities: (eventActivities: IEventActivity[]) => void;
  error?: string;
  errorClassName?: string;
  /** The event's start (a one-day event's day). */
  selectedDate?: Date;
  /** For an event over several days: its days, in order. */
  days?: TActivityDay[];
}

const pad = (value: number) => `${value}`.padStart(2, "0");
const toTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** The same clock time on another day. */
const onDay = (day: Date, time: Date | string) => {
  const next = new Date(day);
  if (typeof time === "string") {
    const [hours = 0, minutes = 0] = time.split(":").map(Number);
    next.setHours(hours, minutes, 0, 0);
  } else {
    next.setHours(time.getHours(), time.getMinutes(), 0, 0);
  }
  return next;
};

const dayName = (day: TActivityDay, index: number) =>
  day.label?.trim() || `Day ${index + 1} · ${format(day.startsAt, "EEE d MMM")}`;

type TDraft = { name: string; dayIndex: number; time: string; description: string };

/**
 * What happens when: doors, sets, speeches. Each activity is on the event's day
 * (or, over several days, the day picked), at a time on that day, so the
 * schedule always matches the event's dates. Listed in time order, and each
 * can be changed or removed.
 */
const EventActivitiesInput: React.FC<IEventActivitiesInputProps> = ({
  eventActivities = [],
  selectedDate,
  days = [],
  setEventActivities,
  error,
  errorClassName,
}) => {
  const multiDay = days.length > 1;
  // The days activities can be on: the event's days, or its one date.
  const activityDays = useMemo<TActivityDay[]>(
    () =>
      multiDay
        ? days.filter((day) => !Number.isNaN(new Date(day.startsAt).getTime()))
        : [{ startsAt: selectedDate ?? new Date() }],
    [days, multiDay, selectedDate],
  );
  const activities = useMemo(
    () =>
      eventActivities
        .filter(Boolean)
        .map((activity, index) => ({ activity, index }))
        .sort(
          (a, b) =>
            new Date(a.activity.activityDate).getTime() -
            new Date(b.activity.activityDate).getTime(),
        ),
    [eventActivities],
  );
  const dayOf = (date: Date) =>
    Math.max(
      0,
      activityDays.findIndex((day) => isSameDay(new Date(day.startsAt), new Date(date))),
    );

  // When the event's date (or a day) moves, its activities move with it,
  // keeping their times.
  const anchors = activityDays.map((day) => new Date(day.startsAt).toDateString()).join("|");
  useEffect(() => {
    if (!eventActivities.length) return;
    const moved = eventActivities.map((activity) => {
      const date = new Date(activity.activityDate);
      if (activityDays.some((day) => isSameDay(new Date(day.startsAt), date))) {
        return activity;
      }
      // A one-day event: onto its date. Over several days: the first day.
      return { ...activity, activityDate: onDay(new Date(activityDays[0].startsAt), date) };
    });
    if (moved.some((activity, index) => activity !== eventActivities[index])) {
      setEventActivities(moved);
    }
    // Only when the days themselves change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchors]);

  const blankDraft = (dayIndex = 0): TDraft => ({
    name: "",
    dayIndex,
    time: toTime(new Date(activityDays[dayIndex]?.startsAt ?? new Date())),
    description: "",
  });
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<TDraft>(() => blankDraft());
  const formOpen = editing !== null || activities.length === 0;

  const startNew = () => {
    setDraft(blankDraft());
    setEditing("new");
  };
  const startEdit = (index: number) => {
    const activity = eventActivities[index];
    const date = new Date(activity.activityDate);
    setDraft({
      name: activity.activityName,
      dayIndex: dayOf(date),
      time: toTime(date),
      description: activity.activityDescription ?? "",
    });
    setEditing(index);
  };
  const close = () => {
    setEditing(null);
    setDraft(blankDraft());
  };
  const save = () => {
    if (!draft.name.trim() || !draft.time) return;
    const day = activityDays[draft.dayIndex] ?? activityDays[0];
    const next: IEventActivity = {
      activityName: draft.name.trim(),
      activityDescription: draft.description.trim(),
      activityDate: onDay(new Date(day.startsAt), draft.time),
    };
    setEventActivities(
      typeof editing === "number"
        ? eventActivities.map((item, index) => (index === editing ? next : item))
        : [...eventActivities, next],
    );
    close();
  };

  return (
    <div className="space-y-4 lg:col-span-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Label className="opacity-70">Event Activities</Label>
          <p className="mt-1 text-xs text-secondary-500">
            {multiDay
              ? "What happens on each day, in order: doors, sets, speeches."
              : "What happens when: doors, sets, speeches."}
          </p>
        </div>
        {!formOpen && (
          <Button type="button" variant="outline" size="sm" onClick={startNew}>
            Add activity <PlusIcon className="size-4" />
          </Button>
        )}
      </div>

      {activities.length > 0 && (
        // A long schedule scrolls here rather than stretching the page.
        <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-secondary-100 p-2">
          {activityDays.map((day, dayIndex) => {
            const onThisDay = activities.filter(
              ({ activity }) => dayOf(new Date(activity.activityDate)) === dayIndex,
            );
            if (!onThisDay.length) return null;
            return (
              <div key={dayIndex} className="space-y-1.5">
                {multiDay && (
                  <p className="px-2 pt-1 text-xs font-semibold text-secondary-500">
                    {dayName(day, dayIndex)}
                  </p>
                )}
                {onThisDay.map(({ activity, index }) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-3 rounded-lg bg-secondary-50 px-3 py-2.5",
                      editing === index && "ring-2 ring-primary",
                    )}
                  >
                    <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-secondary-800">
                      <Clock className="size-3 text-secondary-400" />
                      {format(new Date(activity.activityDate), "h:mm a")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium break-words">{activity.activityName}</p>
                      {activity.activityDescription && (
                        <p className="text-xs break-words text-secondary-500">
                          {activity.activityDescription}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      disabled={editing === index}
                      aria-label={`Edit ${activity.activityName}`}
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-secondary-500 hover:bg-white hover:text-secondary-950 disabled:opacity-40"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEventActivities(eventActivities.filter((_, at) => at !== index));
                        if (editing === index) close();
                      }}
                      aria-label={`Remove ${activity.activityName}`}
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
        <div className="space-y-4 rounded-xl border border-secondary-100 p-4">
          {typeof editing === "number" && (
            <p className="text-xs font-semibold text-secondary-950">
              Editing “{eventActivities[editing]?.activityName}”
            </p>
          )}
          <div
            className={cn(
              "grid grid-cols-1 gap-3",
              multiDay ? "sm:grid-cols-[2fr_1.4fr_1fr]" : "sm:grid-cols-[2fr_1fr]",
            )}
          >
            <InputField
              label="Name"
              type="text"
              placeholder="Doors open"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
            {multiDay && (
              <label className="space-y-2 text-sm">
                <span className="block opacity-70">Day</span>
                <select
                  value={draft.dayIndex}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, dayIndex: Number(event.target.value) }))
                  }
                  className="h-11 w-full rounded-md border border-input bg-white px-3 text-sm"
                >
                  {activityDays.map((day, index) => (
                    <option key={index} value={index}>
                      {dayName(day, index)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <InputField
              label="Time"
              type="time"
              value={draft.time}
              onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))}
              helperText={
                multiDay
                  ? undefined
                  : `On ${format(new Date(activityDays[0].startsAt), "EEE d MMM")}`
              }
            />
          </div>
          <TextareaField
            label="Description (optional)"
            placeholder="Check-in and welcome drinks"
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({ ...current, description: event.target.value }))
            }
          />
          <div className="flex justify-end gap-2">
            {activities.length > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={close}>
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!draft.name.trim() || !draft.time}
              onClick={save}
            >
              {typeof editing === "number" ? "Save changes" : "Add"}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className={cn("text-sm", errorClassName, "text-destructive")}>{error}</p>
      )}
    </div>
  );
};

export default memo(EventActivitiesInput);
