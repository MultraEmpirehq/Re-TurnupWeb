import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getData } from "@/api";

/** The event a blog post belongs to. */
export type TBlogEvent = {
  id: string;
  name: string;
  date: string;
  timezone?: string | null;
  organizerName?: string | null;
  city?: string | null;
  image?: string | null;
};

export type TBlogCard = {
  id: string;
  title: string;
  excerpt?: string | null;
  /** First part of the post, for cards. */
  preview?: string;
  images: string[];
  createdAt: string;
  event: TBlogEvent;
};

export type TBlogPost = TBlogCard & {
  body: string;
  moreFromEvent: TBlogCard[];
};

/** Every public event's blog posts, newest first, a page at a time. */
export const useBlogs = (q: string) =>
  useInfiniteQuery({
    queryKey: ["blogs", q.trim().toLowerCase()],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: "12",
      });
      if (q.trim()) params.set("q", q.trim());
      const { data } = await getData<TBlogCard[]>(
        `/blogs?${params.toString()}`,
      );
      return { items: data?.data ?? [], pagination: data?.pagination };
    },
    getNextPageParam: (last) => last.pagination?.nextPage ?? undefined,
  });

export const useBlogPost = (postId?: string) =>
  useQuery({
    queryKey: ["blog", postId],
    enabled: !!postId,
    queryFn: async () =>
      (await getData<TBlogPost>(`/blogs/${postId}`)).data?.data ?? null,
  });

/** "2 hrs ago", "Yesterday", "12 Oct". */
export const postedAgo = (iso?: string) => {
  if (!iso) return "";
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hr" : "hrs"} ago`;
  if (hours < 48) return "Yesterday";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
