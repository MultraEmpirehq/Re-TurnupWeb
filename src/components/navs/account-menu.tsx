"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useSignOut from "@/hooks/use-sign-out";
import { ROUTES } from "@/lib/variables";
import { siteHref } from "@/lib/domains";
import { cn } from "@/lib/utils";
import useUserStore, { EUserRoles, TUserDetails } from "@/stores/user-store";
import { ChevronDown, Compass, LogOut, UsersRound } from "lucide-react";
import { useMyWorkspaces } from "@/hooks/use-vendor-team";
import useWorkspaceStore from "@/stores/workspace-store";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { Fragment, memo, useMemo } from "react";
import { getAccountNav } from "./general-nav/account-nav";
import { ADMIN_NAV_GROUPS } from "@/components/pages/app/admin/shell/admin-nav";
import { VENDOR_NAV_ITEMS } from "@/components/pages/app/vendor/shell/vendor-nav";

/** Everything the console's side nav already links to, so the menu doesn't repeat it. */
const SIDE_NAV_HREFS = {
  admin: new Set([ROUTES.ADMIN_OVERVIEW.href, ...ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href))]),
  vendor: new Set(VENDOR_NAV_ITEMS.map((item) => item.href)),
};
import AwayMenuItem from "@/components/pages/app/admin/shell/away-menu-item";

export const accountInitials = (user?: TUserDetails | null) => {
  const first = user?.firstName?.[0] ?? "";
  const last = user?.lastName?.[0] ?? "";
  if (first || last) return `${first}${last}`.toUpperCase();
  return user?.username?.[0]?.toUpperCase() ?? "U";
};

export const accountDisplayName = (user?: TUserDetails | null) => {
  if (user?.firstName) {
    return user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName;
  }
  return user?.name || user?.username || "Account";
};

/**
 * The one account menu every header uses, so it lists the same things wherever
 * someone opens it. `site` sits on the brand-coloured site header; `workspace`
 * sits on the white bar above the vendor and admin sidebars, where it also offers
 * a way back to the site.
 */
const AccountMenu: React.FC<{ variant: "site" | "workspace" }> = ({
  variant,
}) => {
  const router = useRouter();
  const userDetails = useUserStore((state) => state.userDetails);
  const isAdmin = userDetails?.role === EUserRoles.ADMIN;
  const signOut = useSignOut();
  const queryClient = useQueryClient();
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);
  // On the site, the way in to the organisers' teams this person is on.
  const { data: workspaces = [] } = useMyWorkspaces();
  const isSite = variant === "site";
  const accountNav = useMemo(() => {
    const nav = getAccountNav(userDetails?.role, !!userDetails?.isBusiness);
    // In the console the side nav is right there: only what it doesn't have.
    if (isSite) return nav;
    const inSideNav = userDetails?.role === EUserRoles.ADMIN ? SIDE_NAV_HREFS.admin : SIDE_NAV_HREFS.vendor;
    return {
      ...nav,
      menuGroups: nav.menuGroups
        .map((group) => group.filter((link) => !inSideNav.has(link.href)))
        .filter((group) => group.length > 0),
    };
  }, [isSite, userDetails?.role, userDetails?.isBusiness]);
  const initials = accountInitials(userDetails);
  const displayName = accountDisplayName(userDetails);

  if (!userDetails) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-full p-1 outline-none transition-colors",
            isSite
              ? // No shape on hover; the ring is for keyboard focus only.
                "pr-2 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/40"
              : "pr-1.5 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-secondary-300",
          )}
        >
          <Avatar
            className={cn(
              "size-8",
              isSite
                ? "border-2 border-white/30"
                : "border border-secondary-100",
            )}
          >
            <AvatarImage src={userDetails.avatar} alt={displayName} />
            <AvatarFallback
              className={cn(
                "text-xs font-semibold",
                isSite
                  ? "bg-white/20 text-white"
                  : "bg-secondary-800 text-white",
              )}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "hidden max-w-[120px] truncate text-sm font-medium sm:inline",
              isSite ? "text-white" : "text-foreground",
            )}
          >
            {displayName}
          </span>
          <ChevronDown
            className={cn(
              // Close to the name, with the same room the picture has on the left.
              "-ml-0.5 size-4 shrink-0",
              isSite ? "text-white/70" : "text-muted-foreground",
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        // Just clears the header below the button, with a small gap.
        sideOffset={variant === "site" ? 17 : 8}
        className="w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">{displayName}</p>
            {userDetails.email && (
              <p className="truncate text-xs text-muted-foreground">
                {userDetails.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        {!isSite && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                // Admins are on turnupz.com: the website opens beside the console.
                isAdmin
                  ? window.open(siteHref(ROUTES.EXPLORE.href), "_blank", "noopener")
                  : router.push(ROUTES.EXPLORE.href)
              }
              className="cursor-pointer"
            >
              <Compass className="size-4" />
              {isAdmin ? "View the website" : "Back to the site"}
            </DropdownMenuItem>
            {/* Admins only: mutes their alerts while they're off. */}
            {isAdmin && <AwayMenuItem />}
          </>
        )}
        {isSite && workspaces.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Team workspaces
            </DropdownMenuLabel>
            {workspaces.map((item) => (
              <DropdownMenuItem
                key={item.vendorId}
                onClick={() => {
                  setWorkspace(userDetails.id, {
                    vendorId: item.vendorId,
                    name: item.name,
                    image: item.image,
                    permissions: item.permissions,
                  });
                  queryClient.removeQueries();
                  router.push(ROUTES.DASHBOARD.href);
                }}
                className="cursor-pointer"
              >
                <UsersRound className="size-4" />
                <span className="truncate">{item.name}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
        {accountNav.menuGroups.map((group, index) => (
          <Fragment key={index}>
            <DropdownMenuSeparator />
            {group.map((link) => (
              <DropdownMenuItem
                key={link.href}
                onClick={() => router.push(link.href)}
                className="cursor-pointer"
              >
                <link.icon className="size-4" />
                {link.label}
              </DropdownMenuItem>
            ))}
          </Fragment>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={signOut}
          variant="destructive"
          className="cursor-pointer"
        >
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default memo(AccountMenu);
