"use client";
import { LogoWhiteSVG } from "@/assets/svg";
import CustomImageComponent from "@/components/ui/custom-image.component";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getRoutesByType } from "@/lib/functions";
import { ROUTE_TYPE } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { memo, useCallback } from "react";

const sideBarRoutes = getRoutesByType(ROUTE_TYPE.SHOW_ON_APP_SIDE_NAV);

const DashboardSideBar = () => {
  const pathname = usePathname();
  const getIsActive = useCallback(
    (href: string) => pathname === href,
    [pathname],
  );
  return (
    <Sidebar className="gap-10">
      <SidebarContent className="px-3 py-4 space-y-10">
        <SidebarHeader>
          <CustomImageComponent
            className="size-10"
            src={LogoWhiteSVG}
            alt="logo"
          />
        </SidebarHeader>
        <SidebarMenu className="space-y-6">
          {sideBarRoutes.map((route) => {
            const isActive = getIsActive(route?.href);
            return (
              <SidebarMenuItem
                key={route.href}
                className={cn(
                  "px-4 py-2 rounded-lg",
                  isActive && "bg-secondary-800 text-white",
                )}
                data-active={isActive}
              >
                <Link className="w-full inline-flex" href={route.href}>
                  {route.label}
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default memo(DashboardSideBar);
