"use client";

import PerformerAvatar from "@/components/discovery/performer-avatar";
import FollowButton from "@/components/discovery/follow-button";
import EmptyContainer from "@/components/ui/empty-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useFollows } from "@/hooks/use-discovery";
import { IFollowedItem, TFollowTargetType } from "@/lib/types";
import { ROUTES } from "@/lib/variables";
import { Heart } from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo } from "react";

const GROUPS: { type: TFollowTargetType; title: string; path: string }[] = [
  { type: "PERFORMER", title: "Performers", path: "performer" },
  { type: "PLANNER", title: "Event planners", path: "planner" },
  { type: "VENUE", title: "Venues", path: "venue" },
];

const hrefFor = (item: IFollowedItem) =>
  `${ROUTES.EXPLORE.href}/${GROUPS.find((group) => group.type === item.targetType)?.path ?? "venue"}/${item.targetId}`;

/** The performers, planners and venues someone follows. */
const FollowingPage = () => {
  const { data: follows = [], isLoading } = useFollows();
  const grouped = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        items: follows.filter((item) => item.targetType === group.type),
      })).filter((group) => group.items.length > 0),
    [follows],
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (follows.length === 0) {
    return (
      <EmptyContainer
        icon={<Heart className="size-6" />}
        title="You aren’t following anyone yet"
        description="Follow performers, planners and venues to hear when they have something new."
      />
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <section key={group.type} className="space-y-3">
          <h2 className="text-lg font-bold text-secondary-950">
            {group.title}
          </h2>
          <ul className="space-y-2">
            {group.items.map((item) => (
              <li
                key={`${item.targetType}-${item.targetId}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5"
              >
                <PerformerAvatar
                  name={item.name}
                  image={item.image}
                  className="size-12"
                />
                <Link href={hrefFor(item)} className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-secondary-950 hover:text-secondary">
                    {item.name}
                  </span>
                  <span className="block truncate text-xs text-secondary-500">
                    {[
                      item.subtitle,
                      `${item.upcomingEvents} upcoming ${item.upcomingEvents === 1 ? "event" : "events"}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Link>
                <FollowButton
                  type={item.targetType}
                  id={item.targetId}
                  name={item.name}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default memo(FollowingPage);
