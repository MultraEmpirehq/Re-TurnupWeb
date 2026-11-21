"use client";

import { cn } from "@/lib/utils";
import useSidebarStore from "@/stores/sidebar-store";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import React, { memo } from "react";

/** Minimizes the console's side nav to icons, or brings it back. */
const SidebarToggle = ({ className }: { className?: string }) => {
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggle = useSidebarStore((state) => state.toggle);
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={collapsed ? "Expand the menu" : "Minimize the menu"}
      aria-expanded={!collapsed}
      title={collapsed ? "Expand the menu" : "Minimize the menu"}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Icon className="size-4.5" aria-hidden />
    </button>
  );
};

export default memo(SidebarToggle);
