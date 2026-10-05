"use client";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, MapPin } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { memo } from "react";
import DayStrip from "./day-strip";
import EventContent from "./event-content";
import useExploreFilters from "./use-explore-filters";
import VenueContent from "./venue-content";

export enum EXPLORE_CONTENT_TABS {
  EVENTS = "events",
  VENUES = "venues",
}

const tabItems = [
  {
    value: EXPLORE_CONTENT_TABS.EVENTS,
    label: "Events",
    icon: CalendarDays,
    content: <EventContent />,
  },
  {
    value: EXPLORE_CONTENT_TABS.VENUES,
    label: "Venues",
    icon: MapPin,
    content: <VenueContent />,
  },
];

const ExploreContentComponent = () => {
  const searchParams = useSearchParams();
  const { setFilters } = useExploreFilters();
  const tab = searchParams.get("tab")?.toString();

  return (
    <section className="bg-[#f7f9fc] [--ticket-notch:#f7f9fc]">
      <SectionContainer className="relative z-10 w-full space-y-10 pb-16 md:pb-24">
        <div className="-mt-20">
          <DayStrip />
        </div>
        <Tabs
          // Only the tab changes, so any search or filters carry over.
          onValueChange={(value) =>
            setFilters({
              tab: value === EXPLORE_CONTENT_TABS.EVENTS ? undefined : value,
            })
          }
          defaultValue={tab || EXPLORE_CONTENT_TABS.EVENTS}
          className="w-full gap-6"
        >
          <TabsList className="h-auto rounded-full bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
            {tabItems.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-2 rounded-full px-5 py-2 text-sm font-medium text-secondary-800 data-[state=active]:bg-secondary-950 data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabItems.map((item) => (
            <TabsContent key={item.value} value={item.value}>
              {item.content}
            </TabsContent>
          ))}
        </Tabs>
      </SectionContainer>
    </section>
  );
};

export default memo(ExploreContentComponent);
