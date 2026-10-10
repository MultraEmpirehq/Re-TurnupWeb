"use client";

import PerformerCard from "@/components/discovery/performer-card";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import { Skeleton } from "@/components/ui/skeleton";
import { usePerformers } from "@/hooks/use-discovery";
import { Globe2, MapPin, Mic2 } from "lucide-react";
import React, { memo, useMemo } from "react";
import useExploreFilters from "./use-explore-filters";
import useExplorePlace from "./use-explore-place";

/** The Performers tab: everyone who can be on a bill, searched by name. */
export const PerformerResults = memo(function PerformerResults() {
  const { q } = useExploreFilters();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    usePerformers({ q });
  const performers = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.performers),
    [data],
  );

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (!performers.length) {
    return (
      <EmptyContainer
        icon={<Mic2 className="size-6" />}
        title={q ? `No performer called “${q}”` : "No performers yet"}
        description="Artists, DJs, speakers and hosts appear here once they're on an event."
      />
    );
  }
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {performers.map((performer) => (
          <PerformerCard key={performer.id} performer={performer} />
        ))}
      </div>
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="rounded-full"
            loading={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
});

/**
 * The Places tab: every country (and city) with something coming up. Picking
 * one points Explore there and goes back to browsing it, as in the app.
 */
export const PlaceResults = memo(function PlaceResults() {
  const { q, setFilters } = useExploreFilters();
  const { locations, setPlace } = useExplorePlace();
  const shown = useMemo(() => {
    const term = q.toLowerCase();
    if (!term) return locations;
    return locations.filter(
      (item) =>
        item.country.toLowerCase().includes(term) ||
        item.countryCode.toLowerCase() === term ||
        item.cities.some((city) => city.name.toLowerCase().includes(term)),
    );
  }, [locations, q]);

  const go = (place: Parameters<typeof setPlace>[0]) => {
    setPlace(place);
    setFilters({ tab: undefined, q: undefined });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!shown.length) {
    return (
      <EmptyContainer
        icon={<Globe2 className="size-6" />}
        title={q ? `Nothing on in “${q}” yet` : "No places yet"}
        description="Countries and cities show here once they have events coming up."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {shown.map((item) => (
        <div
          key={item.countryCode}
          className="space-y-3 rounded-3xl bg-white p-5 ring-1 ring-black/5"
        >
          <button
            type="button"
            onClick={() =>
              go({ countryCode: item.countryCode, country: item.country })
            }
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span>
              <span className="block text-lg font-bold text-secondary-950 hover:text-secondary">
                {item.country}
              </span>
              <span className="text-sm text-secondary-500">
                {item.count} upcoming {item.count === 1 ? "event" : "events"}
              </span>
            </span>
            <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold text-secondary">
              Explore
            </span>
          </button>
          {item.cities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.cities.map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() =>
                    go({
                      countryCode: item.countryCode,
                      country: item.country,
                      city: city.name,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-secondary-50 px-3 py-1.5 text-sm text-secondary-800 hover:bg-secondary-100"
                >
                  <MapPin className="size-3.5" aria-hidden />
                  {city.name}
                  <span className="text-xs text-secondary-400">
                    {city.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
