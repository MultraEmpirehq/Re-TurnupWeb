"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import CustomImageComponent from "@/components/ui/custom-image.component";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import ResultPagination from "@/components/ui/result-pagination";
import {
  IEventAwaitingReview,
  MODERATION_PAGE_SIZE,
  useApproveEvent,
  useEventReviews,
  useRejectEvent,
} from "@/hooks/use-admin-moderation";
import { ROUTES } from "@/lib/variables";
import { format, formatDistanceToNow } from "date-fns";
import {
  CalendarDays,
  ClipboardCheck,
  ExternalLink,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import React, { memo, useState } from "react";
import { toast } from "@/lib/toast";
import { ListSkeleton, NoteDialog, PageHeading } from "./moderation-ui";

const errorText = (error: unknown, fallback: string) =>
  constructErrorMessage(error as TApiErrorResponseType, fallback);

/**
 * Every new event waits here until an admin approves it. Approving puts it live;
 * sending it back returns it to the organiser's drafts with a note.
 */
const EventReviews = () => {
  const [page, setPage] = useState(1);
  const { data, error, isLoading, refetch } = useEventReviews(page);
  const approve = useApproveEvent();
  const reject = useRejectEvent();
  const [sendingBack, setSendingBack] = useState<IEventAwaitingReview | null>(
    null,
  );
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const events = data?.items ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / MODERATION_PAGE_SIZE);

  const handleApprove = async (event: IEventAwaitingReview) => {
    setApprovingId(event.id);
    try {
      await approve.mutateAsync(event.id);
      toast.success(`"${event.name}" is live.`);
    } catch (approveError) {
      toast.error(errorText(approveError, "Couldn't approve the event."));
    } finally {
      setApprovingId(null);
    }
  };

  const handleSendBack = async (reason: string) => {
    if (!sendingBack) return;
    try {
      await reject.mutateAsync({ id: sendingBack.id, reason });
      toast.success("Sent back to the organiser with your note.");
      setSendingBack(null);
    } catch (rejectError) {
      toast.error(errorText(rejectError, "Couldn't send the event back."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading title="Event Approvals">
        New events wait here before attendees can see them, oldest first. Check
        the details and images, then approve it or send it back with what to
        change.
      </PageHeading>

      {isLoading && <ListSkeleton />}

      {!!error && !isLoading && (
        <ErrorContainer
          error={errorText(error, "Could not load the review queue")}
          retryFunction={() => void refetch()}
        />
      )}

      {!isLoading && !error && events.length === 0 && (
        <EmptyContainer
          icon={<ClipboardCheck className="size-6" />}
          title="Nothing to review"
          description="New events submitted by organisers will show up here."
        />
      )}

      <ul className="space-y-3">
        {events.map((event) => (
          <li
            key={event.id}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
          >
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-secondary-50 sm:w-44">
              {event.image && (
                <CustomImageComponent
                  fill
                  src={event.image}
                  alt={event.name}
                  className="size-full rounded-none"
                  imageClassName="object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="truncate font-semibold text-foreground">
                {event.name}
              </p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {event.date && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3.5" aria-hidden />
                    {format(new Date(event.date), "EEE d MMM yyyy, h:mm a")}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <UserRound className="size-3.5" aria-hidden />
                  {event.organiser.name ||
                    event.organizerName ||
                    event.organiser.email}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Submitted{" "}
                {formatDistanceToNow(new Date(event.submittedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-xl">
                <Link
                  href={`${ROUTES.EXPLORE.href}/event/${event.id}`}
                  target="_blank"
                >
                  <ExternalLink className="size-4" />
                  Preview
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-secondary-200 bg-secondary-50 text-secondary-800 hover:bg-secondary-100"
                onClick={() => setSendingBack(event)}
              >
                Send back
              </Button>
              <Button
                type="button"
                className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                loading={approvingId === event.id}
                disabled={!!approvingId}
                onClick={() => void handleApprove(event)}
              >
                Approve
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <ResultPagination
          totalPages={totalPages}
          currentPage={page}
          onPageChange={setPage}
        />
      )}

      <NoteDialog
        open={!!sendingBack}
        title={`Send "${sendingBack?.name ?? ""}" back?`}
        description="It goes back to the organiser's drafts with your note, and they're told what to change."
        label="What needs changing"
        placeholder="For example: the cover image belongs to another event. Use your own."
        confirmLabel="Send back"
        required
        busy={reject.isPending}
        onCancel={() => setSendingBack(null)}
        onConfirm={(note) => void handleSendBack(note)}
      />
    </div>
  );
};

export default memo(EventReviews);
