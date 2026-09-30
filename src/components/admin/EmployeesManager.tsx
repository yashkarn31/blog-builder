"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, KeyRound, Loader2, MoreHorizontal, Power, Shield, Trash2, UserPlus, X } from "lucide-react";
import { api } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { button, card, input, label } from "@/components/ui/styles";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  active: boolean;
  approved: boolean;
  createdAt: string;
  published: number;
  drafts: number;
  views: number;
};

export function EmployeesManager({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(id: string, action: () => Promise<unknown>) {
    setMenu(null);
    setBusy(id);
    try {
      await action();
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const patch = (u: UserRow, json: Record<string, unknown>) =>
    run(u.id, () => api(`/api/admin/users/${u.id}`, { method: "PATCH", json }));

  const resetPassword = (u: UserRow) => {
    const password = prompt(`New password for ${u.name} (min 8 chars, include a number):`);
    if (password) patch(u, { password });
  };

  const reject = (u: UserRow) => {
    if (confirm(`Reject ${u.name}'s sign-up? Their pending account will be deleted.`)) {
      run(u.id, () => api(`/api/admin/users/${u.id}`, { method: "DELETE" }));
    }
  };

  const pending = users.filter((u) => !u.approved).length;

  const remove = (u: UserRow) => {
    const posts = u.published + u.drafts;
    const msg = `Permanently delete ${u.name}?${posts ? ` Their ${posts} post(s), likes and comments will be deleted too.` : ""}\n\nTip: deactivating keeps their posts but blocks login.`;
    if (confirm(msg)) run(u.id, () => api(`/api/admin/users/${u.id}`, { method: "DELETE" }));
  };

  const menuItem = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-fg-muted">
          {users.length} accounts
          {pending > 0 && <span className="ml-2 font-medium text-warning">· {pending} awaiting approval</span>}
        </p>
        <button type="button" onClick={() => setShowForm((s) => !s)} className={button(showForm ? "secondary" : "primary", "md")}>
          {showForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />} {showForm ? "Cancel" : "Add employee"}
        </button>
      </div>

      {showForm && (
        <AddEmployeeForm
          onDone={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-fg-subtle">
              <th className="px-5 py-3 font-medium">Person</th>
              <th className="px-3 py-3 font-medium">Role</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 text-right font-medium">Published</th>
              <th className="px-3 py-3 text-right font-medium">Drafts</th>
              <th className="px-3 py-3 text-right font-medium">Views</th>
              <th className="px-3 py-3 font-medium">Joined</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id} className={u.active ? "" : "opacity-60"}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size={36} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {u.name} {u.id === currentUserId && <span className="text-xs text-fg-subtle">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-fg-subtle">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.role === "ADMIN" ? "bg-accent-soft text-accent" : "bg-muted text-fg-muted"}`}>
                    {u.role === "ADMIN" ? "Admin" : "Employee"}
                  </span>
                </td>
                <td className="px-3">
                  <span className={`text-xs font-medium ${u.active ? "text-success" : "text-fg-subtle"}`}>
                    {!u.approved ? (
                      <span className="text-warning">◐ Pending approval</span>
                    ) : u.active ? (
                      "● Active"
                    ) : (
                      "○ Deactivated"
                    )}
                  </span>
                </td>
                <td className="px-3 text-right tabular-nums">{u.published}</td>
                <td className="px-3 text-right tabular-nums text-fg-muted">{u.drafts}</td>
                <td className="px-3 text-right tabular-nums text-fg-muted">{u.views}</td>
                <td className="px-3 text-fg-muted">{formatDate(u.createdAt)}</td>
                <td className="relative px-3 text-right">
                  {!u.approved ? (
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => patch(u, { approved: true })} disabled={busy === u.id} className={button("primary", "sm")}>
                        {busy === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
                      </button>
                      <button type="button" onClick={() => reject(u)} disabled={busy === u.id} className={button("secondary", "sm")}>
                        Reject
                      </button>
                    </div>
                  ) : u.id !== currentUserId && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMenu(menu === u.id ? null : u.id)}
                        className="grid h-8 w-8 place-items-center rounded-full text-fg-muted hover:bg-muted hover:text-fg"
                        aria-label={`Actions for ${u.name}`}
                      >
                        {busy === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                      </button>
                      {menu === u.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} />
                          <div className="animate-fade-up absolute right-3 z-20 mt-1 w-52 rounded-xl border border-line bg-elevated p-1 text-left shadow-xl shadow-black/10">
                            <button type="button" className={menuItem} onClick={() => patch(u, { active: !u.active })}>
                              <Power className="h-4 w-4" /> {u.active ? "Deactivate" : "Reactivate"}
                            </button>
                            <button type="button" className={menuItem} onClick={() => patch(u, { role: u.role === "ADMIN" ? "EMPLOYEE" : "ADMIN" })}>
                              <Shield className="h-4 w-4" /> {u.role === "ADMIN" ? "Make employee" : "Make admin"}
                            </button>
                            <button type="button" className={menuItem} onClick={() => resetPassword(u)}>
                              <KeyRound className="h-4 w-4" /> Reset password
                            </button>
                            <button type="button" className={`${menuItem} text-danger hover:bg-danger-soft`} onClick={() => remove(u)}>
                              <Trash2 className="h-4 w-4" /> Delete account
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddEmployeeForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/api/admin/users", { method: "POST", json: form });
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={submit} className={`${card} animate-fade-up grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_160px_auto] lg:items-end`}>
      <div>
        <label className={label} htmlFor="new-name">Name</label>
        <input id="new-name" required value={form.name} onChange={set("name")} className={input} placeholder="Full name" />
      </div>
      <div>
        <label className={label} htmlFor="new-email">Email</label>
        <input id="new-email" type="email" required value={form.email} onChange={set("email")} className={input} placeholder="name@analyticsliv.com" />
      </div>
      <div>
        <label className={label} htmlFor="new-password">Temporary password</label>
        <input id="new-password" type="text" required value={form.password} onChange={set("password")} className={input} placeholder="Min 8 chars + a number" />
      </div>
      <div>
        <label className={label} htmlFor="new-role">Role</label>
        <select id="new-role" value={form.role} onChange={set("role")} className={input}>
          <option value="EMPLOYEE">Employee</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <button type="submit" disabled={saving} className={button("primary", "md", "h-[42px]")}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create
      </button>
      {error && <p className="text-sm text-danger sm:col-span-2 lg:col-span-5">{error}</p>}
    </form>
  );
}
