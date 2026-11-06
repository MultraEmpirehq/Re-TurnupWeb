"use client";

import VerifiedTick from "@/components/discovery/verified-tick";
import { constructErrorMessage } from "@/api/functions";
import PerformerAvatar from "@/components/discovery/performer-avatar";
import { performerHref } from "@/components/discovery/performer-card";
import PerformerFormDialog from "@/components/discovery/performer-form-dialog";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EmptyContainer from "@/components/ui/empty-container";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PERFORMER_TYPE_LABELS,
  useDeletePerformer,
  usePerformer,
  usePerformers,
} from "@/hooks/use-discovery";
import { IPerformer, TPerformerType } from "@/lib/types";
import { cn } from "@/lib/utils";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { MoreHorizontal, Mic, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { memo, useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toast";

/** Enough to count an organiser's own performers in one go. */
const MINE_LIMIT = 200;

const TYPE_FILTERS: { value?: TPerformerType; label: string }[] = [
  { label: "All" },
  { value: "ARTIST", label: "Artists" },
  { value: "DJ", label: "DJs" },
  { value: "BAND", label: "Bands" },
  { value: "HOST", label: "Hosts" },
  { value: "SPEAKER", label: "Speakers" },
  { value: "COMEDIAN", label: "Comedians" },
  { value: "CHEF", label: "Chefs" },
  { value: "ATHLETE", label: "Athletes" },
  { value: "OTHER", label: "Other" },
];

const compactCount = (count: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(count);

const Stat: React.FC<{ label: string; value?: number; tone?: "warn" | "bad"; loading?: boolean }> = ({
  label,
  value,
  tone,
  loading,
}) => (
  <div
    className={cn(
      "rounded-2xl border bg-card p-4",
      tone === "warn" && value ? "border-amber-200 bg-amber-50/60" : "",
      tone === "bad" && value ? "border-red-200 bg-red-50/60" : "",
      !(tone && value) && "border-border",
    )}
  >
    <p
      className={cn(
        "text-[11px] font-semibold tracking-wider uppercase",
        tone === "warn" && value ? "text-amber-700" : tone === "bad" && value ? "text-red-700" : "text-muted-foreground",
      )}
    >
      {label}
    </p>
    {loading ? (
      <Skeleton className="mt-2 h-7 w-10" />
    ) : (
      <p className="mt-1 text-2xl font-bold text-secondary-950 tabular-nums">{value ?? 0}</p>
    )}
  </div>
);

const StatusPill: React.FC<{ performer: IPerformer }> = ({ performer }) => {
  if (performer.reviewStatus === "pending") {
    return <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">In review</span>;
  }
  if (performer.reviewStatus === "rejected") {
    return <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">Needs changes</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
      Live
    </span>
  );
};

/** One performer: their picture, what they are, how they're doing, and what to do next. */
const PerformerCard: React.FC<{
  performer: IPerformer;
  canManage: boolean;
  onEdit: () => void;
  onRemove: () => void;
}> = ({ performer, canManage, onEdit, onRemove }) => {
  const pending = performer.reviewStatus === "pending";
  const rejected = performer.reviewStatus === "rejected";
  const upcoming = performer.upcomingEventsCount;
  return (
    <li
      className={cn(
        "relative flex flex-col rounded-[1.4rem] border bg-card p-5 text-center shadow-[0_14px_36px_-28px_rgba(15,23,42,0.4)]",
        pending ? "border-amber-200" : rejected ? "border-red-200" : "border-secondary-100",
      )}
    >
      <div className="absolute top-4 right-4">
        <StatusPill performer={performer} />
      </div>
      <PerformerAvatar name={performer.name} image={performer.image} className="mx-auto mt-2 size-24 text-2xl" />
      <p className="mt-4 flex items-center justify-center gap-1 text-base font-bold text-secondary-950">
        <span className="truncate">{performer.name}</span>
        {performer.isVerified && <VerifiedTick />}
      </p>
      <p className="text-sm text-muted-foreground">
        {PERFORMER_TYPE_LABELS[performer.type] ?? "Performer"}
        {performer.country && ` · ${performer.country}`}
      </p>

      {pending ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          You can use them on your events now. They show in search once approved.
        </p>
      ) : rejected ? (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">
          <strong>Admin note:</strong> {performer.reviewNote || "Please check their details and send them again."}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 font-semibold",
              upcoming ? "bg-primary-50 text-primary-700" : "bg-muted text-muted-foreground",
            )}
          >
            {upcoming ? `${upcoming} upcoming ${upcoming === 1 ? "event" : "events"}` : "No upcoming events"}
          </span>
          {!!performer.followersCount && (
            <span className="text-muted-foreground">{compactCount(performer.followersCount)} followers</span>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 border-t border-secondary-100 pt-4 [&>*]:flex-1">
        {rejected && canManage ? (
          <Button size="sm" className="h-9 rounded-full" onClick={onEdit}>
            Fix and resend
          </Button>
        ) : (
          <>
            {canManage && (
              <Button size="sm" variant="outline" className="h-9 rounded-full" onClick={onEdit}>
                Edit
              </Button>
            )}
            {/* Only approved performers have a public page. */}
            {performer.isVerified !== false && (
              <Button asChild size="sm" variant="outline" className="h-9 rounded-full">
                <Link href={performerHref(performer.id)} target="_blank">
                  View page
                </Link>
              </Button>
            )}
          </>
        )}
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="size-9 flex-none! rounded-full"
                aria-label={`More for ${performer.name}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {rejected && <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>}
              <DropdownMenuItem variant="destructive" onSelect={onRemove}>
                Remove performer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </li>
  );
};

/**
 * Performers, for organisers and admins: the artists, DJs, speakers and hosts
 * on line-ups. Anyone can add one; whoever added it edits or removes it, and an
 * admin can edit or remove any. Organisers start on their own, with how many
 * are live, waiting for review or need changes. `?edit=<id>` opens a performer
 * straight in the editor (the Edit button on a performer's page links here).
 */
const PerformersManager = () => {
  const role = useUserStore((state) => state.userDetails?.role);
  const isAdmin = role === EUserRoles.ADMIN;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit") ?? undefined;

  const [scope, setScope] = useState<"mine" | "all">(isAdmin ? "all" : "mine");
  const [type, setType] = useState<TPerformerType | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Their own, all at once, for the numbers at the top.
  const mineQuery = usePerformers({ mine: true, limit: MINE_LIMIT }, !isAdmin);
  const mine = useMemo(() => mineQuery.data?.pages?.[0]?.performers ?? [], [mineQuery.data]);
  const mineTotal = mineQuery.data?.pages?.[0]?.pagination?.total ?? mine.length;

  const showingMine = !isAdmin && scope === "mine";
  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } = usePerformers({
    q: search,
    type,
    mine: showingMine,
  });
  const performers = useMemo(() => (data?.pages ?? []).flatMap((page) => page.performers), [data]);

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
        constructErrorMessage(removeError as TApiErrorResponseType, "Couldn't remove the performer."),
      );
    }
  };

  const filtered = !!search || !!type;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-secondary-950">Performers</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {isAdmin
              ? "Everyone who can be added to a line-up. You can edit or remove any of them."
              : "The artists, DJs, speakers and hosts on your line-ups. Add someone once and use them on any event."}
          </p>
        </div>
        <Button type="button" onClick={() => setAdding(true)} className="h-11 rounded-full px-5 shadow-sm">
          <Plus className="size-4" aria-hidden />
          Add performer
        </Button>
      </div>

      {!isAdmin && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Added by you" value={mineTotal} loading={mineQuery.isLoading} />
          <Stat
            label="On upcoming line-ups"
            value={mine.filter((performer) => performer.upcomingEventsCount > 0).length}
            loading={mineQuery.isLoading}
          />
          <Stat
            label="Waiting for review"
            value={mine.filter((performer) => performer.reviewStatus === "pending").length}
            tone="warn"
            loading={mineQuery.isLoading}
          />
          <Stat
            label="Need changes"
            value={mine.filter((performer) => performer.reviewStatus === "rejected").length}
            tone="bad"
            loading={mineQuery.isLoading}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {!isAdmin && (
          <div className="inline-flex w-fit rounded-full border border-border bg-card p-1" role="group" aria-label="Which performers">
            {(
              [
                ["mine", `Added by you · ${mineTotal}`],
                ["all", "All performers"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={scope === value}
                onClick={() => setScope(value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  scope === value ? "bg-secondary-950 text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:pb-0" role="group" aria-label="Type">
            {TYPE_FILTERS.map((filter) => {
              const active = type === filter.value;
              return (
                <button
                  key={filter.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setType(filter.value)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    active
                      ? "border-primary-200 bg-primary-50 text-primary-700"
                      : "border-border bg-card text-secondary-700 hover:bg-muted",
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search performers"
              className="h-10 rounded-full bg-card pl-9"
              aria-label="Search performers"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-[1.4rem]" />
          ))}
        </ul>
      ) : error ? (
        <EmptyContainer icon={<Mic className="size-6" />} title="Couldn't load performers" description="Try again in a moment." />
      ) : !performers.length && (filtered || !showingMine) ? (
        <EmptyContainer
          icon={<Mic className="size-6" />}
          title="No performers found"
          description={filtered ? "Nobody matches that search or type." : "Add the first one to start building line-ups."}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {performers.map((performer) => (
            <PerformerCard
              key={performer.id}
              performer={performer}
              canManage={canManage(performer)}
              onEdit={() => setEditing(performer)}
              onRemove={() => setRemoving(performer)}
            />
          ))}
          {/* Adding someone is always one tap from the list of your own. */}
          {(showingMine || isAdmin) && !filtered && (
            <li>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex h-full min-h-72 w-full flex-col items-center justify-center gap-3 rounded-[1.4rem] border-2 border-dashed border-primary-200 bg-primary-50/40 p-5 text-center transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <span className="flex size-14 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                  <Plus className="size-6" aria-hidden />
                </span>
                <span className="text-base font-bold text-secondary-950">Add a performer</span>
                <span className="text-xs text-muted-foreground">Name, photo, type and socials. Takes a minute.</span>
              </button>
            </li>
          )}
        </ul>
      )}

      {hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" className="rounded-full" loading={isFetchingNextPage} onClick={() => void fetchNextPage()}>
            Load more
          </Button>
        </div>
      )}

      <PerformerFormDialog open={adding || !!editing} performer={editing} onClose={closeEditor} />

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
