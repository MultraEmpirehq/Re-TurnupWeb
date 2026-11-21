"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import StatusBadge from "@/components/ui/status-badge";
import PostViewer from "@/components/pages/profile/posts/post-viewer";
import { IPost, useAdminPostAction, useAdminPosts } from "@/hooks/use-posts";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/lib/variables";
import { formatDistanceToNow } from "date-fns";
import { Flag, Images, Play } from "lucide-react";
import Link from "next/link";
import React, { memo, useState } from "react";
import { FilterTabs, ListSkeleton, NoteDialog, PageHeading } from "./moderation-ui";

type TTab = "reported" | "removed";
const TABS: { value: TTab; label: string }[] = [
  { value: "reported", label: "Reported" },
  { value: "removed", label: "Taken down" },
];

/**
 * People's posts that were reported, or taken down. Three reports hide a post
 * until someone looks; take it down (the author is told why) or put it back.
 */
const ReportedPosts = () => {
  const [tab, setTab] = useState<TTab>("reported");
  const { data: posts = [], error, isLoading, refetch } = useAdminPosts(tab);
  const action = useAdminPostAction();
  const [removing, setRemoving] = useState<IPost | null>(null);
  const [open, setOpen] = useState<IPost | null>(null);

  const run = (input: Parameters<typeof action.mutateAsync>[0], done: string) =>
    action
      .mutateAsync(input)
      .then(() => {
        toast.success(done);
        setRemoving(null);
      })
      .catch((failure) => toast.error(constructErrorMessage(failure as TApiErrorResponseType, "Couldn't do that.")));

  return (
    <div className="space-y-6">
      <PageHeading title="Reported Posts">
        People&apos;s photos and clips. Three reports hide a post until someone looks. Organisers can take posts off
        their own events; taking one down here removes it everywhere.
      </PageHeading>

      <FilterTabs tabs={TABS} value={tab} onChange={setTab} />

      {isLoading && <ListSkeleton />}
      {!!error && !isLoading && (
        <ErrorContainer
          error={constructErrorMessage(error as TApiErrorResponseType, "Could not load posts")}
          retryFunction={() => void refetch()}
        />
      )}
      {!isLoading && !error && posts.length === 0 && (
        <EmptyContainer
          icon={<Flag className="size-6" />}
          title={tab === "reported" ? "Nothing reported" : "Nothing taken down"}
          description={tab === "reported" ? "Reported posts show up here." : "Posts taken down by the team or by reports show here."}
        />
      )}

      {posts.length > 0 && (
        <ul className="space-y-3">
          {posts.map((post) => {
            const first = post.media[0];
            return (
              <li key={post.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setOpen(post)}
                  aria-label="Open the post"
                  className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl bg-muted"
                >
                  {first?.type === "video" ? (
                    <video src={first.url} className="size-full object-cover" muted preload="metadata" />
                  ) : first ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={first.url} alt="" className="size-full object-cover" />
                  ) : null}
                  <span className="absolute top-1.5 right-1.5 flex gap-1 text-white drop-shadow">
                    {first?.type === "video" && <Play className="size-3.5 fill-white" aria-hidden />}
                    {post.media.length > 1 && <Images className="size-3.5" aria-hidden />}
                  </span>
                </button>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="font-semibold text-foreground">
                    {post.author.name}
                    {post.author.username && <span className="font-normal text-muted-foreground"> @{post.author.username}</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    {post.event && (
                      <>
                        {" · "}
                        <Link href={`${ROUTES.EXPLORE.href}/event/${post.event.id}`} className="font-semibold text-primary hover:underline">
                          {post.event.name}
                        </Link>
                      </>
                    )}
                  </p>
                  {post.caption && <p className="line-clamp-2 text-sm text-foreground">{post.caption}</p>}
                  <div className="flex flex-wrap gap-2">
                    {!!post.reports && (
                      <StatusBadge tone="danger" icon={Flag}>
                        Reported {post.reports} {post.reports === 1 ? "time" : "times"}
                      </StatusBadge>
                    )}
                    {post.removed && (
                      <StatusBadge tone="neutral">
                        {post.removed.byTeam ? `Taken down: ${post.removed.reason ?? "no reason"}` : "Hidden by reports"}
                      </StatusBadge>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {(!post.removed || !post.removed.byTeam) && (
                    <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => setRemoving(post)}>
                      Take down
                    </Button>
                  )}
                  {(post.removed || !!post.reports) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      disabled={action.isPending}
                      onClick={() => void run({ id: post.id, action: "restore" }, post.removed ? "Put back." : "Reports cleared.")}
                    >
                      {post.removed ? "Put back" : "Clear reports"}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <NoteDialog
        open={!!removing}
        title="Take this post down?"
        description="It goes from their profile and any event page. They're told why."
        label="Reason"
        placeholder="e.g. Shows someone without their consent"
        confirmLabel="Take down"
        tone="danger"
        required
        busy={action.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={(reason) => removing && void run({ id: removing.id, action: "remove", reason }, "Taken down.")}
      />
      <PostViewer post={open} onClose={() => setOpen(null)} />
    </div>
  );
};

export default memo(ReportedPosts);
