import { getData, patchData, postData } from "@/api";
import {
  IEventChatGroup,
  IEventChatMessage,
  IEventChatParticipant,
} from "@/lib/event-chat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type BackendSenderRole = "vendor" | "scanner" | "attendee" | "system";
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
  metadata?: {
    eventName?: string;
    vendorName?: string;
    vendorAvatar?: string;
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
  email: string;
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
  return "attendee";
};

const mapConversation = (chat: BackendChatConversation): IEventChatGroup => {
  const eventName =
    chat.eventName || chat.name || chat.metadata?.eventName || "Turnupz Event";
  const vendorName = chat.metadata?.vendorName || "Turnupz Vendor";
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
    announcementMode: !!chat.announcementMode,
    muted: !!chat.muted,
    memberListVisibility: chat.memberListVisibility || "visible",
    pinnedMessageId: chat.pinnedMessageId,
    vendor: {
      id: `${chat.id}-vendor`,
      name: vendorName,
      role: "vendor",
      memberRole: "vendor",
      avatar: chat.metadata?.vendorAvatar,
    },
    members: [],
    messages: [],
  };
};

export const mapBackendMessage = (message: BackendChatMessage): IEventChatMessage => ({
  id: message.id,
  senderId: message.senderId || "system",
  senderName: message.senderName || "Turnupz",
  role: message.senderRole === "vendor" || message.senderRole === "system" ? "vendor" : "member",
  senderMemberRole: toParticipantRole(message.senderRole),
  body: message.body || "",
  createdAt: message.createdAt,
  kind: message.kind,
  assetUrl:
    message.assetUrl ||
    (typeof message.metadata?.bannerImageUrl === "string"
      ? message.metadata.bannerImageUrl
      : undefined) ||
    (typeof message.metadata?.imageUrl === "string"
      ? message.metadata.imageUrl
      : undefined),
  assetName:
    message.assetName ||
    (typeof message.metadata?.title === "string" ? message.metadata.title : undefined) ||
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
});

const getBackendMessageHref = (message: BackendChatMessage) =>
  message.href ||
  (typeof message.metadata?.href === "string" ? message.metadata.href : undefined);

export const mapBackendMember = (
  member: BackendChatMember,
): IEventChatParticipant => ({
  id: member.userId,
  name: member.name || member.username || member.email || "Turnupz Member",
  email: member.email,
  role: member.role === "vendor" ? "vendor" : "member",
  memberRole: toParticipantRole(member.role),
  avatar: member.profileImageUrl || undefined,
});

export const useEventChats = () =>
  useQuery({
    queryKey: ["event-chats"],
    queryFn: async () => {
      const response = await getData<BackendChatConversation[]>("/chats");
      return normalizeListResponse<BackendChatConversation>(response.data.data).map(
        mapConversation,
      );
    },
    retry: 0,
  });

export const useEventChatMessages = (groupId?: string, enabled = true) =>
  useQuery({
    queryKey: ["event-chat-messages", groupId],
    queryFn: async () => {
      const response = await getData<BackendChatMessage[]>(
        `/chats/${groupId}/messages`,
      );
      return normalizeListResponse<BackendChatMessage>(response.data.data).map(
        mapBackendMessage,
      );
    },
    enabled: !!groupId && enabled,
    retry: 0,
  });

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
      const response = await patchData<typeof settings, BackendChatConversation>(
        `/event-chat/${groupId}/settings`,
        settings,
      );
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
      assetUrl,
      assetName,
      href,
      metadata,
    }: {
      groupId: string;
      body: string;
      kind: BackendRequestMessageKind;
      assetUrl?: string;
      assetName?: string;
      href?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const response = await postData<
        {
          body: string;
          kind: BackendRequestMessageKind;
          assetUrl?: string;
          assetName?: string;
          href?: string;
          metadata?: Record<string, unknown>;
        },
        BackendChatMessage
      >(`/chats/${groupId}/messages`, {
        body,
        kind,
        assetUrl,
        assetName,
        href,
        metadata,
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
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await postData<FormData, { assetUrl: string }>(
        "/chats/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response.data.data.assetUrl;
    },
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
