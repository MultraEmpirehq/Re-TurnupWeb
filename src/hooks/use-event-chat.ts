import { getData, patchData, postData } from "@/api";
import {
  IChatSharedEvent,
  IEventChatGroup,
  IEventChatMessage,
  IEventChatParticipant,
} from "@/lib/event-chat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uploadAttachment } from "@/api/attachments";

type BackendSenderRole =
  | "vendor"
  | "scanner"
  | "attendee"
  | "system"
  // The Turnupz team, in a support chat.
  | "admin";
type BackendMessageKind = "text" | "event-update" | "image" | "file";
type BackendRequestMessageKind = "TEXT" | "IMAGE" | "FILE" | "EVENT_UPDATE";

export interface BackendChatConversation {
  id: string;
  eventId: string;
  eventName?: string;
  name?: string;
  conversationType?: "group" | "private";
  announcementMode?: boolean;
  memberListVisibility?: "visible" | "private";
  pinnedMessageId?: string;
  muted?: boolean;
  lastActivityAt?: string;
  createdAt?: string;
  preview?: string;
  /** Messages from others since this person last opened the chat. */
  unreadCount?: number;
  type?: "EVENT_GROUP" | "DIRECT" | "SUPPORT" | "PERSON";
  status?: "ACTIVE" | "ARCHIVED";
  title?: string;
  memberCount?: number;
  eventImage?: string;
  eventDate?: string;
  eventTimezone?: string;
  otherLastReadAt?: string;
  person?: { id: string; username: string | null; image: string | null } | null;
  metadata?: {
    eventName?: string;
    vendorName?: string;
    vendorAvatar?: string;
  };
  /** The organiser who owns the conversation. */
  vendor?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
  };
}

export interface BackendChatMessage {
  id: string;
  groupId: string;
  senderId?: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: BackendSenderRole;
  body: string;
  kind: BackendMessageKind;
  assetUrl?: string;
  attachmentDetails?: { id: string | null; url: string; type: string } | null;
  assetName?: string;
  href?: string;
  reactions?: Array<{ reaction: string; count: number }>;
  hiddenByVendor?: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface BackendChatMember {
  userId: string;
  name: string;
  username?: string;
  role: "vendor" | "scanner" | "attendee";
  profileImageUrl: string | null;
  muted: boolean;
}

const normalizeListResponse = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: T[] }).data;
  }
  return [];
};

const toParticipantRole = (
  role?: BackendSenderRole | BackendChatMember["role"],
): IEventChatParticipant["memberRole"] => {
  if (role === "vendor") return "vendor";
  if (role === "scanner") return "scanner";
  if (role === "admin") return "team";
  return "attendee";
};

const mapConversation = (chat: BackendChatConversation): IEventChatGroup => {
  const eventName =
    chat.eventName || chat.name || chat.metadata?.eventName || "Turnupz Event";
  const ownerName = [chat.vendor?.firstName, chat.vendor?.lastName]
    .filter(Boolean)
    .join(" ");
  const vendorName =
    chat.metadata?.vendorName ||
    ownerName ||
    chat.vendor?.username ||
    "Turnupz Vendor";
  const now = new Date().toISOString();

  return {
    id: chat.id,
    eventId: chat.eventId,
    eventName,
    status: "active",
    createdAt: chat.createdAt || now,
    lastActivityAt: chat.lastActivityAt || chat.createdAt || now,
    preview: chat.preview || `Community chat for ${eventName}.`,
    conversationType: chat.conversationType || "group",
    isSupport: chat.type === "SUPPORT",
    announcementMode: !!chat.announcementMode,
    muted: !!chat.muted,
    unreadCount: chat.unreadCount ?? 0,
    chatKind: chat.type,
    title: chat.title,
    isClosed: chat.status === "ARCHIVED",
    eventImage: chat.eventImage,
    eventDate: chat.eventDate,
    eventTimezone: chat.eventTimezone,
    memberCount: chat.memberCount,
    otherLastReadAt: chat.otherLastReadAt,
    person: chat.person ?? null,
    memberListVisibility: chat.memberListVisibility || "visible",
    pinnedMessageId: chat.pinnedMessageId,
    vendor: {
      // The real owner, so the page can tell whether the viewer is the organiser.
      id: chat.vendor?.id ?? `${chat.id}-vendor`,
      name: vendorName,
      role: "vendor",
      memberRole: "vendor",
      avatar: chat.metadata?.vendorAvatar,
    },
    members: [],
    messages: [],
  };
};

