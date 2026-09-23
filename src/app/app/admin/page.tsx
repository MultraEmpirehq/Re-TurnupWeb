import AdminOverview from "@/components/pages/app/admin/overview/admin-overview";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const AdminOverviewPage = () => <AdminOverview />;

export default memo(AdminOverviewPage);
