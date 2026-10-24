"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import {
  useEventChatMessages,
  useHideEventChatMessage,
  useMuteEventChat,
  useReactToEventChatMessage,
  useSendEventChatMessage,
  useUpdateEventChatSettings,
  useUploadEventChatAsset,
} from "@/hooks/use-event-chat";
import { IEventChatGroup } from "@/lib/event-chat";
import { formatEventTime } from "@/lib/event-time";
import { cn } from "@/lib/utils";
import {
  ArrowLeftIcon,
  BellIcon,
  BellOffIcon,
  EllipsisIcon,
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  Loader2,
  MegaphoneIcon,
  PaperclipIcon,
  PinIcon,
  PinOffIcon,
  SendIcon,
  SmileIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AboutEventCard, YourTicketsCard, useChatTopic } from "./chat-cards";
import { QUICK_QUESTIONS, dayDivider, kindOf } from "./chat-format";
import { ChatPicture } from "./chat-list";
import ChatMessage from "./chat-message";

const EMOJIS = ["🔥", "🎉", "🙌", "❤️", "👏", "✅", "👀", "✨"];

/** The line under a chat's name. */
export const chatSubtitle = (chat: IEventChatGroup, iAmOrganiser: boolean) => {
  const kind = kindOf(chat);
  if (kind === "EVENT_GROUP") {
    const when = chat.eventDate
      ? formatEventTime(chat.eventDate, chat.eventTimezone, { withYear: false })
      : null;
    return [when, `${(chat.memberCount ?? 0).toLocaleString()} going`]
      .filter(Boolean)
      .join(" · ");
  }
  if (kind === "PERSON")
    return chat.person?.username ? `@${chat.person.username}` : "";
  if (kind === "SUPPORT") return "The Turnupz team, about your account";
  return iAmOrganiser ? "Asked about your event" : "Organiser";
};

