import DashboardEvents from "@/components/pages/app/dashboard-events";
import DashboardOverview from "@/components/pages/app/dashboard-overview";
import DashboardTicketSales from "@/components/pages/app/dashboard-ticket-sales";
import { VendorVerificationNotice } from "@/components/pages/app/vendor-verification";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const DashboardPage = () => {
  return (
    <div className="space-y-10">
      <VendorVerificationNotice />
      <DashboardOverview />
      <DashboardEvents />
      <DashboardTicketSales />
    </div>
  );
};

export default memo(DashboardPage);
