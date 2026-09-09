import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig: NextConfig = {
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
export default (phase: string): NextConfig =>
  phase === PHASE_DEVELOPMENT_SERVER
    ? { ...nextConfig, distDir: ".next-dev-cache" }
    : nextConfig;
