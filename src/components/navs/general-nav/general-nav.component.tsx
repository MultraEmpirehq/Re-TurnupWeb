"use client";
import { LogoWhiteSVG } from "@/assets/svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { LogOut, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import React, {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAccountNav } from "./account-nav";
import AccountMenu, {
  accountDisplayName,
  accountInitials,
} from "../account-menu";
import useSignOut from "@/hooks/use-sign-out";

const navLinks = getRoutesByType(ROUTE_TYPE.NAV_ROUTE);

const linkClassName =
  "rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white data-[active]:bg-white/15 data-[active]:text-white data-[active]:hover:bg-white/20 data-[active]:focus:bg-white/20";

const GeneralNavComponent = () => {
  const userDetails = useUserStore((state) => state.userDetails);
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // On pages with a dark hero the header floats over it: clear at the top, then
  // frosted glass once the page moves. Everywhere else it is the usual brand bar.
  // Pages that open on a dark hero, which the header floats over.
  // (Explore is light now, like the app's, so it takes the usual brand bar.)
  const isHome = [ROUTES.HOME.href, ROUTES.PRICING.href].includes(pathname);
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  const isFloating = isHome && isScrolled;
  const isActive = (href: string) =>
    href !== ROUTES.HOME.href &&
    (pathname === href || pathname.startsWith(`${href}/`));
  // What a signed-in person sees depends on whether they attend, sell or run the platform.
  const accountNav = useMemo(
    () => getAccountNav(userDetails?.role),
    [userDetails?.role],
  );

  // Once signed in, the header keeps only what they come back for: Explore, plus
  // their own links. Sales pages and Contact move to the menu and footer.
  const routes = useMemo(() => {
    if (!userDetails) return navLinks;
    return navLinks.filter(
      (route) =>
        !route.shouldShowIn.includes(ROUTE_TYPE.HIDE_ON_LOGIN) &&
        !route.shouldShowIn.includes(ROUTE_TYPE.SIGNED_OUT_ONLY),
    );
  }, [userDetails]);
  // Login and sign up read as buttons on the right, not as more page links.
  const pageLinks = useMemo(
    () =>
      routes.filter(
        (route) => !route.shouldShowIn.includes(ROUTE_TYPE.HIDE_ON_LOGIN),
      ),
    [routes],
  );

  const initials = accountInitials(userDetails);
  const displayName = accountDisplayName(userDetails);

  const signOut = useSignOut();
  const handleLogout = useCallback(() => {
    setMobileOpen(false);
    signOut();
  }, [signOut]);

  const handleMobileNavigate = useCallback(
    (href: string) => {
      router.push(href);
      setMobileOpen(false);
    },
    [router],
  );

  return (
    <header
      className={cn(
        // One fixed height in every state (the page layout allows 70px for it), full
        // width, square edges. Only the background changes as the page scrolls.
        "top-0 z-9999 flex h-[70px] items-center px-5 transition-[background-color,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-8",
        isHome
          ? cn(
              "fixed inset-x-0 border-b",
              isFloating
                ? "border-white/10 bg-linear-to-r from-secondary-950/90 via-secondary-900/85 to-primary-950/85 shadow-[0_16px_40px_-18px_rgba(2,6,23,0.7)] backdrop-blur-xl"
                : "border-transparent",
            )
          : "sticky bg-linear-to-r from-secondary to-primary shadow-[0_8px_24px_-16px_rgba(2,6,23,0.45)]",
      )}
    >
      <div className="flex w-full flex-row items-center justify-between gap-4">
        <Link href={ROUTES.HOME.href} className="shrink-0">
          <Image src={LogoWhiteSVG} alt="Turnupz home" className="h-8 w-auto" />
        </Link>

        <NavigationMenu className="hidden md:flex" viewport={false}>
          <NavigationMenuList className="gap-1">
            {pageLinks.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink
                  asChild
                  active={isActive(link.href)}
                  className={linkClassName}
                >
                  <Link href={link.href}>{link.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
            {userDetails &&
              accountNav.headerLinks.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink
                    asChild
                    active={isActive(link.href)}
                    className={linkClassName}
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
          </NavigationMenuList>
        </NavigationMenu>

        {!userDetails && (
          <div className="hidden md:flex flex-row items-center gap-1">
            <Link href={ROUTES.LOGIN.href} className={linkClassName}>
              {ROUTES.LOGIN.label}
            </Link>
            <Button
              asChild
              className="h-10 rounded-full bg-white px-5 text-secondary-950 shadow-[0_6px_18px_-8px_rgba(255,255,255,0.6)] hover:bg-white/90"
            >
              <Link href={ROUTES.SIGNUP.href}>Sign up</Link>
            </Button>
          </div>
        )}

        {userDetails && (
          <div className="hidden md:flex flex-row items-center gap-3">
            <Button
              className="h-10 rounded-full bg-white/15 px-5 text-white ring-1 ring-white/25 hover:bg-white/25"
              onClick={() => router.push(accountNav.cta.href)}
            >
              {accountNav.cta.label}
            </Button>

            <AccountMenu variant="site" />
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
                      <AvatarImage src={userDetails.avatar} alt={displayName} />
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
                  {/* The menu groups already hold the header links, so they aren't repeated. */}
                  {accountNav.menuGroups.map((group, index) => (
                    <Fragment key={index}>
                      <Separator className="my-2" />
                      {group.map((link) => (
                        <button
                          key={link.href}
                          type="button"
                          onClick={() => handleMobileNavigate(link.href)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-muted transition-colors text-left cursor-pointer"
                        >
                          <link.icon className="size-4" />
                          {link.label}
                        </button>
                      ))}
                    </Fragment>
                  ))}
                </>
              )}
            </nav>

            <div className="border-t p-4 flex flex-col gap-2">
              {userDetails ? (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleMobileNavigate(accountNav.cta.href)}
                  >
                    {accountNav.cta.label}
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
      </div>
    </header>
  );
};

export default memo(GeneralNavComponent);
