"use client";

import { getData, postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  mapBackendMessage,
  useSendEventChatMessage,
} from "@/hooks/use-event-chat";
import { IVendorVerification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MessageSquareText, SendHorizontal } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { vendorName } from "./verification-utils";

/** Openers for the usual reasons to get in touch while an application is open. */
const OPENERS = [
  "Hi! I'm reviewing your vendor application and have a quick question.",
  "Thanks for applying. Could you send a clearer photo of your ID here?",
  "Could you confirm the bank account belongs to you or your business?",
  "Your application looks good. One last thing before we approve it:",
];

type TBackendMessage = Parameters<typeof mapBackendMessage>[0];

/**
 * The Turnupz team's chat with this vendor, from the application: to ask about
 * something while it's pending without a formal "needs more info". The vendor
 * sees it in their messages and is notified; any admin can pick it up.
 */
const VendorChatPanel: React.FC<{ verification: IVendorVerification }> = ({
  verification,
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const listEnd = useRef<HTMLDivElement>(null);
  const name = vendorName(verification);

  const chat = useMutation({
    mutationFn: async () => {
      const { data } = await postData<undefined, { id: string; isNew: boolean }>(
        `/admin/vendor-verifications/${verification.id}/chat`,
      );
      return data?.data;
    },
    onError: (error) =>
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't open the chat",
        ),
      ),
  });
  const chatId = chat.data?.id;

  const messages = useQuery({
    // The same key as the messages page, so both stay in step.
    queryKey: ["event-chat-messages", chatId],
    queryFn: async () => {
      const { data } = await getData<TBackendMessage[]>(
        `/chats/${chatId}/messages`,
      );
      return (data?.data ?? []).map(mapBackendMessage);
    },
    enabled: open && !!chatId,
    // New replies show up while the panel is open.
    refetchInterval: open ? 5000 : false,
  });
  const send = useSendEventChatMessage();

  useEffect(() => {
    if (open && !chatId && !chat.isPending) chat.mutate();
    // Opened once per panel; the mutation object is stable enough for this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listEnd.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length, open]);

  const submit = () => {
    const body = draft.trim();
    if (!body || !chatId) return;
    send.mutate(
      { groupId: chatId, body, kind: "TEXT" },
      {
        onSuccess: () => setDraft(""),
        onError: (error) =>
          toast.error(
            constructErrorMessage(
              error as TApiErrorResponseType,
              "Couldn't send the message",
            ),
          ),
      },
    );
  };

  const items = messages.data ?? [];

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl"
        onClick={() => setOpen(true)}
      >
        <MessageSquareText className="size-4" />
        Message vendor
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle>Chat with {name}</SheetTitle>
            <SheetDescription className="text-xs">
              They see this in their messages as the Turnupz verification team,
              and are notified of each message.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
            {chat.isPending || (messages.isLoading && !!chatId) ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-3/4 rounded-2xl" />
                <Skeleton className="ml-auto h-14 w-2/3 rounded-2xl" />
              </div>
            ) : items.length === 0 ? (
              <div className="space-y-3 py-6 text-center text-sm text-muted-foreground">
                <p>No messages yet. Start with one of these, or write your own.</p>
                <div className="flex flex-col gap-2">
                  {OPENERS.map((opener) => (
                    <button
                      key={opener}
                      type="button"
                      onClick={() => setDraft(opener)}
                      className="rounded-xl border border-border bg-background px-3 py-2 text-left text-xs text-foreground hover:bg-muted"
                    >
                      {opener}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              items.map((message) => {
                const fromTeam = message.senderMemberRole === "team";
                return (
                  <div
                    key={message.id}
                    className={cn("flex", fromTeam ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                        fromTeam
                          ? "bg-secondary-800 text-white"
                          : "border border-border bg-background",
                      )}
                    >
                      <p className="text-[11px] font-semibold opacity-70">
                        {fromTeam ? `${message.senderName} · Team` : message.senderName}
                      </p>
                      <p className="mt-0.5 whitespace-pre-line break-words">
                        {message.body}
                      </p>
                      <p className="mt-1 text-[10px] opacity-60">
                        {format(new Date(message.createdAt), "d MMM, HH:mm")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={listEnd} />
          </div>

          <form
            className="space-y-2 border-t border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder={`Message ${name}…`}
              className="min-h-20 resize-none text-sm"
              disabled={!chatId}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">
                Enter to send, Shift + Enter for a new line
              </span>
              <Button
                type="submit"
                size="sm"
                loading={send.isPending}
                disabled={!draft.trim() || !chatId}
              >
                <SendHorizontal className="size-4" />
                Send
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default VendorChatPanel;
