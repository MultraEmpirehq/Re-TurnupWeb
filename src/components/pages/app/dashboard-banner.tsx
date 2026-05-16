"use client";

import useUserStore from "@/stores/user-store";
import { usePathname } from "next/navigation";
import React, { memo, useMemo } from "react";

const pageContent: Record<
  string,
  { eyebrow: string; title: string }
> = {
  "/app": {
    eyebrow: "Vendor Console",
    title: "Here is your overview.",
  },
  "/app/events": {
    eyebrow: "Listings",
    title: "Here is your event inventory.",
  },
  "/app/create": {
    eyebrow: "Create Event",
    title: "Here is your event builder.",
  },
  "/app/tickets": {
    eyebrow: "Bookings",
    title: "Here is your ticket overview.",
  },
  "/app/wallet": {
    eyebrow: "Wallet",
    title: "Here is your revenue overview.",
  },
};

const DashboardBanner = () => {
  const pathname = usePathname();
  const userDetails = useUserStore((state) => state.userDetails);

  const fullName = useMemo(() => {
    if (!userDetails) return "Turnupz Vendor";
    return userDetails?.name || "Turnupz Vendor";
  }, [userDetails]);

  const content = pageContent[pathname] ?? pageContent["/app"];

  return (
    <div className="max-w-4xl space-y-3 py-3 md:py-5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-primary">
        {content.eyebrow}
      </p>
      <h1 className="max-w-3xl text-[clamp(2rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-secondary-950">
        Good evening, {fullName}. {content.title}
      </h1>
    </div>
  );
};

export default memo(DashboardBanner);
