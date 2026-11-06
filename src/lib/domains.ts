/**
 * Two domains, one site. turnupz.com is the company: the home page, about,
 * contact, FAQs, pricing, the policies, the company blog and the admin
 * console. turnupz.app is the product: explore, events, organisers' blogs,
 * signing in, and everything after it. A page asked for on the wrong domain
 * is sent to the same page on the right one (see proxy.ts). Other hosts
 * (localhost, preview deployments) serve everything.
 */

/** Carries the cookie choice across to the other domain, so it's asked once. */
export const CONSENT_PARAM = "tzc";

export const COMPANY_ORIGIN = process.env.NEXT_PUBLIC_COMPANY_ORIGIN || "https://turnupz.com";
export const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://turnupz.app";

const hostOf = (origin: string) => new URL(origin).host.toLowerCase();
const withWww = (host: string) => [host, `www.${host}`];
export const COMPANY_HOSTS = withWww(hostOf(COMPANY_ORIGIN));
export const APP_HOSTS = withWww(hostOf(APP_ORIGIN));

const isWithin = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/** The admin console: its sign-in and everything under it. */
export const isAdminPath = (pathname: string) =>
  isWithin(pathname, "/admin") || isWithin(pathname, "/app/admin");

/** The company's own pages. */
const COMPANY_PATHS = [
  "/about",
  "/contact",
  "/faqs",
  "/pricing",
  "/terms",
  "/privacy-policy",
  "/cookie-policy",
  "/news",
  "/coming-soon",
  "/unsubscribe",
  "/waitlist",
];

/** Which domain a page belongs on. */
export const domainFor = (pathname: string): "company" | "app" => {
  if (pathname === "/" || isAdminPath(pathname)) return "company";
  // The admin sign-in links to it, so admins reset on their own domain too.
  if (pathname === "/auth/forgot-password" || pathname === "/auth/otp") return "company";
  return COMPANY_PATHS.some((base) => isWithin(pathname, base)) ? "company" : "app";
};

/**
 * Pages served on both: password reset, and the account's own pages (profile,
 * settings, notifications and messages), so admins use them without leaving
 * turnupz.com, where they're signed in.
 */
export const isOnBoth = (pathname: string) =>
  pathname === "/auth/forgot-password" ||
  pathname === "/auth/otp" ||
  isWithin(pathname, "/app/profile") ||
  pathname === "/app/settings" ||
  pathname === "/app/notifications" ||
  isWithin(pathname, "/app/messages");

/**
 * A link to `path` that works from anywhere: relative on its own domain (and
 * on localhost or previews), else the full address on the other domain.
 */
export const siteHref = (path: string) => {
  if (typeof window === "undefined") return path;
  const host = window.location.host.toLowerCase();
  const onCompany = COMPANY_HOSTS.includes(host);
  const onApp = APP_HOSTS.includes(host);
  if (!onCompany && !onApp) return path;
  const pathname = path.split(/[?#]/)[0] || "/";
  // Home is each domain's own front door (Explore on the product).
  if (pathname === "/") return path;
  const belongs = domainFor(pathname);
  if (isOnBoth(pathname) || (belongs === "company") === onCompany) return path;
  const url = new URL(path, belongs === "company" ? COMPANY_ORIGIN : APP_ORIGIN);
  try {
    const consent = localStorage.getItem("turnupz-visitor-counting-consent");
    if (consent === "true" || consent === "false") {
      url.searchParams.set(CONSENT_PARAM, consent === "true" ? "1" : "0");
    }
  } catch {
    // Private windows: they'll be asked there.
  }
  return url.toString();
};
