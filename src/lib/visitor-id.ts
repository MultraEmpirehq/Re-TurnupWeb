/**
 * A random id for this browser, so the team can count visits (and repeat
 * visits) without anyone signing in. It says nothing about the person, and
 * clearing site data resets it.
 */
const KEY = "turnupz-visitor";
const CONSENT_KEY = "turnupz-visitor-counting-consent";

let cached: string | null = null;
let visitorCountingConsent: boolean | null = null;

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("");

export const visitorId = () => {
  if (typeof window === "undefined") return null;
  if (!getVisitorCountingConsent()) return null;
  if (cached) return cached;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return (cached = saved);
    const fresh = randomId();
    localStorage.setItem(KEY, fresh);
    return (cached = fresh);
  } catch {
    return (cached = randomId());
  }
};

export const getVisitorCountingConsent = () => {
  if (visitorCountingConsent !== null || typeof window === "undefined") {
    return visitorCountingConsent;
  }
  try {
    const saved = localStorage.getItem(CONSENT_KEY);
    visitorCountingConsent = saved === null ? null : saved === "true";
  } catch {
    visitorCountingConsent = null;
  }
  return visitorCountingConsent;
};

export const setVisitorCountingConsent = (allowed: boolean) => {
  visitorCountingConsent = allowed;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_KEY, String(allowed));
    if (!allowed) {
      localStorage.removeItem(KEY);
      cached = null;
    }
  } catch {
    if (!allowed) cached = null;
  }
};
