"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Heart, Link2, MessageCircle } from "lucide-react";
import { api } from "@/lib/client-api";

type Props = {
  postId: string;
  initialLiked: boolean;
  initialLikes: number;
  comments: number;
  loggedIn: boolean;
};

export function ArticleActions({ postId, initialLiked, initialLikes, comments, loggedIn }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleLike() {
    if (busy) return;
    setBusy(true);
    // Optimistic update, reconciled with the server's count.
    setLiked(!liked);
    setLikes((n) => n + (liked ? -1 : 1));
    try {
      const res = await api<{ liked: boolean; count: number }>(`/api/posts/${postId}/like`, { method: "POST" });
      setLiked(res.liked);
      setLikes(res.count);
    } catch {
      setLiked(liked);
      setLikes(initialLikes);
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const pill = "inline-flex h-10 items-center gap-2 rounded-full border border-line bg-elevated px-4 text-sm font-medium transition hover:bg-muted";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {loggedIn ? (
        <button type="button" onClick={toggleLike} className={`${pill} ${liked ? "border-rose-300 text-rose-600 dark:border-rose-900 dark:text-rose-400" : "text-fg-muted"}`} aria-pressed={liked}>
          <Heart className={`h-4 w-4 transition ${liked ? "scale-110 fill-current" : ""}`} />
          {likes} {likes === 1 ? "like" : "likes"}
        </button>
      ) : (
        <Link href="/login" className={`${pill} text-fg-muted`} title="Log in to like">
          <Heart className="h-4 w-4" /> {likes} {likes === 1 ? "like" : "likes"}
        </Link>
      )}
      <a href="#comments" className={`${pill} text-fg-muted`}>
        <MessageCircle className="h-4 w-4" /> {comments}
      </a>
      <button type="button" onClick={copyLink} className={`${pill} text-fg-muted`}>
        {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
        {copied ? "Copied" : "Share"}
      </button>
    </div>
  );
}
