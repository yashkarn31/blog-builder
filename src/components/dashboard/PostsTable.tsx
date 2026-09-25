"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ExternalLink, Eye, EyeOff, Loader2, MoreHorizontal, PenLine, Search, Send, Trash2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import { input } from "@/components/ui/styles";
import { StatusBadge } from "./StatusBadge";

export type PostRow = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  views: number;
  updatedAt: string;
  publishedAt: string | null;
  category: string | null;
  author?: { id: string; name: string };
  likes: number;
  comments: number;
};

type Filter = "ALL" | "PUBLISHED" | "DRAFT";

export function PostsTable({ posts, showAuthor = false }: { posts: PostRow[]; showAuthor?: boolean }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(
      (p) =>
        (filter === "ALL" || p.status === filter) &&
        (!q || p.title.toLowerCase().includes(q) || p.author?.name.toLowerCase().includes(q)),
    );
  }, [posts, filter, query]);

  const counts = {
    ALL: posts.length,
    PUBLISHED: posts.filter((p) => p.status === "PUBLISHED").length,
    DRAFT: posts.filter((p) => p.status === "DRAFT").length,
  };

  async function run(id: string, action: () => Promise<unknown>) {
    setBusy(id);
    setMenu(null);
    try {
      await action();
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const setStatus = (p: PostRow, status: PostRow["status"]) =>
    run(p.id, () => api(`/api/posts/${p.id}`, { method: "PATCH", json: { status } }));

  const remove = (p: PostRow) => {
    if (!confirm(`Delete “${p.title}” permanently? This can't be undone.`)) return;
    run(p.id, () => api(`/api/posts/${p.id}`, { method: "DELETE" }));
  };

  const tab = (f: Filter, text: string) => (
    <button
      key={f}
      type="button"
      onClick={() => setFilter(f)}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        filter === f ? "bg-fg text-bg" : "text-fg-muted hover:bg-muted hover:text-fg"
      }`}
    >
      {text} <span className="ml-1 opacity-60">{counts[f]}</span>
    </button>
  );

  const menuItem = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted";

  return (
    <div className="rounded-2xl border border-line bg-elevated">
      <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {tab("ALL", "All")}
          {tab("PUBLISHED", "Published")}
          {tab("DRAFT", "Drafts")}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter posts…" className={`${input} h-9 py-0 pl-9`} />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="px-6 py-16 text-center text-sm text-fg-muted">No posts match.</p>
      ) : (
        <ul className="divide-y divide-line">
          {visible.map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-4 py-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={p.status} />
                  {p.category && <span className="text-xs text-fg-subtle">{p.category}</span>}
                </div>
                <Link href={`/dashboard/posts/${p.id}/edit`} className="mt-1.5 block truncate font-semibold hover:text-accent">
                  {p.title}
                </Link>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-fg-subtle">
                  {showAuthor && p.author && <span className="font-medium text-fg-muted">{p.author.name}</span>}
                  <span>
                    {p.status === "PUBLISHED" ? `Published ${formatDate(p.publishedAt)}` : `Edited ${formatDate(p.updatedAt)}`}
                  </span>
                  <span>{p.views} views</span>
                  <span>{p.likes} likes</span>
                  <span>{p.comments} comments</span>
                </p>
              </div>

              <div className="hidden items-center gap-1 md:flex">
                <Link href={`/dashboard/posts/${p.id}/edit`} className="rounded-full p-2 text-fg-muted hover:bg-muted hover:text-fg" title="Edit">
                  <PenLine className="h-4 w-4" />
                </Link>
                <Link href={`/blog/${p.slug}`} className="rounded-full p-2 text-fg-muted hover:bg-muted hover:text-fg" title={p.status === "PUBLISHED" ? "View" : "Preview"}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenu(menu === p.id ? null : p.id)}
                  className="grid h-9 w-9 place-items-center rounded-full text-fg-muted hover:bg-muted hover:text-fg"
                  aria-label="Post actions"
                  aria-expanded={menu === p.id}
                >
                  {busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                </button>
                {menu === p.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} />
                    <div className="animate-fade-up absolute right-0 z-20 mt-1 w-48 rounded-xl border border-line bg-elevated p-1 shadow-xl shadow-black/10">
                      <Link href={`/dashboard/posts/${p.id}/edit`} className={menuItem}>
                        <PenLine className="h-4 w-4" /> Edit
                      </Link>
                      <Link href={`/blog/${p.slug}`} className={menuItem}>
                        <Eye className="h-4 w-4" /> {p.status === "PUBLISHED" ? "View" : "Preview"}
                      </Link>
                      {p.status === "PUBLISHED" ? (
                        <button type="button" className={menuItem} onClick={() => setStatus(p, "DRAFT")}>
                          <EyeOff className="h-4 w-4" /> Unpublish
                        </button>
                      ) : (
                        <button type="button" className={menuItem} onClick={() => setStatus(p, "PUBLISHED")}>
                          <Send className="h-4 w-4" /> Publish
                        </button>
                      )}
                      <button type="button" className={`${menuItem} text-danger hover:bg-danger-soft`} onClick={() => remove(p)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
