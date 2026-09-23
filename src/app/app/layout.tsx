import RequireAuth from "@/components/auth/require-auth";
import AppLayout from "@/components/pages/app/app-layout";
import AppShell from "@/components/pages/app/app-shell";
import React, { memo } from "react";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <RequireAuth>
      <AppLayout>
        <AppShell>{children}</AppShell>
      </AppLayout>
    </RequireAuth>
  );
};

export default memo(DashboardLayout);
