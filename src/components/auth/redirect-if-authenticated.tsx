"use client";

import BrandLoader from "@/components/ui/brand-loader";
import { INTENT_PARAM, intentFrom } from "@/lib/auth-intent";
import { resolveLandingRoute } from "@/lib/auth-landing";
import {
  completeProfileRoute,
  needsProfileDetails,
} from "@/lib/profile-complete";
import useUserStore from "@/stores/user-store";
import { ROUTES } from "@/lib/variables";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

// The sign-in pages sit on the night sky, so their wait does too.
const Spinner = () => <BrandLoader fullScreen />;

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
    // Signed in already and came by the vendor door: straight on to hosting.
    const intent =
      pathname === ROUTES.VENDOR_LOGIN.href
        ? "vendor"
        : intentFrom(searchParams?.get(INTENT_PARAM));

    // A new account has a password before it has a name: finish sign-up first.
    if (needsProfileDetails(userDetails)) {
      router.replace(completeProfileRoute(redirectTo, intent));
      return;
    }

    // Same rule the login form follows, so whichever runs first sends them to the
    // same place.
    let isActive = true;
    resolveLandingRoute(userDetails, redirectTo, intent).then((route) => {
      if (isActive) router.replace(route);
    });
    return () => {
      isActive = false;
    };
  }, [isLoading, userDetails, router, searchParams, pathname, isCompleteUserRoute]);

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
