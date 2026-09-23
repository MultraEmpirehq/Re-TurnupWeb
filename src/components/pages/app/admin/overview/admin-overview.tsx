"use client";

import { useAdminVerifications } from "@/hooks/use-admin-verifications";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { ArrowRight, BadgeCheck, MapPin, Tags, Users } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";

// Placeholder until the overview dashboard is designed: it only points the admin at
// the sections that already exist.
const AdminOverview = () => {
  const firstName = useUserStore((state) => state.userDetails?.firstName);
  const { data: pending } = useAdminVerifications({
    status: "submitted",
    search: "",
    page: 1,
  });
  const pendingCount = pending?.pagination?.total;

  const shortcuts = [
    {
      href: ROUTES.ADMIN_VERIFICATIONS.href,
      icon: BadgeCheck,
      title: "Verifications",
      description:
        pendingCount === undefined
          ? "Review vendor applications."
          : `${pendingCount} application${pendingCount === 1 ? "" : "s"} awaiting review.`,
    },
    {
      href: ROUTES.ADMIN_USERS.href,
      icon: Users,
      title: "Users",
      description: "Look up attendees, vendors and admins.",
    },
    {
      href: ROUTES.VENUES.href,
      icon: MapPin,
      title: "Venues",
      description: "Manage the venues events can be held at.",
    },
    {
      href: ROUTES.CATEGORIES.href,
      icon: Tags,
      title: "Categories",
      description: "Manage the event categories.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-secondary-800">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          The overview dashboard is on its way. In the meantime, jump into a section.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {shortcuts.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-secondary-200 hover:bg-secondary-50/40"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-secondary-50 text-secondary-800">
              <Icon className="size-5" />
            </span>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 font-semibold text-foreground">
                {title}
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default memo(AdminOverview);
