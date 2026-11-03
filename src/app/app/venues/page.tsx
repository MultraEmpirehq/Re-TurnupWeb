"use client";

import VendorVenues from "@/components/pages/app/venues/vendor-venues";
import AdminVenues from "@/components/pages/app/venues/admin-venues";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import React, { memo } from "react";

// Admins look after the whole directory; organisers see the venues they use
// and suggest.
const VenuesPage = () => {
  const role = useUserStore((state) => state.userDetails?.role);
  if (role === EUserRoles.ADMIN) {
    return <AdminVenues />;
  }
  return <VendorVenues />;
};

export default memo(VenuesPage);
