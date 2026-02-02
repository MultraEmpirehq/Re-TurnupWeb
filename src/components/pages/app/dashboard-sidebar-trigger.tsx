import { SidebarTrigger } from "@/components/ui/sidebar";
import React, { memo } from "react";

const DashboardSideBarTrigger = () => {
  return (
    <div className="absolute top-0 left-0">
      <SidebarTrigger />
    </div>
  );
};

export default memo(DashboardSideBarTrigger);
