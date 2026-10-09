"use client";

import ScrollRow from "@/components/ui/scroll-row";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { cn } from "@/lib/utils";
import { CalendarDays, Globe2, MapPin, Mic2 } from "lucide-react";
import React, { memo } from "react";
import DayStrip from "./day-strip";
import EventContent from "./event-content";
import { PerformerResults, PlaceResults } from "./explore-results";
import useExploreFilters, {
  EXPLORE_TABS,
  TExploreTab,
} from "./use-explore-filters";
import VenueContent from "./venue-content";

const TAB_ICONS: Record<TExploreTab, React.ElementType> = {
  events: CalendarDays,
  venues: MapPin,
  performers: Mic2,
  places: Globe2,
};

/**
 * Explore under the banner, as the app runs it: the day strip, then what the
 * search looks through (events, venues, performers or places). Events browses
 * by place until something is searched or filtered, then shows results.
 */
const ExploreContentComponent = () => {
  const { tab, setFilters } = useExploreFilters();

  return (
    <section className="bg-[#f7f9fc] [--ticket-notch:#f7f9fc]">
      <SectionContainer className="relative z-10 w-full space-y-10 pb-16 md:pb-24">
        <div className="-mt-20">
          <DayStrip />
        </div>

        <ScrollRow fadeClassName="from-[#f7f9fc]">
          <div
            role="tablist"
            aria-label="Search for"
            className="inline-flex gap-1 rounded-full bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-black/5"
          >
            {EXPLORE_TABS.map((option) => {
              const Icon = TAB_ICONS[option.value];
              const active = tab === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  // Only the tab changes, so the search carries over.
                  onClick={() =>
                    setFilters({
                      tab: option.value === "events" ? undefined : option.value,
                    })
                  }
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary-950 text-white"
                      : "text-secondary-800 hover:bg-secondary-50",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {option.label}
                </button>
              );
            })}
          </div>
        </ScrollRow>

        {tab === "events" && <EventContent />}
        {tab === "venues" && <VenueContent />}
        {tab === "performers" && <PerformerResults />}
        {tab === "places" && <PlaceResults />}
      </SectionContainer>
    </section>
  );
};

export default memo(ExploreContentComponent);
