import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./sentry-options";

// Errors while pages are rendered on the server (Node and edge alike).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(sentryOptions);
  }
}

export const onRequestError = Sentry.captureRequestError;