export const mapBackendMessage = (
  message: BackendChatMessage,
): IEventChatMessage => ({
  id: message.id,
  senderId: message.senderId || "system",
  senderName: message.senderName || "Turnupz",
  role:
    message.senderRole === "vendor" || message.senderRole === "system"
      ? "vendor"
      : "member",
  senderMemberRole: toParticipantRole(message.senderRole),
  body: message.body || "",
  createdAt: message.createdAt,
  kind: message.kind,
  assetUrl:
    message.attachmentDetails?.url ||
    message.assetUrl ||
    (typeof message.metadata?.bannerImageUrl === "string"
      ? message.metadata.bannerImageUrl
      : undefined) ||
    (typeof message.metadata?.imageUrl === "string"
      ? message.metadata.imageUrl
      : undefined),
  assetName:
    message.assetName ||
    (typeof message.metadata?.title === "string"
      ? message.metadata.title
      : undefined) ||
    (typeof message.metadata?.eventName === "string"
      ? message.metadata.eventName
      : undefined),
  href: getBackendMessageHref(message),
  senderAvatar: message.senderAvatar,
  reactions: (message.reactions || []).map((reaction) => ({
    emoji: reaction.reaction,
    count: reaction.count,
    reactedBy: [],
  })),
  hiddenByVendor: !!message.hiddenByVendor,
  sharedEvent: isSharedEvent(message.metadata?.sharedEvent)
    ? message.metadata.sharedEvent
    : undefined,
});

const isSharedEvent = (value: unknown): value is IChatSharedEvent =>
  !!value &&
  typeof value === "object" &&
  typeof (value as IChatSharedEvent).id === "string" &&
  typeof (value as IChatSharedEvent).name === "string";

const getBackendMessageHref = (message: BackendChatMessage) =>
  message.href ||
  (typeof message.metadata?.href === "string"
    ? message.metadata.href
    : undefined);

export const mapBackendMember = (
  member: BackendChatMember,
): IEventChatParticipant => ({
  id: member.userId,
  name: member.name || (member.username ? `@${member.username}` : "Turnupz Member"),
  username: member.username,
  role: member.role === "vendor" ? "vendor" : "member",
  memberRole: toParticipantRole(member.role),
  avatar: member.profileImageUrl || undefined,
});

const fetchEventChats = async () => {
  const response = await getData<BackendChatConversation[]>("/chats");
  return normalizeListResponse<BackendChatConversation>(response.data.data).map(
    mapConversation,
  );
};

export const useEventChats = () =>
  useQuery({
    queryKey: ["event-chats"],
    queryFn: fetchEventChats,
    retry: 0,
    // New chats and unread counts turn up without a reload.
    refetchInterval: 30_000,
  });

/** Unread messages across the chats they haven't muted, for the nav badge. */
export const useUnreadChatCount = (enabled = true) =>
  useQuery({
    queryKey: ["event-chats"],
    queryFn: fetchEventChats,
    select: (groups) =>
      groups.reduce(
        (sum, group) => sum + (group.muted ? 0 : (group.unreadCount ?? 0)),
        0,
      ),
    enabled,
    retry: 0,
    refetchInterval: 60_000,
  }).data ?? 0;

export const useEventChatMessages = (groupId?: string, enabled = true) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["event-chat-messages", groupId],
    queryFn: async () => {
      const response = await getData<BackendChatMessage[]>(
        `/chats/${groupId}/messages`,
      );
      // Opening the chat marks it read on the server; clear its badge here too.
      queryClient.setQueryData<IEventChatGroup[]>(["event-chats"], (groups) =>
        groups?.map((group) =>
          group.id === groupId && group.unreadCount
            ? { ...group, unreadCount: 0 }
            : group,
        ),
      );
      return normalizeListResponse<BackendChatMessage>(response.data.data).map(
        mapBackendMessage,
      );
    },
    enabled: !!groupId && enabled,
    retry: 0,
    // The open chat checks for new messages while it's on screen.
    refetchInterval: 15_000,
  });
};

