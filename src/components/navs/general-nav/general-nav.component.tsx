"use client";
import OrganiserToDoChip from "@/components/pages/app/organiser-to-do-chip";
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
import { ChevronRight, LogOut, Menu } from "lucide-react";
import Image from "next/image";
import Link, { useSiteNavigate } from "@/components/ui/site-link";
import { usePathname } from "next/navigation";
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
  // Until the saved sign-in is read, we don't know who this is: show neither
  // "Login / Sign up" nor someone's menu, so nothing flashes and swaps.
  const checkingSignIn = useUserStore((state) => state.isLoading);
  const navigate = useSiteNavigate();
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
    if (!userDetails && !checkingSignIn) return navLinks;
    return navLinks.filter(
      (route) =>
        !route.shouldShowIn.includes(ROUTE_TYPE.HIDE_ON_LOGIN) &&
        !route.shouldShowIn.includes(ROUTE_TYPE.SIGNED_OUT_ONLY),
    );
  }, [userDetails, checkingSignIn]);
  // Login and sign up read as buttons on the right, not as more page links.
  const pageLinks = useMemo(
    () =>
      routes.filter(
        (route) => !route.shouldShowIn.includes(ROUTE_TYPE.HIDE_ON_LOGIN),
      ),
    [routes],
  );
  const mobilePageLinks = useMemo(
    () =>
      routes.filter(
        (route) =>
          route.href !== ROUTES.LOGIN.href &&
          route.href !== ROUTES.SIGNUP.href,
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
      navigate(href);
      setMobileOpen(false);
    },
    [navigate],
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

        <NavigationMenu className="hidden lg:flex" viewport={false}>
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

        {!userDetails && checkingSignIn && (
          <div
            aria-hidden
            className="hidden h-10 w-36 animate-pulse rounded-full bg-white/15 lg:block"
          />
        )}

        {!userDetails && !checkingSignIn && (
          <div className="hidden lg:flex flex-row items-center gap-1">
            <Button
              asChild
              className="h-10 rounded-full bg-card px-5 text-secondary-950 shadow-[0_6px_18px_-8px_rgba(255,255,255,0.6)] hover:bg-white/90"
            >
              <Link href={ROUTES.LOGIN.href}>Login / Sign up</Link>
            </Button>
          </div>
        )}

        {userDetails && (
          <div className="hidden lg:flex flex-row items-center gap-3">
            <OrganiserToDoChip tone="onDark" />
            <Button
              className="h-10 rounded-full bg-white/15 px-5 text-white ring-1 ring-white/25 hover:bg-white/25"
              onClick={() => navigate(accountNav.cta.href)}
            >
              {accountNav.cta.label}
            </Button>

            <AccountMenu variant="site" />
          </div>
        )}

        {/* What an organiser still has to do, on every page; nothing for attendees. */}
        {userDetails && (
          <div className="ml-auto lg:hidden">
            <OrganiserToDoChip tone="onDark" />
          </div>
        )}

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-white/10 transition-colors outline-none cursor-pointer"
            >
              <Menu className="size-6" />
            </button>
          </SheetTrigger>
          {/* Phone menu: the brand bar on top, big rows, and the sign-in
              buttons pinned where they're always on screen (dvh, not vh). */}
          <SheetContent
            side="right"
            className="flex h-dvh w-[86vw] max-w-sm flex-col gap-0 border-l-0 p-0 [&>button:last-child]:top-5 [&>button:last-child]:right-5 [&>button:last-child]:text-white [&>button:last-child]:opacity-90 [&>button:last-child>svg]:size-5"
          >
            <SheetHeader className="bg-primary px-5 pt-6 pb-5 text-left text-white">
              <SheetTitle className="text-white">
                {userDetails ? (
                  <div className="flex items-center gap-3 pr-8">
                    <Avatar className="size-11 ring-2 ring-white/40">
                      <AvatarImage src={userDetails.avatar} alt={displayName} />
                      <AvatarFallback className="bg-card text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="truncate text-base font-semibold">{displayName}</p>
                      {userDetails.email && (
                        <p className="truncate text-xs font-normal text-white/75">{userDetails.email}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 pr-8">
                    <Image src={LogoWhiteSVG} alt="Turnupz" className="h-8 w-auto" />
                    <p className="text-sm font-normal text-white/80">Find what&apos;s on, book in a few taps.</p>
                  </div>
                )}
              </SheetTitle>
            </SheetHeader>

            <nav aria-label="Menu" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {mobilePageLinks.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center justify-between rounded-xl px-4 text-base font-semibold transition-colors",
                        active ? "bg-primary-50 text-primary" : "text-secondary-950 hover:bg-secondary-50",
                      )}
                    >
                      {link.label}
                      <ChevronRight className="size-4 opacity-50" aria-hidden />
                    </Link>
                  </SheetClose>
                );
              })}

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
                          className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-4 text-left text-base font-medium text-secondary-950 transition-colors hover:bg-secondary-50"
                        >
                          <link.icon className="size-5 text-secondary-950/60" />
                          {link.label}
                        </button>
                      ))}
                    </Fragment>
                  ))}
                </>
              )}
            </nav>

            <div className="flex flex-col gap-2 border-t border-secondary-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {userDetails ? (
                <>
                  <Button
                    className="h-12 w-full rounded-full text-base"
                    onClick={() => handleMobileNavigate(accountNav.cta.href)}
                  >
                    {accountNav.cta.label}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-full text-base"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4" />
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="h-12 w-full rounded-full text-base"
                    onClick={() => handleMobileNavigate(ROUTES.SIGNUP.href)}
                  >
                    Create account
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-full text-base"
                    onClick={() => handleMobileNavigate(ROUTES.LOGIN.href)}
                  >
                    Log in
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
