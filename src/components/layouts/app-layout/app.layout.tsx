"use client";
import AuthProvider from "@/components/auth/auth-provider";
import GeneralFooterComponent from "@/components/footers/general-footer/general-footer.component";
import GeneralNavComponent from "@/components/navs/general-nav/general-nav.component";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import React, { memo, useMemo } from "react";

const authsToRemoveNav = ["/auth", "/app"];
const authsToRemoveFooter = ["/auth", "/app"];

const queryClient = new QueryClient();

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const shouldHideNav = useMemo(
    () => authsToRemoveNav.some((route) => pathname.startsWith(route)),
    [pathname],
  );
  const shouldHideFooter = useMemo(
    () => authsToRemoveFooter.some((route) => pathname.startsWith(route)),
    [pathname],
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {!shouldHideNav && <GeneralNavComponent />}
        <div className="min-h-[calc(100vh-70px)]">{children}</div>
        {!shouldHideFooter && <GeneralFooterComponent />}
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default memo(AppLayout);
