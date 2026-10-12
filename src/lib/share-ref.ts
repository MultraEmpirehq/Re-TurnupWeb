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
