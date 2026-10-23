"use client";

import { getData } from "@/api";
import {
  TAdminPermission,
  useAdminPermissions,
} from "@/hooks/use-admin-permissions";
import { ROUTES } from "@/lib/variables";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  CalendarDays,
  ClipboardCheck,
  Flag,
  Gift,
  Inbox,
  LucideIcon,
  ScrollText,
  Undo2,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";

const ADMIN = ROUTES.ADMIN_OVERVIEW.href;
const CARD = "var(--card)";
const LINE = "var(--border)";
const BLUE = "var(--primary)";

/** How many of something are waiting, from a list endpoint's total. */
const useWaiting = (
  key: string,
  url: string,
  params: Record<string, unknown>,
  enabled: boolean,
) =>
  useQuery({
    queryKey: ["admin-quick-count", key],
    enabled,
    retry: 0,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await getData<unknown[]>(url, {
        params: { page: 1, limit: 1, ...params },
      });
      return data?.pagination?.total ?? 0;
    },
  }).data;

type TLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: TAdminPermission;
  waiting?: number;
  /** What the number counts, for screen readers. */
  waitingLabel?: string;
};

/**
 * One click to the departments used most, each showing what's waiting there.
 * Only the ones this admin's permissions open are shown, and only their
 * counts are asked for.
 */
const QuickLinks = () => {
  const { has, isLoading } = useAdminPermissions();
  const can = (permission: TAdminPermission) => !isLoading && has(permission);

  const verifications = useWaiting(
    "verifications",
    "/admin/vendor-verifications",
    { status: "submitted" },
    can("VENDORS_VERIFY"),
  );
  const reports = useWaiting(
    "reports",
    "/admin/reports",
    { status: "open" },
    can("EVENTS_MODERATE"),
  );
  const inquiries = useWaiting(
    "inquiries",
    "/admin/inquiries",
    { status: "new" },
    can("SUPPORT_MANAGE"),
  );
  const failedRefunds = useWaiting(
    "refunds",
    "/admin/refunds",
    { status: "FAILED" },
    can("REFUNDS_MANAGE"),
  );
  const { data: catalogue } = useQuery({
    queryKey: ["catalogue-reviews", "counts"],
    enabled: can("CATALOGUE_MANAGE"),
    retry: 0,
    queryFn: async () =>
      (
        await getData<{ performers: number; venues: number }>(
          "/admin/catalogue-reviews/counts",
        )
      ).data?.data ?? { performers: 0, venues: 0 },
  });

  const links: TLink[] = [
    {
      label: "Verifications",
      href: ROUTES.ADMIN_VERIFICATIONS.href,
      icon: BadgeCheck,
      permission: "VENDORS_VERIFY",
      waiting: verifications,
      waitingLabel: "applications to review",
    },
    {
      label: "Venues & performers",
      href: `${ADMIN}/events/catalogue`,
      icon: ClipboardCheck,
      permission: "CATALOGUE_MANAGE",
      waiting: catalogue ? catalogue.performers + catalogue.venues : undefined,
      waitingLabel: "waiting",
    },
    {
      label: "Reports",
      href: `${ADMIN}/events/reports`,
      icon: Flag,
      permission: "EVENTS_MODERATE",
      waiting: reports,
      waitingLabel: "open",
    },
    {
      label: "Manage events",
      href: `${ADMIN}/events`,
      icon: CalendarDays,
      permission: "EVENTS_MODERATE",
    },
    {
      label: "Inquiries",
      href: `${ADMIN}/support/inquiries`,
      icon: Inbox,
      permission: "SUPPORT_MANAGE",
      waiting: inquiries,
      waitingLabel: "new",
    },
    {
      label: "Refunds",
      href: `${ADMIN}/finance/refunds`,
      icon: Undo2,
      permission: "REFUNDS_MANAGE",
      waiting: failedRefunds,
      waitingLabel: "failed, to retry",
    },
    {
      label: "Users",
      href: ROUTES.ADMIN_USERS.href,
      icon: Users,
      permission: "USERS_VIEW",
    },
    {
      label: "Referrals",
      href: `${ADMIN}/marketing/referrals`,
      icon: Gift,
      permission: "MARKETING_MANAGE",
    },
    {
      label: "Admins",
      href: `${ADMIN}/operations/admins`,
      icon: UserCog,
      permission: "ADMINS_MANAGE",
    },
    {
      label: "Audit log",
      href: `${ADMIN}/audit-log`,
      icon: ScrollText,
      permission: "AUDIT_VIEW",
    },
  ].filter((link) => can(link.permission as TAdminPermission)) as TLink[];

  if (!links.length) return null;
  return (
    <nav
      aria-label="Quick links"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
    >
      {links.map((link) => {
        const Icon = link.icon;
        const busy = !!link.waiting;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-muted"
            style={{ background: CARD, borderColor: LINE }}
          >
            <Icon
              className="size-4 shrink-0"
              style={{ color: BLUE }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
              {link.label}
            </span>
            {busy && (
              <span
                className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground"
                style={{ background: BLUE }}
                aria-label={`${link.waiting} ${link.waitingLabel}`}
              >
                {link.waiting}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default memo(QuickLinks);
