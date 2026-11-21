"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/hooks/use-privacy";
import { IPost, useDeletePost, useProfilePosts } from "@/hooks/use-posts";
import { cn } from "@/lib/utils";
import { Camera, EyeOff, Layers, Play, Plus } from "lucide-react";
import React, { memo, useMemo, useState } from "react";
import CreatePostDialog from "./create-post-dialog";
import PostViewer from "./post-viewer";

/**
 * Your posts on your profile: a 4:5 grid, newest first, with New post. A post
 * opens in a viewer; taken-down ones stay visible to you, dimmed.
 */
const ProfilePosts = ({
  username,
  events,
  which = "posts",
}: {
  username?: string | null;
  /** Events you can still post to (had a ticket, over, in the last two weeks). */
  events: { id: string; name: string }[];
  /** Your posts, or the posts you're tagged in. */
  which?: "posts" | "tagged";
}) => {
  const posts = useProfilePosts(username, which);
  const remove = useDeletePost(username);
  const { data: privacy } = usePrivacy();
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<IPost | null>(null);
  const items = useMemo(() => posts.data?.pages.flatMap((page) => page.items) ?? [], [posts.data]);

  return (
    <div className="space-y-4">
      {which === "posts" && (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-secondary-500">
          {events.length > 0
            ? `Share photos from ${events.length === 1 ? events[0].name : "events you went to"}, or anything else.`
            : "Share photos and clips. Posts follow your profile's privacy."}
        </p>
        <Button size="sm" className="shrink-0 rounded-xl" onClick={() => setCreating(true)}>
          <Plus className="size-4" aria-hidden /> New post
        </Button>
      </div>
      )}

      {posts.isLoading ? (
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
                className={cn(
                  "group relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary-100",
                  (post.removed || post.myTag?.hidden) && "opacity-50",
                )}
              >
                {first?.type === "video" ? (
                  <video src={first.url} className="size-full object-cover" muted preload="metadata" />
                ) : first ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={first.url} alt="" loading="lazy" className="size-full object-cover transition-transform group-hover:scale-[1.03]" />
                ) : null}
                <span className="absolute top-2 right-2 flex gap-1 text-white drop-shadow">
                  {post.removed && <EyeOff className="size-4" aria-label="Taken down" />}
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
          <p className="mt-3 font-bold text-secondary-950">{which === "tagged" ? "No tagged posts yet" : "No posts yet"}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-secondary-500">
            {which === "tagged"
              ? "When friends tag you in a post, it shows here."
              : "Post photos and clips. Link one to an event you went to and it shows in that event\u2019s highlights too."}
          </p>
        </div>
      )}

      {posts.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" className="rounded-xl" loading={posts.isFetchingNextPage} onClick={() => void posts.fetchNextPage()}>
            Show more
          </Button>
        </div>
      )}

      <CreatePostDialog
        open={creating}
        onOpenChange={setCreating}
        username={username}
        events={events}
        isPrivate={privacy?.isPrivate}
      />
      <PostViewer post={open} onClose={() => setOpen(null)} onDelete={(id) => remove.mutateAsync(id)} deleting={remove.isPending} />
    </div>
  );
};

export default memo(ProfilePosts);
