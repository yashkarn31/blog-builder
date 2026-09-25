"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { button } from "@/components/ui/styles";
import { api } from "@/lib/client-api";
import { formatRelative } from "@/lib/format";

type Comment = { id: string; body: string; createdAt: string; author: { id: string; name: string } };

type Props = {
  postId: string;
  postAuthorId: string;
  initial: Comment[];
  viewer: { id: string; name: string; role: "ADMIN" | "EMPLOYEE" } | null;
};

export function Comments({ postId, postAuthorId, initial, viewer }: Props) {
  const [comments, setComments] = useState(initial);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError("");
    try {
      const { comment } = await api<{ comment: Comment }>(`/api/posts/${postId}/comments`, {
        method: "POST",
        json: { body },
      });
      setComments((c) => [...c, comment]);
      setBody("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this comment?")) return;
    try {
      await api(`/api/comments/${id}`, { method: "DELETE" });
      setComments((c) => c.filter((x) => x.id !== id));
    } catch (err) {
      alert((err as Error).message);
    }
  }

  const canDelete = (c: Comment) =>
    !!viewer && (viewer.role === "ADMIN" || viewer.id === c.author.id || viewer.id === postAuthorId);

  return (
    <section id="comments" className="scroll-mt-24">
      <h2 className="text-xl font-bold tracking-tight">
        Responses <span className="font-normal text-fg-subtle">({comments.length})</span>
      </h2>

      {viewer ? (
        <form onSubmit={submit} className="mt-5 rounded-2xl border border-line bg-elevated p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Avatar name={viewer.name} size={28} /> {viewer.name}
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What are your thoughts?"
            rows={3}
            maxLength={2000}
            className="w-full resize-y bg-transparent text-[15px] leading-relaxed placeholder:text-fg-subtle focus:outline-none"
          />
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          <div className="mt-2 flex justify-end">
            <button type="submit" disabled={sending || !body.trim()} className={button("primary", "sm")}>
              {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Respond
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-line p-5 text-center text-sm text-fg-muted">
          <Link href="/login" className="font-medium text-accent hover:underline">Log in</Link> to join the conversation.
        </p>
      )}

      <ul className="mt-6 divide-y divide-line">
        {comments.map((c) => (
          <li key={c.id} className="group py-5">
            <div className="flex items-center gap-2.5">
              <Avatar name={c.author.name} size={32} />
              <div className="text-sm leading-tight">
                <p className="font-medium">
                  {c.author.name}
                  {c.author.id === postAuthorId && (
                    <span className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent">Author</span>
                  )}
                </p>
                <p className="text-xs text-fg-subtle">{formatRelative(c.createdAt)}</p>
              </div>
              {canDelete(c) && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="ml-auto rounded-full p-2 text-fg-subtle opacity-0 transition hover:bg-danger-soft hover:text-danger focus:opacity-100 group-hover:opacity-100"
                  aria-label="Delete comment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-fg">{c.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
