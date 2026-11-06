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

/**
 * Bump when the cookie policy changes what's asked, so everyone is asked
 * again. A choice also lapses after a year (the usual European practice).
 */
export const COOKIE_POLICY_VERSION = 1;
const CHOICE_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000;

type TStoredChoice = { allowed: boolean; version: number; decidedAt: string };

/** The browser's "don't track me" signal (Global Privacy Control). */
const browserSaysNo = () =>
  typeof navigator !== "undefined" &&
  (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

const readChoice = (): boolean | null => {
  const saved = localStorage.getItem(CONSENT_KEY);
  if (saved === null) return null;
  // Before the date and version were kept: honour it, and keep it from now.
  if (saved === "true" || saved === "false") {
    writeChoice(saved === "true");
    return saved === "true";
  }
  try {
    const choice = JSON.parse(saved) as TStoredChoice;
    const lapsed = Date.now() - new Date(choice.decidedAt).getTime() > CHOICE_LIFETIME_MS;
    if (choice.version !== COOKIE_POLICY_VERSION || lapsed) return null;
    return !!choice.allowed;
  } catch {
    return null;
  }
};

const writeChoice = (allowed: boolean) => {
  const choice: TStoredChoice = {
    allowed,
    version: COOKIE_POLICY_VERSION,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(choice));
};

/**
 * Whether visits may be counted: true, false, or null when they haven't been
 * asked (or their answer lapsed). With no answer, a browser sending Global
 * Privacy Control counts as "no", without asking; their own choice in Cookie
 * settings still wins.
 */
export const getVisitorCountingConsent = () => {
  if (visitorCountingConsent !== null || typeof window === "undefined") {
    return visitorCountingConsent;
  }
  let saved: boolean | null = null;
  try {
    saved = readChoice();
  } catch {
    saved = null;
  }
  visitorCountingConsent = saved ?? (browserSaysNo() ? false : null);
  return visitorCountingConsent;
};

export const setVisitorCountingConsent = (allowed: boolean) => {
  visitorCountingConsent = allowed;
  if (typeof window === "undefined") return;
  try {
    writeChoice(allowed);
    if (!allowed) {
      localStorage.removeItem(KEY);
      cached = null;
    }
  } catch {
    if (!allowed) cached = null;
  }
};
