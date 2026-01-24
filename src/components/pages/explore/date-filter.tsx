import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { addDays, addWeeks, startOfWeek } from "date-fns";
import { useSearchParams } from "next/navigation";
import React, { memo } from "react";

const dateList = [
  {
    name: "Today",
    value: new Date()?.toDateString(),
  },
  {
    name: "Tomorrow",
    value: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow?.toDateString();
    })(),
  },
  {
    name: "This week",
    value: startOfWeek(new Date())?.toDateString(),
  },
  {
    name: "This weekend",
    value: addDays(
      startOfWeek(new Date(), { weekStartsOn: 1 }),
      5,
    )?.toDateString(),
  },
  {
    name: "Next Week",
    value: startOfWeek(addWeeks(new Date(), 1), {
      weekStartsOn: 1,
    })?.toDateString(),
  },
];

const DateFilter = () => {
  const searchParam = useSearchParams();
  const startDate = searchParam?.get("startDate")?.toString();
  return (
    <div className="space-y-4 border-b pb-10">
      <h1 className="font-medium text-sm">Date</h1>
      <form className="space-y-2">
        {dateList.map((dateType) => (
          <div
            key={dateType?.value}
            className="flex flex-row items-center gap-2 opacity-60"
          >
            <Checkbox
              checked={startDate === dateType?.value}
              id={`${dateType?.value}-price`}
              name="startDate"
              value={dateType?.value}
            />
            <Label htmlFor="startDate" className="text-sm">
              {dateType?.name || "Date"}
            </Label>
          </div>
        ))}
      </form>
    </div>
  );
};

export default memo(DateFilter);
