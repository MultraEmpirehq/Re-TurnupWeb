"use client";

import { getData, patchData } from "@/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { markNotificationsSeen } from "@/hooks/use-unread-notifications";
import { consoleHref } from "@/lib/admin-routes";
import {
  IEventNotification,
  getEventNotifications,
  subscribeToEventNotifications,
} from "@/lib/event-notifications";
import { cn } from "@/lib/utils";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  subDays,
} from "date-fns";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Coins,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { memo, useEffect, useMemo, useState } from "react";

type TCategory =
  | "VENDOR_VERIFICATION"
  | "EVENT_UPDATES"
  | "ORDER_UPDATES"
  | "TICKET_TRANSFERS"
  | "ACCOUNT"
  | "CREDIT";

type TNotification = {
  id: string;
  title: string;
  content: string;
  href?: string;
  category?: TCategory | null;
  isRead?: boolean;
  createdAt: string;
};

type TItem = {
  id: string;
  title: string;
  body: string;
  href?: string;
  unread: boolean;
  createdAt: Date;
  icon: LucideIcon;
  tone: string;
  kind: TKind;
};

/** The side panel's filters: a few plain groups, not every category. */
type TKind = "money" | "applications" | "events" | "tickets" | "other";
const KIND_OF: Record<TCategory, TKind> = {
  ACCOUNT: "money",
  CREDIT: "money",
  VENDOR_VERIFICATION: "applications",
  EVENT_UPDATES: "events",
  ORDER_UPDATES: "tickets",
  TICKET_TRANSFERS: "tickets",
};
const KINDS: { value: TKind; label: string }[] = [
  { value: "events", label: "Events" },
  { value: "tickets", label: "Orders & tickets" },
  { value: "money", label: "Money & credit" },
  { value: "applications", label: "Applications" },
  { value: "other", label: "Other" },
];

/** What each kind looks like: an icon and a tint, so the list scans at a glance. */
const LOOK: Record<TCategory, { icon: LucideIcon; tone: string }> = {
  ACCOUNT: { icon: Coins, tone: "bg-warning-soft text-warning" },
  CREDIT: { icon: Coins, tone: "bg-success-soft text-success" },
  VENDOR_VERIFICATION: {
    icon: ShieldCheck,
    tone: "bg-violet-50 text-violet-700",
  },
  EVENT_UPDATES: { icon: CalendarDays, tone: "bg-primary-50 text-primary" },
  ORDER_UPDATES: { icon: Ticket, tone: "bg-info-soft text-info" },
  TICKET_TRANSFERS: { icon: Send, tone: "bg-pink-50 text-pink-700" },
};
const DEFAULT_LOOK = { icon: Bell, tone: "bg-secondary-50 text-secondary-700" };

const groupOf = (date: Date) =>
  isToday(date)
    ? "Today"
    : isYesterday(date)
      ? "Yesterday"
      : date > subDays(new Date(), 7)
        ? "Earlier this week"
        : "Older";
const GROUPS = ["Today", "Yesterday", "Earlier this week", "Older"];

const useMyNotifications = () =>
  useQuery({
    queryKey: ["account-notifications"],
    queryFn: async () => {
      const { data } = await getData<TNotification[]>("/notifications", {
        params: { limit: 100 },
      });
      return data?.data ?? [];
    },
    retry: 0,
    refetchInterval: 60_000,
  });

