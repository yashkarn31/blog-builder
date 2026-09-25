import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getEditorOptions } from "@/lib/editor-data";
import { PostEditor } from "@/components/editor/PostEditor";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  await requireUser("/dashboard/posts/new");
  const { categories, tagSuggestions } = await getEditorOptions();

  return (
    <PostEditor
      initial={{
        id: null,
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        coverImage: null,
        categoryId: null,
        tags: [],
        status: "DRAFT",
      }}
      categories={categories}
      tagSuggestions={tagSuggestions}
    />
  );
}
