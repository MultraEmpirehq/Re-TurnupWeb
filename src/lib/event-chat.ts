import { IEventDetailsType } from "@/lib/types";
import { TUserDetails } from "@/stores/user-store";

const EVENT_CHAT_GROUPS_KEY = "turnup-event-chat-groups";
const EVENT_CHAT_GROUPS_UPDATED = "turnup:event-chat-groups-updated";

export interface IEventChatParticipant {
  id: string;
  name: string;
  role: "vendor" | "member";
  memberRole?: "vendor" | "scanner" | "attendee";
  email?: string;
  avatar?: string;
  isBlocked?: boolean;
  reportedAt?: string;
}

export interface IEventChatReaction {
  emoji: string;
  count: number;
  reactedBy: string[];
}

export interface IEventChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  role: "vendor" | "member";
  body: string;
  createdAt: string;
  kind?: "text" | "event-update" | "image" | "file";
  assetUrl?: string;
  assetName?: string;
  href?: string;
  senderAvatar?: string;
  senderMemberRole?: IEventChatParticipant["memberRole"];
  reactions?: IEventChatReaction[];
  hiddenByVendor?: boolean;
  reportedBy?: string[];
}

export interface IEventChatGroup {
  id: string;
  eventId: string;
  eventName: string;
  status: "active" | "quiet";
  createdAt: string;
  lastActivityAt: string;
  preview: string;
  conversationType?: "group" | "private";
  announcementMode?: boolean;
  muted?: boolean;
  memberListVisibility?: "visible" | "private";
  pinnedMessageId?: string;
  vendor: IEventChatParticipant;
  members: IEventChatParticipant[];
  messages: IEventChatMessage[];
}

const canUseStorage = () => typeof window !== "undefined";

