import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  // Checked against the DB (not just the JWT) so a deactivated account can't loop between here and /dashboard.
  if (await getCurrentUser()) redirect("/dashboard");
  if (process.env.ALLOW_SIGNUP === "false") {
    return (
      <AuthShell title="Invite only" subtitle="Accounts are created by an administrator.">
        <p className="text-sm text-fg-muted">
          Ask your admin for an account, then <Link href="/login" className="font-medium text-accent hover:underline">log in</Link>.
        </p>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Join the team blog" subtitle="Create an employee account to start publishing.">
      <Suspense>
        <AuthForm mode="signup" showDemo={false} />
      </Suspense>
    </AuthShell>
  );
}
