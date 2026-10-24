/**
 * Whose event link someone arrived through (`?ref=username`), kept per event in
 * this browser for a week, the same as the api's share-link window, so a
 * purchase made later still credits them.
 */
const KEY = "turnupz-share-refs";
const KEEP_MS = 7 * 24 * 60 * 60 * 1000;

type TRefs = Record<string, { ref: string; at: number }>;

const read = (): TRefs => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as TRefs;
  } catch {
    return {};
  }
};

export const rememberShareRef = (eventId: string, ref?: string | null) => {
  const clean = ref?.trim().replace(/^@/, "");
  if (!eventId || !clean) return;
  try {
    const refs = read();
    refs[eventId] = { ref: clean, at: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(refs));
  } catch {
    // Storage blocked: the link still works for this visit via the URL.
  }
};

export const readShareRef = (eventId: string) => {
  const entry = read()[eventId];
  return entry && Date.now() - entry.at < KEEP_MS ? entry.ref : undefined;
};

/** The event's public link, carrying the sharer's username when signed in. */
export const eventShareUrl = (eventId: string, username?: string | null) => {
  const base = `${typeof window !== "undefined" ? window.location.origin : ""}/explore/event/${encodeURIComponent(eventId)}`;
  return username ? `${base}?ref=${encodeURIComponent(username)}` : base;
};

// Where a buyer came from (?src=followers from a notification) and a promoter's
// code in the link (?code=TUNDE10), kept per event the same way as the ref.
const EXTRA_KEY = "turnupz-event-arrivals";
type TArrival = { src?: string; code?: string; at: number };

const readArrivals = (): Record<string, TArrival> => {
  try {
    return JSON.parse(localStorage.getItem(EXTRA_KEY) ?? "{}") as Record<
      string,
      TArrival
    >;
  } catch {
    return {};
  }
};

export const rememberArrival = (
  eventId: string,
  arrival: { src?: string | null; code?: string | null },
) => {
  const src = arrival.src?.trim();
  const code = arrival.code?.trim().toUpperCase();
  if (!eventId || (!src && !code)) return;
  try {
    const all = readArrivals();
    const current = all[eventId];
    all[eventId] = {
      src: src || current?.src,
      code: code || current?.code,
      at: Date.now(),
    };
    localStorage.setItem(EXTRA_KEY, JSON.stringify(all));
  } catch {
    // Storage blocked: the link still works for this visit via the URL.
  }
};

export const readArrival = (
  eventId: string,
): { src?: string; code?: string } => {
  const entry = readArrivals()[eventId];
  return entry && Date.now() - entry.at < KEEP_MS
    ? { src: entry.src, code: entry.code }
    : {};
};
