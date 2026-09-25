"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { uploadImage } from "@/lib/client-api";

export function CoverUpload({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  async function handle(file: File | undefined) {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const picker = (
    <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handle(e.target.files?.[0])} />
  );

  if (value) {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-line bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- preview of a just-uploaded image */}
        <img src={value} alt="Cover" className="aspect-[2/1] w-full object-cover" />
        <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-black hover:bg-white">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Replace
          </button>
          <button type="button" onClick={() => onChange(null)} className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-white">
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
        {picker}
        {error && <p className="absolute left-3 top-3 rounded-lg bg-danger px-2 py-1 text-xs text-white">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        className={`flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 text-sm transition ${
          dragging ? "border-accent bg-accent-soft text-accent" : "border-line text-fg-muted hover:border-fg-subtle hover:text-fg"
        }`}
      >
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
        {uploading ? "Uploading & optimising…" : "Add a cover image — drop a file or click to browse"}
      </button>
      {picker}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
