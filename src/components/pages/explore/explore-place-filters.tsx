"use client";

import ScrollRow from "@/components/ui/scroll-row";
import { useEventLocations } from "@/hooks/use-discovery";
import { cn } from "@/lib/utils";
import useUserStore from "@/stores/user-store";
import { MapPin } from "lucide-react";
import React, { memo, useMemo } from "react";
import useExploreFilters, { SHOW_OPTIONS, TShow } from "./use-explore-filters";

const selectClassName =
  "h-9 rounded-full bg-white px-3 pr-8 text-sm font-medium text-secondary-800 ring-1 ring-black/5 outline-none focus-visible:ring-2 focus-visible:ring-secondary";

/**
 * Where (only places with events coming up, busiest first, so no empty picks)
 * and the narrower lists: trending, saved (signed in) and past.
 */
const ExplorePlaceFilters = () => {
  const { countryCode, city, show, activeCount, setFilters } =
    useExploreFilters();
  const { data: locations = [] } = useEventLocations();
  const isSignedIn = !!useUserStore((state) => state.userDetails);
  const cities = useMemo(
    () =>
      locations.find((item) => item.countryCode === countryCode)?.cities ?? [],
    [countryCode, locations],
  );
  const shows = SHOW_OPTIONS.filter(
    (option) => option.value !== "saved" || isSignedIn,
  );

  return (
    <ScrollRow fadeClassName="from-[#f7f9fc]">
      <div className="flex items-center gap-2">
        {/* Browsing, the place picker in the heading says where; a location
            filter only appears once results are showing, as in the app. */}
        {locations.length > 0 && activeCount > 0 && (
          <>
            <label className="relative flex items-center">
              <span className="sr-only">Country</span>
              <MapPin
                className="pointer-events-none absolute left-3 size-4 text-secondary-500"
                aria-hidden
              />
              <select
                value={countryCode ?? ""}
                onChange={(event) =>
                  setFilters({
                    country: event.target.value || undefined,
                    city: undefined,
                  })
                }
                className={cn(selectClassName, "pl-8")}
              >
                <option value="">Anywhere</option>
                {locations.map((item) => (
                  <option key={item.countryCode} value={item.countryCode}>
                    {item.country} ({item.count})
                  </option>
                ))}
              </select>
            </label>
            {cities.length > 0 && (
              <label>
                <span className="sr-only">City</span>
                <select
                  value={city ?? ""}
                  onChange={(event) =>
                    setFilters({ city: event.target.value || undefined })
                  }
                  className={selectClassName}
                >
                  <option value="">All cities</option>
                  {cities.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name} ({item.count})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}
        {shows.map((option) => {
          const active = show === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() =>
                setFilters({
                  show: active ? undefined : (option.value as TShow),
                })
              }
              className={cn(
                "h-9 rounded-full px-4 text-sm font-medium ring-1 transition-colors",
                active
                  ? "bg-secondary-950 text-white ring-secondary-950"
                  : "bg-white text-secondary-800 ring-black/5 hover:bg-secondary-50",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </ScrollRow>
  );
};

export default memo(ExplorePlaceFilters);
