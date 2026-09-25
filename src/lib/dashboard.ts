import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { PostRow } from "@/components/dashboard/PostsTable";

/** Posts for the dashboard tables, serialised for client components. */
export async function getPostRows(where: Prisma.PostWhereInput): Promise<PostRow[]> {
  const posts = await prisma.post.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      views: true,
      updatedAt: true,
      publishedAt: true,
      category: { select: { name: true } },
      author: { select: { id: true, name: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });
  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    views: p.views,
    updatedAt: p.updatedAt.toISOString(),
    publishedAt: p.publishedAt?.toISOString() ?? null,
    category: p.category?.name ?? null,
    author: p.author,
    likes: p._count.likes,
    comments: p._count.comments,
  }));
}
