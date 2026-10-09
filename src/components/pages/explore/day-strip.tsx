"use client";

import { Skeleton } from "@/components/ui/skeleton";
import useIsClient from "@/hooks/use-is-client";
import { cn } from "@/lib/utils";
import { addDays, formatDate, isWeekend } from "date-fns";
import React, { memo, useMemo } from "react";
import useExploreFilters, {
  toDayKey,
  WHEN_OPTIONS,
} from "./use-explore-filters";

const DAYS = 14;
const SHORTCUTS = WHEN_OPTIONS.filter((option) =>
  ["weekend", "week", "next-week"].includes(option.value),
);

/**
 * The next two weeks as a strip of days, plus a few ranges. Built only in the
 * browser, since "today" depends on the viewer's clock and time zone.
 */
const DayStrip = () => {
  const isClient = useIsClient();
  const { when, setFilters } = useExploreFilters();
  const days = useMemo(() => {
    if (!isClient) return [];
    const today = new Date();
    return Array.from({ length: DAYS }, (_, offset) => addDays(today, offset));
  }, [isClient]);

  const pick = (value: string) =>
    setFilters({ when: when === value ? undefined : value });

  return (
    <div className="rounded-[2rem] bg-white p-3 shadow-[0_30px_60px_-30px_rgba(2,6,23,0.35)] ring-1 ring-black/5 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div
          role="group"
          aria-label="Pick a day"
          className="scrollbar-none flex flex-1 gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,black_92%,transparent)] pr-6"
        >
          {!isClient &&
            Array.from({ length: 10 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-[74px] w-[58px] shrink-0 rounded-2xl"
              />
            ))}
          {days.map((day, offset) => {
            const key = toDayKey(day);
            const isActive = when === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isActive}
                aria-label={formatDate(day, "EEEE d MMMM")}
                onClick={() => pick(key)}
                className={cn(
                  "relative flex w-[58px] shrink-0 flex-col items-center gap-0.5 rounded-2xl py-2.5 transition-all duration-300",
                  isActive
                    ? "bg-secondary-950 text-white shadow-[0_12px_24px_-12px_rgba(2,6,23,0.7)]"
                    : "text-secondary-900 hover:bg-secondary-50",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold tracking-wide uppercase",
                    isActive
                      ? "text-white/70"
                      : isWeekend(day)
                        ? "text-primary"
                        : "text-secondary-950/50",
                  )}
                >
                  {offset === 0 ? "Today" : formatDate(day, "EEE")}
                </span>
                <span className="text-xl leading-tight font-bold">
                  {formatDate(day, "d")}
                </span>
                <span
                  className={cn(
                    "text-[10px]",
                    isActive ? "text-white/60" : "text-secondary-950/40",
                  )}
                >
                  {formatDate(day, "MMM")}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-secondary-50 pt-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
          {SHORTCUTS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={when === option.value}
              onClick={() => pick(option.value)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                when === option.value
                  ? "bg-primary text-white"
                  : "bg-primary-50 text-primary-700 hover:bg-primary-100",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(DayStrip);
