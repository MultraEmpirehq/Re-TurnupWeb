"use client";

import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/variables";
import { SearchIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { memo, useState } from "react";
import WorkspaceTopBar from "./workspace-top-bar";
import { vendorSectionLabel } from "./vendor/shell/vendor-nav";

/**
 * The vendor top bar: the shared workspace bar, plus the vendor search. Settings and
 * the rest of the account live in the account menu.
 */
const DashboardNav: React.FC<{ onOpenNav: () => void }> = ({ onOpenNav }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [navSearchQuery, setNavSearchQuery] = useState("");

  const getSearchTarget = (query: string) => {
    const normalizedQuery = query.toLowerCase();

    if (pathname.startsWith(ROUTES.TICKETS.href)) return ROUTES.TICKETS.href;
    if (pathname.startsWith(ROUTES.MESSAGES.href)) return ROUTES.MESSAGES.href;
    if (pathname.startsWith(ROUTES.WALLET.href)) return ROUTES.WALLET.href;
    if (pathname.startsWith(ROUTES.NOTIFICATIONS.href)) {
      return ROUTES.NOTIFICATIONS.href;
    }

    if (
      normalizedQuery.includes("ticket") ||
      normalizedQuery.includes("scan")
    ) {
      return ROUTES.TICKETS.href;
    }
    if (
      normalizedQuery.includes("chat") ||
      normalizedQuery.includes("message")
    ) {
      return ROUTES.MESSAGES.href;
    }
    if (
      normalizedQuery.includes("wallet") ||
      normalizedQuery.includes("payout") ||
      normalizedQuery.includes("transfer")
    ) {
      return ROUTES.WALLET.href;
    }
    if (
      normalizedQuery.includes("notification") ||
      normalizedQuery.includes("alert")
    ) {
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
    <WorkspaceTopBar
      workspace="Vendor"
      section={vendorSectionLabel(pathname)}
      onOpenNav={onOpenNav}
    >
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
    </WorkspaceTopBar>
  );
};

export default memo(DashboardNav);
