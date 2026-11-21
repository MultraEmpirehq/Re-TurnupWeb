"use client";

import { constructErrorMessage } from "@/api/functions";
import RequireAuth from "@/components/auth/require-auth";
import SectionContainer from "@/components/layouts/section-container/section-container";
import PostViewer from "@/components/pages/profile/posts/post-viewer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToggleFollow } from "@/hooks/use-discovery";
import { IPost, useProfilePosts } from "@/hooks/use-posts";
import { usePerson } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { Camera, Layers, Lock, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import React, { memo, useEffect, useMemo, useState } from "react";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

/**
 * Someone's profile on the site, as in the app: their card (follow, numbers,
 * bio) and their posts. A private profile you don't follow shows only the
 * card; a block hides everything. Your own name opens your own profile.
 */
const PersonProfile = ({ username }: { username: string }) => {
  const router = useRouter();
  const { data: person, isLoading, error } = usePerson(username);
  const [tab, setTab] = useState<"posts" | "tagged">("posts");
  const visible = person && !person.locked ? username : null;
  const posts = useProfilePosts(visible, tab);
  // Both counts, for the tab labels.
  const postsCount = useProfilePosts(visible, "posts").data?.pages[0]?.total ?? 0;
  const taggedCount = useProfilePosts(visible, "tagged").data?.pages[0]?.total ?? 0;
  const follow = useToggleFollow();
  const [open, setOpen] = useState<IPost | null>(null);
  const items = useMemo(() => posts.data?.pages.flatMap((page) => page.items) ?? [], [posts.data]);

  useEffect(() => {
    if (person?.isMe) router.replace(ROUTES.USER_PROFILE.href);
  }, [person?.isMe, router]);

  const toggleFollow = () =>
    person &&
    follow.mutate(
      { targetType: "PERSON", targetId: person.id },
      { onError: (failure) => toast.error(constructErrorMessage(failure as TApiErrorResponseType, "Couldn't do that.")) },
    );
  const followLabel = person?.isFollowing ? "Following" : person?.requested ? "Requested" : person?.followsYou ? "Follow back" : "Follow";

  return (
    <RequireAuth>
      <SectionContainer className="py-8 sm:py-10">
        <main className="@container mx-auto w-full max-w-6xl min-w-0">
          {isLoading ? (
            <div className="grid gap-6 @4xl:grid-cols-[360px_minmax(0,1fr)]">
              <Skeleton className="h-64 rounded-3xl" />
              <Skeleton className="h-96 rounded-3xl" />
            </div>
          ) : !person || error ? (
            <div className="rounded-3xl border border-dashed border-secondary-200 bg-card px-6 py-16 text-center">
              <p className="font-bold text-secondary-950">We couldn&apos;t find that person</p>
              <p className="mt-1 text-sm text-secondary-500">The link may be wrong, or the account is gone.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 @4xl:grid-cols-[360px_minmax(0,1fr)]">
              <section className="rounded-3xl border border-secondary-100 bg-card p-6 @4xl:sticky @4xl:top-24">
                <div className="flex items-center gap-4">
                  {person.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={person.image} alt="" className="size-20 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-extrabold text-secondary-800">
                      {initials(person.name)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h1 className="truncate text-xl font-extrabold text-secondary-950">{person.name}</h1>
                    <p className="truncate text-sm text-primary">@{person.username}</p>
                    <p className="mt-1.5 text-sm text-secondary-600">
                      <b className="text-secondary-950">{person.followers}</b> followers ·{" "}
                      <b className="text-secondary-950">{person.following}</b> following
                    </p>
                  </div>
                </div>
                {person.bio && <p className="mt-4 text-sm whitespace-pre-line text-secondary-700">{person.bio}</p>}
                {person.followsYou && !person.isFollowing && (
                  <p className="mt-3 text-xs font-semibold text-secondary-500">Follows you</p>
                )}
                {!person.blockedByMe && (
                  <Button
                    className="mt-5 w-full rounded-xl"
                    variant={person.isFollowing || person.requested ? "outline" : "default"}
                    loading={follow.isPending}
                    onClick={toggleFollow}
                  >
                    {followLabel}
                  </Button>
                )}
              </section>

              <section className="min-w-0 space-y-4">
                <div role="tablist" aria-label="Their posts" className="flex gap-1 border-b border-secondary-100">
                  {(
                    [
                      { id: "posts", label: "Posts", count: postsCount },
                      { id: "tagged", label: "Tagged", count: taggedCount },
                    ] as const
                  ).map((item) => {
                    const on = tab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => setTab(item.id)}
                        className={cn(
                          "-mb-px flex items-center gap-1.5 border-b-2 px-3 pb-3 text-sm font-bold transition-colors",
                          on ? "border-primary text-secondary-950" : "border-transparent text-secondary-500 hover:text-secondary-800",
                        )}
                      >
                        {item.label}
                        {!person.locked && (
                          <span
                            className={cn(
                              "rounded-full px-1.5 text-xs tabular-nums",
                              on ? "bg-[#E5F7FF] text-[#0577FA] dark:bg-primary/20 dark:text-primary" : "bg-secondary-50 text-secondary-500",
                            )}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {person.locked ? (
                  <div className="rounded-3xl border border-dashed border-secondary-200 bg-card px-6 py-14 text-center">
                    <Lock className="mx-auto size-8 text-secondary-300" aria-hidden />
                    <p className="mt-3 font-bold text-secondary-950">
                      {person.blockedByMe ? `You've blocked ${person.name.split(" ")[0]}` : "This account is private"}
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-secondary-500">
                      {person.blockedByMe
                        ? "Unblock them in Settings to see their posts."
                        : person.requested
                          ? "Your request is waiting for them to accept."
                          : "Follow them to see their posts. They'll need to accept."}
                    </p>
                  </div>
                ) : posts.isLoading ? (
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {Array.from({ length: 6 }, (_, key) => (
                      <Skeleton key={key} className="aspect-[4/5] rounded-xl" />
                    ))}
                  </div>
                ) : items.length ? (
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {items.map((post) => {
                      const first = post.media[0];
                      return (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => setOpen(post)}
                          aria-label={post.caption ?? "Open post"}
                          className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary-100"
                        >
                          {first?.type === "video" ? (
                            <video src={first.url} className="size-full object-cover" muted preload="metadata" />
                          ) : first ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={first.url} alt="" loading="lazy" className="size-full object-cover transition-transform group-hover:scale-[1.03]" />
                          ) : null}
                          <span className="absolute top-2 right-2 flex gap-1 text-white drop-shadow">
                            {first?.type === "video" && <Play className="size-4 fill-white" aria-hidden />}
                            {post.media.length > 1 && <Layers className="size-4" aria-hidden />}
                          </span>
                          {post.event && (
                            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pt-5 pb-1.5 text-left text-[11px] font-semibold text-white">
                              {post.event.name}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-secondary-200 bg-card px-6 py-14 text-center">
                    <Camera className="mx-auto size-8 text-secondary-300" aria-hidden />
                    <p className="mt-3 font-bold text-secondary-950">{tab === "tagged" ? "Not tagged in anything yet" : "No posts yet"}</p>
                  </div>
                )}
                {posts.hasNextPage && (
                  <div className="flex justify-center">
                    <Button variant="outline" className="rounded-xl" loading={posts.isFetchingNextPage} onClick={() => void posts.fetchNextPage()}>
                      Show more
                    </Button>
                  </div>
                )}
              </section>
            </div>
          )}
          <PostViewer post={open} onClose={() => setOpen(null)} />
        </main>
      </SectionContainer>
    </RequireAuth>
  );
};

export default memo(PersonProfile);
