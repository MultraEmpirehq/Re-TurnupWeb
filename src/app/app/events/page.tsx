import DashboardBanner from "@/components/pages/app/dashboard-banner";
import DashboardEvents from "@/components/pages/app/dashboard-events";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const EventPage = () => {
  return (
    <div className="space-y-10">
      <DashboardBanner />
      <DashboardEvents />
    </div>
  );
};

export default memo(EventPage);
