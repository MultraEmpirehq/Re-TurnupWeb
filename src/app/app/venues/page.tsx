import RequireAdmin from "@/components/auth/require-admin";
import DashboardBanner from "@/components/pages/app/dashboard-banner";
import VenuesList from "@/components/pages/app/venues/venues-list";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const VenuesPage = () => {
  return (
    <RequireAdmin>
      <div className="space-y-6 md:space-y-10">
        <DashboardBanner />
        <VenuesList />
      </div>
    </RequireAdmin>
  );
};

export default memo(VenuesPage);
