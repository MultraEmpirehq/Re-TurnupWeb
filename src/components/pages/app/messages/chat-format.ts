import { IEventChatGroup } from "@/lib/event-chat";

/** The list's filters, as on the app. */
export const CHAT_FILTERS = [
  { id: "all", label: "All" },
  { id: "events", label: "Events" },
  { id: "friends", label: "Friends" },
  { id: "organisers", label: "Organisers" },
] as const;
export type TChatFilter = (typeof CHAT_FILTERS)[number]["id"];

export const QUICK_QUESTIONS = [
  "What time do doors open?",
  "Is there a dress code?",
  "Is there parking?",
  "Can I get a refund?",
];

/** The chat's kind; older responses only said group or private. */
export const kindOf = (chat: IEventChatGroup) =>
  chat.chatKind ??
  (chat.isSupport
    ? "SUPPORT"
    : chat.conversationType === "private"
      ? "DIRECT"
      : "EVENT_GROUP");

export const matchesFilter = (chat: IEventChatGroup, filter: TChatFilter) => {
  const kind = kindOf(chat);
  // The Turnupz team's chat sits under All only, at the top.
  if (kind === "SUPPORT") return filter === "all";
  if (filter === "events") return kind === "EVENT_GROUP";
  if (filter === "organisers") return kind === "DIRECT";
  if (filter === "friends") return kind === "PERSON";
  return true;
};

/** "7:42 pm" today, then "Yesterday", the weekday, or the date. */
export const listTime = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  const days = (now.getTime() - date.getTime()) / 86_400_000;
  if (days < 7) return date.toLocaleDateString("en-GB", { weekday: "short" });
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/** The divider between days of messages. */
export const dayDivider = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

export const initials = (name?: string | null) =>
  (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
