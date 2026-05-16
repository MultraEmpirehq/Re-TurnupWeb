"use client";

import useUserStore from "@/stores/user-store";
import { ROUTES } from "@/lib/variables";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

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
    if (!isLoading && userDetails) {
      const redirectTo = searchParams?.get("redirect");
      router.replace(redirectTo || ROUTES.HOME.href);
    }
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
