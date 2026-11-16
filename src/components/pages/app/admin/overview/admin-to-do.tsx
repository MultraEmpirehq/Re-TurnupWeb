"use client";

import CountBadge from "@/components/ui/count-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupportTeam } from "@/hooks/use-admin-support-chats";
import { TAdminPendingKey, useAdminPendingCounts } from "@/hooks/use-admin-dashboard";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import useUserStore from "@/stores/user-store";
import { ChevronRight, CircleCheck, ListTodo, LucideIcon } from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo } from "react";
import { ADMIN_NAV_GROUPS, TAdminNavItem } from "../shell/admin-nav";

/** What each queue's count means, one and many; most urgent first. */
const QUEUES: { key: TAdminPendingKey; one: string; many: string }[] = [
  { key: "supportChats", one: "live chat waiting for a reply", many: "live chats waiting for a reply" },
  { key: "refunds", one: "refund to handle", many: "refunds to handle" },
  { key: "inquiries", one: "contact message to answer", many: "contact messages to answer" },
  { key: "verifications", one: "organiser to verify", many: "organisers to verify" },
  { key: "reports", one: "reported event to look at", many: "reported events to look at" },
  { key: "eventReviews", one: "event to approve", many: "events to approve" },
  { key: "boosts", one: "promotion to approve", many: "promotions to approve" },
  { key: "catalogue", one: "catalogue submission to review", many: "catalogue submissions to review" },
];

/** The nav item for each queue: its link, icon and the permission it needs. */
const navItemFor = (key: TAdminPendingKey) =>
  ADMIN_NAV_GROUPS.flatMap((group) => group.items).find((item) => item.pendingKey === key) as
    | (TAdminNavItem & { icon: LucideIcon })
    | undefined;

type TTask = { key: string; count: number; text: string; href: string; icon: LucideIcon; area: string };

/**
 * The admin's to-do: everything waiting in the queues they can work on (the
 * same counts as the sidebar), most urgent first, and the live chats that are
 * theirs. "All clear" when there's nothing.
 */
const AdminToDo = () => {
  const { has, isLoading: loadingPermissions } = useAdminPermissions();
  const { data: pending, isLoading } = useAdminPendingCounts(!loadingPermissions);
  const canSupport = !loadingPermissions && has("SUPPORT_MANAGE");
  const team = useSupportTeam(canSupport);
  const myId = useUserStore((state) => state.userDetails?.id);
  const mine = team.data?.staff.find((person) => person.id === myId)?.openChats ?? 0;

  const tasks = useMemo<TTask[]>(() => {
    const list: TTask[] = [];
    if (mine > 0) {
      list.push({
        key: "my-chats",
        count: mine,
        text: mine === 1 ? "live chat with you" : "live chats with you",
        href: "/app/admin/support/chats",
        icon: navItemFor("supportChats")?.icon ?? ListTodo,
        area: "Assigned to you",
      });
    }
    for (const queue of QUEUES) {
      const count = pending?.[queue.key] ?? 0;
      const item = navItemFor(queue.key);
      if (!count || !item) continue;
      if (item.permission && !has(item.permission)) continue;
      list.push({
        key: queue.key,
        count,
        text: count === 1 ? queue.one : queue.many,
        href: item.href,
        icon: item.icon,
        area: ADMIN_NAV_GROUPS.find((group) => group.items.includes(item))?.label ?? "",
      });
    }
    return list;
  }, [pending, has, mine]);

  const total = tasks.reduce((sum, task) => sum + (task.key === "my-chats" ? 0 : task.count), 0);

  return (
    <section className="flex h-full flex-col rounded-xl border border-border bg-card p-4" aria-labelledby="admin-to-do">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="admin-to-do" className="flex items-center gap-2 font-semibold text-foreground">
          <ListTodo className="size-4 text-primary" aria-hidden /> To do
        </h2>
        {total > 0 && <span className="text-xs text-muted-foreground">{total.toLocaleString()} waiting</span>}
      </div>

      {isLoading || loadingPermissions ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <CircleCheck className="size-8 text-success" aria-hidden />
          <p className="font-semibold text-foreground">All clear</p>
          <p className="max-w-60 text-sm text-muted-foreground">Nothing is waiting in the queues you work on.</p>
        </div>
      ) : (
        <ul className="-mx-1 space-y-1 overflow-y-auto">
          {tasks.map((task) => {
            const Icon = task.icon;
            return (
              <li key={task.key}>
                <Link
                  href={task.href}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {task.count.toLocaleString()} {task.text}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{task.area}</span>
                  </span>
                  <CountBadge value={task.count} label={`${task.count} ${task.text}`} />
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default memo(AdminToDo);
