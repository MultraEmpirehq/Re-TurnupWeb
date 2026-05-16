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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { getRoutesByType } from "@/lib/functions";
import { ROUTE_TYPE } from "@/lib/types";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import {
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { memo, useCallback, useMemo, useState } from "react";

const navLinks = getRoutesByType(ROUTE_TYPE.NAV_ROUTE);

const GeneralNavComponent = () => {
  const userDetails = useUserStore((state) => state.userDetails);
  const clearStore = useUserStore((state) => state.clearStore);
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    setMobileOpen(false);
  }, [clearStore, router]);

  const handleMobileNavigate = useCallback(
    (href: string) => {
      router.push(href);
      setMobileOpen(false);
    },
    [router],
  );

  return (
    <div className="py-3 bg-linear-to-r from-secondary to-primary sticky top-0 z-9999">
      <SectionContainer className="flex flex-row items-center justify-between gap-4">
        <Link href={ROUTES.HOME.href}>
          <Image src={LogoWhiteSVG} alt="logo" className="h-8" />
        </Link>

        <NavigationMenu className="hidden md:flex">
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
          <div className="hidden md:flex flex-row items-center gap-3">
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

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-white/10 transition-colors outline-none cursor-pointer"
            >
              <Menu className="size-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0 flex flex-col">
            <SheetHeader className="border-b">
              <SheetTitle>
                {userDetails ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarImage
                        src={userDetails.avatar}
                        alt={displayName}
                      />
                      <AvatarFallback className="bg-secondary text-white text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {displayName}
                      </p>
                      {userDetails.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {userDetails.email}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  "Menu"
                )}
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col flex-1 overflow-y-auto py-2">
              {routes.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className="px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}

              {userDetails && (
                <>
                  <Separator className="my-2" />
                  <button
                    type="button"
                    onClick={() =>
                      handleMobileNavigate(ROUTES.USER_PROFILE.href)
                    }
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-muted transition-colors text-left cursor-pointer"
                  >
                    <User className="size-4" />
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleMobileNavigate(ROUTES.PROFILE_ORDERS.href)
                    }
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-muted transition-colors text-left cursor-pointer"
                  >
                    <ShoppingBag className="size-4" />
                    Orders
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleMobileNavigate(ROUTES.PROFILE_SECURITY.href)
                    }
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-muted transition-colors text-left cursor-pointer"
                  >
                    <ShieldCheck className="size-4" />
                    Security
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleMobileNavigate(ROUTES.PROFILE_HELP.href)
                    }
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-muted transition-colors text-left cursor-pointer"
                  >
                    <CircleHelp className="size-4" />
                    Help
                  </button>
                </>
              )}
            </nav>

            <div className="border-t p-4 flex flex-col gap-2">
              {userDetails ? (
                <>
                  <Button
                    className="w-full"
                    onClick={() =>
                      handleMobileNavigate(ROUTES.CREATE_EVENT.href)
                    }
                  >
                    Create Event
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleMobileNavigate(ROUTES.LOGIN.href)}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleMobileNavigate(ROUTES.SIGNUP.href)}
                  >
                    Sign up
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </SectionContainer>
    </div>
  );
};

export default memo(GeneralNavComponent);