const Row = memo(({ item }: { item: TItem }) => {
  const Icon = item.icon;
  const inner = (
    <>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-2xl sm:size-11",
          item.tone,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2 sm:items-center">
          {item.unread && (
            <span
              className="mt-1.5 size-2 shrink-0 rounded-full bg-primary sm:mt-0"
              aria-label="Unread"
            />
          )}
          <span
            className={cn(
              "line-clamp-2 text-base leading-5 text-secondary-950 sm:truncate",
              item.unread ? "font-bold" : "font-semibold",
            )}
          >
            {item.title}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-sm leading-6 text-secondary-950/60">
          {item.body}
        </span>
        {/* On phones the time sits under the message, so the title gets the width. */}
        <span className="mt-1 block text-xs text-secondary-950/50 sm:hidden">
          {formatDistanceToNowStrict(item.createdAt, { addSuffix: true })}
        </span>
      </span>
      <span className="hidden shrink-0 items-center gap-1 text-xs whitespace-nowrap text-secondary-950/50 sm:flex">
        {formatDistanceToNowStrict(item.createdAt, { addSuffix: true })}
        {item.href && <ChevronRight className="size-4" aria-hidden />}
      </span>
    </>
  );
  const className = cn(
    "flex items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5",
    item.unread && "bg-primary-50/40",
    item.href && "transition-colors hover:bg-secondary-50",
  );
  return (
    <li>
      {item.href ? (
        <Link href={item.href} className={className}>
          {inner}
        </Link>
      ) : (
        <div className={className}>{inner}</div>
      )}
    </li>
  );
});
Row.displayName = "Row";

/**
 * Everything Turnupz told you, newest first and grouped by day. For admins,
 * the alerts that need someone (failed refunds, chargebacks, reports); for
 * organisers, their events, sales and payouts.
 */
