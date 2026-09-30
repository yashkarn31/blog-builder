import "server-only";
import type { z } from "zod";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { CurrentUser } from "@/lib/auth";
import { htmlToText, makeExcerpt, readingTime, sanitizeContent } from "@/lib/content";
import { slugify, uniqueSlug } from "@/lib/slug";
import { ApiError } from "@/lib/api";
import type { postSchema } from "@/lib/validation";

export const PAGE_SIZE = 9;

/** Fields needed to render a post card. */
export const postCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  readingTime: true,
  publishedAt: true,
  views: true,
  author: { select: { id: true, name: true } },
  category: { select: { name: true, slug: true } },
  tags: { select: { name: true, slug: true } },
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.PostSelect;

export type PostCardData = Prisma.PostGetPayload<{ select: typeof postCardSelect }>;

export function canEditPost(user: CurrentUser, post: { authorId: string }) {
  return user.role === "ADMIN" || post.authorId === user.id;
}

type PostInput = z.infer<typeof postSchema>;

async function assertCategory(categoryId: string) {
  const exists = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!exists) throw new ApiError(400, "Selected category does not exist.");
}

function tagOps(tags: string[]) {
  const unique = new Map<string, string>();
  for (const name of tags) {
    const slug = slugify(name);
    if (slug && !unique.has(slug)) unique.set(slug, name.trim());
  }
  return [...unique].map(([slug, name]) => ({ where: { slug }, create: { slug, name } }));
}

function freeSlug(base: string, ownId?: string) {
  return uniqueSlug(slugify(base) || "untitled", async (slug) => {
    const hit = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
    return !!hit && hit.id !== ownId;
  });
}

function assertPublishable(title: string, content: string) {
  if (!title || title === "Untitled") throw new ApiError(400, "Add a title before publishing.");
  if (htmlToText(content).length < 20) throw new ApiError(400, "Write a bit more content before publishing.");
}

export async function createPost(user: CurrentUser, input: PostInput) {
  const title = input.title || "Untitled";
  const content = sanitizeContent(input.content ?? "");
  const publishing = input.status === "PUBLISHED";
  if (publishing) assertPublishable(title, content);
  if (input.categoryId) await assertCategory(input.categoryId);

  return prisma.post.create({
    data: {
      title,
      slug: await freeSlug(input.slug || title),
      content,
      excerpt: input.excerpt || makeExcerpt(content),
      readingTime: readingTime(content),
      coverImage: input.coverImage || null,
      categoryId: input.categoryId || null,
      status: publishing ? "PUBLISHED" : "DRAFT",
      publishedAt: publishing ? new Date() : null,
      authorId: user.id,
      tags: { connectOrCreate: tagOps(input.tags ?? []) },
    },
    select: { id: true, slug: true, status: true },
  });
}

export async function updatePost(postId: string, input: PostInput) {
  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { title: true, content: true, status: true, publishedAt: true },
  });
  if (!existing) throw new ApiError(404, "Post not found.");

  const data: Prisma.PostUncheckedUpdateInput = {};
  const title = input.title !== undefined ? input.title || "Untitled" : existing.title;
  if (input.title !== undefined) data.title = title;

  let content = existing.content;
  if (input.content !== undefined) {
    content = sanitizeContent(input.content);
    data.content = content;
    data.readingTime = readingTime(content);
  }
  if (input.content !== undefined || input.excerpt !== undefined) {
    // An excerpt identical to the one we generated earlier is still "automatic"
    // and should follow the content; anything else was written by the author.
    const custom = input.excerpt && input.excerpt !== makeExcerpt(existing.content) ? input.excerpt : null;
    data.excerpt = custom ?? makeExcerpt(content);
  }

  if (input.coverImage !== undefined) data.coverImage = input.coverImage || null;
  if (input.categoryId !== undefined) {
    if (input.categoryId) await assertCategory(input.categoryId);
    data.categoryId = input.categoryId || null;
  }
  if (input.tags) data.tags = { set: [], connectOrCreate: tagOps(input.tags) };

  // An explicit slug always wins. Otherwise drafts follow their title, while
  // published posts keep a stable URL.
  if (input.slug) data.slug = await freeSlug(input.slug, postId);
  else if (input.title !== undefined && existing.status === "DRAFT") data.slug = await freeSlug(title, postId);

  if (input.status) {
    data.status = input.status;
    if (input.status === "PUBLISHED") {
      assertPublishable(title, content);
      data.publishedAt = existing.publishedAt ?? new Date();
    }
  }

  return prisma.post.update({ where: { id: postId }, data, select: { id: true, slug: true, status: true } });
}

export type PostFilters = { q?: string; category?: string; tag?: string; page: number };

export function publishedWhere({ q, category, tag }: Omit<PostFilters, "page">): Prisma.PostWhereInput {
  return {
    status: "PUBLISHED",
    author: { active: true },
    ...(category ? { category: { slug: category } } : {}),
    ...(tag ? { tags: { some: { slug: tag } } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { excerpt: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
            { tags: { some: { name: { contains: q, mode: "insensitive" } } } },
            { author: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

export async function listPublishedPosts(filters: PostFilters) {
  const where = publishedWhere(filters);
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: postCardSelect,
      orderBy: { publishedAt: "desc" },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.post.count({ where }),
  ]);
  return { posts, total, page: filters.page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
