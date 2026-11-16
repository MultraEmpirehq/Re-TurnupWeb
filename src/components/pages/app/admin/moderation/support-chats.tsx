"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import StatusBadge from "@/components/ui/status-badge";
import {
  awayToast,
  type TSupportChat,
  useAssignSupportChat,
  useReplyToSupport,
  useSupportAway,
  useSupportChatAction,
  useSupportTeam,
  useSupportChats,
  useSupportMessages,
} from "@/hooks/use-admin-support-chats";
import useUserStore from "@/stores/user-store";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, ChevronDown, Hand, MessagesSquare, UserRoundPlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchParams } from "next/navigation";
import React, { memo, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { FilterTabs, ListSkeleton, PageHeading } from "./moderation-ui";

type TChatFilter = "open" | "resolved" | "all";
const FILTERS: { value: TChatFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
];

/** Waiting, with someone, or resolved: one badge per chat. */
const ChatState = ({ chat, myId }: { chat: TSupportChat; myId?: string }) =>
  chat.resolvedAt ? (
    <StatusBadge tone="neutral">Resolved</StatusBadge>
  ) : (
    <span className="flex shrink-0 flex-wrap justify-end gap-1">
      {chat.pickedUpBy && (
        <StatusBadge tone="info">{chat.pickedUpBy.id === myId ? "With you" : `With ${chat.pickedUpBy.name}`}</StatusBadge>
      )}
      {chat.waitingOnUs && <StatusBadge tone="warning">Waiting</StatusBadge>}
    </span>
  );

/**
 * People's chats with the Turnupz team, from the app's Get help and Message
 * us. Replies land in their Messages, with a notification. Opening a chat
 * only reads it; "I'm on it" (or a reply) makes it yours and stops it moving
 * up to the head of Support. Resolved chats reopen when the person writes again.
 */
const SupportChats = () => {
  const chats = useSupportChats();
  const myId = useUserStore((state) => state.userDetails?.id);
  const action = useSupportChatAction();
  const team = useSupportTeam();
  const assign = useAssignSupportChat();
  const away = useSupportAway();
  const meAway = !!team.data?.meAway;
  const [filter, setFilter] = useState<TChatFilter>("open");
  // A notification links straight to a chat (?chat=…).
  const linked = useSearchParams().get("chat");
  const [openId, setOpenId] = useState<string | null>(linked);
  useEffect(() => {
    if (linked) setOpenId(linked);
  }, [linked]);
  const messages = useSupportMessages(openId);
  const reply = useReplyToSupport(openId);
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const all = chats.data ?? [];
  const list = all.filter((chat) => filter === "all" || (filter === "resolved") === !!chat.resolvedAt);
  const open = all.find((chat) => chat.id === openId) ?? null;

  const toggleAway = async (next: boolean) => {
    try {
      const result = await away.mutateAsync(next);
      toast.success(awayToast(next, result?.released));
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't change that."));
    }
  };

  const handTo = async (chatId: string, adminId: string, name: string) => {
    try {
      await assign.mutateAsync({ chatId, adminId });
      toast.success(`Handed to ${name}`);
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't hand it over."));
    }
  };

  const act = async (chatId: string, kind: "pick-up" | "resolve") => {
    try {
      await action.mutateAsync({ chatId, action: kind });
      toast.success(kind === "resolve" ? "Marked as resolved" : "It's yours: nobody else will be chased about it");
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't update the chat."));
    }
  };

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length, openId]);

  const send = async () => {
    if (!text.trim()) return;
    try {
      await reply.mutateAsync(text.trim());
      setText("");
    } catch (error) {
      toast.error(
        constructErrorMessage(error as TApiErrorResponseType, "Couldn't send your reply."),
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading title="Live Chats">
        Messages people send from the app (Get help on an order, or Help &amp; FAQs).
        Your reply shows in their Messages and they get a notification. Say &ldquo;I&apos;m on it&rdquo; so the
        rest of the team knows it&apos;s handled.
      </PageHeading>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs tabs={FILTERS} value={filter} onChange={setFilter} />
        <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium">
          <Switch checked={meAway} disabled={away.isPending || !team.data} onCheckedChange={(next) => void toggleAway(next)} />
          {meAway ? "You're away" : "I'm away"}
        </label>
      </div>
      {meAway && (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
          You&apos;re marked away: alerts skip you and chats can&apos;t be handed to you. Switch it off here or in
          your account menu when you&apos;re back.
        </p>
      )}
      {!!team.data?.staff.length && (
        <p className="text-xs text-muted-foreground">
          On Support:{" "}
          {team.data.staff
            .map(
              (person) =>
                `${person.name}${person.isHead ? " (head)" : ""}${person.away ? " · away" : ` · ${person.openChats} open`}`,
            )
            .join(", ")}
        </p>
      )}

      {chats.error ? (
        <ErrorContainer
          error={constructErrorMessage(
            chats.error as TApiErrorResponseType,
            "Couldn't load support chats.",
          )}
          retryFunction={() => void chats.refetch()}
        />
      ) : chats.isLoading ? (
        <ListSkeleton />
      ) : !all.length ? (
        <EmptyContainer
          icon={<MessagesSquare className="size-6" />}
          title="No support chats yet"
          description="When someone asks for help in the app, it shows here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <ul className="space-y-2">
            {!list.length && (
              <li className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                {filter === "open" ? "Nothing open. All caught up." : "No resolved chats yet."}
              </li>
            )}
            {list.map((chat) => (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(chat.id)}
                  className={cn(
                    "w-full rounded-xl border bg-card p-3 text-left transition hover:border-primary-300",
                    chat.id === openId && "border-primary-500 ring-2 ring-primary-100",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{chat.person.name}</p>
                    <ChatState chat={chat} myId={myId} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{chat.person.email}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-secondary-700">{chat.preview}</p>
                  <p className="mt-1 text-2xs text-muted-foreground">
                    {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true })}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex min-h-[420px] flex-col rounded-xl border bg-card">
            {!open ? (
              <div className="m-auto p-8 text-center text-sm text-muted-foreground">
                Pick a chat to read and reply.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{open.person.name}</p>
                    <p className="text-xs text-muted-foreground">{open.person.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ChatState chat={open} myId={myId} />
                    {!open.resolvedAt && open.pickedUpBy?.id !== myId && (
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => act(open.id, "pick-up")}>
                        <Hand className="size-4" aria-hidden />
                        {open.pickedUpBy ? "Take it over" : "I'm on it"}
                      </Button>
                    )}
                    {!open.resolvedAt && team.data?.canAssign && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="rounded-lg" loading={assign.isPending}>
                            <UserRoundPlus className="size-4" aria-hidden /> Hand to
                            <ChevronDown className="size-3.5" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-56">
                          <DropdownMenuLabel>Hand this chat to</DropdownMenuLabel>
                          {team.data.staff.map((person) => (
                            <DropdownMenuItem
                              key={person.id}
                              disabled={person.away || person.id === open.pickedUpBy?.id}
                              onSelect={() => void handTo(open.id, person.id, person.name)}
                            >
                              <span className="flex-1 truncate">
                                {person.name}
                                {person.id === myId ? " (you)" : ""}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {person.away
                                  ? "Away"
                                  : person.id === open.pickedUpBy?.id
                                    ? "Has it"
                                    : `${person.openChats} open`}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {!open.resolvedAt && (
                      <Button size="sm" className="rounded-lg" onClick={() => act(open.id, "resolve")}>
                        <CheckCircle2 className="size-4" aria-hidden /> Mark resolved
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: 520 }}>
                  {messages.isLoading ? (
                    <ListSkeleton />
                  ) : (
                    (messages.data ?? []).map((message) => {
                      const fromTeam = message.senderRole?.toLowerCase() === "admin";
                      return (
                        <div
                          key={message.id}
                          className={cn("flex", fromTeam ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                              fromTeam ? "bg-primary-500 text-white" : "bg-secondary-50 text-secondary-900",
                            )}
                          >
                            <p className="mb-0.5 text-2xs font-semibold opacity-75">
                              {fromTeam ? `${message.senderName} · Turnupz team` : message.senderName}
                            </p>
                            {message.body}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottom} />
                </div>
                <div className="flex gap-2 border-t p-3">
                  <textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void send();
                    }}
                    rows={2}
                    placeholder="Write a reply…"
                    className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-400"
                  />
                  <Button onClick={() => send()} disabled={!text.trim() || reply.isPending}>
                    {reply.isPending ? "Sending…" : "Send"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SupportChats);
