"use client";

import React, { memo } from "react";
import { format } from "date-fns";
import { IEventActivityDetails } from "@/lib/types";

interface ActivityTimelineItemProps {
  activity: IEventActivityDetails;
}

function ActivityTimelineItem({ activity }: ActivityTimelineItemProps) {
  const d = activity?.date ? new Date(activity.date) : null;
  return (
    <div className="flex gap-4">
      {d && (
        <div className="flex flex-col items-center shrink-0">
          <div className="rounded-md bg-muted px-2 py-1 text-center text-sm font-medium">
            {format(d, "dd MMM")}
          </div>
          <div className="w-px flex-1 min-h-[20px] bg-border mt-2" />
        </div>
      )}
      <div className="pb-4">
        <p className="font-medium">{activity?.name}</p>
        {activity?.description && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {activity.description}
          </p>
        )}
        {d && (
          <p className="text-xs text-muted-foreground mt-1">
            {format(d, "h:mm a")}
          </p>
        )}
      </div>
    </div>
  );
}

interface EventDetailActivitiesProps {
  activities: IEventActivityDetails[];
}

const EventDetailActivities = ({ activities }: EventDetailActivitiesProps) => (
  <section className="space-y-4">
    <h3 className="text-lg font-semibold text-primary">Activities</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {activities.map((activity, index) => (
        <ActivityTimelineItem key={index} activity={activity} />
      ))}
    </div>
  </section>
);

export default memo(EventDetailActivities);
