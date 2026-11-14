import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { APP_HOSTS, APP_ORIGIN, COMPANY_ORIGIN } from "@/lib/domains";
import { fetchNewsPosts } from "@/lib/company-news-server";

export const revalidate = 300;

/**
 * Each domain lists its own pages, as search engines expect: turnupz.com
 * the company pages and every news post; turnupz.app the product's front
 * doors (explore and organisers' blogs).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = ((await headers()).get("host") ?? "").toLowerCase();

  if (APP_HOSTS.includes(host)) {
    return ["/explore", "/blogs"].map((path) => ({
      url: `${APP_ORIGIN}${path}`,
      changeFrequency: "daily",
      priority: path === "/explore" ? 1 : 0.6,
    }));
  }

  const posts = await fetchNewsPosts(1000);
  return [
    { url: `${COMPANY_ORIGIN}/`, changeFrequency: "weekly", priority: 1 },
    ...["/about", "/pricing", "/faqs", "/contact", "/news"].map((path) => ({
      url: `${COMPANY_ORIGIN}${path}`,
      changeFrequency: (path === "/news" ? "daily" : "monthly") as "daily" | "monthly",
      priority: path === "/news" ? 0.8 : 0.6,
    })),
    ...["/terms", "/privacy-policy", "/cookie-policy"].map((path) => ({
      url: `${COMPANY_ORIGIN}${path}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
    ...posts
      .filter((post) => post.status === "published")
      .map((post) => ({
        url: `${COMPANY_ORIGIN}/news/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
  ];
}
