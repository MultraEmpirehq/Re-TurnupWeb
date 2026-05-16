"use client";

import { getData, patchData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvent } from "@/hooks/use-event";
import {
  IEventActivityDetails,
  IEventBlogPostDetails,
  IEventDetailsType,
  IEventPassAssignmentDetails,
  IEventTicketOptionDetails,
} from "@/lib/types";
import {
  CalendarDays,
  Clock3,
  MapPin,
  PencilLine,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const formatEventDate = (date: Date | string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));

const formatEventTime = (date: Date | string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

const formatActivityDay = (date: Date | string) =>
  new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
  }).format(new Date(date));

const formatActivityMonth = (date: Date | string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(new Date(date));

const getTicketPriceAmount = (
  price: IEventTicketOptionDetails["ticketPrice"],
) => (typeof price === "number" ? price : Number(price?.amount ?? 0));

const formatTicketPrice = (price: IEventTicketOptionDetails["ticketPrice"]) => {
  const amount = getTicketPriceAmount(price);
  if (amount === 0) return "Free";
  if (typeof price !== "number" && price?.formatted?.withCurrency) {
    return price.formatted.withCurrency;
  }
  if (typeof price !== "number" && price?.currency?.code) {
    return new Intl.NumberFormat(price.currency.locale || "en-US", {
      style: "currency",
      currency: price.currency.code,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return amount.toLocaleString();
};

const getGuestLabel = (guest: { name?: string; firstName?: string; lastName?: string }) => {
  const fullName = [guest.firstName, guest.lastName].filter(Boolean).join(" ").trim();
  return fullName || guest.name || "Special Guest";
};

interface PendingRegistration {
  registrationId: string;
  ticketId?: string;
  attendeeTicketId?: string;
  eventId: string;
  attendeeName: string;
  attendeeEmail: string;
  quantity: number;
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
}

const TicketPreview: React.FC<{
  eventId: string;
  event?: IEventDetailsType;
  eventTickets?: IEventTicketOptionDetails[];
  saleMethod?: string;
  ticketUrl?: string;
  totalTickets?: number;
  passAssignments?: IEventPassAssignmentDetails[];
}> = ({
  eventId,
  event,
  eventTickets,
  saleMethod,
  ticketUrl,
  totalTickets,
  passAssignments,
}) => {
  const primaryTicket = eventTickets?.[0];
  const hasTicketSections = (eventTickets?.length ?? 0) > 0;
  const hasPassSections = (passAssignments?.length ?? 0) > 0;
  const isRegisterOnly = saleMethod === "register";
  const previewLabel = isRegisterOnly ? "Register on Turnupz" : "Sell on Turnupz";
  const [showRegistrationDetails, setShowRegistrationDetails] = useState(false);
  if (isRegisterOnly) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowRegistrationDetails(true)}
          className="w-full rounded-[1.2rem] bg-secondary-50 px-4 py-4 text-left transition hover:bg-cyan-50"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary-400">
            Registration
          </p>
          <p className="mt-2 text-sm font-semibold text-secondary-950">
            {(event?.registrationCount ?? 0).toLocaleString()} registered
          </p>
          <div className="mt-3 grid gap-2 text-xs text-secondary-500">
            <p>
              {(event?.remainingRegistrationSpots ?? 0).toLocaleString()} spots left
            </p>
            <p>
              Limit:{" "}
              {(event?.registrationLimit ?? event?.totalTickets ?? 0).toLocaleString()}
            </p>
            <p className="capitalize">Status: {event?.registrationStatus ?? "open"}</p>
            {event?.requiresApproval && <p>Registration requires approval</p>}
          </div>
        </button>

        {showRegistrationDetails && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-8">
            <div className="mx-auto max-w-lg rounded-[1.6rem] bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-400">
                    Registration Types
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-secondary-950">
                    {event?.name || "Event registration"}
                  </h2>
                  <p className="mt-1 text-sm text-secondary-500">
                    Public types are shown to customers. Private types require an
                    invite link.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRegistrationDetails(false)}
                  className="rounded-full px-3 py-1 text-sm font-semibold text-secondary-500 hover:bg-secondary-50"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {eventTickets?.map((ticket) => {
                  const privateHref =
                    ticket.visibility === "private" && ticket.privateAccessCode
                      ? `/explore/event/${eventId}/ticket?access=${ticket.privateAccessCode}`
                      : "";

                  return (
                  <div
                    key={`${ticket.id ?? ticket.ticketName}-${ticket.privateAccessCode}`}
                    className="rounded-xl bg-secondary-50 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-secondary-950">
                          {ticket.ticketName}
                        </p>
                        <p className="mt-1 text-xs text-secondary-500">
                          {ticket.ticketQuantity} registration spots
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-secondary-400">
                          {ticket.visibility || "public"} - {ticket.soldCount ?? 0} registered
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary-500">
                        {ticket.visibility || "public"}
                      </span>
                    </div>
                    {privateHref && (
                      <Link
                        href={privateHref}
                        className="mt-3 block break-all rounded-xl bg-white px-3 py-2 text-xs font-medium text-secondary-500 underline"
                      >
                        {privateHref}
                      </Link>
                    )}
                  </div>
                  );
                })}
                {!eventTickets?.length && (
                  <p className="rounded-xl bg-secondary-50 px-4 py-3 text-sm text-secondary-500">
                    No registration types have been added yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (
    saleMethod === "external_link" ||
    (!ticketUrl && !hasTicketSections && !hasPassSections)
  ) {
    return null;
  }

  const ticketSummary = primaryTicket
    ? getTicketPriceAmount(primaryTicket.ticketPrice) === 0
      ? "Free Ticket"
      : `${formatTicketPrice(primaryTicket.ticketPrice)} Tickets`
    : totalTickets
      ? `${totalTickets.toLocaleString()} Regular Tickets`
      : "Ticketing pending";

  return (
    <div className="space-y-3">
      <div className="rounded-[1.2rem] bg-secondary-50 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary-400">
          {previewLabel}
        </p>
        <p className="mt-2 text-sm font-semibold text-secondary-950">{ticketSummary}</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-secondary-500">
          <Ticket className="size-3.5 text-secondary-400" />
          <span>
            {ticketUrl
              ? "External checkout connected"
              : `${eventTickets?.length ?? 0} tier${(eventTickets?.length ?? 0) === 1 ? "" : "s"} configured`}
          </span>
        </div>
      </div>

      {eventTickets?.length ? (
        <div className="space-y-2">
          {eventTickets.slice(0, 3).map((ticket) => (
            <div
              key={`${ticket.ticketName}-${ticket.ticketPrice}-${ticket.ticketQuantity}`}
              className="flex items-center justify-between gap-3 rounded-[1rem] border border-secondary-100 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-secondary-950">{ticket.ticketName}</p>
                <p className="text-xs text-secondary-500">{ticket.ticketQuantity} tickets</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-secondary-400">
                  {ticket.transferable ? "Transfer enabled" : "Transfer disabled"}
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-secondary-400">
                  {ticket.visibility || "public"} · {ticket.soldCount ?? 0}{" "}
                  {ticket.actionType === "register" ? "registered" : "sold"}
                </p>
              </div>
              <p className="text-sm font-semibold text-secondary-950">
                {ticket.actionType === "register"
                  ? "Register"
                  : getTicketPriceAmount(ticket.ticketPrice) === 0
                    ? "Free"
                    : formatTicketPrice(ticket.ticketPrice)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {!!passAssignments?.length && (
        <div className="space-y-2 rounded-[1.2rem] bg-secondary-50 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary-400">
            Access Passes
          </p>
          {passAssignments.map((pass, index) => (
            <div
              key={`${pass.passName}-${index}`}
              className="rounded-[1rem] bg-white px-4 py-3 text-sm text-secondary-600"
            >
              <p className="font-semibold text-secondary-950">{pass.passName}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-secondary-400">
                {pass.transferable ? "Transfer enabled" : "Transfer disabled"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-cyan-700">
                  {pass.assignments?.filter(
                    (assignment) => assignment.passClaimStatus === "invited",
                  ).length ?? pass.emailedAssignees?.length ?? 0}{" "}
                  invites sent
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                  {pass.assignments?.filter(
                    (assignment) => assignment.passClaimStatus === "claimed",
                  ).length ?? 0}{" "}
                  claimed
                </span>
              </div>
              {!!pass.assignments?.length && (
                <div className="mt-3 space-y-1 border-t border-secondary-100 pt-3">
                  {pass.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <span className="break-all text-secondary-600">
                        {assignment.email}
                      </span>
                      <span className="rounded-full bg-secondary-50 px-2 py-0.5 font-semibold capitalize text-secondary-500">
                        {assignment.passClaimStatus ?? "invited"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-secondary-500">
                {pass.quantity} passes · {pass.assigneeEmails.length} assignee
                {pass.assigneeEmails.length === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BookingChip: React.FC<{
  eventId: string;
  saleMethod?: string;
  ticketUrl?: string;
  eventTickets?: IEventTicketOptionDetails[];
}> = ({ eventId, saleMethod, ticketUrl, eventTickets }) => {
  const isExternal = saleMethod === "external_link" || !!ticketUrl;
  const hasPaidTicket = (eventTickets ?? []).some(
    (ticket) => getTicketPriceAmount(ticket.ticketPrice) > 0,
  );
  const label = isExternal ? "Book Now" : hasPaidTicket ? "Pay Now" : "Register Now";
  const chipClassName = isExternal
    ? "bg-rose-500 text-white shadow-rose-200/70"
    : "bg-secondary-400 text-white shadow-secondary-200/80";

  const href = isExternal && ticketUrl ? ticketUrl : `/explore/event/${eventId}/ticket`;

  return (
    <Link
      href={href}
      target={isExternal && ticketUrl ? "_blank" : undefined}
      className={`inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${chipClassName}`}
    >
      <span>{label}</span>
    </Link>
  );
};

const PrivateTicketLinks: React.FC<{
  eventId: string;
  eventTickets?: IEventTicketOptionDetails[];
}> = ({ eventId, eventTickets }) => {
  const privateTickets = (eventTickets ?? []).filter(
    (ticket) => ticket.visibility === "private" && ticket.privateAccessCode,
  );

  if (privateTickets.length === 0) return null;

  return (
    <section className="space-y-3 rounded-[1.2rem] border border-secondary-100 bg-white p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-400">
          Vendor Private Links
        </p>
        <p className="mt-1 text-sm text-secondary-500">
          Share these links only with invited customers. They are hidden from the
          public customer preview.
        </p>
      </div>
      <div className="space-y-2">
        {privateTickets.map((ticket) => {
          const href = `/explore/event/${eventId}/ticket?access=${ticket.privateAccessCode}`;
          return (
            <div
              key={`${ticket.id ?? ticket.ticketName}-${ticket.privateAccessCode}`}
              className="rounded-xl bg-secondary-50 p-3 text-sm"
            >
              <p className="font-semibold text-secondary-950">
                {ticket.ticketName}
              </p>
              <Link
                href={href}
                className="mt-1 block break-all text-xs font-medium text-secondary-500 underline"
              >
                {href}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const PendingRegistrationReview: React.FC<{
  eventId: string;
  enabled?: boolean;
}> = ({ eventId, enabled }) => {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState("");

  const loadPendingRegistrations = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const response = await getData<PendingRegistration[]>(
        `/event/${eventId}/registrations/pending`,
      );
      setRegistrations(response.data.data ?? []);
    } catch {
      setRegistrations([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, eventId]);

  useEffect(() => {
    loadPendingRegistrations();
  }, [loadPendingRegistrations]);

  const reviewRegistration = async (
    registrationId: string,
    status: "confirmed" | "rejected",
  ) => {
    setReviewingId(registrationId);
    try {
      await patchData<{ status: "confirmed" | "rejected" }, PendingRegistration>(
        `/event/${eventId}/registrations/${registrationId}/review`,
        { status },
      );
      setRegistrations((current) =>
        current.filter((registration) => registration.registrationId !== registrationId),
      );
      toast.success(
        status === "confirmed" ? "Registration approved." : "Registration rejected.",
      );
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Unable to review this registration.",
        ),
      );
    } finally {
      setReviewingId("");
    }
  };

  if (!enabled) return null;

  return (
    <section className="space-y-4 rounded-[1.2rem] border border-secondary-100 bg-white p-4">
      <div>
        <h2 className="text-lg font-semibold text-secondary-950">
          Pending Registrations
        </h2>
        <p className="mt-1 text-sm text-secondary-500">
          Approve or reject attendees waiting for registration approval.
        </p>
      </div>
      {isLoading && (
        <p className="rounded-xl bg-secondary-50 px-4 py-3 text-sm text-secondary-500">
          Loading pending registrations...
        </p>
      )}
      {!isLoading && registrations.length === 0 && (
        <p className="rounded-xl bg-secondary-50 px-4 py-3 text-sm text-secondary-500">
          No pending registrations right now.
        </p>
      )}
      {registrations.map((registration) => (
        <div
          key={registration.registrationId}
          className="flex flex-col gap-3 rounded-xl bg-secondary-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-secondary-950">
              {registration.attendeeName}
            </p>
            <p className="text-xs text-secondary-500">
              {registration.attendeeEmail} - {registration.quantity} registration
              {registration.quantity === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => reviewRegistration(registration.registrationId, "confirmed")}
              disabled={reviewingId === registration.registrationId}
              className="rounded-xl bg-secondary-400 text-white hover:bg-secondary-500"
            >
              Approve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => reviewRegistration(registration.registrationId, "rejected")}
              disabled={reviewingId === registration.registrationId}
              className="rounded-xl border-red-100 text-red-600 hover:bg-red-50"
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
};

const ActivityTimeline: React.FC<{ activities?: IEventActivityDetails[] }> = ({
  activities,
}) => {
  if (!activities?.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-secondary-950">Activities</h2>
      <div className="grid gap-3 bg-white md:grid-cols-2 xl:grid-cols-3">
        {activities.map((activity, index) => (
          <article
            key={`${activity.name}-${index}`}
            className="grid grid-cols-[54px_1fr] gap-4 rounded-[1rem] border border-slate-100 bg-white px-3 py-4 transition-shadow duration-200 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
          >
            <div className="border-r border-dashed border-sky-200 pr-3 text-center">
              <p className="text-base font-bold leading-none text-secondary-950">
                {formatActivityDay(activity.date)}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary-400">
                {formatActivityMonth(activity.date)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-secondary-700">{activity.name}</p>
              <p className="text-[11px] text-secondary-300">{formatEventTime(activity.date)}</p>
              {activity.description && (
                <p className="text-xs leading-5 text-secondary-300">{activity.description}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

const GuestRoster: React.FC<{
  guests?: ({ name?: string; firstName?: string; lastName?: string })[];
}> = ({ guests }) => {
  if (!guests?.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-secondary-950">Featured Guests</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {guests.map((guest, index) => (
          <div
            key={`${getGuestLabel(guest)}-${index}`}
            className="relative flex items-center rounded-full border border-secondary-200 bg-slate-50 px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
          >
            <span className="absolute -left-1 -top-1 flex size-6 items-center justify-center rounded-full bg-secondary-800 text-[11px] font-semibold text-white">
              {index + 1}
            </span>
            <div className="flex size-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-secondary-700 shadow-sm">
              {getGuestLabel(guest)
                .split(" ")
                .slice(0, 2)
                .map((part) => part.charAt(0))
                .join("")
                .toUpperCase()}
            </div>
            <div className="mx-3 h-8 w-px bg-secondary-200" />
            <p className="truncate text-base font-medium text-secondary-500">
              {getGuestLabel(guest)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

const MediaStrip: React.FC<{
  media?: string[];
  fallbackImage?: string;
}> = ({ media, fallbackImage }) => {
  const mediaItems = useMemo(() => {
    const items = [...(media ?? [])].filter(Boolean);
    if (items.length === 0 && fallbackImage) {
      items.push(fallbackImage);
    }
    while (items.length < 5) {
      items.push("");
    }
    return items.slice(0, 8);
  }, [media, fallbackImage]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-secondary-950">Media</h2>
        <p className="text-xs uppercase tracking-[0.2em] text-secondary-400">
          Event gallery
        </p>
      </div>
      <div className="-mx-1 overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3 px-1">
          {mediaItems.map((item, index) => (
            <div
              key={`${item || "placeholder"}-${index}`}
              className="relative h-32 w-48 flex-none overflow-hidden rounded-[1rem] border border-secondary-100 bg-secondary-50"
            >
              {item ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${item})` }}
                />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(226,232,240,0.9),rgba(241,245,249,0.95))]" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.08))]" />
              <div className="absolute bottom-3 left-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-500 backdrop-blur">
                {item ? `Media ${index + 1}` : "Placeholder"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SponsorsBoard: React.FC<{
  organizerName?: string;
  eventYear?: string;
  sponsors?: string[];
  sponsorImages?: string[];
}> = ({ organizerName, eventYear, sponsors, sponsorImages }) => {
  const sponsorItems = sponsors?.length
    ? sponsors
    : [
        "Access",
        "Bolt",
        "GUO",
        "IrokoTV",
        "Hotel.ng",
        "Terra",
        "UPS",
        "Techpoint",
        "Native",
        "Paystack",
      ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-secondary-950">Sponsors</h2>
        <p className="text-xs uppercase tracking-[0.2em] text-secondary-400">
          Partner board
        </p>
      </div>

      <div className="overflow-hidden rounded-[1rem] border border-secondary-100 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {sponsorItems.map((sponsor, index) => (
            <div
              key={`${sponsor}-${index}`}
              className="flex h-24 items-center justify-center border-b border-r border-secondary-100 px-4 text-center"
            >
              {sponsorImages?.[index] ? (
                <div
                  className="h-14 w-full rounded-lg bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${sponsorImages[index]})` }}
                  aria-label={sponsor}
                />
              ) : (
                <span className="text-sm font-semibold tracking-tight text-secondary-500">
                  {sponsor}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-secondary-100 bg-secondary-50 px-4 py-3 text-[11px] text-secondary-400">
          <span>Organized by {organizerName || "Turnupz Nigeria Ltd"}</span>
          <span>{eventYear || "2024"}</span>
        </div>
      </div>
    </section>
  );
};

const BlogPostsBoard: React.FC<{
  eventId: string;
  posts?: IEventBlogPostDetails[];
}> = ({ eventId, posts }) => {
  if (!posts?.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-secondary-950">Blog Posts</h2>
        <p className="mt-1 text-sm text-secondary-500">
          Stay updated with this event.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/app/events/${eventId}/blog/${post.id}`}
            className="group overflow-hidden rounded-[1.2rem] border border-secondary-100 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-transform hover:-translate-y-1"
          >
            <div
              className="h-40 bg-secondary-50 bg-cover bg-center"
              style={{
                backgroundImage:
                  post.images?.[0] || post.image
                    ? `url(${post.images?.[0] || post.image})`
                    : undefined,
              }}
            />
            <div className="space-y-2 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary-400">
                Event Update
              </p>
              <h3 className="text-lg font-semibold leading-tight text-secondary-950 group-hover:text-secondary-500">
                {post.title}
              </h3>
              <p className="line-clamp-3 text-sm leading-6 text-secondary-500">
                {post.excerpt || post.body}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const VendorEventView: React.FC<{ id: string }> = ({ id }) => {
  const { data, error, refetch, isLoading } = useEvent(id);

  const bannerImage = useMemo(() => {
    if (!data) return "";
    return data.image || "";
  }, [data]);

  const blogPosts = useMemo<IEventBlogPostDetails[]>(() => {
    if (!data) return [];
    if (data.blogPosts?.length) return data.blogPosts;
    if (!data.blogPost) return [];

    return [
      {
        id: `blog-${data.id}-legacy`,
        title: "Event update",
        excerpt: data.blogPost.slice(0, 140),
        body: data.blogPost,
        image: bannerImage || data.medias?.[0] || "",
        createdAt: new Date().toISOString(),
      },
    ];
  }, [bannerImage, data]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-[1.8rem]" />
        <Skeleton className="h-[30rem] w-full rounded-[1.8rem]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorContainer
        error={constructErrorMessage(
          error as TApiErrorResponseType,
          "We could not load this event right now.",
        )}
        retryFunction={refetch}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
          Event Preview
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-2xl border-secondary-200 px-5 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
          >
            <Link href="/app/events">Back to Listings</Link>
          </Button>
          <Button
            asChild
            className="h-11 rounded-2xl bg-secondary-400 px-5 text-sm font-semibold text-white hover:bg-secondary-500"
          >
            <Link href={`/app/events/${data.id}/edit`}>
              <PencilLine className="size-4" />
              Edit Post
            </Link>
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-[1.8rem] border border-secondary-100 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <div className="px-4 pt-4 sm:px-6 sm:pt-6">
          <div
            className="h-52 overflow-hidden rounded-[1.2rem] bg-cover bg-center sm:h-64"
            style={{
              backgroundImage: bannerImage
                ? `url(${bannerImage})`
                : "linear-gradient(135deg, rgba(56,189,248,0.16), rgba(14,165,233,0.08))",
            }}
          />
        </div>

        <div className="space-y-7 px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="text-[clamp(1.7rem,3vw,2.2rem)] font-medium tracking-tight text-secondary-950">
                {data.name}
              </h1>
            </div>

            <div className="flex w-full max-w-xs justify-start md:justify-end">
              <BookingChip
                eventId={data.id}
                saleMethod={data.saleMethod}
                ticketUrl={data.ticketUrl}
                eventTickets={data.eventTickets}
              />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_280px]">
            <div className="space-y-7">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-secondary-950">Date and Time</h2>
                <div className="space-y-3 text-[13px] text-secondary-700">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="size-4 text-secondary-500" />
                    <span>{formatEventDate(data.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock3 className="size-4 text-secondary-500" />
                    <span>{formatEventTime(data.date)}</span>
                  </div>
                  {(data.venue?.name || data.venue?.address) && (
                    <div className="flex items-start gap-3 pt-1">
                      <MapPin className="mt-0.5 size-4 text-secondary-500" />
                      <div className="text-[12px] leading-5 text-secondary-700">
                        <p>{data.venue?.name || "Venue pending"}</p>
                        {data.venue?.address && <p>{data.venue.address}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <TicketPreview
                eventId={data.id}
                event={data}
                totalTickets={data.totalTickets}
                saleMethod={data.saleMethod}
                ticketUrl={data.ticketUrl}
                eventTickets={data.eventTickets}
                passAssignments={data.passAssignments}
              />
              {data.saleMethod !== "register" && (
                <PrivateTicketLinks
                  eventId={data.id}
                  eventTickets={data.eventTickets}
                />
              )}
              <PendingRegistrationReview
                eventId={data.id}
                enabled={data.saleMethod === "register" && data.requiresApproval}
              />
            </div>
          </div>

          <div className="space-y-7">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-secondary-950">
                Event Description
              </h2>
              <div className="space-y-4 text-[13px] leading-6 text-secondary-700">
                <p>
                  {data.description ||
                    "Add a fuller event story on the edit screen so attendees can quickly understand the experience."}
                </p>

                {!!data.additionalInformation?.length && (
                  <div>
                    <ol className="list-decimal space-y-1 pl-4">
                      {data.additionalInformation.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>

            <BlogPostsBoard eventId={data.id} posts={blogPosts} />

            <GuestRoster guests={data.eventGuestsOfHonour} />

            <ActivityTimeline activities={data.activities} />

            <MediaStrip media={data.medias} />

            <SponsorsBoard
              organizerName={data.organizerName}
              eventYear={data.eventYear}
              sponsors={data.sponsors}
              sponsorImages={data.sponsorImages}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default memo(VendorEventView);
