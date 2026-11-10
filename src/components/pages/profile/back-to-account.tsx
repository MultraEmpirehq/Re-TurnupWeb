"use client";

import { ROUTES } from "@/lib/variables";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";

/** Back to where this person's account lives: their profile, or the dashboard for organisers and admins. */
const BackToAccount = () => {
  const role = useUserStore((state) => state.userDetails?.role);
  const dashboard = role === EUserRoles.VENDOR || role === EUserRoles.ADMIN;
  return (
    <Link
      href={dashboard ? ROUTES.DASHBOARD.href : ROUTES.USER_PROFILE.href}
      aria-label={dashboard ? "Back to your dashboard" : "Back to your profile"}
      className="flex size-10 items-center justify-center rounded-full border border-secondary-100 bg-white text-secondary-700 hover:bg-secondary-50"
    >
      <ArrowLeft className="size-4" />
    </Link>
  );
};

export default memo(BackToAccount);
