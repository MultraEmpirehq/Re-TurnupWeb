"use client";

import useUserStore, { EUserRoles } from "@/stores/user-store";
import { ROUTES } from "@/lib/variables";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

/**
 * Where each role lands after signing in, when no explicit redirect was asked for.
 * Admins go to the console, vendors to their dashboard, everyone else to the site.
 */
const landingRouteFor = (role?: EUserRoles) => {
  switch (role) {
    case EUserRoles.ADMIN:
      return ROUTES.ADMIN_OVERVIEW.href;
    case EUserRoles.VENDOR:
      return ROUTES.DASHBOARD.href;
    default:
      return ROUTES.HOME.href;
  }
};

const Spinner = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
  </div>
);

const RedirectWatcher = () => {
  const userDetails = useUserStore((state) => state.userDetails);
  const isLoading = useUserStore((state) => state.isLoading);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isCompleteUserRoute =
    pathname === ROUTES.COMPLETE_USER_INFORMATION.href;

  useEffect(() => {
    if (isCompleteUserRoute) return;
    if (isLoading || !userDetails) return;

    const redirectTo = searchParams?.get("redirect");

    if (userDetails.isAccountCreationCompleted === false) {
      router.replace(
        redirectTo
          ? `${ROUTES.COMPLETE_USER_INFORMATION.href}?redirect=${encodeURIComponent(redirectTo)}`
          : ROUTES.COMPLETE_USER_INFORMATION.href,
      );
      return;
    }

    // An explicit redirect always wins, otherwise an admin or vendor could never be
    // linked to a page outside their own area.
    if (redirectTo) {
      router.replace(redirectTo);
      return;
    }

    router.replace(landingRouteFor(userDetails.role));
  }, [isLoading, userDetails, router, searchParams, isCompleteUserRoute]);

  return null;
};

const RedirectIfAuthenticated: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const userDetails = useUserStore((state) => state.userDetails);
  const isLoading = useUserStore((state) => state.isLoading);
  const pathname = usePathname();
  const isCompleteUserRoute =
    pathname === ROUTES.COMPLETE_USER_INFORMATION.href;

  if (isCompleteUserRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense fallback={null}>
        <RedirectWatcher />
      </Suspense>
      {isLoading || userDetails ? <Spinner /> : children}
    </>
  );
};

export default RedirectIfAuthenticated;
