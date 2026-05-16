const EVENT_NOTIFICATIONS_KEY = "turnup-event-notifications";
const EVENT_NOTIFICATIONS_UPDATED = "turnup:event-notifications-updated";

export interface IEventNotification {
  id: string;
  eventId: string;
  eventName: string;
  title: string;
  description: string;
  href: string;
  createdAt: string;
  readAt?: string;
}

const canUseStorage = () => typeof window !== "undefined";

const readNotifications = (): IEventNotification[] => {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(EVENT_NOTIFICATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IEventNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeNotifications = (notifications: IEventNotification[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    EVENT_NOTIFICATIONS_KEY,
    JSON.stringify(notifications),
  );
  window.dispatchEvent(new CustomEvent(EVENT_NOTIFICATIONS_UPDATED));
};

export const getEventNotifications = () => readNotifications();

export const addEventNotification = (
  notification: Omit<IEventNotification, "id" | "createdAt">,
) => {
  if (!canUseStorage()) return null;

  const nextNotification: IEventNotification = {
    ...notification,
    id: `event-notification-${notification.eventId}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  writeNotifications([nextNotification, ...readNotifications()]);
  return nextNotification;
};

export const subscribeToEventNotifications = (callback: () => void) => {
  if (!canUseStorage()) return () => {};
  window.addEventListener(EVENT_NOTIFICATIONS_UPDATED, callback);
  return () => window.removeEventListener(EVENT_NOTIFICATIONS_UPDATED, callback);
};
