"use client";

import { useEffect } from "react";

// Guards against duplicate beacons (e.g. React StrictMode running effects twice).
const sent = new Set<string>();

/** Records a view after the article actually renders; the API de-dupes per browser. */
export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    if (sent.has(postId)) return;
    sent.add(postId);
    fetch(`/api/posts/${postId}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [postId]);
  return null;
}
