"use client";

import React, { memo } from "react";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";

interface EventDetailDateTimeProps {
  date: Date;
}

const EventDetailDateTime = ({ date }: EventDetailDateTimeProps) => (
  <section className="space-y-3">
    <h3 className="text-lg font-semibold">Date and Time</h3>
    <div className="flex flex-wrap gap-6 text-muted-foreground">
      <span className="flex items-center gap-2">
        <Calendar className="size-4 shrink-0" />
        {format(date, "EEEE, d MMMM yyyy")}
      </span>
      <span className="flex items-center gap-2">
        <Clock className="size-4 shrink-0" />
        {format(date, "h:mm a")}
      </span>
    </div>
  </section>
);

export default memo(EventDetailDateTime);
