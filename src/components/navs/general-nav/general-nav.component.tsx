"use client";
import { LogoWhiteSVG } from "@/assets/svg";
import SectionContainer from "@/components/layouts/section-container/section-container";
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
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { getRoutesByType } from "@/lib/functions";
import { ROUTE_TYPE } from "@/lib/types";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import {
  ChevronDown,
  CircleHelp,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { memo, useCallback, useMemo } from "react";

const navLinks = getRoutesByType(ROUTE_TYPE.NAV_ROUTE);

const GeneralNavComponent = () => {
  const userDetails = useUserStore((state) => state.userDetails);
  const clearStore = useUserStore((state) => state.clearStore);
  const router = useRouter();

  const routes = useMemo(() => {
    if (!userDetails) return navLinks;
    return navLinks.filter(
      (route) => !route.shouldShowIn.includes(ROUTE_TYPE.HIDE_ON_LOGIN),
    );
  }, [userDetails]);

  const initials = useMemo(() => {
    const first = userDetails?.firstName?.[0] ?? "";
    const last = userDetails?.lastName?.[0] ?? "";
    if (first || last) return `${first}${last}`.toUpperCase();
    return userDetails?.username?.[0]?.toUpperCase() ?? "U";
  }, [userDetails]);

  const displayName = useMemo(() => {
    if (userDetails?.firstName) {
      return userDetails.lastName
        ? `${userDetails.firstName} ${userDetails.lastName}`
        : userDetails.firstName;
    }
    return userDetails?.username ?? "User";
  }, [userDetails]);

  const handleLogout = useCallback(() => {
    clearStore();
    router.push(ROUTES.HOME.href);
  }, [clearStore, router]);

  return (
    <div className="py-3 bg-linear-to-r from-secondary to-primary sticky top-0 z-9999">
      <SectionContainer className="flex flex-row items-center justify-between">
        <Link href={ROUTES.HOME.href}>
          <Image src={LogoWhiteSVG} alt="logo" className="h-8" />
        </Link>

        <NavigationMenu>
          <NavigationMenuList className="text-white">
            {routes.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink asChild>
                  <Link href={link.href}>{link.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {userDetails && (
          <div className="flex flex-row items-center gap-3">
            <Button
              variant={"secondary"}
              className="text-white"
              onClick={() => router.push(ROUTES.CREATE_EVENT.href)}
            >
              Create Event
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-white/10 cursor-pointer outline-none">
                  <Avatar className="size-8 border-2 border-white/30">
                    <AvatarImage src={userDetails.avatar} alt={displayName} />
                    <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white text-sm font-medium max-w-[120px] truncate hidden sm:inline">
                    {displayName}
                  </span>
                  <ChevronDown className="size-4 text-white/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold">{displayName}</p>
                    {userDetails.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {userDetails.email}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push(ROUTES.USER_PROFILE.href)}
                  className="cursor-pointer"
                >
                  <User className="size-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(ROUTES.PROFILE_ORDERS.href)}
                  className="cursor-pointer"
                >
                  <ShoppingBag className="size-4" />
                  Orders
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(ROUTES.PROFILE_SECURITY.href)}
                  className="cursor-pointer"
                >
                  <ShieldCheck className="size-4" />
                  Security
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(ROUTES.PROFILE_HELP.href)}
                  className="cursor-pointer"
                >
                  <CircleHelp className="size-4" />
                  Help
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
        )}
      </SectionContainer>
    </div>
  );
};

export default memo(GeneralNavComponent);
