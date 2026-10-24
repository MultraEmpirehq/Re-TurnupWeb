"use client";

import PerformerAvatar from "@/components/discovery/performer-avatar";
import FollowButton from "@/components/discovery/follow-button";
import EmptyContainer from "@/components/ui/empty-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useFollows } from "@/hooks/use-discovery";
import { usePeopleConnections, usePerson } from "@/hooks/use-profile";
import { IFollowedItem, TFollowTargetType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { ArrowLeft, Heart, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { memo, useMemo } from "react";

const GROUPS: { type: TFollowTargetType; title: string; path?: string }[] = [
  { type: "PERSON", title: "People" },
  { type: "PERFORMER", title: "Performers", path: "performer" },
  { type: "PLANNER", title: "Event planners", path: "planner" },
  { type: "VENUE", title: "Venues", path: "venue" },
];

const hrefFor = (item: IFollowedItem) => {
  const path = GROUPS.find((group) => group.type === item.targetType)?.path;
  return path ? `${ROUTES.EXPLORE.href}/${path}/${item.targetId}` : null;
};

const ListSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 4 }).map((_, index) => (
      <Skeleton key={index} className="h-20 rounded-2xl" />
    ))}
  </div>
);

const Row: React.FC<{
  name: string;
  image: string | null;
  subtitle?: string | null;
  href?: string | null;
  action: React.ReactNode;
}> = ({ name, image, subtitle, href, action }) => {
  const text = (
    <>
      <span className="block truncate font-semibold text-secondary-950">
        {name}
      </span>
      {subtitle && (
        <span className="block truncate text-xs text-secondary-500">
          {subtitle}
        </span>
      )}
    </>
  );
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5">
      <PerformerAvatar name={name} image={image} className="size-12" />
      {href ? (
        <Link
          href={href}
          className="min-w-0 flex-1 hover:[&>span:first-child]:text-secondary"
        >
          {text}
        </Link>
      ) : (
        <span className="min-w-0 flex-1">{text}</span>
      )}
      {action}
    </li>
  );
};

/** Everyone and everything they follow, grouped. */
const FollowingList = () => {
  const { data: follows = [], isLoading } = useFollows();
  const grouped = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        items: follows.filter((item) => item.targetType === group.type),
      })).filter((group) => group.items.length > 0),
    [follows],
  );
  if (isLoading) return <ListSkeleton />;
  if (!follows.length) {
    return (
      <EmptyContainer
        icon={<Heart className="size-6" />}
        title="You aren’t following anyone yet"
        description="Follow friends, performers, planners and venues to hear when they have something new."
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
          <ul className="grid gap-2 @3xl:grid-cols-2">
            {group.items.map((item) => (
              <Row
                key={`${item.targetType}-${item.targetId}`}
                name={item.name}
                image={item.image}
                href={hrefFor(item)}
                subtitle={
                  item.targetType === "PERSON"
                    ? item.subtitle
                    : [
                        item.subtitle,
                        `${item.upcomingEvents} upcoming ${item.upcomingEvents === 1 ? "event" : "events"}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                }
                action={
                  <FollowButton
                    type={item.targetType}
                    id={item.targetId}
                    name={item.name}
                  />
                }
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

/** People who follow them, each with Follow back. */
const FollowersList: React.FC<{ username?: string }> = ({ username }) => {
  const { data: people = [], isLoading } = usePeopleConnections(
    username,
    "followers",
  );
  if (isLoading) return <ListSkeleton />;
  if (!people.length) {
    return (
      <EmptyContainer
        icon={<UsersRound className="size-6" />}
        title="No followers yet"
        description="Share your profile so friends can find and follow you."
      />
    );
  }
  return (
    <ul className="grid gap-2 @3xl:grid-cols-2">
      {people.map((person) => (
        <Row
          key={person.id}
          name={person.name}
          image={person.image}
          subtitle={[
            person.username ? `@${person.username}` : null,
            person.followsYou && person.isFollowing
              ? "You follow each other"
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
          action={
            <FollowButton type="PERSON" id={person.id} name={person.name} />
          }
        />
      ))}
    </ul>
  );
};

/** Following and followers, both reached from the numbers on the profile. */
const FollowingPage = () => {
  const router = useRouter();
  const tab =
    useSearchParams().get("tab") === "followers" ? "followers" : "following";
  const username = useUserStore((state) => state.userDetails?.username);
  const { data: me } = usePerson(username);
  const { data: follows = [] } = useFollows();

  const tabs = [
    { id: "following", label: "Following", count: follows.length },
    { id: "followers", label: "Followers", count: me?.followers ?? 0 },
  ] as const;

  return (
    <div className="@container space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.USER_PROFILE.href}
          aria-label="Back to your profile"
          className="flex size-10 items-center justify-center rounded-full border border-secondary-100 bg-white text-secondary-700 hover:bg-secondary-50"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div
          role="tablist"
          aria-label="Connections"
          className="flex gap-1 rounded-full border border-secondary-100 bg-white p-1"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() =>
                router.replace(
                  item.id === "followers"
                    ? `${ROUTES.PROFILE_FOLLOWING.href}?tab=followers`
                    : ROUTES.PROFILE_FOLLOWING.href,
                )
              }
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                tab === item.id
                  ? "bg-secondary-900 text-white"
                  : "text-secondary-600 hover:text-secondary-900",
              )}
            >
              {item.label}
              <span
                className={
                  tab === item.id ? "text-white/70" : "text-secondary-400"
                }
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>
      {tab === "followers" ? (
        <FollowersList username={username} />
      ) : (
        <FollowingList />
      )}
    </div>
  );
};

export default memo(FollowingPage);
