"use client";

import useUserStore from "@/stores/user-store";
import { ROUTES } from "@/lib/variables";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const userDetails = useUserStore((state) => state.userDetails);
  const isLoading = useUserStore((state) => state.isLoading);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !userDetails) {
      router.replace(ROUTES.LOGIN.href);
    }
  }, [isLoading, userDetails, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  if (!userDetails) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;
