"use client";

import { constructErrorMessage } from "@/api/functions";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Notice from "@/components/ui/notice";
import { IPost, taggedLine, useMyTag } from "@/hooks/use-posts";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { formatDistanceToNowStrict } from "date-fns";
import { ChevronLeft, ChevronRight, MoreHorizontal, Ticket, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import React, { memo, useEffect, useState } from "react";
import { PostActions, PostComments } from "./post-social";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

const ago = (date: string) =>
  Date.now() - new Date(date).getTime() < 60_000 ? "just now" : formatDistanceToNowStrict(new Date(date), { addSuffix: true });

/**
 * One post, opened from a grid, laid out as in the app: who and when on top
 * (with "⋯" for options), the photo filling the frame with its event in a pill
 * and arrows between photos, then likes, the caption, who's tagged and the
 * comments. Options: Delete for your own; for one you're tagged in, hide it
 * from your profile or take yourself off it.
 */
const PostViewer = ({
  post,
  onClose,
  onDelete,
  deleting,
  step,
}: {
  post: IPost | null;
  onClose: () => void;
  onDelete?: (id: string) => Promise<unknown>;
  deleting?: boolean;
  /** Stepping through someone's posts (opened from a circle): which one, and how to move. */
  step?: { index: number; total: number; onPrev: () => void; onNext: () => void };
}) => {
  const [index, setIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const myTag = useMyTag();
  useEffect(() => setIndex(0), [post?.id]);
  if (!post) return null;
  const item = post.media[index] ?? post.media[0];
  const many = post.media.length > 1;
  const canDelete = post.mine && !!onDelete;

  const tagAction = (action: "hide" | "show" | "remove", done: string) =>
    myTag.mutate(
      { postId: post.id, action },
      {
        onSuccess: () => {
          toast.success(done);
          onClose();
        },
        onError: (failure) => toast.error(constructErrorMessage(failure as TApiErrorResponseType, "Couldn't do that.")),
      },
    );

  return (
    <>
      <Dialog open={!!post} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          showCloseButton={false}
          // Opens on the photo, not with a focus ring on the first button.
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="max-h-[94vh] gap-0 overflow-y-auto p-0 sm:max-w-md"
        >
          <header className="flex items-center gap-3 px-4 py-3">
            {post.author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author.image} alt="" className="size-9 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-extrabold text-secondary-800">
                {initials(post.author.name)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-sm font-bold">{post.author.name}</DialogTitle>
              <DialogDescription className="text-xs">{ago(post.createdAt)}</DialogDescription>
            </div>
            {step && step.total > 1 && (
              <div className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground">
                <button
                  type="button"
                  aria-label="Previous post"
                  disabled={step.index === 0}
                  onClick={step.onPrev}
                  className="flex size-8 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <span className="tabular-nums">
                  {step.index + 1} of {step.total}
                </span>
                <button
                  type="button"
                  aria-label="Next post"
                  disabled={step.index === step.total - 1}
                  onClick={step.onNext}
                  className="flex size-8 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            )}
            {(canDelete || post.myTag) && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Post options"
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  disabled={myTag.isPending}
                >
                  <MoreHorizontal className="size-5" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canDelete ? (
                    <DropdownMenuItem className="text-destructive" onSelect={() => setConfirming(true)}>
                      Delete post
                    </DropdownMenuItem>
                  ) : (
                    <>
                      {post.myTag?.hidden ? (
                        <DropdownMenuItem onSelect={() => tagAction("show", "Back on your profile.")}>Show on my profile</DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => tagAction("hide", "Hidden from your profile.")}>Hide from my profile</DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onSelect={() => tagAction("remove", "You're no longer tagged.")}>
                        Remove me from this post
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DialogClose aria-label="Close" className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
              <X className="size-5" aria-hidden />
            </DialogClose>
          </header>

          {/* Inset and rounded, like the cards, so photos never touch the edges. */}
          <div className="px-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-secondary-950">
            {item?.type === "video" ? (
              <video key={item.id} src={item.url} className="size-full object-cover" controls autoPlay muted loop playsInline />
            ) : item ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.url} alt={post.caption ?? "Post photo"} className="size-full object-cover" />
            ) : null}
            {post.event && (
              <Link
                href={`${ROUTES.EXPLORE.href}/event/${post.event.id}`}
                className="absolute top-3 left-3 flex max-w-[75%] items-center gap-1.5 rounded-full bg-white/90 py-1 pr-3 pl-2.5 text-xs font-semibold text-secondary-900"
              >
                <Ticket className="size-3.5 shrink-0 text-primary" aria-hidden />
                <span className="truncate">{post.event.name}</span>
              </Link>
            )}
            {many && (
              <>
                <button
                  type="button"
                  aria-label="Previous"
                  disabled={index === 0}
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  className="absolute top-1/2 left-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white disabled:opacity-0"
                >
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  disabled={index === post.media.length - 1}
                  onClick={() => setIndex((i) => Math.min(post.media.length - 1, i + 1))}
                  className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white disabled:opacity-0"
                >
                  <ChevronRight className="size-5" aria-hidden />
                </button>
                <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                  {post.media.map((media, i) => (
                    <span key={media.id} className={cn("h-1.5 rounded-full", i === index ? "w-4 bg-white" : "w-1.5 bg-white/50")} />
                  ))}
                </div>
              </>
            )}
          </div>

          </div>

          <div className="space-y-2 px-4 pt-3 pb-4">
            {!post.removed && <PostActions post={post} />}
            {post.caption && (
              <p className="text-sm whitespace-pre-line text-foreground">
                <span className="font-bold">{post.author.username ?? post.author.name}</span> {post.caption}
              </p>
            )}
            {post.tags.length > 0 && <p className="text-xs font-semibold text-muted-foreground">{taggedLine(post.tags)}</p>}
            {post.myTag?.hidden && <p className="text-xs text-muted-foreground">Hidden from your profile. Only you see it here.</p>}
            {post.removed && (
              <Notice tone="danger" title={post.removed.byTeam ? "Taken down by our team" : "Hidden after reports"}>
                <p>
                  {post.removed.byTeam
                    ? post.removed.reason ?? "It broke our rules."
                    : "Several people reported it. Our team will look at it."}{" "}
                  Only you can see it.
                </p>
              </Notice>
            )}
            {!post.removed && post.hiddenFromEvent && (
              <Notice tone="info" title="Not on the event page">
                <p>The organiser took it off their event. It&apos;s still on your profile.</p>
              </Notice>
            )}
            {!post.removed && (
              <div className="border-t border-border pt-3">
                <PostComments postId={post.id} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirming}
        title="Delete this post?"
        description={post.event ? "It goes from your profile and the event page. This can't be undone." : "This can't be undone."}
        confirmLabel="Delete"
        tone="danger"
        busy={deleting}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          void onDelete?.(post.id)
            .then(() => {
              setConfirming(false);
              toast.success("Deleted.");
              onClose();
            })
            .catch((error) => toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't delete it.")))
        }
      />
    </>
  );
};

export default memo(PostViewer);
