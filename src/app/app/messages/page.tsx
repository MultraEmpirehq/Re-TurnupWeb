"use client";

import ChatDetails from "@/components/pages/app/messages/chat-details";
import ChatList from "@/components/pages/app/messages/chat-list";
import ChatThread from "@/components/pages/app/messages/chat-thread";
import { useEventChats } from "@/hooks/use-event-chat";
import { cn } from "@/lib/utils";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { MessagesSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { memo, useEffect, useState } from "react";

/**
 * Messages, laid out for the screen it's on. Phones see the list, then one
 * chat. From laptop width the list and the chat sit side by side, and on wide
 * screens a third column shows the event, your tickets and the chat's setup.
 */
const MessagesPage = () => {
  const userDetails = useUserStore((state) => state.userDetails);
  const myId = userDetails?.id;
  const isAttendee = userDetails?.role === EUserRoles.USER;
  const { data: chats = [], isLoading, refetch } = useEventChats();

  // A link to one chat (e.g. from a notification) opens it.
  const searchParams = useSearchParams();
  const linkedChatId = searchParams.get("chat");
  // From an event's "Message organiser": the event the chat is about.
  const aboutParam = searchParams.get("about") ?? undefined;
  const [selectedId, setSelectedId] = useState(linkedChatId ?? "");
  // On a phone the chat replaces the list once one is picked.
  const [threadOnSmall, setThreadOnSmall] = useState(!!linkedChatId);
  useEffect(() => {
    if (!linkedChatId) return;
    setSelectedId(linkedChatId);
    setThreadOnSmall(true);
  }, [linkedChatId]);
  const linkMissing =
    !!linkedChatId && !isLoading && !chats.some((chat) => chat.id === linkedChatId);
  useEffect(() => {
    if (linkMissing) void refetch();
  }, [linkMissing, refetch]);

  // A chat linked to that isn't in the list yet (just started) waits for it,
  // rather than opening another one.
  const waitingForLink = !!selectedId && selectedId === linkedChatId;
  const selected =
    chats.find((chat) => chat.id === selectedId) ??
    (waitingForLink ? undefined : chats[0]);
  const aboutEventId = selected?.id === linkedChatId ? aboutParam : undefined;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-secondary-950 md:text-[2rem]">
          Messages
        </h1>
        <p className="mt-1 text-sm text-secondary-500">
          {isAttendee
            ? "Event chats for what you're going to, organisers you've asked, and friends."
            : "Your events' chats, questions from people going, and the Turnupz team."}
        </p>
      </div>

      {/* Columns follow the room the chats have, not the window: the vendor
          sidebar and the attendee header leave different widths. */}
      <div className="@container">
        <div
          className={cn(
            "grid h-[calc(100svh-13rem)] min-h-[520px] overflow-hidden rounded-[1.75rem] border border-secondary-100 bg-white shadow-[0_24px_60px_-40px_rgba(15,35,95,0.18)]",
            "@3xl:grid-cols-[300px_minmax(0,1fr)] @5xl:grid-cols-[350px_minmax(0,1fr)] @7xl:grid-cols-[360px_minmax(0,1fr)_320px] @[100rem]:grid-cols-[380px_minmax(0,1fr)_360px]",
          )}
        >
          <aside
            className={cn(
              "min-h-0 min-w-0 border-secondary-100 @3xl:block @3xl:border-r",
              threadOnSmall && selected ? "hidden" : "block",
            )}
          >
            <ChatList
              chats={chats}
              isLoading={isLoading}
              selectedId={selected?.id}
              myId={myId}
              onSelect={(chat) => {
                setSelectedId(chat.id);
                setThreadOnSmall(true);
              }}
              emptyHint={
                isAttendee
                  ? "When you get a ticket, you join that event's chat. You can also message an organiser from any event."
                  : "Each event you publish gets a chat, and people join it when they book."
              }
            />
          </aside>

          <section
            className={cn(
              "min-h-0 min-w-0 bg-secondary-50/40 @3xl:block",
              threadOnSmall && selected ? "block" : "hidden",
            )}
          >
            {selected ? (
              <ChatThread
                key={selected.id}
                aboutEventId={aboutEventId}
                chat={selected}
                myId={myId}
                withDetails
                onBack={() => setThreadOnSmall(false)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-10 text-center">
                <MessagesSquare
                  className="size-10 text-secondary-300"
                  aria-hidden
                />
                <p className="font-bold text-secondary-950">
                  {isLoading ? "Loading your chats…" : "No chat open"}
                </p>
                {!isLoading && (
                  <p className="max-w-sm text-sm text-secondary-500">
                    Pick a chat from the list.
                  </p>
                )}
              </div>
            )}
          </section>

          {selected && (
            <aside className="hidden min-h-0 border-l border-secondary-100 bg-white @7xl:block">
              <ChatDetails
                chat={selected}
                myId={myId}
                aboutEventId={aboutEventId}
              />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(MessagesPage);
