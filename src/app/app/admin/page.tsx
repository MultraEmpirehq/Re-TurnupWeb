import AdminDashboard from "@/components/pages/app/admin/overview/admin-dashboard";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const AdminOverviewPage = () => <AdminDashboard />;

export default memo(AdminOverviewPage);