const NotificationsPage = () => {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const userId = useUserStore((state) => state.userDetails?.id);
  const isAdmin = useUserStore(
    (state) => state.userDetails?.role === EUserRoles.ADMIN,
  );
  const { data, isLoading } = useMyNotifications();
  const [local, setLocal] = useState<IEventNotification[]>([]);
  const [search, setSearch] = useState(searchParams.get("q")?.trim() ?? "");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [kind, setKind] = useState<TKind | null>(null);
  const [marking, setMarking] = useState(false);

  // Being here counts as seeing them, so the badge in the menu clears.
  useEffect(() => {
    markNotificationsSeen(userId);
  }, [userId, data, local]);

  useEffect(() => {
    const sync = () => setLocal(getEventNotifications());
    sync();
    return subscribeToEventNotifications(sync);
  }, []);

  useEffect(
    () => setSearch(searchParams.get("q")?.trim() ?? ""),
    [searchParams],
  );

  const items = useMemo<TItem[]>(() => {
    const server = (data ?? []).map((n) => {
      const look = (n.category && LOOK[n.category]) || DEFAULT_LOOK;
      return {
        id: n.id,
        title: n.title,
        body: n.content,
        href: n.href ? consoleHref(n.href, isAdmin) : undefined,
        unread: !n.isRead,
        createdAt: new Date(n.createdAt),
        kind: (n.category && KIND_OF[n.category]) || ("other" as TKind),
        ...look,
      };
    });
    const extra = local
      .filter((n) => !server.some((s) => s.id === n.id))
      .map((n) => ({
        id: n.id,
        title: n.title,
        body: n.description,
        href: n.href ? consoleHref(n.href, isAdmin) : undefined,
        unread: false,
        createdAt: new Date(n.createdAt),
        kind: "events" as TKind,
        ...LOOK.EVENT_UPDATES,
      }));
    return [...server, ...extra].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }, [data, local, isAdmin]);

  const unreadCount = items.filter((item) => item.unread).length;
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        (!onlyUnread || item.unread) &&
        (!kind || item.kind === kind) &&
        (!q || `${item.title} ${item.body}`.toLowerCase().includes(q)),
    );
  }, [items, onlyUnread, search, kind]);
  const kindCounts = useMemo(
    () =>
      KINDS.map((option) => ({
        ...option,
        total: items.filter((item) => item.kind === option.value).length,
        unread: items.filter(
          (item) => item.kind === option.value && item.unread,
        ).length,
      })).filter((option) => option.total > 0),
    [items],
  );
  const grouped = GROUPS.map((group) => ({
    group,
    items: shown.filter((item) => groupOf(item.createdAt) === group),
  })).filter((section) => section.items.length);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await patchData("/notifications/read-all", {});
      await queryClient.invalidateQueries({
        queryKey: ["account-notifications"],
      });
    } finally {
      setMarking(false);
    }
  };

  return (
    <section className="space-y-6 pb-24">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Notifications
          </h1>
          <p className="hidden max-w-2xl text-sm text-muted-foreground sm:block">
            {isAdmin
              ? "Alerts that need someone on the team: failed refunds, chargebacks, reports and applications."
              : "Your events, sales, payouts and anything that needs a look."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              loading={marking}
              onClick={() => void markAllRead()}
            >
              Mark all as read
            </Button>
          )}
          {!isAdmin && (
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/app/settings">
                <Settings className="size-4" aria-hidden />
                Settings
              </Link>
            </Button>
          )}
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div
              role="group"
              aria-label="Show"
              className="flex w-fit rounded-full bg-card p-1 ring-1 ring-black/5"
            >
              {[
                { label: "All", value: false },
                {
                  label: unreadCount ? `Unread (${unreadCount})` : "Unread",
                  value: true,
                },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={onlyUnread === option.value}
                  onClick={() => setOnlyUnread(option.value)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    onlyUnread === option.value
                      ? "bg-secondary-950 text-white"
                      : "text-secondary-800 hover:bg-secondary-50",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="relative flex-1">
              <span className="sr-only">Search notifications</span>
              <Search
                className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-secondary-950/40"
                aria-hidden
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notifications"
                className="h-10 w-full rounded-full border border-secondary-100 bg-card pr-4 pl-10 text-sm outline-none focus:border-secondary-300"
              />
            </label>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-secondary-200 bg-card px-6 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-secondary-50 text-secondary-700">
                <Bell className="size-5" aria-hidden />
              </span>
              <p className="font-semibold text-secondary-950">
                {search || onlyUnread || kind
                  ? "Nothing matches"
                  : "You're all caught up"}
              </p>
              <p className="max-w-sm text-sm text-secondary-950/60">
                {search || onlyUnread || kind
                  ? "Try another search, or show all notifications."
                  : isAdmin
                    ? "Alerts land here when something needs the team."
                    : "We'll let you know about sales, payouts and your events here."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map((section) => (
                <section
                  key={section.group}
                  aria-labelledby={`group-${section.group}`}
                  className="space-y-2"
                >
                  <h2
                    id={`group-${section.group}`}
                    className="px-1 text-xs font-semibold tracking-wider text-secondary-950/50 uppercase"
                  >
                    {section.group}
                  </h2>
                  <ul className="divide-y divide-secondary-100 overflow-hidden rounded-3xl border border-secondary-100 bg-card">
                    {section.items.map((item) => (
                      <Row key={item.id} item={item} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Wide screens: filter by kind, with what's unread in each. */}
        <aside
          aria-label="Filter by type"
          className="hidden rounded-3xl border border-secondary-100 bg-card p-2 lg:sticky lg:top-24 lg:block"
        >
          <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wider text-secondary-950/50 uppercase">
            Type
          </p>
          {[
            {
              value: null,
              label: "Everything",
              total: items.length,
              unread: unreadCount,
            },
            ...kindCounts,
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={kind === option.value}
              onClick={() => setKind(option.value as TKind | null)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-colors",
                kind === option.value
                  ? "bg-secondary-950 font-semibold text-white"
                  : "text-secondary-800 hover:bg-secondary-50",
              )}
            >
              {option.label}
              <span className="flex items-center gap-2 text-xs">
                {option.unread > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 font-bold",
                      kind === option.value
                        ? "bg-white/20"
                        : "bg-primary-50 text-primary",
                    )}
                  >
                    {option.unread} new
                  </span>
                )}
                <span
                  className={
                    kind === option.value
                      ? "text-white/70"
                      : "text-secondary-950/40"
                  }
                >
                  {option.total}
                </span>
              </span>
            </button>
          ))}
        </aside>
      </div>
    </section>
  );
};

export default memo(NotificationsPage);
