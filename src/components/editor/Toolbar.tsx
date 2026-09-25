"use client";

import { useRef } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold, Code, Code2, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered,
  Loader2, Minus, Quote, Redo2, Strikethrough, Underline, Undo2,
} from "lucide-react";

type Props = { editor: Editor; onImage: (file: File) => void; uploading: boolean };

export function Toolbar({ editor, onImage, uploading }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  function setLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (leave empty to remove)", previous ?? "https://");
    if (url === null) return;
    if (!url.trim() || url === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  const btn = (active: boolean) =>
    `grid h-8 w-8 shrink-0 place-items-center rounded-lg transition disabled:opacity-30 ${
      active ? "bg-fg text-bg" : "text-fg-muted hover:bg-muted hover:text-fg"
    }`;
  const sep = <span className="mx-1 h-5 w-px shrink-0 bg-line" />;
  const c = () => editor.chain().focus();

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto px-2 py-1.5" role="toolbar" aria-label="Formatting">
      <button type="button" title="Heading" className={btn(s.h2)} onClick={() => c().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></button>
      <button type="button" title="Subheading" className={btn(s.h3)} onClick={() => c().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></button>
      {sep}
      <button type="button" title="Bold (⌘B)" className={btn(s.bold)} onClick={() => c().toggleBold().run()}><Bold className="h-4 w-4" /></button>
      <button type="button" title="Italic (⌘I)" className={btn(s.italic)} onClick={() => c().toggleItalic().run()}><Italic className="h-4 w-4" /></button>
      <button type="button" title="Underline (⌘U)" className={btn(s.underline)} onClick={() => c().toggleUnderline().run()}><Underline className="h-4 w-4" /></button>
      <button type="button" title="Strikethrough" className={btn(s.strike)} onClick={() => c().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></button>
      <button type="button" title="Inline code" className={btn(s.code)} onClick={() => c().toggleCode().run()}><Code className="h-4 w-4" /></button>
      <button type="button" title="Link (⌘K)" className={btn(s.link)} onClick={setLink}><Link2 className="h-4 w-4" /></button>
      {sep}
      <button type="button" title="Bullet list" className={btn(s.bullet)} onClick={() => c().toggleBulletList().run()}><List className="h-4 w-4" /></button>
      <button type="button" title="Numbered list" className={btn(s.ordered)} onClick={() => c().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></button>
      <button type="button" title="Quote" className={btn(s.quote)} onClick={() => c().toggleBlockquote().run()}><Quote className="h-4 w-4" /></button>
      <button type="button" title="Code block" className={btn(s.codeBlock)} onClick={() => c().toggleCodeBlock().run()}><Code2 className="h-4 w-4" /></button>
      <button type="button" title="Divider" className={btn(false)} onClick={() => c().setHorizontalRule().run()}><Minus className="h-4 w-4" /></button>
      <button type="button" title="Insert image" className={btn(false)} onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImage(f);
          e.target.value = "";
        }}
      />
      {sep}
      <button type="button" title="Undo" className={btn(false)} disabled={!s.canUndo} onClick={() => c().undo().run()}><Undo2 className="h-4 w-4" /></button>
      <button type="button" title="Redo" className={btn(false)} disabled={!s.canRedo} onClick={() => c().redo().run()}><Redo2 className="h-4 w-4" /></button>
    </div>
  );
}
