"use client";

import SectionContainer from "@/components/layouts/section-container/section-container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { BellIcon, MenuIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { memo, useMemo, useState } from "react";

const dashboardLinks = [
  { label: "Create Event", href: ROUTES.CREATE_EVENT.href },
  { label: "Listings", href: ROUTES.EVENTS.href },
  { label: "Tickets", href: ROUTES.TICKETS.href },
  { label: "Chats", href: ROUTES.MESSAGES.href },
  { label: "Analysis", href: ROUTES.ANALYSIS.href },
  { label: "Wallet", href: ROUTES.WALLET.href },
];

const DashboardNav = () => {
  const pathname = usePathname();
  const userDetails = useUserStore((state) => state.userDetails);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fallBackName = useMemo(() => {
    if (!userDetails) return "TZ";
    return (
      `${userDetails?.firstName?.charAt(0)}${userDetails?.lastName?.charAt(0)}` ||
      "TZ"
    );
  }, [userDetails]);

  const fullName = useMemo(() => {
    if (!userDetails) return "Turnupz Vendor";
    return userDetails?.name || "Turnupz Vendor";
  }, [userDetails]);

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-secondary-100/80 bg-white/95 backdrop-blur-xl">
      <SectionContainer className="py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={ROUTES.DASHBOARD.href}
              className="flex items-center gap-3 rounded-full border border-secondary-100 bg-white px-3 py-2 shadow-sm shadow-secondary-100/70"
            >
              <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary-800 text-sm font-semibold text-white shadow-sm shadow-secondary-800/30">
                {fallBackName}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-secondary-950">
                  {fullName}
                </p>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-secondary-400">
                  Turnupz Vendor Account
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {dashboardLinks.map((link) => {
                const isActive =
                  pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "text-secondary-400"
                        : "text-secondary-950 hover:text-secondary-400",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              size="icon"
              variant="outline"
              className="rounded-full border-secondary-100 bg-white text-secondary-600 shadow-none hover:bg-secondary-50"
            >
              <Link href={ROUTES.NOTIFICATIONS.href}>
                <BellIcon className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="icon"
              variant="outline"
              className="rounded-full border-secondary-100 bg-white text-secondary-600 shadow-none hover:bg-secondary-50"
            >
              <Link href={ROUTES.SETTINGS.href}>
                <SettingsIcon className="size-4" />
              </Link>
            </Button>
            <Link href={ROUTES.PROFILE.href} className="block">
              <Avatar className="size-10 border border-secondary-100 bg-secondary-50 shadow-sm">
                <AvatarImage src={userDetails?.avatar} />
                <AvatarFallback className="bg-secondary-50 text-sm font-semibold text-secondary-800">
                  {fallBackName}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full border-secondary-100 bg-white text-secondary-600 shadow-none hover:bg-secondary-50 lg:hidden"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
            >
              <MenuIcon className="size-4" />
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="mt-3 flex flex-col gap-2 rounded-3xl border border-secondary-100 bg-white p-3 lg:hidden">
            {dashboardLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "text-secondary-400"
                      : "text-secondary-950 hover:text-secondary-400",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </SectionContainer>
    </div>
  );
};

export default memo(DashboardNav);
