"use client";

import DashboardNav from "@/components/pages/app/dashboard-nav";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import React, { memo, useState } from "react";
import VendorSidebar from "./vendor-sidebar";

const VendorShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [navPathname, setNavPathname] = useState(pathname);

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
        <main className="flex-1 px-4 pt-6 pb-10 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
};

export default memo(VendorShell);
