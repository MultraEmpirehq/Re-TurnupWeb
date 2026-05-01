"use client";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import useUserStore from "@/stores/user-store";
import { BellIcon } from "lucide-react";
import React, { memo, useMemo } from "react";

const DashboardNav = () => {
  const userDetails = useUserStore((state) => state.userDetails);
  const fallBackName = useMemo(() => {
    if (!userDetails) return "AN";
    return (
      `${userDetails?.firstName?.charAt(0)}${userDetails?.lastName?.charAt(0)}` ||
      "AN"
    );
  }, [userDetails]);
  const fullName = useMemo(() => {
    if (!userDetails) return "Anonymous User";
    return userDetails?.name || "Anonymous User";
  }, [userDetails]);
  return (
    <div className="bg-white shadow sticky top-0 z-9999">
      <SectionContainer className="flex justify-between items-center gap-3 sm:gap-6 bg-white py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <SidebarTrigger className="size-9" />
          <h1 className="text-base sm:text-xl md:text-2xl font-bold text-secondary-800 truncate">
            Dashboard
          </h1>
        </div>
        <div className="flex flex-row items-center gap-2 sm:gap-3 shrink-0">
          <Button
            size={"icon-lg"}
            variant={"outline"}
            className="size-9 sm:size-10"
          >
            <BellIcon />
          </Button>
          <div className="p-1 bg-gray-100 rounded-lg flex flex-row items-center gap-1 sm:px-3">
            <Avatar className="size-8 text-xs border">
              <AvatarImage src={userDetails?.avatar} />
              <AvatarFallback className="bg-secondary-800 text-white">
                {fallBackName}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs font-medium text-secondary-800 hidden sm:block max-w-[140px] truncate">
              {fullName}
            </p>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
};

export default memo(DashboardNav);
