import VendorEventListingsPage from "@/components/pages/app/vendor-event-listings-page";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const EventPage = () => {
  return (
    <div className="space-y-10">
      <VendorEventListingsPage />
    </div>
  );
};

export default memo(EventPage);
