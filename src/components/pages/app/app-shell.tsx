"use client";

import BrandLoader from "@/components/ui/brand-loader";
import AdminShell from "@/components/pages/app/admin/shell/admin-shell";
import AttendeeShell from "@/components/pages/app/attendee-shell";
import VendorShell from "@/components/pages/app/vendor/shell/vendor-shell";
import { adminPathFor } from "@/lib/admin-routes";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { usePathname, useRouter } from "next/navigation";
import React, { memo, useEffect } from "react";

/**
 * Admins get the sidebar console on every /app page they can open (their own pages
 * and the admin-only venue and category pages). Approved vendors get the vendor
 * sidebar. Attendees, including anyone whose vendor application is still being
 * reviewed, only use a few /app pages, such as their chats and the verification
 * form, so they get the site header instead of a sidebar.
 */
const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const role = useUserStore((state) => state.userDetails?.role);
  const isLoading = useUserStore((state) => state.isLoading);
  const pathname = usePathname();
  const router = useRouter();
  // Admins work in their own routes, never the vendor area.
  const adminTarget =
    role === EUserRoles.ADMIN && pathname ? adminPathFor(pathname) : null;
  useEffect(() => {
    if (adminTarget) router.replace(adminTarget);
  }, [adminTarget, router]);

  // Wait for the role (and any move to the admin route), otherwise an admin
  // sees the vendor nav flash first.
  if (isLoading || adminTarget) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <BrandLoader />
      </div>
    );
  }

  if (role === EUserRoles.ADMIN) {
    return <AdminShell>{children}</AdminShell>;
  }

  if (role === EUserRoles.USER) {
    return <AttendeeShell>{children}</AttendeeShell>;
  }

  return <VendorShell>{children}</VendorShell>;
};

export default memo(AppShell);
