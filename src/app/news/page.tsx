import NewsPage from "@/components/pages/news/news-page";
import type { Metadata } from "next";
import { COMPANY_ORIGIN } from "@/lib/domains";

const description = "What we're building, where we're going next, and stories from the Turnupz team.";

export const metadata: Metadata = {
  metadataBase: new URL(COMPANY_ORIGIN),
  title: "News | Turnupz",
  description,
  alternates: {
    canonical: "/news",
    types: { "application/rss+xml": "/news/rss.xml" },
  },
  openGraph: { type: "website", url: "/news", siteName: "Turnupz", title: "Turnupz News", description },
  twitter: { card: "summary_large_image", title: "Turnupz News", description },
};

export default function News() {
  return <NewsPage />;
}
