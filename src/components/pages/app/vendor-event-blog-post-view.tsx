"use client";

import { Button } from "@/components/ui/button";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvent } from "@/hooks/use-event";
import { IEventBlogPostDetails } from "@/lib/types";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useState } from "react";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const VendorEventBlogPostView: React.FC<{
  eventId: string;
  blogId: string;
}> = ({ eventId, blogId }) => {
  const { data, isLoading, error, refetch } = useEvent(eventId);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const blogPost = useMemo<IEventBlogPostDetails | null>(() => {
    if (!data) return null;
    if (data.blogPosts?.length) {
      return data.blogPosts.find((post) => post.id === blogId) ?? null;
    }
    if (data.blogPost && blogId === `blog-${data.id}-legacy`) {
      return {
        id: blogId,
        title: "Event update",
        excerpt: data.blogPost.slice(0, 140),
        body: data.blogPost,
        image: data.image || data.medias?.[0] || "",
        images: [data.image || data.medias?.[0] || ""].filter(Boolean),
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  }, [blogId, data]);

  const images = useMemo(
    () =>
      blogPost
        ? blogPost.images?.length
          ? blogPost.images
          : [blogPost.image || ""].filter(Boolean)
        : [],
    [blogPost],
  );

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [blogId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-72 w-full rounded-[1.8rem]" />
        <Skeleton className="h-80 w-full rounded-[1.8rem]" />
      </div>
    );
  }

  if (error || !data || !blogPost) {
    return (
      <ErrorContainer
        error="We could not load this blog post right now."
        retryFunction={refetch}
      />
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
            Event Blog Post
          </p>
          <h1 className="mt-3 text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[0.96] tracking-tight text-secondary-950">
            {blogPost.title}
          </h1>
        </div>
        <Button
          asChild
          className="h-12 rounded-2xl bg-secondary-400 px-6 text-sm font-semibold text-white hover:bg-secondary-500"
        >
          <Link href={`/app/events/${eventId}`}>View Event Page</Link>
        </Button>
      </div>

      {images.length > 0 && (
        <section className="space-y-4">
          <div
            className="h-[22rem] rounded-[1.8rem] border border-secondary-100 bg-secondary-50 bg-cover bg-center shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
            style={{ backgroundImage: `url(${images[selectedImageIndex]})` }}
          />
          {images.length > 1 && (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`overflow-hidden rounded-[1rem] border bg-white text-left transition ${
                    selectedImageIndex === index
                      ? "border-secondary-500 ring-2 ring-secondary-100"
                      : "border-secondary-100 hover:border-secondary-300"
                  }`}
                >
                  <div
                    className="h-28 bg-secondary-50 bg-cover bg-center"
                    style={{ backgroundImage: `url(${image})` }}
                  />
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-500">
                    Update Image {index + 1}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-secondary-500">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="size-4" />
            {formatDate(blogPost.createdAt)}
          </span>
          <span className="h-1 w-1 rounded-full bg-secondary-300" />
          <span>{data.name}</span>
        </div>

        {blogPost.excerpt && (
          <p className="mb-7 text-lg leading-8 text-secondary-600">
            {blogPost.excerpt}
          </p>
        )}

        <div className="whitespace-pre-line text-base leading-8 text-secondary-700">
          {blogPost.body}
        </div>
      </article>
    </main>
  );
};

export default memo(VendorEventBlogPostView);
