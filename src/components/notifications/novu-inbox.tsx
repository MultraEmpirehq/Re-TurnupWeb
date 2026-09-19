"use client";

import { Inbox } from "@novu/react";
import { useRouter } from "next/navigation";
import { BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInboxToken } from "@/hooks/use-inbox-token";
import { ROUTES } from "@/lib/variables";
import Link from "next/link";

/**
 * The bell in the dashboard nav.
 *
 * Novu owns the unread count and the live updates, so while it is switched on this
 * replaces the plain link. When the api reports no inbox credentials, which is the
 * case while notifications still run through OneSignal, it falls back to the link and
 * the notifications page keeps working exactly as before.
 */
export const NovuInbox = () => {
  const router = useRouter();
  const { data: token, isPending } = useInboxToken();

  if (isPending || !token?.applicationIdentifier || !token?.subscriberHash) {
    return (
      <Button
        asChild
        size="icon"
        variant="outline"
        className="rounded-full border-secondary-100 bg-white text-secondary-600 shadow-none hover:bg-secondary-50"
      >
        <Link href={ROUTES.NOTIFICATIONS.href}>
          <BellIcon className="size-4" />
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
