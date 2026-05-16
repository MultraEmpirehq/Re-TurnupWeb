"use client";

import { deleteData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/hooks/use-event";
import { IEventDetailsType } from "@/lib/types";
import useUserStore from "@/stores/user-store";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { memo, useMemo, useState } from "react";
import { toast } from "sonner";

const formatEventDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

const isUpcomingEvent = (date: Date | string) => {
  return new Date(date).getTime() >= Date.now();
};

const EventManagementCard: React.FC<{
  event: IEventDetailsType;
  onDeleteRequest: (event: IEventDetailsType) => void;
}> = ({ event, onDeleteRequest }) => {
  const badgeLabel = isUpcomingEvent(event.date) ? "Upcoming" : "Past";
  const eventDescription =
    event.description || "Complete this event listing so attendees know what to expect.";

  return (
    <article className="overflow-hidden rounded-[1.35rem] border border-secondary-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-1 sm:rounded-[1.6rem]">
      <div
        className="h-40 bg-secondary-50 bg-cover bg-center"
        style={{
          backgroundImage: event.image
            ? `linear-gradient(180deg, rgba(15,23,42,0.04), rgba(15,23,42,0.22)), url(${event.image})`
            : "linear-gradient(135deg, rgba(56,189,248,0.16), rgba(14,165,233,0.08))",
        }}
      />
      <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
      <div className="mb-4 flex flex-col gap-2">
        <div className="space-y-3">
          <h3 className="text-[1.2rem] font-semibold leading-tight text-secondary-950 sm:text-[1.35rem]">
            {event.name}
          </h3>
          <p className="line-clamp-2 max-w-md text-sm text-secondary-500">
            {eventDescription}
          </p>
        </div>
      </div>

      <div className="mb-5 overflow-hidden rounded-[1rem] border border-secondary-100 bg-secondary-50/70">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0 text-sm">
          <div className="border-b border-secondary-100 px-4 py-3 font-semibold text-secondary-950">
            Event Date
          </div>
          <div className="flex items-center gap-2 border-b border-secondary-100 px-4 py-3 text-secondary-500">
            <CalendarDays className="size-4 shrink-0 text-secondary-400" />
            <span>{formatEventDate(event.date)}</span>
          </div>

          <div className="border-b border-secondary-100 px-4 py-3 font-semibold text-secondary-950">
            Venue
          </div>
          <div className="flex items-center gap-2 border-b border-secondary-100 px-4 py-3 text-secondary-500">
            <MapPin className="size-4 shrink-0 text-secondary-400" />
            <span className="truncate">{event.venue?.name || "Venue pending"}</span>
          </div>

          <div className="border-b border-secondary-100 px-4 py-3 font-semibold text-secondary-950">
            Tickets
          </div>
          <div className="flex items-center gap-2 border-b border-secondary-100 px-4 py-3 text-secondary-500">
            <Ticket className="size-4 shrink-0 text-secondary-400" />
            <span>{(event.totalTickets ?? 0).toLocaleString()} available</span>
          </div>

          <div className="px-4 py-3 font-semibold text-secondary-950">Status</div>
          <div className="px-4 py-3 text-secondary-500">
            {badgeLabel === "Upcoming" ? "Ready to promote" : "Event has ended"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button
          asChild
          className="h-10 rounded-xl bg-secondary-400 px-3 text-sm font-semibold text-white hover:bg-secondary-500"
        >
          <Link href={`/app/events/${event.id}/edit`}>Edit</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-xl border-secondary-200 bg-white px-3 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
        >
          <Link href={`/app/events/${event.id}`}>View</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 hover:bg-red-100"
          onClick={() => onDeleteRequest(event)}
        >
          Delete
        </Button>
      </div>
      </div>
    </article>
  );
};

const EventManagementSkeleton = () => {
  return (
    <div className="rounded-[1.35rem] border border-secondary-100 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[1.6rem] sm:p-5">
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="space-y-3">
            <Skeleton className="h-7 w-32 rounded-xl sm:w-44" />
            <Skeleton className="h-4 w-full max-w-[15rem] rounded-xl sm:w-56" />
            <Skeleton className="h-4 w-full max-w-[12rem] rounded-xl sm:w-44" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-16 rounded-xl" />
        <div className="overflow-hidden rounded-[1rem] border border-secondary-100 bg-secondary-50/70">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0">
            <Skeleton className="m-3 h-4 w-20 rounded-xl" />
            <Skeleton className="m-3 h-4 rounded-xl" />
            <Skeleton className="m-3 h-4 w-16 rounded-xl" />
            <Skeleton className="m-3 h-4 rounded-xl" />
            <Skeleton className="m-3 h-4 w-16 rounded-xl" />
            <Skeleton className="m-3 h-4 rounded-xl" />
            <Skeleton className="m-3 h-4 w-16 rounded-xl" />
            <Skeleton className="m-3 h-4 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

const DashboardEvents: React.FC<{ isEventPage?: boolean }> = ({
  isEventPage = false,
}) => {
  const router = useRouter();
  const userId = useUserStore((state) => state?.userDetails?.id);
  const [eventToDelete, setEventToDelete] = useState<IEventDetailsType | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useEvents(
    { limit: isEventPage ? 24 : 6 },
  );
  const {
    data: userEventsData,
    refetch: refetchUserEvents,
  } = useEvents(
    { limit: isEventPage ? 24 : 6, userId: userId ?? undefined },
    { enabled: !!userId },
  );

  const events = useMemo(() => {
    const merged = [
      ...(data?.pages?.flatMap((page) => page?.data || []) || []),
      ...(userEventsData?.pages?.flatMap((page) => page?.data || []) || []),
    ];
    return Array.from(new Map(merged.map((event) => [event.id, event])).values());
  }, [data, userEventsData]);

  const isLoading = !data && !error;
  const shouldShowError = !!error && !data;
  const shouldShowEmpty = !isLoading && events.length === 0;
  const sectionTitle = isEventPage
    ? "Manage your published events"
    : "Manage your published events";

  const handleDeleteEvent = async () => {
    if (!eventToDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteData(`/event/${eventToDelete.id}`);
      await refetch();
      await refetchUserEvents();

      toast.success("Event deleted successfully");
      setEventToDelete(null);
    } catch (deleteError) {
      console.error("Delete event failed", deleteError);
      toast.error("Unable to delete the event right now.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
            Your Events
          </p>
          <div className="space-y-1">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[0.95] tracking-tight text-secondary-950">
              {sectionTitle}
            </h2>
            <p className="max-w-2xl text-sm text-secondary-500">
              Review your active listings, continue drafts, and keep each event
              ready for promotion.
            </p>
          </div>
        </div>
        {!isEventPage && (
          <Link
            href="/app/events"
            className="text-sm font-medium text-secondary-500 transition-colors hover:text-secondary-400"
          >
            View Listed Events
          </Link>
        )}
      </div>

      {(isLoading || events.length > 0) && (
        <div className="grid max-w-[78rem] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading &&
            Array.from({ length: isEventPage ? 6 : 3 }).map((_, index) => (
              <EventManagementSkeleton key={index} />
            ))}
          {!isLoading &&
            events.length > 0 &&
            events.map((event) => (
              <EventManagementCard
                key={event.id}
                event={event}
                onDeleteRequest={setEventToDelete}
              />
            ))}
        </div>
      )}

      {shouldShowError && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Unknown error occurred whilst getting events list",
          )}
          retryFunction={refetch}
        />
      )}

      {shouldShowEmpty && (
        <EmptyContainer
          icon={<CalendarDays className="size-10" />}
          title="No events found"
          description="Create your first event and it will show up in this management board."
          action={() => router.push("/app/create")}
          actionText="Create Event"
        />
      )}

      {hasNextPage && fetchNextPage && isEventPage && (
        <div className="flex items-center justify-start">
          <Button
            disabled={isFetchingNextPage}
            variant="outline"
            className="rounded-2xl border-secondary-200 px-6"
            onClick={() => fetchNextPage?.()}
          >
            {isFetchingNextPage ? "Loading..." : "See more"}
          </Button>
        </div>
      )}

      <Dialog
        open={!!eventToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setEventToDelete(null);
          }
        }}
      >
        <DialogContent className="rounded-[1.6rem] border-secondary-100 p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-secondary-950">
              Delete this event?
            </DialogTitle>
            <DialogDescription className="text-sm leading-7 text-secondary-500">
              {eventToDelete
                ? `Are you sure you want to delete "${eventToDelete.name}"? This action cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-secondary-200"
              disabled={isDeleting}
              onClick={() => setEventToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-2xl bg-red-600 text-white hover:bg-red-700"
              disabled={isDeleting}
              onClick={handleDeleteEvent}
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default memo(DashboardEvents);
