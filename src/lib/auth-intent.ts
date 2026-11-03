/**
 * Which door someone came in by: attendees to find events, vendors to host
 * them. It's the same account either way; the door only decides the words on
 * the sign-in pages and where they land afterwards. It rides along in `?as=`
 * through the email link, the password step and the profile step.
 */
export type TAuthIntent = "attendee" | "vendor";

export const INTENT_PARAM = "as";

export const intentFrom = (value?: string | null): TAuthIntent =>
  value === "vendor" ? "vendor" : "attendee";

/** `href` with the door added, if it's the vendor one (attendee is the default). */
export const withIntent = (href: string, intent: TAuthIntent) => {
  if (intent !== "vendor") return href;
  return `${href}${href.includes("?") ? "&" : "?"}${INTENT_PARAM}=vendor`;
};
