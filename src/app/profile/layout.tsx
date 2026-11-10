"use client";

import RequireAuth from "@/components/auth/require-auth";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { ROUTES } from "@/lib/variables";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { usePathname, useRouter } from "next/navigation";
import React, { memo, useEffect } from "react";

/**
 * The attendee's own account pages. Organisers and admins keep theirs in the
 * dashboard's Settings, so these send them there; the buying pages (tickets,
 * orders, wallet, following) stay open to them, since they buy tickets too.
 */
const ACCOUNT_PAGES = [ROUTES.USER_PROFILE.href, ROUTES.PROFILE_EDIT.href, ROUTES.PROFILE_SETTINGS.href];

/**
 * The attendee account area. Its pages are reached from the account menu in the
 * header, so there's no second menu here; each page gives the room to its content.
 */
const ProfileLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const role = useUserStore((state) => state.userDetails?.role);
  const elsewhere =
    (role === EUserRoles.VENDOR || role === EUserRoles.ADMIN) &&
    ACCOUNT_PAGES.includes(pathname.replace(/\/$/, "") || "/");
  useEffect(() => {
    if (elsewhere) router.replace(ROUTES.SETTINGS.href);
  }, [elsewhere, router]);

  return (
    <RequireAuth>
      <SectionContainer className="py-8 sm:py-10">
        <main className="mx-auto w-full max-w-6xl min-w-0">{elsewhere ? null : children}</main>
      </SectionContainer>
    </RequireAuth>
  );
};

export default memo(ProfileLayout);
