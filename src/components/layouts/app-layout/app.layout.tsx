"use client";
import AuthProvider from "@/components/auth/auth-provider";
import GeneralFooterComponent from "@/components/footers/general-footer/general-footer.component";
import GeneralNavComponent from "@/components/navs/general-nav/general-nav.component";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NextTopLoader from "nextjs-toploader";
import { usePathname } from "next/navigation";
import React, { memo, useMemo, useState } from "react";

// The Coming soon page stands on its own, with no site header or footer.
const authsToRemoveNav = ["/auth", "/app", "/admin", "/coming-soon"];
const authsToRemoveFooter = ["/auth", "/app", "/admin", "/coming-soon"];

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  // One client per browser session; at module level the server would share a single
  // cache between every request and user.
  const [queryClient] = useState(() => new QueryClient());
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
        <NextTopLoader color="#00b2ff" height={3} showSpinner={false} />
        {!shouldHideNav && <GeneralNavComponent />}
        <div className="min-h-[calc(100vh-70px)]">{children}</div>
        {!shouldHideFooter && <GeneralFooterComponent />}
        <Toaster position="top-center" richColors duration={7000} />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default memo(AppLayout);
