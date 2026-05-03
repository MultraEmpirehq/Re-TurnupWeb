"use client";

import useUserStore from "@/stores/user-store";
import { ROUTES } from "@/lib/variables";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const RedirectIfAuthenticated: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const userDetails = useUserStore((state) => state.userDetails);
  const isLoading = useUserStore((state) => state.isLoading);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && userDetails) {
      const redirectTo = searchParams?.get("redirect");
      router.replace(redirectTo || ROUTES.HOME.href);
    }
  }, [isLoading, userDetails, router, searchParams]);

  if (isLoading || userDetails) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  return <>{children}</>;
};

export default RedirectIfAuthenticated;
