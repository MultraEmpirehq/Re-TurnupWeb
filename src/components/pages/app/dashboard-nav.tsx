"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import {
  LogOut,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { memo, useCallback, useMemo, useState } from "react";
import { NovuInbox } from "@/components/notifications/novu-inbox";
import { vendorSectionLabel } from "./vendor/shell/vendor-nav";

/**
 * The vendor top bar. The section links live in the sidebar; this keeps search,
 * notifications, settings and the account menu, plus the button that opens the
 * sidebar below `lg`.
 */
const DashboardNav: React.FC<{ onOpenNav: () => void }> = ({ onOpenNav }) => {
  const pathname = usePathname();
  const router = useRouter();
  const userDetails = useUserStore((state) => state.userDetails);
  const clearStore = useUserStore((state) => state.clearStore);
  const [navSearchQuery, setNavSearchQuery] = useState("");

  const fallBackName = useMemo(() => {
    if (!userDetails) return "TZ";
    return (
      `${userDetails?.firstName?.charAt(0) ?? ""}${userDetails?.lastName?.charAt(0) ?? ""}` ||
      "TZ"
    );
  }, [userDetails]);

  const fullName = useMemo(() => {
    if (!userDetails) return "Turnupz Vendor";
    return userDetails?.name || "Turnupz Vendor";
  }, [userDetails]);

  const handleLogout = useCallback(() => {
    clearStore();
    router.push(ROUTES.HOME.href);
  }, [clearStore, router]);

  const getSearchTarget = (query: string) => {
    const normalizedQuery = query.toLowerCase();

    if (pathname.startsWith(ROUTES.TICKETS.href)) return ROUTES.TICKETS.href;
    if (pathname.startsWith(ROUTES.MESSAGES.href)) return ROUTES.MESSAGES.href;
    if (pathname.startsWith(ROUTES.WALLET.href)) return ROUTES.WALLET.href;
    if (pathname.startsWith(ROUTES.NOTIFICATIONS.href)) {
      return ROUTES.NOTIFICATIONS.href;
    }

    if (normalizedQuery.includes("ticket") || normalizedQuery.includes("scan")) {
      return ROUTES.TICKETS.href;
    }
    if (normalizedQuery.includes("chat") || normalizedQuery.includes("message")) {
      return ROUTES.MESSAGES.href;
    }
    if (
      normalizedQuery.includes("wallet") ||
      normalizedQuery.includes("payout") ||
      normalizedQuery.includes("transfer")
    ) {
      return ROUTES.WALLET.href;
    }
    if (normalizedQuery.includes("notification") || normalizedQuery.includes("alert")) {
      return ROUTES.NOTIFICATIONS.href;
    }

    return ROUTES.EVENTS.href;
  };

  const handleNavSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = navSearchQuery.trim();
    if (!query) return;

    router.push(`${getSearchTarget(query)}?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="size-[38px] shrink-0 rounded-xl text-muted-foreground lg:hidden"
        >
          <MenuIcon className="size-4" />
        </Button>
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-2 text-sm">
            <li className="hidden text-muted-foreground sm:block">Vendor</li>
            <li aria-hidden className="hidden text-muted-foreground sm:block">
              /
            </li>
            <li className="truncate font-semibold text-foreground">
              {vendorSectionLabel(pathname)}
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <form
          onSubmit={handleNavSearch}
          className="relative hidden w-[clamp(14rem,28vw,24rem)] md:block"
        >
          <Input
            value={navSearchQuery}
            onChange={(event) => setNavSearchQuery(event.target.value)}
            placeholder="Search events, tickets, chats"
            className="h-10 rounded-xl border-secondary-100 bg-secondary-50 pl-4 pr-11 text-sm shadow-none"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-secondary-400 hover:bg-white hover:text-secondary-700"
            aria-label="Search vendor workspace"
          >
            <SearchIcon className="size-4" />
          </button>
        </form>
        <NovuInbox />
        <Button
          asChild
          size="icon"
          variant="outline"
          className="rounded-full border-secondary-100 bg-white text-secondary-600 shadow-none hover:bg-secondary-50"
        >
          <Link href={ROUTES.SETTINGS.href} aria-label="Settings">
            <SettingsIcon className="size-4" />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="block cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-secondary-300"
            >
              <Avatar className="size-9 border border-secondary-100 bg-secondary-50 shadow-sm">
                <AvatarImage src={userDetails?.avatar} />
                <AvatarFallback className="bg-secondary-50 text-sm font-semibold text-secondary-800">
                  {fallBackName}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">{fullName}</p>
                {userDetails?.email && (
                  <p className="truncate text-xs text-muted-foreground">
                    {userDetails.email}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push(ROUTES.PROFILE.href)}
              className="cursor-pointer"
            >
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(ROUTES.SETTINGS.href)}
              className="cursor-pointer"
            >
              <SettingsIcon className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              variant="destructive"
              className="cursor-pointer"
            >
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default memo(DashboardNav);
