import SectionContainer from "@/components/layouts/section-container/section-container";
import AppLayout from "@/components/pages/app/app-layout";
import DashboardNav from "@/components/pages/app/dashboard-nav";
import DashboardSidebar from "@/components/pages/app/dashboard-sidebar";
import DashboardSidebarTrigger from "@/components/pages/app/dashboard-sidebar-trigger";
import React, { memo } from "react";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AppLayout>
      <div className="flex-row flex items-start w-full">
        <DashboardSidebar />
        <div className="flex-1 relative">
          <DashboardSidebarTrigger />
          <DashboardNav />
          <SectionContainer className="flex-1 relative py-10">
            {children}
          </SectionContainer>
        </div>
      </div>
    </AppLayout>
  );
};

export default memo(DashboardLayout);
