/**
 * Keeps an event being created or edited in this browser as it's typed, so a
 * refresh (or a closed tab) doesn't lose it. One copy per organiser and event:
 * "new" until the first draft is saved to the server, then that draft's id.
 *
 * Photos picked from the computer can't be kept (only ones already uploaded,
 * which are links), so they're dropped and the organiser adds them again.
 */

const PREFIX = "turnupz-event-form";
/** Fields held as dates in the form; JSON turns them into text. */
const DATE_KEYS = new Set(["eventDate", "activityDate", "startsAt", "endsAt"]);
/** Older than this, a kept copy is stale and is let go. */
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export type TKeptForm<T> = {
  values: Partial<T>;
  step: number;
  savedAt: string;
  /** Picked photos that couldn't be kept and need adding again. */
  droppedFiles: number;
};

const keyFor = (userId: string, eventId: string | null) =>
  `${PREFIX}:${userId}:${eventId ?? "new"}`;

const isFile = (value: unknown) =>
  (typeof File !== "undefined" && value instanceof File) ||
  (typeof Blob !== "undefined" && value instanceof Blob);

/** A copy that JSON can hold: files left out (and counted). */
const keepable = (value: unknown, dropped: { count: number }): unknown => {
  if (isFile(value)) {
    dropped.count += 1;
    return undefined;
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value
      .map((item) => keepable(item, dropped))
      .filter((item) => item !== undefined);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, keepable(item, dropped)])
        .filter(([, item]) => item !== undefined),
    );
  }
  return value;
};

/** Back from JSON: the date fields as dates again. */
const revive = (value: unknown, key?: string): unknown => {
  if (key && DATE_KEYS.has(key) && typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (Array.isArray(value)) return value.map((item) => revive(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, item]) => [k, revive(item, k)]),
    );
  }
  return value;
};

export const keepEventForm = <T>(
  userId: string,
  eventId: string | null,
  values: T,
  step: number,
) => {
  try {
    const dropped = { count: 0 };
    const kept: TKeptForm<T> = {
      values: keepable(values, dropped) as Partial<T>,
      step,
      savedAt: new Date().toISOString(),
      droppedFiles: dropped.count,
    };
    localStorage.setItem(keyFor(userId, eventId), JSON.stringify(kept));
  } catch {
    // Storage full or blocked: the server draft (saved on each step) remains.
  }
};

export const readKeptEventForm = <T>(
  userId: string,
  eventId: string | null,
): TKeptForm<T> | null => {
  try {
    const raw = localStorage.getItem(keyFor(userId, eventId));
    if (!raw) return null;
    const kept = JSON.parse(raw) as TKeptForm<T>;
    if (Date.now() - new Date(kept.savedAt).getTime() > MAX_AGE_MS) {
      localStorage.removeItem(keyFor(userId, eventId));
      return null;
    }
    return { ...kept, values: revive(kept.values) as Partial<T> };
  } catch {
    return null;
  }
};

export const forgetEventForm = (userId: string, eventId: string | null) => {
  try {
    localStorage.removeItem(keyFor(userId, eventId));
  } catch {
    // Nothing to do.
  }
};
