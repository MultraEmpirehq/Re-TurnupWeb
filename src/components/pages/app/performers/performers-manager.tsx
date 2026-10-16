"use client";

import { constructErrorMessage } from "@/api/functions";
import PerformerAvatar from "@/components/discovery/performer-avatar";
import { performerHref } from "@/components/discovery/performer-card";
import PerformerFormDialog from "@/components/discovery/performer-form-dialog";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PERFORMER_TYPE_LABELS,
  useDeletePerformer,
  usePerformer,
  usePerformers,
} from "@/hooks/use-discovery";
import { IPerformer } from "@/lib/types";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { ExternalLink, Mic, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/**
 * Performers, for organisers and admins. Anyone can add one; whoever added it
 * edits or removes it, and an admin can edit or remove any of them.
 * `?edit=<id>` opens a performer straight in the editor (the Edit button on a
 * performer's public page links here).
 */
const PerformersManager = () => {
  const role = useUserStore((state) => state.userDetails?.role);
  const isAdmin = role === EUserRoles.ADMIN;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit") ?? undefined;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = usePerformers({ q: search });
  const performers = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.performers),
    [data],
  );

  const { data: linkedPerformer } = usePerformer(editId);
  const [editing, setEditing] = useState<IPerformer | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<IPerformer | null>(null);
  const remove = useDeletePerformer();

  useEffect(() => {
    if (linkedPerformer) setEditing(linkedPerformer);
  }, [linkedPerformer]);

  const closeEditor = () => {
    setEditing(null);
    setAdding(false);
    if (editId) router.replace(pathname);
  };

  const canManage = (performer: IPerformer) => isAdmin || !!performer.isOwner;

  const handleRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      toast.success(`${removing.name} removed.`);
      setRemoving(null);
    } catch (removeError) {
      toast.error(
        constructErrorMessage(
          removeError as TApiErrorResponseType,
          "Couldn't remove the performer.",
        ),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-secondary-800">Performers</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {isAdmin
              ? "Everyone who can be added to a line-up. You can edit or remove any of them."
              : "Add the artists, DJs, speakers and hosts on your events. You can edit the ones you added."}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-xl bg-secondary text-white hover:bg-secondary-600"
        >
          <Plus className="size-4" aria-hidden />
          Add performer
        </Button>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search performers"
          className="pl-9"
          aria-label="Search performers"
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (error || performers.length === 0) && (
        <EmptyContainer
          icon={<Mic className="size-6" />}
          title={error ? "Couldn't load performers" : "No performers found"}
          description={
            search
              ? "No performer matches that search."
              : "Add the first one to start building line-ups."
          }
        />
      )}

      {performers.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {performers.map((performer) => (
            <li
              key={performer.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <PerformerAvatar
                name={performer.name}
                image={performer.image}
                className="size-11 text-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {performer.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {PERFORMER_TYPE_LABELS[performer.type] ?? "Performer"}
                  {performer.country && ` · ${performer.country}`}
                  {` · ${performer.upcomingEventsCount} upcoming`}
                  {performer.isOwner && " · added by you"}
                </p>
                {performer.reviewStatus === "pending" && (
                  <p className="text-xs text-secondary-600">
                    Waiting for review. You can use them on your events; they
                    show in search once approved.
                  </p>
                )}
                {performer.reviewStatus === "rejected" && (
                  <p className="text-xs text-red-700">
                    Needs changes
                    {performer.reviewNote ? `: ${performer.reviewNote}` : ""}.
                    Edit to send it again.
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  aria-label="View page"
                >
                  <Link href={performerHref(performer.id)} target="_blank">
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
                {canManage(performer) && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${performer.name}`}
                      onClick={() => setEditing(performer)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${performer.name}`}
                      onClick={() => setRemoving(performer)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            loading={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            Load more
          </Button>
        </div>
      )}

      <PerformerFormDialog
        open={adding || !!editing}
        performer={editing}
        onClose={closeEditor}
      />

      <ConfirmDialog
        open={!!removing}
        title={`Remove ${removing?.name ?? "this performer"}?`}
        description="They come off every line-up they're on, and their page goes. This can't be undone."
        confirmLabel="Remove"
        tone="danger"
        busy={remove.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => void handleRemove()}
      />
    </div>
  );
};

export default memo(PerformersManager);
