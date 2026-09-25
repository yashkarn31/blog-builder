import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, Eye, PenLine } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canEditPost, postCardSelect } from "@/lib/posts";
import { compact } from "@/lib/format";
import { highlightCodeBlocks } from "@/lib/highlight";
import { makeExcerpt } from "@/lib/content";
import { CoverImage } from "@/components/blog/CoverImage";
import { PostMeta } from "@/components/blog/PostMeta";
import { PostCard } from "@/components/blog/PostCard";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { ViewTracker } from "@/components/blog/ViewTracker";
import { ArticleActions } from "@/components/blog/ArticleActions";
import { Comments } from "@/components/blog/Comments";
import { Avatar } from "@/components/ui/Avatar";
import { button } from "@/components/ui/styles";

type Props = { params: Promise<{ slug: string }> };

const getPost = cache(async (slug: string) =>
  prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, bio: true, active: true } },
      category: { select: { id: true, name: true, slug: true } },
      tags: { select: { name: true, slug: true }, orderBy: { name: "asc" } },
      _count: { select: { likes: true, comments: true } },
    },
  }),
);

/** Published posts are public; drafts are visible only to their author and admins. */
async function loadVisiblePost(slug: string) {
  const [post, viewer] = await Promise.all([getPost(slug), getCurrentUser()]);
  if (!post) return null;
  const isPublic = post.status === "PUBLISHED" && post.author.active;
  if (!isPublic && !(viewer && canEditPost(viewer, post))) return null;
  return { post, viewer, isPublic };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post || post.status !== "PUBLISHED") return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.author.name }],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.name],
      tags: post.tags.map((t) => t.name),
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const visible = await loadVisiblePost(slug);
  if (!visible) notFound();
  const { post, viewer, isPublic } = visible;

  const [liked, comments, similar] = await Promise.all([
    viewer
      ? prisma.like.findUnique({ where: { postId_userId: { postId: post.id, userId: viewer.id } } })
      : null,
    prisma.comment.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, body: true, createdAt: true, author: { select: { id: true, name: true } } },
    }),
    prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        id: { not: post.id },
        author: { active: true },
        OR: [
          ...(post.category ? [{ categoryId: post.category.id }] : []),
          { tags: { some: { slug: { in: post.tags.map((t) => t.slug) } } } },
          { authorId: post.author.id },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: postCardSelect,
    }),
  ]);

  // Prefer posts sharing a topic/author; otherwise fall back to the latest ones.
  const related =
    similar.length > 0
      ? similar
      : await prisma.post.findMany({
          where: { status: "PUBLISHED", id: { not: post.id }, author: { active: true } },
          orderBy: { publishedAt: "desc" },
          take: 3,
          select: postCardSelect,
        });

  const editable = viewer && canEditPost(viewer, post);
  // Auto-generated excerpts just repeat the opening lines, so only show a hand-written one as the standfirst.
  const standfirst = post.excerpt && post.excerpt !== makeExcerpt(post.content) ? post.excerpt : null;

  return (
    <>
      <ReadingProgress />
      {isPublic && <ViewTracker postId={post.id} />}

      {!isPublic && (
        <div className="border-b border-warning/30 bg-warning-soft">
          <p className="mx-auto max-w-3xl px-4 py-2.5 text-center text-sm font-medium text-warning">
            Preview — this post is a draft and is only visible to you{viewer?.role === "ADMIN" ? " and other admins" : ""}.
          </p>
        </div>
      )}

      <article className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-14">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
            <ArrowLeft className="h-4 w-4" /> All posts
          </Link>
          {editable && (
            <Link href={`/dashboard/posts/${post.id}/edit`} className={button("secondary", "sm")}>
              <PenLine className="h-3.5 w-3.5" /> Edit post
            </Link>
          )}
        </div>

        <header>
          {post.category && (
            <Link
              href={`/?category=${post.category.slug}`}
              className="text-sm font-semibold uppercase tracking-wider text-accent hover:underline"
            >
              {post.category.name}
            </Link>
          )}
          <h1 className="mt-3 font-serif text-[2.35rem] font-semibold leading-[1.12] tracking-tight text-balance sm:text-5xl">
            {post.title}
          </h1>
          {standfirst && (
            <p className="mt-5 font-serif text-xl leading-relaxed text-fg-muted text-pretty sm:text-[1.4rem]">{standfirst}</p>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
            <PostMeta author={post.author.name} date={post.publishedAt ?? post.updatedAt} readingTime={post.readingTime} size="md" />
            <span className="flex items-center gap-1.5 text-sm text-fg-subtle">
              <Eye className="h-4 w-4" /> {compact(post.views)} views
            </span>
          </div>
        </header>
      </article>

      {post.coverImage && (
        <figure className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
          <CoverImage src={post.coverImage} alt={post.title} sizes="(min-width: 1024px) 1024px, 100vw" priority className="aspect-[2/1] rounded-2xl sm:rounded-3xl" />
        </figure>
      )}

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div
          className="article prose prose-lg mt-10 max-w-none dark:prose-invert"
          // Content is sanitised on write (see lib/content.ts).
          dangerouslySetInnerHTML={{ __html: highlightCodeBlocks(post.content) }}
        />

        {post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Link key={t.slug} href={`/?tag=${t.slug}`} className="rounded-full bg-muted px-3.5 py-1.5 text-sm text-fg-muted transition hover:bg-accent-soft hover:text-accent">
                #{t.name}
              </Link>
            ))}
          </div>
        )}

        {isPublic && (
          <div className="mt-8 border-y border-line py-5">
            <ArticleActions
              postId={post.id}
              initialLiked={!!liked}
              initialLikes={post._count.likes}
              comments={post._count.comments}
              loggedIn={!!viewer}
            />
          </div>
        )}

        <div className="mt-10 flex items-start gap-4 rounded-2xl bg-muted p-6">
          <Avatar name={post.author.name} size={52} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Written by</p>
            <p className="mt-0.5 text-lg font-semibold">{post.author.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">
              {post.author.bio ?? "Writes for the AnalyticsLiv team blog."}
            </p>
          </div>
        </div>

        {isPublic && (
          <div className="mt-14">
            <Comments
              postId={post.id}
              postAuthorId={post.author.id}
              initial={comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
              viewer={viewer}
            />
          </div>
        )}
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
          <h2 className="mb-6 font-serif text-2xl font-semibold tracking-tight">Keep reading</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
