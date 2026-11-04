"use client";

import CustomImageComponent from "@/components/ui/custom-image.component";
import { IEventChatGroup, IEventChatMessage } from "@/lib/event-chat";
import { cn } from "@/lib/utils";
import { FileIcon, PinIcon, PinOffIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";
import { SharedEventCard } from "./chat-cards";
import { clock, initials, kindOf } from "./chat-format";

const REACTIONS = ["🔥", "🙌", "❤️"];

/** Where a message links to: its own link, a blog post in its text, or the event. */
const hrefOf = (message: IEventChatMessage, chat: IEventChatGroup) => {
  if (message.href) return message.href;
  const blog = message.body.match(/\/app\/events\/[^\s]+\/blog\/[^\s]+/)?.[0];
  if (blog) return blog;
  if (message.kind === "event-update" && chat.eventId)
    return `/explore/event/${chat.eventId}`;
  return undefined;
};

/** Links already shown as a button come out of the text. */
const cleanBody = (body: string) =>
  body
    .replace(/\s*Read it at\s+\/app\/events\/\S+/gi, "")
    .replace(/\/app\/events\/\S+/g, "")
    .trim();

const Avatar: React.FC<{ name?: string; src?: string }> = ({ name, src }) =>
  src ? (
    <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-secondary-100">
      <CustomImageComponent
        src={src}
        alt=""
        fill
        className="size-full"
        imageClassName="object-cover"
      />
    </span>
  ) : (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-extrabold text-secondary-700"
      aria-hidden
    >
      {initials(name)}
    </span>
  );

/**
 * One message. Yours sit on the right in the brand gradient; everyone else's on
 * the left. In an event's group chat the organiser's posts are a dark card so
 * updates stand out. Hovering shows reactions, and pin and hide for organisers.
 */
const ChatMessage: React.FC<{
  message: IEventChatMessage;
  chat: IEventChatGroup;
  mine: boolean;
  seen: boolean;
  isOrganiser: boolean;
  /** The Turnupz team moderating: can hide messages (pinning stays the organiser's). */
  isModerator?: boolean;
  isPinned: boolean;
  myId?: string;
  onReact: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string) => void;
  onHide: (messageId: string) => void;
}> = ({
  message,
  chat,
  mine,
  seen,
  isOrganiser,
  isModerator,
  isPinned,
  myId,
  onReact,
  onTogglePin,
  onHide,
}) => {
  const isGroup = kindOf(chat) === "EVENT_GROUP";
  const fromOrganiser =
    message.role === "vendor" || message.kind === "event-update";
  const href = hrefOf(message, chat);
  const body = cleanBody(message.body);
  const image =
    message.kind === "image" || message.kind === "event-update"
      ? message.assetUrl
      : undefined;
  // "Shared an image: photo.jpg" says nothing the picture doesn't.
  const caption = image && /^Shared an image:/i.test(body) ? "" : body;
  const reactions = (message.reactions ?? []).filter(
    (reaction) => reaction.count > 0,
  );

  const tools = (
    <div
      className={cn(
        "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
        mine ? "flex-row-reverse" : "",
      )}
    >
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onReact(message.id, emoji)}
          aria-label={`React ${emoji}`}
          className="flex size-7 items-center justify-center rounded-full border border-secondary-100 bg-white text-sm hover:border-primary/40"
        >
          {emoji}
        </button>
      ))}
      {(isOrganiser || isModerator) && isGroup && (
        <>
          {isOrganiser && (
            <button
              type="button"
              onClick={() => onTogglePin(message.id)}
              aria-label={isPinned ? "Unpin" : "Pin to the top"}
              title={isPinned ? "Unpin" : "Pin to the top"}
              className="flex size-7 items-center justify-center rounded-full border border-secondary-100 bg-white text-secondary-500 hover:text-secondary-900"
            >
              {isPinned ? (
                <PinOffIcon className="size-3.5" />
              ) : (
                <PinIcon className="size-3.5" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => onHide(message.id)}
            aria-label="Hide for everyone"
            title="Hide for everyone"
            className="flex size-7 items-center justify-center rounded-full border border-secondary-100 bg-white text-secondary-500 hover:text-red-600"
          >
            <Trash2Icon className="size-3.5" />
          </button>
        </>
      )}
    </div>
  );

  const reactionRow = reactions.length > 0 && (
    <div
      className={cn("mt-1 flex gap-1", mine ? "justify-end" : "justify-start")}
    >
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          onClick={() => onReact(message.id, reaction.emoji)}
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs",
            reaction.mine || (myId && reaction.reactedBy.includes(myId))
              ? "border-primary/30 bg-primary/10 text-secondary-800"
              : "border-secondary-100 bg-white text-secondary-600",
          )}
        >
          {reaction.emoji} {reaction.count}
        </button>
      ))}
    </div>
  );

  // The organiser's updates in a group: a dark card, for everyone but the organiser.
  if (isGroup && fromOrganiser && !mine) {
    return (
      <div className="group flex items-end gap-2 py-1">
        <div className="w-full max-w-[560px]">
          <div className="rounded-[18px] bg-secondary-950 p-4">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-white">
                {message.senderName}
              </span>
              <span className="rounded-md bg-primary px-1.5 py-0.5 text-[9.5px] font-extrabold text-white">
                ORGANISER
              </span>
              {isPinned && (
                <PinIcon className="size-3 text-white/60" aria-label="Pinned" />
              )}
            </div>
            {image && (
              <span className="relative mb-2.5 block aspect-[16/8] max-h-64 w-full overflow-hidden rounded-xl bg-white/10">
                <CustomImageComponent
                  src={image}
                  alt=""
                  fill
                  className="size-full"
                  imageClassName="object-cover"
                />
              </span>
            )}
            {message.kind === "event-update" && message.assetName && (
              <p className="mb-1 text-sm font-bold text-white">
                {message.assetName}
              </p>
            )}
            {caption && (
              <p className="whitespace-pre-line text-[13.5px] leading-6 text-white">
                {caption}
              </p>
            )}
            <div className="mt-1.5 flex items-center justify-between gap-3">
              {href ? (
                <Link
                  href={href}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {href.includes("/blog/") ? "Read the post" : "Open the event"}
                </Link>
              ) : (
                <span />
              )}
              <span className="text-[10.5px] text-white/60">
                {clock(message.createdAt)}
              </span>
            </div>
          </div>
          {reactionRow}
        </div>
        {tools}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-end gap-2 py-1",
        mine ? "flex-row-reverse" : "",
      )}
    >
      {!mine && isGroup && (
        <Avatar name={message.senderName} src={message.senderAvatar} />
      )}
      <div
        className={cn(
          "flex max-w-[min(80%,560px)] flex-col",
          mine ? "items-end" : "items-start",
        )}
      >
        {message.sharedEvent && (
          <div className="mb-1">
            <SharedEventCard event={message.sharedEvent} />
          </div>
        )}
        {image && (
          <a
            href={image}
            target="_blank"
            rel="noreferrer"
            className="relative mb-1 block h-56 w-64 overflow-hidden rounded-2xl bg-secondary-100"
          >
            <CustomImageComponent
              src={image}
              alt={message.assetName || "Photo"}
              fill
              className="size-full"
              imageClassName="object-cover"
            />
          </a>
        )}
        {message.kind === "file" && message.assetUrl && (
          <a
            href={message.assetUrl}
            download={message.assetName}
            className={cn(
              "mb-1 flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold",
              mine
                ? "border-transparent bg-secondary-700 text-white"
                : "border-secondary-100 bg-white text-secondary-800",
            )}
          >
            <FileIcon className="size-4 shrink-0" aria-hidden />
            <span className="max-w-[220px] truncate">
              {message.assetName || "Attachment"}
            </span>
          </a>
        )}
        {caption && message.kind !== "file" && (
          <div
            className={cn(
              "rounded-[18px] px-3.5 py-2",
              mine
                ? "rounded-br-md bg-linear-to-br from-secondary to-primary text-white"
                : "rounded-bl-md border border-secondary-100 bg-white text-secondary-950",
            )}
          >
            {!mine && isGroup && (
              <p className="mb-0.5 text-[11.5px] font-extrabold text-secondary-700">
                {message.senderName}
                {message.senderMemberRole === "team" && " · Turnupz team"}
              </p>
            )}
            <p className="whitespace-pre-line text-[13.5px] leading-5">
              {caption}
            </p>
            <p
              className={cn(
                "mt-0.5 text-right text-[10.5px]",
                mine ? "text-white/75" : "text-secondary-400",
              )}
            >
              {clock(message.createdAt)}
              {seen ? " · Seen" : ""}
            </p>
          </div>
        )}
        {(!caption || message.kind === "file") && (
          <p className="text-[10.5px] text-secondary-400">
            {clock(message.createdAt)}
            {seen ? " · Seen" : ""}
          </p>
        )}
        {reactionRow}
      </div>
      {tools}
    </div>
  );
};

export default memo(ChatMessage);
