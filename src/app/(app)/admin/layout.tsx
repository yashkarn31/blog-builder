import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div>
      <div className="mb-6">
        <p className="flex items-center gap-1.5 text-sm font-medium text-accent">
          <ShieldCheck className="h-4 w-4" /> Admin
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Control room</h1>
      </div>
      <AdminNav />
      <div className="pt-8">{children}</div>
    </div>
  );
}
