"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

/** Debounced search that keeps the query in the URL (shareable, back-button friendly). */
export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [pending, startTransition] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      next.delete("page");
      startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [value]);

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search articles, topics or authors…"
        aria-label="Search articles"
        className="h-12 w-full rounded-full border border-line bg-elevated pl-11 pr-11 text-[15px] text-fg shadow-sm placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-fg-subtle">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          value && (
            <button type="button" onClick={() => setValue("")} aria-label="Clear search" className="hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          )
        )}
      </span>
    </div>
  );
}
