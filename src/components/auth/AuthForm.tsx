"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { button, input, label } from "@/components/ui/styles";

type Mode = "login" | "signup";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@analyticsliv.com", password: "Admin@123" },
  { label: "Employee", email: "aarav@analyticsliv.com", password: "Writer@123" },
];

/** Only allow same-site relative redirects after login. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export function AuthForm({ mode, showDemo }: { mode: Mode; showDemo: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = mode === "login" ? { email: form.email, password: form.password } : form;
      const { user } = await api<{ user: { role: string } }>(`/api/auth/${mode}`, { method: "POST", json: body });
      const fallback = user.role === "ADMIN" ? "/admin" : "/dashboard";
      router.replace(safeNext(params.get("next")) ?? fallback);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className={label}>Full name</label>
            <input id="name" autoComplete="name" required value={form.name} onChange={set("name")} className={input} placeholder="Ada Lovelace" />
          </div>
        )}
        <div>
          <label htmlFor="email" className={label}>Work email</label>
          <input id="email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} className={input} placeholder="you@analyticsliv.com" />
        </div>
        <div>
          <label htmlFor="password" className={label}>Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              value={form.password}
              onChange={set("password")}
              className={`${input} pr-11`}
              placeholder={mode === "signup" ? "At least 8 characters, with a number" : "••••••••"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>
        )}

        <button type="submit" disabled={loading} className={button("primary", "md", "w-full h-11")}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-fg-muted">
        {mode === "login" ? (
          <>New here? <Link href="/signup" className="font-medium text-accent hover:underline">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="font-medium text-accent hover:underline">Log in</Link></>
        )}
      </p>

      {mode === "login" && showDemo && (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Demo accounts</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setForm((f) => ({ ...f, email: d.email, password: d.password }))}
                className="rounded-xl bg-muted px-3 py-2 text-left text-sm transition hover:bg-accent-soft"
              >
                <span className="block font-medium">{d.label}</span>
                <span className="block truncate text-xs text-fg-subtle">{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