const readGroups = (): IEventChatGroup[] => {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(EVENT_CHAT_GROUPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IEventChatGroup[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGroups = (groups: IEventChatGroup[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(EVENT_CHAT_GROUPS_KEY, JSON.stringify(groups));
  window.dispatchEvent(new CustomEvent(EVENT_CHAT_GROUPS_UPDATED));
};

const getDefaultVendor = (): IEventChatParticipant => ({
  id: "turnupz-vendor",
  name: "Turnupz Vendor",
  role: "vendor",
  memberRole: "vendor",
});

const toVendorParticipant = (user?: TUserDetails | null): IEventChatParticipant => ({
  id: user?.id || "turnupz-vendor",
  name:
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Turnupz Vendor",
  role: "vendor",
  memberRole: "vendor",
  avatar: user?.avatar,
  email: user?.email,
});

const toMemberParticipant = (user?: TUserDetails | null): IEventChatParticipant | null => {
  if (!user?.id) return null;
  return {
    id: user.id,
    name:
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      "Turnupz Member",
    role: "member",
    memberRole: "attendee",
    email: user.email,
    avatar: user.avatar,
  };
};

const buildVendorLaunchMessage = (
  event: IEventDetailsType,
  vendor: IEventChatParticipant,
) => {
  const bannerImage =
    event.image || (event as IEventDetailsType & { bannerImage?: string }).bannerImage;

  return {
    id: `chat-message-${event.id}-launch`,
    senderId: vendor.id,
    senderName: vendor.name,
    role: "vendor" as const,
    kind: "event-update" as const,
    createdAt: new Date().toISOString(),
    assetUrl: bannerImage,
    assetName: event.name,
    href: `/explore/event/${event.id}`,
    senderAvatar: vendor.avatar,
    body: `Welcome to the ${event.name} community. This group is now open for event updates, access information, and attendee questions.`,
  };
};

export const getEventChatGroups = () => readGroups();

export const getEventChatGroupByEventId = (eventId: string) =>
  readGroups().find((group) => group.eventId === eventId) ?? null;

export const getEventChatGroupById = (id: string) =>
  readGroups().find((group) => group.id === id) ?? null;

export const ensureEventChatGroup = (
  event: IEventDetailsType,
  vendorUser?: TUserDetails | null,
) => {
  if (!canUseStorage() || !event?.id) return null;

  const groups = readGroups();
  const existingGroup = groups.find((group) => group.eventId === event.id);
  const vendor = toVendorParticipant(vendorUser);

  if (existingGroup) {
    const launchMessage = buildVendorLaunchMessage(event, vendor);
    const hasLaunchMessage = existingGroup.messages.some(
      (message) => message.id === launchMessage.id,
    );
    const messages = hasLaunchMessage
      ? existingGroup.messages.map((message) =>
          message.id === launchMessage.id
            ? {
                ...message,
                assetUrl: message.assetUrl || launchMessage.assetUrl,
                assetName: message.assetName || launchMessage.assetName,
                href: message.href || launchMessage.href,
                senderAvatar: message.senderAvatar || vendor.avatar,
              }
            : message,
        )
      : [launchMessage, ...existingGroup.messages];

    const updatedGroup: IEventChatGroup = {
      ...existingGroup,
      eventName: event.name,
      conversationType: "group",
      pinnedMessageId: existingGroup.pinnedMessageId || launchMessage.id,
      announcementMode: existingGroup.announcementMode ?? false,
      muted: existingGroup.muted ?? false,
      memberListVisibility: existingGroup.memberListVisibility ?? "visible",
      vendor,
      messages,
      preview:
        existingGroup.preview ||
        `Community chat for ${event.name} is now live on Turnupz.`,
    };
    writeGroups(
      groups.map((group) => (group.eventId === event.id ? updatedGroup : group)),
    );
    return updatedGroup;
  }

  const now = new Date().toISOString();
  const nextGroup: IEventChatGroup = {
    id: `event-chat-${event.id}`,
    eventId: event.id,
    eventName: event.name,
    status: "active",
    createdAt: now,
    lastActivityAt: now,
    preview: `Community chat for ${event.name} is now live on Turnupz.`,
    conversationType: "group",
    announcementMode: false,
    muted: false,
    memberListVisibility: "visible",
    pinnedMessageId: `chat-message-${event.id}-launch`,
    vendor: vendorUser?.id ? vendor : getDefaultVendor(),
    members: [],
    messages: [buildVendorLaunchMessage(event, vendorUser?.id ? vendor : getDefaultVendor())],
  };

  writeGroups([nextGroup, ...groups]);
  return nextGroup;
};

export const joinEventChatGroup = ({
  event,
  user,
  joinReason,
}: {
  event: IEventDetailsType;
  user?: TUserDetails | null;
  joinReason: "booked" | "registered" | "paid" | "external";
}) => {
  if (!canUseStorage() || !event?.id) return null;

  const member = toMemberParticipant(user);
  if (!member) return null;

  const groups = readGroups();
  const existingGroup =
    groups.find((group) => group.eventId === event.id) ??
    ensureEventChatGroup(event);

  if (!existingGroup) return null;

  const alreadyJoined = existingGroup.members.some(
    (participant) => participant.id === member.id,
  );

  const reasonText =
    joinReason === "registered"
      ? "registered for the event"
      : joinReason === "external"
        ? "opened the external ticket link"
        : joinReason === "paid"
          ? "paid for a ticket"
          : "booked a ticket";

  const nextGroup: IEventChatGroup = {
    ...existingGroup,
    status: "active",
    lastActivityAt: new Date().toISOString(),
    preview: alreadyJoined
      ? existingGroup.preview
      : `${member.name} ${reasonText} and joined the group.`,
    members: alreadyJoined
      ? existingGroup.members
      : [...existingGroup.members, member],
    messages: alreadyJoined
      ? existingGroup.messages
      : [
          ...existingGroup.messages,
          {
            id: `chat-message-${event.id}-${member.id}-${Date.now()}`,
            senderId: member.id,
            senderName: member.name,
            senderAvatar: member.avatar,
            role: "member",
            senderMemberRole: member.memberRole,
            createdAt: new Date().toISOString(),
            body: `Joined the group after ${reasonText}.`,
          },
        ],
  };

  writeGroups(
    groups.map((group) => (group.eventId === event.id ? nextGroup : group)),
  );
  return nextGroup;
};

export const subscribeToEventChatGroups = (callback: () => void) => {
  if (!canUseStorage()) return () => {};
  window.addEventListener(EVENT_CHAT_GROUPS_UPDATED, callback);
  return () => window.removeEventListener(EVENT_CHAT_GROUPS_UPDATED, callback);
};

export const appendEventChatMessage = ({
  eventId,
  sender,
  body,
  kind = "text",
  assetUrl,
  assetName,
  href,
}: {
  eventId: string;
  sender: IEventChatParticipant;
  body: string;
  kind?: IEventChatMessage["kind"];
  assetUrl?: string;
  assetName?: string;
  href?: string;
}) => {
  if (!canUseStorage() || !eventId) return null;

  const groups = readGroups();
  const existingGroup = groups.find((group) => group.eventId === eventId);
  if (!existingGroup) return null;

  const nextMessage: IEventChatMessage = {
    id: `chat-message-${eventId}-${Date.now()}`,
    senderId: sender.id,
    senderName: sender.name,
    role: sender.role,
    body,
    createdAt: new Date().toISOString(),
    kind,
    assetUrl,
    assetName,
    href,
    senderAvatar: sender.avatar,
    senderMemberRole: sender.memberRole,
  };

  const nextGroup: IEventChatGroup = {
    ...existingGroup,
    status: "active",
    lastActivityAt: nextMessage.createdAt,
    preview:
      kind === "image"
        ? `${sender.name} shared an image.`
        : kind === "file"
            ? `${sender.name} attached a file.`
            : body || existingGroup.preview,
    messages: [...existingGroup.messages, nextMessage],
  };

  writeGroups(
    groups.map((group) => (group.eventId === eventId ? nextGroup : group)),
  );
  return nextMessage;
};

const updateGroupById = (
  groupId: string,
  updater: (group: IEventChatGroup) => IEventChatGroup,
) => {
  if (!canUseStorage() || !groupId) return null;
  const groups = readGroups();
  const existingGroup = groups.find((group) => group.id === groupId);
  if (!existingGroup) return null;
  const nextGroup = updater(existingGroup);
  writeGroups(groups.map((group) => (group.id === groupId ? nextGroup : group)));
  return nextGroup;
};

export const updateEventChatGroupSettings = (
  groupId: string,
  settings: Partial<
    Pick<
      IEventChatGroup,
      "announcementMode" | "muted" | "memberListVisibility" | "pinnedMessageId"
    >
  >,
) =>
  updateGroupById(groupId, (group) => ({
    ...group,
    ...settings,
  }));

export const toggleEventChatReaction = ({
  groupId,
  messageId,
  emoji,
  userId,
}: {
  groupId: string;
  messageId: string;
  emoji: string;
  userId: string;
}) =>
  updateGroupById(groupId, (group) => ({
    ...group,
    messages: group.messages.map((message) => {
      if (message.id !== messageId) return message;

      const reactions = message.reactions ?? [];
      const existingReaction = reactions.find((reaction) => reaction.emoji === emoji);
      if (!existingReaction) {
        return {
          ...message,
          reactions: [
            ...reactions,
            {
              emoji,
              count: 1,
              reactedBy: [userId],
            },
          ],
        };
      }

      const hasReacted = existingReaction.reactedBy.includes(userId);
      const nextReactedBy = hasReacted
        ? existingReaction.reactedBy.filter((id) => id !== userId)
        : [...existingReaction.reactedBy, userId];
      const nextReactions = reactions
        .map((reaction) =>
          reaction.emoji === emoji
            ? {
                ...reaction,
                count: nextReactedBy.length,
                reactedBy: nextReactedBy,
              }
            : reaction,
        )
        .filter((reaction) => reaction.count > 0);

      return {
        ...message,
        reactions: nextReactions,
      };
    }),
  }));

export const hideEventChatMessage = (groupId: string, messageId: string) =>
  updateGroupById(groupId, (group) => ({
    ...group,
    messages: group.messages.map((message) =>
      message.id === messageId
        ? {
            ...message,
            hiddenByVendor: true,
          }
        : message,
    ),
  }));

export const reportEventChatMember = (groupId: string, memberId: string) =>
  updateGroupById(groupId, (group) => ({
    ...group,
    members: group.members.map((member) =>
      member.id === memberId
        ? {
            ...member,
            reportedAt: new Date().toISOString(),
          }
        : member,
    ),
  }));

export const blockEventChatMember = (groupId: string, memberId: string) =>
  updateGroupById(groupId, (group) => ({
    ...group,
    members: group.members.map((member) =>
      member.id === memberId
        ? {
            ...member,
            isBlocked: true,
          }
        : member,
    ),
  }));
