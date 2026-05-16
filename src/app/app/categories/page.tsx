import RequireAdmin from "@/components/auth/require-admin";
import CategoriesList from "@/components/pages/app/categories/categories-list";
import DashboardBanner from "@/components/pages/app/dashboard-banner";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const CategoriesPage = () => {
  return (
    <RequireAdmin>
      <div className="space-y-6 md:space-y-10">
        <DashboardBanner />
        <CategoriesList />
      </div>
    </RequireAdmin>
  );
};

export default memo(CategoriesPage);
