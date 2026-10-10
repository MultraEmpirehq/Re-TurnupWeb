"use client";

import { Inbox } from "@novu/react";
import { useRouter } from "next/navigation";
import React from "react";

/**
 * Novu's inbox itself, in its own file so the bell can load it only when the
 * inbox is switched on. Imported statically here: webpack can't bundle
 * @novu/react through a dynamic import() of the package.
 */
const NovuInboxWidget: React.FC<{
  applicationIdentifier: string;
  subscriberId: string;
  subscriberHash: string;
  backendUrl?: string;
  socketUrl?: string;
}> = ({ backendUrl, socketUrl, ...credentials }) => {
  const router = useRouter();
  return (
    <Inbox
      {...credentials}
      {...(backendUrl ? { backendUrl } : {})}
      {...(socketUrl ? { socketUrl } : {})}
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

export default NovuInboxWidget;
