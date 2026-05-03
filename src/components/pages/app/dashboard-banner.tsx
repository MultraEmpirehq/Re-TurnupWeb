"use client";
import useUserStore from "@/stores/user-store";
import React, { memo, useMemo } from "react";

const DashboardBanner = () => {
  const userDetails = useUserStore((state) => state.userDetails);
  const fullName = useMemo(() => {
    if (!userDetails) return "Anonymous User";
    return userDetails?.name || "Anonymous User";
  }, [userDetails]);
  return (
    <div className="bg-secondary-800 p-4 sm:p-5 rounded-lg space-y-1 text-white">
      <h1 className="text-base sm:text-lg md:text-xl font-medium">
        Hi, {fullName} 👋
      </h1>
      <p className="text-xs opacity-70">
        Ready to start creating with Turnupz?
      </p>
    </div>
  );
};

export default memo(DashboardBanner);
