"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import { Input } from "@/components/ui/input";
import ResultPagination from "@/components/ui/result-pagination";
import { Textarea } from "@/components/ui/textarea";
import {
  CATALOGUE_PAGE_SIZE,
  IPerformerForReview,
  IVenueSuggestion,
  TCatalogueStatus,
  useApproveVenueSuggestion,
  useCatalogueReviewCounts,
  useDismissVenueSuggestion,
  usePerformersForReview,
  useReviewPerformer,
  useVenueSuggestions,
} from "@/hooks/use-catalogue-reviews";
import { useVenues } from "@/hooks/use-venue";
import { ROUTES } from "@/lib/variables";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ExternalLink, MapPin, Mic } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { FilterTabs, ListSkeleton, PageHeading } from "./moderation-ui";

const STATUS_TABS: { value: TCatalogueStatus; label: string }[] = [
  { value: "PENDING", label: "Waiting" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Not added" },
];

const who = (
  person?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null,
) =>
  person
    ? [person.firstName, person.lastName].filter(Boolean).join(" ") ||
      person.email
    : "—";

const failed = (fallback: string) => (error: unknown) =>
  toast.error(constructErrorMessage(error as TApiErrorResponseType, fallback));

/**
 * What organisers add to the shared directory: venues they typed in on an event
 * and performers they created. Events go live without review; these join the
 * directory (search, charts, venue pages) only once approved.
 */
const CatalogueReviews = () => {
  const [kind, setKind] = useState<"venues" | "performers">("venues");
  const [status, setStatus] = useState<TCatalogueStatus>("PENDING");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [kind, status]);
  const counts = useCatalogueReviewCounts();

  return (
    <div className="space-y-6">
      <PageHeading title="Venue & performer reviews">
        Events go live without review. What organisers add to the shared
        directory waits here: venues typed in on an event, and performers they
        created. They can use them on their own events in the meantime.
      </PageHeading>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs
          tabs={[
            {
              value: "venues" as const,
              label: `Venues${counts.data?.venues ? ` (${counts.data.venues})` : ""}`,
            },
            {
              value: "performers" as const,
              label: `Performers${counts.data?.performers ? ` (${counts.data.performers})` : ""}`,
            },
          ]}
          value={kind}
          onChange={setKind}
        />
        <FilterTabs tabs={STATUS_TABS} value={status} onChange={setStatus} />
      </div>

      {kind === "venues" ? (
        <VenueList status={status} page={page} onPage={setPage} />
      ) : (
        <PerformerList status={status} page={page} onPage={setPage} />
      )}
    </div>
  );
};

/* ---------------------------------------------------------------- venues */

const VenueList: React.FC<{
  status: TCatalogueStatus;
  page: number;
  onPage: (page: number) => void;
}> = ({ status, page, onPage }) => {
  const { data, error, isLoading, refetch } = useVenueSuggestions(status, page);
  const items = data?.items ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / CATALOGUE_PAGE_SIZE);
  return (
    <>
      {isLoading && <ListSkeleton />}
      {!!error && !isLoading && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Could not load venues",
          )}
          retryFunction={() => void refetch()}
        />
      )}
      {!isLoading && !error && items.length === 0 && (
        <EmptyContainer
          icon={<MapPin className="size-6" />}
          title={status === "PENDING" ? "No venues waiting" : "Nothing here"}
          description="Venues organisers type in on their events show up here."
        />
      )}
      <ul className="space-y-3">
        {items.map((suggestion) => (
          <VenueCard key={suggestion.id} suggestion={suggestion} />
        ))}
      </ul>
      {totalPages > 1 && (
        <ResultPagination
          totalPages={totalPages}
          currentPage={page}
          onPageChange={onPage}
        />
      )}
    </>
  );
};

