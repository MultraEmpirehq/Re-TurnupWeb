"use client";

import SectionContainer from "@/components/layouts/section-container/section-container";
import { ICompanyPost, useCompanyNews } from "@/hooks/use-company-news";
import { format } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";

const PostCard = ({ post }: { post: ICompanyPost }) => (
  <Link
    href={`/news/${post.slug}`}
    className="group flex flex-col overflow-hidden rounded-2xl bg-white transition hover:shadow-md"
  >
    <div className="aspect-[16/9] bg-linear-to-br from-[#0577FA] to-[#00B2FF]">
      {post.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover} alt="" className="size-full object-cover" />
      )}
    </div>
    <div className="flex flex-1 flex-col p-5">
      <p className="text-xs font-semibold text-zinc-500">
        {post.publishedAt ? format(new Date(post.publishedAt), "d MMMM yyyy") : ""}
      </p>
      <h2 className="mt-2 text-lg font-extrabold leading-snug text-zinc-950 group-hover:text-[#0577FA]">
        {post.title}
      </h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">{post.excerpt || post.preview}</p>
    </div>
  </Link>
);

/** The company blog: news and stories from Turnupz itself. */
export default function NewsPage() {
  const news = useCompanyNews();
  const posts = useMemo(() => (news.data?.pages ?? []).flatMap((page) => page.items), [news.data]);

  return (
    <div className="min-h-screen bg-[#F7F8FB] pb-20">
      <div className="bg-linear-to-r from-[#00B2FF] to-[#0577FA] pb-14 pt-28 text-white">
        <SectionContainer>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Turnupz news</h1>
          <p className="mt-3 max-w-xl text-base text-white/85 md:text-lg">
            What we&apos;re building, where we&apos;re going next, and stories from the team.
          </p>
        </SectionContainer>
      </div>
      <SectionContainer className="mt-8">
        {news.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-80 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : news.error ? (
          <p className="py-20 text-center text-zinc-500">We couldn&apos;t load the news. Please refresh the page.</p>
        ) : !posts.length ? (
          <div className="py-20 text-center">
            <p className="text-lg font-bold text-zinc-950">No news yet</p>
            <p className="mt-1 text-zinc-500">Our first posts are on their way.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {news.hasNextPage && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => void news.fetchNextPage()}
                  disabled={news.isFetchingNextPage}
                  className="h-11 rounded-full border border-zinc-200 bg-white px-6 text-sm font-bold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
                >
                  {news.isFetchingNextPage ? "Loading…" : "Show more"}
                </button>
              </div>
            )}
          </>
        )}
      </SectionContainer>
    </div>
  );
}
