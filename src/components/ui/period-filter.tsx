import React from "react";
import {
  CALENDAR_PERIODS,
  PERIODS,
  TCalendarPeriod,
  TPeriodDays,
} from "@/lib/periods";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

/** The dropdown both period filters share, so they look and behave the same. */
const PeriodSelect = <T extends string>({
  value,
  onChange,
  options,
  className,
  width,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  width: string;
}) => (
  <Select value={value} onValueChange={(next) => onChange(next as T)}>
    <SelectTrigger
      aria-label="Period"
      className={cn(
        "h-9 rounded-full border-border bg-card text-xs font-semibold text-foreground shadow-none",
        width,
        className,
      )}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent position="popper" align="end" className="rounded-xl">
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value} className="text-sm">
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

/**
 * The period dropdown every report uses: 7, 30, 90 days, 12 months, all time.
 * Built on the shared Select, so it follows light and dark mode.
 */
const PeriodFilter = ({
  value,
  onChange,
  className,
}: {
  value: TPeriodDays;
  onChange: (days: TPeriodDays) => void;
  className?: string;
}) => (
  <PeriodSelect
    value={String(value)}
    onChange={(next) => onChange(Number(next) as TPeriodDays)}
    options={PERIODS.map((period) => ({ value: String(period.days), label: period.label }))}
    className={className}
    width="w-[132px]"
  />
);

/**
 * Calendar periods (this month, last month, this year…) for money pages, where
 * figures line up with statements. Same dropdown as PeriodFilter.
 */
export const CalendarPeriodFilter = ({
  value,
  onChange,
  className,
}: {
  value: TCalendarPeriod;
  onChange: (period: TCalendarPeriod) => void;
  className?: string;
}) => (
  <PeriodSelect
    value={value}
    onChange={onChange}
    options={CALENDAR_PERIODS}
    className={className}
    width="w-[150px]"
  />
);

export default PeriodFilter;
