"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import useIsClient from "@/hooks/use-is-client";
import { addDays, addWeeks, startOfWeek } from "date-fns";
import { useSearchParams } from "next/navigation";
import React, { memo, useMemo } from "react";

// Built from the viewer's local "now", which the server can't know, so the values
// are only filled in once rendering in the browser.
const buildDateList = (now: Date) => [
  { name: "Today", value: now.toDateString() },
  { name: "Tomorrow", value: addDays(now, 1).toDateString() },
  { name: "This week", value: startOfWeek(now).toDateString() },
  {
    name: "This weekend",
    value: addDays(startOfWeek(now, { weekStartsOn: 1 }), 5).toDateString(),
  },
  {
    name: "Next Week",
    value: startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 }).toDateString(),
  },
];

const DATE_NAMES = buildDateList(new Date(0)).map((date) => date.name);

const DateFilter = () => {
  const searchParam = useSearchParams();
  const startDate = searchParam?.get("startDate")?.toString();
  const isClient = useIsClient();
  const dateList = useMemo(
    () =>
      isClient
        ? buildDateList(new Date())
        : DATE_NAMES.map((name) => ({ name, value: "" })),
    [isClient],
  );

  return (
    <div className="space-y-4 border-b pb-10">
      <h1 className="font-medium text-sm">Date</h1>
      <form className="space-y-2">
        {dateList.map((dateType) => {
          const id = `${dateType.name.toLowerCase().replace(/\s+/g, "-")}-date`;
          return (
            <div
              key={dateType.name}
              className="flex flex-row items-center gap-2 opacity-60"
            >
              <Checkbox
                checked={!!dateType.value && startDate === dateType.value}
                disabled={!dateType.value}
                id={id}
                name="startDate"
                value={dateType.value}
              />
              <Label htmlFor={id} className="text-sm">
                {dateType.name}
              </Label>
            </div>
          );
        })}
      </form>
    </div>
  );
};

export default memo(DateFilter);
