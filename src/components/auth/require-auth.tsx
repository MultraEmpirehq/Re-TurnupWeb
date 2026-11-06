"use client";

import BrandLoader from "@/components/ui/brand-loader";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { isSharedWithAdmins } from "@/lib/admin-routes";
import { ROUTES } from "@/lib/variables";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userDetails = useUserStore((state) => state.userDetails);
  const isLoading = useUserStore((state) => state.isLoading);
  const router = useRouter();
  const pathname = usePathname();
  const isDevelopment = process.env.NODE_ENV === "development";
  // Admin accounts are staff: the console, plus their own account pages
  // (profile, settings, notifications and messages).
  const adminElsewhere =
    userDetails?.role === EUserRoles.ADMIN &&
    !!pathname &&
    !pathname.startsWith(ROUTES.ADMIN_OVERVIEW.href) &&
    !isSharedWithAdmins(pathname);

  useEffect(() => {
    if (adminElsewhere) {
      router.replace(ROUTES.ADMIN_OVERVIEW.href);
      return;
    }
    if (isDevelopment) {
      return;
    }
    if (!isLoading && !userDetails) {
      // The admin console has its own sign-in; admins are refused on the public one.
      router.replace(
        pathname?.startsWith(ROUTES.ADMIN_OVERVIEW.href)
          ? ROUTES.ADMIN_LOGIN.href
          : ROUTES.LOGIN.href,
      );
    }
  }, [adminElsewhere, isDevelopment, isLoading, userDetails, router, pathname]);

  if (adminElsewhere) {
    return null;
  }

  if (isDevelopment) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <BrandLoader />
      </div>
    );
  }

  if (!userDetails) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;
