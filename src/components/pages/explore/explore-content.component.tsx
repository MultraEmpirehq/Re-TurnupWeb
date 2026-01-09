import SectionContainer from "@/components/layouts/section-container/section-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { memo } from "react";

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
    content: <div>Events</div>,
  },
  {
    value: EXPLORE_CONTENT_TABS.VENUES,
    label: "Venues",
    content: <div>Venues</div>,
  },
];

const ExploreContentComponent = () => {
  return (
    <SectionContainer className="w-full py-10 md:py-16">
      <Tabs
        defaultValue={EXPLORE_CONTENT_TABS.EVENTS}
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
