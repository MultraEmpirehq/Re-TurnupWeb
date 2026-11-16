"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEventChats, useSendEventChatMessage } from "@/hooks/use-event-chat";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { Check, Copy, Mail, MessagesSquare, Search, Share2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { memo, useMemo, useState } from "react";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

/**
 * Share an event: Turnupz first (send it into one of your chats, where it
 * shows as an event card), then the usual places outside.
 */
const ShareEventDialog = ({
  open,
  onOpenChange,
  eventId,
  eventName,
  url,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  url: string;
}) => {
  const pathname = usePathname();
  const signedIn = !!useUserStore((state) => state.userDetails);
  const { data: chats = [], isLoading } = useEventChats();
  const send = useSendEventChatMessage();
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [sentTo, setSentTo] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Chats you can post in: open, accepted, and not announcements-only.
  const choices = useMemo(() => {
    const term = query.trim().toLowerCase();
    return chats
      .filter((chat) => !chat.isClosed && !chat.request && !chat.announcementMode)
      .filter((chat) => !term || chat.eventName.toLowerCase().includes(term))
      .slice(0, 30);
  }, [chats, query]);

  const shareText = `Check out ${eventName} on Turnupz`;
  const outside = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  ];

  const sendTo = async (chatId: string, chatName: string) => {
    try {
      await send.mutateAsync({
        groupId: chatId,
        body: note.trim() || "Check out this event",
        kind: "TEXT",
        sharedEventId: eventId,
      });
      setSentTo((current) => [...current, chatId]);
      toast.success(`Sent to ${chatName}`);
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't send it. Try again."));
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setQuery("");
          setNote("");
          setSentTo([]);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {eventName}</DialogTitle>
          <DialogDescription>Send it to friends on Turnupz, or share the link anywhere.</DialogDescription>
        </DialogHeader>

        <section aria-labelledby="share-turnupz" className="space-y-3 rounded-2xl bg-primary/5 p-3">
          <p id="share-turnupz" className="flex items-center gap-2 text-sm font-bold text-foreground">
            <MessagesSquare className="size-4 text-primary" aria-hidden /> Send in a Turnupz chat
          </p>
          {!signedIn ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Sign in to send it to friends and groups.</p>
              <Button asChild size="sm" className="rounded-full">
                <Link href={`${ROUTES.LOGIN.href}?redirect=${encodeURIComponent(pathname)}`}>Sign in</Link>
              </Button>
            </div>
          ) : (
            <>
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add a message (optional)"
                maxLength={300}
                className="bg-card"
              />
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search your chats"
                  aria-label="Search your chats"
                  className="bg-card pl-9"
                />
              </div>
              <ul className="max-h-60 space-y-1 overflow-y-auto">
                {isLoading && <li className="px-1 py-2 text-sm text-muted-foreground">Loading your chats…</li>}
                {!isLoading && choices.length === 0 && (
                  <li className="px-1 py-2 text-sm text-muted-foreground">
                    {query ? "No chat matches that." : "No chats yet. Follow friends to message them."}
                  </li>
                )}
                {choices.map((chat) => {
                  const sent = sentTo.includes(chat.id);
                  const image = chat.person?.image ?? chat.eventImage;
                  return (
                    <li key={chat.id} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="size-9 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-xs font-bold text-secondary-700">
                          {initials(chat.eventName)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{chat.eventName}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant={sent ? "outline" : "default"}
                        className="rounded-full"
                        disabled={sent}
                        onClick={() => sendTo(chat.id, chat.eventName)}
                      >
                        {sent ? (
                          <>
                            <Check className="size-3.5" aria-hidden /> Sent
                          </>
                        ) : (
                          "Send"
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <section aria-labelledby="share-elsewhere" className="space-y-2">
          <p id="share-elsewhere" className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Share elsewhere
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="justify-start rounded-xl" onClick={copy}>
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            {outside.map((item) => (
              <Button key={item.label} asChild variant="outline" className="justify-start rounded-xl">
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  {item.label}
                </a>
              </Button>
            ))}
            <Button asChild variant="outline" className="justify-start rounded-xl">
              <a href={`mailto:?subject=${encodeURIComponent(eventName)}&body=${encodeURIComponent(`${shareText}\n${url}`)}`}>
                <Mail className="size-4" aria-hidden /> Email
              </a>
            </Button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <Button
                type="button"
                variant="outline"
                className="justify-start rounded-xl"
                onClick={() => navigator.share({ title: eventName, text: shareText, url }).catch(() => undefined)}
              >
                <Share2 className="size-4" aria-hidden /> More
              </Button>
            )}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ShareEventDialog);
