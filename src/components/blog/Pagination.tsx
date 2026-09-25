import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pages,
  params,
}: {
  page: number;
  pages: number;
  params: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;

  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") q.set(k, v);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/?${s}` : "/";
  };

  const cell = "grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-medium transition";
  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${cell} text-fg-muted hover:bg-muted`} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={`${cell} text-fg-subtle/50`}><ChevronLeft className="h-4 w-4" /></span>
      )}
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={`${cell} ${p === page ? "bg-fg text-bg" : "text-fg-muted hover:bg-muted"}`}
        >
          {p}
        </Link>
      ))}
      {page < pages ? (
        <Link href={href(page + 1)} className={`${cell} text-fg-muted hover:bg-muted`} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={`${cell} text-fg-subtle/50`}><ChevronRight className="h-4 w-4" /></span>
      )}
    </nav>
  );
}
