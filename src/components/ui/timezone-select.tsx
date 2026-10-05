"use client";

import { listTimezones } from "@/lib/event-time";
import dynamic from "next/dynamic";
import React, { memo, useMemo } from "react";
import type { TComboboxItem } from "./combobox-select";

const ComboboxSelect = dynamic(() => import("./combobox-select"), {
  ssr: false,
});

/** "GMT+1" for a zone right now, so people can tell zones apart at a glance. */
const offsetLabel = (zone: string, now: Date) => {
  try {
    return (
      new Intl.DateTimeFormat("en-GB", {
        timeZone: zone,
        timeZoneName: "shortOffset",
      })
        .formatToParts(now)
        .find((part) => part.type === "timeZoneName")?.value ?? ""
    );
  } catch {
    return "";
  }
};

let cachedItems: TComboboxItem[] | null = null;
const timezoneItems = () => {
  if (cachedItems) return cachedItems;
  const now = new Date();
  cachedItems = listTimezones().map((zone) => {
    const offset = offsetLabel(zone, now);
    return {
      value: zone,
      label: `${zone.replace(/_/g, " ")}${offset ? ` (${offset})` : ""}`,
    };
  });
  return cachedItems;
};

const TimezoneSelect: React.FC<{
  value: string;
  onChange: (zone: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  inputClassName?: string;
}> = ({
  value,
  onChange,
  label = "Event Timezone",
  error,
  helperText = "Times are shown to attendees in this zone.",
  inputClassName,
}) => {
  const items = useMemo(() => {
    const all = timezoneItems();
    // A zone saved earlier that this browser doesn't list should still show.
    return value && !all.some((item) => item.value === value)
      ? [{ value, label: value.replace(/_/g, " ") }, ...all]
      : all;
  }, [value]);

  return (
    <ComboboxSelect
      label={label}
      item={value}
      setItem={onChange}
      items={items}
      error={error}
      helperText={helperText}
      placeholder="Search for a city or region"
      emptyText="No timezone found."
      inputClassName={inputClassName}
    />
  );
};

export default memo(TimezoneSelect);
