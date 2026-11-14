"use client";

import { useOrganiserToDo } from "@/components/pages/app/organiser-to-do";
import { useActiveWorkspace } from "@/stores/workspace-store";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import Notice from "@/components/ui/notice";
import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";

/**
 * The organiser's to-dos that stop paid tickets going on sale. Working in
 * someone else's team, their own to-dos don't apply; admins aren't blocked.
 */
export const usePaidSalesBlockers = () => {
  const isAdmin = useUserStore((state) => state.userDetails?.role === EUserRoles.ADMIN);
  const workspace = useActiveWorkspace();
  const { data, isLoading } = useOrganiserToDo();
  const blockers =
    isAdmin || workspace ? [] : (data ?? []).filter((item) => item.blocksPaidSales);
  return { blockers, isChecking: isLoading && !isAdmin && !workspace };
};

/**
 * Said early, on the tickets step, and again at publish: what to finish before
 * paid tickets can sell. Free tickets and registration work meanwhile, and the
 * event is saved as a draft as they go, so nothing is lost.
 */
const PaidSalesBlockers = ({ stage }: { stage: "tickets" | "publish" }) => {
  const { blockers } = usePaidSalesBlockers();
  if (!blockers.length) return null;

  return (
    <Notice
      tone="warning"
      icon={Lock}
      title={
        stage === "publish"
          ? "Finish these to publish with paid tickets"
          : "Paid tickets can't go on sale yet"
      }
    >
      <p>
        {stage === "publish"
          ? "Your event is saved as a draft. Come back and publish once these are done, or make the tickets free to publish now."
          : "You can still set them up: the event saves as a draft. Free tickets and free registration work now."}
      </p>
      <ul className="mt-3 space-y-2">
        {blockers.map((item) => (
          <li
            key={item.key}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="line-clamp-2 text-muted-foreground">{item.body}</p>
            </div>
            {item.action && (
              <Link
                href={item.action.href}
                className="inline-flex shrink-0 items-center gap-1 font-semibold text-warning hover:underline"
              >
                {item.action.label}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Notice>
  );
};

export default memo(PaidSalesBlockers);
