import type { Metadata } from "next";
import Link from "next/link";
import { Eye, FileText, Heart, PenSquare, Send } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPostRows } from "@/lib/dashboard";
import { compact } from "@/lib/format";
import { PostsTable } from "@/components/dashboard/PostsTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { button } from "@/components/ui/styles";

export const metadata: Metadata = { title: "My posts" };

export default async function DashboardPage() {
  const user = await requireUser();
  const posts = await getPostRows({ authorId: user.id });
  const published = posts.filter((p) => p.status === "PUBLISHED");

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-fg-muted">Welcome back, {user.name.split(" ")[0]} 👋</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Your writing</h1>
        </div>
        <Link href="/dashboard/posts/new" className={button("primary", "md")}>
          <PenSquare className="h-4 w-4" /> New post
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Published" value={published.length} icon={Send} />
        <StatCard label="Drafts" value={posts.length - published.length} icon={FileText} />
        <StatCard label="Total views" value={compact(posts.reduce((s, p) => s + p.views, 0))} icon={Eye} />
        <StatCard label="Likes" value={compact(posts.reduce((s, p) => s + p.likes, 0))} icon={Heart} />
      </div>

      {posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line px-6 py-20 text-center">
          <p className="font-serif text-2xl font-semibold">Your first story starts here</p>
          <p className="mx-auto mt-2 max-w-sm text-fg-muted">Draft privately, publish when it&apos;s ready. Drafts auto-save as you type.</p>
          <Link href="/dashboard/posts/new" className={button("primary", "md", "mt-6")}>
            <PenSquare className="h-4 w-4" /> Write a post
          </Link>
        </div>
      ) : (
        <PostsTable posts={posts} />
      )}
    </div>
  );
}
