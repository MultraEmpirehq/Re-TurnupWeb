"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  useEventChatMessages,
  useEventChats,
  useHideEventChatMessage,
  useReactToEventChatMessage,
  useSendEventChatMessage,
  useUpdateEventChatSettings,
  useUploadEventChatAsset,
} from "@/hooks/use-event-chat";
import {
  IEventChatMessage,
  IEventChatGroup,
  appendEventChatMessage,
  getEventChatGroups,
  hideEventChatMessage,
  subscribeToEventChatGroups,
  toggleEventChatReaction,
  updateEventChatGroupSettings,
} from "@/lib/event-chat";
import { cn } from "@/lib/utils";
import useUserStore from "@/stores/user-store";
import {
  BellIcon,
  BellOffIcon,
  EllipsisIcon,
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  MegaphoneIcon,
  PaperclipIcon,
  PinIcon,
  PinOffIcon,
  SearchIcon,
  SendIcon,
  SmileIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import CustomImageComponent from "@/components/ui/custom-image.component";

type TChatStatus = "all" | "groups" | "private";

const statusTabs: Array<{ label: string; value: TChatStatus }> = [
  { label: "All", value: "all" },
  { label: "Groups", value: "groups" },
  { label: "Private", value: "private" },
];

const quickEmojis = ["🔥", "🎉", "🙌", "❤️", "👏", "✅", "👀", "✨"];

const reactionEmojis = ["\uD83D\uDD25", "\uD83D\uDE4C", "\u2764\uFE0F"];

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

const getInitials = (value?: string) => {
  const initials = (value || "Turnupz User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
  return initials || "TU";
};

const ChatAvatar = ({
  name,
  avatar,
  className,
  fallbackClassName,
}: {
  name?: string;
  avatar?: string;
  className?: string;
  fallbackClassName?: string;
}) => (
  <Avatar className={className}>
    {avatar ? <AvatarImage src={avatar} alt={name || "Chat member"} /> : null}
    <AvatarFallback className={fallbackClassName}>{getInitials(name)}</AvatarFallback>
  </Avatar>
);

const getMessageHrefLabel = (message: IEventChatMessage) =>
  message.href?.includes("/blog/") ? "Read blog post" : "Open event page";

const getMessageHref = (
  message: IEventChatMessage,
  conversation?: IEventChatGroup,
) => {
  if (message.href) return message.href;
  const bodyLink = message.body.match(/\/app\/events\/[^\s]+\/blog\/[^\s]+/)?.[0];
  if (bodyLink) return bodyLink;
  if (message.kind === "event-update" && conversation?.eventId) {
    return `/explore/event/${conversation.eventId}`;
  }
  return undefined;
};

const getEmptyConversationCopy = (selectedStatus: TChatStatus) =>
  selectedStatus === "private"
    ? "Private conversations will appear here when you start or receive a direct chat."
    : "Publish an event to automatically create its group chat here.";

const getEmptyPanelCopy = (selectedStatus: TChatStatus) =>
  selectedStatus === "private"
    ? "Select a private conversation when one is available. Direct chats are separate from event group communities."
    : "Publish an event to create its chat group automatically. When attendees book, register, pay, or open an external ticket link, they can be added to the group flow here.";

const getCleanMessageBody = (message: IEventChatMessage) =>
  message.body
    .replace(/\s*Read it at\s+\/app\/events\/\S+/gi, "")
    .replace(/\/app\/events\/\S+/g, "")
    .trim();

const MessagesPage = () => {
  const [groups, setGroups] = React.useState<IEventChatGroup[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<TChatStatus>("groups");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGroupOptions, setShowGroupOptions] = useState(false);
  const attachmentInputRef = React.useRef<HTMLInputElement | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement | null>(null);
  const userDetails = useUserStore((state) => state.userDetails);
  const eventChatsQuery = useEventChats();
  const updateSettingsMutation = useUpdateEventChatSettings();
  const reactToMessageMutation = useReactToEventChatMessage();
  const hideMessageMutation = useHideEventChatMessage();
  const sendMessageMutation = useSendEventChatMessage();
  const uploadAssetMutation = useUploadEventChatAsset();

  React.useEffect(() => {
    const sync = () => setGroups(getEventChatGroups());
    sync();
    return subscribeToEventChatGroups(sync);
  }, []);

  const backendGroups = eventChatsQuery.data ?? [];
  const hasBackendGroups = backendGroups.length > 0;
  const availableGroups = hasBackendGroups ? backendGroups : groups;

  const filteredConversations = useMemo(() => {
    if (selectedStatus === "all") return availableGroups;
    return availableGroups.filter(
      (conversation) =>
        selectedStatus === "groups"
          ? (conversation.conversationType ?? "group") === "group"
          : conversation.conversationType === "private",
    );
  }, [availableGroups, selectedStatus]);

  const selectedConversation =
    filteredConversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) ?? filteredConversations[0];

  const selectedConversationIsBackend =
    !!selectedConversation &&
    backendGroups.some((conversation) => conversation.id === selectedConversation.id);
  const messagesQuery = useEventChatMessages(
    selectedConversation?.id,
    selectedConversationIsBackend,
  );
  const activeConversation = useMemo(
    () =>
      selectedConversation && selectedConversationIsBackend && messagesQuery.data
        ? {
            ...selectedConversation,
            messages: messagesQuery.data,
          }
        : selectedConversation,
    [messagesQuery.data, selectedConversation, selectedConversationIsBackend],
  );

  const sender = useMemo(
    () => ({
      id: userDetails?.id || activeConversation?.vendor.id || "turnupz-vendor",
      name:
        userDetails?.name ||
        [userDetails?.firstName, userDetails?.lastName].filter(Boolean).join(" ") ||
        activeConversation?.vendor.name ||
        "Turnupz Vendor",
      role: "vendor" as const,
      avatar: userDetails?.avatar,
    }),
    [activeConversation?.vendor.id, activeConversation?.vendor.name, userDetails],
  );

  const isVendorSender = sender.role === "vendor";
  const defaultPinnedMessageId = activeConversation
    ? `chat-message-${activeConversation.eventId}-launch`
    : "";
  const activePinnedMessageId =
    activeConversation?.pinnedMessageId === "none"
      ? ""
      : activeConversation?.pinnedMessageId || defaultPinnedMessageId;
  const pinnedMessage = activeConversation?.messages.find(
    (message) => message.id === activePinnedMessageId && !message.hiddenByVendor,
  );
  const visibleMessages = (activeConversation?.messages ?? []).filter(
    (message) => !message.hiddenByVendor,
  );
  const canType =
    !!activeConversation &&
    (!activeConversation.announcementMode || isVendorSender);

  const handleSendMessage = React.useCallback(() => {
    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage || !canType || !activeConversation) return;

    if (selectedConversationIsBackend) {
      sendMessageMutation.mutate({
        groupId: activeConversation.id,
        body: trimmedMessage,
        kind: "TEXT",
      });
    } else {
      appendEventChatMessage({
        eventId: activeConversation.eventId,
        sender,
        body: trimmedMessage,
        kind: "text",
      });
    }
    setDraftMessage("");
  }, [
    activeConversation,
    canType,
    draftMessage,
    selectedConversationIsBackend,
    sendMessageMutation,
    sender,
  ]);

  const handleUpload = React.useCallback(
    async (
      file: File | null | undefined,
      kind: "image" | "file",
      bodyPrefix: string,
    ) => {
      if (!file || !activeConversation) return;

      if (selectedConversationIsBackend) {
        const assetUrl = await uploadAssetMutation.mutateAsync(file);
        await sendMessageMutation.mutateAsync({
          groupId: activeConversation.id,
          body: `${bodyPrefix}${file.name}`,
          kind: kind === "image" ? "IMAGE" : "FILE",
          assetUrl,
          assetName: file.name,
        });
      } else {
        const assetUrl = URL.createObjectURL(file);
        appendEventChatMessage({
          eventId: activeConversation.eventId,
          sender,
          body: `${bodyPrefix}${file.name}`,
          kind,
          assetUrl,
          assetName: file.name,
        });
      }
    },
    [
      activeConversation,
      selectedConversationIsBackend,
      sendMessageMutation,
      sender,
      uploadAssetMutation,
    ],
  );

  const handleToggleSetting = React.useCallback(
    (
      setting: "announcementMode" | "muted" | "memberListVisibility",
      value: boolean | "visible" | "private",
    ) => {
      if (!activeConversation) return;
      if (selectedConversationIsBackend) {
        updateSettingsMutation.mutate({
          groupId: activeConversation.id,
          settings: {
            [setting]: value,
          },
        });
      } else {
        updateEventChatGroupSettings(activeConversation.id, {
          [setting]: value,
        });
      }
    },
    [activeConversation, selectedConversationIsBackend, updateSettingsMutation],
  );

  const handleReact = React.useCallback(
    (messageId: string, emoji: string) => {
      if (!activeConversation) return;
      if (selectedConversationIsBackend) {
        reactToMessageMutation.mutate({
          groupId: activeConversation.id,
          messageId,
          reaction: emoji,
        });
      } else {
        toggleEventChatReaction({
          groupId: activeConversation.id,
          messageId,
          emoji,
          userId: sender.id,
        });
      }
    },
    [
      activeConversation,
      reactToMessageMutation,
      selectedConversationIsBackend,
      sender.id,
    ],
  );

  const handleHideMessage = React.useCallback(
    (messageId: string) => {
      if (!activeConversation) return;
      if (selectedConversationIsBackend) {
        hideMessageMutation.mutate({
          groupId: activeConversation.id,
          messageId,
        });
      } else {
        hideEventChatMessage(activeConversation.id, messageId);
      }
    },
    [activeConversation, hideMessageMutation, selectedConversationIsBackend],
  );

  const handleTogglePin = React.useCallback(
    (messageId: string) => {
      if (!activeConversation) return;
      const isPinned = activePinnedMessageId === messageId;
      const pinnedMessageId = isPinned
        ? messageId === defaultPinnedMessageId
          ? "none"
          : defaultPinnedMessageId
        : messageId;
      if (selectedConversationIsBackend) {
        updateSettingsMutation.mutate({
          groupId: activeConversation.id,
          settings: { pinnedMessageId },
        });
      } else {
        updateEventChatGroupSettings(activeConversation.id, {
          pinnedMessageId,
        });
      }
    },
    [
      activeConversation,
      activePinnedMessageId,
      defaultPinnedMessageId,
      selectedConversationIsBackend,
      updateSettingsMutation,
    ],
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
                {getEmptyConversationCopy(selectedStatus)}
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
                  <ChatAvatar
                    name={conversation.eventName}
                    avatar={conversation.vendor.avatar}
                    className="mt-1 size-9 border border-secondary-100 bg-secondary-800 text-white"
                    fallbackClassName="bg-secondary-800 text-xs font-semibold text-white"
                  />

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
              <ChatAvatar
                name={activeConversation?.eventName || "Turnupz Event Circle"}
                avatar={activeConversation?.vendor.avatar}
                className="size-10 border border-secondary-100 bg-secondary-800"
                fallbackClassName="bg-secondary-800 text-sm font-semibold text-white"
              />
              <div>
                <p className="text-sm font-semibold text-secondary-950">
                  {activeConversation?.eventName
                    ? `${activeConversation.eventName} Community`
                    : "Turnupz Event Circle"}
                </p>
                {activeConversation ? (
                  <Link
                    href={`/app/messages/${activeConversation.id}/members`}
                    className="text-xs font-medium text-secondary-400 underline-offset-4 hover:text-primary hover:underline"
                  >
                    {activeConversation.members.length} members
                  </Link>
                ) : (
                  <p className="text-xs text-secondary-400">Active</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-secondary-500"
                  onClick={() => setShowGroupOptions((current) => !current)}
                  disabled={!activeConversation}
                  aria-label="More group options"
                >
                  <EllipsisIcon className="size-5" />
                </Button>
                {activeConversation && showGroupOptions ? (
                  <div className="absolute right-0 top-12 z-20 w-72 overflow-hidden rounded-[1.1rem] border border-secondary-100 bg-white p-2 text-sm shadow-[0_20px_50px_-28px_rgba(15,35,95,0.45)]">
                    <Link
                      href={`/app/messages/${activeConversation.id}/members`}
                      className="flex items-center rounded-xl px-3 py-2.5 text-secondary-600 transition-colors hover:bg-secondary-50"
                      onClick={() => setShowGroupOptions(false)}
                    >
                      <UsersIcon className="mr-3 size-4 text-primary" />
                      View members and roles
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-secondary-600 transition-colors hover:bg-secondary-50"
                      onClick={() => {
                        handleToggleSetting(
                          "announcementMode",
                          !activeConversation.announcementMode,
                        );
                        setShowGroupOptions(false);
                      }}
                    >
                      <MegaphoneIcon className="mr-3 size-4 text-primary" />
                      {activeConversation.announcementMode
                        ? "Turn off announcement mode"
                        : "Turn on announcement mode"}
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-secondary-600 transition-colors hover:bg-secondary-50"
                      onClick={() => {
                        handleToggleSetting("muted", !activeConversation.muted);
                        setShowGroupOptions(false);
                      }}
                    >
                      {activeConversation.muted ? (
                        <BellOffIcon className="mr-3 size-4 text-primary" />
                      ) : (
                        <BellIcon className="mr-3 size-4 text-primary" />
                      )}
                      {activeConversation.muted ? "Unmute this chat" : "Mute this chat"}
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-secondary-600 transition-colors hover:bg-secondary-50"
                      onClick={() => {
                        handleToggleSetting(
                          "memberListVisibility",
                          activeConversation.memberListVisibility === "private"
                            ? "visible"
                            : "private",
                        );
                        setShowGroupOptions(false);
                      }}
                    >
                      {activeConversation.memberListVisibility === "private" ? (
                        <EyeOffIcon className="mr-3 size-4 text-primary" />
                      ) : (
                        <EyeIcon className="mr-3 size-4 text-primary" />
                      )}
                      {activeConversation.memberListVisibility === "private"
                        ? "Show member list"
                        : "Hide member list"}
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-secondary-600 transition-colors hover:bg-secondary-50"
                      onClick={() => {
                        if (selectedConversationIsBackend) {
                          updateSettingsMutation.mutate({
                            groupId: activeConversation.id,
                            settings: { pinnedMessageId: defaultPinnedMessageId },
                          });
                        } else {
                          updateEventChatGroupSettings(activeConversation.id, {
                            pinnedMessageId: defaultPinnedMessageId,
                          });
                        }
                        setShowGroupOptions(false);
                      }}
                    >
                      <PinIcon className="mr-3 size-4 text-primary" />
                      Restore default event pin
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-secondary-600 transition-colors hover:bg-secondary-50"
                      onClick={() => {
                        if (selectedConversationIsBackend) {
                          updateSettingsMutation.mutate({
                            groupId: activeConversation.id,
                            settings: { pinnedMessageId: "none" },
                          });
                        } else {
                          updateEventChatGroupSettings(activeConversation.id, {
                            pinnedMessageId: "none",
                          });
                        }
                        setShowGroupOptions(false);
                      }}
                    >
                      <PinOffIcon className="mr-3 size-4 text-primary" />
                      Clear pinned post
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-5 bg-secondary-50/60 px-5 py-5">
            {activeConversation?.announcementMode ? (
              <div className="rounded-[1.1rem] border border-primary/20 bg-primary/10 px-4 py-3 text-xs font-medium text-primary">
                Announcement mode is on. Members can react to updates, but only the
                vendor can post new messages.
              </div>
            ) : null}
            {activeConversation?.muted ? (
              <div className="rounded-[1.1rem] border border-secondary-100 bg-white px-4 py-3 text-xs font-medium text-secondary-500">
                Notifications are muted for this group on this device.
              </div>
            ) : null}
            <div className="flex justify-center">
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-secondary-400 shadow-sm">
                {activeConversation
                  ? formatTimeLabel(activeConversation.lastActivityAt)
                  : "Today"}
              </span>
            </div>

            {activeConversation && pinnedMessage ? (
              <div className="rounded-[1.35rem] border border-primary/20 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                    Pinned Event Post
                  </span>
                  <span className="text-[11px] text-secondary-400">
                    {formatMessageTime(pinnedMessage.createdAt)}
                  </span>
                </div>
                <Link
                  href={getMessageHref(pinnedMessage, activeConversation) || "#"}
                  className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden rounded-[1rem] bg-[linear-gradient(135deg,#0f2f4f,#4cb9ec)]">
                    {pinnedMessage.assetUrl ? (
                      <CustomImageComponent
                        src={pinnedMessage.assetUrl}
                        alt={pinnedMessage.assetName || activeConversation.eventName}
                        fill
                        className="size-full"
                        imageClassName="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 py-1">
                    <p className="truncate text-sm font-semibold text-secondary-950">
                      {pinnedMessage.assetName || activeConversation.eventName}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-secondary-500">
                      {getCleanMessageBody(pinnedMessage)}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-primary">
                      Open event page
                    </p>
                  </div>
                </Link>
              </div>
            ) : null}

            {visibleMessages.map((message) => {
                  const messageHref = getMessageHref(message, activeConversation);
                  const messageForLabel = { ...message, href: messageHref };
                  const cleanMessageBody = getCleanMessageBody(message);

                  return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "vendor" ? "justify-end" : "justify-start",
                )}
              >
                {message.role !== "vendor" && (
                  <ChatAvatar
                    name={message.senderName}
                    avatar={message.senderAvatar}
                    className="mt-1 size-9 border border-secondary-100 bg-secondary-800"
                    fallbackClassName="bg-secondary-800 text-xs font-semibold text-white"
                  />
                )}

                <div
                  className={cn(
                    "max-w-[680px]",
                    message.role === "vendor" ? "items-end" : "items-start",
                  )}
                >
                  {message.kind === "event-update" ? (
                    <div className="w-full max-w-[520px] rounded-[1.6rem] border border-secondary-100 bg-white p-4 shadow-sm">
                      <MessageLink href={messageHref}>
                        <div
                          className="relative aspect-[16/8] overflow-hidden rounded-[1.2rem] bg-[linear-gradient(135deg,#0f2f4f,#4cb9ec)]"
                          aria-label={
                            messageHref ? getMessageHrefLabel(messageForLabel) : undefined
                          }
                        >
                          {message.assetUrl ? (
                            <CustomImageComponent
                              src={message.assetUrl}
                              alt={message.assetName || activeConversation?.eventName || "Event update"}
                              fill
                              className="size-full"
                              imageClassName="object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-end p-5 text-white">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
                                  Turnupz Event Update
                                </p>
                                <p className="mt-2 text-2xl font-black uppercase">
                                  {message.assetName ||
                                    activeConversation?.eventName ||
                                    "Event Community"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </MessageLink>

                      <div className="space-y-3 px-1 pt-4">
                        {message.assetName ? (
                          <h3 className="text-sm font-semibold text-secondary-950">
                            {message.assetName}
                          </h3>
                        ) : null}
                        <p className="whitespace-pre-line text-sm leading-6 text-secondary-600">
                          {cleanMessageBody}
                        </p>
                        {messageHref ? (
                          <Link
                            href={messageHref}
                            className="inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline"
                          >
                            {getMessageHrefLabel(messageForLabel)}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ) : message.kind === "image" && message.assetUrl ? (
                    <div className="max-w-[360px] rounded-[1.2rem] border border-secondary-100 bg-white p-3 shadow-sm">
                      <MessageLink href={messageHref}>
                        <div className="relative aspect-square overflow-hidden rounded-[1rem] bg-secondary-50">
                          <CustomImageComponent
                            src={message.assetUrl}
                            alt={message.assetName || "Chat upload"}
                            fill
                            className="size-full"
                            imageClassName="object-cover"
                          />
                        </div>
                      </MessageLink>
                      <p className="mt-3 text-sm leading-6 text-secondary-700">
                        {message.body}
                      </p>
                      {messageHref ? (
                        <Link
                          href={messageHref}
                          className="mt-2 inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline"
                        >
                          Open
                        </Link>
                      ) : null}
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
                    <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary-400">
                      {message.role === "vendor"
                        ? "Vendor"
                        : message.senderMemberRole === "scanner"
                          ? "Scanner"
                          : "Attendee"}
                    </span>
                    <span>{formatMessageTime(message.createdAt)}</span>
                  </div>

                  <div
                    className={cn(
                      "mt-2 flex flex-wrap items-center gap-2",
                      message.role === "vendor" ? "justify-end" : "justify-start",
                    )}
                  >
                    {reactionEmojis.map((emoji) => {
                      const reaction = message.reactions?.find(
                        (item) => item.emoji === emoji,
                      );
                      const hasReacted = !!reaction?.reactedBy.includes(sender.id);
                      return (
                        <button
                          key={`${message.id}-${emoji}`}
                          type="button"
                          onClick={() => handleReact(message.id, emoji)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs transition-colors",
                            hasReacted
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-secondary-100 bg-white text-secondary-500 hover:border-primary/30 hover:text-primary",
                          )}
                        >
                          {emoji} {reaction?.count ? reaction.count : ""}
                        </button>
                      );
                    })}
                    {isVendorSender ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(message.id)}
                          className={cn(
                            "inline-flex items-center rounded-full border bg-white px-2.5 py-1 text-xs transition-colors",
                            activePinnedMessageId === message.id
                              ? "border-primary/30 text-primary hover:bg-primary/10"
                              : "border-secondary-100 text-secondary-400 hover:border-primary/30 hover:text-primary",
                          )}
                        >
                          {activePinnedMessageId === message.id ? (
                            <PinOffIcon className="mr-1 size-3" />
                          ) : (
                            <PinIcon className="mr-1 size-3" />
                          )}
                          {activePinnedMessageId === message.id ? "Unpin" : "Pin"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHideMessage(message.id)}
                          className="inline-flex items-center rounded-full border border-secondary-100 bg-white px-2.5 py-1 text-xs text-secondary-400 transition-colors hover:border-danger/30 hover:text-danger"
                        >
                          <Trash2Icon className="mr-1 size-3" />
                          Hide
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {message.role === "vendor" && message.kind !== "event-update" && (
                  <ChatAvatar
                    name={message.senderName}
                    avatar={message.senderAvatar}
                    className="mt-1 size-9 border border-secondary-100 bg-secondary-100"
                    fallbackClassName="bg-secondary-100 text-xs font-semibold text-secondary-800"
                  />
                )}
              </div>
              );
            })}

            {!activeConversation && (
              <div className="rounded-[1.4rem] border border-secondary-100 bg-white px-5 py-8 text-sm text-secondary-500">
                {getEmptyPanelCopy(selectedStatus)}
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
                  placeholder={
                    activeConversation
                      ? activeConversation.announcementMode && !isVendorSender
                        ? "Announcement mode is on. You can react, but cannot type."
                        : "Type a message to your event community..."
                      : "Select a conversation to send a message..."
                  }
                  disabled={!canType}
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
                  onClick={() => setShowEmojiPicker((current) => !current)}
                >
                  <SmileIcon className="size-4" />
                </Button>
                <Button
                  className="rounded-full bg-primary px-5 text-white hover:bg-primary/90"
                  onClick={handleSendMessage}
                  disabled={!draftMessage.trim() || !canType}
                >
                  <SendIcon className="mr-2 size-4" />
                  Send
                </Button>
              </div>
            </div>
            {showEmojiPicker ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setDraftMessage((current) => `${current}${emoji}`);
                      setShowEmojiPicker(false);
                    }}
                    className="flex size-9 items-center justify-center rounded-full border border-secondary-100 bg-white text-lg transition-colors hover:bg-secondary-50"
                    aria-label={`Add ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

const MessageLink = ({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) => {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} className="block transition-opacity hover:opacity-90">
      {children}
    </Link>
  );
};

export default memo(MessagesPage);
