import NewsPostPage from "@/components/pages/news/news-post-page";
import { COMPANY_ORIGIN } from "@/lib/domains";
import { fetchNewsPost, plainSummary } from "@/lib/company-news-server";
import type { Metadata } from "next";

/**
 * What a shared link shows (LinkedIn, WhatsApp, X, Google): the post's title,
 * summary and a picture (share-image/route.tsx makes one from the title, or
 * uses the cover). The canonical address is always turnupz.com/news/….
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchNewsPost(slug);
  const url = `/news/${slug}`;
  if (!post) {
    return { title: "News | Turnupz", metadataBase: new URL(COMPANY_ORIGIN), alternates: { canonical: url } };
  }
  const description = plainSummary(post);
  // A full address: link previews fetch it from outside.
  const image = `${COMPANY_ORIGIN}/news/${slug}/share-image`;
  return {
    metadataBase: new URL(COMPANY_ORIGIN),
    title: `${post.title} | Turnupz`,
    description,
    alternates: {
      canonical: url,
      types: { "application/rss+xml": "/news/rss.xml" },
    },
    openGraph: {
      type: "article",
      url,
      siteName: "Turnupz",
      title: post.title,
      description,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: { card: "summary_large_image", title: post.title, description, images: [image] },
  };
}

export default function NewsPost() {
  return <NewsPostPage />;
}
