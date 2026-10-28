"use client";

import { constructErrorMessage } from "@/api/functions";
import CustomImageComponent from "@/components/ui/custom-image.component";
import {
  useAcceptTransfer,
  useReceivedTransfers,
} from "@/hooks/use-user-tickets";
import { useMessageRequests } from "@/hooks/use-event-chat";
import { answerMessageRequest } from "@/hooks/use-privacy";
import { useQueryClient } from "@tanstack/react-query";
import { IEventChatGroup } from "@/lib/event-chat";
import { cn } from "@/lib/utils";
import { Loader2, MessageSquareIcon, SearchIcon, TicketIcon } from "lucide-react";
import React, { memo, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CHAT_FILTERS,
  TChatFilter,
  initials,
  kindOf,
  listTime,
  matchesFilter,
} from "./chat-format";

const Tag: React.FC<{ label: string; muted?: boolean }> = ({
  label,
  muted,
}) => (
  <span
    className={cn(
      "shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] font-extrabold tracking-wide",
      muted
        ? "bg-secondary-100 text-secondary-600"
        : "bg-primary/10 text-secondary-700",
    )}
  >
    {label}
  </span>
);

export const ChatPicture: React.FC<{
  chat: IEventChatGroup;
  myId?: string;
  size?: "md" | "lg";
}> = ({ chat, myId, size = "lg" }) => {
  const kind = kindOf(chat);
  const box = size === "lg" ? "size-12" : "size-10";
  const iAmOrganiser = kind !== "PERSON" && chat.vendor.id === myId;
  const image =
    kind === "EVENT_GROUP"
      ? chat.eventImage
      : kind === "PERSON"
        ? chat.person?.image
        : null;
  if (image) {
    return (
      <span
        className={cn(
          "relative shrink-0 overflow-hidden bg-secondary-100",
          box,
          kind === "PERSON" ? "rounded-full" : "rounded-[14px]",
        )}
      >
        <CustomImageComponent
          src={image}
          alt=""
          fill
          className="size-full"
          imageClassName="object-cover"
        />
      </span>
    );
  }
  const light = kind === "EVENT_GROUP" || iAmOrganiser;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[14px] text-sm font-extrabold",
        box,
        light
          ? "bg-primary/10 text-secondary-700"
          : "bg-secondary-950 text-primary",
      )}
      aria-hidden
    >
      {initials(chat.eventName)}
    </span>
  );
};

/** "Tunde sent you a ticket" with Accept, above the chats. */
const WaitingTicket: React.FC = () => {
  const { data: received = [] } = useReceivedTransfers();
  const accept = useAcceptTransfer();
  const pending = received.filter((transfer) => transfer.status === "PENDING");
  const waiting = pending[0];
  if (!waiting) return null;
  const ticket = waiting.userTicket?.ticket;
  return (
    <div className="mx-3 mb-2 flex items-center gap-3 rounded-[18px] bg-secondary-950 p-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
        <TicketIcon className="size-5 text-primary" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-extrabold text-white">
          {waiting.senderName} sent you a ticket
        </span>
        <span className="block truncate text-xs text-white/75">
          {ticket?.name ?? "Ticket"} · {ticket?.event?.name ?? "an event"}
          {pending.length > 1 ? ` · +${pending.length - 1} more` : ""}
        </span>
      </span>
      <button
        type="button"
        disabled={accept.isPending}
        onClick={async () => {
          try {
            await accept.mutateAsync(waiting.id);
            toast.success(
              "It's in your tickets, and you've joined the event's chat.",
            );
          } catch (error) {
            toast.error(
              constructErrorMessage(
                error as TApiErrorResponseType,
                "That didn't work. Please try again.",
              ),
            );
          }
        }}
        className="shrink-0 rounded-full bg-primary px-3.5 py-2 text-[12.5px] font-extrabold text-white hover:bg-primary/90 disabled:opacity-60"
      >
        {accept.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          "Accept"
        )}
      </button>
    </div>
  );
};

