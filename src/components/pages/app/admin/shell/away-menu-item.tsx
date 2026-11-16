"use client";

import { constructErrorMessage } from "@/api/functions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { awayToast, useAdminAwayStatus, useSupportAway } from "@/hooks/use-admin-support-chats";
import { toast } from "@/lib/toast";
import { Moon } from "lucide-react";
import React, { memo } from "react";

/**
 * In the admin account menu: away (off shift, on leave) mutes alerts for you
 * and hands any live chats you had back to Support. The menu stays open.
 */
const AwayMenuItem = () => {
  const status = useAdminAwayStatus();
  const change = useSupportAway();
  const away = !!status.data?.away;

  const toggle = async () => {
    try {
      const result = await change.mutateAsync(!away);
      toast.success(awayToast(!away, result?.released));
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't change that."));
    }
  };

  return (
    <DropdownMenuItem
      className="cursor-pointer"
      disabled={!status.data || change.isPending}
      onSelect={(event) => {
        event.preventDefault();
        void toggle();
      }}
    >
      <Moon className="size-4" />
      <span className="flex-1">{away ? "You're away" : "Away"}</span>
      <Switch checked={away} tabIndex={-1} aria-hidden className="pointer-events-none" />
    </DropdownMenuItem>
  );
};

export default memo(AwayMenuItem);
