import { ROUTES } from "@/lib/variables";

const ADMIN = ROUTES.ADMIN_OVERVIEW.href;

/**
 * Admins have their own routes. A vendor-area address an admin lands on
 * (from a shared link, say) is sent to the admin equivalent; vendor-only
 * screens (the vendor dashboard, analysis, wallet, tickets) go to the admin
 * overview. Account screens (messages, notifications, profile, settings) are
 * shared and stay put.
 */
const MAPPED: [from: RegExp, to: (match: RegExpMatchArray) => string][] = [
  [/^\/app\/create\/?$/, () => `${ADMIN}/events/create`],
  [/^\/app\/events(\/.*)?$/, (m) => `${ADMIN}/events${m[1] ?? ""}`],
  [/^\/app\/create-venue\/?$/, () => `${ADMIN}/venues/create`],
  [/^\/app\/venues(\/.*)?$/, (m) => `${ADMIN}/venues${m[1] ?? ""}`],
  [/^\/app\/create-category\/?$/, () => `${ADMIN}/categories/create`],
  [/^\/app\/categories(\/.*)?$/, (m) => `${ADMIN}/categories${m[1] ?? ""}`],
  [/^\/app\/performers(\/.*)?$/, (m) => `${ADMIN}/performers${m[1] ?? ""}`],
];

const SHARED = [
  /^\/app\/messages(\/.*)?$/,
  /^\/app\/notifications\/?$/,
  /^\/app\/profile\/?$/,
  /^\/app\/settings\/?$/,
];

/** The account's own pages, which admins use as they are. */
export const isSharedWithAdmins = (pathname: string) =>
  pathname.startsWith("/app/profile") || SHARED.some((pattern) => pattern.test(pathname));

/** Where an admin on `pathname` belongs, or null if they're already there. */
export const adminPathFor = (pathname: string): string | null => {
  if (pathname === ADMIN || pathname.startsWith(`${ADMIN}/`)) return null;
  if (!pathname.startsWith("/app")) return null;
  if (SHARED.some((pattern) => pattern.test(pathname))) return null;
  for (const [pattern, to] of MAPPED) {
    const match = pathname.match(pattern);
    if (match) return to(match);
  }
  // The vendor dashboard, analysis, wallet, tickets and the rest.
  return ADMIN;
};

/**
 * `href` as an admin should open it: a vendor-area address becomes its admin
 * equivalent (query kept), so admins stay in the console on turnupz.com.
 * Anyone else gets `href` back unchanged.
 */
export const consoleHref = (href: string, isAdmin: boolean) => {
  if (!isAdmin) return href;
  // Notifications sent before this address was corrected.
  const oldVerification = href.match(/^\/admin\/vendor-verifications\/(.+)$/);
  if (oldVerification) return `${ADMIN}/verifications/${oldVerification[1]}`;
  if (!href.startsWith("/app")) return href;
  const [path, query] = href.split("?");
  const mapped = adminPathFor(path) ?? path;
  return query ? `${mapped}?${query}` : mapped;
};
