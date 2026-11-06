"use client";

import { postData } from "@/api";
import { cn } from "@/lib/utils";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/variables";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { Loader2, MessageCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { memo, useState } from "react";
import { toast } from "@/lib/toast";

/**
 * Opens a chat with the event's organiser (one per organiser, reused), with this
 * event carried along so the chat shows it and the first message is about it.
 */
const MessageOrganiserButton: React.FC<{
  eventId: string;
  isOwner?: boolean;
  className?: string;
  /** A round icon button, where there's no room for the words. */
  iconOnly?: boolean;
}> = ({ eventId, isOwner, className, iconOnly }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isSignedIn = !!useUserStore((state) => state.userDetails);
  const isAdmin = useUserStore((state) => state.userDetails?.role === EUserRoles.ADMIN);
  // Admins only with "Contact organisers" (the api checks it too).
  const { has, isLoading } = useAdminPermissions();
  const [opening, setOpening] = useState(false);
  if (isOwner) return null;
  if (isAdmin && (isLoading || !has("ORGANISERS_CONTACT"))) return null;

  const open = async () => {
    if (!isSignedIn) {
      router.push(
        `${ROUTES.LOGIN.href}?redirect=${encodeURIComponent(pathname)}`,
      );
      return;
    }
    setOpening(true);
    try {
      const { data } = await postData<{ eventId: string }, { id: string }>(
        "/chats/direct",
        {
          eventId,
        },
      );
      const chatId = data?.data?.id;
      if (!chatId) throw new Error("No chat");
      router.push(`${ROUTES.MESSAGES.href}?chat=${chatId}&about=${eventId}`);
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't open the chat. Please try again.",
        ),
      );
      setOpening(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void open()}
      disabled={opening}
      aria-label={iconOnly ? "Message organiser" : undefined}
      title={iconOnly ? "Message organiser" : undefined}
      className={cn("gap-2", className)}
    >
      {opening ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <MessageCircle className="size-4" aria-hidden />
      )}
      {!iconOnly && "Message organiser"}
    </Button>
  );
};

export default memo(MessageOrganiserButton);
