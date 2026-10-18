/**
 * A random id for this browser, so the team can count visits (and repeat
 * visits) without anyone signing in. It says nothing about the person, and
 * clearing site data resets it.
 */
const KEY = "turnupz-visitor";

let cached: string | null = null;

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("");

export const visitorId = () => {
  if (typeof window === "undefined") return null;
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
