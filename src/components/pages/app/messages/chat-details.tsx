"use client";

import CustomImageComponent from "@/components/ui/custom-image.component";
import { IEventChatGroup } from "@/lib/event-chat";
import { formatEventTime } from "@/lib/event-time";
import {
  ArrowRight,
  BellOffIcon,
  MegaphoneIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";
import { AboutEventCard, YourTicketsCard, useChatTopic } from "./chat-cards";
import { initials, kindOf } from "./chat-format";
import { chatSubtitle } from "./chat-thread";

const Row: React.FC<{ icon: React.ElementType; children: React.ReactNode }> = ({
  icon: Icon,
  children,
}) => (
  <li className="flex items-center gap-2.5 text-sm text-secondary-600">
    <Icon className="size-4 shrink-0 text-secondary-400" aria-hidden />
    {children}
  </li>
);

/**
 * Beside the chat on wide screens: who or what it's about, your tickets for the
 * event, and how the chat is set up.
 */
const ChatDetails: React.FC<{
  chat: IEventChatGroup;
  myId?: string;
  aboutEventId?: string;
}> = ({ chat, myId, aboutEventId }) => {
  const topic = useChatTopic(chat, aboutEventId);
  const kind = kindOf(chat);
  const iAmOrganiser = kind !== "PERSON" && !!myId && chat.vendor.id === myId;
  const image = kind === "PERSON" ? chat.person?.image : chat.eventImage;

  return (
    <div className="h-full space-y-5 overflow-y-auto p-5">
      <div className="text-center">
        {image ? (
          <span
            className={`relative mx-auto block overflow-hidden bg-secondary-100 ${
              kind === "PERSON"
                ? "size-24 rounded-full"
                : "aspect-[16/10] w-full rounded-2xl"
            }`}
          >
            <CustomImageComponent
              src={image}
              alt=""
              fill
              className="size-full"
              imageClassName="object-cover"
            />
          </span>
        ) : (
          <span className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-2xl font-extrabold text-secondary-700">
            {initials(chat.eventName)}
          </span>
        )}
        <p className="mt-3 text-lg font-extrabold text-secondary-950">
          {chat.eventName}
        </p>
        <p className="text-xs font-semibold text-secondary-500">
          {chatSubtitle(chat, iAmOrganiser)}
        </p>
      </div>

      <div className="space-y-2">
        <YourTicketsCard chat={chat} />
        <AboutEventCard chat={chat} topic={topic} myId={myId} />
      </div>

      {kind === "EVENT_GROUP" && chat.eventId && (
        <div className="space-y-3 rounded-2xl border border-secondary-100 bg-white p-4">
          <p className="text-xs font-bold tracking-wide text-secondary-400 uppercase">
            The event
          </p>
          {chat.eventDate && (
            <p className="text-sm font-semibold text-secondary-900">
              {formatEventTime(chat.eventDate, chat.eventTimezone)}
            </p>
          )}
          <ul className="space-y-2">
            <Row icon={UsersIcon}>
              {(chat.memberCount ?? 0).toLocaleString()} going
            </Row>
            {chat.announcementMode && (
              <Row icon={MegaphoneIcon}>Only the organiser can post</Row>
            )}
            {chat.muted && (
              <Row icon={BellOffIcon}>You&apos;ve muted this chat</Row>
            )}
          </ul>
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
            <Link
              href={`/explore/event/${chat.eventId}`}
              className="inline-flex items-center gap-1 text-sm font-bold text-secondary-700 hover:underline"
            >
              Event page <ArrowRight className="size-3.5" aria-hidden />
            </Link>
            {(iAmOrganiser || chat.memberListVisibility !== "private") && (
              <Link
                href={`/app/messages/${chat.id}/members`}
                className="inline-flex items-center gap-1 text-sm font-bold text-secondary-700 hover:underline"
              >
                Who&apos;s going <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      )}

      {chat.isClosed && (
        <p className="rounded-2xl border border-dashed border-secondary-200 p-4 text-xs leading-5 text-secondary-500">
          This chat closed a few days after the event. Everything in it stays
          here to read.
        </p>
      )}
    </div>
  );
};

export default memo(ChatDetails);
