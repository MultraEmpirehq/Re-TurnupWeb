/**
 * When Turnupz opens. Until then the home page shows Coming soon; after it, the
 * home page is back on its own, with no deploy needed. Midnight in Lagos on
 * 19 November 2026 unless NEXT_PUBLIC_LAUNCH_AT says otherwise (an ISO date).
 */
export const LAUNCH_AT = new Date(
  process.env.NEXT_PUBLIC_LAUNCH_AT || "2026-11-19T00:00:00+01:00",
);

export const isLaunched = (now: Date = new Date()) =>
  now.getTime() >= LAUNCH_AT.getTime();

/** The team sees the real site before launch: open /?preview=team once. */
export const PREVIEW_COOKIE = "tz_preview";
