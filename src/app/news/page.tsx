import NewsPage from "@/components/pages/news/news-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News | Turnupz",
  description: "What we're building, where we're going next, and stories from the Turnupz team.",
};

export default function News() {
  return <NewsPage />;
}
