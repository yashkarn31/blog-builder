// Tiny fixed-window in-memory limiter. Good enough for a single Node process;
// a multi-instance deployment would back this with Redis.
const buckets = new Map<string, { count: number; resetAt: number }>();

// Keys can come from client-influenced values (IPs), so cap the map's size.
const MAX_BUCKETS = 10_000;

function prune(now: number) {
  for (const [key, bucket] of buckets) if (bucket.resetAt < now) buckets.delete(key);
  // Still full of live buckets: drop the oldest rather than grow without bound.
  for (const key of buckets.keys()) {
    if (buckets.size < MAX_BUCKETS) break;
    buckets.delete(key);
  }
}

/** Counts a hit against `key`; returns false once `limit` is exceeded in the window. */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    if (buckets.size >= MAX_BUCKETS) prune(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count++;
  return bucket.count <= limit;
}

/** True when `key` has already used up `limit` hits in its current window (doesn't count a hit). */
export function isRateLimited(key: string, limit: number) {
  const bucket = buckets.get(key);
  return !!bucket && bucket.resetAt >= Date.now() && bucket.count >= limit;
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

/**
 * Best-effort client IP for rate-limit keys.
 *
 * X-Forwarded-For is client-controlled unless a trusted proxy rewrites it, and
 * `next start` only fills it in when the client didn't send one. So:
 * - TRUSTED_PROXY_HOPS=0 (default, app exposed directly): the value can be
 *   forged, so treat IP limits as a soft layer. Limits that matter (login per
 *   account, global signup ceiling) don't depend on it.
 * - TRUSTED_PROXY_HOPS=N (behind N proxies that append to the header, e.g.
 *   nginx or Vercel = 1): use the Nth entry from the right, which was written
 *   by our own proxy and can't be spoofed by the client.
 */
export function clientIp(headers: Headers) {
  const hops = Math.max(0, Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "0", 10) || 0);
  const chain = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ip = hops > 0 ? chain[chain.length - hops] : chain[chain.length - 1];
  // Cap length so a forged header can't create huge map keys.
  return (ip ?? "unknown").slice(0, 64);
}
