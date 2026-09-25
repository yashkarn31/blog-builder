"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutGrid, Tags, Users } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/posts", label: "All posts", icon: FileText },
  { href: "/admin/taxonomy", label: "Categories & tags", icon: Tags },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition ${
              active ? "border-accent text-fg" : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
