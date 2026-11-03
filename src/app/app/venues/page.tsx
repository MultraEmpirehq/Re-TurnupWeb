"use client";

import VendorVenues from "@/components/pages/app/venues/vendor-venues";
import VenuesList from "@/components/pages/app/venues/venues-list";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import React, { memo } from "react";

// Admins look after the whole directory; organisers see the venues they use
// and suggest.
const VenuesPage = () => {
  const role = useUserStore((state) => state.userDetails?.role);
  if (role === EUserRoles.ADMIN) {
    return (
      <div className="space-y-6 md:space-y-10">
        <VenuesList />
      </div>
    );
  }
  return <VendorVenues />;
};

export default memo(VenuesPage);
