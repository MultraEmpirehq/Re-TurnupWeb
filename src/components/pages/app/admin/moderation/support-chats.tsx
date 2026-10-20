"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import {
  useReplyToSupport,
  useSupportChats,
  useSupportMessages,
} from "@/hooks/use-admin-support-chats";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MessagesSquare } from "lucide-react";
import React, { memo, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ListSkeleton, PageHeading } from "./moderation-ui";

/**
 * People's chats with the Turnupz team, from the app's Get help and Message
 * us. Replies land in their Messages, with a notification.
 */
const SupportChats = () => {
  const chats = useSupportChats();
  const [openId, setOpenId] = useState<string | null>(null);
  const messages = useSupportMessages(openId);
  const reply = useReplyToSupport(openId);
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const list = chats.data ?? [];
  const open = list.find((chat) => chat.id === openId) ?? null;

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
      <PageHeading title="Support chats">
        Messages people send from the app (Get help on an order, or Help &amp; FAQs).
        Your reply shows in their Messages and they get a notification.
      </PageHeading>

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
      ) : !list.length ? (
        <EmptyContainer
          icon={<MessagesSquare className="size-6" />}
          title="No support chats yet"
          description="When someone asks for help in the app, it shows here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <ul className="space-y-2">
            {list.map((chat) => (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(chat.id)}
                  className={cn(
                    "w-full rounded-xl border bg-white p-3 text-left transition hover:border-primary-300",
                    chat.id === openId && "border-primary-500 ring-2 ring-primary-100",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{chat.person.name}</p>
                    {chat.waitingOnUs && (
                      <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-700">
                        Waiting
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{chat.person.email}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-secondary-700">{chat.preview}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true })}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex min-h-[420px] flex-col rounded-xl border bg-white">
            {!open ? (
              <div className="m-auto p-8 text-center text-sm text-muted-foreground">
                Pick a chat to read and reply.
              </div>
            ) : (
              <>
                <div className="border-b px-4 py-3">
                  <p className="font-semibold">{open.person.name}</p>
                  <p className="text-xs text-muted-foreground">{open.person.email}</p>
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
                            <p className="mb-0.5 text-[11px] font-semibold opacity-75">
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
                  <Button onClick={() => void send()} disabled={!text.trim() || reply.isPending}>
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
