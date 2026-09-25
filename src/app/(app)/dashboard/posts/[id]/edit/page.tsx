import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditPost } from "@/lib/posts";
import { makeExcerpt } from "@/lib/content";
import { getEditorOptions } from "@/lib/editor-data";
import { PostEditor } from "@/components/editor/PostEditor";

export const metadata: Metadata = { title: "Edit post" };

type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser(`/dashboard/posts/${id}/edit`);
  const post = await prisma.post.findUnique({
    where: { id },
    include: { tags: { select: { name: true } }, author: { select: { name: true } } },
  });
  // Employees get a 404 (not a 403) for other people's posts so IDs can't be probed.
  if (!post || !canEditPost(user, post)) notFound();

  const { categories, tagSuggestions } = await getEditorOptions();

  return (
    <PostEditor
      key={post.id}
      initial={{
        id: post.id,
        title: post.title === "Untitled" ? "" : post.title,
        slug: post.slug,
        // Auto-generated excerpts show as empty so they keep tracking the content.
        excerpt: post.excerpt === makeExcerpt(post.content) ? "" : post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        categoryId: post.categoryId,
        tags: post.tags.map((t) => t.name),
        status: post.status,
        authorName: post.author.name,
      }}
      categories={categories}
      tagSuggestions={tagSuggestions}
      editingAsAdmin={post.authorId !== user.id}
    />
  );
}
