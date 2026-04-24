"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  IEventChatGroup,
  appendEventChatMessage,
  getEventChatGroups,
  subscribeToEventChatGroups,
} from "@/lib/event-chat";
import { cn } from "@/lib/utils";
import useUserStore from "@/stores/user-store";
import {
  EllipsisIcon,
  ImageIcon,
  MicIcon,
  PaperclipIcon,
  SearchIcon,
  SendIcon,
} from "lucide-react";
import React, { memo, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import CustomImageComponent from "@/components/ui/custom-image.component";

type TChatStatus = "all" | "groups" | "private";

const statusTabs: Array<{ label: string; value: TChatStatus }> = [
  { label: "All", value: "all" },
  { label: "Groups", value: "groups" },
  { label: "Private", value: "private" },
];

const formatTimeLabel = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const formatMessageTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

const MessagesPage = () => {
  const [groups, setGroups] = React.useState<IEventChatGroup[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<TChatStatus>("groups");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const attachmentInputRef = React.useRef<HTMLInputElement | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement | null>(null);
  const audioInputRef = React.useRef<HTMLInputElement | null>(null);
  const userDetails = useUserStore((state) => state.userDetails);

  React.useEffect(() => {
    const sync = () => setGroups(getEventChatGroups());
    sync();
    return subscribeToEventChatGroups(sync);
  }, []);

  const filteredConversations = useMemo(() => {
    if (selectedStatus === "all") return groups;
    return groups.filter(
      (conversation) =>
        selectedStatus === "groups"
          ? conversation.members.length > 0 || conversation.messages.length > 0
          : conversation.members.length === 0,
    );
  }, [groups, selectedStatus]);

  const activeConversation =
    filteredConversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) ?? filteredConversations[0];

  const sender = useMemo(
    () => ({
      id: userDetails?.id || activeConversation?.vendor.id || "turnupz-vendor",
      name:
        userDetails?.name ||
        [userDetails?.firstName, userDetails?.lastName].filter(Boolean).join(" ") ||
        activeConversation?.vendor.name ||
        "Turnupz Vendor",
      role: "vendor" as const,
    }),
    [activeConversation?.vendor.id, activeConversation?.vendor.name, userDetails],
  );

  const handleSendMessage = React.useCallback(() => {
    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage || !activeConversation) return;

    appendEventChatMessage({
      eventId: activeConversation.eventId,
      sender,
      body: trimmedMessage,
      kind: "text",
    });
    setDraftMessage("");
  }, [activeConversation, draftMessage, sender]);

  const handleUpload = React.useCallback(
    (
      file: File | null | undefined,
      kind: "image" | "audio" | "file",
      bodyPrefix: string,
    ) => {
      if (!file || !activeConversation) return;

      const assetUrl = URL.createObjectURL(file);
      appendEventChatMessage({
        eventId: activeConversation.eventId,
        sender,
        body: `${bodyPrefix}${file.name}`,
        kind,
        assetUrl,
        assetName: file.name,
      });
    },
    [activeConversation, sender],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-secondary-400">
            Vendor Chats
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-secondary-950 md:text-[2.35rem]">
            Stay close to your event audience
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary-500">
            Keep group conversations, attendee questions, and event updates in
            one clean Turnupz workspace.
          </p>
        </div>
      </div>

      <div className="grid min-h-[720px] gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-[1.75rem] border border-secondary-100 bg-white shadow-[0_24px_60px_-40px_rgba(15,35,95,0.18)]">
          <div className="border-b border-secondary-100 p-4">
            <div className="rounded-full border border-secondary-100 bg-secondary-50 px-4 py-2">
              <div className="flex items-center gap-3 text-secondary-500">
                <SearchIcon className="size-4" />
                <span className="text-sm">Search chats</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {statusTabs.map((tab) => {
                const isActive = selectedStatus === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setSelectedStatus(tab.value)}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                      isActive
                        ? "bg-secondary-800 text-white"
                        : "bg-secondary-50 text-secondary-600 hover:bg-secondary-100",
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-[640px] overflow-y-auto">
            {filteredConversations.length === 0 && (
              <div className="px-5 py-10 text-sm text-secondary-500">
                Publish an event to automatically create its group chat here.
              </div>
            )}
            {filteredConversations.map((conversation) => {
              const isActive = activeConversation?.id === conversation.id;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-secondary-100 px-4 py-4 text-left transition-colors",
                    isActive
                      ? "bg-secondary-50/80"
                      : "hover:bg-secondary-50/60",
                  )}
                >
                  <Avatar className="mt-1 size-9 border border-secondary-100 bg-secondary-800 text-white">
                    <AvatarFallback className="bg-secondary-800 text-xs font-semibold text-white">
                      {getInitials(conversation.eventName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-secondary-950">
                          {conversation.eventName} Community
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-secondary-500">
                          {conversation.preview}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-secondary-400">
                        {formatTimeLabel(conversation.lastActivityAt)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
                          conversation.status === "active"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary-50 text-secondary-400",
                        )}
                      >
                        {conversation.status}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-secondary-400">
                        {conversation.members.length} members
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="overflow-hidden rounded-[1.75rem] border border-secondary-100 bg-white shadow-[0_24px_60px_-40px_rgba(15,35,95,0.18)]">
          <div className="flex items-center justify-between gap-4 border-b border-secondary-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 border border-secondary-100 bg-secondary-800">
                <AvatarFallback className="bg-secondary-800 text-sm font-semibold text-white">
                  {activeConversation ? getInitials(activeConversation.eventName) : "T"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-secondary-950">
                  {activeConversation?.eventName
                    ? `${activeConversation.eventName} Community`
                    : "Turnupz Event Circle"}
                </p>
                <p className="text-xs text-secondary-400">
                  {activeConversation
                    ? `${activeConversation.members.length} members`
                    : "Active"}
                </p>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="rounded-full text-secondary-500">
              <EllipsisIcon className="size-5" />
            </Button>
          </div>

          <div className="space-y-5 bg-secondary-50/60 px-5 py-5">
            <div className="flex justify-center">
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-secondary-400 shadow-sm">
                {activeConversation
                  ? formatTimeLabel(activeConversation.lastActivityAt)
                  : "Today"}
              </span>
            </div>

            {(activeConversation?.messages ?? []).map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "vendor" ? "justify-end" : "justify-start",
                )}
              >
                {message.role !== "vendor" && (
                  <Avatar className="mt-1 size-9 border border-secondary-100 bg-secondary-800">
                    <AvatarFallback className="bg-secondary-800 text-xs font-semibold text-white">
                      {getInitials(message.senderName)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "max-w-[680px]",
                    message.role === "vendor" ? "items-end" : "items-start",
                  )}
                >
                  {message.kind === "event-update" ? (
                    <div className="w-full max-w-[520px] rounded-[1.6rem] border border-secondary-100 bg-white p-4 shadow-sm">
                      <div className="relative overflow-hidden rounded-[1.2rem] bg-[linear-gradient(135deg,rgba(13,29,53,0.85),rgba(46,170,241,0.25)),url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center p-5 text-white">
                        <div className="flex items-start justify-between gap-4">
                          <div className="rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur-sm">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-white/75">
                              Aug
                            </p>
                            <p className="mt-1 text-xl font-bold">24</p>
                          </div>
                          <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm">
                            Upcoming
                          </span>
                        </div>

                        <div className="mt-16 max-w-sm">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
                            Turnupz Event Update
                          </p>
                          <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em]">
                            {activeConversation?.eventName || "Upcoming Turnupz Night"}
                          </h2>
                          <p className="mt-3 text-sm leading-6 text-white/80">
                            New lineup notes, access reminders, and the latest
                            booking push for your audience.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 px-1 pt-4">
                        <p className="text-sm leading-6 text-secondary-700">
                          Hello loves,
                        </p>
                        <p className="text-sm leading-6 text-secondary-500">
                          We at Turnupz Nigeria are getting the next turnout
                          ready. Expect a stronger crowd flow, updated access
                          categories, and a cleaner event entry process.
                        </p>
                        <p className="text-sm leading-6 text-secondary-500">
                          Guests can now lock tickets, register, or join by
                          private invite depending on the event access type you
                          publish.
                        </p>
                        <p className="text-sm font-medium text-primary">
                          https://turnupz.com/events/upcoming-turnupz-night
                        </p>
                      </div>
                    </div>
                  ) : message.kind === "image" && message.assetUrl ? (
                    <div className="max-w-[360px] rounded-[1.2rem] border border-secondary-100 bg-white p-3 shadow-sm">
                      <div className="relative aspect-square overflow-hidden rounded-[1rem] bg-secondary-50">
                        <CustomImageComponent
                          src={message.assetUrl}
                          alt={message.assetName || "Chat upload"}
                          fill
                          className="size-full"
                          imageClassName="object-cover"
                        />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-secondary-700">
                        {message.body}
                      </p>
                    </div>
                  ) : message.kind === "audio" && message.assetUrl ? (
                    <div
                      className={cn(
                        "max-w-[360px] rounded-[1.2rem] px-4 py-4 shadow-sm",
                        message.role === "vendor"
                          ? "bg-secondary-800 text-white"
                          : "border border-secondary-100 bg-white text-secondary-700",
                      )}
                    >
                      <p className="mb-3 text-sm leading-6">{message.body}</p>
                      <audio controls className="w-full">
                        <source src={message.assetUrl} />
                      </audio>
                    </div>
                  ) : message.kind === "file" && message.assetUrl ? (
                    <div
                      className={cn(
                        "max-w-[360px] rounded-[1.2rem] px-4 py-4 shadow-sm",
                        message.role === "vendor"
                          ? "bg-secondary-800 text-white"
                          : "border border-secondary-100 bg-white text-secondary-700",
                      )}
                    >
                      <p className="text-sm leading-6">{message.body}</p>
                      <a
                        href={message.assetUrl}
                        download={message.assetName}
                        className={cn(
                          "mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold",
                          message.role === "vendor"
                            ? "bg-white/15 text-white"
                            : "bg-secondary-50 text-secondary-700",
                        )}
                      >
                        Download {message.assetName || "attachment"}
                      </a>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "max-w-[420px] rounded-[1.2rem] px-4 py-3 shadow-sm",
                        message.role === "vendor"
                          ? "bg-secondary-800 text-white"
                          : "border border-secondary-100 bg-white text-secondary-700",
                      )}
                    >
                      <p className="text-sm leading-6">{message.body}</p>
                    </div>
                  )}

                  <div
                    className={cn(
                      "mt-2 flex items-center gap-2 text-[11px] text-secondary-400",
                      message.role === "vendor" ? "justify-end" : "justify-start",
                    )}
                  >
                    <span>{message.senderName}</span>
                    <span>{formatMessageTime(message.createdAt)}</span>
                  </div>
                </div>

                {message.role === "vendor" && message.kind !== "event-update" && (
                  <Avatar className="mt-1 size-9 border border-secondary-100 bg-secondary-100">
                    <AvatarFallback className="bg-secondary-100 text-xs font-semibold text-secondary-800">
                      {getInitials(message.senderName)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {!activeConversation && (
              <div className="rounded-[1.4rem] border border-secondary-100 bg-white px-5 py-8 text-sm text-secondary-500">
                Publish an event to create its chat group automatically. When attendees
                book, register, pay, or open an external ticket link, they can be added
                to the group flow here.
              </div>
            )}
          </div>

          <div className="border-t border-secondary-100 px-5 py-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
              <div className="flex-1">
                <Textarea
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message to your event community..."
                  className="min-h-12 rounded-2xl border-secondary-100 bg-white px-4 py-3 text-sm text-secondary-700 shadow-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={attachmentInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    handleUpload(
                      e.target.files?.[0],
                      "file",
                      "Shared an attachment: ",
                    );
                    e.currentTarget.value = "";
                  }}
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleUpload(e.target.files?.[0], "image", "Shared an image: ");
                    e.currentTarget.value = "";
                  }}
                />
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    handleUpload(
                      e.target.files?.[0],
                      "audio",
                      "Shared an audio update: ",
                    );
                    e.currentTarget.value = "";
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-secondary-100 text-secondary-500"
                  onClick={() => attachmentInputRef.current?.click()}
                >
                  <PaperclipIcon className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-secondary-100 text-secondary-500"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImageIcon className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-secondary-100 text-secondary-500"
                  onClick={() => audioInputRef.current?.click()}
                >
                  <MicIcon className="size-4" />
                </Button>
                <Button
                  className="rounded-full bg-primary px-5 text-white hover:bg-primary/90"
                  onClick={handleSendMessage}
                  disabled={!draftMessage.trim() || !activeConversation}
                >
                  <SendIcon className="mr-2 size-4" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default memo(MessagesPage);