const MenuItem: React.FC<{
  icon: React.ElementType;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
}> = ({ icon: Icon, onClick, href, children }) => {
  const className =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-secondary-700 hover:bg-secondary-50";
  const content = (
    <>
      <Icon className="size-4 text-secondary-500" aria-hidden />
      {children}
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
};

/**
 * One chat, as on the app: your tickets pinned in an event's chat, the event in
 * view when you're asking its organiser, day dividers, "Seen", quick questions
 * to start with, and read-only states once a chat closes or only the organiser
 * may post. On wide screens the pinned cards move to the details panel.
 */
const ChatThread: React.FC<{
  chat: IEventChatGroup;
  myId?: string;
  onBack: () => void;
  /** The details panel is showing beside it (wide screens). */
  withDetails: boolean;
  /** Came from an event's "Message organiser": the event this is about. */
  aboutEventId?: string;
}> = ({ chat, myId, onBack, withDetails, aboutEventId }) => {
  const kind = kindOf(chat);
  const isGroup = kind === "EVENT_GROUP";
  const isOneToOne = kind === "DIRECT" || kind === "PERSON";
  const iAmOrganiser = kind !== "PERSON" && !!myId && chat.vendor.id === myId;
  const onlyOrganiser = isGroup && !!chat.announcementMode && !iAmOrganiser;
  const canPost = !chat.isClosed && !onlyOrganiser;

  const messagesQuery = useEventChatMessages(chat.id);
  const topic = useChatTopic(chat, aboutEventId);
  const send = useSendEventChatMessage();
  const upload = useUploadEventChatAsset();
  const react = useReactToEventChatMessage();
  const hide = useHideEventChatMessage();
  const mute = useMuteEventChat();
  const settings = useUpdateEventChatSettings();

  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(
    () =>
      (messagesQuery.data ?? []).filter((message) => !message.hiddenByVendor),
    [messagesQuery.data],
  );
  const lastMine = useMemo(
    () => [...messages].reverse().find((message) => message.senderId === myId),
    [messages, myId],
  );
  const seen =
    isOneToOne &&
    !!lastMine &&
    !!chat.otherLastReadAt &&
    new Date(chat.otherLastReadAt) >= new Date(lastMine.createdAt);
  const pinnedId =
    chat.pinnedMessageId && chat.pinnedMessageId !== "none"
      ? chat.pinnedMessageId
      : "";
  const pinned = messages.find((message) => message.id === pinnedId);

  // Newest at the bottom: follow new messages, and start there.
  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages.length, chat.id]);
  useEffect(() => {
    setDraft("");
    setMenuOpen(false);
    setEmojiOpen(false);
  }, [chat.id]);

  // The first message after "Message organiser" carries the event, so the
  // organiser sees what it's about (unless it's already the latest shared).
  const [aboutSent, setAboutSent] = useState(false);
  const latestShared = useMemo(
    () =>
      [...messages].reverse().find((message) => message.sharedEvent)
        ?.sharedEvent?.id,
    [messages],
  );
  const attachAbout =
    !!aboutEventId &&
    !aboutSent &&
    !iAmOrganiser &&
    latestShared !== aboutEventId;

  const sendText = async (text = draft) => {
    const body = text.trim();
    if (!body || !canPost || send.isPending) return;
    try {
      await send.mutateAsync({
        groupId: chat.id,
        body,
        kind: "TEXT",
        ...(attachAbout ? { sharedEventId: aboutEventId } : {}),
      });
      if (attachAbout) setAboutSent(true);
      setDraft("");
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Your message didn't send. Please try again.",
        ),
      );
    }
  };

  const sendFile = async (file: File | undefined, type: "IMAGE" | "FILE") => {
    if (!file || !canPost) return;
    try {
      const attachment = await upload.mutateAsync(file);
      await send.mutateAsync({
        groupId: chat.id,
        body:
          type === "IMAGE"
            ? `Shared an image: ${file.name}`
            : `Shared an attachment: ${file.name}`,
        kind: type,
        attachmentId: attachment.id,
        assetName: file.name,
      });
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "That didn't send. Please try again.",
        ),
      );
    }
  };

  const setSetting = (next: {
    announcementMode?: boolean;
    memberListVisibility?: "visible" | "private";
    pinnedMessageId?: string;
  }) => settings.mutate({ groupId: chat.id, settings: next });

  // Messages with a divider wherever the day changes.
  const rows = useMemo(() => {
    const out: (
      | { type: "day"; label: string; id: string }
      | { type: "message"; index: number }
    )[] = [];
    let last = "";
    messages.forEach((message, index) => {
      const label = dayDivider(message.createdAt);
      if (label !== last) {
        out.push({ type: "day", label, id: `day-${message.id}` });
        last = label;
      }
      out.push({ type: "message", index });
    });
    return out;
  }, [messages]);

  const showQuickQuestions =
    kind === "DIRECT" &&
    !iAmOrganiser &&
    canPost &&
    !draft &&
    messages.length < 4;
  const placeholder = isGroup
    ? iAmOrganiser
      ? "Post an update to everyone going"
      : "Message everyone going"
    : kind === "PERSON"
      ? "Message"
      : kind === "SUPPORT"
        ? "Reply to the Turnupz team"
        : iAmOrganiser
          ? "Reply"
          : "Message the organiser";
  const busy = send.isPending || upload.isPending;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-secondary-100 bg-white px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to chats"
          className="flex size-9 items-center justify-center rounded-full text-secondary-700 hover:bg-secondary-50 @3xl:hidden"
        >
          <ArrowLeftIcon className="size-5" />
        </button>
        <ChatPicture chat={chat} myId={myId} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold text-secondary-950">
            {chat.eventName}
          </p>
          <p className="truncate text-[11.5px] font-semibold text-secondary-500">
            {chatSubtitle(chat, iAmOrganiser)}
            {chat.muted ? " · Muted" : ""}
          </p>
        </div>
        {kind !== "SUPPORT" && (
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-secondary-500"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Chat options"
              aria-expanded={menuOpen}
            >
              <EllipsisIcon className="size-5" />
            </Button>
            {menuOpen && (
              <div
                className="absolute top-11 right-0 z-30 w-72 rounded-[1.1rem] border border-secondary-100 bg-white p-2 shadow-[0_20px_50px_-28px_rgba(15,35,95,0.45)]"
                onClick={() => setMenuOpen(false)}
              >
                {isGroup && (
                  <MenuItem
                    icon={UsersIcon}
                    href={`/app/messages/${chat.id}/members`}
                  >
                    View members
                  </MenuItem>
                )}
                <MenuItem
                  icon={chat.muted ? BellIcon : BellOffIcon}
                  onClick={() =>
                    mute.mutate({ groupId: chat.id, muted: !chat.muted })
                  }
                >
                  {chat.muted ? "Turn alerts back on" : "Mute this chat"}
                </MenuItem>
                {isGroup && iAmOrganiser && (
                  <>
                    <MenuItem
                      icon={MegaphoneIcon}
                      onClick={() =>
                        setSetting({ announcementMode: !chat.announcementMode })
                      }
                    >
                      {chat.announcementMode
                        ? "Let everyone post"
                        : "Only I can post"}
                    </MenuItem>
                    <MenuItem
                      icon={
                        chat.memberListVisibility === "private"
                          ? EyeIcon
                          : EyeOffIcon
                      }
                      onClick={() =>
                        setSetting({
                          memberListVisibility:
                            chat.memberListVisibility === "private"
                              ? "visible"
                              : "private",
                        })
                      }
                    >
                      {chat.memberListVisibility === "private"
                        ? "Show who's going"
                        : "Hide who's going"}
                    </MenuItem>
                    {pinned && (
                      <MenuItem
                        icon={PinOffIcon}
                        onClick={() => setSetting({ pinnedMessageId: "none" })}
                      >
                        Unpin the pinned post
                      </MenuItem>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pinned at the top: your tickets, or the event you're asking about. */}
      <div
        className={cn(
          "space-y-2 px-3 pt-2.5 empty:hidden sm:px-4",
          withDetails && "@7xl:hidden",
        )}
      >
        <YourTicketsCard chat={chat} />
        <AboutEventCard chat={chat} topic={topic} myId={myId} />
      </div>
      {pinned && (
        <div className="mx-3 mt-2.5 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs sm:mx-4">
          <PinIcon
            className="size-3.5 shrink-0 text-secondary-600"
            aria-hidden
          />
          <span className="font-bold text-secondary-800">Pinned</span>
          <span className="truncate text-secondary-600">
            {pinned.assetName || pinned.body}
          </span>
        </div>
      )}
      {(chat.isClosed ||
        onlyOrganiser ||
        (isGroup && iAmOrganiser && chat.announcementMode)) && (
        <p className="mx-3 mt-2 rounded-xl border border-dashed border-secondary-200 bg-white px-3 py-2 text-[11.5px] font-semibold text-secondary-500 sm:mx-4">
          {chat.isClosed
            ? "This chat closed after the event. You can still read it."
            : onlyOrganiser
              ? "Only the organiser can post right now. You'll see their updates here."
              : "Only you can post right now. Everyone else can read and react."}
        </p>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5"
      >
        {messagesQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2
              className="size-5 animate-spin text-secondary-400"
              aria-label="Loading messages"
            />
          </div>
        ) : !messages.length ? (
          <p className="px-6 py-16 text-center text-sm text-secondary-500">
            {kind === "PERSON"
              ? "Say hello."
              : kind === "DIRECT"
                ? iAmOrganiser
                  ? "No messages yet."
                  : "Ask the organiser anything about the event."
                : kind === "SUPPORT"
                  ? "Tell us what you need and the team will reply here."
                  : "Say hi to everyone going."}
          </p>
        ) : (
          <div className="mx-auto max-w-4xl">
            {rows.map((row) =>
              row.type === "day" ? (
                <div key={row.id} className="flex justify-center py-2">
                  <span className="rounded-full border border-secondary-100 bg-white px-2.5 py-0.5 text-[11px] font-bold text-secondary-400">
                    {row.label}
                  </span>
                </div>
              ) : (
                <ChatMessage
                  key={messages[row.index].id}
                  message={messages[row.index]}
                  chat={chat}
                  myId={myId}
                  mine={messages[row.index].senderId === myId}
                  seen={seen && lastMine?.id === messages[row.index].id}
                  isOrganiser={iAmOrganiser}
                  isPinned={messages[row.index].id === pinnedId}
                  onReact={(messageId, emoji) =>
                    react.mutate({
                      groupId: chat.id,
                      messageId,
                      reaction: emoji,
                    })
                  }
                  onTogglePin={(messageId) =>
                    setSetting({
                      pinnedMessageId:
                        messageId === pinnedId ? "none" : messageId,
                    })
                  }
                  onHide={(messageId) =>
                    hide.mutate({ groupId: chat.id, messageId })
                  }
                />
              ),
            )}
          </div>
        )}
      </div>

      {showQuickQuestions && (
        <div className="px-3 pb-2">
          <p className="mb-1.5 text-center text-[11.5px] font-semibold text-secondary-500">
            Quick questions
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {QUICK_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => void sendText(question)}
                disabled={busy}
                className="rounded-full bg-primary/10 px-3 py-2 text-xs font-bold text-secondary-700 hover:bg-primary/15"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      {canPost && (
        <div className="border-t border-secondary-100 bg-white px-3 py-3 sm:px-4">
          {emojiOpen && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setDraft((current) => `${current}${emoji}`);
                    setEmojiOpen(false);
                  }}
                  className="flex size-9 items-center justify-center rounded-full border border-secondary-100 text-lg hover:bg-secondary-50"
                  aria-label={`Add ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void sendFile(event.target.files?.[0], "IMAGE");
                event.currentTarget.value = "";
              }}
            />
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(event) => {
                void sendFile(event.target.files?.[0], "FILE");
                event.currentTarget.value = "";
              }}
            />
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => imageRef.current?.click()}
                disabled={busy}
                aria-label="Send a photo"
                className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-secondary-700 hover:bg-primary/15"
              >
                <ImageIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                aria-label="Send a file"
                className="hidden size-10 items-center justify-center rounded-full text-secondary-500 hover:bg-secondary-50 sm:flex"
              >
                <PaperclipIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setEmojiOpen((open) => !open)}
                aria-label="Add an emoji"
                className="hidden size-10 items-center justify-center rounded-full text-secondary-500 hover:bg-secondary-50 sm:flex"
              >
                <SmileIcon className="size-4" />
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends; Shift+Enter starts a new line.
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  void sendText();
                }
              }}
              rows={1}
              placeholder={placeholder}
              aria-label={placeholder}
              className="max-h-32 min-h-10 min-w-0 flex-1 resize-none rounded-[20px] border border-secondary-100 bg-secondary-50/60 px-4 py-2.5 text-sm text-secondary-950 outline-none placeholder:text-secondary-400 focus:border-primary/40 [field-sizing:content]"
            />
            <button
              type="button"
              onClick={() => void sendText()}
              disabled={!draft.trim() || busy}
              aria-label="Send"
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full text-white transition-colors",
                draft.trim()
                  ? "bg-secondary-700 hover:bg-secondary-800"
                  : "bg-secondary-200",
              )}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <SendIcon className="size-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ChatThread);
