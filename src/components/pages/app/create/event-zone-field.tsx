"use client";

import TimezoneSelect from "@/components/ui/timezone-select";
import { describeZone, deviceZone, sameClockNow } from "@/lib/event-zone";
import { Clock, TriangleAlert } from "lucide-react";
import React, { memo, useState } from "react";

/** Where the event's timezone came from, which decides what we say about it. */
export type TZoneSource = "location" | "chosen" | "device";

/**
 * Which clock the event's times are on. It follows the location (country, city,
 * venue), so it's shown as a line, with "Change" for the odd place on another
 * zone. If the organiser's own device is on a different clock, they're told,
 * so 8 PM means 8 PM at the venue.
 */
const EventZoneField: React.FC<{
  value: string;
  onChange: (zone: string) => void;
  source: TZoneSource;
  /** The country is picked but there's more than one zone and nothing narrower yet. */
  needsMoreDetail: boolean;
  error?: string;
}> = ({ value, onChange, source, needsMoreDetail, error }) => {
  const [changing, setChanging] = useState(false);
  const mine = deviceZone();
  const elsewhere = !!value && !!mine && value !== mine && !sameClockNow(value, mine);

  if (changing) {
    return (
      <div className="space-y-1">
        <TimezoneSelect
          value={value}
          onChange={(zone) => {
            onChange(zone);
            setChanging(false);
          }}
          error={error}
          inputClassName="h-10"
          helperText="Only if the venue keeps a different time from the rest of its area."
        />
        <button
          type="button"
          onClick={() => setChanging(false)}
          className="text-xs font-semibold text-primary-700 hover:underline"
        >
          Keep {value ? describeZone(value) : "it"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-secondary-950">Timezone</p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-secondary-100 bg-secondary-50/60 px-3 py-2.5 text-sm">
        <Clock className="size-4 shrink-0 text-primary-600" />
        <span className="text-secondary-900">
          {needsMoreDetail
            ? "Pick the province and city, and we'll set it."
            : value
              ? <>Times are in <b>{describeZone(value)}</b></>
              : "Pick the event's country, and we'll set it."}
        </span>
        {value && !needsMoreDetail && (
          <span className="text-xs text-secondary-500">
            {source === "location"
              ? "· from the event's location"
              : source === "device"
                ? "· from your device until you pick the location"
                : "· chosen by you"}
          </span>
        )}
        <button
          type="button"
          onClick={() => setChanging(true)}
          className="ml-auto text-xs font-semibold text-primary-700 hover:underline"
        >
          Change
        </button>
      </div>
      {elsewhere && !needsMoreDetail && mine && (
        <p className="flex items-start gap-1.5 text-xs text-amber-700">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          You&apos;re on {describeZone(mine)}. Enter times as the venue&apos;s clock
          shows them: they&apos;re {describeZone(value)}.
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default memo(EventZoneField);
