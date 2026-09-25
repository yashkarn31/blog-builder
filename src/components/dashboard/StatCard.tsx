import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon: LucideIcon; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-elevated p-5">
      <div className="flex items-center justify-between text-fg-subtle">
        <span className="text-sm font-medium">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}
