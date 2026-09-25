import type { Metadata } from "next";
import Link from "next/link";
import { Eye, FileText, Heart, MessageCircle, Send, Trophy, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminStats, getUsersWithCounts } from "@/lib/stats";
import { compact } from "@/lib/format";
import { StatCard } from "@/components/dashboard/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { card } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [stats, users] = await Promise.all([getAdminStats(), getUsersWithCounts()]);
  const writers = users.filter((u) => u.published + u.drafts > 0).sort((a, b) => b.published - a.published);
  const maxPublished = Math.max(1, ...writers.map((w) => w.published));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total blogs" value={stats.totalPosts} icon={FileText} />
        <StatCard label="Published" value={stats.published} icon={Send} />
        <StatCard label="Drafts" value={stats.drafts} icon={FileText} />
        <StatCard label="Total views" value={compact(stats.totalViews)} icon={Eye} />
        <StatCard label="Likes" value={compact(stats.likes)} icon={Heart} />
        <StatCard label="Comments" value={compact(stats.comments)} icon={MessageCircle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${card} relative overflow-hidden p-6`}>
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-400/15" />
          <p className="flex items-center gap-2 text-sm font-medium text-fg-muted">
            <Trophy className="h-4 w-4 text-amber-500" /> Most active employee
          </p>
          {stats.mostActive?.user ? (
            <div className="mt-5 flex items-center gap-4">
              <Avatar name={stats.mostActive.user.name} size={56} />
              <div>
                <p className="text-xl font-semibold">{stats.mostActive.user.name}</p>
                <p className="text-sm text-fg-muted">
                  {stats.mostActive.posts} published · {compact(stats.mostActive.views)} views
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-fg-muted">No published posts yet.</p>
          )}
          <div className="mt-6 flex items-center gap-2 border-t border-line pt-4 text-sm text-fg-muted">
            <Users className="h-4 w-4" /> {stats.employees} employees · {stats.admins} admins
          </div>
        </section>

        <section className={`${card} p-6 lg:col-span-2`}>
          <h2 className="text-sm font-medium text-fg-muted">Published posts by author</h2>
          <ul className="mt-5 space-y-3.5">
            {writers.slice(0, 6).map((w) => (
              <li key={w.id} className="grid grid-cols-[140px_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[180px_1fr_auto]">
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar name={w.name} size={24} />
                  <span className="truncate">{w.name}</span>
                </span>
                <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${(w.published / maxPublished) * 100}%` }} />
                </span>
                <span className="min-w-8 whitespace-nowrap text-right tabular-nums text-fg-muted">
                  {w.published}
                  {w.drafts > 0 && <span className="text-fg-subtle"> +{w.drafts} draft{w.drafts === 1 ? "" : "s"}</span>}
                </span>
              </li>
            ))}
            {writers.length === 0 && <li className="text-sm text-fg-muted">Nobody has written anything yet.</li>}
          </ul>
        </section>
      </div>

      <section className={card}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-semibold">Top posts by views</h2>
          <Link href="/admin/posts" className="text-sm font-medium text-accent hover:underline">All posts →</Link>
        </div>
        <ol className="divide-y divide-line">
          {stats.topPosts.map((p, i) => (
            <li key={p.id} className="flex items-center gap-4 px-6 py-3.5">
              <span className="w-5 font-serif text-lg font-semibold text-fg-subtle">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <Link href={`/blog/${p.slug}`} className="block truncate font-medium hover:text-accent">{p.title}</Link>
                <p className="text-xs text-fg-subtle">{p.author.name}</p>
              </div>
              <span className="flex items-center gap-1.5 text-sm tabular-nums text-fg-muted">
                <Eye className="h-3.5 w-3.5" /> {compact(p.views)}
              </span>
            </li>
          ))}
          {stats.topPosts.length === 0 && <li className="px-6 py-8 text-center text-sm text-fg-muted">No published posts yet.</li>}
        </ol>
      </section>
    </div>
  );
}
