import React, { memo } from "react";
import CategoryTiles from "./category-tiles";
import EventList from "./event-list";

const EventContent = () => (
  <div className="space-y-8">
    <CategoryTiles />
    <EventList />
  </div>
);

export default memo(EventContent);
