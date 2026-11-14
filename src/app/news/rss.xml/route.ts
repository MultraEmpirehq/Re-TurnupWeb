import { COMPANY_ORIGIN } from "@/lib/domains";
import { fetchNewsPosts, plainSummary } from "@/lib/company-news-server";

export const revalidate = 300;

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The company blog as an RSS feed (turnupz.com/news/rss.xml), for readers
 * that follow it and for anything that picks up new posts automatically.
 */
export async function GET() {
  const posts = await fetchNewsPosts(50);
  const items = posts
    .filter((post) => post.status === "published")
    .map((post) => {
      const link = `${COMPANY_ORIGIN}/news/${post.slug}`;
      return `
    <item>
      <title>${escape(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escape(plainSummary(post, 400))}</description>
      <author>news@turnupz.com (${escape(post.author)})</author>
      ${post.publishedAt ? `<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>` : ""}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Turnupz News</title>
    <link>${COMPANY_ORIGIN}/news</link>
    <atom:link href="${COMPANY_ORIGIN}/news/rss.xml" rel="self" type="application/rss+xml" />
    <description>What we're building, where we're going next, and stories from the Turnupz team.</description>
    <language>en</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
