/**
 * The token that lets this browser skip the two-factor code for 30 days. Kept
 * in localStorage and sent only to the sign-in routes; losing it just means
 * the code is asked for again.
 */
const KEY = "turnupz-trusted-device";

export const getTrustedDevice = () => {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const setTrustedDevice = (token?: string | null) => {
  try {
    if (token) window.localStorage.setItem(KEY, token);
  } catch {
    // Private browsing: they'll be asked for the code next time.
  }
};

export const forgetTrustedDevice = () => {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to forget.
  }
};

/** A sign-in answered "two-factor is on: send the code with this challenge". */
export type TTwoFactorChallenge = { twoFactorRequired: true; challenge: string };

export const isTwoFactorChallenge = (value: unknown): value is TTwoFactorChallenge =>
  !!value &&
  typeof value === "object" &&
  (value as { twoFactorRequired?: boolean }).twoFactorRequired === true &&
  typeof (value as { challenge?: unknown }).challenge === "string";
