"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import React, { memo } from "react";

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <SidebarProvider>{children}</SidebarProvider>;
};

export default memo(AppLayout);
