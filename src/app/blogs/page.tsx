import type { Metadata } from "next";
import BlogsPage from "@/components/pages/blogs/blogs-page";

export const metadata: Metadata = {
  title: "Blogs | Turnupz",
  description:
    "Line-ups, news and behind-the-scenes from the organisers of events on Turnupz.",
};

export default function Blogs() {
  return <BlogsPage />;
}
