import Link from "next/link";
import { TBlogCard, postedAgo } from "@/hooks/use-blogs";

/** A blog post in a grid: picture, event, when, title and a short preview. */
export default function BlogCard({ post }: { post: TBlogCard }) {
  const cover = post.images[0] || post.event.image;
  return (
    <Link
      href={`/blogs/${post.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-[#E5F7FF]">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="size-full object-cover transition group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="truncate text-xs font-semibold text-zinc-500">
          {post.event.name} · {postedAgo(post.createdAt)}
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-base font-extrabold leading-snug text-zinc-950">
          {post.title}
        </h3>
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-zinc-600">
          {post.excerpt || post.preview}
        </p>
        <span className="mt-auto pt-3 text-sm font-extrabold text-[#0577FA]">
          Read more ›
        </span>
      </div>
    </Link>
  );
}
