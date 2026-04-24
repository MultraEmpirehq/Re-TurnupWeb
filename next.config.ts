import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next-dev-cache",
  images: {
    remotePatterns: [new URL("https://res.cloudinary.com/**")],
  },
};

module.exports = nextConfig;