/**
 * Messages from people you don't follow back: listed on their own until you
 * accept (or reply) or decline. Declining removes the chat; they aren't told.
 */
const MessageRequests: React.FC<{
  selectedId?: string;
  onSelect: (chat: IEventChatGroup) => void;
}> = ({ selectedId, onSelect }) => {
  const { data: requests = [] } = useMessageRequests();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  if (!requests.length) return null;

  const answer = async (chat: IEventChatGroup, accept: boolean) => {
    setBusy(chat.id);
    try {
      await answerMessageRequest(chat.id, accept);
      await queryClient.invalidateQueries({ queryKey: ["event-chats"] });
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "That didn't work. Please try again.",
        ),
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-3 mb-2 rounded-[18px] border border-secondary-100 bg-white">
      <button
        type="button"
        onClick={() => setOpen((on) => !on)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <MessageSquareIcon className="size-5 text-secondary-700" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-extrabold text-secondary-950">
            Message requests
          </span>
          <span className="block truncate text-xs text-secondary-500">
            {requests.length === 1
              ? `${requests[0].eventName} wants to message you`
              : `${requests.length} people want to message you`}
          </span>
        </span>
        <span className="text-[12.5px] font-bold text-primary">
          {open ? "Hide" : "View"}
        </span>
      </button>
      {open && (
        <ul className="space-y-1 border-t border-secondary-100 p-2">
          {requests.map((chat) => (
            <li
              key={chat.id}
              className={cn(
                "rounded-2xl p-2",
                chat.id === selectedId && "bg-secondary-50",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(chat)}
                className="flex w-full items-center gap-3 text-left"
              >
                <ChatPicture chat={chat} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold text-secondary-950">
                    {chat.eventName}
                  </span>
                  <span className="block truncate text-[12.5px] text-secondary-500">
                    {chat.preview || "Wants to message you"}
                  </span>
                </span>
              </button>
              <span className="mt-2 flex gap-2">
                {busy === chat.id ? (
                  <Loader2 className="size-4 animate-spin text-secondary-400" aria-hidden />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => void answer(chat, true)}
                      className="h-8 flex-1 rounded-xl bg-primary text-[12.5px] font-bold text-white hover:bg-primary/90"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => void answer(chat, false)}
                      className="h-8 flex-1 rounded-xl border border-secondary-200 text-[12.5px] font-bold text-secondary-950 hover:bg-secondary-50"
                    >
                      Decline
                    </button>
                  </>
                )}
              </span>
            </li>
          ))}
          <li className="px-2 pt-1 text-[11.5px] text-secondary-400">
            Replying accepts it. Declining removes it, and they aren&apos;t
            told.
          </li>
        </ul>
      )}
    </div>
  );
};

/**
 * Every chat you're in: event groups (you join one with a ticket), organisers
 * you've asked something, friends, and the Turnupz team. Search and filter, as
 * on the app. Message requests wait at the top.
 */
