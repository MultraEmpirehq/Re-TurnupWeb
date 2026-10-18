"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { formatEventTime } from "@/lib/event-time";
import { postedAgo, useBlogPost } from "@/hooks/use-blogs";
import BlogCard from "./blog-card";

const readingTime = (body: string) =>
  Math.max(1, Math.round(body.trim().split(/\s+/).length / 200));

/** One blog post in full, with its event and more posts from it. */
export default function BlogPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const { data: post, isLoading } = useBlogPost(postId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FB] pt-28">
        <SectionContainer>
          <div className="h-96 animate-pulse rounded-3xl bg-white" />
        </SectionContainer>
      </div>
    );
  }
  if (!post) {
    return (
      <div className="min-h-screen bg-[#F7F8FB] pt-32 text-center">
        <p className="text-lg font-bold text-zinc-950">
          We couldn&apos;t find that blog post
        </p>
        <Link
          href="/blogs"
          className="mt-3 inline-block font-bold text-[#0577FA]"
        >
          See all blogs
        </Link>
      </div>
    );
  }

  const [cover, ...more] = post.images;
  const by = post.event.organizerName || "The organiser";

  return (
    <div className="min-h-screen bg-[#F7F8FB] pb-20 pt-24">
      <SectionContainer className="max-w-[760px]">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeft className="size-4" /> All blogs
        </Link>
        <article className="mt-4 overflow-hidden rounded-3xl bg-white">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="aspect-[16/8] w-full object-cover"
            />
          )}
          <div className="p-6 md:p-10">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#0B1D2A] text-xs font-extrabold text-[#00B2FF]">
                {by
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join("")}
              </span>
              <div>
                <p className="text-sm font-bold text-zinc-950">{by}</p>
                <p className="text-xs text-zinc-500">
                  {postedAgo(post.createdAt)} · {readingTime(post.body)} min
                  read
                </p>
              </div>
            </div>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-zinc-950 md:text-4xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-3 text-lg font-semibold text-zinc-700">
                {post.excerpt}
              </p>
            )}
            <div className="mt-5 whitespace-pre-line text-[17px] leading-8 text-zinc-800">
              {post.body}
            </div>
            {more.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="mt-5 w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        </article>

        <Link
          href={`/explore/event/${post.event.id}`}
          className="mt-5 flex items-center gap-4 rounded-2xl bg-white p-4 transition hover:shadow-md"
        >
          {post.event.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.event.image}
              alt=""
              className="size-16 rounded-xl object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-extrabold text-zinc-950">
              {post.event.name}
            </p>
            <p className="text-sm text-zinc-500">
              {formatEventTime(
                post.event.date,
                post.event.timezone ?? undefined,
              )}
              {post.event.city ? ` · ${post.event.city}` : ""}
            </p>
          </div>
          <span className="rounded-full bg-[#0577FA] px-4 py-2.5 text-sm font-extrabold text-white">
            See event
          </span>
        </Link>
      </SectionContainer>

      {post.moreFromEvent.length > 0 && (
        <SectionContainer className="mt-12">
          <h2 className="text-xl font-extrabold text-zinc-950">
            More from {post.event.name}
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {post.moreFromEvent.map((item) => (
              <BlogCard key={item.id} post={item} />
            ))}
          </div>
        </SectionContainer>
      )}
    </div>
  );
}
