import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getUsersWithCounts } from "@/lib/stats";
import { EmployeesManager } from "@/components/admin/EmployeesManager";

export const metadata: Metadata = { title: "Employees · Admin" };

export default async function EmployeesPage() {
  const admin = await requireAdmin();
  const users = await getUsersWithCounts();
  return (
    <EmployeesManager
      currentUserId={admin.id}
      users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
    />
  );
}