const ChatList: React.FC<{
  chats: IEventChatGroup[];
  isLoading: boolean;
  selectedId?: string;
  myId?: string;
  onSelect: (chat: IEventChatGroup) => void;
  emptyHint: string;
}> = ({ chats, isLoading, selectedId, myId, onSelect, emptyHint }) => {
  const [filter, setFilter] = useState<TChatFilter>("all");
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = chats.filter(
      (chat) =>
        matchesFilter(chat, filter) &&
        (!needle ||
          `${chat.eventName} ${chat.preview ?? ""}`
            .toLowerCase()
            .includes(needle)),
    );
    return [
      ...list.filter((chat) => kindOf(chat) === "SUPPORT"),
      ...list.filter((chat) => kindOf(chat) !== "SUPPORT"),
    ];
  }, [chats, filter, query]);
  const unreadEvents = chats.filter(
    (chat) => kindOf(chat) === "EVENT_GROUP" && (chat.unreadCount ?? 0) > 0,
  ).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-secondary-100 p-4">
        <label className="flex h-10 items-center gap-2 rounded-2xl border border-secondary-100 bg-secondary-50/60 px-3.5 focus-within:border-primary/40">
          <SearchIcon className="size-4 text-secondary-400" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="min-w-0 flex-1 bg-transparent text-sm text-secondary-950 outline-none placeholder:text-secondary-400"
          />
        </label>
        <div
          role="tablist"
          aria-label="Chat type"
          className="scrollbar-none flex gap-1.5 overflow-x-auto"
        >
          {CHAT_FILTERS.map((chip) => {
            const on = chip.id === filter;
            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setFilter(chip.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-1.5 text-[12.5px] font-bold transition-colors",
                  on
                    ? "border-secondary-950 bg-secondary-950 text-white"
                    : "border-secondary-100 bg-white text-secondary-600 hover:border-secondary-300",
                )}
              >
                {chip.label}
                {chip.id === "events" && unreadEvents > 0 && (
                  <span className={on ? "text-primary" : "text-secondary-600"}>
                    {unreadEvents}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        <WaitingTicket />
        <MessageRequests selectedId={selectedId} onSelect={onSelect} />
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2
              className="size-5 animate-spin text-secondary-400"
              aria-label="Loading chats"
            />
          </div>
        ) : !shown.length ? (
          <div className="px-8 py-14 text-center">
            <p className="font-bold text-secondary-950">
              {query || filter !== "all" ? "No chats here" : "No chats yet"}
            </p>
            <p className="mt-1 text-sm leading-6 text-secondary-500">
              {query || filter !== "all"
                ? "Try All, or search for something else."
                : emptyHint}
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5 px-2">
            {shown.map((chat) => {
              const kind = kindOf(chat);
              const unread = chat.unreadCount ?? 0;
              const iAmOrganiser = kind !== "PERSON" && chat.vendor.id === myId;
              const active = chat.id === selectedId;
              return (
                <li key={chat.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(chat)}
                    aria-current={active ? "true" : undefined}
                    aria-label={`${chat.eventName}${unread ? `, ${unread} unread` : ""}`}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors",
                      active
                        ? "bg-secondary-50"
                        : unread
                          ? "bg-white hover:bg-secondary-50/70"
                          : "hover:bg-secondary-50/70",
                    )}
                  >
                    <ChatPicture chat={chat} myId={myId} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "truncate text-[14.5px] text-secondary-950",
                            unread ? "font-extrabold" : "font-bold",
                          )}
                        >
                          {chat.eventName}
                        </span>
                        {kind === "EVENT_GROUP" ? (
                          <Tag
                            label={chat.isClosed ? "CLOSED" : "EVENT"}
                            muted={chat.isClosed}
                          />
                        ) : kind === "DIRECT" && !iAmOrganiser ? (
                          <Tag label="ORGANISER" muted />
                        ) : kind === "SUPPORT" ? (
                          <Tag label="TURNUPZ" />
                        ) : chat.request === "outgoing" ? (
                          <Tag label="REQUEST SENT" muted />
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block truncate text-[13px]",
                          unread ? "text-secondary-800" : "text-secondary-500",
                        )}
                      >
                        {chat.preview ||
                          (kind === "EVENT_GROUP"
                            ? `${chat.memberCount ?? 0} going`
                            : "Say hello")}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[11.5px] font-semibold text-secondary-400">
                        {listTime(chat.lastActivityAt)}
                      </span>
                      {unread > 0 ? (
                        <span
                          className={cn(
                            "min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-extrabold text-white",
                            chat.muted
                              ? "bg-secondary-300"
                              : "bg-secondary-700",
                          )}
                        >
                          {unread > 99 ? "99+" : unread}
                        </span>
                      ) : chat.muted ? (
                        <span className="text-[10px] font-bold text-secondary-400">
                          Muted
                        </span>
                      ) : (
                        <span className="h-5" />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default memo(ChatList);
