"use client";

import BrandLoader from "@/components/ui/brand-loader";
import { NovuInbox } from "@/components/notifications/novu-inbox";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  ADMIN_PERMISSION_LABELS,
  useAdminPermissions,
} from "@/hooks/use-admin-permissions";
import { ROUTES } from "@/lib/variables";
import { LockKeyhole, MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { memo, useState } from "react";
import { adminPermissionFor, adminSectionLabel } from "./admin-nav";
import AdminSidebar from "./admin-sidebar";

/** Shown in place of a page the admin's permissions don't cover. */
const NoAccess: React.FC<{ permissionLabel: string }> = ({
  permissionLabel,
}) => (
  <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center">
    <span className="flex size-12 items-center justify-center rounded-full bg-secondary-50 text-secondary-800">
      <LockKeyhole className="size-5" aria-hidden />
    </span>
    <h1 className="text-lg font-semibold text-foreground">
      You don&apos;t have access to this page
    </h1>
    <p className="text-sm text-muted-foreground">
      It needs the &ldquo;{permissionLabel}&rdquo; permission. Ask an admin who
      manages admins to give it to you.
    </p>
    <Button asChild variant="outline" className="mt-2">
      <Link href={ROUTES.ADMIN_OVERVIEW.href}>Back to overview</Link>
    </Button>
  </div>
);

const AdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { has, isLoading: isLoadingPermissions } = useAdminPermissions();
  const requiredPermission = adminPermissionFor(pathname);
  // A page that needs a permission waits until we know, so it never fires a request
  // the api will refuse.
  const isWaiting = !!requiredPermission && isLoadingPermissions;
  const isBlocked =
    !!requiredPermission && !isLoadingPermissions && !has(requiredPermission);
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
                <li
                  aria-hidden
                  className="hidden text-muted-foreground sm:block"
                >
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

        <main className="flex-1 px-4 pt-6 pb-10 sm:px-6 lg:px-8">
          {isWaiting ? (
            <div className="flex justify-center py-16">
              <BrandLoader />
            </div>
          ) : isBlocked ? (
            <NoAccess
              permissionLabel={ADMIN_PERMISSION_LABELS[requiredPermission]}
            />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
};

export default memo(AdminShell);
