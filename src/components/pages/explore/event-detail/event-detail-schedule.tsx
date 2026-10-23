import PerformerCard from "@/components/discovery/performer-card";
import {
  eventDayName,
  eventZoneNote,
  formatEventDateRange,
  formatEventTime,
} from "@/lib/event-time";
import { IEventDayDetails } from "@/lib/types";
import { CalendarRange, Clock } from "lucide-react";
import React, { memo } from "react";

/**
 * A multi-day event's programme: the dates it runs, then each day with its times
 * and who's performing, headliner first. Stands in for the single date and
 * line-up a one-day event shows.
 */
const EventDetailSchedule: React.FC<{
  days: IEventDayDetails[];
  timezone?: string;
}> = ({ days, timezone }) => {
  const first = days[0];
  const last = days[days.length - 1];
  const zoneNote = eventZoneNote(timezone, first?.startsAt);

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Schedule</h3>
        <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
          <CalendarRange className="size-4 shrink-0" aria-hidden />
          {formatEventDateRange(first.startsAt, last.endsAt ?? last.startsAt, timezone)}
          <span aria-hidden>·</span>
          {days.length} days
          {zoneNote && <span className="text-xs">({zoneNote})</span>}
        </p>
      </div>

      <ol className="space-y-4">
        {days.map((day, index) => (
          <li key={day.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h4 className="font-semibold">
                <span className="mr-2 text-xs font-bold tracking-wider text-primary uppercase">
                  Day {index + 1}
                </span>
                {eventDayName(day, timezone)}
              </h4>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5 shrink-0" aria-hidden />
                {day.label && `${eventDayName({ startsAt: day.startsAt }, timezone)}, `}
                {formatEventTime(day.startsAt, timezone, { timeOnly: true })}
                {day.endsAt &&
                  ` – ${formatEventTime(day.endsAt, timezone, { timeOnly: true })}`}
              </p>
            </div>
            {day.performers?.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {day.performers.map((performer) => (
                  <div key={performer.id} className="relative">
                    {performer.isHeadliner && day.performers!.length > 1 && (
                      <span className="absolute -top-2 right-3 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                        Headliner
                      </span>
                    )}
                    <PerformerCard performer={performer} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Line-up to be announced.</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
};

export default memo(EventDetailSchedule);
