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
          <div className="h-96 animate-pulse rounded-3xl bg-card" />
        </SectionContainer>
      </div>
    );
  }
  if (!post) {
    return (
      <div className="min-h-screen bg-[#F7F8FB] pt-32 text-center">
        <p className="text-lg font-bold text-foreground">
          We couldn&apos;t find that blog post
        </p>
        <Link
          href="/blogs"
          className="mt-3 inline-block font-bold text-secondary-500"
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
      <SectionContainer>
        <Link
          href="/blogs"
          className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> All blogs
        </Link>
        {/* Wide screens: the article at a reading width, the event beside it. */}
        <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
          <article className="overflow-hidden rounded-3xl bg-card">
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
                  <p className="text-sm font-bold text-foreground">{by}</p>
                  <p className="text-xs text-muted-foreground">
                    {postedAgo(post.createdAt)} · {readingTime(post.body)} min
                    read
                  </p>
                </div>
              </div>
              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mt-3 text-lg font-semibold text-foreground/80">
                  {post.excerpt}
                </p>
              )}
              <div className="mt-5 max-w-[68ch] whitespace-pre-line text-[17px] leading-8 text-foreground/80">
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

          <aside className="lg:sticky lg:top-24">
            <Link
              href={`/explore/event/${post.event.id}`}
              className="flex items-center gap-4 rounded-2xl bg-card p-4 transition hover:shadow-md lg:flex-col lg:items-stretch lg:gap-3"
            >
              {post.event.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.event.image}
                  alt=""
                  className="size-16 rounded-xl object-cover lg:aspect-[16/10] lg:h-auto lg:w-full"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-foreground">
                  {post.event.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatEventTime(
                    post.event.date,
                    post.event.timezone ?? undefined,
                  )}
                  {post.event.city ? ` · ${post.event.city}` : ""}
                </p>
              </div>
              <span className="rounded-full bg-[#0577FA] px-4 py-2.5 text-center text-sm font-extrabold text-white">
                See event
              </span>
            </Link>
          </aside>
        </div>
      </SectionContainer>

      {post.moreFromEvent.length > 0 && (
        <SectionContainer className="mt-12">
          <h2 className="text-xl font-extrabold text-foreground">
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
