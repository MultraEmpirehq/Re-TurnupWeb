"use client";

import {
  addDays,
  addWeeks,
  endOfDay,
  endOfWeek,
  isWeekend,
  nextSaturday,
  nextSunday,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export const WHEN_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "weekend", label: "This weekend" },
  { value: "week", label: "This week" },
  { value: "next-week", label: "Next week" },
] as const;

export const PRICE_OPTIONS = [
  { value: "FREE", label: "Free" },
  { value: "PAID", label: "Paid" },
] as const;

/** What the search looks through, as the app's tabs. */
export const EXPLORE_TABS = [
  { value: "events", label: "Events" },
  { value: "venues", label: "Venues" },
  { value: "performers", label: "Performers" },
  { value: "places", label: "Places" },
] as const;

export type TExploreTab = (typeof EXPLORE_TABS)[number]["value"];

const isTab = (value?: string | null): value is TExploreTab =>
  EXPLORE_TABS.some((option) => option.value === value);

/** Narrower lists, as the app has them: what's hot, what you saved, what's been. */
export const SHOW_OPTIONS = [
  { value: "trending", label: "Trending" },
  { value: "saved", label: "Saved" },
  { value: "past", label: "Past" },
] as const;

export type TShow = (typeof SHOW_OPTIONS)[number]["value"];

const isShow = (value?: string | null): value is TShow =>
  SHOW_OPTIONS.some((option) => option.value === value);

/** A preset, or one calendar day as yyyy-mm-dd from the date strip. */
export type TWhen =
  (typeof WHEN_OPTIONS)[number]["value"] | `${number}-${number}-${number}`;

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** yyyy-mm-dd in the viewer's own time zone, for the date strip. */
export const toDayKey = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
export type TPrice = (typeof PRICE_OPTIONS)[number]["value"];

/**
 * The api wants a start and an end. Every edge falls on a whole day, so the range
 * (and the query cached against it) stays the same all day rather than changing
 * with every render.
 */
const rangeFor = (when: TWhen, now = new Date()) => {
  const monday = { weekStartsOn: 1 } as const;
  switch (when) {
    case "today":
      return [startOfDay(now), endOfDay(now)];
    case "tomorrow":
      return [startOfDay(addDays(now, 1)), endOfDay(addDays(now, 1))];
    case "weekend":
      return isWeekend(now)
        ? [
            startOfDay(now),
            endOfDay(now.getDay() === 0 ? now : nextSunday(now)),
          ]
        : [startOfDay(nextSaturday(now)), endOfDay(nextSunday(now))];
    case "week":
      return [startOfDay(now), endOfWeek(now, monday)];
    case "next-week": {
      const next = startOfWeek(addWeeks(now, 1), monday);
      return [next, endOfWeek(next, monday)];
    }
    default: {
      const [year, month, day] = when.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return [startOfDay(date), endOfDay(date)];
    }
  }
};

const isWhen = (value?: string | null): value is TWhen =>
  !!value &&
  (WHEN_OPTIONS.some((option) => option.value === value) ||
    (DAY_PATTERN.test(value) &&
      endOfDay(new Date(`${value}T00:00:00`)) >= new Date()));
const isPrice = (value?: string | null): value is TPrice =>
  PRICE_OPTIONS.some((option) => option.value === value);

/**
 * Explore's filters, kept in the url so a search survives a reload and can be
 * shared. Changes go through the history api rather than the router: Next keeps
 * useSearchParams in step with it, and it skips the server round trip a router
 * navigation makes, so quick changes in a row never cancel each other.
 */
const useExploreFilters = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const q = searchParams.get("q")?.trim() || "";
  const whenParam = searchParams.get("when");
  const when = isWhen(whenParam) ? whenParam : undefined;
  const priceParam = searchParams.get("price");
  const price = isPrice(priceParam) ? priceParam : undefined;
  const categoryId = searchParams.get("category") || undefined;
  // Where: an ISO country code, and optionally one of its cities.
  const countryCode = searchParams.get("country")?.toUpperCase() || undefined;
  const city = (countryCode && searchParams.get("city")) || undefined;
  const showParam = searchParams.get("show");
  const show = isShow(showParam) ? showParam : undefined;
  const tabParam = searchParams.get("tab");
  const tab: TExploreTab = isTab(tabParam) ? tabParam : "events";

  const dayKey = new Date().toDateString();
  const range = useMemo(() => {
    if (!when) return undefined;
    const [start, end] = rangeFor(when);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
    // dayKey re-runs this when the date rolls over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [when, dayKey]);

  const setFilters = useCallback(
    (changes: Record<string, string | undefined>) => {
      // The live url, not the last render's copy, so back-to-back changes stack.
      const next = new URLSearchParams(window.location.search);
      Object.entries(changes).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      const query = next.toString();
      // Null state is what tells Next to sync its router with the new url.
      window.history.replaceState(
        null,
        "",
        query ? `${pathname}?${query}` : pathname,
      );
    },
    [pathname],
  );

  const activeCount = [q, when, price, categoryId, countryCode, show].filter(
    Boolean,
  ).length;

  return {
    q,
    when,
    price,
    categoryId,
    countryCode,
    city,
    show,
    tab,
    range,
    activeCount,
    // As the app: anything searched or narrowed swaps the browse sections for
    // results; so does looking at venues, performers or places.
    isFiltering: activeCount > 0 || tab !== "events",
    setFilters,
    clearFilters: () =>
      setFilters({
        q: undefined,
        when: undefined,
        price: undefined,
        category: undefined,
        country: undefined,
        city: undefined,
        show: undefined,
      }),
  };
};

export default useExploreFilters;