const VenueCard: React.FC<{ suggestion: IVenueSuggestion }> = ({
  suggestion,
}) => {
  const approve = useApproveVenueSuggestion();
  const dismiss = useDismissVenueSuggestion();
  const [search, setSearch] = useState(suggestion.name);
  const [q] = useDebounce(search.trim(), 300);
  const [venueId, setVenueId] = useState("");
  const [dismissing, setDismissing] = useState(false);
  const [note, setNote] = useState("");
  const isPending = suggestion.status === "PENDING";
  const { data } = useVenues(q ? { q } : undefined, isPending && q.length >= 2);
  const matches = useMemo(
    () =>
      (data?.pages?.flatMap((p) => p?.data ?? []) ?? [])
        .filter((venue) => !venue.id.startsWith("custom-venue-"))
        .slice(0, 5),
    [data],
  );
  const place = [suggestion.city, suggestion.state, suggestion.country]
    .filter(Boolean)
    .join(", ");

  return (
    <li className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{suggestion.name}</p>
          <p className="text-sm text-muted-foreground">
            {[suggestion.address, place].filter(Boolean).join(" · ") ||
              "No address given"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Typed by {who(suggestion.creator)}
            {suggestion.event &&
              ` for “${suggestion.event.name}” on ${format(new Date(suggestion.event.date), "d MMM yyyy")}`}
            {" · "}
            {formatDistanceToNow(new Date(suggestion.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        {suggestion.venue && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            Linked to {suggestion.venue.name}
          </span>
        )}
        {suggestion.status === "REJECTED" && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Not added{suggestion.reviewNote ? `: ${suggestion.reviewNote}` : ""}
          </span>
        )}
      </div>

      {isPending && (
        <div className="space-y-3 rounded-lg bg-muted/40 p-3">
          <p className="text-sm font-medium">
            Add to the directory: pick the venue it is
          </p>
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setVenueId("");
            }}
            placeholder="Search the venue directory"
          />
          {matches.length > 0 ? (
            <div className="grid gap-1.5">
              {matches.map((venue) => (
                <button
                  key={venue.id}
                  type="button"
                  onClick={() => setVenueId(venue.id)}
                  aria-pressed={venueId === venue.id}
                  className={cn(
                    "rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-card",
                    venueId === venue.id &&
                      "border-secondary-800 bg-card ring-1 ring-secondary-800",
                  )}
                >
                  <span className="font-medium">{venue.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {venue.address}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Not in the directory yet?{" "}
              <Link
                href={ROUTES.CREATE_VENUE.href}
                target="_blank"
                className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:underline"
              >
                Create it <ExternalLink className="size-3" />
              </Link>{" "}
              (with its map location), then search for it here.
            </p>
          )}

          {dismissing ? (
            <div className="space-y-2">
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                placeholder="Why it's not being added (optional, for the team)"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={dismiss.isPending}
                  onClick={() =>
                    dismiss.mutate(
                      { id: suggestion.id, note: note.trim() || undefined },
                      {
                        onSuccess: () =>
                          toast.success("Left out of the directory"),
                        onError: failed("Couldn't update it"),
                      },
                    )
                  }
                >
                  Don&apos;t add it
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDismissing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={!venueId || approve.isPending}
                onClick={() =>
                  approve.mutate(
                    { id: suggestion.id, venueId },
                    {
                      onSuccess: () =>
                        toast.success(
                          "Added. The event now links to that venue.",
                        ),
                      onError: failed("Couldn't add it"),
                    },
                  )
                }
              >
                Add and link the event
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDismissing(true)}
              >
                Don&apos;t add
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Either way the event stays live with the name the organiser typed.
          </p>
        </div>
      )}
    </li>
  );
};

/* ------------------------------------------------------------ performers */

const PerformerList: React.FC<{
  status: TCatalogueStatus;
  page: number;
  onPage: (page: number) => void;
}> = ({ status, page, onPage }) => {
  const { data, error, isLoading, refetch } = usePerformersForReview(
    status,
    page,
  );
  const items = data?.items ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / CATALOGUE_PAGE_SIZE);
  return (
    <>
      {isLoading && <ListSkeleton />}
      {!!error && !isLoading && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Could not load performers",
          )}
          retryFunction={() => void refetch()}
        />
      )}
      {!isLoading && !error && items.length === 0 && (
        <EmptyContainer
          icon={<Mic className="size-6" />}
          title={
            status === "PENDING" ? "No performers waiting" : "Nothing here"
          }
          description="Performers organisers add show up here before they're listed."
        />
      )}
      <ul className="space-y-3">
        {items.map((performer) => (
          <PerformerCard key={performer.id} performer={performer} />
        ))}
      </ul>
      {totalPages > 1 && (
        <ResultPagination
          totalPages={totalPages}
          currentPage={page}
          onPageChange={onPage}
        />
      )}
    </>
  );
};

const PerformerCard: React.FC<{ performer: IPerformerForReview }> = ({
  performer,
}) => {
  const review = useReviewPerformer();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const links = [
    performer.instagram && `Instagram: ${performer.instagram}`,
    performer.twitter && `X: ${performer.twitter}`,
    performer.website,
  ].filter(Boolean);

  const decide = (decision: "approve" | "reject") =>
    review.mutate(
      {
        id: performer.id,
        decision,
        note: decision === "reject" ? note.trim() : undefined,
      },
      {
        onSuccess: () =>
          toast.success(
            decision === "approve"
              ? `${performer.name} is approved`
              : "Sent back with your note",
          ),
        onError: failed("Couldn't save the review"),
      },
    );

  return (
    <li className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-4">
        {performer.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={performer.image}
            alt=""
            className="size-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Mic className="size-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{performer.name}</p>
          <p className="text-xs text-muted-foreground">
            {performer.type.toLowerCase()}
            {performer.country ? ` · ${performer.country}` : ""} · on{" "}
            {performer.eventsCount} event
            {performer.eventsCount === 1 ? "" : "s"}
          </p>
          {performer.bio && (
            <p className="mt-2 text-sm text-foreground">{performer.bio}</p>
          )}
          {links.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {links.join(" · ")}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Added by {who(performer.creatorDetails)} ·{" "}
            {formatDistanceToNow(new Date(performer.updatedAt), {
              addSuffix: true,
            })}
          </p>
          {performer.reviewStatus === "REJECTED" && performer.reviewNote && (
            <p className="mt-1 text-xs text-red-700">
              Sent back: {performer.reviewNote}
            </p>
          )}
        </div>
      </div>

      {performer.reviewStatus === "PENDING" &&
        (rejecting ? (
          <div className="space-y-2">
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              placeholder="What needs changing? The organiser is told."
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={!note.trim() || review.isPending}
                onClick={() => decide("reject")}
              >
                Send back
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRejecting(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={review.isPending}
              onClick={() => decide("approve")}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRejecting(true)}
            >
              Send back
            </Button>
          </div>
        ))}
    </li>
  );
};

export default memo(CatalogueReviews);
