import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next-dev-cache",
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

module.exports = nextConfig;
