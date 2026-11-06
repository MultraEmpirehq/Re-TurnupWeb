"use client";

import { uploadAttachment } from "@/api/attachments";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import InputField from "@/components/ui/input-field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import TextareaField from "@/components/ui/textarea-field";
import {
  ICompanyPost,
  useAdminCompanyNews,
  useDeleteCompanyPost,
  useSaveCompanyPost,
} from "@/hooks/use-company-news";
import { COMPANY_ORIGIN } from "@/lib/domains";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ExternalLink, ImagePlus, Plus } from "lucide-react";
import React, { memo, useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { ListSkeleton, PageHeading } from "../moderation/moderation-ui";

type TDraft = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverId: string | null;
  cover: string | null;
  published: boolean;
};

const emptyDraft: TDraft = { title: "", slug: "", excerpt: "", body: "", coverId: null, cover: null, published: false };

const draftOf = (post: ICompanyPost | null): TDraft =>
  post
    ? {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        body: post.body ?? "",
        coverId: post.coverId,
        cover: post.cover,
        published: post.status === "published",
      }
    : emptyDraft;

/** Writing and editing one post, in a side panel. */
const PostEditor = ({
  post,
  open,
  onClose,
}: {
  post: ICompanyPost | null;
  open: boolean;
  onClose: () => void;
}) => {
  const [draft, setDraft] = useState<TDraft>(emptyDraft);
  const [uploading, setUploading] = useState(false);
  const save = useSaveCompanyPost();
  useEffect(() => {
    if (open) setDraft(draftOf(post));
  }, [open, post]);

  const set = (field: keyof TDraft) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((current) => ({ ...current, [field]: event.target.value }));

  const pickCover = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose a picture for the cover.");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadAttachment(file, "COMPANY_POST");
      setDraft((current) => ({ ...current, coverId: uploaded.id ?? null, cover: uploaded.url ?? null }));
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't upload the cover."));
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!draft.title.trim() || !draft.body.trim()) {
      toast.error("Give the post a title and write something.");
      return;
    }
    try {
      const saved = await save.mutateAsync({
        ...(post ? { id: post.id } : {}),
        title: draft.title.trim(),
        ...(draft.slug.trim() ? { slug: draft.slug.trim() } : {}),
        excerpt: draft.excerpt.trim(),
        body: draft.body,
        coverId: draft.coverId,
        published: draft.published,
      });
      toast.success(
        draft.published ? `Published at turnupz.com/news/${saved?.slug ?? ""}` : "Saved as a draft",
      );
      onClose();
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't save the post."));
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && !save.isPending && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{post ? "Edit post" : "New post"}</SheetTitle>
          <SheetDescription>For the company blog at turnupz.com/news.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-8">
          <label className="relative flex aspect-[16/8] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-secondary-200 bg-secondary-50/60 text-sm text-muted-foreground hover:bg-secondary-50">
            {draft.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.cover} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <span className="flex items-center gap-2">
                <ImagePlus className="size-4" /> {uploading ? "Uploading…" : "Add a cover picture"}
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                void pickCover(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
          {draft.cover && (
            <button
              type="button"
              onClick={() => setDraft((current) => ({ ...current, cover: null, coverId: null }))}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Remove cover
            </button>
          )}
          <InputField label="Title" required maxLength={160} value={draft.title} onChange={set("title")} />
          <InputField
            label="Address"
            maxLength={100}
            value={draft.slug}
            onChange={set("slug")}
            placeholder="made from the title"
            helperText={`turnupz.com/news/${draft.slug || "…"}`}
          />
          <InputField
            label="Summary"
            maxLength={300}
            value={draft.excerpt}
            onChange={set("excerpt")}
            placeholder="A line or two under the title"
          />
          <TextareaField
            label="Post"
            required
            value={draft.body}
            onChange={set("body")}
            placeholder="Leave a blank line between paragraphs."
            className="[&_textarea]:min-h-72"
          />
          <div className="flex items-center justify-between rounded-2xl border border-secondary-100 p-4">
            <div>
              <p className="text-sm font-semibold text-secondary-950">Published</p>
              <p className="text-xs text-muted-foreground">Shown on turnupz.com/news for everyone.</p>
            </div>
            <Switch
              checked={draft.published}
              onCheckedChange={(published) => setDraft((current) => ({ ...current, published }))}
              aria-label="Published"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-full" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
            <Button className="rounded-full" loading={save.isPending} onClick={() => void submit()}>
              {draft.published ? "Save and publish" : "Save draft"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/** The company blog: write, publish and take down posts for turnupz.com/news. */
const CompanyNews = () => {
  const { data: posts = [], isLoading } = useAdminCompanyNews();
  const remove = useDeleteCompanyPost();
  const [editing, setEditing] = useState<ICompanyPost | null>(null);
  const [writing, setWriting] = useState(false);
  const [deleting, setDeleting] = useState<ICompanyPost | null>(null);
  const published = useMemo(() => posts.filter((post) => post.status === "published").length, [posts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeading title="Company Blog">
          News and stories from Turnupz, on turnupz.com/news. Organisers&apos; event posts are separate.
        </PageHeading>
        <Button className="rounded-full" onClick={() => setWriting(true)}>
          <Plus className="size-4" /> New post
        </Button>
      </div>
      {isLoading ? (
        <ListSkeleton />
      ) : !posts.length ? (
        <div className="rounded-2xl border border-dashed border-secondary-200 px-6 py-14 text-center">
          <p className="font-semibold text-secondary-950">No posts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Write the first one: a launch note, a new city, a product update.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {published} published · {posts.length - published} draft{posts.length - published === 1 ? "" : "s"}
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {posts.map((post) => (
              <li key={post.id} className="flex items-center gap-4 px-4 py-3">
                <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-secondary-50">
                  {post.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.cover} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{post.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    /news/{post.slug} ·{" "}
                    {post.status === "published" && post.publishedAt
                      ? `Published ${format(new Date(post.publishedAt), "d MMM yyyy")}`
                      : `Edited ${format(new Date(post.updatedAt), "d MMM yyyy")}`}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    post.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground",
                  )}
                >
                  {post.status === "published" ? "Published" : "Draft"}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  {post.status === "published" && (
                    <Button asChild variant="ghost" size="icon" aria-label="View on turnupz.com">
                      <a href={`${COMPANY_ORIGIN}/news/${post.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => setEditing(post)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleting(post)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <PostEditor
        post={editing}
        open={writing || !!editing}
        onClose={() => {
          setWriting(false);
          setEditing(null);
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.title ?? "this post"}"?`}
        description="It comes off turnupz.com/news straight away. This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        busy={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success("Post deleted");
              setDeleting(null);
            },
            onError: (error) =>
              toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't delete the post.")),
          })
        }
      />
    </div>
  );
};

export default memo(CompanyNews);
