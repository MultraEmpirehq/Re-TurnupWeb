"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvent } from "@/hooks/use-event";
import {
  IEventActivityDetails,
  IEventPassAssignmentDetails,
  IEventTicketOptionDetails,
} from "@/lib/types";
import {
  CalendarDays,
  Clock3,
  MapPin,
  PencilLine,
  PlayCircle,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo } from "react";

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

const formatHeroDay = (date: Date | string) =>
  new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
  }).format(new Date(date));

const formatHeroMonth = (date: Date | string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(new Date(date));

const formatHeroTime = (date: Date | string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: true,
  })
    .format(new Date(date))
    .replace(/\s/g, "");

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

const getGuestLabel = (guest: { name?: string; firstName?: string; lastName?: string }) => {
  const fullName = [guest.firstName, guest.lastName].filter(Boolean).join(" ").trim();
  return fullName || guest.name || "Special Guest";
};

const TicketPreview: React.FC<{
  eventTickets?: IEventTicketOptionDetails[];
  ticketUrl?: string;
  totalTickets?: number;
  passAssignments?: IEventPassAssignmentDetails[];
}> = ({ eventTickets, ticketUrl, totalTickets, passAssignments }) => {
  const primaryTicket = eventTickets?.[0];
  const ticketSummary = primaryTicket
    ? primaryTicket.ticketPrice === 0
      ? "Free Ticket"
      : `${formatCurrency(primaryTicket.ticketPrice)} Tickets`
    : totalTickets
      ? `${totalTickets.toLocaleString()} Regular Tickets`
      : "Ticketing pending";

  return (
    <div className="space-y-3">
      <div className="rounded-[1.2rem] bg-secondary-50 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary-400">
          Sell on Turnupz
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
                  {ticket.visibility || "public"} · {ticket.soldCount ?? 0}{" "}
                  {ticket.actionType === "register" ? "registered" : "sold"}
                </p>
              </div>
              <p className="text-sm font-semibold text-secondary-950">
                {ticket.actionType === "register"
                  ? "Register"
                  : ticket.ticketPrice === 0
                    ? "Free"
                    : formatCurrency(ticket.ticketPrice)}
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
  saleMethod?: string;
  ticketUrl?: string;
  eventTickets?: IEventTicketOptionDetails[];
}> = ({ saleMethod, ticketUrl, eventTickets }) => {
  const isExternal = saleMethod === "external_link" || !!ticketUrl;
  const hasPaidTicket = (eventTickets ?? []).some((ticket) => ticket.ticketPrice > 0);
  const label = isExternal ? "Book Now" : hasPaidTicket ? "Pay Now" : "Register Now";
  const chipClassName = isExternal
    ? "bg-rose-500 text-white shadow-rose-200/70"
    : "bg-secondary-400 text-white shadow-secondary-200/80";

  return (
    <div
      className={`inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${chipClassName}`}
    >
      <span>{label}</span>
    </div>
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
}> = ({ organizerName, eventYear }) => {
  const sponsors = [
    "Access",
    "Bolt",
    "GUO",
    "IrokoTV",
    "Hotel.ng",
    "Terra",
    "UPS",
    "Techpoint",
    "Access",
    "Native",
    "Obeg",
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
          {sponsors.map((sponsor, index) => (
            <div
              key={`${sponsor}-${index}`}
              className="flex h-20 items-center justify-center border-b border-r border-secondary-100 px-4 text-center"
            >
              <span className="text-sm font-semibold tracking-tight text-secondary-500">
                {sponsor}
              </span>
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

const VendorEventView: React.FC<{ id: string }> = ({ id }) => {
  const { data, error, refetch, isLoading } = useEvent(id);

  const galleryImage = useMemo(() => {
    if (!data) return "";
    return data.image || data.medias?.[0] || "";
  }, [data]);

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
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
          Event Preview
        </p>
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

      <section className="overflow-hidden rounded-[1.8rem] border border-secondary-100 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <div className="px-4 pt-4 sm:px-6 sm:pt-6">
          <div
            className="relative h-52 overflow-hidden rounded-[1.2rem] bg-cover bg-center sm:h-64"
            style={{
              backgroundImage: galleryImage
                ? `linear-gradient(180deg, rgba(15,23,42,0.15), rgba(15,23,42,0.32)), url(${galleryImage})`
                : "radial-gradient(circle at 30% 20%, rgba(251,191,36,0.3), transparent 24%), radial-gradient(circle at 70% 18%, rgba(244,114,182,0.24), transparent 22%), linear-gradient(135deg, rgba(88,28,135,0.96), rgba(30,64,175,0.88) 42%, rgba(15,23,42,0.96))",
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0%,transparent_30%,transparent_70%,rgba(255,255,255,0.05)_100%)]" />
            <div className="absolute inset-0 opacity-25">
              <div className="absolute left-[15%] top-[18%] h-10 w-1 rounded-full bg-white/70 shadow-[0_0_18px_rgba(255,255,255,0.55)]" />
              <div className="absolute left-[19%] top-[14%] h-14 w-1 rounded-full bg-white/70 shadow-[0_0_18px_rgba(255,255,255,0.55)]" />
              <div className="absolute left-[23%] top-[10%] h-20 w-1 rounded-full bg-white/70 shadow-[0_0_18px_rgba(255,255,255,0.55)]" />
              <div className="absolute right-[22%] top-[12%] h-16 w-1 rounded-full bg-white/65 shadow-[0_0_18px_rgba(255,255,255,0.45)]" />
              <div className="absolute right-[18%] top-[16%] h-11 w-1 rounded-full bg-white/65 shadow-[0_0_18px_rgba(255,255,255,0.45)]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-secondary-500 shadow-lg">
                <PlayCircle className="size-10 fill-white text-red-500" />
              </span>
            </div>
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 text-white">
              <div className="flex items-start gap-3">
                <div className="overflow-hidden rounded-[1rem] border border-white/15 bg-white/12 text-center backdrop-blur">
                  <div className="border-b border-white/10 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/65">
                    {formatHeroMonth(data.date)}
                  </div>
                  <div className="px-3 py-2 text-xl font-black leading-none">
                    {formatHeroDay(data.date)}
                  </div>
                  <div className="border-t border-white/10 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/70">
                    {formatHeroTime(data.date)}
                  </div>
                </div>
                <div className="rounded-xl bg-black/25 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] backdrop-blur">
                  Your Logo
                </div>
              </div>
              <div className="rounded-xl bg-black/25 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] backdrop-blur">
                Turnupz Presents
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <div className="max-w-2xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70">
                  Live Event Preview
                </p>
                <p className="mt-2 max-w-xl text-3xl font-black uppercase leading-[0.92] tracking-tight text-white drop-shadow-[0_10px_24px_rgba(15,23,42,0.45)] sm:text-4xl">
                  {data.name}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                  <span>{data.venue?.name || "Main stage"}</span>
                  <span className="h-1 w-1 rounded-full bg-white/70" />
                  <span>{formatEventDate(data.date)}</span>
                </div>
              </div>
            </div>
          </div>
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

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-secondary-950">Event Description</h2>
                <div className="space-y-4 text-[11px] leading-6 text-secondary-500">
                  <p className="font-medium text-secondary-700">
                    Organized by {data.organizerName || "Turnupz Nigeria Ltd"}{" "}
                    {data.eventYear || new Date(data.date).getFullYear()}
                  </p>
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

                  {!!data.blogPost && <p>{data.blogPost}</p>}
                </div>
              </div>

              <GuestRoster guests={data.eventGuestsOfHonour} />

              <ActivityTimeline activities={data.activities} />

              <MediaStrip media={data.medias} fallbackImage={galleryImage} />

              <SponsorsBoard
                organizerName={data.organizerName}
                eventYear={data.eventYear}
              />
            </div>

            <div className="space-y-4">
              <TicketPreview
                totalTickets={data.totalTickets}
                ticketUrl={data.ticketUrl}
                eventTickets={data.eventTickets}
                passAssignments={data.passAssignments}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default memo(VendorEventView);
