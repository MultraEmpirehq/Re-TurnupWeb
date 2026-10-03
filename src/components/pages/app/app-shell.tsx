"use client";

import AdminShell from "@/components/pages/app/admin/shell/admin-shell";
import VendorShell from "@/components/pages/app/vendor/shell/vendor-shell";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import React, { memo } from "react";

/**
 * Admins get the sidebar console on every /app page they can open (their own pages
 * and the admin-only venue and category pages); everyone else gets the vendor one.
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

  return <VendorShell>{children}</VendorShell>;
};

export default memo(AppShell);
