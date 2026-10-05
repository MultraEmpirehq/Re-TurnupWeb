"use client";

import AccountMenu from "@/components/navs/account-menu";
import { NovuInbox } from "@/components/notifications/novu-inbox";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";
import React, { memo } from "react";

/**
 * The bar above the vendor and admin sidebars. Both workspaces share it, so they
 * look and behave the same: the drawer button below `lg`, a breadcrumb, then any
 * workspace tools, notifications and the account menu. Its 70px height matches the
 * site header and the sidebar's logo row, so their bottom edges line up.
 */
const WorkspaceTopBar: React.FC<{
  workspace: string;
  section: string;
  onOpenNav: () => void;
  /** Tools for this workspace only, such as the vendor search. */
  children?: React.ReactNode;
}> = ({ workspace, section, onOpenNav, children }) => (
  <header className="sticky top-0 z-20 flex h-[70px] shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
    <div className="flex min-w-0 items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="size-[38px] shrink-0 rounded-xl text-muted-foreground lg:hidden"
      >
        <MenuIcon className="size-4" />
      </Button>
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-2 text-sm">
          <li className="hidden text-muted-foreground sm:block">{workspace}</li>
          <li aria-hidden className="hidden text-muted-foreground sm:block">
            /
          </li>
          <li className="truncate font-semibold text-foreground">{section}</li>
        </ol>
      </nav>
    </div>

    <div className="flex min-w-0 items-center gap-2">
      {children}
      <NovuInbox />
      <AccountMenu variant="workspace" />
    </div>
  </header>
);

export default memo(WorkspaceTopBar);
