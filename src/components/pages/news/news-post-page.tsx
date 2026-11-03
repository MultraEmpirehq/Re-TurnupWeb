"use client";

import SectionContainer from "@/components/layouts/section-container/section-container";
import { useCompanyPost } from "@/hooks/use-company-news";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const readingTime = (body = "") => Math.max(1, Math.round(body.split(/\s+/).length / 220));

/** One company blog post. */
export default function NewsPostPage() {
  const params = useParams();
  const slug = params?.slug?.toString();
  const { data: post, isLoading } = useCompanyPost(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FB] pt-24">
        <SectionContainer className="max-w-[760px]">
          <div className="h-96 animate-pulse rounded-3xl bg-white" />
        </SectionContainer>
      </div>
    );
  }
  if (!post) {
    return (
      <div className="min-h-screen bg-[#F7F8FB] pt-32 text-center">
        <p className="text-lg font-bold text-zinc-950">We couldn&apos;t find that post</p>
        <Link href="/news" className="mt-3 inline-block text-sm font-bold text-[#0577FA]">
          See all news
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FB] pb-20 pt-24">
      <SectionContainer className="max-w-[760px]">
        <Link
          href="/news"
          className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeft className="size-4" /> All news
        </Link>
        <article className="mt-4 overflow-hidden rounded-3xl bg-white">
          {post.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.cover} alt="" className="aspect-[16/8] w-full object-cover" />
          )}
          <div className="p-6 md:p-10">
            <p className="text-sm text-zinc-500">
              {post.author} ·{" "}
              {post.publishedAt ? format(new Date(post.publishedAt), "d MMMM yyyy") : ""} ·{" "}
              {readingTime(post.body)} min read
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-zinc-950 md:text-4xl">
              {post.title}
            </h1>
            {post.excerpt && <p className="mt-3 text-lg font-semibold text-zinc-700">{post.excerpt}</p>}
            <div className="mt-5 whitespace-pre-line text-[17px] leading-8 text-zinc-800">{post.body}</div>
          </div>
        </article>
      </SectionContainer>
    </div>
  );
}
