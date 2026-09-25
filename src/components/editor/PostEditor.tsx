"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { AlertCircle, ArrowLeft, Check, Cloud, ExternalLink, EyeOff, Loader2, Send } from "lucide-react";
import { api, uploadImage } from "@/lib/client-api";
import { slugify } from "@/lib/slug";
import { button, input, label } from "@/components/ui/styles";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CoverUpload } from "./CoverUpload";
import { TagInput } from "./TagInput";
import { Toolbar } from "./Toolbar";

const lowlight = createLowlight(common);
const AUTOSAVE_DELAY = 2000;

type Status = "DRAFT" | "PUBLISHED";

export type EditorPost = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  categoryId: string | null;
  tags: string[];
  status: Status;
  authorName?: string;
};

type Props = {
  initial: EditorPost;
  categories: { id: string; name: string }[];
  tagSuggestions: string[];
  editingAsAdmin?: boolean;
};

type SaveState = { kind: "idle" | "saving" | "saved" | "error"; at?: Date; message?: string };

export function PostEditor({ initial, categories, tagSuggestions, editingAsAdmin }: Props) {
  const router = useRouter();
  const [postId, setPostId] = useState(initial.id);
  const [status, setStatus] = useState<Status>(initial.status);
  const [title, setTitle] = useState(initial.title);
  const [savedSlug, setSavedSlug] = useState(initial.slug);
  const [slugInput, setSlugInput] = useState(initial.slug);
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [coverImage, setCoverImage] = useState(initial.coverImage);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [tags, setTags] = useState(initial.tags);
  const [contentVersion, setContentVersion] = useState(0);
  const [words, setWords] = useState(0);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [publishing, setPublishing] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);

  // Everything the author can change, as one comparable value. The slug only
  // counts once it's been edited by hand (otherwise the server owns it).
  const signature = JSON.stringify([title, excerpt, coverImage, categoryId, tags, slugManual ? slugInput : "", contentVersion]);
  const [savedSignature, setSavedSignature] = useState(signature);
  const dirty = signature !== savedSignature;

  const idRef = useRef(initial.id);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const insertImageRef = useRef<(file: File) => void>(() => {});
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      Placeholder.configure({ placeholder: "Tell your story…" }),
    ],
    content: initial.content,
    editorProps: {
      attributes: { class: "article prose prose-lg max-w-none dark:prose-invert focus:outline-none" },
      handleDrop: (_view, event, _slice, moved) => {
        const file = event.dataTransfer?.files?.[0];
        if (moved || !file?.type.startsWith("image/")) return false;
        event.preventDefault();
        insertImageRef.current(file);
        return true;
      },
      handlePaste: (_view, event) => {
        const file = event.clipboardData?.files?.[0];
        if (!file?.type.startsWith("image/")) return false;
        insertImageRef.current(file);
        return true;
      },
    },
    onCreate: ({ editor: e }) => setWords(countWords(e.getText())),
    onUpdate: ({ editor: e }) => {
      setWords(countWords(e.getText()));
      setContentVersion((v) => v + 1);
    },
  });

  useEffect(() => {
    insertImageRef.current = async (file: File) => {
      if (!editor) return;
      setUploadingInline(true);
      try {
        const { url } = await uploadImage(file);
        editor.chain().focus().setImage({ src: url, alt: file.name.replace(/\.[^.]+$/, "") }).run();
      } catch (err) {
        alert((err as Error).message);
      } finally {
        setUploadingInline(false);
      }
    };
  }, [editor]);

  // Auto-grow the title field.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  function payload(nextStatus?: Status) {
    return {
      title: title.trim(),
      content: editor?.getHTML() ?? "",
      excerpt: excerpt.trim(),
      coverImage,
      categoryId,
      tags,
      ...(slugManual && slugInput.trim() ? { slug: slugInput.trim() } : {}),
      ...(nextStatus ? { status: nextStatus } : {}),
    };
  }

  /** Saves are serialised so an autosave can never race a manual publish. */
  function persist(nextStatus?: Status) {
    const snapshot = signature;
    const run = async () => {
      setSave({ kind: "saving" });
      try {
        const body = payload(nextStatus);
        const { post } = idRef.current
          ? await api<{ post: { id: string; slug: string; status: Status } }>(`/api/posts/${idRef.current}`, { method: "PATCH", json: body })
          : await api<{ post: { id: string; slug: string; status: Status } }>("/api/posts", { method: "POST", json: body });

        if (!idRef.current) {
          idRef.current = post.id;
          setPostId(post.id);
          window.history.replaceState(null, "", `/dashboard/posts/${post.id}/edit`);
        }
        setStatus(post.status);
        setSavedSlug(post.slug);
        if (!slugManual) setSlugInput(post.slug);
        setSavedSignature(snapshot);
        setSave({ kind: "saved", at: new Date() });
        return post;
      } catch (err) {
        setSave({ kind: "error", message: (err as Error).message });
        throw err;
      }
    };
    const next = queue.current.then(run, run);
    queue.current = next.catch(() => {});
    return next;
  }

  // Draft auto-save: debounce edits; published posts only change on explicit "Update".
  const autosave = useEffectEvent(() => {
    const empty = !title.trim() && !(editor?.getText().trim());
    if (!dirty || status === "PUBLISHED" || (empty && !idRef.current)) return;
    persist().catch(() => {});
  });
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(autosave, AUTOSAVE_DELAY);
    return () => clearTimeout(t);
  }, [dirty, signature]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const onShortcut = useEffectEvent((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      persist().catch(() => {});
    }
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onShortcut(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  async function changeStatus(next: Status) {
    setPublishing(true);
    try {
      const post = await persist(next);
      if (next === "PUBLISHED") {
        router.push(`/blog/${post.slug}`);
        router.refresh();
      }
    } catch {
      /* surfaced via save state */
    } finally {
      setPublishing(false);
    }
  }

  const previewSlug = slugManual ? slugify(slugInput) : status === "PUBLISHED" || !title ? savedSlug : slugify(title);

  return (
    <div className="-mt-4">
      {/* Top action bar */}
      <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={editingAsAdmin ? "/admin/posts" : "/dashboard"} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-fg-muted hover:bg-muted hover:text-fg" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <StatusBadge status={status} />
            <SaveIndicator save={save} dirty={dirty} status={status} />
          </div>
          <div className="flex items-center gap-2">
            {postId && (
              <Link href={`/blog/${savedSlug}`} target="_blank" className={button("ghost", "sm", "max-sm:hidden")}>
                <ExternalLink className="h-3.5 w-3.5" /> {status === "PUBLISHED" ? "View" : "Preview"}
              </Link>
            )}
            {status === "PUBLISHED" ? (
              <>
                <button type="button" onClick={() => changeStatus("DRAFT")} disabled={publishing} className={button("secondary", "sm")}>
                  <EyeOff className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Unpublish</span>
                </button>
                <button type="button" onClick={() => persist().catch(() => {})} disabled={!dirty || save.kind === "saving"} className={button("primary", "sm")}>
                  Update
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => persist().catch(() => {})} disabled={save.kind === "saving"} className={button("secondary", "sm")}>
                  Save draft
                </button>
                <button type="button" onClick={() => changeStatus("PUBLISHED")} disabled={publishing} className={button("primary", "sm")}>
                  {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Publish
                </button>
              </>
            )}
          </div>
        </div>
        {save.kind === "error" && (
          <p role="alert" className="mt-2 flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" /> {save.message}
          </p>
        )}
      </div>

      {editingAsAdmin && initial.authorName && (
        <p className="mb-6 rounded-xl bg-accent-soft px-4 py-2.5 text-sm text-accent">
          You&apos;re editing <strong>{initial.authorName}</strong>&apos;s post with admin privileges.
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Writing surface */}
        <div className="min-w-0">
          <CoverUpload value={coverImage} onChange={setCoverImage} />
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                editor?.commands.focus("start");
              }
            }}
            placeholder="Post title"
            rows={1}
            maxLength={160}
            className="mt-8 w-full resize-none overflow-hidden bg-transparent font-serif text-4xl font-semibold leading-tight tracking-tight placeholder:text-fg-subtle/60 focus:outline-none sm:text-5xl"
            aria-label="Post title"
          />
          <div className="sticky top-[8.5rem] z-20 mt-6 rounded-xl border border-line bg-elevated/95 shadow-sm backdrop-blur">
            {editor && <Toolbar editor={editor} onImage={(f) => insertImageRef.current(f)} uploading={uploadingInline} />}
          </div>
          <div className="mt-6 min-h-[420px]">
            {editor ? <EditorContent editor={editor} /> : <div className="h-[420px] animate-pulse rounded-xl bg-muted" />}
          </div>
          <p className="mt-6 text-xs text-fg-subtle">
            {words} words · ~{Math.max(1, Math.ceil(words / 220))} min read · Drop or paste images straight into the text.
          </p>
        </div>

        {/* Post settings */}
        <aside className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <div>
            <label htmlFor="category" className={label}>Category</label>
            <select id="category" value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value || null)} className={input}>
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <span className={label}>Tags</span>
            <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} />
          </div>

          <div>
            <label htmlFor="excerpt" className={label}>
              Excerpt <span className="font-normal text-fg-subtle">(optional)</span>
            </label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Shown on cards and in search results. Generated from your post if left empty."
              className={`${input} resize-none`}
            />
            <p className="mt-1 text-right text-xs text-fg-subtle">{excerpt.length}/300</p>
          </div>

          <div>
            <label htmlFor="slug" className={label}>URL slug</label>
            <input
              id="slug"
              value={slugManual ? slugInput : previewSlug}
              onChange={(e) => {
                setSlugManual(true);
                setSlugInput(e.target.value);
              }}
              onBlur={() => slugManual && setSlugInput(slugify(slugInput))}
              placeholder="auto-generated-from-title"
              className={`${input} font-mono text-xs`}
            />
            <p className="mt-1.5 break-all text-xs text-fg-subtle">
              /blog/<span className="text-fg-muted">{previewSlug || "…"}</span>
              {slugManual && (
                <button type="button" className="ml-2 text-accent hover:underline" onClick={() => { setSlugManual(false); setSlugInput(savedSlug); }}>
                  reset
                </button>
              )}
            </p>
          </div>

          <div className="rounded-xl bg-muted p-4 text-xs leading-relaxed text-fg-muted">
            <p className="font-semibold text-fg">Tips</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4">
              <li>Drafts save automatically every few seconds.</li>
              <li>Press ⌘/Ctrl + S to save at any time.</li>
              <li>Use headings to give long posts structure.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function SaveIndicator({ save, dirty, status }: { save: SaveState; dirty: boolean; status: Status }) {
  const cls = "hidden items-center gap-1.5 text-xs text-fg-subtle sm:flex";
  if (save.kind === "saving") return <span className={cls}><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>;
  if (save.kind === "error") return <span className={`${cls} text-danger`}><AlertCircle className="h-3.5 w-3.5" /> Not saved</span>;
  if (dirty) return <span className={cls}><Cloud className="h-3.5 w-3.5" /> {status === "PUBLISHED" ? "Unsaved changes" : "Editing…"}</span>;
  if (save.kind === "saved" && save.at)
    return <span className={cls}><Check className="h-3.5 w-3.5 text-success" /> Saved {save.at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>;
  return null;
}
