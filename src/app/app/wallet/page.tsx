import DashboardBanner from "@/components/pages/app/dashboard-banner";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const WalletPage = () => {
  return (
    <div className="space-y-10">
      <DashboardBanner />
    </div>
  );
};

export default memo(WalletPage);
