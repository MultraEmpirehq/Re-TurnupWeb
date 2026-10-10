"use client";

import { constructErrorMessage } from "@/api/functions";
import { useHiddenEventIds, useToggleHiddenEvent } from "@/hooks/use-discovery";
import useUserStore from "@/stores/user-store";
import { Eye, EyeOff } from "lucide-react";
import React, { memo } from "react";
import { toast } from "sonner";

/**
 * "Not for me": hides the event from your listings (Explore, the home feed and
 * the app), or brings it back. Signed-in attendees only; organisers see their own.
 */
const HideEventButton: React.FC<{ eventId: string; isOwner?: boolean }> = ({
  eventId,
  isOwner,
}) => {
  const isSignedIn = !!useUserStore((state) => state.userDetails);
  const { data: hiddenIds = [] } = useHiddenEventIds();
  const toggle = useToggleHiddenEvent();
  if (!isSignedIn || isOwner) return null;
  const isHidden = hiddenIds.includes(eventId);

  const handleClick = async () => {
    try {
      const now = await toggle.mutateAsync(eventId);
      toast.success(
        now
          ? "Hidden. You won't see this event in your listings."
          : "This event will show in your listings again.",
      );
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't update this event.",
        ),
      );
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={toggle.isPending}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
    >
      {isHidden ? (
        <Eye className="size-4" aria-hidden />
      ) : (
        <EyeOff className="size-4" aria-hidden />
      )}
      {isHidden ? "Show in my listings again" : "Not for me, hide it"}
    </button>
  );
};

export default memo(HideEventButton);
