"use client";

import { deleteData, patchData } from "@/api";
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
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { useEvents } from "@/hooks/use-event";
import { IEventDetailsType } from "@/lib/types";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import TextareaField from "@/components/ui/textarea-field";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { memo, useEffect, useMemo, useState } from "react";
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

type TCardActions = {
  onDeleteRequest: (event: IEventDetailsType) => void;
  onSuspendRequest: (event: IEventDetailsType) => void;
  onRestore: (event: IEventDetailsType) => void;
  restoringId: string | null;
};

const EventListingCard: React.FC<{
  event: IEventDetailsType;
  actions: TCardActions;
}> = ({ event, actions }) => {
  const eventDate = getEventDate(event);

  const isDraft = event.status === "draft";
  const isSuspended = event.status === "suspended";
  const isAdmin = useUserStore(
    (state) => state.userDetails?.role === EUserRoles.ADMIN,
  );
  const { has } = useAdminPermissions();
  // Only admins allowed to moderate events act on other organisers' events.
  const canModerate = isAdmin && has("EVENTS_MODERATE");
  // Only the organiser edits; a moderating admin can also remove anyone's event.
  const canEdit = event.isOwner === true;
  const canDelete = canEdit || canModerate;
  // Moderators take a published event down or bring a suspended one back.
  const canSuspend = canModerate && event.status === "published";
  const canRestore = canModerate && isSuspended;
  const buttonCount =
    1 + Number(canEdit) + Number(canDelete) + Number(canSuspend || canRestore);

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
            {isAdmin && !canEdit && event.organizerName && (
              <p className="text-xs font-medium text-secondary-400">
                By {event.organizerName}
              </p>
            )}
          </div>
        </div>

        {isSuspended && (
          <div className="mb-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Suspended by an admin</p>
            {event.suspensionReason && (
              <p className="mt-1 line-clamp-3 text-amber-700">
                {event.suspensionReason}
              </p>
            )}
            {!isAdmin && (
              <p className="mt-1 text-xs text-amber-700">
                Hidden from attendees until an admin restores it.
              </p>
            )}
          </div>
        )}

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
                : isSuspended
                  ? "Suspended"
                  : badgeLabel === "Upcoming"
                    ? "Ready to promote"
                    : "Archived event"}
            </div>
          </div>
        </div>

        <div
          className={`grid gap-2 ${
            buttonCount === 3
              ? "grid-cols-3"
              : buttonCount === 1
                ? "grid-cols-1"
                : "grid-cols-2"
          }`}
        >
          {canEdit && (
            <Button
              asChild
              className="h-10 rounded-xl bg-secondary-400 px-3 text-sm font-semibold text-white hover:bg-secondary-500"
            >
              <Link href={editHref}>{isDraft ? "Continue" : "Edit"}</Link>
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl border-secondary-200 bg-white px-3 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
          >
            <Link href={previewHref}>Preview</Link>
          </Button>

          {canSuspend && (
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-800 hover:bg-amber-100"
              onClick={() => actions.onSuspendRequest(event)}
            >
              Suspend
            </Button>
          )}

          {canRestore && (
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              loading={actions.restoringId === event.id}
              disabled={!!actions.restoringId}
              onClick={() => actions.onRestore(event)}
            >
              Restore
            </Button>
          )}

          {canDelete && (
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 hover:bg-red-100"
              onClick={() => actions.onDeleteRequest(event)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

// Three full rows of the three-column grid.
const LISTINGS_BATCH_SIZE = 9;

const ListingSection: React.FC<{
  eyebrow: string;
  title: string;
  events: IEventDetailsType[];
  emptyState: string;
  actions: TCardActions;
}> = ({ eyebrow, title, events, emptyState, actions }) => {
  const [visibleCount, setVisibleCount] = useState(LISTINGS_BATCH_SIZE);
  const visibleEvents = events.slice(0, visibleCount);
  const remaining = events.length - visibleEvents.length;

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
          {visibleEvents.map((event, index) => (
            <EventListingCard
              key={event.id || index}
              event={event}
              actions={actions}
            />
          ))}
        </div>
      )}

      {remaining > 0 && (
        <div className="flex max-w-[78rem] justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setVisibleCount((count) => count + LISTINGS_BATCH_SIZE)
            }
            className="h-11 rounded-2xl border-secondary-200 px-6 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
          >
            Load more
            <span className="text-secondary-400">({remaining} more)</span>
          </Button>
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
  const isAdmin = useUserStore(
    (state) => state?.userDetails?.role === EUserRoles.ADMIN,
  );

  const [eventToDelete, setEventToDelete] = useState<IEventDetailsType | null>(
    null,
  );

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  // An admin removing someone else's event says why; the organiser is told.
  const needsReason =
    isAdmin && !!eventToDelete && eventToDelete.isOwner !== true;

  const [eventToSuspend, setEventToSuspend] =
    useState<IEventDetailsType | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // A vendor sees only their own events (drafts included); an admin sees every
  // published and suspended event on the platform. Every page is fetched, so the sections and their
  // "Load more" cover the whole list, not just the first page.
  const {
    data,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useEvents(
    {
      limit: 100,
      userId: isAdmin ? undefined : (userId ?? undefined),
      includeSuspended: isAdmin || undefined,
      q: pageSearchQuery || undefined,
    },
    {
      enabled: !!userId,
    },
  );

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !error) {
      void fetchNextPage();
    }
  }, [error, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const events = useMemo(() => {
    const allEvents = getEventsFromPages(data?.pages);

    return Array.from(
      new Map(
        allEvents.map((event, index) => [event.id || `event-${index}`, event]),
      ).values(),
    );
  }, [data]);

  const upcomingEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          event.status === "published" && isUpcomingEvent(getEventDate(event)),
      ),
    [events],
  );

  const pastEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          event.status === "published" && !isUpcomingEvent(getEventDate(event)),
      ),
    [events],
  );

  const draftEvents = useMemo(
    () => events.filter((event) => event.status === "draft"),
    [events],
  );

  const suspendedEvents = useMemo(
    () => events.filter((event) => event.status === "suspended"),
    [events],
  );

  const closeSuspendDialog = () => {
    setEventToSuspend(null);
    setSuspendReason("");
  };

  const handleSuspendEvent = async () => {
    if (!eventToSuspend || !suspendReason.trim()) return;
    setIsSuspending(true);
    try {
      await patchData(`/event/${eventToSuspend.id}/suspend`, {
        reason: suspendReason.trim(),
      });
      await refetch();
      toast.success("Event suspended. The organiser has been told why.");
      closeSuspendDialog();
    } catch (suspendError) {
      toast.error(
        constructErrorMessage(
          suspendError as TApiErrorResponseType,
          "Unable to suspend the event right now.",
        ),
      );
    } finally {
      setIsSuspending(false);
    }
  };

  const handleRestoreEvent = async (event: IEventDetailsType) => {
    setRestoringId(event.id);
    try {
      await patchData(`/event/${event.id}/restore`, undefined);
      await refetch();
      toast.success("Event restored and visible to attendees again.");
    } catch (restoreError) {
      toast.error(
        constructErrorMessage(
          restoreError as TApiErrorResponseType,
          "Unable to restore the event right now.",
        ),
      );
    } finally {
      setRestoringId(null);
    }
  };

  const cardActions: TCardActions = {
    onDeleteRequest: setEventToDelete,
    onSuspendRequest: setEventToSuspend,
    onRestore: handleRestoreEvent,
    restoringId,
  };

  const isLoading = !data && !error;

  const shouldShowError = !!error && !data;

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    setIsDeleting(true);

    try {
      const reason = deleteReason.trim();
      await deleteData(
        needsReason
          ? `/event/${eventToDelete.id}?reason=${encodeURIComponent(reason)}`
          : `/event/${eventToDelete.id}`,
      );

      await refetch();

      toast.success(
        needsReason
          ? "Event deleted. The organiser has been told why."
          : "Event deleted successfully",
      );

      setEventToDelete(null);
      setDeleteReason("");
    } catch (deleteError) {
      console.error("Delete event failed", deleteError);

      // The api explains why when it refuses, such as an event that already has
      // ticket holders, and that reason is more use than a generic failure.
      toast.error(
        constructErrorMessage(
          deleteError as TApiErrorResponseType,
          "Unable to delete the event right now.",
        ),
      );
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
              {isAdmin
                ? "Manage all event listings"
                : "Manage your event listings"}
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-secondary-500 sm:text-base">
              {isAdmin
                ? "Every published and suspended event on the platform. Suspending or removing one tells its organiser why."
                : "Review drafts, upcoming events, and past listings from one place."}
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
        actions={cardActions}
      />

      <ListingSection
        eyebrow="Upcoming"
        title={`${upcomingEvents.length} upcoming event${
          upcomingEvents.length === 1 ? "" : "s"
        }`}
        events={upcomingEvents}
        emptyState="No upcoming events created yet."
        actions={cardActions}
      />

      {(isAdmin || suspendedEvents.length > 0) && (
        <ListingSection
          eyebrow="Suspended"
          title={`${suspendedEvents.length} suspended event${
            suspendedEvents.length === 1 ? "" : "s"
          }`}
          events={suspendedEvents}
          emptyState="No suspended events."
          actions={cardActions}
        />
      )}

      <ListingSection
        eyebrow="Archive"
        title={`${pastEvents.length} past event${
          pastEvents.length === 1 ? "" : "s"
        }`}
        events={pastEvents}
        emptyState="No past events yet."
        actions={cardActions}
      />

      <Dialog
        open={!!eventToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setEventToDelete(null);
            setDeleteReason("");
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

          {needsReason && (
            <TextareaField
              label="Reason for the organiser"
              placeholder="For example: this listing duplicates another event."
              value={deleteReason}
              maxLength={500}
              inputClassName="min-h-24"
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDeleteReason(event.target.value)
              }
              helperText="Sent to the organiser with the notice that their event was removed."
            />
          )}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-secondary-200"
              disabled={isDeleting}
              onClick={() => {
                setEventToDelete(null);
                setDeleteReason("");
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              className="rounded-2xl bg-red-600 text-white hover:bg-red-700"
              disabled={isDeleting || (needsReason && !deleteReason.trim())}
              onClick={handleDeleteEvent}
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!eventToSuspend}
        onOpenChange={(open) => {
          if (!open && !isSuspending) closeSuspendDialog();
        }}
      >
        <DialogContent className="rounded-[1.6rem] border-secondary-100 p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-secondary-950">
              Suspend this event?
            </DialogTitle>
            <DialogDescription className="text-sm leading-7 text-secondary-500">
              {eventToSuspend
                ? `"${eventToSuspend.name}" will be hidden from listings, its page and checkout. Tickets already sold stay valid, and you can restore it at any time.`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <TextareaField
            label="Reason for the organiser"
            placeholder="For example: ticket prices don't match the venue booking."
            value={suspendReason}
            maxLength={500}
            inputClassName="min-h-24"
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setSuspendReason(event.target.value)
            }
            helperText="Sent to the organiser and shown on their listing while it's suspended."
          />

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-secondary-200"
              disabled={isSuspending}
              onClick={closeSuspendDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
              disabled={isSuspending || suspendReason.trim().length < 3}
              onClick={handleSuspendEvent}
            >
              {isSuspending ? "Suspending..." : "Suspend Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default memo(VendorEventListingsPage);
