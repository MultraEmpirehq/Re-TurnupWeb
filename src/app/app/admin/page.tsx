import AdminDashboard from "@/components/pages/app/admin/overview/admin-dashboard";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

// The two-factor nudge sits inside the dashboard, on its own background.
const AdminOverviewPage = () => <AdminDashboard />;

export default memo(AdminOverviewPage);
