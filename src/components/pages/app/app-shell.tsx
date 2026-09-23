"use client";

import SectionContainer from "@/components/layouts/section-container/section-container";
import AdminShell from "@/components/pages/app/admin/shell/admin-shell";
import DashboardNav from "@/components/pages/app/dashboard-nav";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import React, { memo } from "react";

/**
 * Admins get the sidebar console on every /app page they can open (their own pages
 * and the admin-only venue and category pages); everyone else gets the vendor nav.
 */
const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const role = useUserStore((state) => state.userDetails?.role);
  const isLoading = useUserStore((state) => state.isLoading);

  // Wait for the role, otherwise an admin sees the vendor nav flash first.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-b-2 border-foreground" />
      </div>
    );
  }

  if (role === EUserRoles.ADMIN) {
    return <AdminShell>{children}</AdminShell>;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(244,248,255,0.92)_0%,rgba(255,255,255,1)_30%)]">
      <DashboardNav />
      <SectionContainer className="relative max-w-[1800px] pt-28 pb-10 md:pt-32 md:pb-14">
        {children}
      </SectionContainer>
    </div>
  );
};

export default memo(AppShell);
