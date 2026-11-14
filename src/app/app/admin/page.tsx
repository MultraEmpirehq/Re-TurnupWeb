import AdminDashboard from "@/components/pages/app/admin/overview/admin-dashboard";
import TwoFactorNudge from "@/components/account/two-factor-nudge";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const AdminOverviewPage = () => (
  <div className="space-y-6">
    <TwoFactorNudge />
    <AdminDashboard />
  </div>
);

export default memo(AdminOverviewPage);
