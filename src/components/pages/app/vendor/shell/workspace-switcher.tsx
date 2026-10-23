"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TWorkspaceListItem, useMyWorkspaces } from "@/hooks/use-vendor-team";
import { ROUTES } from "@/lib/variables";
import { cn } from "@/lib/utils";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import useWorkspaceStore, {
  useActiveWorkspace,
} from "@/stores/workspace-store";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { memo, useEffect } from "react";

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TZ";

/**
 * Switches between the signed-in person's own account and the organisers whose
 * teams they're on. Shown only to people on at least one team. Switching clears
 * every cached query, so nothing from one account shows up in the other.
 */
const WorkspaceSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userDetails = useUserStore((state) => state.userDetails);
  const isVendor = userDetails?.role === EUserRoles.VENDOR;
  const active = useActiveWorkspace();
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);
  const clearWorkspace = useWorkspaceStore((state) => state.clearWorkspace);
  const { data: workspaces = [], isFetched } = useMyWorkspaces();

  // Keep the saved workspace in step with the team: drop it if they were removed,
  // pick up permission changes the organiser made.
  useEffect(() => {
    if (!active || !isFetched || !userDetails?.id) return;
    const current = workspaces.find((item) => item.vendorId === active.vendorId);
    if (!current) {
      clearWorkspace();
      queryClient.removeQueries();
      return;
    }
    if (current.permissions.join() !== active.permissions.join()) {
      setWorkspace(userDetails.id, {
        vendorId: current.vendorId,
        name: current.name,
        image: current.image,
        permissions: current.permissions,
      });
    }
  }, [active, workspaces, isFetched, userDetails?.id, clearWorkspace, setWorkspace, queryClient]);

  if (!workspaces.length) return null;

  const switchTo = (item: TWorkspaceListItem | null) => {
    if (!userDetails?.id) return;
    if (item) {
      setWorkspace(userDetails.id, {
        vendorId: item.vendorId,
        name: item.name,
        image: item.image,
        permissions: item.permissions,
      });
    } else {
      clearWorkspace();
    }
    queryClient.removeQueries();
    router.push(
      item || isVendor ? ROUTES.DASHBOARD.href : ROUTES.HOME.href,
    );
  };

  const ownName =
    [userDetails?.firstName, userDetails?.lastName].filter(Boolean).join(" ") ||
    userDetails?.name ||
    "My account";
  const label = active?.name ?? ownName;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl border border-border bg-white p-2 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-secondary",
          className,
        )}
      >
        <Avatar className="size-8 rounded-lg">
          <AvatarImage src={active ? (active.image ?? undefined) : userDetails?.avatar} />
          <AvatarFallback className="rounded-lg bg-secondary-800 text-[11px] font-semibold text-white">
            {initialsOf(label)}
          </AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-semibold text-foreground">
            {label}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {active ? "Team workspace" : "Your account"}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[232px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch workspace
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => switchTo(null)} className="gap-2">
          <span className="min-w-0 flex-1 truncate">
            {ownName}
            <span className="block text-[11px] text-muted-foreground">
              {isVendor ? "Your account" : "Back to my tickets"}
            </span>
          </span>
          {!active && <Check className="size-4" aria-hidden />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {workspaces.map((item) => (
          <DropdownMenuItem
            key={item.vendorId}
            onSelect={() => switchTo(item)}
            className="gap-2"
          >
            <span className="min-w-0 flex-1 truncate">
              {item.name}
              <span className="block text-[11px] text-muted-foreground">
                Team · {item.permissions.length} permission
                {item.permissions.length === 1 ? "" : "s"}
              </span>
            </span>
            {active?.vendorId === item.vendorId && (
              <Check className="size-4" aria-hidden />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default memo(WorkspaceSwitcher);
