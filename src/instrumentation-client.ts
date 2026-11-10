import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./sentry-options";

// Errors in people's browsers.
Sentry.init(sentryOptions);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
