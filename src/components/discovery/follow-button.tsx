"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { useFollows, useToggleFollow } from "@/hooks/use-discovery";
import { TFollowTargetType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { Check, Plus, UserCheck, UserPlus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { memo } from "react";
import { toast } from "@/lib/toast";

/**
 * Follow or unfollow a performer, venue or planner; what you follow is listed on
 * your profile. Signed out, it asks you to log in and brings you back.
 */
const FollowButton: React.FC<{
  type: TFollowTargetType;
  id?: string | null;
  name: string;
  className?: string;
  /** A round icon button, where there's no room for the word. */
  iconOnly?: boolean;
}> = ({ type, id, name, className, iconOnly }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isSignedIn = !!useUserStore((state) => state.userDetails);
  // Staff accounts can't follow (the api refuses), so it isn't offered.
  const isAdmin = useUserStore((state) => state.userDetails?.role === EUserRoles.ADMIN);
  const follows = useFollows();
  const toggle = useToggleFollow();
  if (!id || isAdmin) return null;

  const isFollowing = !!follows.data?.some(
    (item) => item.targetType === type && item.targetId === id,
  );

  const handleClick = async () => {
    if (!isSignedIn) {
      router.push(
        `${ROUTES.LOGIN.href}?redirect=${encodeURIComponent(pathname)}`,
      );
      return;
    }
    try {
      const now = await toggle.mutateAsync({ targetType: type, targetId: id });
      toast.success(now ? `Following ${name}` : `Unfollowed ${name}`);
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't update who you follow.",
        ),
      );
    }
  };

  return (
    <Button
      type="button"
      onClick={() => void handleClick()}
      disabled={toggle.isPending || (isSignedIn && follows.isLoading)}
      aria-pressed={isFollowing}
      {...(iconOnly
        ? {
            "aria-label": isFollowing ? `Unfollow ${name}` : `Follow ${name}`,
            title: isFollowing ? `Following ${name}` : `Follow ${name}`,
          }
        : {})}
      variant={isFollowing ? "outline" : "default"}
      className={cn(
        "rounded-full px-5",
        !isFollowing && "bg-secondary text-white hover:bg-secondary-600",
        className,
      )}
    >
      {isFollowing ? (
        iconOnly ? <UserCheck className="size-4" aria-hidden /> : <Check className="size-4" aria-hidden />
      ) : (
        iconOnly ? <UserPlus className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />
      )}
      {!iconOnly && (isFollowing ? "Following" : "Follow")}
    </Button>
  );
};

export default memo(FollowButton);
