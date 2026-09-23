"use client";

import { NovuInbox } from "@/components/notifications/novu-inbox";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { memo, useState } from "react";
import { adminSectionLabel } from "./admin-nav";
import AdminSidebar from "./admin-sidebar";

const AdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
      <AdminSidebar className="sticky top-0 hidden h-svh lg:flex" />

      <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
        <SheetContent side="left" className="w-[272px] p-0 sm:max-w-[272px]">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <AdminSidebar className="h-full w-full border-r-0" />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsNavOpen(true)}
              aria-label="Open navigation"
              className="size-[38px] shrink-0 rounded-xl text-muted-foreground lg:hidden"
            >
              <MenuIcon className="size-4" />
            </Button>
            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="flex items-center gap-2 text-sm">
                <li className="hidden text-muted-foreground sm:block">Admin</li>
                <li aria-hidden className="hidden text-muted-foreground sm:block">
                  /
                </li>
                <li className="truncate font-semibold text-foreground">
                  {adminSectionLabel(pathname)}
                </li>
              </ol>
            </nav>
          </div>
          <NovuInbox />
        </header>

        <main className="flex-1 px-4 pt-6 pb-10 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
};

export default memo(AdminShell);
