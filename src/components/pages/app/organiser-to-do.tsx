"use client";

import { getData } from "@/api";
import { Button } from "@/components/ui/button";
import Notice from "@/components/ui/notice";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { useActingVendor } from "@/stores/workspace-store";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";

export type TToDoItem = {
  key: string;
  tone: "info" | "warning" | "danger";
  title: string;
  body: string;
  action?: { label: string; href: string };
  /** Paid tickets can't go on sale until this is done. */
  blocksPaidSales?: boolean;
};

/** The organiser's open items, refreshed now and then while the dashboard is open. */
export const useOrganiserToDo = () => {
  const isAdmin = useUserStore((state) => state.userDetails?.role === EUserRoles.ADMIN);
  const signedIn = useUserStore((state) => !!state.userDetails?.id);
  return useQuery({
    queryKey: ["organiser-to-do"],
    queryFn: async () => {
      const { data } = await getData<TToDoItem[]>("/vendor/verification/to-do");
      return data?.data ?? [];
    },
    enabled: signedIn && !isAdmin,
    refetchInterval: 5 * 60_000,
    retry: 1,
  });
};

/**
 * What's left before an organiser can sell and get paid, at the top of the
 * dashboard: the application, payouts, an expiring ID, a restriction. Gone
 * once everything is done.
 */
const OrganiserToDo = () => {
  const { data: items } = useOrganiserToDo();
  // Working in someone else's account: their application and payouts aren't
  // this person's to do (and the list would be their own account's).
  const { isTeamMember } = useActingVendor();
  if (isTeamMember || !items?.length) return null;

  return (
    <section aria-labelledby="to-do-title" className="space-y-3">
      <h2 id="to-do-title" className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        To do
      </h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.key}>
            <Notice
              tone={item.tone}
              title={item.title}
              action={
                item.action && (
                  <Button asChild className="h-10 rounded-full px-5">
                    <Link href={item.action.href}>
                      {item.action.label}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                )
              }
            >
              <p className="whitespace-pre-line">{item.body}</p>
            </Notice>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default memo(OrganiserToDo);