export const useEventChatMembers = (eventId?: string, enabled = true) =>
  useQuery({
    queryKey: ["event-chat-members", eventId],
    queryFn: async () => {
      const response = await getData<BackendChatMember[]>(
        `/event/${eventId}/chat/members`,
      );
      return normalizeListResponse<BackendChatMember>(response.data.data).map(
        mapBackendMember,
      );
    },
    enabled: !!eventId && enabled,
    retry: 0,
  });

export const useUpdateEventChatSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      settings,
    }: {
      groupId: string;
      settings: Partial<
        Pick<
          IEventChatGroup,
          "announcementMode" | "memberListVisibility" | "pinnedMessageId"
        > & { muted?: boolean }
      >;
    }) => {
      const response = await patchData<
        typeof settings,
        BackendChatConversation
      >(`/event-chat/${groupId}/settings`, settings);
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-chats"] });
      queryClient.invalidateQueries({
        queryKey: ["event-chat-messages", variables.groupId],
      });
    },
  });
};

/** Mutes or unmutes a chat for the signed-in member only. */
export const useMuteEventChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      muted,
    }: {
      groupId: string;
      muted: boolean;
    }) => {
      await patchData<{ muted: boolean }, { muted: boolean }>(
        `/chats/${groupId}/mute`,
        { muted },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-chats"] });
    },
  });
};

export const useReactToEventChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      messageId,
      reaction,
    }: {
      groupId: string;
      messageId: string;
      reaction: string;
    }) => {
      await postData<{ reaction: string }, unknown>(
        `/event-chat/${groupId}/messages/${messageId}/reactions`,
        { reaction },
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["event-chat-messages", variables.groupId],
      });
    },
  });
};

export const useHideEventChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      messageId,
    }: {
      groupId: string;
      messageId: string;
    }) => {
      await patchData<undefined, unknown>(
        `/event-chat/${groupId}/messages/${messageId}/hide`,
        undefined,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["event-chat-messages", variables.groupId],
      });
    },
  });
};

export const useSendEventChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      body,
      kind,
      attachmentId,
      assetName,
      href,
      metadata,
      sharedEventId,
    }: {
      groupId: string;
      body: string;
      kind: BackendRequestMessageKind;
      attachmentId?: string;
      assetName?: string;
      href?: string;
      metadata?: Record<string, unknown>;
      /** An event to show as a card with the message. */
      sharedEventId?: string;
    }) => {
      const response = await postData<
        {
          body: string;
          kind: BackendRequestMessageKind;
          attachmentId?: string;
          assetName?: string;
          href?: string;
          metadata?: Record<string, unknown>;
          sharedEventId?: string;
        },
        BackendChatMessage
      >(`/chats/${groupId}/messages`, {
        body,
        kind,
        attachmentId,
        assetName,
        href,
        metadata,
        sharedEventId,
      });
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["event-chat-messages", variables.groupId],
      });
      queryClient.invalidateQueries({ queryKey: ["event-chats"] });
    },
  });
};

export const useUploadEventChatAsset = () =>
  useMutation({
    mutationFn: (file: File) => uploadAttachment(file, "CHAT_ASSET"),
  });

export const useReportEventChatMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      memberId,
    }: {
      groupId: string;
      memberId: string;
    }) => {
      await postData<{ memberId: string }, unknown>(
        `/event-chat/${groupId}/members/report`,
        { memberId },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-chats"] });
      queryClient.invalidateQueries({ queryKey: ["event-chat-members"] });
    },
  });
};

export const useBlockEventChatMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      memberId,
    }: {
      groupId: string;
      memberId: string;
    }) => {
      await postData<{ memberId: string }, unknown>(
        `/event-chat/${groupId}/members/block`,
        { memberId },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-chats"] });
      queryClient.invalidateQueries({ queryKey: ["event-chat-members"] });
    },
  });
};
