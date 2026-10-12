/**
 * The invite code someone arrived with (from an /invite/CODE link), kept in this
 * browser until sign-up uses it. It lasts a week, like the window for adding a
 * code after signing up.
 */
const KEY = "turnupz-invite";
const KEEP_MS = 7 * 24 * 60 * 60 * 1000;

export const rememberInvite = (code: string) => {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ code: code.trim(), at: Date.now() }),
    );
  } catch {
    // Storage blocked: they can still type the code in.
  }
};

export const readInvite = (): string | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, at } = JSON.parse(raw) as { code?: string; at?: number };
    if (!code || !at || Date.now() - at > KEEP_MS) return null;
    return code;
  } catch {
    return null;
  }
};

export const forgetInvite = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
};

/** The link someone shares to invite a friend. */
export const inviteLink = (code: string, origin?: string) =>
  `${origin ?? (typeof window !== "undefined" ? window.location.origin : "")}/invite/${encodeURIComponent(code)}`;
