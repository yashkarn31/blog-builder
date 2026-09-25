import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  // Checked against the DB (not just the JWT) so a deactivated account can't loop between here and /dashboard.
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <AuthShell title="Welcome back" subtitle="Log in to write, edit and manage your posts.">
      <Suspense>
        <AuthForm mode="login" showDemo={process.env.SHOW_DEMO_ACCOUNTS !== "false"} />
      </Suspense>
    </AuthShell>
  );
}
