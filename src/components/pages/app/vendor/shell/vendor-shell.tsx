"use client";

import DashboardNav from "@/components/pages/app/dashboard-nav";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import React, { memo, useState } from "react";
import VendorSidebar from "./vendor-sidebar";
import RequireVendorVerification from "@/components/auth/require-vendor-verification";
import {
  lockedVendorSection,
  navItemsFor,
  vendorNavItemFor,
  verificationMessageFor,
} from "./vendor-nav";
import { useActiveWorkspace } from "@/stores/workspace-store";
import { ShieldOff } from "lucide-react";

/** For a team member on a page the organiser didn't give them. */
const NoTeamAccess: React.FC<{ section: string; organiser: string }> = ({
  section,
  organiser,
}) => (
  <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
    <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <ShieldOff className="size-6" aria-hidden />
    </span>
    <h1 className="mt-4 text-xl font-bold">No access to {section}</h1>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">
      Your role on {organiser}&apos;s team doesn&apos;t include this. Ask them to
      add it in Team, or switch back to your own account.
    </p>
  </div>
);

const VendorShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [navPathname, setNavPathname] = useState(pathname);
  const lockedSection = lockedVendorSection(pathname);
  const workspace = useActiveWorkspace();
  const section = vendorNavItemFor(pathname);
  const isBlockedForMember =
    !!workspace &&
    !!section &&
    !navItemsFor(workspace.permissions).includes(section);

  // Below `lg` the nav is a drawer over the page. Close it as soon as the route
  // changes, during render, so the new page is never painted underneath it.
  if (navPathname !== pathname) {
    setNavPathname(pathname);
    setIsNavOpen(false);
  }

  return (
    <div className="flex min-h-svh bg-[linear-gradient(180deg,rgba(244,248,255,0.92)_0%,rgba(255,255,255,1)_30%)]">
      <VendorSidebar className="sticky top-0 hidden h-svh lg:flex" />

      <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
        <SheetContent side="left" className="w-[272px] p-0 sm:max-w-[272px]">
          <SheetTitle className="sr-only">Vendor navigation</SheetTitle>
          <VendorSidebar className="h-full w-full border-r-0" />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardNav onOpenNav={() => setIsNavOpen(true)} />
        <main className="flex-1 px-4 pt-6 pb-10 sm:px-6 lg:px-8">
          {isBlockedForMember && section && workspace ? (
            <NoTeamAccess section={section.label} organiser={workspace.name} />
          ) : lockedSection ? (
            // Typed URLs and other links are held back the same way the sidebar is.
            <RequireVendorVerification
              key={lockedSection.href}
              message={verificationMessageFor(lockedSection)}
            >
              {children}
            </RequireVendorVerification>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
};

export default memo(VendorShell);
