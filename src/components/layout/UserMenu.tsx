"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, PenSquare, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

type Props = { user: { name: string; email: string; role: "ADMIN" | "EMPLOYEE" } };

export function UserMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const item = "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg-muted hover:bg-muted hover:text-fg";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full p-0.5 pr-2 transition hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={user.name} size={32} />
        <ChevronDown className="h-4 w-4 text-fg-subtle" />
      </button>
      {open && (
        <div
          role="menu"
          className="animate-fade-up absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-line bg-elevated p-1.5 shadow-xl shadow-black/5"
          onClick={() => setOpen(false)}
        >
          <div className="px-3 pb-2 pt-1.5">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-fg-subtle">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link href="/dashboard" className={item} role="menuitem">
            <LayoutDashboard className="h-4 w-4" /> My posts
          </Link>
          <Link href="/dashboard/posts/new" className={item} role="menuitem">
            <PenSquare className="h-4 w-4" /> Write a post
          </Link>
          {user.role === "ADMIN" && (
            <Link href="/admin" className={item} role="menuitem">
              <ShieldCheck className="h-4 w-4" /> Admin dashboard
            </Link>
          )}
          <div className="my-1 h-px bg-line" />
          <button type="button" onClick={logout} className={`${item} w-full`} role="menuitem">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
