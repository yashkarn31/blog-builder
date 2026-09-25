"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "@/lib/client-api";
import { button, card, input } from "@/components/ui/styles";

type Item = { id: string; name: string; slug: string; count: number };

export function TaxonomyManager({ kind, items }: { kind: "categories" | "tags"; items: Item[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const singular = kind === "categories" ? "category" : "tag";

  async function run(key: string, action: () => Promise<unknown>) {
    setBusy(key);
    setError("");
    try {
      await action();
      router.refresh();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (await run("new", () => api(`/api/${kind}`, { method: "POST", json: { name } }))) setName("");
  }

  async function rename(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const { id, name: newName } = editing;
    if (await run(id, () => api(`/api/${kind}/${id}`, { method: "PATCH", json: { name: newName } }))) setEditing(null);
  }

  function remove(item: Item) {
    const note = item.count
      ? kind === "categories"
        ? ` ${item.count} post(s) will become uncategorised.`
        : ` It will be removed from ${item.count} post(s).`
      : "";
    if (confirm(`Delete ${singular} “${item.name}”?${note}`)) run(item.id, () => api(`/api/${kind}/${item.id}`, { method: "DELETE" }));
  }

  return (
    <section className={card}>
      <div className="border-b border-line p-5">
        <h2 className="font-semibold capitalize">{kind}</h2>
        <form onSubmit={create} className="mt-3 flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`New ${singular} name`} className={input} maxLength={40} />
          <button type="submit" disabled={!name.trim() || busy === "new"} className={button("primary", "md", "h-[42px] shrink-0")}>
            {busy === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>
      <ul className="max-h-[480px] divide-y divide-line overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-5 py-2.5">
            {editing?.id === item.id ? (
              <form onSubmit={rename} className="flex flex-1 items-center gap-2">
                <input autoFocus value={editing.name} onChange={(e) => setEditing({ id: item.id, name: e.target.value })} className={`${input} h-9 py-0`} maxLength={40} />
                <button type="submit" className="rounded-full p-2 text-success hover:bg-success-soft" aria-label="Save">
                  {busy === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="rounded-full p-2 text-fg-muted hover:bg-muted" aria-label="Cancel">
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{kind === "tags" ? `#${item.name}` : item.name}</p>
                  <p className="text-xs text-fg-subtle">{item.count} post{item.count === 1 ? "" : "s"}</p>
                </div>
                <button type="button" onClick={() => setEditing({ id: item.id, name: item.name })} className="rounded-full p-2 text-fg-muted hover:bg-muted hover:text-fg" aria-label={`Rename ${item.name}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => remove(item)} className="rounded-full p-2 text-fg-muted hover:bg-danger-soft hover:text-danger" aria-label={`Delete ${item.name}`}>
                  {busy === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="px-5 py-8 text-center text-sm text-fg-muted">No {kind} yet.</li>}
      </ul>
    </section>
  );
}
