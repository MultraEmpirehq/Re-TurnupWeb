"use client";

import React, { memo } from "react";
import CategoryTiles from "./category-tiles";
import EventList from "./event-list";
import ExploreBrowse from "./explore-browse";
import useExploreFilters from "./use-explore-filters";

/**
 * The Events tab. Browsing, the place's sections come first and everything
 * coming up there after; any search or filter goes straight to results.
 */
const EventContent = () => {
  const { isFiltering } = useExploreFilters();
  return (
    <div className="space-y-16">
      <CategoryTiles />
      {!isFiltering && <ExploreBrowse />}
      <EventList />
    </div>
  );
};

export default memo(EventContent);
