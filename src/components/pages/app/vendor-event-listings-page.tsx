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
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/hooks/use-event";
import { IEventDetailsType } from "@/lib/types";
import useUserStore from "@/stores/user-store";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { memo, useMemo, useState } from "react";
import { toast } from "sonner";

const getEventDate = (event: IEventDetailsType) => {
  return event.date;
};

const isValidDate = (date?: Date | string | null) => {
  if (!date) return false;
  return !Number.isNaN(new Date(date).getTime());
};

const formatEventDate = (date?: Date | string | null) => {
  if (!isValidDate(date)) return "Date pending";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date as Date | string));
};

const isUpcomingEvent = (date?: Date | string | null) => {
  if (!isValidDate(date)) return true;
  return new Date(date as Date | string).getTime() >= Date.now();
};

const getEventsFromPages = (pages: any): IEventDetailsType[] => {
  if (!Array.isArray(pages)) return [];

  return pages.flatMap((page) => {
    if (Array.isArray(page?.data)) return page.data;
    if (Array.isArray(page?.data?.data)) return page.data.data;
    if (Array.isArray(page?.events)) return page.events;
    if (Array.isArray(page)) return page;

    return [];
  });
};

const EventListingCard: React.FC<{
  event: IEventDetailsType;
  onDeleteRequest: (event: IEventDetailsType) => void;
}> = ({ event, onDeleteRequest }) => {
  const eventDate = getEventDate(event);

  const isDraft = event.status === "draft";

  const badgeLabel = isDraft
    ? "Draft"
    : isUpcomingEvent(eventDate)
      ? "Upcoming"
      : "Past";

  const editHref = isDraft
    ? `/app/create?draftId=${event.id}`
    : `/app/events/${event.id}/edit`;

  const previewHref = `/app/events/${event.id}`;

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
          <div className="space-y-2">
            <h3 className="text-[1.2rem] font-semibold leading-tight text-secondary-950 sm:text-[1.3rem]">
              {event.name || "Untitled event"}
            </h3>
          </div>
        </div>

        <p className="mb-4 line-clamp-2 text-sm text-secondary-500">
          {event.description || "No event description has been added yet."}
        </p>

        <div className="mb-5 overflow-hidden rounded-[1rem] border border-secondary-100 bg-secondary-50/70">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0 text-sm">
            <div className="border-b border-secondary-100 px-4 py-3 font-semibold text-secondary-950">
              Event Date
            </div>

            <div className="flex items-center gap-2 border-b border-secondary-100 px-4 py-3 text-secondary-500">
              <CalendarDays className="size-4 shrink-0 text-secondary-400" />
              <span>{formatEventDate(eventDate)}</span>
            </div>

            <div className="border-b border-secondary-100 px-4 py-3 font-semibold text-secondary-950">
              Venue
            </div>

            <div className="flex items-center gap-2 border-b border-secondary-100 px-4 py-3 text-secondary-500">
              <MapPin className="size-4 shrink-0 text-secondary-400" />
              <span className="truncate">
                {event.venue?.name || "Venue pending"}
              </span>
            </div>

            <div className="border-b border-secondary-100 px-4 py-3 font-semibold text-secondary-950">
              Tickets
            </div>

            <div className="flex items-center gap-2 border-b border-secondary-100 px-4 py-3 text-secondary-500">
              <Ticket className="size-4 shrink-0 text-secondary-400" />
              <span>
                {(event.totalTickets ?? 0).toLocaleString()} published
              </span>
            </div>

            <div className="px-4 py-3 font-semibold text-secondary-950">
              Status
            </div>

            <div className="px-4 py-3 text-secondary-500">
              {isDraft
                ? "Incomplete draft"
                : badgeLabel === "Upcoming"
                  ? "Ready to promote"
                  : "Archived event"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            asChild
            className="h-10 rounded-xl bg-secondary-400 px-3 text-sm font-semibold text-white hover:bg-secondary-500"
          >
            <Link href={editHref}>{isDraft ? "Continue" : "Edit"}</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl border-secondary-200 bg-white px-3 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
          >
            <Link href={previewHref}>Preview</Link>
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

const ListingSection: React.FC<{
  eyebrow: string;
  title: string;
  events: IEventDetailsType[];
  emptyState: string;
  onDeleteRequest: (event: IEventDetailsType) => void;
}> = ({ eyebrow, title, events, emptyState, onDeleteRequest }) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-secondary-400">
            {eyebrow}
          </p>

          <h2 className="mt-2 text-2xl font-bold text-secondary-950">
            {title}
          </h2>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-[1.8rem] border border-secondary-100 bg-white p-8 text-secondary-500 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          {emptyState}
        </div>
      ) : (
        <div className="grid max-w-[78rem] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event, index) => (
            <EventListingCard
              key={event.id || index}
              event={event}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ListingsPageSkeleton = () => {
  return (
    <div className="space-y-10">
      <div className="rounded-[2rem] border border-secondary-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <Skeleton className="h-4 w-40 rounded-xl" />
        <Skeleton className="mt-4 h-10 w-72 rounded-xl" />
        <Skeleton className="mt-4 h-4 w-full max-w-2xl rounded-xl" />
      </div>
    </div>
  );
};

const VendorEventListingsPage = () => {
  const searchParams = useSearchParams();

  const pageSearchQuery = searchParams.get("q")?.trim() ?? "";

  const userId = useUserStore((state) => state?.userDetails?.id);

  const [eventToDelete, setEventToDelete] =
    useState<IEventDetailsType | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const { data, error, refetch } = useEvents({
    limit: 40,
    q: pageSearchQuery || undefined,
  });

  const {
    data: userEventsData,
    refetch: refetchUserEvents,
  } = useEvents(
    {
      limit: 40,
      userId: userId ?? undefined,
      q: pageSearchQuery || undefined,
    },
    {
      enabled: !!userId,
    },
  );

  const events = useMemo(() => {
    const allEvents = [
      ...getEventsFromPages(data?.pages),
      ...getEventsFromPages(userEventsData?.pages),
    ];

    return Array.from(
      new Map(
        allEvents.map((event, index) => [
          event.id || `event-${index}`,
          event,
        ]),
      ).values(),
    );
  }, [data, userEventsData]);

  const upcomingEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          event.status !== "draft" &&
          isUpcomingEvent(getEventDate(event)),
      ),
    [events],
  );

  const pastEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          event.status !== "draft" &&
          !isUpcomingEvent(getEventDate(event)),
      ),
    [events],
  );

  const draftEvents = useMemo(
    () => events.filter((event) => event.status === "draft"),
    [events],
  );

  const isLoading = false;

  const shouldShowError = !!error && !data;

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    setIsDeleting(true);

    try {
      await deleteData(`/event/${eventToDelete.id}`);

      await refetch();

      if (userId) {
        await refetchUserEvents();
      }

      toast.success("Event deleted successfully");

      setEventToDelete(null);
    } catch (deleteError) {
      console.error("Delete event failed", deleteError);

      toast.error("Unable to delete the event right now.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <ListingsPageSkeleton />;
  }

  if (shouldShowError) {
    return (
      <ErrorContainer
        error={constructErrorMessage(
          error as TApiErrorResponseType,
          "Unable to load your event listings right now.",
        )}
        retryFunction={refetch}
      />
    );
  }

  return (
    <main className="space-y-10">
      <section>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
              Event Listings
            </p>

            <h1 className="text-[clamp(1.8rem,3.2vw,2.7rem)] font-bold leading-[0.98] tracking-tight text-secondary-950">
              Manage your event listings
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-secondary-500 sm:text-base">
              Review drafts, upcoming events, and past listings from one place.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-2xl border-secondary-200 px-5 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
            >
              <Link href="/app">Back to Dashboard</Link>
            </Button>

            <Button
              asChild
              className="h-12 rounded-2xl bg-secondary-400 px-5 text-sm font-semibold text-white hover:bg-secondary-500"
            >
              <Link href="/app/create">Create Event</Link>
            </Button>
          </div>
        </div>
      </section>

      <ListingSection
        eyebrow="Drafts"
        title={`${draftEvents.length} draft event${
          draftEvents.length === 1 ? "" : "s"
        }`}
        events={draftEvents}
        emptyState="No event drafts yet."
        onDeleteRequest={setEventToDelete}
      />

      <ListingSection
        eyebrow="Upcoming"
        title={`${upcomingEvents.length} upcoming event${
          upcomingEvents.length === 1 ? "" : "s"
        }`}
        events={upcomingEvents}
        emptyState="No upcoming events created yet."
        onDeleteRequest={setEventToDelete}
      />

      <ListingSection
        eyebrow="Archive"
        title={`${pastEvents.length} past event${
          pastEvents.length === 1 ? "" : "s"
        }`}
        events={pastEvents}
        emptyState="No past events yet."
        onDeleteRequest={setEventToDelete}
      />

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
    </main>
  );
};

export default memo(VendorEventListingsPage);