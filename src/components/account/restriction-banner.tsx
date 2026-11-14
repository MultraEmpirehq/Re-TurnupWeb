"use client";

import useUserStore from "@/stores/user-store";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";

/**
 * Tells a restricted person what's paused and why, wherever they are. An
 * organiser restricted for an expired ID sees it on their dashboard instead,
 * since it doesn't stop them buying or messaging.
 */
const RestrictionBanner = () => {
  const restriction = useUserStore((state) => state.userDetails?.restriction);
  if (!restriction || restriction.idExpired) return null;

  return (
    <div role="status" className="border-b border-warning-line bg-warning-soft px-5 py-3 text-sm text-warning sm:px-8">
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <p>
          <span className="font-semibold">Your account is restricted.</span> You can still use the tickets you
          have, but you can&apos;t get or send tickets, publish events or message people for now.
          {restriction.reason ? ` Reason: ${restriction.reason}` : ""}{" "}
          <Link href="/contact" className="font-semibold underline underline-offset-4">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
};

export default memo(RestrictionBanner);
