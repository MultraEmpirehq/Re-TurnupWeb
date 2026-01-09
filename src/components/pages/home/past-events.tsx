import SectionContainer from "@/components/layouts/section-container/section-container";
import EventList from "@/components/ui/event-list";
import React, { memo } from "react";

const TrendingEvents = () => {
  return (
    <SectionContainer className="space-y-4 py-10 md:py-16">
      <h1 className="text-2xl font-bold">Past Events</h1>
      <EventList events={[]} />
    </SectionContainer>
  );
};

export default memo(TrendingEvents);
