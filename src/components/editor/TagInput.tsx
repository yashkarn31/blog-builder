"use client";

import { useState } from "react";
import { X } from "lucide-react";

const MAX_TAGS = 10;

export function TagInput({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);

  const has = (t: string) => value.some((v) => v.toLowerCase() === t.toLowerCase());
  const add = (raw: string) => {
    const tag = raw.trim().replace(/^#/, "").slice(0, 40);
    if (tag && !has(tag) && value.length < MAX_TAGS) onChange([...value, tag]);
    setDraft("");
  };

  const matches = suggestions
    .filter((s) => !has(s) && s.toLowerCase().includes(draft.trim().toLowerCase()))
    .slice(0, 6);

  return (
    <div className="relative">
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-line bg-elevated px-2 py-1.5 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-0.5 pl-2.5 pr-1 text-sm text-accent">
            {t}
            <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} className="rounded-full p-0.5 hover:bg-accent/15" aria-label={`Remove ${t}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (draft.trim()) add(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder={value.length >= MAX_TAGS ? "Tag limit reached" : value.length ? "Add another…" : "e.g. analytics, nextjs"}
          disabled={value.length >= MAX_TAGS}
          className="min-w-24 flex-1 bg-transparent px-1 py-1 text-sm placeholder:text-fg-subtle focus:outline-none"
          aria-label="Add tag"
        />
      </div>
      {focused && matches.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-line bg-elevated py-1 shadow-lg">
          {matches.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(s);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-fg-muted hover:bg-muted hover:text-fg"
              >
                #{s}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1.5 text-xs text-fg-subtle">Press Enter or comma to add. Up to {MAX_TAGS}.</p>
    </div>
  );
}
