"use client";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { memo } from "react";
import EventContent from "./event-content";
import { useRouter, useSearchParams } from "next/navigation";
import VenueContent from "./venue-content";

export enum EXPLORE_CONTENT_TABS {
  EVENTS = "events",
  VENUES = "venues",
}

interface TabItem {
  value: EXPLORE_CONTENT_TABS;
  label: string;
  content: React.ReactNode;
}
const tabItems: TabItem[] = [
  {
    value: EXPLORE_CONTENT_TABS.EVENTS,
    label: "Events",
    content: <EventContent />,
  },
  {
    value: EXPLORE_CONTENT_TABS.VENUES,
    label: "Venues",
    content: <VenueContent />,
  },
];

const ExploreContentComponent = () => {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab")?.toString();
  return (
    <SectionContainer className="w-full py-10 md:py-16">
      <Tabs
        onValueChange={(value) => {
          push(`?tab=${value}`, { scroll: false });
        }}
        defaultValue={tab || EXPLORE_CONTENT_TABS.EVENTS}
        className="w-full space-y-6"
      >
        <TabsList>
          {tabItems.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabItems.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </SectionContainer>
  );
};

export default memo(ExploreContentComponent);
