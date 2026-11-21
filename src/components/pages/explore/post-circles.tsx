"use client";

import CreatePostDialog from "@/components/pages/profile/posts/create-post-dialog";
import PostViewer from "@/components/pages/profile/posts/post-viewer";
import { IPostCircle, usePostCircles, useProfilePosts } from "@/hooks/use-posts";
import { cn } from "@/lib/utils";
import useUserStore from "@/stores/user-store";
import { Plus } from "lucide-react";
import React, { memo, useEffect, useMemo, useState } from "react";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

/** A face in a ring: blue when they posted in the last day, grey before that. */
const Circle = ({ circle, label, onClick }: { circle: IPostCircle; label: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="group flex w-20 shrink-0 flex-col items-center gap-1.5" aria-label={`${circle.name}'s posts`}>
    <span className={cn("rounded-full p-[3px]", circle.fresh ? "bg-gradient-to-br from-primary to-[#0577FA]" : "bg-secondary-200")}>
      <span className="block rounded-full bg-card p-[2px]">
        {circle.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={circle.image} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-sm font-extrabold text-secondary-800">
            {initials(circle.name)}
          </span>
        )}
      </span>
    </span>
    <span className="w-full truncate text-center text-xs font-semibold text-secondary-700 group-hover:text-secondary-950">{label}</span>
  </button>
);

/** Someone's posts from a circle: the post viewer, stepping from one post to the next. */
const CirclePosts = ({ username, onClose }: { username: string; onClose: () => void }) => {
  const posts = useProfilePosts(username);
  const items = useMemo(() => (posts.data?.pages.flatMap((page) => page.items) ?? []).filter((post) => !post.removed), [posts.data]);
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [username]);
  const post = items[Math.min(index, Math.max(0, items.length - 1))] ?? null;
  if (!post) return null;
  return (
    <PostViewer
      post={post}
      onClose={onClose}
      step={{
        index,
        total: items.length,
        onPrev: () => setIndex((i) => Math.max(0, i - 1)),
        onNext: () => setIndex((i) => Math.min(items.length - 1, i + 1)),
      }}
    />
  );
};

/**
 * The circles above Explore, as at the top of the app's Home: you (click to
 * see yours; "+" to post), then the people you follow who posted this week,
 * the most recent first. Signed-in personal accounts only.
 */
const PostCircles = () => {
  const user = useUserStore((state) => state.userDetails);
  const enabled = !!user && !user.isBusiness && user.role !== "ADMIN";
  const { data } = usePostCircles(enabled);
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  if (!enabled || !data?.me) return null;
  const me = data.me;

  return (
    <div className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 py-1" aria-label="Posts from people you follow">
      <div className="relative">
        <Circle circle={me} label="You" onClick={() => (me.posts && me.username ? setOpen(me.username) : setCreating(true))} />
        <button
          type="button"
          onClick={() => setCreating(true)}
          aria-label="New post"
          className="absolute top-[52px] right-1 flex size-6 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground"
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>
      {data.people.map((person) => (
        <Circle
          key={person.id}
          circle={person}
          label={person.name.split(" ")[0]}
          onClick={() => person.username && setOpen(person.username)}
        />
      ))}
      {open && <CirclePosts username={open} onClose={() => setOpen(null)} />}
      <CreatePostDialog open={creating} onOpenChange={setCreating} username={me.username} events={[]} isPrivate={false} />
    </div>
  );
};

export default memo(PostCircles);
