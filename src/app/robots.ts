import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { APP_HOSTS, APP_ORIGIN, COMPANY_ORIGIN } from "@/lib/domains";

/**
 * Search engines may read the public pages; signed-in areas, the admin
 * console and sign-in stay out. Each domain points to its own sitemap.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = ((await headers()).get("host") ?? "").toLowerCase();
  const origin = APP_HOSTS.includes(host) ? APP_ORIGIN : COMPANY_ORIGIN;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/admin", "/profile", "/auth", "/tickets/claim", "/unsubscribe", "/invite/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
