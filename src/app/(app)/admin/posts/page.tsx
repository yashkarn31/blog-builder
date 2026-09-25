import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getPostRows } from "@/lib/dashboard";
import { PostsTable } from "@/components/dashboard/PostsTable";

export const metadata: Metadata = { title: "All posts · Admin" };

export default async function AdminPostsPage() {
  await requireAdmin();
  const posts = await getPostRows({});
  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-muted">
        Every post across the team. As an admin you can edit, unpublish or delete any of them.
      </p>
      <PostsTable posts={posts} showAuthor />
    </div>
  );
}
