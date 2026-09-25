import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import type { PostCardData } from "@/lib/posts";
import { CoverImage } from "./CoverImage";
import { PostMeta } from "./PostMeta";

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-elevated transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5">
      <Link href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden>
        <CoverImage
          src={post.coverImage}
          alt={post.title}
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          className="aspect-[16/9]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {post.category && (
          <Link
            href={`/?category=${post.category.slug}`}
            className="mb-2 w-fit text-xs font-semibold uppercase tracking-wider text-accent hover:underline"
          >
            {post.category.name}
          </Link>
        )}
        <h3 className="font-serif text-[1.35rem] font-semibold leading-snug tracking-tight">
          <Link href={`/blog/${post.slug}`} className="decoration-accent/40 decoration-2 underline-offset-4 group-hover:underline">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-fg-muted">{post.excerpt}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <PostMeta author={post.author.name} date={post.publishedAt} readingTime={post.readingTime} />
          <div className="flex items-center gap-3 text-xs text-fg-subtle">
            <span className="flex items-center gap-1" title="Likes">
              <Heart className="h-3.5 w-3.5" /> {post._count.likes}
            </span>
            <span className="flex items-center gap-1" title="Comments">
              <MessageCircle className="h-3.5 w-3.5" /> {post._count.comments}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function FeaturedPost({ post }: { post: PostCardData }) {
  return (
    <article className="group grid overflow-hidden rounded-3xl border border-line bg-elevated md:grid-cols-2">
      <Link href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden className="md:order-2">
        <CoverImage
          src={post.coverImage}
          alt={post.title}
          sizes="(min-width: 768px) 560px, 100vw"
          priority
          className="aspect-[16/10] h-full md:aspect-auto md:min-h-[360px]"
        />
      </Link>
      <div className="flex flex-col justify-center p-6 sm:p-10">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-accent">Latest</span>
          {post.category && (
            <Link href={`/?category=${post.category.slug}`} className="text-fg-subtle hover:text-accent">
              {post.category.name}
            </Link>
          )}
        </div>
        <h2 className="font-serif text-3xl font-semibold leading-[1.15] tracking-tight sm:text-4xl">
          <Link href={`/blog/${post.slug}`} className="decoration-accent/40 decoration-2 underline-offset-[6px] group-hover:underline">
            {post.title}
          </Link>
        </h2>
        <p className="mt-4 line-clamp-3 text-base leading-relaxed text-fg-muted sm:text-lg">{post.excerpt}</p>
        <div className="mt-6">
          <PostMeta author={post.author.name} date={post.publishedAt} readingTime={post.readingTime} size="md" />
        </div>
      </div>
    </article>
  );
}
