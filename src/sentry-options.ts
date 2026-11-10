import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Shared Sentry settings for the browser, the server and the edge. Errors only:
 * no tracing and no session replay. Without NEXT_PUBLIC_SENTRY_DSN it stays off.
 */
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  // "production" / "staging" when set; otherwise Vercel's own label (production, preview).
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.NODE_ENV,
  tracesSampleRate: 0,
  sendDefaultPii: false,
  // Tokens, cookies, form contents and who the person is stay out of reports.
  beforeSend(event: ErrorEvent) {
    if (event.request) {
      delete event.request.headers;
      delete event.request.cookies;
      delete event.request.data;
      delete event.request.query_string;
    }
    delete event.user;
    return event;
  },
};
