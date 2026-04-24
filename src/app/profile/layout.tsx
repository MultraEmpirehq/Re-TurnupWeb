"use client";

import RequireAuth from "@/components/auth/require-auth";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { ROUTES } from "@/lib/variables";
import { cn } from "@/lib/utils";
import { CircleHelp, ShieldCheck, ShoppingBag, TicketIcon, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { memo, useMemo } from "react";

const sidebarLinks = [
  { href: ROUTES.USER_PROFILE.href, label: "My Profile", icon: User },
  { href: ROUTES.PROFILE_ORDERS.href, label: "Orders", icon: ShoppingBag },
  { href: ROUTES.PROFILE_TICKETS.href, label: "Tickets", icon: TicketIcon },
  { href: ROUTES.PROFILE_SECURITY.href, label: "Security", icon: ShieldCheck },
  { href: ROUTES.PROFILE_HELP.href, label: "Help", icon: CircleHelp },
];

const ProfileLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();

  const activeHref = useMemo(() => {
    const sorted = [...sidebarLinks].sort(
      (a, b) => b.href.length - a.href.length,
    );
    return sorted.find((link) => pathname.startsWith(link.href))?.href ?? "";
  }, [pathname]);

  return (
    <RequireAuth>
      <SectionContainer className="py-10 space-y-6">
        <h1 className="text-2xl font-bold">My Account</h1>
        <div className="flex flex-col md:flex-row gap-6 min-h-[600px]">
          <aside className="w-full md:w-56 shrink-0 md:sticky md:top-26 md:self-start">
            <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible border-b md:border-b-0 md:border-r pb-2 md:pb-0 md:pr-4">
              {sidebarLinks.map((link) => {
                const isActive = activeHref === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "text-cyan-700 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
                  >
                    <link.icon className="size-4 shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </SectionContainer>
    </RequireAuth>
  );
};

export default memo(ProfileLayout);
