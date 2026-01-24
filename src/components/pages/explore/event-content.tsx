import React, { memo } from "react";
import Filter from "./filter";
import EventList from "./event-list";

const EventContent = () => {
  return (
    <div className="flex-row flex items-start gap-6 sticky top-[50px]">
      <Filter />
      <EventList />
    </div>
  );
};

export default memo(EventContent);
