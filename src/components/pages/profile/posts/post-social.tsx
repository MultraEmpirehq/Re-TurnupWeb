"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import {
  IPost,
  IPostComment,
  useAddPostComment,
  usePostComments,
  useRemovePostComment,
  useTogglePostLike,
} from "@/hooks/use-posts";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import React, { memo, useEffect, useMemo, useState } from "react";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

/**
 * The heart and comment count under a post. The heart answers straight away
 * and settles on what the server says.
 */
export const PostActions = memo(
  ({ post, onComments, className }: { post: IPost; onComments?: () => void; className?: string }) => {
    const toggle = useTogglePostLike();
    const [liked, setLiked] = useState(post.likedByMe);
    const [likes, setLikes] = useState(post.likes);
    useEffect(() => {
      setLiked(post.likedByMe);
      setLikes(post.likes);
    }, [post.likedByMe, post.likes]);

    const like = () => {
      const next = !liked;
      setLiked(next);
      setLikes((count) => count + (next ? 1 : -1));
      toggle.mutate(post.id, {
        onSuccess: (result) => {
          if (!result) return;
          setLiked(result.liked);
          setLikes(result.likes);
        },
        onError: (failure) => {
          setLiked(!next);
          setLikes((count) => count + (next ? -1 : 1));
          toast.error(constructErrorMessage(failure as TApiErrorResponseType, "Couldn't do that."));
        },
      });
    };

    return (
      <div className={cn("flex items-center gap-4 text-sm font-bold text-foreground", className)}>
        <button type="button" onClick={like} aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"} className="flex items-center gap-1.5">
          <Heart className={cn("size-5", liked && "fill-rose-500 text-rose-500")} aria-hidden />
          {likes}
        </button>
        <button type="button" onClick={onComments} aria-label="Comments" className="flex items-center gap-1.5">
          <MessageCircle className="size-5" aria-hidden />
          {post.comments}
        </button>
      </div>
    );
  },
);
PostActions.displayName = "PostActions";

/** A post's comments: read, write, reply, and remove your own (or any on your post). */
export const PostComments = memo(({ postId }: { postId: string }) => {
  const list = usePostComments(postId);
  const add = useAddPostComment(postId);
  const remove = useRemovePostComment();
  const items = useMemo(() => list.data?.pages.flatMap((page) => page.items) ?? [], [list.data]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<IPostComment | null>(null);

  const send = (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    add.mutate(
      { body: text.trim(), ...(replyTo ? { parentId: replyTo.id } : {}) },
      {
        onSuccess: () => {
          setText("");
          setReplyTo(null);
        },
        onError: (failure) => toast.error(constructErrorMessage(failure as TApiErrorResponseType, "Couldn't post your comment.")),
      },
    );
  };

  return (
    <div className="space-y-3">
      <ul className="max-h-72 space-y-3 overflow-y-auto">
        {list.isLoading ? (
          <li className="text-sm text-muted-foreground">Loading comments…</li>
        ) : items.length === 0 ? (
          <li className="text-sm text-muted-foreground">No comments yet. Say something.</li>
        ) : (
          items.map((comment) => (
            <li key={comment.id} className={cn("flex gap-2.5", comment.parentId && "ml-9")}>
              {comment.author.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={comment.author.image} alt="" className="size-8 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-extrabold text-foreground">
                  {initials(comment.author.name)}
                </span>
              )}
              <div className="min-w-0 text-sm">
                <p>
                  <span className="font-bold text-foreground">{comment.author.username ?? comment.author.name}</span>
                  {comment.byPostAuthor && <span className="text-xs font-bold text-primary"> · Author</span>}
                  <span className="text-xs text-muted-foreground"> {formatDistanceToNowStrict(new Date(comment.createdAt))}</span>
                </p>
                <p className={cn("break-words", comment.removed ? "text-muted-foreground italic" : "text-foreground")}>
                  {comment.removed ? "Comment removed" : comment.body}
                </p>
                {!comment.removed && (
                  <div className="mt-0.5 flex gap-3 text-xs font-bold text-muted-foreground">
                    <button type="button" onClick={() => setReplyTo(comment)} className="hover:text-foreground">
                      Reply
                    </button>
                    {comment.canRemove && (
                      <button
                        type="button"
                        onClick={() =>
                          remove.mutate(comment.id, {
                            onError: (failure) => toast.error(constructErrorMessage(failure as TApiErrorResponseType, "Couldn't remove it.")),
                          })
                        }
                        className="hover:text-destructive"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))
        )}
        {list.hasNextPage && (
          <li>
            <button type="button" onClick={() => void list.fetchNextPage()} className="text-xs font-bold text-primary">
              More comments
            </button>
          </li>
        )}
      </ul>
      {replyTo && (
        <p className="flex items-center justify-between rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          Replying to {replyTo.author.username ?? replyTo.author.name}
          <button type="button" onClick={() => setReplyTo(null)} className="font-bold">
            Cancel
          </button>
        </p>
      )}
      <form onSubmit={send} className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`comment-${postId}`}>
          Add a comment
        </label>
        <input
          id={`comment-${postId}`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={500}
          placeholder="Add a comment"
          className="h-10 min-w-0 flex-1 rounded-full bg-muted px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        <Button type="submit" size="sm" variant="ghost" className="font-bold text-primary" disabled={!text.trim()} loading={add.isPending}>
          Send
        </Button>
      </form>
    </div>
  );
});
PostComments.displayName = "PostComments";
