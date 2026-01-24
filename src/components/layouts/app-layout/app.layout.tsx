"use client";
import GeneralFooterComponent from "@/components/footers/general-footer/general-footer.component";
import GeneralNavComponent from "@/components/navs/general-nav/general-nav.component";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import React, { memo, useMemo } from "react";

const authsToRemoveNav = ["/auth"];
const authsToRemoveFooter = ["/auth"];

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
      {!shouldHideNav && <GeneralNavComponent />}
      <div className="min-h-[calc(100vh-70px)]">{children}</div>
      {!shouldHideFooter && <GeneralFooterComponent />}
    </QueryClientProvider>
  );
};

export default memo(AppLayout);
