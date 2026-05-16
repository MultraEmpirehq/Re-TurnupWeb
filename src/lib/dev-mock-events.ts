import { IEventDetailsType } from "@/lib/types";

const DEV_MOCK_EVENTS_KEY = "turnup-dev-mock-events";
const DEV_MOCK_EVENTS_UPDATED = "turnup:dev-mock-events-updated";

export const isDevelopmentClient = () => {
  return (
    process.env.NODE_ENV === "development" && typeof window !== "undefined"
  );
};

export const getDevMockEvents = (): IEventDetailsType[] => {
  if (!isDevelopmentClient()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(DEV_MOCK_EVENTS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as IEventDetailsType[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getDevMockEventById = (id: string) => {
  return getDevMockEvents().find((event) => event.id === id) ?? null;
};

export const saveDevMockEvent = (event: IEventDetailsType) => {
  if (!isDevelopmentClient()) {
    return;
  }

  const nextEvents = [event, ...getDevMockEvents()];
  window.localStorage.setItem(DEV_MOCK_EVENTS_KEY, JSON.stringify(nextEvents));
  window.dispatchEvent(new CustomEvent(DEV_MOCK_EVENTS_UPDATED));
};

export const updateDevMockEvent = (
  id: string,
  updates: Partial<IEventDetailsType>,
) => {
  if (!isDevelopmentClient()) {
    return null;
  }

  let updatedEvent: IEventDetailsType | null = null;
  const nextEvents = getDevMockEvents().map((event) => {
    if (event.id !== id) {
      return event;
    }

    updatedEvent = { ...event, ...updates };
    return updatedEvent;
  });

  window.localStorage.setItem(DEV_MOCK_EVENTS_KEY, JSON.stringify(nextEvents));
  window.dispatchEvent(new CustomEvent(DEV_MOCK_EVENTS_UPDATED));
  return updatedEvent;
};

export const deleteDevMockEvent = (id: string) => {
  if (!isDevelopmentClient()) {
    return false;
  }

  const currentEvents = getDevMockEvents();
  const nextEvents = currentEvents.filter((event) => event.id !== id);

  if (nextEvents.length === currentEvents.length) {
    return false;
  }

  window.localStorage.setItem(DEV_MOCK_EVENTS_KEY, JSON.stringify(nextEvents));
  window.dispatchEvent(new CustomEvent(DEV_MOCK_EVENTS_UPDATED));
  return true;
};

export const subscribeToDevMockEvents = (callback: () => void) => {
  if (!isDevelopmentClient()) {
    return () => {};
  }

  window.addEventListener(DEV_MOCK_EVENTS_UPDATED, callback);
  return () => {
    window.removeEventListener(DEV_MOCK_EVENTS_UPDATED, callback);
  };
};
