"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ErrorContainer from "@/components/ui/error-container";
import useCategory from "@/hooks/use-category";
import { useEvents } from "@/hooks/use-event";
import { cn } from "@/lib/utils";
import { formatDate } from "date-fns";
import { CalendarSearch, X } from "lucide-react";
import React, { memo, useMemo } from "react";
import Reveal from "../home/landing/reveal";
import TicketCard, { TicketCardSkeleton } from "../home/landing/ticket-card";
import ExplorePlaceFilters from "./explore-place-filters";
import ExplorePlacePicker from "./explore-place-picker";
import useExplorePlace from "./use-explore-place";
import { useEventLocations } from "@/hooks/use-discovery";
import useExploreFilters, {
  PRICE_OPTIONS,
  TWhen,
  WHEN_OPTIONS,
} from "./use-explore-filters";

const PAGE_SIZE = 12;

const whenLabel = (when: TWhen) => {
  const preset = WHEN_OPTIONS.find((option) => option.value === when);
  if (preset) return preset.label.toLowerCase();
  const [year, month, day] = when.split("-").map(Number);
  return `on ${formatDate(new Date(year, month - 1, day), "EEEE d MMMM")}`;
};

const EventList = () => {
  const {
    q,
    when,
    price,
    categoryId,
    countryCode,
    city,
    show,
    range,
    activeCount,
    setFilters,
    clearFilters,
  } = useExploreFilters();
  const { data: locations = [] } = useEventLocations();
  const { place, isReady } = useExplorePlace();
  const { data: categories } = useCategory();

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useEvents(
    {
      limit: PAGE_SIZE,
      q: q || undefined,
      priceType: price,
      categoryId,
      startDate: range?.startDate,
      endDate: range?.endDate,
      // A location filter wins; browsing, the list follows the picked place.
      countryCode:
        countryCode ?? (activeCount ? undefined : place?.countryCode),
      city: countryCode ? city : activeCount ? undefined : place?.city,
      isTrending: show === "trending" ? true : undefined,
      isFavorite: show === "saved" ? true : undefined,
      status: show === "past" ? "PAST" : undefined,
    },
    { enabled: isReady || activeCount > 0 },
  );

  const events = useMemo(
    () =>
      (data?.pages?.flatMap((page) => page?.data || []) || []).filter(Boolean),
    [data],
  );
  const isLoading = !data && !error;

  // The heading reads the filters back as a sentence: "Free comedy this weekend".
  const heading = useMemo(() => {
    const category = categories.find((item) => item.id === categoryId)?.name;
    const parts = [
      price === "FREE" ? "Free" : price === "PAID" ? "Paid" : "",
      category ? category.toLowerCase() : "",
      "events",
    ].filter(Boolean);
    let text = parts.join(" ");
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (show === "trending") text = `Trending ${text.toLowerCase()}`;
    if (show === "saved") text = `Your saved ${text.toLowerCase()}`;
    if (show === "past") text = `Past ${text.toLowerCase()}`;
    if (q) text += ` matching “${q}”`;
    const place =
      city ||
      locations.find((item) => item.countryCode === countryCode)?.country;
    if (place) text += ` in ${place}`;
    if (when) text += ` ${whenLabel(when)}`;
    return activeCount ? text : "Everything coming up";
  }, [
    activeCount,
    categories,
    categoryId,
    city,
    countryCode,
    locations,
    price,
    q,
    show,
    when,
  ]);

  // With no filters the first event leads, at double size.
  const hasFeature = !activeCount && events.length >= 3;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-secondary-950 md:text-3xl">
            {heading}
            {!activeCount && (
              <>
                {" "}
                <ExplorePlacePicker />
              </>
            )}
          </h2>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <X className="size-3.5" aria-hidden />
              Clear {activeCount > 1 ? `all ${activeCount} filters` : "filter"}
            </button>
          )}
        </div>
        <div
          role="group"
          aria-label="Price"
          className="flex w-fit rounded-full bg-white p-1 ring-1 ring-black/5"
        >
          {[{ value: undefined, label: "All" }, ...PRICE_OPTIONS].map(
            (option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={price === option.value}
                onClick={() => setFilters({ price: option.value })}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  price === option.value
                    ? "bg-secondary-950 text-white"
                    : "text-secondary-800 hover:bg-secondary-50",
                )}
              >
                {option.label}
              </button>
            ),
          )}
        </div>
      </div>

      <ExplorePlaceFilters />

      {error && !data ? (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "We couldn't load events just now",
          )}
          retryFunction={refetch}
        />
      ) : !isLoading && events.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-secondary-200 bg-white px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary-50 text-secondary-800">
            <CalendarSearch className="size-5" aria-hidden />
          </span>
          <p className="font-semibold text-secondary-950">
            {activeCount ? "Nothing matches that yet" : "No events yet"}
          </p>
          <p className="max-w-sm text-sm text-secondary-950/60">
            {activeCount
              ? show === "saved"
                ? "Save events with the heart and they'll be here."
                : "Try another day, place, price or category, or clear the filters to see everything."
              : "New events land every week. Check back soon."}
          </p>
          {activeCount > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="mt-2 rounded-full border-secondary-200"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading &&
              Array.from({ length: 6 }).map((_, index) => (
                <TicketCardSkeleton key={index} />
              ))}
            {events.map((event, index) => {
              const isFeature = hasFeature && index === 0;
              return (
                <Reveal
                  key={event.id}
                  delay={(index % PAGE_SIZE) * 50}
                  className={cn(isFeature && "sm:col-span-2 lg:row-span-2")}
                >
                  <TicketCard event={event} featured={isFeature} />
                </Reveal>
              );
            })}
          </div>

          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                type="button"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
                className="h-11 rounded-full bg-secondary-950 px-7 text-white hover:bg-secondary-900"
              >
                {isFetchingNextPage ? "Loading..." : "Show more events"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(EventList);
