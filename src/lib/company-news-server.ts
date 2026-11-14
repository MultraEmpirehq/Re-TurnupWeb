import { apiBaseUrl } from "@/lib/env";
import type { ICompanyPost } from "@/hooks/use-company-news";

/**
 * Company blog posts fetched on the server, for link previews, the RSS feed
 * and the sitemap. Cached for five minutes; a failure gives nothing rather
 * than breaking the page.
 */
const get = async <T,>(path: string): Promise<T | null> => {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: T };
    return body.data ?? null;
  } catch {
    return null;
  }
};

export const fetchNewsPost = (slug: string) =>
  get<ICompanyPost>(`/news/${encodeURIComponent(slug)}`);

/** The API's largest page. */
const PAGE = 50;

/** The latest published posts, newest first: up to `limit`, fetched 50 at a time. */
export const fetchNewsPosts = async (limit = PAGE) => {
  const posts: ICompanyPost[] = [];
  for (let page = 1; posts.length < limit; page += 1) {
    const batch = (await get<ICompanyPost[]>(`/news?page=${page}&limit=${PAGE}`)) ?? [];
    posts.push(...batch);
    if (batch.length < PAGE) break;
  }
  return posts.slice(0, limit);
};

/** Plain text for a description: markdown and tags stripped, trimmed to length. */
export const plainSummary = (post: Pick<ICompanyPost, "excerpt" | "preview" | "body">, max = 180) => {
  const text = (post.excerpt || post.preview || post.body || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`~[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};
