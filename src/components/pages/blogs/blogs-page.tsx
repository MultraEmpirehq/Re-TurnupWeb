"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { useBlogs } from "@/hooks/use-blogs";
import BlogCard from "./blog-card";

/** News and updates from organisers across Turnupz, newest first. */
export default function BlogsPage() {
  const [query, setQuery] = useState("");
  const blogs = useBlogs(query);
  const posts = useMemo(
    () => (blogs.data?.pages ?? []).flatMap((page) => page.items),
    [blogs.data],
  );

  return (
    <div className="min-h-screen bg-[#F7F8FB] pb-20">
      <div className="bg-linear-to-r from-[#00B2FF] to-[#0577FA] pb-14 pt-28 text-white">
        <SectionContainer>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Blogs
          </h1>
          <p className="mt-3 max-w-xl text-base text-white/85 md:text-lg">
            Line-ups, news and behind-the-scenes from the organisers of events
            on Turnupz.
          </p>
          <label className="mt-6 flex h-12 max-w-md items-center gap-2 rounded-full bg-white px-4 text-zinc-900">
            <Search className="size-4 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search blogs or events"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
          </label>
        </SectionContainer>
      </div>

      <SectionContainer className="mt-8">
        {blogs.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : blogs.error ? (
          <p className="py-20 text-center text-zinc-500">
            We couldn&apos;t load blogs. Please refresh the page.
          </p>
        ) : !posts.length ? (
          <div className="py-20 text-center">
            <p className="text-lg font-bold text-zinc-950">
              {query ? "No blogs match that" : "No blogs yet"}
            </p>
            <p className="mt-1 text-zinc-500">
              {query
                ? "Try another word."
                : "When organisers post updates about their events, you'll find them here."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
            {blogs.hasNextPage && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => void blogs.fetchNextPage()}
                  disabled={blogs.isFetchingNextPage}
                  className="h-11 rounded-full border border-zinc-200 bg-white px-6 text-sm font-bold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
                >
                  {blogs.isFetchingNextPage ? "Loading…" : "Show more"}
                </button>
              </div>
            )}
          </>
        )}
      </SectionContainer>
    </div>
  );
}
