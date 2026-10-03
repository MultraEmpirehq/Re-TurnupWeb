"use client";

import { Inbox } from "@novu/react";
import { useRouter } from "next/navigation";
import { BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInboxToken } from "@/hooks/use-inbox-token";
import { useUnreadNotificationCount } from "@/hooks/use-unread-notifications";
import { ROUTES } from "@/lib/variables";
import Link from "next/link";

/**
 * The bell in the dashboard nav.
 *
 * Novu owns the unread count and the live updates, so while it is switched on this
 * replaces the plain link. When the api reports no inbox credentials, which is the
 * case while notifications still run through OneSignal, it falls back to the link and
 * the notifications page keeps working exactly as before. The link carries its own
 * unread badge so new notifications are visible without opening anything.
 */
export const NovuInbox = () => {
  const router = useRouter();
  const { data: token, isPending } = useInboxToken();
  const unreadCount = useUnreadNotificationCount();

  if (isPending || !token?.applicationIdentifier || !token?.subscriberHash) {
    return (
      <Button
        asChild
        size="icon"
        variant="outline"
        className="relative rounded-full border-secondary-100 bg-white text-secondary-600 shadow-none hover:bg-secondary-50"
      >
        <Link
          href={ROUTES.NOTIFICATIONS.href}
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <BellIcon className="size-4" />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </Button>
    );
  }

  return (
    <Inbox
      applicationIdentifier={token.applicationIdentifier}
      subscriberId={token.subscriberId}
      subscriberHash={token.subscriberHash}
      {...(token.apiUrl ? { backendUrl: token.apiUrl } : {})}
      {...(token.socketUrl ? { socketUrl: token.socketUrl } : {})}
      routerPush={(path: string) => router.push(path)}
      appearance={{
        variables: {
          colorPrimary: "#6C63FF",
          colorForeground: "#1f2937",
        },
      }}
    />
  );
};

export default NovuInbox;
