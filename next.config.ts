import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig: NextConfig = {
  // Pages that moved so each address matches its menu name. The old ones
  // keep working: links in emails, notifications and the app land here.
  async redirects() {
    return [
      { source: "/app/profile", destination: "/app/settings", permanent: true },
      { source: "/app/messages", destination: "/app/chats", permanent: true },
      { source: "/app/messages/:path*", destination: "/app/chats/:path*", permanent: true },
      { source: "/app/analysis", destination: "/app/analytics", permanent: true },
      { source: "/app/create", destination: "/app/events/create", permanent: true },
      { source: "/app/categories", destination: "/app/admin/categories", permanent: true },
      { source: "/app/create-category", destination: "/app/admin/categories/create", permanent: true },
      { source: "/app/create-venue", destination: "/app/admin/venues/create", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      new URL("https://res.cloudinary.com/**"),
      new URL("https://cdn.turnupz.com/**"),
      new URL("https://*.turnupz.com/**"),
      new URL("http://localhost:3000/**"),
      new URL("http://localhost:3001/**"),
      new URL("http://localhost:5000/**"),
      new URL("http://127.0.0.1:3000/**"),
      new URL("http://127.0.0.1:3001/**"),
      new URL("http://127.0.0.1:5000/**"),
    ],
  },
};

// Keep the dev server's output out of `.next` so it never clashes with a
// production build. `next build` must emit to `.next` — Vercel looks there.
const withSentry = (config: NextConfig) =>
  withSentryConfig(config, {
    org: "turnupz-ux",
    project: "turnupz-web",
    silent: true,
    telemetry: false,
    // Readable stack traces need SENTRY_AUTH_TOKEN at build time; without it
    // the build carries on and errors still arrive, just minified.
    sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  });

export default (phase: string): NextConfig =>
  withSentry(
    phase === PHASE_DEVELOPMENT_SERVER
      ? { ...nextConfig, distDir: ".next-dev-cache" }
      : nextConfig,
  );
