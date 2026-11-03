"use client";

import RequireVendorVerification from "@/components/auth/require-vendor-verification";
import SectionContainer from "@/components/layouts/section-container/section-container";
import GeneralNavComponent from "@/components/navs/general-nav/general-nav.component";
import { ROUTES } from "@/lib/variables";
import { usePathname, useRouter } from "next/navigation";
import React, { memo, useEffect } from "react";
import {
  lockedVendorSection,
  verificationMessageFor,
} from "./vendor/shell/vendor-nav";

/**
 * How an attendee (a plain user, not a vendor) sees the few `/app` pages they use,
 * such as their event chats and the vendor application: the site header, no vendor
 * sidebar. Vendor tools stay locked exactly as they do in the vendor shell, and the
 * vendor dashboard itself sends them back to the site.
 */
const AttendeeShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  // Scanning stays open: door staff an organiser added to an event use it on
  // their own account, and the api checks every scan.
  const lockedSection =
    pathname === ROUTES.SCAN_TICKETS.href ? undefined : lockedVendorSection(pathname);
  const isVendorDashboard = pathname === ROUTES.DASHBOARD.href;

  useEffect(() => {
    if (isVendorDashboard) router.replace(ROUTES.HOME.href);
  }, [isVendorDashboard, router]);

  if (isVendorDashboard) return null;

  // Chats use the whole width: a list, the chat, and its details side by side.
  const isWide = pathname?.startsWith(ROUTES.MESSAGES.href);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(244,248,255,0.92)_0%,rgba(255,255,255,1)_30%)]">
      <GeneralNavComponent />
      <SectionContainer
        className={isWide ? "max-w-[1760px] py-6 md:py-8" : "py-8 md:py-10"}
      >
        {lockedSection ? (
          <RequireVendorVerification
            key={lockedSection.href}
            message={verificationMessageFor(lockedSection)}
          >
            {children}
          </RequireVendorVerification>
        ) : (
          children
        )}
      </SectionContainer>
    </div>
  );
};

export default memo(AttendeeShell);
