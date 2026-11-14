import DashboardEvents from "@/components/pages/app/dashboard-events";
import DashboardOverview from "@/components/pages/app/dashboard-overview";
import OrganiserToDo from "@/components/pages/app/organiser-to-do";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const DashboardPage = () => {
  return (
    <div className="space-y-10">
      <OrganiserToDo />
      <DashboardOverview />
      <DashboardEvents />
    </div>
  );
};

export default memo(DashboardPage);
