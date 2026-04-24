import { IEventDetailsType } from "@/lib/types";
import { TUserDetails } from "@/stores/user-store";

const EVENT_CHAT_GROUPS_KEY = "turnup-event-chat-groups";
const EVENT_CHAT_GROUPS_UPDATED = "turnup:event-chat-groups-updated";

export interface IEventChatParticipant {
  id: string;
  name: string;
  role: "vendor" | "member";
  email?: string;
}

export interface IEventChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  role: "vendor" | "member";
  body: string;
  createdAt: string;
  kind?: "text" | "event-update" | "image" | "audio" | "file";
  assetUrl?: string;
  assetName?: string;
}

export interface IEventChatGroup {
  id: string;
  eventId: string;
  eventName: string;
  status: "active" | "quiet";
  createdAt: string;
  lastActivityAt: string;
  preview: string;
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
});

const toVendorParticipant = (user?: TUserDetails | null): IEventChatParticipant => ({
  id: user?.id || "turnupz-vendor",
  name:
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Turnupz Vendor",
  role: "vendor",
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
    email: user.email,
  };
};

const buildVendorLaunchMessage = (event: IEventDetailsType, vendor: IEventChatParticipant) => ({
  id: `chat-message-${event.id}-launch`,
  senderId: vendor.id,
  senderName: vendor.name,
  role: "vendor" as const,
  kind: "event-update" as const,
  createdAt: new Date().toISOString(),
  body: `Welcome to the ${event.name} community. This group is now open for event updates, access information, and attendee questions.`,
});

export const getEventChatGroups = () => readGroups();

export const getEventChatGroupByEventId = (eventId: string) =>
  readGroups().find((group) => group.eventId === eventId) ?? null;

export const ensureEventChatGroup = (
  event: IEventDetailsType,
  vendorUser?: TUserDetails | null,
) => {
  if (!canUseStorage() || !event?.id) return null;

  const groups = readGroups();
  const existingGroup = groups.find((group) => group.eventId === event.id);
  const vendor = toVendorParticipant(vendorUser);

  if (existingGroup) {
    const updatedGroup: IEventChatGroup = {
      ...existingGroup,
      eventName: event.name,
      vendor,
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
            role: "member",
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
}: {
  eventId: string;
  sender: IEventChatParticipant;
  body: string;
  kind?: IEventChatMessage["kind"];
  assetUrl?: string;
  assetName?: string;
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
  };

  const nextGroup: IEventChatGroup = {
    ...existingGroup,
    status: "active",
    lastActivityAt: nextMessage.createdAt,
    preview:
      kind === "image"
        ? `${sender.name} shared an image.`
        : kind === "audio"
          ? `${sender.name} shared an audio update.`
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
