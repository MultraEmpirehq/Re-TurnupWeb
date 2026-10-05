/** Why someone can flag an event; the keys match the API's report reasons. */
export const REPORT_REASON_LABELS: Record<string, string> = {
  scam: "Scam or fraud",
  misleading: "Misleading details",
  inappropriate: "Inappropriate content",
  cancelled: "Event cancelled",
  duplicate: "Duplicate listing",
  other: "Something else",
};

export const REPORT_REASON_HINTS: Record<string, string> = {
  scam: "Asking for payment off the platform, fake organiser, or tickets that don't exist.",
  misleading: "Wrong date, venue, price or line-up.",
  inappropriate:
    "Offensive images or text, or something that breaks the rules.",
  cancelled: "The event isn't happening but is still listed.",
  duplicate: "The same event is listed more than once.",
  other: "Tell us what's wrong below.",
};
