"use client";

import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { LifeBuoy } from "lucide-react";
import React, { memo, useState } from "react";
import { toast } from "@/lib/toast";

/**
 * "Get help with this order": a message to the Turnupz team with the order
 * number on it. Replies come back in the app's Messages (and by email).
 */
const OrderHelp = ({
  reference,
  eventName,
}: {
  reference: string;
  eventName?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await postData("/chats/support", {
        message: `Help with order ${reference} (${eventName ?? "event"}):\n${message.trim()}`,
      });
      setMessage("");
      setOpen(false);
      toast.success("Sent. The Turnupz team will reply in the app and by email.");
    } catch (error) {
      toast.error(
        constructErrorMessage(error as TApiErrorResponseType, "Couldn't send your message."),
      );
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <LifeBuoy className="size-4" />
        Get help with this order
      </Button>
    );
  }
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <p className="text-sm text-muted-foreground">
        Tell us what went wrong. We&apos;ll include your order number{" "}
        <span className="font-semibold text-foreground">{reference}</span>.
      </p>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={4}
        placeholder="e.g. I was charged but didn't get my tickets"
        className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-400"
      />
      <div className="flex gap-2">
        <Button onClick={() => void send()} loading={sending} disabled={!message.trim()}>
          Send
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default memo(OrderHelp);
