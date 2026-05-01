import RequireAuth from "@/components/auth/require-auth";
import SectionContainer from "@/components/layouts/section-container/section-container";
import AppLayout from "@/components/pages/app/app-layout";
import DashboardNav from "@/components/pages/app/dashboard-nav";
import DashboardSidebar from "@/components/pages/app/dashboard-sidebar";
import React, { memo } from "react";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <RequireAuth>
      <AppLayout>
        <div className="flex-row flex items-start w-full min-w-0">
          <DashboardSidebar />
          <div className="flex-1 relative min-w-0">
            <DashboardNav />
            <SectionContainer className="flex-1 relative py-6 md:py-10">
              {children}
            </SectionContainer>
          </div>
        </div>
      </AppLayout>
    </RequireAuth>
  );
};

export default memo(DashboardLayout);
