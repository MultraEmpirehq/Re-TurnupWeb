import RequireAuth from "@/components/auth/require-auth";
import SectionContainer from "@/components/layouts/section-container/section-container";
import AppLayout from "@/components/pages/app/app-layout";
import DashboardNav from "@/components/pages/app/dashboard-nav";
import React, { memo } from "react";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <RequireAuth>
      <AppLayout>
        <div className="min-h-screen bg-[linear-gradient(180deg,rgba(244,248,255,0.92)_0%,rgba(255,255,255,1)_30%)]">
          <DashboardNav />
          <SectionContainer className="relative max-w-[1380px] pt-28 pb-10 md:pt-32 md:pb-14">
            {children}
          </SectionContainer>
        </div>
      </AppLayout>
    </RequireAuth>
  );
};

export default memo(DashboardLayout);
