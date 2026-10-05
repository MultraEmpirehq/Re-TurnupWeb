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
import { cn } from "@/lib/utils";
import useUserStore, { TUserDetails } from "@/stores/user-store";
import { ChevronDown, Compass, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { Fragment, memo, useMemo } from "react";
import { getAccountNav } from "./general-nav/account-nav";

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
  const signOut = useSignOut();
  const accountNav = useMemo(
    () => getAccountNav(userDetails?.role),
    [userDetails?.role],
  );
  const initials = accountInitials(userDetails);
  const displayName = accountDisplayName(userDetails);
  const isSite = variant === "site";

  if (!userDetails) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 outline-none transition-colors",
            isSite
              ? "pr-3 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
              : "pr-2 hover:bg-secondary-50 focus-visible:ring-2 focus-visible:ring-secondary-300",
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
              "size-4",
              isSite ? "text-white/70" : "text-muted-foreground",
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
              onClick={() => router.push(ROUTES.EXPLORE.href)}
              className="cursor-pointer"
            >
              <Compass className="size-4" />
              Back to the site
            </DropdownMenuItem>
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
