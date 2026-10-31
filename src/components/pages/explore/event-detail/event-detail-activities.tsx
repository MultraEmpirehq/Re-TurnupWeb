"use client";

import React, { memo } from "react";
import { format, isSameDay } from "date-fns";
import { IEventActivityDetails } from "@/lib/types";

interface EventDetailActivitiesProps {
  activities: IEventActivityDetails[];
}

/**
 * What happens when, in order: one timeline, split by day when the event runs
 * over more than one.
 */
const EventDetailActivities = ({ activities }: EventDetailActivitiesProps) => {
  const sorted = activities
    .filter((activity) => activity?.name)
    .map((activity) => ({
      ...activity,
      at: activity.date ? new Date(activity.date) : null,
    }))
    .sort((a, b) => (a.at?.getTime() ?? 0) - (b.at?.getTime() ?? 0));

  const days: { day: Date | null; items: typeof sorted }[] = [];
  for (const activity of sorted) {
    const last = days[days.length - 1];
    if (last && last.day && activity.at && isSameDay(last.day, activity.at)) {
      last.items.push(activity);
    } else if (last && !last.day && !activity.at) {
      last.items.push(activity);
    } else {
      days.push({ day: activity.at, items: [activity] });
    }
  }
  const showDays = days.length > 1;

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Activities</h3>
      <div className="space-y-6">
        {days.map(({ day, items }, dayIndex) => (
          <div key={dayIndex} className="space-y-3">
            {showDays && day && (
              <p className="text-sm font-semibold text-muted-foreground">
                {format(day, "EEEE d MMM")}
              </p>
            )}
            <ol className="relative space-y-4 border-l border-border pl-5">
              {items.map((activity, index) => (
                <li key={index} className="relative">
                  <span
                    aria-hidden
                    className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-primary ring-4 ring-background"
                  />
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    {activity.at && (
                      <span className="w-16 shrink-0 text-sm font-semibold tabular-nums">
                        {format(activity.at, "h:mm a")}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium break-words">{activity.name}</p>
                      {activity.description && (
                        <p className="mt-0.5 text-sm break-words text-muted-foreground">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
};

export default memo(EventDetailActivities);
