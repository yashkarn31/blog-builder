import Link from "next/link";
import { Suspense } from "react";
import { X } from "lucide-react";
import { prisma } from "@/lib/db";
import { listPublishedPosts } from "@/lib/posts";
import { postListQuerySchema } from "@/lib/validation";
import { FeaturedPost, PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/blog/Pagination";
import { SearchBox } from "@/components/blog/SearchBox";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function HomePage({ searchParams }: Props) {
  const raw = await searchParams;
  const parsed = postListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    category: typeof raw.category === "string" ? raw.category : undefined,
    tag: typeof raw.tag === "string" ? raw.tag : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
  });
  const filters = parsed.success ? parsed.data : { page: 1 };

  const [{ posts, total, page, pages }, categories, activeTag, popularTags] = await Promise.all([
    listPublishedPosts(filters),
    prisma.category.findMany({
      where: { posts: { some: { status: "PUBLISHED" } } },
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
    filters.tag ? prisma.tag.findUnique({ where: { slug: filters.tag }, select: { name: true } }) : null,
    prisma.tag.findMany({
      where: { posts: { some: { status: "PUBLISHED" } } },
      orderBy: { posts: { _count: "desc" } },
      take: 12,
      select: { name: true, slug: true },
    }),
  ]);

  const filtering = Boolean(filters.q || filters.category || filters.tag);
  const showFeatured = !filtering && page === 1 && posts.length > 0;
  const [featured, ...rest] = showFeatured ? posts : [null, ...posts];

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition ${
      active ? "border-fg bg-fg text-bg" : "border-line bg-elevated text-fg-muted hover:border-fg-subtle hover:text-fg"
    }`;
  const withParams = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { q: filters.q, category: filters.category, tag: filters.tag, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    const s = q.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="pb-10 pt-14 text-center sm:pt-20">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">The AnalyticsLiv team blog</p>
        <h1 className="mx-auto max-w-3xl font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          Ideas worth sharing, from the people building them.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-fg-muted">
          Deep dives on data, engineering and the craft of building products — written by our team.
        </p>
        <div className="mx-auto mt-8 max-w-xl">
          <Suspense>
            <SearchBox />
          </Suspense>
        </div>
      </section>

      <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
        <Link href={withParams({ category: undefined })} className={chip(!filters.category)}>
          All topics
        </Link>
        {categories.map((c) => (
          <Link key={c.slug} href={withParams({ category: c.slug })} className={chip(filters.category === c.slug)}>
            {c.name}
          </Link>
        ))}
      </div>

      {filtering && (
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
          <span>
            {total} {total === 1 ? "result" : "results"}
            {filters.q && (
              <>
                {" "}for <strong className="text-fg">“{filters.q}”</strong>
              </>
            )}
          </span>
          {activeTag && (
            <Link href={withParams({ tag: undefined })} className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 font-medium text-accent">
              #{activeTag.name} <X className="h-3.5 w-3.5" />
            </Link>
          )}
          <Link href="/" className="ml-auto font-medium text-accent hover:underline">
            Clear filters
          </Link>
        </div>
      )}

      {featured && (
        <div className="mb-12">
          <FeaturedPost post={featured} />
        </div>
      )}

      {rest.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => post && <PostCard key={post.id} post={post} />)}
        </div>
      ) : (
        !featured && (
          <div className="rounded-3xl border border-dashed border-line py-20 text-center">
            <p className="font-serif text-2xl font-semibold">Nothing here yet</p>
            <p className="mt-2 text-fg-muted">
              {filtering ? "Try a different search or topic." : "Published posts will show up here."}
            </p>
          </div>
        )
      )}

      <Pagination page={page} pages={pages} params={{ q: filters.q, category: filters.category, tag: filters.tag }} />

      {popularTags.length > 0 && (
        <section className="mt-20 border-t border-line pt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-subtle">Popular tags</h2>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((t) => (
              <Link
                key={t.slug}
                href={withParams({ tag: t.slug })}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  filters.tag === t.slug ? "bg-accent text-accent-fg" : "bg-muted text-fg-muted hover:text-fg"
                }`}
              >
                #{t.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
