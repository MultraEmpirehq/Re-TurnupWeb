import {
  getEventNotifications,
  subscribeToEventNotifications,
} from "@/lib/event-notifications";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useVendorNotifications } from "./use-vendor-notifications";

// The api can't mark notifications as read yet, so "unread" means not flagged read
// and newer than the last time this user opened the notifications page.
const SEEN_AT_KEY = "turnup-notifications-seen-at";
const SEEN_AT_UPDATED = "turnup:notifications-seen-at-updated";

const seenAtKeyFor = (userId?: string) => `${SEEN_AT_KEY}:${userId ?? "anonymous"}`;

const readSeenAt = (userId?: string) => {
  try {
    return window.localStorage.getItem(seenAtKeyFor(userId));
  } catch {
    return null;
  }
};

const subscribeToSeenAt = (callback: () => void) => {
  window.addEventListener(SEEN_AT_UPDATED, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SEEN_AT_UPDATED, callback);
    window.removeEventListener("storage", callback);
  };
};

export const markNotificationsSeen = (userId?: string) => {
  try {
    window.localStorage.setItem(seenAtKeyFor(userId), new Date().toISOString());
    window.dispatchEvent(new CustomEvent(SEEN_AT_UPDATED));
  } catch {
    // Storage blocked: the badge just won't clear on this browser.
  }
};

// Local event notifications are cached by reference so useSyncExternalStore sees a
// stable snapshot between changes.
let cachedEventNotifications: ReturnType<typeof getEventNotifications> = [];
let cachedEventNotificationsRaw = "";
const getEventNotificationsSnapshot = () => {
  const next = getEventNotifications();
  const raw = JSON.stringify(next);
  if (raw !== cachedEventNotificationsRaw) {
    cachedEventNotificationsRaw = raw;
    cachedEventNotifications = next;
  }
  return cachedEventNotifications;
};
const EMPTY: ReturnType<typeof getEventNotifications> = [];

export const useUnreadNotificationCount = () => {
  const userId = useUserStore((state) => state.userDetails?.id);
  const role = useUserStore((state) => state.userDetails?.role);
  const canSeeVendorNotifications =
    role === EUserRoles.VENDOR || role === EUserRoles.ADMIN;

  const { data: vendorNotifications = [] } = useVendorNotifications({
    enabled: canSeeVendorNotifications,
  });
  const eventNotifications = useSyncExternalStore(
    subscribeToEventNotifications,
    getEventNotificationsSnapshot,
    () => EMPTY,
  );
  const seenAt = useSyncExternalStore(
    subscribeToSeenAt,
    useCallback(() => readSeenAt(userId), [userId]),
    () => null,
  );

  return useMemo(() => {
    const seenTime = seenAt ? new Date(seenAt).getTime() : 0;
    const isUnread = (createdAt: string, isRead: boolean) =>
      !isRead && new Date(createdAt).getTime() > seenTime;

    const vendorIds = new Set(vendorNotifications.map((item) => item.id));
    return (
      vendorNotifications.filter((item) => isUnread(item.createdAt, !!item.read))
        .length +
      eventNotifications.filter(
        (item) => !vendorIds.has(item.id) && isUnread(item.createdAt, !!item.readAt),
      ).length
    );
  }, [eventNotifications, seenAt, vendorNotifications]);
};
