"use client";

import useUserStore, { EUserRoles } from "@/stores/user-store";
import { ROUTES } from "@/lib/variables";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const userDetails = useUserStore((state) => state.userDetails);
  const isLoading = useUserStore((state) => state.isLoading);
  const router = useRouter();

  const isAdmin = userDetails?.role === EUserRoles.ADMIN;

  useEffect(() => {
    if (!isLoading && userDetails && !isAdmin) {
      router.replace(ROUTES.DASHBOARD.href);
    }
  }, [isLoading, userDetails, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  if (!userDetails || !isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAdmin;
