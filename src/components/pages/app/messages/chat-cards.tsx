"use client";

import CustomImageComponent from "@/components/ui/custom-image.component";
import { useEventChatMessages } from "@/hooks/use-event-chat";
import { useEvent } from "@/hooks/use-event";
import { useUserTickets } from "@/hooks/use-user-tickets";
import { IChatSharedEvent, IEventChatGroup } from "@/lib/event-chat";
import { formatEventTime } from "@/lib/event-time";
import { ROUTES } from "@/lib/variables";
import { cn } from "@/lib/utils";
import { ChevronRight, TicketIcon } from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo } from "react";
import { kindOf } from "./chat-format";

const eventHref = (eventId: string) => `/explore/event/${eventId}`;

/** How many of your tickets are for this chat's event. */
export const useMyTicketCount = (eventId?: string) => {
  const { data } = useUserTickets();
  return useMemo(
    () =>
      eventId
        ? (data?.data ?? []).filter(
            (ticket) =>
              (ticket.ticket?.event?.id ?? ticket.ticket?.eventId) === eventId,
          ).length
        : 0,
    [data, eventId],
  );
};

/** In an event's group chat: your tickets and when doors open, one click away. */
export const YourTicketsCard: React.FC<{
  chat: IEventChatGroup;
  className?: string;
}> = memo(({ chat, className }) => {
  const count = useMyTicketCount(chat.eventId);
  if (kindOf(chat) !== "EVENT_GROUP" || !count || !chat.eventDate) return null;
  return (
    <Link
      href={ROUTES.PROFILE_TICKETS.href}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-secondary-100 bg-white p-2.5 transition-colors hover:border-primary/40",
        className,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10">
        <TicketIcon className="size-[18px] text-secondary-700" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-extrabold text-secondary-950">
          Your {count} {count === 1 ? "ticket" : "tickets"} · Doors{" "}
          {formatEventTime(chat.eventDate, chat.eventTimezone, {
            timeOnly: true,
          })}
        </span>
        <span className="block text-[11.5px] text-secondary-500">
          {formatEventTime(chat.eventDate, chat.eventTimezone)}
        </span>
      </span>
      <span className="flex items-center text-xs font-extrabold text-secondary-700">
        Show <ChevronRight className="size-3.5" aria-hidden />
      </span>
    </Link>
  );
});
YourTicketsCard.displayName = "YourTicketsCard";

/**
 * The event a chat with an organiser is about: the latest one shared in it, or
 * the one you came from ("Message organiser" on an event page).
 */
export const useChatTopic = (
  chat: IEventChatGroup,
  aboutEventId?: string,
): IChatSharedEvent | null => {
  const isDirect = kindOf(chat) === "DIRECT";
  const { data: messages } = useEventChatMessages(chat.id, isDirect);
  const { data: about } = useEvent(isDirect ? (aboutEventId ?? "") : "");
  return useMemo(() => {
    if (!isDirect) return null;
    if (about?.id) {
      return {
        id: about.id,
        name: about.name,
        date: String(about.date),
        timezone: about.timezone,
        image: about.image ?? null,
        place: about.venue?.name ?? about.venueName ?? null,
      };
    }
    const shared = [...(messages ?? [])]
      .reverse()
      .find((message) => message.sharedEvent);
    if (shared?.sharedEvent) return shared.sharedEvent;
    if (chat.eventId) {
      return {
        id: chat.eventId,
        name: chat.title || "The event",
        date: chat.eventDate ?? "",
        timezone: chat.eventTimezone,
        image: chat.eventImage ?? null,
      };
    }
    return null;
  }, [about, chat, isDirect, messages]);
};

/** In a chat with an organiser: the event it's about, with Get tickets. */
export const AboutEventCard: React.FC<{
  chat: IEventChatGroup;
  topic: IChatSharedEvent | null;
  myId?: string;
  className?: string;
}> = memo(({ chat, topic, myId, className }) => {
  if (!topic || chat.vendor.id === myId) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[18px] border border-secondary-100 bg-white p-2.5",
        className,
      )}
    >
      {topic.image && (
        <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-secondary-100">
          <CustomImageComponent
            src={topic.image}
            alt=""
            fill
            className="size-full"
            imageClassName="object-cover"
          />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-extrabold text-secondary-950">
          {topic.name}
        </span>
        {topic.date && (
          <span className="block truncate text-[11.5px] font-semibold text-secondary-500">
            {formatEventTime(topic.date, topic.timezone, { withYear: false })}
            {topic.place ? ` · ${topic.place}` : ""}
          </span>
        )}
      </span>
      <Link
        href={eventHref(topic.id)}
        className="shrink-0 rounded-full bg-secondary-700 px-3 py-2 text-xs font-extrabold text-white hover:bg-secondary-800"
      >
        Get tickets
      </Link>
    </div>
  );
});
AboutEventCard.displayName = "AboutEventCard";

/** An event someone shared in a message. */
export const SharedEventCard: React.FC<{ event: IChatSharedEvent }> = ({
  event,
}) => (
  <Link
    href={eventHref(event.id)}
    className="block w-64 overflow-hidden rounded-2xl border border-black/5 bg-white transition-shadow hover:shadow-md"
  >
    <span className="relative block h-28 w-full bg-primary/10">
      {event.image && (
        <CustomImageComponent
          src={event.image}
          alt=""
          fill
          className="size-full"
          imageClassName="object-cover"
        />
      )}
    </span>
    <span className="block space-y-0.5 px-3 py-2.5">
      <span className="line-clamp-2 block text-sm font-bold text-secondary-950">
        {event.name}
      </span>
      <span className="block truncate text-xs text-secondary-500">
        {formatEventTime(event.date, event.timezone, { withYear: false })}
      </span>
      {event.place && (
        <span className="block truncate text-xs text-secondary-500">
          {event.place}
        </span>
      )}
      <span className="mt-1 block text-xs font-bold text-secondary-700">
        View event
      </span>
    </span>
  </Link>
);
